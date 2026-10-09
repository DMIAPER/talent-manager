import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  ExternalLink, 
  Lock, 
  RefreshCw, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  Eye
} from 'lucide-react';

const LEVELS = [
  { id: 1, name: 'Reglas & CV', icon: FileText, label: 'Nivel 1: Protocolo de Búsqueda y CV' },
  { id: 2, name: 'Portales IA', icon: Cpu, label: 'Nivel 2: Selección Inteligente de Portales' },
  { id: 3, name: 'Google Live', icon: Search, label: 'Nivel 3: Rastreo en Google en Directo' },
  { id: 4, name: 'Extracción', icon: Globe, label: 'Nivel 4: Inspección de Portales y Extracción' },
  { id: 5, name: 'Scoring ATS', icon: ShieldCheck, label: 'Nivel 5: Análisis ATS y Scoring Final' },
];

export default function AgentBrowserNavigator({ 
  status, 
  steps = [], 
  currentQuery = '', 
  currentLocation = '', 
  currentContract = '',
  elapsedSeconds = 0 
}) {
  // Determinar el nivel activo (1 a 5)
  const [activeLevel, setActiveLevel] = useState(1);
  const [currentUrl, setCurrentUrl] = useState('talent-manager://skills/agente-busqueda-empleo.md');

  // Actualizar nivel según los steps o el estado
  useEffect(() => {
    if (steps && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep.level) {
        setActiveLevel(lastStep.level);
      }
      if (lastStep.url) {
        setCurrentUrl(lastStep.url);
      }
    } else if (status === 'processing') {
      setActiveLevel(1);
      setCurrentUrl(`https://www.google.es/search?q=empleo+${encodeURIComponent(currentQuery)}+${encodeURIComponent(currentLocation)}`);
    } else {
      setActiveLevel(5);
      setCurrentUrl('talent-manager://ats-engine/compatibility-matrix');
    }
  }, [steps, status, currentQuery, currentLocation]);

  const isNavigating = status === 'processing';

  return (
    <div 
      className="glass-panel" 
      style={{ 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(180deg, rgba(20, 24, 38, 0.95) 0%, rgba(13, 16, 26, 0.98) 100%)',
        boxShadow: isNavigating ? '0 8px 32px -4px rgba(99, 102, 241, 0.25)' : '0 8px 24px -4px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* 1. BARRA SUPERIOR DEL NAVEGADOR (CHROME / BROWSER HEADER) */}
      <div 
        style={{ 
          background: 'rgba(15, 19, 32, 0.9)', 
          padding: '0.75rem 1.25rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Controles de ventana y pestaña activa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Botones de ventana macOS style */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#10b981' }} />
          </div>

          {/* Flechas de historial y botón refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
            <button style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', cursor: 'pointer' }} title="Atrás">
              <ArrowLeft size={14} />
            </button>
            <button style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', cursor: 'pointer' }} title="Adelante">
              <ArrowRight size={14} />
            </button>
            <button 
              style={{ background: 'none', border: 'none', color: isNavigating ? '#6366f1' : 'inherit', padding: '4px', cursor: 'pointer' }} 
              className={isNavigating ? 'animate-spin' : ''}
              title="Recargar"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Pestaña de navegación activa */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(30, 41, 59, 0.8)', 
              padding: '4px 12px', 
              borderRadius: '8px 8px 0 0',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: 'none',
              fontSize: '0.8rem',
              color: '#e2e8f0',
              fontWeight: 500
            }}
          >
            <Globe size={13} color="#6366f1" />
            <span>Navegador Autónomo del Agente</span>
            {isNavigating && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#38bdf8' }} className="animate-ping" />
            )}
          </div>
        </div>

        {/* Temporizador y Telemetría */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: isNavigating ? '#38bdf8' : '#94a3b8',
              background: 'rgba(255,255,255,0.05)',
              padding: '3px 9px',
              borderRadius: '20px'
            }}
          >
            <Clock size={12} />
            <span>{isNavigating ? `Buscando: ${elapsedSeconds}s` : `Finalizado`}</span>
          </div>

          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px', 
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 9px',
              borderRadius: '20px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <Lock size={11} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Zero-Fabrication Guard</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE URL ACTIVA (OMNIBOX) */}
      <div 
        style={{ 
          background: 'rgba(10, 13, 22, 0.95)', 
          padding: '0.6rem 1.25rem', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem' 
        }}
      >
        <div 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#cbd5e1',
            fontSize: '0.82rem',
            fontFamily: 'monospace'
          }}
        >
          <Lock size={12} color="#10b981" />
          <span style={{ color: '#64748b' }}>https://</span>
          <span style={{ color: '#38bdf8', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUrl.replace('https://', '')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 600 }}>
            Nivel {activeLevel} de 5
          </span>
        </div>
      </div>

      {/* BARRA DE PROGRESO DE CARGA DINÁMICA DEL NAVEGADOR AUTÓNOMO */}
      {isNavigating && (
        <div className="progress-indeterminate-track" style={{ height: 3, borderRadius: 0, background: 'rgba(255,255,255,0.03)' }}>
          <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 50%, #10b981 100%)' }} />
        </div>
      )}

      {/* 3. STEPPER VISUAL DE 5 NIVELES DE NAVEGACIÓN */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '0.5rem',
          padding: '1rem 1.25rem',
          background: 'rgba(18, 22, 36, 0.7)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {LEVELS.map((lvl) => {
          const isDone = lvl.id < activeLevel || (!isNavigating && activeLevel === 5);
          const isCurrent = lvl.id === activeLevel && isNavigating;
          const isPending = lvl.id > activeLevel;
          const Icon = lvl.icon;

          return (
            <div 
              key={lvl.id}
              className={isCurrent ? 'ai-processing-glow' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: isCurrent 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))' 
                  : isDone 
                  ? 'rgba(16, 185, 129, 0.08)' 
                  : 'rgba(255, 255, 255, 0.02)',
                border: isCurrent 
                  ? '1px solid #6366f1' 
                  : isDone 
                  ? '1px solid rgba(16, 185, 129, 0.25)' 
                  : '1px solid rgba(255, 255, 255, 0.04)',
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isDone 
                    ? '#10b981' 
                    : isCurrent 
                    ? '#6366f1' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
                className={isCurrent ? 'animate-pulse' : ''}
              >
                {isDone ? <CheckCircle2 size={14} /> : lvl.id}
              </div>

              <div style={{ overflow: 'hidden' }}>
                <div style={{ 
                  fontSize: '0.78rem', 
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#38bdf8' : isDone ? '#10b981' : '#64748b',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {lvl.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: isCurrent ? '#94a3b8' : '#64748b' }}>
                  {isCurrent ? 'En curso...' : isDone ? 'Completado' : 'Pendiente'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. CONSOLA DE TELEMETRÍA Y EVENTOS DE NAVEGACIÓN EN TIEMPO REAL */}
      <div style={{ padding: '1rem 1.25rem', maxHeight: '180px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Registro de Navegación Web del Agente:</span>
          <span>{steps.length} eventos registrados</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {steps.map((st, i) => (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '8px', 
                fontSize: '0.8rem',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '6px 10px',
                borderRadius: '8px',
                borderLeft: `3px solid ${st.level === 5 || st.type === 'complete' ? '#10b981' : st.type === 'error' ? '#ef4444' : '#6366f1'}`
              }}
            >
              <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.72rem', minWidth: '55px' }}>
                {st.time || '00:00:00'}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, color: '#e2e8f0', marginRight: '6px' }}>
                  {st.title}:
                </span>
                <span style={{ color: '#cbd5e1' }}>
                  {st.detail}
                </span>
                {st.url && (
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '2px', fontFamily: 'monospace' }}>
                    🔗 {st.url}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isNavigating && (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '6px 10px', 
                color: '#38bdf8', 
                fontSize: '0.8rem',
                fontStyle: 'italic'
              }}
              className="animate-pulse"
            >
              <RefreshCw size={12} className="animate-spin" />
              <span>Navegando y extrayendo datos con el motor IA...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
