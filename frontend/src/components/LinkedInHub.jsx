import React, { useState } from 'react';
import { Share2, TrendingUp, CheckSquare, Square, Plus, Eye, Search, MessageSquare, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function LinkedInHub({ linkedInData, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStat, setNewStat] = useState({
    week_label: '',
    profile_views: '',
    search_appearances: '',
    post_impressions: '',
    new_connections: ''
  });

  const handleToggleChecklist = async (itemId) => {
    try {
      await api.toggleLinkedInChecklist(itemId);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStat = async (e) => {
    e.preventDefault();
    try {
      await api.addLinkedInStat({
        week_label: newStat.week_label || `Semana ${new Date().toLocaleDateString()}`,
        profile_views: parseInt(newStat.profile_views) || 0,
        search_appearances: parseInt(newStat.search_appearances) || 0,
        post_impressions: parseInt(newStat.post_impressions) || 0,
        new_connections: parseInt(newStat.new_connections) || 0
      });
      setShowAddModal(false);
      setNewStat({ week_label: '', profile_views: '', search_appearances: '', post_impressions: '', new_connections: '' });
      onRefresh();
    } catch (err) {
      alert('Error guardando estadística');
    }
  };

  if (!linkedInData) return null;

  const weeklyStats = linkedInData.weekly_stats || [];
  const maxViews = Math.max(...weeklyStats.map(s => s.profile_views), 10);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Cabecera LinkedIn */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-indigo">
                <Share2 size={12} /> Marca Personal & Redes
              </span>
              <span className="badge badge-emerald">
                SSI: {linkedInData.ssi_score || 74}/100
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.35rem' }}>
              Monitor de Visibilidad Profesional en LinkedIn
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Titular actual: <strong style={{ color: '#cbd5e1' }}>{linkedInData.current_headline}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {linkedInData.profile_url && (
              <a
                href={linkedInData.profile_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={15} />
                <span>Ver Mi Perfil</span>
              </a>
            )}
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={15} />
              <span>Añadir Registro Semanal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Gráfico de Tendencias & Checklist de Auditoría */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Histórico y Gráfico de Barras */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#38bdf8" />
              Evolución Semanal de Visualizaciones
            </h3>
          </div>

          {/* Gráfico Visual en Barras CSS */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.25rem', height: '180px', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
            {weeklyStats.map((stat, idx) => {
              const heightPct = (stat.profile_views / maxViews) * 100;
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {stat.profile_views}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${Math.max(heightPct, 10)}%`,
                      background: 'linear-gradient(180deg, #6366f1, #3b82f6)',
                      borderRadius: '6px 6px 0 0',
                      boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
                      transition: 'height 0.4s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                    {stat.week_label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tabla Resumen de Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            {weeklyStats.slice(-1).map((latest, i) => (
              <React.Fragment key={i}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.75rem' }}>
                    <Search size={12} /> Búsquedas
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{latest.search_appearances}</strong>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.75rem' }}>
                    <Eye size={12} /> Impresiones Posts
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{latest.post_impressions}</strong>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.75rem' }}>
                    <MessageSquare size={12} /> Contactos Nuevos
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#fff' }}>+{latest.new_connections}</strong>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Checklist de Auditoría de Perfil */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Checklist de Optimización de Perfil</h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Directrices de skills de talento
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {linkedInData.audit_checklist?.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  background: item.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${item.completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ marginTop: '2px', color: item.completed ? '#34d399' : '#64748b' }}>
                  {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>{item.section}</span>
                    <span className={`badge ${item.impact_level === 'Crítico' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {item.impact_level}
                    </span>
                    <strong style={{ fontSize: '0.85rem', color: item.completed ? '#cbd5e1' : '#fff', textDecoration: item.completed ? 'line-through' : 'none' }}>
                      {item.title}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para Registrar Nueva Semana */}
      {showAddModal && (
        <ModalPortal isOpen={showAddModal}>
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1.25rem' }}>
              Registrar Métricas Semanales de LinkedIn
            </h3>
            <form onSubmit={handleSaveStat}>
              <div className="form-group">
                <label>Etiqueta de Semana</label>
                <input
                  type="text"
                  placeholder="Ej: Semana 40 - Octubre 2026"
                  className="form-input"
                  value={newStat.week_label}
                  onChange={(e) => setNewStat({ ...newStat, week_label: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Visualizaciones Perfil</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStat.profile_views}
                    onChange={(e) => setNewStat({ ...newStat, profile_views: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apariciones en Búsquedas</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStat.search_appearances}
                    onChange={(e) => setNewStat({ ...newStat, search_appearances: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Impresiones de Posts</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStat.post_impressions}
                    onChange={(e) => setNewStat({ ...newStat, post_impressions: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Nuevas Conexiones</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newStat.new_connections}
                    onChange={(e) => setNewStat({ ...newStat, new_connections: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Métricas
                </button>
              </div>
            </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
