import React, { useRef } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Upload,
  Edit3,
  Loader2,
  FileText
} from 'lucide-react';
import ProfileRadarChart from './ProfileRadarChart';

export default function ProfileAuditDashboard({
  audit,
  auditing,
  uploading,
  onReaudit,
  onOpenEnhancer,
  onOpenEditModal,
  onUploadCv
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadCv) {
      onUploadCv(file);
    }
    e.target.value = '';
  };

  const score = audit?.overall_score || audit?.employability_score || 70;
  const radarMetrics = audit?.radar_metrics || {
    technical_depth: 80,
    soft_skills_leadership: 75,
    official_accreditation: 85,
    quantifiable_impact: 60,
    market_alignment: 80,
    multidisciplinary_versatility: 80
  };
  const timestamp = audit?.timestamp || 'Reciente';
  const roleTarget = audit?.role_target || 'Especialista Técnico';

  return (
    <div 
      className="audit-fields-group" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        height: '100%'
      }}
    >

      {/* 1. HERRAMIENTA DESTACADA DE CARGA DE CV (PDF/WORD) CON IA & EDICIÓN MODAL */}
      <div 
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0284c7, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}
          >
            <Upload size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 800 }}>
              Herramienta de Carga de CV con IA
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Carga tu CV actual en PDF o Word para que la IA extraiga tu experiencia, formación y habilidades, autocompletando tu perfil de inmediato.
            </p>
          </div>
        </div>

        {/* BOTONERA DUAL: SUBIR PDF / RELLENAR MANUALMENTE EN MODAL */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".pdf,.docx,.doc,.txt,.md"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary"
            style={{
              flex: 1,
              minWidth: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0284c7, #2563eb)'
            }}
          >
            {uploading ? <Loader2 size={15} className="spin-anim" /> : <Upload size={15} />}
            <span>{uploading ? 'Procesando CV con IA...' : 'Subir CV (PDF/Word)'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEditModal && onOpenEditModal('personal')}
            className="btn btn-secondary"
            style={{
              flex: 1,
              minWidth: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <Edit3 size={14} color="#38bdf8" />
            <span>Editar Campos (Modal)</span>
          </button>
        </div>
      </div>

      {/* 2. PANEL DE AUDITORÍA PERSISTENTE Y ACCIONES (INFORME DE TALENTO) */}
      {!audit ? (
        <div 
          className="glass-panel"
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.2)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '380px'
          }}
        >
          <div 
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(244, 63, 94, 0.35)'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 800 }}>
            Auditoría de Talento & Semáforos ATS
          </h4>
          <p style={{ margin: '0 auto 1.25rem', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Evalúa tu perfil con el rigor de un Headhunter Senior. Obtén tus semáforos de descarte inmediato, métricas ATS y sugerencias STAR.
          </p>
          <button
            type="button"
            onClick={onReaudit}
            disabled={auditing}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.65rem 1.5rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              boxShadow: '0 6px 20px rgba(244, 63, 94, 0.4)'
            }}
          >
            {auditing ? (
              <>
                <RefreshCw size={16} className="spin-anim" />
                <span>Ejecutando Auditoría...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>🚀 Ejecutar Auditoría con IA</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS DEL AUDITOR: INFORME DE TALENTO */}
          <div 
            className="glass-panel"
            style={{
              padding: '0.9rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              flexShrink: 0
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#f43f5e" />
                <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#f8fafc', fontWeight: 800 }}>
                  Informe de Talento
                </h4>
                <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                  🎯 {roleTarget}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Auditoría del <strong>{timestamp}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={onOpenEnhancer}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.74rem', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                title="Optimizar titular, resumen y viñetas STAR en 1 clic"
              >
                <Sparkles size={12} />
                <span>Optimizar 1 Clic</span>
              </button>

              <button
                type="button"
                onClick={onReaudit}
                disabled={auditing}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.74rem' }}
                title="Ejecutar nueva auditoría con la IA"
              >
                <RefreshCw size={12} className={auditing ? 'spin-anim' : ''} />
                <span>{auditing ? 'Reauditando...' : 'Reauditar'}</span>
              </button>
            </div>
          </div>

          {/* BANNER ANIMADO DE AUDITORÍA EN TIEMPO REAL */}
          {auditing && (
            <div className="ai-processing-glow animate-fade-in" style={{
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="radar-ping" style={{ width: '100%', height: '100%', background: 'rgba(244, 63, 94, 0.4)' }} />
                  <RefreshCw size={16} className="spin-anim" color="#f43f5e" />
                </div>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                    Reauditando perfil con Inteligencia Artificial
                    <span className="thinking-dots" style={{ color: '#f43f5e' }}><span></span><span></span><span></span></span>
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Evaluando consistencia ATS, métricas de impacto y brechas formativas...
                  </span>
                </div>
              </div>
              <div className="progress-indeterminate-track">
                <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #a855f7 50%, #38bdf8 100%)' }} />
              </div>
            </div>
          )}

          {/* RADAR DE COMPETENCIAS COMPACTO */}
          <ProfileRadarChart 
            metrics={radarMetrics}
            overallScore={score}
          />
        </>
      )}
    </div>
  );
}
