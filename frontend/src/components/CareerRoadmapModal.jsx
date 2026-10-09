import React from 'react';
import { Layers, X } from 'lucide-react';
import CareerRoadmapView from './CareerRoadmapView';
import ModalPortal from './ModalPortal';

export default function CareerRoadmapModal({
  isOpen,
  audit,
  onClose,
  onAuditUpdated
}) {
  if (!isOpen || !audit) return null;

  return (
    <ModalPortal isOpen={Boolean(isOpen && audit)}>
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
            maxWidth: '1020px',
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
        {/* Cabecera del Modal */}
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
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 800 }}>
                Visualización del Roadmap de Empleabilidad
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Plan de acción guiado y personalizado para cerrar la brecha con las ofertas más demandadas de tu sector.
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

        {/* Cuerpo del Modal con el Roadmap interactivo */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          <CareerRoadmapView 
            audit={audit}
            onAuditUpdated={onAuditUpdated}
          />
        </div>

        {/* Pie del Modal */}
        <div 
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <button 
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', background: '#6366f1' }}
          >
            Cerrar Roadmap
          </button>
        </div>
      </div>
    </ModalPortal>
  );
}
