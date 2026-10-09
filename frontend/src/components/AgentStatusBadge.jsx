import React from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function AgentStatusBadge({ status, onOpenSettings }) {
  // status: 'idle' | 'processing' | 'error' | 'blocked'
  const isProcessing = status === 'processing';
  const isError = status === 'error' || status === 'blocked';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.35rem 0.85rem',
        borderRadius: '9999px',
        background: isError ? 'rgba(244, 63, 94, 0.12)' : (isProcessing ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
        border: `1px solid ${isError ? 'rgba(244, 63, 94, 0.35)' : (isProcessing ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)')}`,
        fontSize: '0.8rem',
        fontWeight: 600,
        color: isError ? '#fb7185' : (isProcessing ? '#fbbf24' : '#34d399'),
        transition: 'all 0.3s ease'
      }}
    >
      {/* Indicador de punto: Parpadea en proceso, quieto en reposo o si falló */}
      <span
        style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          backgroundColor: isError ? '#f43f5e' : (isProcessing ? '#f59e0b' : '#10b981'),
          display: 'inline-block',
          animation: isProcessing ? 'agentBlink 0.9s infinite alternate' : 'none',
          boxShadow: isProcessing ? '0 0 10px #f59e0b' : (isError ? '0 0 4px #f43f5e' : '0 0 6px rgba(16, 185, 129, 0.4)')
        }}
      />

      <span>
        {isProcessing && 'Procesando / Navegando...'}
        {!isProcessing && !isError && 'Agente Listo & Activo'}
        {isError && (status === 'blocked' ? 'Agente Bloqueado (Falta Clave)' : 'Agente con Fallo')}
      </span>

      {isError && onOpenSettings && (
        <button
          onClick={onOpenSettings}
          style={{
            background: 'rgba(244, 63, 94, 0.2)',
            border: 'none',
            color: '#fff',
            fontSize: '0.7rem',
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '0.25rem'
          }}
        >
          Resolver ⚙️
        </button>
      )}

      {/* Estilos de animación de parpadeo */}
      <style>{`
        @keyframes agentBlink {
          0% { opacity: 0.2; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </div>
  );
}
