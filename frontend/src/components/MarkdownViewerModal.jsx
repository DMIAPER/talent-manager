import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, Code } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ModalPortal from './ModalPortal';

export default function MarkdownViewerModal({ isOpen, onClose, markdownContent = '', title = 'Informe de Auditoría', profileData = null }) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'raw'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_talento_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!profileData) return;
    const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perfil_cv_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '1.5rem 1rem'
        }}
        onClick={onClose}
      >
        <div 
          className="glass-panel" 
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Cabecera del Visor */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={20} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 600 }}>
              {title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Pestañas Preview / Raw */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => setActiveTab('preview')}
                style={{
                  background: activeTab === 'preview' ? '#6366f1' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Vista Previa
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                style={{
                  background: activeTab === 'raw' ? '#6366f1' : 'transparent',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Markdown Raw
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'rgba(10, 14, 26, 0.95)' }}>
          {activeTab === 'preview' ? (
            markdownContent ? (
              <MarkdownRenderer content={markdownContent} />
            ) : (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
                No hay contenido para mostrar.
              </div>
            )
          ) : (
            <textarea
              readOnly
              value={markdownContent}
              style={{
                width: '100%',
                height: '400px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                padding: '1rem',
                resize: 'none'
              }}
            />
          )}
        </div>

        {/* Barra de Acciones y Descarga */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
            >
              {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {profileData && (
              <button
                onClick={handleDownloadJson}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Code size={14} color="#38bdf8" />
                <span>Descargar Perfil (.json)</span>
              </button>
            )}

            <button
              onClick={handleDownloadMarkdown}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 14px' }}
            >
              <Download size={14} />
              <span>Descargar Informe (.md)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
