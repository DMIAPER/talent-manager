import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  Award, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  Check, 
  FileCheck,
  BookOpen,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Eye,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';
import CertificatePdfViewerModal from './CertificatePdfViewerModal';

export default function UploadCertificateModal({
  isOpen,
  onClose,
  mode = 'profile', // 'profile' | 'milestone'
  milestone = null,
  planId = null,
  onSuccess = null
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedCertForViewer, setSelectedCertForViewer] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const isMilestoneMode = mode === 'milestone';

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  };

  const handleFilesSelected = (files) => {
    setErrorMessage('');
    const validFiles = files.filter(f => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['pdf', 'png', 'jpg', 'jpeg'].includes(ext);
    });

    if (validFiles.length === 0) {
      setErrorMessage('Por favor selecciona archivos válidos en formato PDF o imagen (PNG, JPG).');
      return;
    }

    if (isMilestoneMode) {
      // En modo hito solo permitimos 1 archivo a la vez
      setSelectedFiles([validFiles[0]]);
    } else {
      setSelectedFiles(validFiles);
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (results) setResults(null);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Por favor selecciona al menos un certificado en PDF.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setResults(null);

    try {
      if (isMilestoneMode) {
        // Subida y verificación de hito de carrera
        setCurrentStep('Extrayendo contenido y firmas del certificado...');
        await new Promise(r => setTimeout(r, 600));

        setCurrentStep('IA evaluando correspondencia temática con el hito formativo...');
        const res = await api.uploadMilestoneCertificate(planId, milestone.id, selectedFiles[0]);

        setCurrentStep('¡Certificado verificado! Hito completado y CV Maestro actualizado.');
        setResults({
          isMilestone: true,
          milestoneTitle: milestone?.title,
          ...res
        });

        if (onSuccess) onSuccess(res);
      } else {
        // Subida global de cursos en "MI PERFIL"
        if (selectedFiles.length === 1) {
          setCurrentStep('Extrayendo datos del certificado...');
          await new Promise(r => setTimeout(r, 500));

          setCurrentStep('IA evaluando entidad emisora, horas lectivas y competencias...');
          const res = await api.uploadProfileCertificate(selectedFiles[0]);

          setCurrentStep('¡Curso registrado con éxito y sincronizado en CV Maestro!');
          setResults({
            isBatch: false,
            ...res
          });

          if (onSuccess) onSuccess(res);
        } else {
          // Lote de múltiples certificados
          setCurrentStep(`Procesando lote de ${selectedFiles.length} certificados con IA...`);
          const res = await api.uploadProfileCertificatesBatch(selectedFiles);

          setCurrentStep(`¡${res.processed_count} cursos evaluados y registrados en el CV Maestro!`);
          setResults({
            isBatch: true,
            ...res
          });

          if (onSuccess) onSuccess(res);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Error durante la evaluación del certificado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetForMore = () => {
    setSelectedFiles([]);
    setResults(null);
    setErrorMessage('');
    setCurrentStep('');
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="modal-backdrop"
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
          padding: '1.5rem 1rem'
        }}
        onClick={onClose}
      >
        <div 
          className="modal-content glass-panel animate-scale-up"
          style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            margin: 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.15)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              {isMilestoneMode ? <ShieldCheck size={22} /> : <Award size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', fontWeight: 800 }}>
                {isMilestoneMode 
                  ? 'Acreditar Superación de Hito Formativo con IA' 
                  : 'Subir Cursos y Diplomas en PDF (Evaluación IA)'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {isMilestoneMode 
                  ? 'La IA evalúa tu certificado, valida el hito formativo y lo incorpora a tu CV Maestro' 
                  : 'La IA analiza el certificado, extrae emisor, horas y competencias y actualiza tu CV Maestro'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* BANNER CONTEXTUAL EN MODO HITO */}
          {isMilestoneMode && milestone && (
            <div style={{
              padding: '0.9rem 1.1rem',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 Hito Objetivo de tu Carrera
                </span>
                <div style={{ color: '#f8fafc', fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                  {milestone.title}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                  {milestone.provider && <span>Entidad: {milestone.provider} • </span>}
                  <span>Estimación: {milestone.duration_hours || 40} horas</span>
                </div>
              </div>

              <div style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: milestone.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
                color: milestone.status === 'completed' ? '#34d399' : '#fbbf24',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: `1px solid ${milestone.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                whiteSpace: 'nowrap'
              }}>
                {milestone.status === 'completed' ? '✓ Ya Completado' : 'Pendiente de Certificado'}
              </div>
            </div>
          )}

          {/* VISTA DE RESULTADO FINAL TRAS LA EVALUACIÓN */}
          {results ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#34d399' }}>
                  <CheckCircle size={22} />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
                    {results.message || '¡Evaluación completada con éxito!'}
                  </span>
                </div>

                {/* Resumen o Tarjeta del certificado */}
                {results.evaluation && (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        {/* Categorización y badges de titulación */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          {results.evaluation.degree_type_label && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              background: results.evaluation.is_academic_degree 
                                ? 'rgba(168, 85, 247, 0.2)' 
                                : results.evaluation.degree_type === 'certificacion_oficial'
                                  ? 'rgba(56, 189, 248, 0.2)'
                                  : 'rgba(34, 197, 94, 0.2)',
                              color: results.evaluation.is_academic_degree 
                                ? '#c084fc' 
                                : results.evaluation.degree_type === 'certificacion_oficial'
                                  ? '#38bdf8'
                                  : '#4ade80',
                              border: `1px solid ${results.evaluation.is_academic_degree ? 'rgba(168, 85, 247, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <GraduationCap size={13} />
                              {results.evaluation.degree_type_label}
                            </span>
                          )}

                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            📂 CV: {results.section_registered === 'education' || results.evaluation.target_cv_section === 'education' ? 'Educación Formal' : 'Certificaciones y Cursos'}
                          </span>

                          {results.evaluation.is_official_degree && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(14, 165, 233, 0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(14, 165, 233, 0.3)'
                            }}>
                              ✓ Título Oficial Homologado
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                          Titulación Evaluada
                        </span>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                          {results.evaluation.course_title}
                        </div>

                        {results.evaluation.student_name && (
                          <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <UserCheck size={13} />
                            <span>Titular acreditado: <strong>{results.evaluation.student_name}</strong></span>
                          </div>
                        )}
                      </div>

                      <div style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        border: '1px solid rgba(56, 189, 248, 0.3)'
                      }}>
                        {results.evaluation.issuer || 'Entidad Acreditadora'}
                      </div>
                    </div>

                    {/* Metadatos estructurados */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Año / Fecha: </span>
                        <strong>{results.evaluation.year || results.evaluation.issue_date || '2024'}</strong>
                      </div>
                      {results.evaluation.hours && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>Dedicación: </span>
                          <strong>{results.evaluation.hours} {String(results.evaluation.hours).toLowerCase().includes('ect') || String(results.evaluation.hours).toLowerCase().includes('hora') ? '' : 'horas'}</strong>
                        </div>
                      )}
                      {results.evaluation.grade && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>Calificación: </span>
                          <strong>{results.evaluation.grade}</strong>
                        </div>
                      )}
                      {results.evaluation.credential_id && (
                        <div>
                          <span style={{ color: '#94a3b8' }}>ID / CSV: </span>
                          <strong style={{ fontFamily: 'monospace' }}>{results.evaluation.credential_id}</strong>
                        </div>
                      )}
                    </div>

                    {/* Datos administrativos irrelevantes filtrados */}
                    {results.evaluation.filtered_noise && results.evaluation.filtered_noise.length > 0 && (
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        background: 'rgba(148, 163, 184, 0.06)',
                        borderRadius: '6px',
                        border: '1px solid rgba(148, 163, 184, 0.14)',
                        fontSize: '0.7rem',
                        color: '#94a3b8',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1', fontWeight: 600 }}>
                          <ShieldCheck size={13} color="#34d399" />
                          <span>Datos no relevantes filtrados (layout horizontal / administrativo):</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                          {results.evaluation.filtered_noise.map((noise, nIdx) => (
                            <span key={nIdx} style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.67rem',
                              color: '#cbd5e1'
                            }}>
                              ✓ {noise}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.evaluation.verification_feedback && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem' }}>
                        "{results.evaluation.verification_feedback}"
                      </p>
                    )}

                    {/* Competencias añadidas */}
                    {results.evaluation.skills_acquired && results.evaluation.skills_acquired.length > 0 && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <span style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          Competencias y Hard Skills acreditadas e incorporadas al perfil:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {results.evaluation.skills_acquired.map((sk, idx) => (
                            <span 
                              key={idx}
                              style={{
                                background: 'rgba(129, 140, 248, 0.15)',
                                color: '#c7d2fe',
                                border: '1px solid rgba(129, 140, 248, 0.3)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600
                              }}
                            >
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Si fue por lote */}
                {results.isBatch && (
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    Se han procesado correctamente <strong>{results.processed_count}</strong> cursos y certificaciones.
                  </div>
                )}

                {/* Sincronización CV Maestro */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}>
                  <Check size={14} />
                  <span>Sincronizado automáticamente en tu Perfil Oficial y archivo <code>cv-maestro.md</code></span>
                </div>
              </div>

              {/* Botones de acción posterior y visor de documento */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {results && (results.certificate_info?.certificate_url || results.file_info?.stored_filename || results.certificate_url) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCertForViewer({
                        title: results.certificate_info?.title || results.evaluation?.course_title || 'Certificado',
                        institution: results.certificate_info?.issuer || results.evaluation?.issuer,
                        year: results.certificate_info?.year || results.evaluation?.year,
                        hours: results.certificate_info?.hours || results.evaluation?.hours,
                        certificate_url: results.certificate_info?.certificate_url || results.file_info?.relative_url || results.certificate_url,
                        certificate_file: results.file_info?.stored_filename || results.certificate_file,
                        is_verified: true,
                        degree_type_label: results.evaluation?.degree_type_label || 'Certificado Acreditado'
                      })}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.08)' }}
                    >
                      <Eye size={13} />
                      <span>Ver en Visor PDF</span>
                    </button>
                    <a
                      href={api.getCertificateDownloadUrl(results.file_info?.stored_filename || results.certificate_info?.certificate_url || results.certificate_url)}
                      download={results.file_info?.original_filename || 'certificado.pdf'}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#cbd5e1' }}
                    >
                      <Download size={13} />
                      <span>Descargar Copia</span>
                    </a>
                  </div>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {!isMilestoneMode && (
                    <button
                      type="button"
                      onClick={handleResetForMore}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      <Upload size={14} />
                      <span>Subir otro certificado</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Check size={14} />
                    <span>Cerrar y ver cambios</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ZONA DE ARRASTRE Y SOLTADO DE ARCHIVOS */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: '12px',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  multiple={!isMilestoneMode}
                  accept=".pdf, .png, .jpg, .jpeg"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                  disabled={isProcessing}
                />

                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <Upload size={24} />
                </div>

                <div>
                  <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                    Arrastra aquí tu certificado o diploma en <span style={{ color: '#38bdf8' }}>PDF</span>
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {isMilestoneMode 
                      ? 'Admite PDF o imagen (PNG/JPG) con el diploma del curso o módulo superado' 
                      : 'Admite uno o múltiples PDFs de cursos, diplomas o títulos oficiales finalizados'}
                  </p>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  style={{ pointerEvents: 'none', marginTop: '0.25rem' }}
                >
                  Examinar archivos en este equipo
                </button>
              </div>

              {/* LISTA DE ARCHIVOS SELECCIONADOS */}
              {selectedFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Archivos listos para evaluar ({selectedFiles.length}):
                  </span>
                  
                  {selectedFiles.map((file, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '0.65rem 0.9rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileCheck size={18} color="#38bdf8" />
                        <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* BARRA DE PROCESAMIENTO / SPINNER IA EN MOVIMIENTO VIVO */}
              {isProcessing && (
                <div className="ai-processing-glow" style={{
                  padding: '1.1rem',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
                      <Loader2 size={24} className="spin-anim" color="#38bdf8" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.84rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                        Auditoría Inteligente en Progreso
                        <span className="thinking-dots" style={{ color: '#38bdf8' }}><span></span><span></span><span></span></span>
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        {currentStep}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso fluida e indeterminada */}
                  <div className="progress-indeterminate-track">
                    <div className="progress-indeterminate-runner" />
                  </div>
                </div>
              )}

              {/* MENSAJE DE ERROR SI OCURRE */}
              {errorMessage && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="btn btn-secondary btn-sm"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isProcessing || selectedFiles.length === 0}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={15} className="spin-anim" />
                      <span>Evaluando con IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      <span>
                        {isMilestoneMode ? 'Validar Hito con Certificado' : 'Evaluar y Registrar en CV Maestro'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* MODAL VISOR PDF DEL CERTIFICADO EVALUADO */}
      {selectedCertForViewer && (
        <CertificatePdfViewerModal
          isOpen={Boolean(selectedCertForViewer)}
          certificate={selectedCertForViewer}
          onClose={() => setSelectedCertForViewer(null)}
        />
      )}
    </div>
    </ModalPortal>
  );
}
