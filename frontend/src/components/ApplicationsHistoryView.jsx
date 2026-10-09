import React, { useState, useEffect } from 'react';
import { 
  History, Search, Filter, Calendar, Building, MapPin, 
  ExternalLink, RotateCcw, Trash2, MessageSquare, Award,
  CheckCircle, Clock, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import JobDetailModal from './JobDetailModal';
import MonthlyActivityChart from './MonthlyActivityChart';

export default function ApplicationsHistoryView({ onRefreshOverview }) {
  const [historyApps, setHistoryApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getApplicationsHistory();
      setHistoryApps(data);
    } catch (e) {
      console.error('Error cargando historial de candidaturas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async (appId) => {
    try {
      await api.reopenApplication(appId, 'sent');
      alert('Oferta reabierta y devuelta al pipeline activo en estado Enviada.');
      fetchHistory();
      if (onRefreshOverview) onRefreshOverview();
    } catch (e) {
      alert('Error al reabrir la oferta');
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('¿Deseas eliminar permanentemente esta oferta del registro histórico?')) return;
    try {
      await api.deleteApplication(appId);
      fetchHistory();
      if (onRefreshOverview) onRefreshOverview();
    } catch (e) {
      alert('Error eliminando la oferta');
    }
  };

  // Filtrado
  const filteredApps = historyApps.filter((app) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      app.role?.toLowerCase().includes(q) ||
      app.company?.toLowerCase().includes(q) ||
      app.location_city?.toLowerCase().includes(q) ||
      app.portal?.toLowerCase().includes(q) ||
      app.keywords?.some(k => k.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'archived') return app.is_archived === true;
    return app.status === statusFilter;
  });

  const getStatusBadge = (status, isArchived) => {
    if (isArchived) return <span className="badge badge-slate">Archivada en Historial</span>;
    switch (status) {
      case 'pending_action':
        return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>1. Encontrada</span>;
      case 'sent':
        return <span className="badge badge-indigo">2. Enviada (15d)</span>;
      case 'in_progress':
        return <span className="badge badge-emerald">3. En Proceso</span>;
      case 'discarded':
        return <span className="badge badge-rose">4. Descartada</span>;
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. Gráfica Mensual de Actividad */}
      <MonthlyActivityChart />

      {/* 2. Sección del Historial */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {/* Encabezado y Buscador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} color="#10b981" />
              <span>Historial Completo de Ofertas y Actividad</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Registro histórico de todas las ofertas analizadas, en proceso, descartadas y archivadas
            </p>
          </div>

          {/* Barra de búsqueda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '260px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 10 }} />
              <input
                type="text"
                placeholder="Buscar por puesto, empresa o tecnología..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem 0.45rem 2rem',
                  color: '#fff',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Filtros por Estado */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} /> Filtrar:
          </span>
          {[
            { id: 'all', label: `Todas (${historyApps.length})` },
            { id: 'pending_action', label: '1. Encontradas' },
            { id: 'sent', label: '2. Enviadas' },
            { id: 'in_progress', label: '3. En Proceso' },
            { id: 'discarded', label: '4. Descartadas' },
            { id: 'archived', label: 'Archivadas (+30d)' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                background: statusFilter === f.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${statusFilter === f.id ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
                color: statusFilter === f.id ? '#fff' : '#94a3b8',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Tabla / Lista de Candidaturas Históricas */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Cargando historial de ofertas...
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
            No se han encontrado ofertas en el historial con los filtros aplicados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Puesto & Empresa</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Estado Actual</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Fechas Clave</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Detalle / Motivo</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Coletillas</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => {
                  const coletillasCount = app.coletillas ? app.coletillas.length : 0;
                  return (
                    <tr 
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Puesto & Empresa */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                          {app.role}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', marginTop: 3 }}>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{app.company}</span>
                          <span>•</span>
                          <span>{app.location_city || 'Remoto'}</span>
                          {app.salary_range && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#38bdf8' }}>{app.salary_range}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        {getStatusBadge(app.status, app.is_archived)}
                      </td>

                      {/* Fechas */}
                      <td style={{ padding: '0.85rem 0.5rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                        <div>Registro: {app.created_at || app.application_date}</div>
                        {app.sent_date && <div style={{ color: '#818cf8' }}>Enviada: {app.sent_date}</div>}
                        {app.in_progress_date && <div style={{ color: '#10b981' }}>En Proceso: {app.in_progress_date}</div>}
                        {app.discarded_date && <div style={{ color: '#fb7185' }}>Descartada: {app.discarded_date}</div>}
                      </td>

                      {/* Motivo / Detalle */}
                      <td style={{ padding: '0.85rem 0.5rem', color: '#cbd5e1', fontSize: '0.75rem', maxWidth: '220px' }}>
                        {app.status === 'in_progress' && app.in_progress_reason && (
                          <div style={{ color: '#34d399' }}>{app.in_progress_reason}</div>
                        )}
                        {app.status === 'discarded' && (
                          <div style={{ color: '#94a3b8' }}>
                            {app.discard_reason === 'timeout_15_days' ? '⏱️ Sin respuesta (15 días)' : (app.discard_reason || 'Descarte manual')}
                          </div>
                        )}
                        {app.status === 'pending_action' && (
                          <div style={{ color: '#38bdf8' }}>Pendiente de postulación</div>
                        )}
                      </td>

                      {/* Coletillas */}
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <span className="badge badge-slate" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <MessageSquare size={11} />
                          {coletillasCount} notas
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.45rem' }}
                              title="Ver oferta original"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}

                          {(app.status === 'discarded' || app.is_archived) && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: 4, color: '#34d399' }}
                              onClick={() => handleReopen(app.id)}
                              title="Reabrir oferta y devolverla a Enviada"
                            >
                              <RotateCcw size={12} />
                              <span style={{ fontSize: '0.7rem' }}>Reabrir</span>
                            </button>
                          )}

                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.25rem 0.45rem', color: '#fb7185' }}
                            onClick={() => handleDelete(app.id)}
                            title="Eliminar permanentemente del historial"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      {selectedApp && (
        <JobDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={() => {
            fetchHistory();
            if (onRefreshOverview) onRefreshOverview();
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}
