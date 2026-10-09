import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Github, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  Sparkles, 
  Edit3, 
  Printer, 
  FileText, 
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Camera,
  Download,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import CertificatePdfViewerModal from './CertificatePdfViewerModal';

export default function SimulatedCvPreview({
  profile,
  onOpenEditModal,
  onOpenPrintModal,
  onOpenMarkdownModal,
  customHeight
}) {
  const [selectedCertForViewer, setSelectedCertForViewer] = useState(null);
  const pInfo = profile?.personal_info || {};
  const experiences = profile?.work_experience || [];
  const educations = profile?.education || [];
  const certs = profile?.certifications || [];
  const hardSkills = Array.isArray(profile?.hard_skills) ? profile.hard_skills : [];
  const toolsAndTech = Array.isArray(profile?.tools_and_tech) ? profile.tools_and_tech : [];
  const softSkills = Array.isArray(profile?.soft_skills) ? profile.soft_skills : [];
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];

  const hasName = Boolean(pInfo.full_name && pInfo.full_name.trim());
  const avatarUrl = pInfo.avatar_url || pInfo.photo_url || null;

  // Iniciales para el fallback
  const getInitials = (name) => {
    if (!name) return 'CV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div 
      className="glass-panel simulated-cv-card" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.35)',
        position: 'relative',
        height: customHeight ? `${customHeight}px` : '100%',
        maxHeight: customHeight ? `${customHeight}px` : '100%'
      }}
    >
      {/* 1. BARRA SUPERIOR DE ACCIONES DEL CV MAESTRO */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(30, 41, 59, 0.5)',
          flexWrap: 'wrap',
          gap: '0.5rem',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className="badge badge-emerald" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '5px',
              fontSize: '0.72rem',
              padding: '3px 8px'
            }}
          >
            <CheckCircle2 size={12} /> CV Maestro en Vivo
          </span>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            Fuente de verdad curricular (Modificable únicamente por ti)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenMarkdownModal}
            style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}
            title="Ver código fuente curricular en Markdown"
          >
            <FileText size={13} color="#818cf8" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenPrintModal}
            style={{ fontSize: '0.74rem', padding: '0.35rem 0.65rem' }}
            title="Imprimir o exportar en PDF A4"
          >
            <Printer size={13} color="#f59e0b" />
            <span>PDF A4</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onOpenEditModal && onOpenEditModal('personal')}
            style={{ 
              fontSize: '0.74rem', 
              padding: '0.35rem 0.75rem',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)'
            }}
            title="Editar campos en el formulario modal"
          >
            <Edit3 size={13} />
            <span>Editar CV</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENEDOR TIPO HOJA EJECUTIVA / CANVAS DEL CV */}
      <div 
        className="cv-canvas-scrollable"
        style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto'
        }}
      >
        {/* CABECERA DEL CV (FOTO + IDENTIDAD + CONTACTO) */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.25rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}
        >
          {/* FOTO DE PERFIL / AVATAR */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={pInfo.full_name || 'Foto de perfil'} 
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  border: '2px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)'
                }}
              />
            ) : (
              <div 
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {getInitials(pInfo.full_name)}
              </div>
            )}
            <button
              type="button"
              onClick={() => onOpenEditModal && onOpenEditModal('personal')}
              title="Cambiar foto de perfil"
              style={{
                position: 'absolute',
                bottom: '-6px',
                right: '-6px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#0284c7',
                border: '2px solid #0f172a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}
            >
              <Camera size={12} />
            </button>
          </div>

          {/* DATOS DE IDENTIDAD */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.45rem', color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {hasName ? pInfo.full_name : <span style={{ color: '#f87171' }}>[Nombre No Registrado]</span>}
                </h2>
                <p style={{ margin: '0.2rem 0 0.65rem 0', fontSize: '0.95rem', color: '#38bdf8', fontWeight: 600 }}>
                  {pInfo.headline || 'Especialista Profesional'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenEditModal && onOpenEditModal('personal')}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem'
                }}
                title="Editar identidad y datos de contacto"
              >
                <Edit3 size={11} />
                <span>Editar</span>
              </button>
            </div>

            {/* BADGES DE CONTACTO */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
              {pInfo.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Mail size={12} color="#38bdf8" />
                  <span>{pInfo.email}</span>
                </div>
              )}
              {pInfo.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                  <Phone size={12} color="#34d399" />
                  <span>{pInfo.phone}</span>
                </div>
              )}
              {pInfo.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                  <MapPin size={12} color="#fbbf24" />
                  <span>{pInfo.location}</span>
                </div>
              )}
              {pInfo.linkedin && (
                <a 
                  href={pInfo.linkedin.startsWith('http') ? pInfo.linkedin : `https://${pInfo.linkedin}`}
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(10, 102, 194, 0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', textDecoration: 'none' }}
                >
                  <Linkedin size={12} />
                  <span>LinkedIn</span>
                </a>
              )}
              {pInfo.github && (
                <a 
                  href={pInfo.github.startsWith('http') ? pInfo.github : `https://${pInfo.github}`}
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '2px 8px', borderRadius: '6px', textDecoration: 'none' }}
                >
                  <Github size={12} />
                  <span>GitHub</span>
                </a>
              )}
              {pInfo.portfolio && (
                <a 
                  href={pInfo.portfolio.startsWith('http') ? pInfo.portfolio : `https://${pInfo.portfolio}`}
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', textDecoration: 'none' }}
                >
                  <Globe size={12} />
                  <span>Web</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* RESUMEN PROFESIONAL */}
        {pInfo.summary && (
          <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Extracto Profesional
              </h4>
              <button
                type="button"
                onClick={() => onOpenEditModal && onOpenEditModal('personal')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem' }}
              >
                <Edit3 size={11} />
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {pInfo.summary}
            </p>
          </div>
        )}

        {/* EXPERIENCIA LABORAL */}
        <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={14} color="#818cf8" />
              <span>Experiencia Laboral ({experiences.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => onOpenEditModal && onOpenEditModal('experience')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}
            >
              <Edit3 size={11} />
              <span>Editar</span>
            </button>
          </div>

          {experiences.length === 0 ? (
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
              No hay experiencias registradas aún. Añade tu trayectoria profesional para potenciar tu CV Maestro.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {experiences.map((exp, idx) => (
                <div 
                  key={exp.id || idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.025)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{exp.role || 'Puesto'}</strong>
                      <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, marginLeft: '6px' }}>
                        @ {exp.company || 'Empresa'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                      {exp.start_date || ''} - {exp.end_date || (exp.is_current ? 'Actualidad' : '')}
                    </span>
                  </div>

                  {exp.location && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      📍 {exp.location} {exp.contract_type ? `• ${exp.contract_type}` : ''}
                    </div>
                  )}

                  {/* Viñetas / Logros STAR */}
                  {Array.isArray(exp.achievements) && exp.achievements.length > 0 && (
                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {exp.achievements.map((ach, aIdx) => (
                        <li key={aIdx} style={{ marginBottom: '3px' }}>{ach}</li>
                      ))}
                    </ul>
                  )}

                  {/* Responsabilidades si no hay logros */}
                  {(!exp.achievements || exp.achievements.length === 0) && Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                    <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {exp.responsibilities.map((resp, rIdx) => (
                        <li key={rIdx} style={{ marginBottom: '3px' }}>{resp}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FORMACIÓN Y CERTIFICACIONES */}
        <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GraduationCap size={14} color="#06b6d4" />
              <span>Formación & Certificaciones ({educations.length + certs.length})</span>
            </h4>
            <button
              type="button"
              onClick={() => onOpenEditModal && onOpenEditModal('education')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}
            >
              <Edit3 size={11} />
              <span>Editar</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {educations.map((edu, idx) => {
              const hasCert = Boolean(edu.certificate_url || edu.certificate_file);
              const downloadUrl = hasCert ? api.getCertificateDownloadUrl(edu.certificate_file || edu.certificate_url) : null;
              const cleanFilename = hasCert ? String(edu.certificate_file || edu.certificate_url).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') : 'titulo.pdf';

              return (
                <div 
                  key={edu.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.025)',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: hasCert ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                    gap: '0.65rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>{edu.degree || 'Titulación'}</strong>
                      {hasCert && (
                        <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          Título Oficial PDF
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#06b6d4', marginTop: '2px' }}>
                      {edu.institution || 'Institución'} {edu.field_of_study ? `• ${edu.field_of_study}` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {edu.start_year || ''} - {edu.end_year || (edu.is_current ? 'Presente' : '')}
                    </span>

                    {hasCert && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCertForViewer({ ...edu, title: edu.degree, degree_type_label: edu.degree_type_label || 'Titulación Oficial' })}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(56, 189, 248, 0.35)',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.08)'
                          }}
                          title="Abrir visor PDF del título"
                        >
                          <Eye size={12} />
                          <span>Ver Título</span>
                        </button>

                        <a
                          href={downloadUrl}
                          download={cleanFilename}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#cbd5e1',
                            textDecoration: 'none'
                          }}
                          title="Descargar archivo PDF"
                        >
                          <Download size={12} />
                          <span>Descargar</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {certs.map((c, idx) => {
              const hasCert = Boolean(c.certificate_url || c.certificate_file);
              const downloadUrl = hasCert ? api.getCertificateDownloadUrl(c.certificate_file || c.certificate_url) : null;
              const cleanFilename = hasCert ? String(c.certificate_file || c.certificate_url).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') : 'certificado.pdf';

              return (
                <div 
                  key={c.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.025)',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: hasCert ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                    gap: '0.65rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px' }}>
                    <Award size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.86rem', color: '#f8fafc' }}>{c.name || 'Certificación'}</strong>
                        {hasCert && (
                          <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            Certificado PDF
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {c.issuer ? `${c.issuer}` : ''} {c.hours ? `• ${c.hours}` : ''}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{c.year || ''}</span>

                    {hasCert && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCertForViewer({ ...c, title: c.name, degree_type_label: c.degree_type_label || 'Certificación Oficial' })}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(245, 158, 11, 0.35)',
                            color: '#fbbf24',
                            background: 'rgba(245, 158, 11, 0.08)'
                          }}
                          title="Abrir visor PDF del certificado"
                        >
                          <Eye size={12} />
                          <span>Ver Certificado</span>
                        </button>

                        <a
                          href={downloadUrl}
                          download={cleanFilename}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: '0.72rem',
                            padding: '3px 7px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: 'rgba(255, 255, 255, 0.15)',
                            color: '#cbd5e1',
                            textDecoration: 'none'
                          }}
                          title="Descargar archivo PDF"
                        >
                          <Download size={12} />
                          <span>Descargar</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HABILIDADES & IDIOMAS */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={14} color="#10b981" />
              <span>Competencias, Tecnologías e Idiomas</span>
            </h4>
            <button
              type="button"
              onClick={() => onOpenEditModal && onOpenEditModal('skills')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '3px 7px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}
            >
              <Edit3 size={11} />
              <span>Editar</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Hard Skills */}
            {hardSkills.length > 0 && (
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  HARD SKILLS
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hardSkills.map((s, idx) => (
                    <span key={idx} style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {typeof s === 'string' ? s : s?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tools & Tech */}
            {toolsAndTech.length > 0 && (
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  HERRAMIENTAS & SOFTWARE
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {toolsAndTech.map((t, idx) => (
                    <span key={idx} style={{ background: 'rgba(129, 140, 248, 0.12)', border: '1px solid rgba(129, 140, 248, 0.25)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {typeof t === 'string' ? t : t?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Soft Skills */}
            {softSkills.length > 0 && (
              <div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  HABILIDADES INTERPERSONALES
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {softSkills.map((sk, idx) => (
                    <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      {typeof sk === 'string' ? sk : sk?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Idiomas */}
            {languages.length > 0 && (
              <div style={{ marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  IDIOMAS
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {languages.map((l, idx) => {
                    const lName = typeof l === 'string' ? l : l?.language;
                    const lProf = typeof l === 'string' ? '' : (l?.proficiency || l?.level || '');
                    return (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                        <strong>{lName}</strong> {lProf ? `(${lProf})` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL VISOR PDF PARA TÍTULOS Y CERTIFICADOS */}
      {selectedCertForViewer && (
        <CertificatePdfViewerModal
          isOpen={Boolean(selectedCertForViewer)}
          certificate={selectedCertForViewer}
          onClose={() => setSelectedCertForViewer(null)}
        />
      )}
    </div>
  );
}
