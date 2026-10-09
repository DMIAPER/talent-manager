import React, { useState } from 'react';
import { 
  GitFork, CheckCircle2, Circle, Clock, Award, Sparkles, 
  TrendingUp, DollarSign, Globe, Shield, ChevronRight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { api } from '../services/api';
import CareerSyncModal from './CareerSyncModal';

export default function CareerTreeView({ plan, onRefresh }) {
  const [selectedMilestoneForSync, setSelectedMilestoneForSync] = useState(null);
  const [activeBranchId, setActiveBranchId] = useState(null);

  if (!plan) return null;

  const branches = plan.branches || [];
  const marketMetrics = plan.market_metrics || {
    market_demand_growth: '+30% anual',
    median_salary_spain: '38.000€ - 55.000€',
    remote_availability: 'Alta (65%)',
    competition_level: 'Media'
  };

  const handleToggleBranch = async (branchId) => {
    try {
      await api.toggleCareerBranch(plan.id, branchId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error conmutando la bifurcación');
    }
  };

  const handleToggleMilestone = async (milestoneId) => {
    try {
      const res = await api.toggleMilestone(plan.id, milestoneId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error actualizando hito formativo');
    }
  };

  const currentRole = plan.current_role || 'Profesional TI';
  const targetRole = plan.target_role || 'Especialista Objetivo';

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      
      {/* 1. SIMULADOR DE SALTO & MÉTRICAS DE MERCADO (ROI FORMATIVO) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.5) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} />
                Simulador de Salto & Métricas de Mercado
              </span>
              <span className="badge badge-indigo">ROI Formativo</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>
              {currentRole} <span style={{ color: '#818cf8' }}>➔</span> {targetRole}
            </h3>
          </div>

          {/* Tarjetas de Métricas de Mercado */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700 }}>BANDA SALARIAL MEDIA</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.median_salary_spain}</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>CRECIMIENTO DE DEMANDA</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.market_demand_growth}</div>
            </div>

            <div style={{ background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700 }}>OFERTAS EN REMOTO</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.remote_availability}</div>
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          {plan.executive_summary}
        </p>
      </div>

      {/* 2. SELECTOR Y CONTROL DE BIFURCACIONES (BRANCH FORKS) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitFork size={18} color="#818cf8" />
            <span>Ramales de Formación & Bifurcaciones Disponibles ({branches.length})</span>
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Activa o conmuta bifurcaciones para explorar rutas formativas alternativas
          </span>
        </div>

        {/* Botones de bifurcación */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {branches.map((br) => {
            const isMain = br.branch_type === 'main';
            return (
              <button
                key={br.id}
                onClick={() => handleToggleBranch(br.id)}
                style={{
                  background: br.is_active ? (isMain ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)') : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${br.is_active ? (isMain ? '#818cf8' : '#10b981') : 'rgba(255, 255, 255, 0.1)'}`,
                  color: br.is_active ? '#fff' : '#64748b',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <GitFork size={13} color={br.is_active ? (isMain ? '#818cf8' : '#10b981') : '#64748b'} />
                <span>{br.name}</span>
                <span className="badge badge-slate" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                  {br.is_active ? 'Activa' : 'Pausada'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. VISUALIZADOR DE ÁRBOL / GRAFO FORMAL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {branches.filter(b => b.is_active).map((branch) => {
          const isMain = branch.branch_type === 'main';

          return (
            <div 
              key={branch.id}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isMain ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.25)'}`,
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative'
              }}
            >
              {/* Cabecera del Ramal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: isMain ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <GitFork size={18} color={isMain ? '#818cf8' : '#34d399'} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                      {branch.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {branch.description}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    Demanda: {branch.market_demand}
                  </span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                    Salario: {branch.salary_range_est}
                  </span>
                </div>
              </div>

              {/* Lista Secuencial de Hitos del Ramal (Árbol Conectado) */}
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingLeft: '1.5rem' }}>
                
                {/* Línea vertical conectora del árbol */}
                <div style={{
                  position: 'absolute',
                  left: '7px',
                  top: '15px',
                  bottom: '15px',
                  width: '2px',
                  background: isMain ? 'linear-gradient(180deg, #6366f1 0%, #38bdf8 100%)' : 'linear-gradient(180deg, #10b981 0%, #06b6d4 100%)',
                  opacity: 0.4
                }} />

                {branch.milestones.map((ms, msIdx) => {
                  const isCompleted = ms.status === 'completed';
                  const isInProgress = ms.status === 'in_progress';

                  return (
                    <div 
                      key={ms.id || msIdx}
                      style={{
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.35)' : (isInProgress ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.06)')}`,
                        borderRadius: '12px',
                        padding: '1.15rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Nodo circular sobre la línea */}
                      <div 
                        onClick={() => handleToggleMilestone(ms.id)}
                        style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '20px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: isCompleted ? '#10b981' : (isInProgress ? '#38bdf8' : '#334155'),
                          border: '3px solid #0f172a',
                          boxShadow: isCompleted ? '0 0 8px #10b981' : (isInProgress ? '0 0 8px #38bdf8' : 'none'),
                          cursor: 'pointer'
                        }}
                        title="Pulsar para conmutar estado"
                      />

                      {/* Cabecera del Hito */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.45rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-slate" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                            NIVEL {ms.level || (msIdx + 1)}
                          </span>

                          {ms.is_official_certification && (
                            <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.68rem' }}>
                              <Award size={11} />
                              Certificación Oficial
                            </span>
                          )}

                          <span 
                            className={`badge ${isCompleted ? 'badge-emerald' : (isInProgress ? 'badge-indigo' : 'badge-slate')}`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            {isCompleted ? '✅ Completado' : (isInProgress ? '⏳ En Curso' : '⚪ Pendiente')}
                          </span>
                        </div>

                        {/* Botón de Sincronización con Perfil Oficial si está completado */}
                        {isCompleted && (
                          <button
                            onClick={() => setSelectedMilestoneForSync(ms)}
                            className="btn btn-primary btn-sm animate-fade-in"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                          >
                            <Sparkles size={12} />
                            <span>Añadir a mi Perfil Oficial</span>
                          </button>
                        )}
                      </div>

                      {/* Título y Proveedor */}
                      <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', color: '#fff', fontWeight: 700 }}>
                        {ms.title}
                      </h5>

                      <div style={{ display: 'flex', gap: '1rem', color: '#94a3b8', fontSize: '0.785rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span>🏛️ {ms.provider}</span>
                        <span>⏱️ {ms.duration_hours}h estimadas</span>
                        <span>💰 {ms.cost_estimate}</span>
                      </div>

                      {/* Skills adquiridas */}
                      {ms.skills_acquired && ms.skills_acquired.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                          {ms.skills_acquired.map((sk, skIdx) => (
                            <span key={skIdx} className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Botón rápido para alternar estado */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                        <button
                          onClick={() => handleToggleMilestone(ms.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.725rem', padding: '0.2rem 0.55rem' }}
                        >
                          Marcar como: {isCompleted ? 'Pendiente' : (isInProgress ? 'Completado' : 'En Curso')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Sincronización con Perfil Oficial */}
      {selectedMilestoneForSync && (
        <CareerSyncModal
          planId={plan.id}
          milestone={selectedMilestoneForSync}
          onClose={() => setSelectedMilestoneForSync(null)}
          onSuccess={() => {
            if (onRefresh) onRefresh();
            setSelectedMilestoneForSync(null);
          }}
        />
      )}
    </div>
  );
}
