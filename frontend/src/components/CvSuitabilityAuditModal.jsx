import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, AlertOctagon, Sparkles, 
  Copy, Check, ArrowRight, ExternalLink, ShieldCheck, Target,
  FileText, Briefcase, Zap, Info
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function CvSuitabilityAuditModal({ 
  isOpen, 
  onClose, 
  application, 
  evaluation, 
  onOpenA4View,
  onAdaptWithAi
}) {
  const [copiedBulletIdx, setCopiedBulletIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('traffic_light'); // 'traffic_light' | 'keywords' | 'star_bullets'

  if (!isOpen || !evaluation) return null;

  const score = evaluation.real_ats_score ?? 70;
  const verdict = evaluation.verdict || 'Evaluación de Idoneidad';
  const trafficLight = evaluation.traffic_light || {};
  const redFlags = trafficLight.red_flags || [];
  const amberFlags = trafficLight.amber_flags || [];
  const greenSignals = trafficLight.green_signals || [];

  const keywordGaps = evaluation.keyword_gaps || {};
  const missingHard = keywordGaps.missing_hard_skills || [];
  const missingSoft = keywordGaps.missing_soft_skills || [];
  const matchingSkills = evaluation.matching_skills || [];
  const starBullets = evaluation.star_bullets_recommended || [];
  const summary = evaluation.audit_summary || '';

  const getScoreColor = (sc) => {
    if (sc >= 80) return { text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
    if (sc >= 60) return { text: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
    return { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
  };

  const scoreColors = getScoreColor(score);

  const handleCopyBullet = (text, idx) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, ''));
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  return (
    <ModalPortal isOpen={Boolean(isOpen && evaluation)}>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '1.5rem 1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={onClose}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden'
        }}
      >
        {/* 1. CABECERA DEL MODAL */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.35)'
              }}
            >
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                  Auditoría de Idoneidad ATS & Recruiter
                </h3>
                <span 
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  Skill Oficial Recruiter
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Candidatura: <strong style={{ color: '#e2e8f0' }}>{application?.role}</strong> en <strong style={{ color: '#38bdf8' }}>{application?.company}</strong>
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. BARRA DE SCORE Y VEREDICTO */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.5) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div 
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: scoreColors.bg,
                border: `2px solid ${scoreColors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 20px ${scoreColors.bg}`
              }}
            >
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: scoreColors.text, lineHeight: 1 }}>
                {score}%
              </span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 }}>
                Match
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span 
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: scoreColors.bg,
                    color: scoreColors.text,
                    border: `1px solid ${scoreColors.border}`
                  }}
                >
                  {verdict}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  • Sin endulzamiento (Zero Sugarcoating)
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', maxWidth: '520px', lineHeight: 1.4 }}>
                {summary || `El CV evaluado presenta una afinidad real del ${score}% contra los requisitos demandados.`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('traffic_light')}
              style={{
                background: activeTab === 'traffic_light' ? '#334155' : 'transparent',
                color: activeTab === 'traffic_light' ? '#fff' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🚦 Semáforo 5s
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('keywords')}
              style={{
                background: activeTab === 'keywords' ? '#334155' : 'transparent',
                color: activeTab === 'keywords' ? '#fff' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔑 Keywords & Gaps
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('star_bullets')}
              style={{
                background: activeTab === 'star_bullets' ? '#334155' : 'transparent',
                color: activeTab === 'star_bullets' ? '#fff' : '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ⭐ Viñetas STAR
            </button>
          </div>
        </div>

        {/* 3. CUERPO SCROLLEABLE SEGÚN PESTAÑA */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* PESTAÑA 1: SEMÁFORO 5 SEGUNDOS */}
          {activeTab === 'traffic_light' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Alertas Rojas */}
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
                  <AlertOctagon size={16} />
                  <span>Alertas Rojas (Riesgo de Descarte Inmediato en Primer Filtro):</span>
                </div>
                {redFlags.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fca5a5', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {redFlags.map((rf, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{rf}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    ✓ No se detectaron alertas rojas bloqueantes para esta candidatura.
                  </div>
                )}
              </div>

              {/* Alertas Ámbar */}
              <div 
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} />
                  <span>Alertas Ámbar (Puntos de Fricción & Falta de Métricas):</span>
                </div>
                {amberFlags.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fde68a', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {amberFlags.map((af, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{af}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    ✓ La estructura de la experiencia y formación es clara y sólida.
                  </div>
                )}
              </div>

              {/* Señales Verdes */}
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Señales Verdes (Diferenciadores Clave Top 10%):</span>
                </div>
                {greenSignals.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#a7f3d0', fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {greenSignals.map((gs, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{gs}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    Sin diferenciadores registrados.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: PALABRAS CLAVE & GAPS */}
          {activeTab === 'keywords' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={15} />
                  <span>Competencias Detectadas & Coincidentes en tu CV ({matchingSkills.length}):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {matchingSkills.length > 0 ? matchingSkills.map((sk, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                        padding: '3px 10px',
                        borderRadius: '14px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ {sk}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No se han detectado coincidencias exactas.</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertOctagon size={15} />
                  <span>Hard Skills Requeridas Faltantes o Débiles (Top Gaps ATS):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {missingHard.length > 0 ? missingHard.map((sk, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        padding: '3px 10px',
                        borderRadius: '14px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      ✗ {sk}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No se detectaron faltantes críticos en hard skills.</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={15} />
                  <span>Soft Skills / Competencias Clave Recomendadas:</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {missingSoft.length > 0 ? missingSoft.map((sk, idx) => (
                    <span 
                      key={idx}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        color: '#93c5fd',
                        padding: '3px 10px',
                        borderRadius: '14px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}
                    >
                      • {sk}
                    </span>
                  )) : (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Soft skills balanceadas.</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA 3: VIÑETAS STAR RECOMENDADAS */}
          {activeTab === 'star_bullets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Viñetas diseñadas con el <strong>Método STAR</strong> (Situación, Tarea, Acción, Resultado) basadas en tu perfil real sin inventar datos, optimizadas para superar filtros ATS y captar la atención de recruiters técnicos:
              </div>

              {starBullets.map((bullet, idx) => (
                <div 
                  key={idx}
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '1rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                      Viñeta STAR #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBullet(bullet, idx)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: copiedBulletIdx === idx ? '#34d399' : '#cbd5e1',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedBulletIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                      {copiedBulletIdx === idx ? 'Copiada' : 'Copiar'}
                    </button>
                  </div>
                  <div 
                    style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}
                    dangerouslySetInnerHTML={{
                      __html: bullet
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #38bdf8;">$1</strong>')
                    }}
                  />
                </div>
              ))}
            </div>
          )}

        </div>

        {/* 4. FOOTER CON ACCIONES DIRECTAS */}
        <div 
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Auditoría guardada en el historial de la candidatura.
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem' }}
            >
              Cerrar
            </button>

            {onOpenA4View && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenA4View(application.id);
                }}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '0.78rem', 
                  padding: '0.45rem 0.95rem',
                  color: '#38bdf8',
                  borderColor: 'rgba(56, 189, 248, 0.4)'
                }}
              >
                <FileText size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Ver CV en Visor A4
              </button>
            )}

            {onAdaptWithAi && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAdaptWithAi(application);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.95rem' }}
              >
                <Sparkles size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Re-adaptar CV con IA
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
    </ModalPortal>
  );
}
