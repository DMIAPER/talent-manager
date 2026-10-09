import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  TreePine, 
  CheckCircle2, 
  Award, 
  Flame,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export default function CareerGrowthTree({
  totalSteps = 0,
  completedSteps = 0,
  verifiedSteps = 0,
  phases = []
}) {
  const [visualMode, setVisualMode] = useState('tree'); // 'tree' | 'brain'

  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const verifiedPercentage = totalSteps > 0 ? Math.round((verifiedSteps / totalSteps) * 100) : 0;

  // Niveles de Gamificación
  const getLevelInfo = (pct) => {
    if (pct >= 85) {
      return {
        level: 4,
        title: 'Mente Maestra / Top del Mercado',
        badge: '🧠✨ Nivel 4: Senior Master',
        color: '#10b981',
        description: 'Tus competencias abarcan la totalidad del roadmap exigido por las ofertas más cotizadas.'
      };
    }
    if (pct >= 55) {
      return {
        level: 3,
        title: 'Árbol Fuerte / Perfil Consolidado',
        badge: '🌳 Nivel 3: Consolidado',
        color: '#38bdf8',
        description: 'Bifurcaciones principales activadas. Tu perfil supera el filtro técnico del 80% de vacantes.'
      };
    }
    if (pct >= 25) {
      return {
        level: 2,
        title: 'Brote en Expansión',
        badge: '🌿 Nivel 2: Crecimiento Activo',
        color: '#818cf8',
        description: 'Primeras sinapsis conectadas. Los hitos iniciales refuerzan tu experiencia técnica.'
      };
    }
    return {
      level: 1,
      title: 'Semilla Inicial',
      badge: '🌱 Nivel 1: Fase Semilla',
      color: '#f59e0b',
      description: 'Inicia los primeros hitos para regar el árbol y conectar las neuronas de tu carrera.'
    };
  };

  const levelInfo = getLevelInfo(progress);

  return (
    <div 
      className="glass-panel"
      style={{
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)'
      }}
    >
      {/* 1. CABECERA CON STATS GAMIFICADAS Y CONMUTADOR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '4px' }}>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(255,255,255,0.08)', 
                color: levelInfo.color, 
                border: `1px solid ${levelInfo.color}40`,
                fontWeight: 700,
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Flame size={13} color={levelInfo.color} />
              {levelInfo.badge}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              • {completedSteps} de {totalSteps} hitos conquistados
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 800 }}>
            {levelInfo.title} ({progress}%)
          </h4>
        </div>

        {/* SELECTOR MODO ÁRBOL / MODO CEREBRO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => setVisualMode('tree')}
            style={{
              background: visualMode === 'tree' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              border: visualMode === 'tree' ? '1px solid #38bdf8' : 'none',
              color: visualMode === 'tree' ? '#38bdf8' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <TreePine size={13} />
            <span>Árbol</span>
          </button>
          <button
            type="button"
            onClick={() => setVisualMode('brain')}
            style={{
              background: visualMode === 'brain' ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
              border: visualMode === 'brain' ? '1px solid #a855f7' : 'none',
              color: visualMode === 'brain' ? '#c084fc' : '#94a3b8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Brain size={13} />
            <span>Cerebro</span>
          </button>
        </div>
      </div>

      {/* 2. LIENZO ORGÁNICO SVG */}
      <div 
        style={{
          width: '100%',
          height: '220px',
          background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow de fondo que se expande con el progreso */}
        <div 
          style={{
            position: 'absolute',
            width: `${Math.max(60, progress * 2.5)}px`,
            height: `${Math.max(60, progress * 2.5)}px`,
            borderRadius: '50%',
            background: visualMode === 'tree' 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%)',
            filter: 'blur(16px)',
            pointerEvents: 'none',
            transition: 'all 0.5s ease'
          }}
        />

        {visualMode === 'tree' ? (
          /* SVG ÁRBOL DE CRECIMIENTO ORGÁNICO */
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', maxHeight: '200px' }}>
            <defs>
              <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor={progress > 20 ? '#10b981' : '#475569'} />
              </linearGradient>
              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <filter id="glowTree" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Suelo / Raíces */}
            <path d="M 120 185 Q 200 175 280 185" stroke="#334155" strokeWidth="3" fill="none" />
            <path d="M 180 180 Q 200 195 220 180" stroke="#475569" strokeWidth="2" fill="none" opacity="0.6" />

            {/* Tronco Central */}
            <path 
              d="M 195 180 Q 198 130 190 90 Q 200 100 205 180 Z" 
              fill="url(#trunkGrad)" 
              stroke="#1e293b" 
              strokeWidth="1.5" 
            />

            {/* Ramal Izquierdo (Fase 1: Inmediata) */}
            <path 
              d="M 192 120 Q 150 105 110 95" 
              stroke={progress >= 25 ? '#10b981' : '#475569'} 
              strokeWidth={progress >= 25 ? "3" : "2"} 
              fill="none" 
              strokeLinecap="round"
              filter={progress >= 25 ? "url(#glowTree)" : undefined}
            />
            {/* Ramal Derecho (Fase 2: Proyectos) */}
            <path 
              d="M 196 110 Q 240 95 285 85" 
              stroke={progress >= 50 ? '#38bdf8' : '#475569'} 
              strokeWidth={progress >= 50 ? "3" : "2"} 
              fill="none" 
              strokeLinecap="round"
              filter={progress >= 50 ? "url(#glowTree)" : undefined}
            />
            {/* Ramal Superior (Fase 3: Acreditación) */}
            <path 
              d="M 194 90 Q 185 60 170 35" 
              stroke={progress >= 75 ? '#a855f7' : '#475569'} 
              strokeWidth={progress >= 75 ? "3" : "2"} 
              fill="none" 
              strokeLinecap="round"
              filter={progress >= 75 ? "url(#glowTree)" : undefined}
            />
            <path 
              d="M 194 85 Q 215 55 235 38" 
              stroke={progress >= 85 ? '#ec4899' : '#475569'} 
              strokeWidth={progress >= 85 ? "3" : "2"} 
              fill="none" 
              strokeLinecap="round"
              filter={progress >= 85 ? "url(#glowTree)" : undefined}
            />

            {/* Brotes / Hojas Orgánicas según progreso */}
            {/* Hojas Izquierda */}
            <circle cx="110" cy="95" r={progress >= 25 ? "7" : "4"} fill={progress >= 25 ? "#10b981" : "#334155"} filter={progress >= 25 ? "url(#glowTree)" : undefined} />
            <circle cx="130" cy="80" r={progress >= 35 ? "6" : "3"} fill={progress >= 35 ? "#34d399" : "#334155"} />
            <circle cx="90" cy="90" r={progress >= 40 ? "6" : "3"} fill={progress >= 40 ? "#059669" : "#334155"} />

            {/* Hojas Derecha */}
            <circle cx="285" cy="85" r={progress >= 50 ? "7" : "4"} fill={progress >= 50 ? "#38bdf8" : "#334155"} filter={progress >= 50 ? "url(#glowTree)" : undefined} />
            <circle cx="260" cy="70" r={progress >= 60 ? "6" : "3"} fill={progress >= 60 ? "#0284c7" : "#334155"} />
            <circle cx="310" cy="80" r={progress >= 65 ? "6" : "3"} fill={progress >= 65 ? "#7dd3fc" : "#334155"} />

            {/* Hojas Corona Superior */}
            <circle cx="170" cy="35" r={progress >= 75 ? "8" : "4"} fill={progress >= 75 ? "#a855f7" : "#334155"} filter={progress >= 75 ? "url(#glowTree)" : undefined} />
            <circle cx="235" cy="38" r={progress >= 85 ? "8" : "4"} fill={progress >= 85 ? "#f43f5e" : "#334155"} filter={progress >= 85 ? "url(#glowTree)" : undefined} />
            <circle cx="202" cy="22" r={progress >= 95 ? "9" : "5"} fill={progress >= 95 ? "#fbbf24" : "#334155"} filter={progress >= 95 ? "url(#glowTree)" : undefined} />

            {/* Flores de Verificación con Quiz Superado */}
            {verifiedSteps > 0 && (
              <g transform="translate(198, 20)">
                <circle cx="0" cy="0" r="11" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3,3" />
                <circle cx="0" cy="0" r="4" fill="#fbbf24" />
              </g>
            )}
          </svg>
        ) : (
          /* SVG CEREBRO NEURONAL MULTIDISCIPLINAR */
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', maxHeight: '200px' }}>
            <defs>
              <filter id="glowBrain" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Silueta de Lóbulos Cerebrales */}
            <path 
              d="M 140 100 Q 130 50 170 40 Q 200 45 200 70 Q 200 45 230 40 Q 270 50 260 100 Q 270 145 235 155 Q 200 150 200 130 Q 200 150 165 155 Q 130 145 140 100 Z" 
              fill="rgba(255, 255, 255, 0.02)" 
              stroke={progress > 10 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'} 
              strokeWidth="1.5" 
              strokeDasharray={progress > 50 ? "none" : "4,4"}
            />

            {/* Sinapsis / Conexiones Neuronales (Líneas reactivas) */}
            <line x1="165" y1="65" x2="200" y2="85" stroke={progress >= 20 ? "#818cf8" : "#334155"} strokeWidth={progress >= 20 ? "2" : "1"} />
            <line x1="235" y1="65" x2="200" y2="85" stroke={progress >= 40 ? "#a855f7" : "#334155"} strokeWidth={progress >= 40 ? "2" : "1"} />
            <line x1="150" y1="105" x2="180" y2="120" stroke={progress >= 60 ? "#38bdf8" : "#334155"} strokeWidth={progress >= 60 ? "2" : "1"} />
            <line x1="250" y1="105" x2="220" y2="120" stroke={progress >= 75 ? "#34d399" : "#334155"} strokeWidth={progress >= 75 ? "2" : "1"} />
            <line x1="180" y1="120" x2="200" y2="140" stroke={progress >= 85 ? "#ec4899" : "#334155"} strokeWidth={progress >= 85 ? "2" : "1"} />
            <line x1="220" y1="120" x2="200" y2="140" stroke={progress >= 85 ? "#ec4899" : "#334155"} strokeWidth={progress >= 85 ? "2" : "1"} />

            {/* Nodos Sinápticos que se iluminan */}
            <circle cx="165" cy="65" r={progress >= 20 ? "6" : "3.5"} fill={progress >= 20 ? "#818cf8" : "#475569"} filter={progress >= 20 ? "url(#glowBrain)" : undefined} />
            <circle cx="235" cy="65" r={progress >= 40 ? "6" : "3.5"} fill={progress >= 40 ? "#a855f7" : "#475569"} filter={progress >= 40 ? "url(#glowBrain)" : undefined} />
            <circle cx="200" cy="85" r={progress >= 50 ? "7" : "4"} fill={progress >= 50 ? "#38bdf8" : "#475569"} filter={progress >= 50 ? "url(#glowBrain)" : undefined} />
            <circle cx="150" cy="105" r={progress >= 60 ? "6" : "3.5"} fill={progress >= 60 ? "#34d399" : "#475569"} filter={progress >= 60 ? "url(#glowBrain)" : undefined} />
            <circle cx="250" cy="105" r={progress >= 75 ? "6" : "3.5"} fill={progress >= 75 ? "#fbbf24" : "#475569"} filter={progress >= 75 ? "url(#glowBrain)" : undefined} />
            <circle cx="180" cy="120" r={progress >= 80 ? "6" : "3.5"} fill={progress >= 80 ? "#ec4899" : "#475569"} filter={progress >= 80 ? "url(#glowBrain)" : undefined} />
            <circle cx="220" cy="120" r={progress >= 85 ? "6" : "3.5"} fill={progress >= 85 ? "#f43f5e" : "#475569"} filter={progress >= 85 ? "url(#glowBrain)" : undefined} />
            <circle cx="200" cy="140" r={progress >= 90 ? "8" : "4"} fill={progress >= 90 ? "#10b981" : "#475569"} filter={progress >= 90 ? "url(#glowBrain)" : undefined} />
          </svg>
        )}

        {/* Badge flotante en esquina */}
        <div 
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Sparkles size={11} color={levelInfo.color} />
          <span>{verifiedSteps} competencias verificadas con Flash-Quiz</span>
        </div>
      </div>

      {/* 3. BARRA DE ENERGÍA Y DESCRIPCIÓN */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '0.75rem' }}>
          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Vitalidad de Carrera (Progreso Total)</span>
          <span style={{ color: levelInfo.color, fontWeight: 800 }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: `linear-gradient(90deg, #38bdf8 0%, ${levelInfo.color} 100%)`,
              borderRadius: '10px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
        </div>
        <p style={{ margin: '0.45rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
          {levelInfo.description}
        </p>
      </div>
    </div>
  );
}
