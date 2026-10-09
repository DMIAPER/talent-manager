import React from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Users, 
  Lightbulb,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function RecruiterTrafficLight({ 
  trafficLight = {}, 
  conversionRate = '30%', 
  verdict = '',
  softSkills = []
}) {
  const reds = trafficLight.red_alerts || [];
  const ambers = trafficLight.amber_warnings || [];
  const greens = trafficLight.green_strengths || [];

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.75rem', 
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%)',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}
    >
      {/* 1. CABECERA Y RATIO DE CONVERSIÓN */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f43f5e, #be123c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)'
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Semáforo de Descarte en 5 Segundos (Filtro Recruiter & ATS)
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Criterios de descarte inmediato e impacto visual aplicados por algoritmos ATS y seleccionadores técnicos en su primer cribado.
              </p>
            </div>
          </div>
        </div>

        {/* BADGE DE CONVERSIÓN A ENTREVISTA */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.85rem', 
            background: 'rgba(244, 63, 94, 0.12)', 
            border: '1px solid rgba(244, 63, 94, 0.35)', 
            padding: '8px 16px', 
            borderRadius: '14px',
            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.2)'
          }}
        >
          <Users size={20} color="#fb7185" />
          <div>
            <div style={{ fontSize: '0.68rem', color: '#fda4af', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
              Conversión Estimada a Entrevista
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f43f5e' }}>
              {conversionRate}
            </div>
          </div>
        </div>
      </div>

      {/* 2. VEREDICTO OBJETIVO DEL HEADHUNTER (SI EXISTE) */}
      {verdict && (
        <div 
          style={{ 
            background: 'rgba(0, 0, 0, 0.35)', 
            padding: '1rem 1.25rem', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            color: '#e2e8f0', 
            lineHeight: 1.55,
            borderLeft: '4px solid #6366f1',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
        >
          <Sparkles size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#818cf8', display: 'block', marginBottom: '0.2rem' }}>
              Veredicto Sin Filtros del Headhunter Senior:
            </strong>
            {verdict}
          </div>
        </div>
      )}

      {/* 3. GRID 100% ANCHO: 3 COLUMNAS HORIZONTALES DEL SEMÁFORO */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        {/* 1. ZONA ROJA: DESCARTE INMEDIATO */}
        <div 
          style={{ 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.25)', 
            borderRadius: '14px', 
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
              <AlertOctagon size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                🔴 Descarte Inmediato
              </span>
            </div>
            <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px' }}>
              {reds.length} alertas
            </span>
          </div>

          {reds.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
              ✅ No se detectan señales bloqueantes de descarte inmediato en tu perfil.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#fca5a5', lineHeight: 1.55 }}>
              {reds.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.45rem' }}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {/* 2. ZONA ÁMBAR: PUNTOS DE FRICCIÓN */}
        <div 
          style={{ 
            background: 'rgba(245, 158, 11, 0.05)', 
            border: '1px solid rgba(245, 158, 11, 0.25)', 
            borderRadius: '14px', 
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
              <AlertTriangle size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                🟡 Puntos de Fricción
              </span>
            </div>
            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px' }}>
              {ambers.length} avisos
            </span>
          </div>

          {ambers.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
              ✅ Perfil sin objeciones preliminares ni dudas de encaje.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#fde68a', lineHeight: 1.55 }}>
              {ambers.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.45rem' }}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. ZONA VERDE: FORTALEZAS DIFERENCIALES */}
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.05)', 
            border: '1px solid rgba(16, 185, 129, 0.25)', 
            borderRadius: '14px', 
            padding: '1.15rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
              <CheckCircle size={18} />
              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                🟢 Ventajas Competitivas
              </span>
            </div>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px' }}>
              {greens.length} fortalezas
            </span>
          </div>

          {greens.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>
              Añade proyectos y certificaciones en tu CV para sumar fortalezas diferenciadoras.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#a7f3d0', lineHeight: 1.55 }}>
              {greens.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.45rem' }}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 4. SOFT SKILLS INFERIDAS POR EVIDENCIA (SI EXISTEN) */}
      {softSkills.length > 0 && (
        <div 
          style={{
            marginTop: '0.5rem',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <Lightbulb size={18} color="#eab308" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
              Competencias Interpersonales (Soft Skills) Inferidas por Evidencia Real en el CV:
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {softSkills.map((sk, idx) => (
              <div 
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#38bdf8', marginBottom: '2px' }}>
                  {sk.skill}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  {sk.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
