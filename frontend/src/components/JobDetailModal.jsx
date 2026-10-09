import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Calendar, Clock, AlertTriangle, CheckCircle, 
  Send, Plus, Tag, MapPin, Building, DollarSign, Award, MessageSquare,
  RefreshCw, RotateCcw, FileText, Sparkles, Copy, Download, Check, Printer
} from 'lucide-react';
import { api } from '../services/api';
import { 
  downloadDocument, 
  copyToClipboard, 
  generateCvFilename, 
  generateCoverLetterFilename 
} from '../utils/documentExport';
import { detectPortalInfo, isExactJobUrl } from '../utils/portalHelpers';
import MarkdownRenderer from './MarkdownRenderer';
import DocumentPrintModal from './DocumentPrintModal';
import ModalPortal from './ModalPortal';

const STATUS_OPTIONS = [
  { id: 'pending_action', label: '1. Oferta Encontrada (Pendiente de acción)', color: '#38bdf8' },
  { id: 'sent', label: '2. Enviada (Espera 15 días)', color: '#818cf8' },
  { id: 'in_progress', label: '3. En Proceso (Entrevistas / Contacto)', color: '#10b981' },
  { id: 'discarded', label: '4. Descartada', color: '#94a3b8' }
];

export default function JobDetailModal({ application, onClose, onUpdated }) {
  if (!application) return null;

  const [status, setStatus] = useState(application.status || 'pending_action');
  const [inProgressReason, setInProgressReason] = useState(application.in_progress_reason || '');
  const [discardReason, setDiscardReason] = useState(application.discard_reason || 'descarte_manual');
  const [notes, setNotes] = useState(application.notes || '');
  const [jobUrl, setJobUrl] = useState(application.url || '');
  
  // Nueva coletilla
  const [newColetilla, setNewColetilla] = useState('');
  const [coletillaCategory, setColetillaCategory] = useState('general');
  const [saving, setSaving] = useState(false);
  const [extending, setExtending] = useState(false);
  const [markingSent, setMarkingSent] = useState(false);

  const [generatingMaterials, setGeneratingMaterials] = useState(false);
  const [cvContent, setCvContent] = useState(application.ats_optimized_cv_content || '');
  const [coverLetterContent, setCoverLetterContent] = useState(application.cover_letter || '');
  const [materialsTab, setMaterialsTab] = useState('cv'); // 'cv' | 'letter'
  const [copiedKey, setCopiedKey] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    async function fetchCandidate() {
      try {
        const prof = await api.getProfile();
        if (prof?.personal_info?.full_name) {
          setCandidateName(prof.personal_info.full_name);
        }
      } catch (e) {
        // silencioso
      }
    }
    fetchCandidate();
  }, []);

  const lifecycle = application.lifecycle_info || {};
  const coletillas = application.coletillas || [];
  const portalInfo = detectPortalInfo(application.portal, jobUrl || application.url);
  const isExact = isExactJobUrl(jobUrl);

  const handleGenerateMaterials = async () => {
    setGeneratingMaterials(true);
    try {
      const res = await api.generateApplicationMaterials(application.id);
      const tailoredCv = res.package?.tailored_cv || res.application?.ats_optimized_cv_content || '';
      const coverLetter = res.package?.cover_letter || res.application?.cover_letter || '';
      setCvContent(tailoredCv);
      setCoverLetterContent(coverLetter);
      alert('¡Materiales adaptados generados con éxito!');
      if (onUpdated) onUpdated();
    } catch (e) {
      alert('Error generando materiales: ' + e.message);
    } finally {
      setGeneratingMaterials(false);
    }
  };

  const handleCopyMaterial = async (text, key) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownloadMaterial = (type, extension) => {
    if (type === 'cv') {
      const filename = generateCvFilename(candidateName, application.company, application.role, extension);
      downloadDocument(cvContent, filename, extension);
    } else {
      const filename = generateCoverLetterFilename(candidateName, application.company, application.role, extension);
      downloadDocument(coverLetterContent, filename, extension);
    }
  };

  const handleQuickMarkAsSent = async () => {
    setMarkingSent(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await api.updateApplication(application.id, {
        status: 'sent',
        sent_date: today
      });
      alert('🚀 ¡Candidatura marcada como Enviada! Comienza la regla de espera de 15 días.');
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      alert('Error al marcar como enviada: ' + e.message);
    } finally {
      setMarkingSent(false);
    }
  };

  const handleSaveStatusAndNotes = async () => {
    // Validación obligatoria si pasa a 'in_progress'
    if (status === 'in_progress' && !inProgressReason.trim()) {
      alert('⚠️ Para marcar la oferta "En Proceso" es obligatorio indicar el motivo del contacto de la empresa (ej: "Llamada de RRHH concertando entrevista técnica").');
      return;
    }

    setSaving(true);
    try {
      await api.updateApplication(application.id, {
        status,
        in_progress_reason: status === 'in_progress' ? inProgressReason.trim() : null,
        discard_reason: status === 'discarded' ? discardReason : null,
        notes: notes.trim(),
        url: jobUrl.trim()
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleAddColetilla = async (e) => {
    e.preventDefault();
    if (!newColetilla.trim()) return;

    try {
      await api.addColetilla(application.id, {
        content: newColetilla.trim(),
        author: 'Candidato',
        category: coletillaCategory
      });
      setNewColetilla('');
      if (onUpdated) onUpdated();
    } catch (e) {
      console.error(e);
      alert('Error añadiendo coletilla');
    }
  };

  const handleExtendWait = async () => {
    setExtending(true);
    try {
      await api.extendWaitPeriod(application.id, 7);
      alert('Se han añadido +7 días al periodo de espera de esta oferta.');
      if (onUpdated) onUpdated();
    } catch (e) {
      alert('Error extendiendo el plazo');
    } finally {
      setExtending(false);
    }
  };

  const handleReopen = async () => {
    try {
      await api.reopenApplication(application.id, 'sent');
      alert('Candidatura reabierta y devuelta al estado Enviada.');
      if (onUpdated) onUpdated();
      onClose();
    } catch (e) {
      alert('Error reabriendo la candidatura');
    }
  };

  return (
    <ModalPortal isOpen={Boolean(application)}>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 25, 0.82)',
          backdropFilter: 'blur(8px)',
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
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '820px',
            maxHeight: '90vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}
        >
        {/* Cabecera */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span 
                className="badge" 
                style={{ 
                  background: portalInfo.badgeBg, 
                  border: `1px solid ${portalInfo.badgeBorder}`, 
                  color: portalInfo.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 700,
                  textTransform: 'uppercase', 
                  letterSpacing: '0.04em' 
                }}
              >
                <span>{portalInfo.emoji}</span>
                <span>{portalInfo.name}</span>
              </span>
              {application.ats_score && (
                <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Award size={12} />
                  Match ATS: {application.ats_score}%
                </span>
              )}
              {application.is_archived && (
                <span className="badge badge-slate">Archivada en Historial</span>
              )}
            </div>

            <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 700 }}>
              {application.role}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e2e8f0', fontWeight: 600 }}>
                <Building size={14} color="#818cf8" />
                {application.company}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} />
                {application.location_city || '100% Remoto'} ({application.location_type})
              </span>
              {application.salary_range && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#38bdf8' }}>
                  <DollarSign size={13} />
                  {application.salary_range}
                </span>
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
              padding: '0.35rem',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 1. Selector de Estado del Ciclo de Vida */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.15rem'
          }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.65rem' }}>
              Fase Actual de la Oferta:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatus(opt.id)}
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.785rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: isSelected ? `${opt.color}22` : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? opt.color : 'rgba(255, 255, 255, 0.08)'}`,
                      color: isSelected ? '#fff' : '#94a3b8',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                    <span>{opt.label.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-paneles dinámicos según el estado seleccionado */}
            {status === 'sent' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c7d2fe', fontSize: '0.825rem', fontWeight: 600 }}>
                    <Clock size={14} color="#818cf8" />
                    <span>Cuenta regresiva de respuesta: {lifecycle.state_message || 'Esperando respuesta (15 días)'}</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Si no hay contacto al día 15, la oferta se moverá automáticamente a Descartada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExtendWait}
                  disabled={extending}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                >
                  <RefreshCw size={12} className={extending ? 'spin-anim' : ''} />
                  <span>+7 Días de Espera</span>
                </button>
              </div>
            )}

            {status === 'in_progress' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}>
                <label style={{ display: 'block', color: '#34d399', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  ⚠️ Motivo del Proceso (Obligatorio para pasar a "En Proceso"):
                </label>
                <input
                  type="text"
                  placeholder="Ej: He concertado entrevista técnica para el jueves / Contacto telefónico con RRHH"
                  value={inProgressReason}
                  onChange={(e) => setInProgressReason(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            {status === 'discarded' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1, marginRight: '1rem' }}>
                  <label style={{ display: 'block', color: '#fb7185', fontSize: '0.785rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                    Motivo del descarte:
                  </label>
                  <select
                    value={discardReason}
                    onChange={(e) => setDiscardReason(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#111a2e',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: '#f8fafc',
                      fontWeight: 500,
                      borderRadius: '6px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="descarte_manual" style={{ background: '#111a2e', color: '#f8fafc' }}>Descarte manual por el candidato</option>
                    <option value="timeout_15_days" style={{ background: '#111a2e', color: '#f8fafc' }}>Sin respuesta tras 15 días (Auto)</option>
                    <option value="empresa_rechazo" style={{ background: '#111a2e', color: '#f8fafc' }}>Rechazo explícito por la empresa (Email / Portal)</option>
                    <option value="sueldo_bajo" style={{ background: '#111a2e', color: '#f8fafc' }}>Banda salarial insuficiente o no adecuada</option>
                    <option value="descarte_entrevista" style={{ background: '#111a2e', color: '#f8fafc' }}>No superada fase de entrevista / prueba</option>
                  </select>
                </div>

                {application.is_archived && (
                  <button
                    type="button"
                    onClick={handleReopen}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', alignSelf: 'flex-end' }}
                  >
                    <RotateCcw size={12} />
                    <span>Reabrir Oferta</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Enlace directo y Keywords */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.785rem', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ExternalLink size={13} /> Enlace Directo de la Oferta:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {jobUrl && (
                    <a
                      href={jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ 
                        padding: '0.35rem 0.85rem', 
                        fontSize: '0.78rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6,
                        background: portalInfo.badgeBg,
                        border: `1px solid ${portalInfo.badgeBorder}`,
                        color: '#fff',
                        fontWeight: 600
                      }}
                      title={`Abrir oferta original directamente en ${portalInfo.name}`}
                    >
                      <ExternalLink size={13} color={portalInfo.color} />
                      <span>🔗 Abrir oferta en {portalInfo.name}</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const query = `empleo ${application.role} ${application.company}`.trim();
                      const googleUrl = `https://www.google.es/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;
                      setJobUrl(googleUrl);
                      window.open(googleUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Buscar directamente en Google Jobs y asignar el enlace"
                  >
                    <span>🔍 Google Jobs</span>
                  </button>
                </div>
              </div>

              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://... (Enlace de LinkedIn, InfoJobs, Tecnoempleo o web de la empresa)"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${isExact ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  color: isExact ? '#38bdf8' : '#e2e8f0',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />

              {jobUrl && (
                <div style={{ marginTop: '0.2rem' }}>
                  {isExact ? (
                    <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ✓ Enlace directo verificado a la ficha de {portalInfo.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⚠️ Este enlace parece una búsqueda genérica. Te recomendamos pegar la URL exacta de la ficha de empleo.
                    </span>
                  )}
                </div>
              )}
            </div>

            {application.keywords && application.keywords.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <Tag size={13} color="#818cf8" />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Palabras Clave:</span>
                {application.keywords.slice(0, 6).map((kw, i) => (
                  <span key={i} className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MATERIALES ADAPTADOS (CV ATS Y CARTA DE PRESENTACIÓN) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <FileText size={16} color="#34d399" />
                <span>Materiales de Candidatura ATS & Carta</span>
              </h4>

              {(!cvContent && !coverLetterContent) ? (
                <button
                  type="button"
                  onClick={handleGenerateMaterials}
                  disabled={generatingMaterials}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  {generatingMaterials ? <RefreshCw size={13} className="spin-anim" /> : <Sparkles size={13} color="#fbbf24" />}
                  <span>{generatingMaterials ? 'Generando con IA...' : '✨ Generar CV Adaptado y Carta con IA'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateMaterials}
                  disabled={generatingMaterials}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                >
                  <RefreshCw size={12} className={generatingMaterials ? 'spin-anim' : ''} />
                  <span>{generatingMaterials ? 'Regenerando...' : 'Regenerar con IA'}</span>
                </button>
              )}
            </div>

            {(!cvContent && !coverLetterContent) ? (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 0.75rem 0', color: '#94a3b8', fontSize: '0.825rem' }}>
                  Esta oferta aún no tiene CV Adaptado ATS ni Carta de Presentación generados.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateMaterials}
                  disabled={generatingMaterials}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Sparkles size={14} color="#fbbf24" />
                  <span>Generar ahora con IA (Protocolo Zero-Fabrication)</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Selector de Pestaña de Materiales */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setMaterialsTab('cv')}
                      className={`btn btn-sm ${materialsTab === 'cv' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      <FileText size={12} />
                      <span>CV Adaptado ATS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialsTab('letter')}
                      className={`btn btn-sm ${materialsTab === 'letter' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                    >
                      <span>✉️ Carta de Presentación</span>
                    </button>
                  </div>

                  {/* Acciones del documento activo */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyMaterial(materialsTab === 'cv' ? cvContent : coverLetterContent, materialsTab)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      {copiedKey === materialsTab ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                      <span>{copiedKey === materialsTab ? '¡Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadMaterial(materialsTab, 'md')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      <Download size={11} />
                      <span>.md</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadMaterial(materialsTab, 'txt')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      <Download size={11} />
                      <span>.txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', background: 'linear-gradient(135deg, #c2410c, #d97706)' }}
                      title="Imprimir o guardar en PDF A4 bajo normativa ATS"
                    >
                      <Printer size={11} />
                      <span>Imprimir PDF ATS</span>
                    </button>
                  </div>
                </div>

                {/* Visor del Documento Enriquecido */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '1rem',
                  maxHeight: '260px',
                  overflowY: 'auto'
                }}>
                  <MarkdownRenderer content={materialsTab === 'cv' ? cvContent : coverLetterContent} />
                </div>
              </div>
            )}
          </div>

          {/* 3. SISTEMA DE COLETILLAS & BITÁCORA */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MessageSquare size={16} color="#818cf8" />
                <span>Coletillas y Registro de Actividad ({coletillas.length})</span>
              </h4>
              <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                Anota llamadas, nombres de reclutadores, impresiones o enlaces
              </span>
            </div>

            {/* Listado de coletillas */}
            <div style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1rem',
              paddingRight: '0.25rem'
            }}>
              {coletillas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontSize: '0.8rem' }}>
                  Sin coletillas registradas aún. Añade apuntes abajo.
                </div>
              ) : (
                coletillas.map((col, idx) => (
                  <div
                    key={col.id || idx}
                    style={{
                      background: col.category === 'sistema' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
                      borderLeft: `3px solid ${col.category === 'entrevista' ? '#10b981' : (col.category === 'contacto' ? '#818cf8' : '#64748b')}`,
                      padding: '0.55rem 0.75rem',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{col.author || 'Candidato'}</span>
                      <span>{col.date}</span>
                    </div>
                    <div style={{ color: '#e2e8f0', lineHeight: 1.4 }}>{col.content}</div>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para añadir nueva coletilla */}
            <form onSubmit={handleAddColetilla} style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                value={coletillaCategory}
                onChange={(e) => setColetillaCategory(e.target.value)}
                style={{
                  background: '#111a2e',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#f8fafc',
                  fontWeight: 500,
                  borderRadius: '6px',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="general" style={{ background: '#111a2e', color: '#f8fafc' }}>Nota</option>
                <option value="contacto" style={{ background: '#111a2e', color: '#f8fafc' }}>Contacto</option>
                <option value="entrevista" style={{ background: '#111a2e', color: '#f8fafc' }}>Entrevista</option>
                <option value="feedback" style={{ background: '#111a2e', color: '#f8fafc' }}>Feedback</option>
                <option value="salario" style={{ background: '#111a2e', color: '#f8fafc' }}>Salario</option>
              </select>

              <input
                type="text"
                placeholder="Escribe una coletilla o apunte para esta oferta..."
                value={newColetilla}
                onChange={(e) => setNewColetilla(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!newColetilla.trim()}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.45rem 0.85rem' }}
              >
                <Plus size={13} />
                <span>Añadir</span>
              </button>
            </form>
          </div>

          {/* 4. Notas Generales */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Notas y Observaciones de la Oferta:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre requisitos, impresiones, preguntas preparadas..."
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: '#e2e8f0',
                fontSize: '0.825rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

        </div>

        {/* Pie de Acciones */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <div>
            {status !== 'sent' && status !== 'in_progress' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleQuickMarkAsSent}
                disabled={markingSent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#818cf8',
                  borderColor: 'rgba(129, 140, 248, 0.35)',
                  background: 'rgba(99, 102, 241, 0.08)'
                }}
              >
                <Send size={13} />
                <span>{markingSent ? 'Enviando...' : '🚀 Marcar como Enviada (15 días de espera)'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveStatusAndNotes}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle size={15} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
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
        targetJob={application}
        initialDoc={materialsTab}
      />
      </div>
    </ModalPortal>
  );
}
