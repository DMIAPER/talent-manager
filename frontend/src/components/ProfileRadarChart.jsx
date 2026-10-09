import React, { useState } from 'react';
import { Target, Award, Zap, TrendingUp, Compass, Sparkles } from 'lucide-react';

const AXES = [
  { key: 'technical_depth', label: 'Profundidad Técnica', short: 'Hard Skills', icon: Zap },
  { key: 'soft_skills_leadership', label: 'Soft Skills & Liderazgo', short: 'Soft Skills', icon: Target },
  { key: 'official_accreditation', label: 'Formación Oficial', short: 'Acreditación', icon: Award },
  { key: 'quantifiable_impact', label: 'Impacto Cuantificable', short: 'Métricas', icon: TrendingUp },
  { key: 'market_alignment', label: 'Demanda de Mercado', short: 'Mercado', icon: Sparkles },
  { key: 'multidisciplinary_versatility', label: 'Versatilidad 360°', short: 'Versatilidad', icon: Compass },
];

export default function ProfileRadarChart({ metrics = {}, overallScore = 0, style = {} }) {
  const [hoveredAxis, setHoveredAxis] = useState(null);

  // Dimensiones del SVG
  const size = 340;
  const center = size / 2;
  const radius = center - 55;
  const levels = [20, 40, 60, 80, 100];
  const numAxes = AXES.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  // Coordenadas polares a cartesianas
  const getCoordinates = (value, index) => {
    const angle = angleSlice * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Puntos del polígono de datos
  const polygonPoints = AXES.map((axis, i) => {
    const val = metrics[axis.key] || 50;
    const { x, y } = getCoordinates(val, i);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '1.25rem 1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(10, 15, 29, 0.95) 100%)',
        position: 'relative',
        flex: 1,
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Compass size={18} color="#38bdf8" />
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 600 }}>
            Mapa 360° de Competencias del Perfil
          </h4>
        </div>
        <div 
          style={{ 
            background: 'rgba(99, 102, 241, 0.15)', 
            border: '1px solid rgba(99, 102, 241, 0.3)', 
            padding: '3px 10px', 
            borderRadius: '20px', 
            fontSize: '0.8rem', 
            fontWeight: 700, 
            color: '#818cf8' 
          }}
        >
          Índice Global: {overallScore}/100
        </div>
      </div>

      {/* SVG RADAR INTERACTIVO */}
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
            </linearGradient>
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Círculos / Polígonos concéntricos de referencia */}
          {levels.map((lvl) => {
            const levelPoints = AXES.map((_, i) => {
              const { x, y } = getCoordinates(lvl, i);
              return `${x},${y}`;
            }).join(' ');
            return (
              <polygon
                key={lvl}
                points={levelPoints}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray={lvl === 100 ? 'none' : '3,3'}
              />
            );
          })}

          {/* Ejes radiales */}
          {AXES.map((axis, i) => {
            const { x, y } = getCoordinates(100, i);
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono de Datos del Candidato */}
          <polygon
            points={polygonPoints}
            fill="url(#radarFillGrad)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            filter="url(#radarGlow)"
            style={{ transition: 'all 0.5s ease' }}
          />

          {/* Puntos y Vértices */}
          {AXES.map((axis, i) => {
            const val = metrics[axis.key] || 50;
            const { x, y } = getCoordinates(val, i);
            const isHovered = hoveredAxis === axis.key;

            return (
              <g key={axis.key}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 4.5}
                  fill={isHovered ? '#38bdf8' : '#818cf8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseEnter={() => setHoveredAxis(axis.key)}
                  onMouseLeave={() => setHoveredAxis(null)}
                />
              </g>
            );
          })}

          {/* Etiquetas exteriores de los ejes */}
          {AXES.map((axis, i) => {
            const { x, y } = getCoordinates(115, i);
            const isHovered = hoveredAxis === axis.key;
            const val = metrics[axis.key] || 50;

            return (
              <text
                key={`lbl-${axis.key}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isHovered ? '11px' : '9.5px'}
                fontWeight={isHovered ? '700' : '500'}
                fill={isHovered ? '#38bdf8' : '#cbd5e1'}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease', userSelect: 'none' }}
                onMouseEnter={() => setHoveredAxis(axis.key)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                {axis.short} ({val}%)
              </text>
            );
          })}
        </svg>

        {/* Tooltip de eje al pasar el ratón */}
        {hoveredAxis && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #38bdf8',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#f8fafc',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            <strong>{AXES.find(a => a.key === hoveredAxis)?.label}:</strong> {metrics[hoveredAxis] || 50}%
          </div>
        )}
      </div>

      {/* Grid de Píldoras de Competencias */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '0.5rem', 
          width: '100%', 
          marginTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '0.85rem'
        }}
      >
        {AXES.map((axis) => {
          const val = metrics[axis.key] || 50;
          const Icon = axis.icon;
          const isHigh = val >= 75;
          const isMid = val >= 50 && val < 75;

          return (
            <div 
              key={axis.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 8px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <Icon size={12} color={isHigh ? '#34d399' : isMid ? '#38bdf8' : '#f59e0b'} />
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {axis.short}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isHigh ? '#34d399' : isMid ? '#38bdf8' : '#f59e0b' }}>
                  {val}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
