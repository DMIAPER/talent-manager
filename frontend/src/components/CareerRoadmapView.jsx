import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Award, 
  ExternalLink, 
  Zap, 
  FolderGit2, 
  BookOpen, 
  Sparkles, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import SkillVerificationQuizModal from './SkillVerificationQuizModal';
import CareerGrowthTree from './CareerGrowthTree';

export default function CareerRoadmapView({
  audit,
  onAuditUpdated
}) {
  const roadmap = audit?.career_roadmap || [];
  const marketGap = audit?.market_gap_analysis || {};
  const verifications = audit?.skill_verifications || [];

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'level-1' | 'level-2' | 'level-3' | 'verified'
  const [selectedStepForQuiz, setSelectedStepForQuiz] = useState(null);
  const [togglingStepId, setTogglingStepId] = useState(null);

  // Calcular métricas
  let totalSteps = 0;
  let completedSteps = 0;
  let verifiedSteps = 0;

  roadmap.forEach(phase => {
    (phase.steps || []).forEach(step => {
      totalSteps++;
      if (step.completed) completedSteps++;
      if (step.verified) verifiedSteps++;
    });
  });

  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const handleToggleStep = async (stepId, currentState) => {
    setTogglingStepId(stepId);
    try {
      const res = await api.toggleRoadmapStep(stepId, !currentState);
      if (res && res.audit && onAuditUpdated) {
        onAuditUpdated(res.audit);
      }
    } catch (e) {
      console.error('Error alternando paso:', e);
      alert('Error actualizando paso del roadmap: ' + e.message);
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleVerificationSuccess = (quizResult) => {
    // Si la micro-evaluación se supera, recargamos la auditoría
    if (onAuditUpdated) {
      api.getProfileAudit().then(updatedAudit => {
        if (updatedAudit) onAuditUpdated(updatedAudit);
      });
    }
  };

  const getPhaseIcon = (level) => {
    if (level === 'immediate') return <Zap size={20} color="#f59e0b" />;
    if (level === 'projects') return <FolderGit2 size={20} color="#38bdf8" />;
    return <BookOpen size={20} color="#a855f7" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 0. CEREBRO & ÁRBOL ORGÁNICO DE CRECIMIENTO */}
      <CareerGrowthTree
        totalSteps={totalSteps}
        completedSteps={completedSteps}
        verifiedSteps={verifiedSteps}
        phases={roadmap}
      />
      
      {/* 1. TARJETA DE PROGRESO Y ANÁLISIS DE MERCADO */}
      <div 
        className="glass-panel"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.85))',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Layers size={22} color="#6366f1" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
                Roadmap de Empleabilidad del Sector ("Career Growth")
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Plan de acción guiado y personalizado para cerrar la brecha con las ofertas más demandadas de tu sector.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div 
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '8px 14px',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 700 }}>
                Progreso del Plan
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8' }}>
                {progressPercentage}%
              </div>
            </div>

            <div 
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '8px 14px',
                borderRadius: '12px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>
                Insignias Verificadas
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                {verifiedSteps} / {totalSteps}
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Progreso Visual */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '6px' }}>
            <span>Hitos completados: {completedSteps} de {totalSteps}</span>
            <span>{progressPercentage}% conseguido</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div 
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #10b981)',
                borderRadius: '10px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* Diagnóstico Market Gap */}
        {marketGap.summary && (
          <div 
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '0.85rem 1.15rem',
              borderRadius: '12px',
              borderLeft: '4px solid #10b981',
              fontSize: '0.82rem',
              color: '#cbd5e1',
              lineHeight: 1.45
            }}
          >
            <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>
              🎯 Análisis de Brecha contra Ofertas Reales (Market Gap):
            </strong>
            {marketGap.summary}
          </div>
        )}
      </div>

      {/* 2. BOTONERA DE FILTRADO */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveFilter('all')}
          className={`btn ${activeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
        >
          Todos los Niveles ({totalSteps})
        </button>
        <button
          onClick={() => setActiveFilter('immediate')}
          className={`btn ${activeFilter === 'immediate' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
        >
          ⚡ Nivel 1: Inmediato (1-7 días)
        </button>
        <button
          onClick={() => setActiveFilter('projects')}
          className={`btn ${activeFilter === 'projects' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
        >
          🛠️ Nivel 2: Proyectos Clave (2-4 sem)
        </button>
        <button
          onClick={() => setActiveFilter('consolidation')}
          className={`btn ${activeFilter === 'consolidation' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
        >
          📚 Nivel 3: Consolidación (1-3 meses)
        </button>
        <button
          onClick={() => setActiveFilter('verified')}
          className={`btn ${activeFilter === 'verified' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', color: activeFilter === 'verified' ? '#fff' : '#34d399' }}
        >
          🟢 Solo Verificados ({verifiedSteps})
        </button>
      </div>

      {/* 3. LISTADO DE NIVELES DEL ROADMAP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {roadmap
          .filter(phase => activeFilter === 'all' || activeFilter === phase.level || activeFilter === 'verified')
          .map((phase) => {
            const stepsToShow = (phase.steps || []).filter(s => {
              if (activeFilter === 'verified') return s.verified;
              return true;
            });

            if (stepsToShow.length === 0) return null;

            return (
              <div 
                key={phase.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  background: 'rgba(15, 23, 42, 0.75)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Cabecera de la Fase */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <div 
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {getPhaseIcon(phase.level)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                      {phase.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                      {phase.subtitle || phase.description}
                    </p>
                  </div>
                </div>

                {/* Lista de Pasos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {stepsToShow.map((step) => {
                    const isToggling = togglingStepId === step.id;
                    const isCompleted = Boolean(step.completed);
                    const isVerified = Boolean(step.verified);

                    return (
                      <div 
                        key={step.id}
                        style={{
                          background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.25)',
                          border: isVerified 
                            ? '1px solid rgba(16, 185, 129, 0.4)' 
                            : isCompleted 
                              ? '1px solid rgba(16, 185, 129, 0.2)' 
                              : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        {/* Checkbox y Contenido del Paso */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleStep(step.id, isCompleted)}
                            disabled={isToggling}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                              marginTop: '2px',
                              color: isCompleted ? '#34d399' : '#64748b',
                              transition: 'transform 0.15s'
                            }}
                            title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completado'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 size={20} color="#34d399" />
                            ) : (
                              <Circle size={20} color="#64748b" />
                            )}
                          </button>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                              <span 
                                style={{ 
                                  fontWeight: 700, 
                                  fontSize: '0.9rem', 
                                  color: isCompleted ? '#e2e8f0' : '#ffffff',
                                  textDecoration: isCompleted && !isVerified ? 'line-through' : 'none',
                                  opacity: isCompleted && !isVerified ? 0.8 : 1
                                }}
                              >
                                {step.title}
                              </span>

                              {isVerified && (
                                <span 
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Award size={12} />
                                  <span>Verified ({step.verified_score || 100}%)</span>
                                </span>
                              )}

                              {step.tech && (
                                <span 
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '1px 6px',
                                    borderRadius: '6px',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: '#a5b4fc',
                                    border: '1px solid rgba(99, 102, 241, 0.25)'
                                  }}
                                >
                                  {step.tech}
                                </span>
                              )}
                            </div>

                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                              {step.description}
                            </p>

                            {/* Enlace Proof of Work si existe */}
                            {step.proof_github_url && (
                              <a
                                href={step.proof_github_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  color: '#38bdf8',
                                  textDecoration: 'none',
                                  marginTop: '6px'
                                }}
                              >
                                <ExternalLink size={12} />
                                <span>Ver Proof of Work en GitHub</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Botón de Micro-Quiz de Validación */}
                        {step.quiz_available && (
                          <div style={{ flexShrink: 0 }}>
                            {isVerified ? (
                              <button
                                type="button"
                                onClick={() => setSelectedStepForQuiz(step)}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#34d399',
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Check size={13} />
                                <span>Verificado</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedStepForQuiz(step)}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '5px 10px',
                                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Evalúa tu comprensión práctica para obtener la insignia"
                              >
                                <Award size={13} />
                                <span>Validar con Quiz</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {roadmap.length === 0 && (
          <div 
            className="glass-panel" 
            style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              background: 'rgba(15, 23, 42, 0.65)', 
              borderRadius: '16px',
              border: '1px dashed rgba(255, 255, 255, 0.15)'
            }}
          >
            <Layers size={36} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.35rem', color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700 }}>
              Roadmap pendiente de generación
            </h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', maxWidth: '500px', marginInline: 'auto' }}>
              Sube tu currículum o pulsa en <strong>"Ejecutar Auditoría con IA"</strong> en el panel superior para analizar las brechas con ofertas reales del mercado y florecer tu Árbol de Carrera.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Micro-Quiz */}
      {selectedStepForQuiz && (
        <SkillVerificationQuizModal 
          step={selectedStepForQuiz}
          onClose={() => setSelectedStepForQuiz(null)}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}

    </div>
  );
}
