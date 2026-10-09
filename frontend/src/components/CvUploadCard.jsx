import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function CvUploadCard({ onCvUpdated }) {
  const [cvInfo, setCvInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const fetchCvInfo = async () => {
    try {
      const data = await api.getCurrentCv();
      setCvInfo(data);
    } catch (e) {
      console.error('Error cargando información de CV:', e);
    }
  };

  useEffect(() => {
    fetchCvInfo();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadCv(file);
      alert(res.message);
      await fetchCvInfo();
      if (onCvUpdated) onCvUpdated();
    } catch (err) {
      alert(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.65)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Currículum Vitae (Fuente de Verdad)</h4>
              {cvInfo?.exists ? (
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                  <CheckCircle2 size={10} /> Activo (cv-maestro.md)
                </span>
              ) : (
                <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>
                  <AlertCircle size={10} /> Sin CV cargado
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {cvInfo?.exists
                ? `Texto extraído en plano: ${cvInfo.char_count} caracteres. Sin consumo de tokens.`
                : 'Sube tu CV en PDF o Word (.docx) para que la IA diagnostique tu perfil.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {cvInfo?.exists && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPreview(!showPreview)}
              style={{ fontSize: '0.75rem' }}
            >
              {showPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{showPreview ? 'Ocultar Texto' : 'Ver Texto Extraído'}</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.md"
            style={{ display: 'none' }}
          />

          <button
            className="btn btn-primary btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ fontSize: '0.75rem', padding: '0.45rem 0.9rem' }}
          >
            {uploading ? <Loader2 size={13} className="spin-anim" /> : <Upload size={13} />}
            <span>{uploading ? 'Convirtiendo...' : (cvInfo?.exists ? 'Actualizar CV (PDF/Word)' : 'Subir mi CV (PDF/Word)')}</span>
          </button>
        </div>
      </div>

      {/* Vista previa colapsable del texto plano */}
      {showPreview && cvInfo?.content && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', fontSize: '0.785rem', color: '#cbd5e1', lineHeight: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {cvInfo.content}
          </div>
        </div>
      )}
    </div>
  );
}
