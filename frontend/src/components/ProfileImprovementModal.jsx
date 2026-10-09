import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  Briefcase, 
  FileText, 
  Tag, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function ProfileImprovementModal({
  audit,
  onClose,
  onEnhancementsApplied
}) {
  const actionable = audit?.actionable_improvements || {};
  const headlineData = actionable.headline || {};
  const summaryData = actionable.summary || {};
  const expImprovements = actionable.experience_improvements || [];
  const missingSkills = actionable.missing_skills_to_add || [];

  // Estados de selección granular (por defecto todos seleccionados para máxima comodidad)
  const [applyHeadline, setApplyHeadline] = useState(Boolean(headlineData.suggested));
  const [applySummary, setApplySummary] = useState(Boolean(summaryData.suggested));
  
  // Mapa de IDs de experiencias seleccionadas
  const [selectedExpIds, setSelectedExpIds] = useState(() => {
    const initial = {};
    expImprovements.forEach(exp => {
      if (exp.id) initial[exp.id] = true;
    });
    return initial;
  });

  // Lista de skills seleccionadas
  const [selectedSkills, setSelectedSkills] = useState(() => [...missingSkills]);

  const [applying, setApplying] = useState(false);

  // Contador de elementos seleccionados
  const expCountSelected = Object.values(selectedExpIds).filter(Boolean).length;
  const totalSelected = (applyHeadline ? 1 : 0) + (applySummary ? 1 : 0) + expCountSelected + (selectedSkills.length > 0 ? 1 : 0);

  const toggleExpSelection = (id) => {
    setSelectedExpIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleSkillSelection = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleApply = async () => {
    if (totalSelected === 0) {
      alert('Por favor selecciona al menos una mejora para aplicar.');
      return;
    }

    setApplying(true);
    try {
      // Filtrar experiencias que estén seleccionadas
      const experienceUpdates = expImprovements
        .filter(exp => selectedExpIds[exp.id])
        .map(exp => ({
          id: exp.id,
          highlights: exp.suggested_highlights
        }));

      const payload = {
        apply_headline: applyHeadline,
        suggested_headline: headlineData.suggested,
        apply_summary: applySummary,
        suggested_summary: summaryData.suggested,
        apply_experiences: expCountSelected > 0,
        experience_updates: experienceUpdates,
        apply_skills: selectedSkills.length > 0,
        skills_to_add: selectedSkills
      };

      const res = await api.applyProfileEnhancements(payload);
      if (onEnhancementsApplied) {
        onEnhancementsApplied(res);
      }
      onClose();
    } catch (e) {
      console.error('Error aplicando mejoras:', e);
      alert('Error aplicando mejoras al perfil: ' + e.message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(audit)}>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '1.5rem 1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div 
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '960px',
            maxHeight: '92vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 800 }}>
                Herramienta de Optimización Asistida ("1-Click Enhancer")
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Revisa las propuestas de mejora generadas por la IA y aplícalas directamente a tu CV Maestro con un solo clic.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. TITULAR PROFESIONAL */}
          {headlineData.suggested && (
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: applyHeadline ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.25rem',
                transition: 'border 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                    1. Titular Profesional (Headline)
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: applyHeadline ? '#34d399' : '#94a3b8' }}>
                  <input 
                    type="checkbox"
                    checked={applyHeadline}
                    onChange={(e) => setApplyHeadline(e.target.checked)}
                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span>Aplicar cambio</span>
                </label>
              </div>

              {headlineData.reason && (
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  💡 {headlineData.reason}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                    Antes (Actual)
                  </span>
                  <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '4px' }}>
                    {headlineData.current || '(Sin titular definido)'}
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    Propuesta Optimizada IA
                  </span>
                  <div style={{ fontSize: '0.84rem', color: '#ecfdf5', fontWeight: 600, marginTop: '4px' }}>
                    {headlineData.suggested}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. RESUMEN EJECUTIVO */}
          {summaryData.suggested && (
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: applySummary ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.25rem',
                transition: 'border 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#a855f7" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                    2. Resumen Ejecutivo de Impacto
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: applySummary ? '#34d399' : '#94a3b8' }}>
                  <input 
                    type="checkbox"
                    checked={applySummary}
                    onChange={(e) => setApplySummary(e.target.checked)}
                    style={{ accentColor: '#10b981', cursor: 'pointer' }}
                  />
                  <span>Aplicar cambio</span>
                </label>
              </div>

              {summaryData.reason && (
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  💡 {summaryData.reason}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                    Antes (Actual)
                  </span>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.5 }}>
                    {summaryData.current || '(Sin resumen definido)'}
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                    Propuesta con Propuesta de Valor y Métricas
                  </span>
                  <div style={{ fontSize: '0.82rem', color: '#ecfdf5', marginTop: '4px', lineHeight: 1.5 }}>
                    {summaryData.suggested}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. EXPERIENCIAS LABORALES (FORMATO STAR) */}
          {expImprovements.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={18} color="#f59e0b" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  3. Experiencias Laborales: Transformación al Método STAR / Google XYZ
                </span>
              </div>

              {expImprovements.map((exp, idx) => {
                const isSelected = Boolean(selectedExpIds[exp.id]);
                return (
                  <div 
                    key={exp.id || idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: isSelected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      transition: 'border 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>
                        {exp.role} en <strong style={{ color: '#fbbf24' }}>{exp.company}</strong>
                      </span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: isSelected ? '#34d399' : '#94a3b8' }}>
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExpSelection(exp.id)}
                          style={{ accentColor: '#10b981', cursor: 'pointer' }}
                        />
                        <span>Optimizar esta experiencia</span>
                      </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1rem' }}>
                      <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                          Redacción Pasiva Actual
                        </span>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                          {exp.current_highlights?.map((h, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{h}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                          Viñetas Cuantificadas STAR (Impacto y Medidas)
                        </span>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#ecfdf5', lineHeight: 1.45 }}>
                          {exp.suggested_highlights?.map((h, i) => (
                            <li key={i} style={{ marginBottom: '4px' }}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. HABILIDADES CLAVE FALTANTES */}
          {missingSkills.length > 0 && (
            <div 
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: selectedSkills.length > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                <Tag size={18} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                  4. Habilidades y Palabras Clave Demandadas por Ofertas Reales
                </span>
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Selecciona las tecnologías que dominas o estás integrando para incorporarlas a tus competencias y superar los filtros ATS:
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {missingSkills.map((sk, idx) => {
                  const isChecked = selectedSkills.includes(sk);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSkillSelection(sk)}
                      style={{
                        background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: isChecked ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isChecked ? '#34d399' : '#cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        readOnly 
                        style={{ accentColor: '#10b981', cursor: 'pointer' }} 
                      />
                      <span>{sk}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Barra de Acciones Inferior */}
        <div 
          style={{
            padding: '1.15rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              Mejoras seleccionadas: <strong style={{ color: '#10b981' }}>{totalSelected}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              disabled={applying}
            >
              Cancelar
            </button>

            <button 
              type="button"
              onClick={handleApply}
              disabled={applying || totalSelected === 0}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {applying ? (
                <>
                  <Loader2 size={16} className="spin-anim" />
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    Aplicando y Reevaluando CV Maestro
                    <span className="thinking-dots"><span></span><span></span><span></span></span>
                  </span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Aplicar y Reevaluar CV Maestro ({totalSelected})</span>
                </>
              )}
            </button>
          </div>

          {applying && (
            <div className="progress-indeterminate-track" style={{ marginTop: '0.65rem' }}>
              <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #818cf8 100%)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
