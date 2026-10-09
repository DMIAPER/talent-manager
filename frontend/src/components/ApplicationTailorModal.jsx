import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Award, CheckCircle2, AlertCircle, FileText, 
  Mail, Download, Copy, Check, Edit3, Eye, Loader2, ArrowRight,
  ExternalLink, Building, MapPin, Tag, Briefcase, Printer
} from 'lucide-react';
import { api } from '../services/api';
import { 
  downloadDocument, 
  copyToClipboard, 
  generateCvFilename, 
  generateCoverLetterFilename 
} from '../utils/documentExport';
import MarkdownRenderer from './MarkdownRenderer';
import DocumentPrintModal from './DocumentPrintModal';
import ModalPortal from './ModalPortal';

export default function ApplicationTailorModal({ job, isOpen, onClose, onSavedToKanban }) {
  if (!isOpen || !job) return null;

  const [activeTab, setActiveTab] = useState('diagnosis'); // 'diagnosis' | 'cv' | 'cover_letter'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  
  // Datos generados por el motor ATS
  const [packageData, setPackageData] = useState(null);
  const [cvContent, setCvContent] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');

  // Modos de visualización de documentos: 'preview' | 'edit'
  const [cvViewMode, setCvViewMode] = useState('preview');
  const [letterViewMode, setLetterViewMode] = useState('preview');

  // Feedback de copiado
  const [copiedSection, setCopiedSection] = useState(null); // 'cv' | 'letter' | null
  const [savingPipeline, setSavingPipeline] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printInitialDoc, setPrintInitialDoc] = useState('cv');

  useEffect(() => {
    let isMounted = true;

    async function loadDataAndTailor() {
      setLoading(true);
      setError(null);
      setIsAlreadySaved(false);

      try {
        // Cargar datos del perfil para obtener el nombre real del candidato
        try {
          const prof = await api.getProfile();
          if (prof?.personal_info?.full_name && isMounted) {
            setCandidateName(prof.personal_info.full_name);
          }
        } catch (e) {
          console.warn('No se pudo obtener el nombre del perfil:', e);
        }

        // Si la oferta ya venía con materiales generados (ej. reabierta desde el Kanban)
        if (job.ats_optimized_cv_content && job.cover_letter) {
          if (isMounted) {
            setPackageData({
              ats_score: job.ats_score || 85,
              keywords: job.keywords || [],
              matching_skills: job.ats_match_details?.matching_skills || [],
              missing_skills: job.ats_match_details?.missing_skills || [],
              star_bullets: job.ats_match_details?.star_bullets || []
            });
            setCvContent(job.ats_optimized_cv_content);
            setCoverLetterContent(job.cover_letter);
            setIsAlreadySaved(true);
            setLoading(false);
          }
          return;
        }

        // Ejecutar llamada a generador ATS de alta fidelidad
        const result = await api.tailorApplication({
          role: job.role || 'Puesto',
          company: job.company || 'Empresa',
          description: job.description || '',
          salary_range: job.salary_range || '',
          location: job.location || '',
          portal: job.portal || 'Portal Web',
          url: job.url || ''
        });

        if (isMounted) {
          setPackageData(result);
          setCvContent(result.tailored_cv || '');
          setCoverLetterContent(result.cover_letter || '');
        }
      } catch (err) {
        console.error('Error generando paquete de candidatura:', err);
        if (isMounted) {
          setError(err.message || 'Error al conectar con el motor ATS.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDataAndTailor();

    return () => {
      isMounted = false;
    };
  }, [job]);

  const handleCopy = async (text, section) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2200);
    }
  };

  const handleDownloadCv = (extension) => {
    const filename = generateCvFilename(candidateName, job.company, job.role, extension);
    downloadDocument(cvContent, filename, extension);
  };

  const handleDownloadLetter = (extension) => {
    const filename = generateCoverLetterFilename(candidateName, job.company, job.role, extension);
    downloadDocument(coverLetterContent, filename, extension);
  };

  const handleSaveToPipeline = async () => {
    setSavingPipeline(true);
    try {
      const payload = {
        company: job.company,
        role: job.role,
        url: job.url,
        portal: job.portal || 'Google / Portales',
        description: job.description,
        salary_range: job.salary_range,
        location_city: job.location,
        location_type: (job.location?.toLowerCase().includes('remoto')) ? 'remote' : 'onsite',
        notes: `Candidatura preparada con CV ATS (${packageData?.ats_score || 85}% Match) y Carta de Presentación.`,
        ats_score: packageData?.ats_score || null,
        ats_match_details: {
          matching_skills: packageData?.matching_skills || [],
          missing_skills: packageData?.missing_skills || [],
          star_bullets: packageData?.star_bullets || []
        },
        keywords: packageData?.keywords || [],
        ats_optimized_cv_content: cvContent,
        cover_letter: coverLetterContent
      };

      const res = await api.saveJobToPipeline(payload);
      setIsAlreadySaved(true);
      alert(res.message || '¡Oferta guardada en Ofertas Encontradas (Listo para Enviar)!');
      if (onSavedToKanban) {
        onSavedToKanban(res.app || payload);
      }
      onClose();
    } catch (err) {
      alert('Error guardando en el pipeline: ' + err.message);
    } finally {
      setSavingPipeline(false);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(isOpen && job)}>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 25, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '1.5rem 1rem'
        }}
      >
        <div 
          className="modal-container animate-fade-in" 
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(145deg, #0d1527 0%, #111e38 100%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '92vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8)',
            overflow: 'hidden'
          }}
        >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={12} /> Preparación de Candidatura ATS
              </span>
              <span className="badge badge-cyan">
                🏛️ {job.portal || 'Portal de Empleo'}
              </span>
              <span className="badge badge-amber" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                🔥 {job.posted_time || 'Publicada hoy'}
              </span>
              {packageData?.ats_score && (
                <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                  <Award size={13} /> {packageData.ats_score}% Match ATS
                </span>
              )}
            </div>

            <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{job.role}</span>
              <span style={{ color: '#38bdf8', fontWeight: 500, fontSize: '1.15rem' }}>en {job.company}</span>
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem', color: '#94a3b8', fontSize: '0.8rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {job.location || 'Remoto'}
              </span>
              {job.salary_range && (
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                  💰 {job.salary_range}
                </span>
              )}
              {job.url && (
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                >
                  <ExternalLink size={12} /> <span>Abrir oferta en navegador</span>
                </a>
              )}
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0 1.5rem'
        }}>
          <button
            onClick={() => setActiveTab('diagnosis')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'diagnosis' ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === 'diagnosis' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Award size={15} color={activeTab === 'diagnosis' ? '#818cf8' : '#94a3b8'} />
            <span>1. Diagnóstico & Keywords</span>
          </button>

          <button
            onClick={() => setActiveTab('cv')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cv' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'cv' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText size={15} color={activeTab === 'cv' ? '#38bdf8' : '#94a3b8'} />
            <span>2. CV Adaptado ATS</span>
          </button>

          <button
            onClick={() => setActiveTab('cover_letter')}
            style={{
              padding: '0.85rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'cover_letter' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'cover_letter' ? '#fff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Mail size={15} color={activeTab === 'cover_letter' ? '#10b981' : '#94a3b8'} />
            <span>3. Carta de Presentación</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '350px',
              gap: '1.25rem' 
            }}>
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
                <Loader2 size={30} className="spin-anim" color="#818cf8" />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 460 }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Adaptando Candidatura con IA & Protocolo ATS
                  <span className="thinking-dots" style={{ color: '#818cf8' }}><span></span><span></span><span></span></span>
                </h4>
                <p style={{ margin: '0.4rem 0 1rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Cruzando los requisitos de la vacante con tu CV maestro real, formulando logros STAR y redactando tu carta personalizada...
                </p>
                <div className="progress-indeterminate-track" style={{ width: '280px', margin: '0 auto' }}>
                  <div className="progress-indeterminate-runner" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: '#fb7185'
            }}>
              <AlertCircle size={28} style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ margin: 0, color: '#fff' }}>No se pudo procesar la candidatura</h4>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>{error}</p>
            </div>
          ) : (
            <>
              {/* PESTAÑA 1: DIAGNÓSTICO & KEYWORDS */}
              {activeTab === 'diagnosis' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Tarjeta de Compatibilidad ATS */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.05em' }}>
                        Evaluación del Sistema ATS
                      </span>
                      <h4 style={{ margin: '0.2rem 0 0 0', fontSize: '1.2rem', color: '#fff' }}>
                        Afinidad Curricular: <span style={{ color: '#34d399' }}>{packageData?.ats_score}%</span>
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                        Basado en términos clave técnicos, coincidencia de experiencia y estructura semántica.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="badge badge-emerald" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        ✓ {packageData?.matching_skills?.length || 0} Habilidades Coincidentes
                      </span>
                      {packageData?.missing_skills?.length > 0 && (
                        <span className="badge badge-rose" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          ⚡ {packageData?.missing_skills?.length} Para Reforzar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Competencias Clave y Palabras Clave */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    {/* Coincidentes */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      padding: '1.15rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        <CheckCircle2 size={16} />
                        <span>Competencias Coincidentes (En tu perfil)</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {packageData?.matching_skills?.length > 0 ? (
                          packageData.matching_skills.map((skill, i) => (
                            <span key={i} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Competencias transferibles detectadas.</span>
                        )}
                      </div>
                    </div>

                    {/* Faltantes / Refuerzo */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '1.15rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        <AlertCircle size={16} />
                        <span>Requisitos para Reforzar (Gaps)</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {packageData?.missing_skills?.length > 0 ? (
                          packageData.missing_skills.map((skill, i) => (
                            <span key={i} className="badge badge-rose" style={{ fontSize: '0.75rem' }}>
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#34d399' }}>¡Sin brechas técnicas críticas! Cobertura excelente.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Palabras Clave Principales */}
                  {packageData?.keywords?.length > 0 && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        <Tag size={14} />
                        <span>Keywords ATS Detectadas en la Oferta:</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {packageData.keywords.map((kw, i) => (
                          <span key={i} className="badge badge-slate" style={{ fontSize: '0.75rem' }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Viñetas STAR Formadas */}
                  {packageData?.star_bullets?.length > 0 && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                        <Sparkles size={16} color="#fbbf24" />
                        <span>Logros Cuantificados con Metodología STAR (Zero Fabrication)</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>
                        Viñetas estructuradas con Situación, Tarea, Acción y Resultado incorporadas al CV para superar el primer filtro de recursos humanos.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {packageData.star_bullets.map((bullet, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              background: 'rgba(0,0,0,0.3)', 
                              padding: '0.85rem 1rem', 
                              borderRadius: '8px', 
                              borderLeft: '3px solid #6366f1'
                            }}
                          >
                            <MarkdownRenderer content={bullet} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 2: CV ADAPTADO ATS */}
              {activeTab === 'cv' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem' }}>
                  {/* Barra de Herramientas de CV */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {/* Selector Vista / Edición */}
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setCvViewMode('preview')}
                        className={`btn btn-sm ${cvViewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Eye size={13} />
                        <span>Vista Previa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCvViewMode('edit')}
                        className={`btn btn-sm ${cvViewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Edit3 size={13} />
                        <span>Modo Editor</span>
                      </button>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(cvContent, 'cv')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        {copiedSection === 'cv' ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        <span>{copiedSection === 'cv' ? '¡Copiado!' : 'Copiar CV'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCv('md')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={13} />
                        <span>Descargar .md</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadCv('txt')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={13} />
                        <span>Descargar .txt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPrintInitialDoc('cv'); setShowPrintModal(true); }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg, #c2410c, #d97706)' }}
                        title="Imprimir CV Adaptado en PDF con formato A4 ATS"
                      >
                        <Printer size={13} />
                        <span>Imprimir PDF ATS</span>
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo del CV */}
                  <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    {cvViewMode === 'preview' ? (
                      <div style={{
                        flex: 1,
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '1.25rem 1.5rem',
                        overflowY: 'auto'
                      }}>
                        <MarkdownRenderer content={cvContent} />
                      </div>
                    ) : (
                      <textarea
                        value={cvContent}
                        onChange={(e) => setCvContent(e.target.value)}
                        placeholder="Edita el contenido del CV en formato Markdown..."
                        style={{
                          flex: 1,
                          width: '100%',
                          minHeight: '380px',
                          background: '#090e1a',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          borderRadius: '10px',
                          padding: '1.25rem 1.5rem',
                          color: '#e2e8f0',
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                          fontSize: '0.825rem',
                          lineHeight: 1.6,
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: CARTA DE PRESENTACIÓN */}
              {activeTab === 'cover_letter' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.85rem' }}>
                  {/* Barra de Herramientas de Carta */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {/* Selector Vista / Edición */}
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => setLetterViewMode('preview')}
                        className={`btn btn-sm ${letterViewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Eye size={13} />
                        <span>Vista Previa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLetterViewMode('edit')}
                        className={`btn btn-sm ${letterViewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                      >
                        <Edit3 size={13} />
                        <span>Modo Editor</span>
                      </button>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(coverLetterContent, 'letter')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        {copiedSection === 'letter' ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        <span>{copiedSection === 'letter' ? '¡Copiada!' : 'Copiar Carta'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadLetter('md')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={13} />
                        <span>Descargar .md</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadLetter('txt')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Download size={13} />
                        <span>Descargar .txt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPrintInitialDoc('letter'); setShowPrintModal(true); }}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', background: 'linear-gradient(135deg, #c2410c, #d97706)' }}
                        title="Imprimir Carta de Presentación en PDF con formato A4"
                      >
                        <Printer size={13} />
                        <span>Imprimir Carta PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo de la Carta */}
                  <div style={{ flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
                    {letterViewMode === 'preview' ? (
                      <div style={{
                        flex: 1,
                        background: '#090e1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '1.5rem 1.75rem',
                        overflowY: 'auto'
                      }}>
                        <MarkdownRenderer content={coverLetterContent} />
                      </div>
                    ) : (
                      <textarea
                        value={coverLetterContent}
                        onChange={(e) => setCoverLetterContent(e.target.value)}
                        placeholder="Edita el texto de la carta de presentación..."
                        style={{
                          flex: 1,
                          width: '100%',
                          minHeight: '380px',
                          background: '#090e1a',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          borderRadius: '10px',
                          padding: '1.5rem 1.75rem',
                          color: '#e2e8f0',
                          fontSize: '0.875rem',
                          lineHeight: 1.7,
                          outline: 'none',
                          resize: 'none'
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie de Acciones del Modal */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cerrar
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setPrintInitialDoc(activeTab === 'cover_letter' ? 'letter' : 'cv'); setShowPrintModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} color="#d97706" />
              <span>Imprimir / PDF ATS</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveToPipeline}
              disabled={loading || savingPipeline}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.65rem 1.25rem',
                background: isAlreadySaved ? '#10b981' : undefined
              }}
            >
              {savingPipeline ? (
                <Loader2 size={16} className="spin-anim" />
              ) : isAlreadySaved ? (
                <CheckCircle2 size={16} />
              ) : (
                <ArrowRight size={16} />
              )}
              <span>
                {savingPipeline 
                  ? 'Guardando...' 
                  : isAlreadySaved 
                    ? 'Actualizar en Ofertas Encontradas' 
                    : '📥 Guardar en Ofertas Encontradas (Listo para Enviar)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE IMPRESIÓN A4 ATS PARA CV Y CARTA */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        tailoredCvMarkdown={cvContent}
        coverLetterText={coverLetterContent}
        targetJob={job}
        initialDoc={printInitialDoc}
      />
      </div>
    </ModalPortal>
  );
}
