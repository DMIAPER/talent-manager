import React, { useState } from 'react';
import { 
  GitFork, CheckCircle2, Circle, Clock, Award, Sparkles, 
  TrendingUp, DollarSign, Globe, Shield, ChevronRight, ToggleLeft, ToggleRight,
  RefreshCw, Check, ArrowDown, ExternalLink, Zap, BookOpen, Layers, GraduationCap,
  Link as LinkIcon, BookmarkCheck, Edit3, ShieldCheck, Eye, Download
} from 'lucide-react';
import { api } from '../services/api';
import CareerSyncModal from './CareerSyncModal';
import CourseSearchModal from './CourseSearchModal';
import EnrollmentCourseModal from './EnrollmentCourseModal';
import UploadCertificateModal from './UploadCertificateModal';
import CertificatePdfViewerModal from './CertificatePdfViewerModal';

export default function CareerBranchingMap({ plan, onRefresh }) {
  const [selectedMilestoneForModal, setSelectedMilestoneForModal] = useState(null);
  const [selectedMilestoneForCourseSearch, setSelectedMilestoneForCourseSearch] = useState(null);
  const [selectedMilestoneForEnrollment, setSelectedMilestoneForEnrollment] = useState(null);
  const [selectedMilestoneForCertUpload, setSelectedMilestoneForCertUpload] = useState(null);
  const [selectedCertForViewer, setSelectedCertForViewer] = useState(null);
  const [syncingMilestoneId, setSyncingMilestoneId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  if (!plan) return null;

  const branches = plan.branches || [];
  const trunk = plan.trunk_baseline || {
    title: 'Base Curricular Dominada (CV Maestro)',
    summary: 'Trayectoria técnica y competencias verificadas extraídas directamente de tu cv-maestro.md.',
    core_skills: ['Infraestructura & Sistemas', 'Redes TCP/IP', 'Linux / Windows', 'Scripting & Automatización', 'Soporte Técnico']
  };

  const marketMetrics = plan.market_metrics || {
    market_demand_growth: '+32% anual',
    median_salary_spain: '42.000€ - 62.000€',
    remote_availability: 'Alta (60% ofertas)',
    competition_level: 'Media'
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Conmutar bifurcación activa/pausada
  const handleToggleBranch = async (branchId) => {
    try {
      await api.toggleCareerBranch(plan.id, branchId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error conmutando la bifurcación');
    }
  };

  // Alternar estado de hito (pending -> in_progress -> completed)
  const handleToggleMilestone = async (milestoneId) => {
    try {
      await api.toggleMilestone(plan.id, milestoneId);
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error actualizando hito formativo');
    }
  };

  // Sincronización directa en 1 clic hacia cv-maestro.md
  const handleDirectSyncToMasterCv = async (milestone) => {
    setSyncingMilestoneId(milestone.id);
    try {
      const res = await api.syncMilestoneToMasterCv(plan.id, milestone.id);
      showToast(res.message || '¡Hito sincronizado con éxito en tu CV Maestro!');
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      // Fallback: abrir modal de confirmación
      setSelectedMilestoneForModal(milestone);
    } finally {
      setSyncingMilestoneId(null);
    }
  };

  const activeBranches = branches.filter(b => b.is_active);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* NOTIFICACIÓN TOAST */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #059669, #0284c7)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. COMPARATIVA DE IMPACTO & RETORNO DE INVERSIÓN (ROI FORMATIVO) */}
      <div 
        className="glass-panel"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} />
                Proyección Multicamino
              </span>
              <span className="badge badge-indigo">cv-maestro.md verificado</span>
              <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <Sparkles size={11} color="#c084fc" /> Skill: Orientador de Itinerarios
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 800 }}>
              {plan.current_role} <span style={{ color: '#818cf8' }}>➔</span> {plan.target_role || 'Especialista Multidisciplinar'}
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 700 }}>TECHO SALARIAL MEDIO</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.median_salary_spain}</div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>CRECIMIENTO DE MERCADO</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.market_demand_growth}</div>
            </div>

            <div style={{ background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700 }}>MODALIDAD REMOTA</div>
              <div style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 800 }}>{marketMetrics.remote_availability}</div>
            </div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          {plan.executive_summary}
        </p>
      </div>

      {/* 2. SELECTOR DE CAMINOS SUGERIDOS POR LA IA CON SWITCHES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitFork size={18} color="#38bdf8" />
              <span>Caminos Profesionales Ofrecidos por la IA ({branches.length})</span>
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Activa o desactiva las rutas para construir tu mapa de especialización a medida
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <strong>{activeBranches.length}</strong> de {branches.length} rutas activadas en el mapa
          </div>
        </div>

        {/* Grid de Cards de Caminos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {branches.map((br) => {
            const isAct = br.is_active;
            const themeCol = br.color_theme || '#6366f1';

            return (
              <div
                key={br.id}
                style={{
                  background: isAct ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '14px',
                  border: `1.5px solid ${isAct ? themeCol : 'rgba(255, 255, 255, 0.08)'}`,
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.85rem',
                  boxShadow: isAct ? `0 4px 18px ${themeCol}22` : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        color: themeCol, 
                        background: `${themeCol}18`,
                        border: `1px solid ${themeCol}44`,
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {br.fit_percentage ? `${br.fit_percentage}% Afinidad` : 'Recomendada'}
                    </span>

                    {/* Switch interactivo */}
                    <button
                      type="button"
                      onClick={() => handleToggleBranch(br.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: isAct ? themeCol : '#64748b'
                      }}
                      title={isAct ? 'Pausar esta bifurcación' : 'Activar en el mapa'}
                    >
                      {isAct ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                    </button>
                  </div>

                  <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', color: '#fff', fontWeight: 700 }}>
                    {br.name}
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {br.description}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    <strong>{br.salary_range_est}</strong>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>
                    {br.market_demand}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. MAPA VISUAL DE BIFURCACIONES (SKILL TREE & BIFURCACIONES)
          ========================================================================= */}
      <div 
        className="glass-panel"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '2rem 1.75rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* ENCABEZADO DEL GRAFO */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 12px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Layers size={13} />
            Grafo Interactivo de Habilidades & Ramales
          </div>
          <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.35rem', color: '#f8fafc', fontWeight: 800 }}>
            Mapa de Bifurcaciones Profesionales
          </h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Parte de tu base curricular verificada, explora los puntos de inflexión y progresa en los hitos formativos. Cada hito completado puede sincronizarse directamente con tu CV Maestro.
          </p>
        </div>

        {/* A. NODO RAÍZ: TRONCO COMÚN (BASE DEL CV MAESTRO) */}
        <div 
          style={{
            width: '100%',
            maxWidth: '680px',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '2px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <CheckCircle2 size={16} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800 }}>
                {trunk.title}
              </h4>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
              VERIFICADO EN DISCO
            </span>
          </div>

          <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            {trunk.summary}
          </p>

          {/* Pastillas de competencias dominadas */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(trunk.core_skills || []).map((sk, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#93c5fd',
                  fontWeight: 600
                }}
              >
                ✓ {sk}
              </span>
            ))}
          </div>
        </div>

        {/* B. PUNTO DE INFLEXIÓN & BIFURCACIÓN VISUAL */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '2px', height: '25px', background: 'linear-gradient(180deg, #38bdf8, #818cf8)' }} />
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5, #0284c7)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}>
            <GitFork size={13} />
            <span>PUNTO DE BIFURCACIÓN ESTRATÉGICA</span>
          </div>
          <div style={{ width: '2px', height: '25px', background: 'linear-gradient(180deg, #818cf8, rgba(255,255,255,0.2))' }} />
        </div>

        {/* C. RAMALES ACTIVOS CONECTADOS (EN PARALELO / ÁRBOL) */}
        {activeBranches.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
            Activa al menos una ruta en los interruptores superiores para visualizar sus ramales de hitos.
          </div>
        ) : (
          <div 
            style={{ 
              width: '100%', 
              display: 'grid', 
              gridTemplateColumns: `repeat(${Math.min(activeBranches.length, 3)}, minmax(300px, 1fr))`,
              gap: '1.5rem',
              alignItems: 'start'
            }}
          >
            {activeBranches.map((branch) => {
              const themeCol = branch.color_theme || '#6366f1';

              return (
                <div 
                  key={branch.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: `1.5px solid ${themeCol}44`,
                    borderRadius: '16px',
                    padding: '1.25rem',
                    position: 'relative',
                    boxShadow: `0 8px 24px ${themeCol}15`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Cabecera del Ramal */}
                  <div style={{ borderBottom: `1px solid ${themeCol}33`, paddingBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 800 }}>
                        {branch.name}
                      </h4>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: `${themeCol}22`, color: themeCol, fontWeight: 700 }}>
                        {branch.salary_range_est}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.25rem' }}>
                      🎯 Meta: {branch.target_role || 'Especialista'}
                    </div>

                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.35 }}>
                      {branch.description}
                    </p>
                  </div>

                  {/* Línea secuencial de Hitos con conector */}
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem' }}>
                    
                    {/* Línea vertical conectora del ramal */}
                    <div style={{
                      position: 'absolute',
                      left: '6px',
                      top: '12px',
                      bottom: '12px',
                      width: '2px',
                      background: `linear-gradient(180deg, ${themeCol} 0%, ${themeCol}33 100%)`
                    }} />

                    {(branch.milestones || []).map((ms, msIdx) => {
                      const isCompleted = ms.status === 'completed';
                      const isInProgress = ms.status === 'in_progress';
                      const isSyncing = syncingMilestoneId === ms.id;

                      return (
                        <div
                          key={ms.id || msIdx}
                          style={{
                            position: 'relative',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.08)' : (isInProgress ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.35)' : (isInProgress ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.07)')}`,
                            borderRadius: '12px',
                            padding: '1rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Nodo circular interactivo sobre la línea */}
                          <div 
                            onClick={() => handleToggleMilestone(ms.id)}
                            style={{
                              position: 'absolute',
                              left: '-24px',
                              top: '16px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isCompleted ? '#10b981' : (isInProgress ? '#38bdf8' : '#334155'),
                              border: '3px solid #0f172a',
                              boxShadow: isCompleted ? '0 0 10px #10b981' : (isInProgress ? '0 0 10px #38bdf8' : 'none'),
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: 900
                            }}
                            title="Haz clic para conmutar estado (Pendiente ➔ En curso ➔ Completado)"
                          >
                            {isCompleted ? '✓' : ms.level || msIdx + 1}
                          </div>

                          {/* Contenido del Hito */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.35rem' }}>
                              <h5 style={{ margin: 0, fontSize: '0.86rem', color: isCompleted ? '#34d399' : '#f8fafc', fontWeight: 700, lineHeight: 1.3 }}>
                                {ms.title}
                              </h5>
                              <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', flexShrink: 0 }}>
                                Nivel {ms.level || msIdx + 1}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Award size={12} color="#f59e0b" />
                                {ms.provider}
                              </span>
                              <span>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} />
                                {ms.duration_hours}h
                              </span>
                              <span>•</span>
                              <span>{ms.cost_estimate}</span>
                            </div>

                            {/* Competencias adquiridas */}
                            {ms.skills_acquired && ms.skills_acquired.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
                                {ms.skills_acquired.map((sk, sIdx) => (
                                  <span
                                    key={sIdx}
                                    style={{
                                      fontSize: '0.65rem',
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: 'rgba(255, 255, 255, 0.04)',
                                      color: '#cbd5e1',
                                      border: '1px solid rgba(255, 255, 255, 0.06)'
                                    }}
                                  >
                                    +{sk}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* BOTONERA DE ACCIÓN Y SINCRONIZACIÓN CON CV MAESTRO */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleMilestone(ms.id)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: isCompleted ? '#34d399' : (isInProgress ? '#38bdf8' : '#94a3b8'),
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                {isCompleted ? '✓ Completado' : (isInProgress ? '⚡ En progreso' : '○ Pendiente')}
                              </button>

                              {/* SECCIÓN DESTACADA: CURSO PLANIFICADO PARA INSCRIPCIÓN */}
                              {ms.certificate_link ? (
                                <div style={{
                                  width: '100%',
                                  padding: '0.55rem 0.75rem',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.1))',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.65rem',
                                  flexWrap: 'wrap',
                                  marginTop: '0.35rem'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '200px', flex: 1 }}>
                                    <BookmarkCheck size={15} color="#34d399" flexShrink={0} />
                                    <div>
                                      <div style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        🎯 Inscripción prevista
                                      </div>
                                      <div style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 700, lineHeight: 1.25 }}>
                                        {ms.course_title || ms.title}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <a
                                      href={ms.certificate_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: '0.72rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #10b981, #0284c7)',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontWeight: 800,
                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                                      }}
                                      title="Abrir enlace oficial para apuntarse / matricularse al curso"
                                    >
                                      <span>Inscribirme / Abrir Curso</span>
                                      <ExternalLink size={11} />
                                    </a>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedMilestoneForEnrollment(ms)}
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '3px 8px',
                                        borderRadius: '5px',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        color: '#cbd5e1',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      title="Editar enlace, nombre o detalles del curso"
                                    >
                                      <Edit3 size={10} />
                                      <span>Editar</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedMilestoneForCourseSearch(ms)}
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '3px 8px',
                                        borderRadius: '5px',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        background: 'rgba(56, 189, 248, 0.08)',
                                        color: '#38bdf8',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}
                                      title="Buscar otras alternativas de cursos con el agente inteligente"
                                    >
                                      <GraduationCap size={11} />
                                      <span>Alternativas</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* BOTÓN 1: INCLUIR ENLACE DE INSCRIPCIÓN DIRECTO */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMilestoneForEnrollment(ms)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '3px 9px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(16, 185, 129, 0.45)',
                                      background: 'rgba(16, 185, 129, 0.14)',
                                      color: '#34d399',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Indicar el enlace del curso al que tienes intención de apuntarte"
                                  >
                                    <LinkIcon size={12} color="#34d399" />
                                    <span>Incluir Enlace de Inscripción</span>
                                  </button>

                                  {/* BOTÓN 2: BUSCAR CURSOS & ENLACES EN VIVO CON IA */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMilestoneForCourseSearch(ms)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '3px 9px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(6, 182, 212, 0.4)',
                                      background: 'rgba(6, 182, 212, 0.12)',
                                      color: '#38bdf8',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Rastrear en la web cursos, certificaciones y enlaces oficiales para este hito"
                                  >
                                    <GraduationCap size={12} color="#38bdf8" />
                                    <span>Buscar Cursos Online</span>
                                  </button>
                                </>
                              )}

                              {/* BOTÓN 3: SUBIR CERTIFICADO DE SUPERACIÓN (IA) */}
                              <button
                                type="button"
                                onClick={() => setSelectedMilestoneForCertUpload(ms)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '3px 9px',
                                  borderRadius: '6px',
                                  border: ms.certificate_file 
                                    ? '1px solid rgba(16, 185, 129, 0.4)' 
                                    : '1px solid rgba(168, 85, 247, 0.45)',
                                  background: ms.certificate_file 
                                    ? 'rgba(16, 185, 129, 0.12)' 
                                    : 'rgba(168, 85, 247, 0.14)',
                                  color: ms.certificate_file ? '#34d399' : '#c084fc',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Subir certificado o diploma en PDF/imagen para que la IA lo evalúe, valide el hito y lo incorpore al CV Maestro"
                              >
                                {ms.certificate_file ? <ShieldCheck size={12} color="#34d399" /> : <Award size={12} color="#c084fc" />}
                                <span>{ms.certificate_file ? '✓ Certificado Verificado' : 'Subir Certificado (IA)'}</span>
                              </button>

                              {/* ACCIONES PARA VER Y DESCARGAR ARCHIVO FÍSICO */}
                              {ms.certificate_file && ms.certificate_url && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCertForViewer({ ...ms, title: ms.title, name: ms.title, is_verified: true, degree_type_label: 'Hito Acreditado en CV Maestro' })}
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '3px 7px',
                                      borderRadius: '5px',
                                      background: 'rgba(56, 189, 248, 0.1)',
                                      border: '1px solid rgba(56, 189, 248, 0.35)',
                                      color: '#38bdf8',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Abrir visor PDF del certificado"
                                  >
                                    <Eye size={11} />
                                    <span>Ver Diploma</span>
                                  </button>

                                  <a
                                    href={api.getCertificateDownloadUrl(ms.certificate_file || ms.certificate_url)}
                                    download={String(ms.certificate_file || ms.certificate_url).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') || 'diploma.pdf'}
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '3px 6px',
                                      borderRadius: '5px',
                                      background: 'rgba(255, 255, 255, 0.06)',
                                      border: '1px solid rgba(255, 255, 255, 0.12)',
                                      color: '#cbd5e1',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                    title="Descargar archivo original PDF"
                                  >
                                    <Download size={11} />
                                  </a>
                                </div>
                              )}

                              {/* BOTÓN DESTACADO: SINCRONIZAR DIRECTAMENTE CON CV MAESTRO */}
                              {isCompleted && !ms.certificate_file && (
                                <button
                                  type="button"
                                  onClick={() => handleDirectSyncToMasterCv(ms)}
                                  disabled={isSyncing}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '3px 9px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
                                    color: '#34d399',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Actualizar automáticamente cv-maestro.md con esta formación y sus competencias"
                                >
                                  {isSyncing ? <RefreshCw size={11} className="spin-anim" /> : <Sparkles size={11} />}
                                  <span>Sincronizar con CV Maestro</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PARA INCLUIR / EDITAR ENLACE DE INSCRIPCIÓN */}
      {selectedMilestoneForEnrollment && (
        <EnrollmentCourseModal
          planId={plan.id}
          milestone={selectedMilestoneForEnrollment}
          onClose={() => setSelectedMilestoneForEnrollment(null)}
          onSaved={() => {
            showToast('¡Enlace de inscripción guardado con éxito!');
            if (onRefresh) onRefresh();
          }}
          onOpenSearchModal={(ms) => {
            setSelectedMilestoneForCourseSearch(ms);
          }}
        />
      )}

      {/* MODAL DE BÚSQUEDA DE CURSOS Y CERTIFICACIONES EN VIVO */}
      {selectedMilestoneForCourseSearch && (
        <CourseSearchModal
          planId={plan.id}
          milestone={selectedMilestoneForCourseSearch}
          onClose={() => setSelectedMilestoneForCourseSearch(null)}
          onCourseAttached={() => {
            showToast('¡Curso vinculado con éxito al hito formativo!');
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* MODAL DE SUBIDA Y VERIFICACIÓN DE CERTIFICADO DE HITO (IA) */}
      {selectedMilestoneForCertUpload && (
        <UploadCertificateModal
          isOpen={Boolean(selectedMilestoneForCertUpload)}
          mode="milestone"
          planId={plan.id}
          milestone={selectedMilestoneForCertUpload}
          onClose={() => setSelectedMilestoneForCertUpload(null)}
          onSuccess={() => {
            showToast('¡Certificado verificado y hito acreditado en el CV Maestro!');
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* MODAL DE SINCRONIZACIÓN FORMAL (FALLBACK O EDICIÓN MANUAL) */}
      {selectedMilestoneForModal && (
        <CareerSyncModal
          planId={plan.id}
          milestone={selectedMilestoneForModal}
          onClose={() => setSelectedMilestoneForModal(null)}
          onSuccess={() => {
            showToast('¡Hito sincronizado con éxito!');
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* MODAL VISOR PDF DEL CERTIFICADO DEL HITO */}
      {selectedCertForViewer && (
        <CertificatePdfViewerModal
          isOpen={Boolean(selectedCertForViewer)}
          certificate={selectedCertForViewer}
          onClose={() => setSelectedCertForViewer(null)}
        />
      )}

    </div>
  );
}
