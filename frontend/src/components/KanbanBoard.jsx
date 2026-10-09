import React, { useState } from 'react';
import { 
  ExternalLink, Calendar, MessageSquare, RefreshCw, AlertCircle, 
  CheckCircle, Clock, MapPin, Building, Award, Plus, ChevronRight,
  TrendingUp, BarChart2
} from 'lucide-react';
import { api } from '../services/api';
import JobDetailModal from './JobDetailModal';
import MonthlyActivityChart from './MonthlyActivityChart';
import { detectPortalInfo } from '../utils/portalHelpers';

const COLUMNS = [
  { 
    id: 'pending_action', 
    title: '1. Ofertas Encontradas', 
    subtitle: 'Pendiente de acción',
    color: '#38bdf8' 
  },
  { 
    id: 'sent', 
    title: '2. Enviada', 
    subtitle: 'Espera 15 días',
    color: '#818cf8' 
  },
  { 
    id: 'in_progress', 
    title: '3. En Proceso', 
    subtitle: 'Contacto / Entrevistas',
    color: '#10b981' 
  },
  { 
    id: 'discarded', 
    title: '4. Descartada', 
    subtitle: 'Retención 30 días',
    color: '#94a3b8' 
  }
];

export default function KanbanBoard({ applications, onRefresh, onOpenNewApp }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [checkingUrlId, setCheckingUrlId] = useState(null);

  const handleStatusChange = async (app, newStatus) => {
    // Si pasa a 'in_progress' y no tiene motivo, abrir el modal obligatoriamente
    if (newStatus === 'in_progress' && !app.in_progress_reason) {
      setSelectedApp(app);
      return;
    }

    try {
      await api.updateApplication(app.id, { 
        status: newStatus,
        sent_date: newStatus === 'sent' && !app.sent_date ? new Date().toISOString().slice(0, 10) : undefined
      });
      onRefresh();
    } catch (e) {
      console.error('Error al actualizar estado:', e);
    }
  };

  const handleCheckUrl = async (e, appId) => {
    e.stopPropagation();
    setCheckingUrlId(appId);
    try {
      const res = await api.checkUrl(appId);
      alert(res.message);
      onRefresh();
    } catch (e) {
      alert('Error al verificar la URL');
    } finally {
      setCheckingUrlId(null);
    }
  };

  const handleScheduleCalendar = (e, app) => {
    e.stopPropagation();
    try {
      const title = encodeURIComponent(`Candidatura / Seguimiento: ${app.role} en ${app.company}`);
      const details = encodeURIComponent(`Oferta: ${app.url || 'Sin URL'}\nNotas: ${app.notes || ''}\nEstado: ${app.status}`);
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
      window.open(url, '_blank');
    } catch (e) {
      alert('Error generando enlace de Google Calendar');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Barra de Encabezado y Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Pipeline Kanban de Candidaturas (4 Estados)
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Gestión estratégica: Encontradas → Enviada (15 días auto) → En Proceso → Descartada (30 días de archivo)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowChart(!showChart)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}
          >
            <BarChart2 size={15} color="#818cf8" />
            <span>{showChart ? 'Ocultar Gráfica Mensual' : 'Ver Gráfica de Actividad'}</span>
          </button>

          {onOpenNewApp && (
            <button 
              className="btn btn-primary"
              onClick={onOpenNewApp}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem' }}
            >
              <Plus size={15} />
              <span>+ Nueva Oferta</span>
            </button>
          )}
        </div>
      </div>

      {/* Gráfica Mensual Desplegable */}
      {showChart && (
        <div className="animate-fade-in">
          <MonthlyActivityChart />
        </div>
      )}

      {/* Grid del Kanban */}
      <div className="kanban-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))' }}>
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id);

          return (
            <div key={col.id} className="kanban-column">
              {/* Encabezado de la columna */}
              <div className="kanban-header">
                <div>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                    {col.title}
                  </h3>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{col.subtitle}</div>
                </div>

                <span className="badge badge-indigo" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {colApps.length}
                </span>
              </div>

              {/* Contenedor de Tarjetas */}
              <div className="kanban-cards-wrapper">
                {colApps.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    Sin ofertas en esta fase
                  </div>
                ) : (
                  colApps.map((app) => {
                    const lifecycle = app.lifecycle_info || {};
                    const coletillasCount = app.coletillas ? app.coletillas.length : 0;
                    const isWarning = lifecycle.is_warning_threshold;
                    const portalInfo = detectPortalInfo(app.portal, app.url);

                    return (
                      <div 
                        key={app.id} 
                        className="app-card animate-fade-in"
                        onClick={() => setSelectedApp(app)}
                        style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
                      >
                        {/* Cabecera Tarjeta: Portal & Estado URL */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span 
                              className="badge" 
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '0.12rem 0.38rem', 
                                background: portalInfo.badgeBg, 
                                border: `1px solid ${portalInfo.badgeBorder}`,
                                color: portalInfo.color,
                                fontWeight: 600
                              }}
                            >
                              {portalInfo.emoji} {portalInfo.name}
                            </span>
                            <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '0.12rem 0.38rem' }}>
                              {app.location_type === 'remote' ? 'Remoto' : (app.location_type === 'hybrid' ? 'Híbrido' : 'Presencial')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {app.ats_score && (
                              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                                {app.ats_score}% ATS
                              </span>
                            )}

                            <span
                              className={`badge ${app.is_active_url ? 'badge-emerald' : 'badge-rose'}`}
                              title={app.is_active_url ? 'Oferta verificada activa' : 'Oferta detectada retirada'}
                              style={{ padding: '0.15rem 0.35rem' }}
                            >
                              {app.is_active_url ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            </span>

                            <button
                              onClick={(e) => handleCheckUrl(e, app.id)}
                              disabled={checkingUrlId === app.id}
                              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                              title="Re-comprobar si la oferta sigue publicada"
                            >
                              <RefreshCw size={11} className={checkingUrlId === app.id ? 'spin-anim' : ''} />
                            </button>
                          </div>
                        </div>

                        {/* Rol y Empresa */}
                        <h4 className="app-card-title" style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                          {app.role}
                        </h4>
                        <div className="app-card-company" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                          <Building size={13} color="#818cf8" />
                          <span>{app.company}</span>
                        </div>

                        {/* Detalles de Ubicación y Salario */}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.4rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MapPin size={11} />
                            {app.location_city || 'Remoto'}
                          </span>
                          {app.salary_range && (
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                              💰 {app.salary_range}
                            </span>
                          )}
                        </div>

                        {/* Badges de Materiales ATS & Carta */}
                        {(app.ats_optimized_cv_content || app.cover_letter) && (
                          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                            {app.ats_optimized_cv_content && (
                              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem' }}>
                                📄 CV ATS
                              </span>
                            )}
                            {app.cover_letter && (
                              <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem' }}>
                                ✉️ Carta
                              </span>
                            )}
                          </div>
                        )}

                        {/* Banner específico según el Estado del Ciclo de Vida */}
                        {app.status === 'sent' && (
                          <div style={{
                            background: isWarning ? 'rgba(245, 158, 11, 0.12)' : 'rgba(99, 102, 241, 0.08)',
                            border: `1px solid ${isWarning ? 'rgba(245, 158, 11, 0.35)' : 'rgba(99, 102, 241, 0.2)'}`,
                            borderRadius: '6px',
                            padding: '0.35rem 0.55rem',
                            marginBottom: '0.65rem',
                            fontSize: '0.725rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: isWarning ? '#fbbf24' : '#c7d2fe'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                              <Clock size={11} />
                              {lifecycle.state_message || 'Espera 15 días'}
                            </span>
                            {isWarning && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(245, 158, 11, 0.2)', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                                ⚠️ +10 Días
                              </span>
                            )}
                          </div>
                        )}

                        {app.status === 'in_progress' && app.in_progress_reason && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.55rem',
                            marginBottom: '0.65rem',
                            fontSize: '0.725rem',
                            color: '#34d399',
                            lineHeight: 1.3
                          }}>
                            <strong>Proceso:</strong> {app.in_progress_reason.slice(0, 65)}...
                          </div>
                        )}

                        {app.status === 'discarded' && (
                          <div style={{
                            background: 'rgba(148, 163, 184, 0.08)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.55rem',
                            marginBottom: '0.65rem',
                            fontSize: '0.7rem',
                            color: '#94a3b8'
                          }}>
                            <span>Motivo: {app.discard_reason === 'timeout_15_days' ? 'Sin respuesta 15d' : (app.discard_reason || 'Descarte')}</span>
                          </div>
                        )}

                        {/* Pie de la Tarjeta */}
                        <div 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            paddingTop: '0.45rem', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)' 
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {app.url && (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ 
                                  padding: '0.2rem 0.45rem', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: 3, 
                                  fontSize: '0.7rem',
                                  color: portalInfo.color,
                                  background: portalInfo.badgeBg,
                                  border: `1px solid ${portalInfo.badgeBorder}`,
                                  fontWeight: 600
                                }}
                                title={`Abrir oferta original directamente en ${portalInfo.name}`}
                              >
                                <ExternalLink size={11} />
                                <span>{portalInfo.name}</span>
                              </a>
                            )}

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.4rem' }}
                              onClick={(e) => handleScheduleCalendar(e, app)}
                              title="Agendar en Google Calendar"
                            >
                              <Calendar size={12} color="#818cf8" />
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.45rem', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem' }}
                              onClick={() => setSelectedApp(app)}
                              title="Ver y añadir coletillas a esta oferta"
                            >
                              <MessageSquare size={11} />
                              <span>{coletillasCount}</span>
                            </button>
                          </div>

                          {/* Selector Rápido de Estado */}
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app, e.target.value)}
                            style={{
                              background: '#111a2e',
                              border: '1px solid rgba(255, 255, 255, 0.16)',
                              color: '#f8fafc',
                              fontSize: '0.72rem',
                              fontWeight: 500,
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              outline: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending_action" style={{ background: '#111a2e', color: '#f8fafc' }}>1. Encontrada</option>
                            <option value="sent" style={{ background: '#111a2e', color: '#f8fafc' }}>2. Enviada (15d)</option>
                            <option value="in_progress" style={{ background: '#111a2e', color: '#f8fafc' }}>3. En Proceso</option>
                            <option value="discarded" style={{ background: '#111a2e', color: '#f8fafc' }}>4. Descartada</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Enriquecido de la Oferta */}
      {selectedApp && (
        <JobDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdated={() => {
            onRefresh();
            setSelectedApp(null);
          }}
        />
      )}
    </div>
  );
}
