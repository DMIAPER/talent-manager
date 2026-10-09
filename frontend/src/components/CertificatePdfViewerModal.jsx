import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Award, 
  GraduationCap, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Building2,
  Loader2,
  Maximize2
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import { api } from '../services/api';

export default function CertificatePdfViewerModal({
  isOpen,
  onClose,
  certificate = null
}) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  if (!isOpen || !certificate) return null;

  const title = certificate.title || certificate.degree || certificate.name || 'Certificado / Titulación';
  const institution = certificate.institution || certificate.issuer || certificate.center || '';
  const year = certificate.end_year || certificate.year || certificate.date || '';
  const hours = certificate.hours_or_ects || certificate.hours || '';
  const degreeTypeLabel = certificate.degree_type_label || (certificate.is_official ? 'Titulación Oficial' : 'Certificación');
  const isVerified = certificate.is_verified ?? true;

  const fileKey = certificate.certificate_file || certificate.certificate_url || '';
  const viewUrl = api.getCertificateViewUrl(fileKey);
  const downloadUrl = api.getCertificateDownloadUrl(fileKey);

  const cleanFilename = String(fileKey).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') || 'certificado.pdf';

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(10, 15, 29, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '1120px',
            height: '92vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(24, 33, 56, 0.98))',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 25px 65px rgba(0, 0, 0, 0.75)',
            overflow: 'hidden'
          }}
        >
          {/* CABECERA SUPERIOR */}
          <div
            style={{
              padding: '1.1rem 1.6rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              flexShrink: 0
            }}
          >
            {/* Información del Título / Certificado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '240px', flex: 1 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.25))',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {certificate.degree ? (
                  <GraduationCap size={22} color="#38bdf8" />
                ) : (
                  <Award size={22} color="#fbbf24" />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      color: '#f8fafc',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '520px'
                    }}
                    title={title}
                  >
                    {title}
                  </h3>

                  {isVerified && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <ShieldCheck size={11} />
                      Acreditado Oficial
                    </span>
                  )}

                  {degreeTypeLabel && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#7dd3fc',
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                      }}
                    >
                      {degreeTypeLabel}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    marginTop: '3px',
                    flexWrap: 'wrap'
                  }}
                >
                  {institution && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Building2 size={12} color="#cbd5e1" />
                      {institution}
                    </span>
                  )}
                  {year && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} color="#cbd5e1" />
                      {year}
                    </span>
                  )}
                  {hours && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} color="#cbd5e1" />
                      {hours}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones: Descargar, Abrir en pestaña, Cerrar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
              {/* BOTÓN DESCARGAR DIRECTA */}
              <a
                href={downloadUrl}
                download={cleanFilename}
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  padding: '7px 14px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
                title="Descargar documento PDF original"
              >
                <Download size={14} />
                <span>Descargar PDF</span>
              </a>

              {/* BOTÓN ABRIR PESTAÑA */}
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.8rem',
                  padding: '7px 12px',
                  textDecoration: 'none'
                }}
                title="Abrir visor completo en nueva pestaña"
              >
                <ExternalLink size={14} />
                <span className="hide-on-mobile">Nueva pestaña</span>
              </a>

              {/* BOTÓN CERRAR */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#f87171';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
                title="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ÁREA PRINCIPAL: VISOR PDF */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              background: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* SPINNER DE CARGA */}
            {iframeLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(15, 23, 42, 0.9)',
                  zIndex: 10,
                  gap: '0.85rem'
                }}
              >
                <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
                  <Loader2 size={30} className="spin-anim" style={{ color: '#38bdf8' }} />
                </div>
                <span style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  Cargando documento PDF del certificado
                  <span className="thinking-dots" style={{ color: '#38bdf8' }}><span></span><span></span><span></span></span>
                </span>
              </div>
            )}

            {/* IFRAME VISOR EMBEBIDO */}
            {!loadError ? (
              <iframe
                src={`${viewUrl}#toolbar=1&navpanes=0`}
                title={`Certificado: ${title}`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#1e293b'
                }}
                onLoad={() => setIframeLoading(false)}
                onError={() => {
                  setIframeLoading(false);
                  setLoadError(true);
                }}
              />
            ) : (
              /* FALLBACK EN CASO DE ERROR DE RENDERIZADO DEL NAVEGADOR */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  gap: '1rem'
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '16px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={32} color="#38bdf8" />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                  Visualización de PDF directa
                </h4>
                <p style={{ margin: 0, maxWidth: '420px', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  El navegador requiere abrir el visor en ventana completa o descargarlo directamente a tu equipo.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <a
                    href={downloadUrl}
                    download={cleanFilename}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={15} />
                    <span>Descargar {cleanFilename}</span>
                  </a>
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ExternalLink size={15} />
                    <span>Abrir en nueva ventana</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* PIE DE PÁGINA INFORMATIVO */}
          <div
            style={{
              padding: '0.65rem 1.6rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '0.5rem',
              flexShrink: 0
            }}
          >
            <span>
              Archivo: <strong style={{ color: '#94a3b8' }}>{cleanFilename}</strong>
            </span>
            <span>
              Talent Manager Pro • Almacenamiento Criptográfico Seguro en Disco
            </span>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
