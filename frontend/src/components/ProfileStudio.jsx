import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Upload, 
  Save, 
  RotateCcw, 
  ShieldCheck, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  Layers,
  Printer, 
  Edit3,
  Loader2,
  TreePine,
  Brain,
  Eye,
  Activity,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import SimulatedCvPreview from './SimulatedCvPreview';
import ProfileEditModal from './ProfileEditModal';
import ProfileAuditDashboard from './ProfileAuditDashboard';
import ProfileImprovementModal from './ProfileImprovementModal';
import CareerRoadmapView from './CareerRoadmapView';
import RecruiterTrafficLight from './RecruiterTrafficLight';
import MarkdownViewerModal from './MarkdownViewerModal';
import DocumentPrintModal from './DocumentPrintModal';
import UploadCertificateModal from './UploadCertificateModal';

// Aplanador universal y seguro de competencias
const flattenSkillsList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    const res = [];
    raw.forEach(item => {
      if (!item) return;
      if (typeof item === 'string') {
        const trimmed = item.trim();
        if (trimmed) res.push(trimmed);
      } else if (typeof item === 'object') {
        if (Array.isArray(item.skills)) {
          item.skills.forEach(s => {
            if (typeof s === 'string' && s.trim()) res.push(s.trim());
            else if (s && typeof s === 'object' && s.name) res.push(String(s.name).trim());
          });
        } else if (item.name && typeof item.name === 'string') {
          res.push(item.name.trim());
        } else if (item.skill && typeof item.skill === 'string') {
          res.push(item.skill.trim());
        }
      }
    });
    return Array.from(new Set(res));
  }
  if (typeof raw === 'object') {
    return Object.values(raw).flatMap(v => flattenSkillsList(v));
  }
  return [String(raw).trim()];
};

// Normalizador seguro para adaptar perfiles estructurados
const normalizeProfileSkills = (p) => {
  if (!p) return p;
  let hard = [];
  let tools = Array.isArray(p.tools_and_tech) ? flattenSkillsList(p.tools_and_tech) : [];
  let soft = Array.isArray(p.soft_skills) ? flattenSkillsList(p.soft_skills) : [];

  if (Array.isArray(p.hard_skills)) {
    p.hard_skills.forEach(item => {
      if (typeof item === 'string') {
        hard.push(item.trim());
      } else if (typeof item === 'object' && item) {
        const cat = (item.category || '').toLowerCase();
        const items = Array.isArray(item.skills) 
          ? item.skills.map(s => typeof s === 'string' ? s.trim() : (s?.name || '')).filter(Boolean) 
          : [];
        if (cat.includes('informática') || cat.includes('ofimática') || cat.includes('software') || cat.includes('herramienta') || cat.includes('tecnolog')) {
          tools.push(...items);
        } else if (cat.includes('blandas') || cat.includes('soft') || cat.includes('interpersonal')) {
          soft.push(...items);
        } else {
          hard.push(...items);
        }
      }
    });
  }

  if (soft.length === 0 && Array.isArray(p.work_experience)) {
    p.work_experience.forEach(exp => {
      if (Array.isArray(exp.inferred_soft_skills)) {
        soft.push(...exp.inferred_soft_skills);
      }
    });
  }

  return {
    ...p,
    hard_skills: Array.from(new Set(hard.filter(Boolean))),
    tools_and_tech: Array.from(new Set(tools.filter(Boolean))),
    soft_skills: Array.from(new Set(soft.filter(Boolean))),
    languages: Array.isArray(p.languages) ? p.languages : []
  };
};

export default function ProfileStudio({ onProfileUpdated }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Estados de Modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalInitialTab, setEditModalInitialTab] = useState('personal');
  const [showEnhancerModal, setShowEnhancerModal] = useState(false);
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [markdownModalContent, setMarkdownModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('CV Maestro');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCertUploadModal, setShowCertUploadModal] = useState(false);

  // Navegación en móvil: 'audit' (columna izq) o 'cv' (columna der)
  const [mobileTab, setMobileTab] = useState('audit');

  // Medición dinámica del alto total de los 3 campos de la izquierda (Carga CV, Informe Talento, Mapa)
  const leftColRef = useRef(null);
  const [leftColHeight, setLeftColHeight] = useState(null);

  useEffect(() => {
    if (!leftColRef.current) return;

    const updateHeight = () => {
      if (leftColRef.current) {
        const rect = leftColRef.current.getBoundingClientRect();
        if (rect.height > 150) {
          setLeftColHeight(Math.round(rect.height));
        }
      }
    };

    updateHeight();

    const ro = new ResizeObserver(() => {
      updateHeight();
    });

    ro.observe(leftColRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [auditResult]);

  // Notificación toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cargar perfil y auditoría persistente al montar
  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getProfile();
      setProfile(normalizeProfileSkills(data));

      try {
        const savedAudit = await api.getProfileAudit();
        if (savedAudit) {
          setAuditResult(savedAudit);
        }
      } catch (err) {
        console.warn('Sin auditoría previa guardada:', err);
      }
    } catch (e) {
      console.error('Error cargando perfil:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.updateProfile(profile);
      showToast('✅ ¡Perfil profesional y CV Maestro guardados con éxito!');
      if (onProfileUpdated) onProfileUpdated();
    } catch (e) {
      alert(`Error al guardar perfil: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Subir CV (PDF/Word) y autocompletar con IA
  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadAndParseCv(file);
      setProfile(normalizeProfileSkills(res.profile));
      showToast('📄 ¡Currículum procesado con éxito y CV Maestro autocompletado!');
      if (onProfileUpdated) onProfileUpdated();

      // Lanzar o actualizar auditoría
      try {
        const newAudit = await api.runProfileAudit();
        setAuditResult(newAudit);
      } catch (auditErr) {
        console.warn('Error auditando tras subir CV:', auditErr);
      }
    } catch (e) {
      alert(`Error al procesar el currículum: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Restablecer aplicación a Estado 0
  const handleResetToZero = async () => {
    if (window.confirm('⚠️ ¿Estás seguro de que deseas dejar la aplicación a 0? Se borrarán todos tus datos personales, experiencias, candidaturas y planes guardados.')) {
      try {
        await api.resetAllData();
        await loadProfile();
        setAuditResult(null);
        showToast('🔄 Aplicación restablecida a Estado 0.');
        if (onProfileUpdated) onProfileUpdated();
      } catch (e) {
        alert(`Error al restablecer: ${e.message}`);
      }
    }
  };

  // Ejecutar auditoría con IA
  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const result = await api.runProfileAudit();
      setAuditResult(result);
      showToast('🎯 Auditoría de talento completada y sincronizada.');
    } catch (e) {
      alert(`Error en auditoría de talento: ${e.message}`);
    } finally {
      setAuditing(false);
    }
  };

  // Aplicar mejoras con 1 clic y reevaluación automática
  const handleEnhancementsApplied = async (res) => {
    if (res && res.profile) {
      setProfile(normalizeProfileSkills(res.profile));
    } else {
      await loadProfile();
    }
    if (res && res.audit) {
      setAuditResult(res.audit);
      showToast(`🎯 ¡Mejoras aplicadas! CV Maestro reevaluado con IA (Score: ${res.audit.overall_score || 88}%).`);
    } else {
      showToast('✨ ¡Mejoras aplicadas y sincronizadas con el CV Maestro!');
      try {
        const updatedAudit = await api.getProfileAudit();
        if (updatedAudit) setAuditResult(updatedAudit);
      } catch (err) {
        console.warn('Error refrescando auditoría:', err);
      }
    }
    if (onProfileUpdated) onProfileUpdated();
  };

  // Exportar CV en Markdown
  const handleViewCvMarkdown = async () => {
    try {
      const md = await api.getMarkdownExport();
      setMarkdownModalContent(md);
      setModalTitle('CV Maestro (Fuente de Verdad)');
      setShowMarkdownModal(true);
    } catch (e) {
      alert('Error obteniendo Markdown');
    }
  };

  const handleOpenEditModal = (section = 'personal') => {
    setEditModalInitialTab(section);
    setShowEditModal(true);
  };

  const handleProfileSavedFromModal = (newProfile) => {
    setProfile(normalizeProfileSkills(newProfile));
    showToast('✅ ¡CV Maestro actualizado con éxito!');
    if (onProfileUpdated) onProfileUpdated();
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
          <Loader2 size={36} className="spin-anim" style={{ color: '#38bdf8' }} />
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center' }}>
          Cargando perfil profesional y CV Maestro
          <span className="thinking-dots" style={{ color: '#38bdf8' }}><span></span><span></span><span></span></span>
        </p>
        <div className="progress-indeterminate-track" style={{ width: '240px', marginTop: '0.75rem' }}>
          <div className="progress-indeterminate-runner" />
        </div>
      </div>
    );
  }

  const pInfo = profile?.personal_info || {};
  const experiences = profile?.work_experience || [];
  const educations = profile?.education || [];
  const certs = profile?.certifications || [];
  const hardSkills = flattenSkillsList(profile?.hard_skills);
  const toolsAndTech = flattenSkillsList(profile?.tools_and_tech);

  const hasName = Boolean(pInfo.full_name && pInfo.full_name.trim());
  const hasHeadline = Boolean(pInfo.headline && pInfo.headline.trim());
  const hasExp = experiences.length > 0;
  const hasEdu = educations.length > 0;
  const hasSkills = hardSkills.length > 0 || toolsAndTech.length > 0;
  
  const completeness = (hasName ? 20 : 0) + (hasHeadline ? 15 : 0) + (hasEdu ? 25 : 0) + (hasExp ? 25 : 0) + (hasSkills ? 15 : 0);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3.5rem' }}>
      
      {/* TOAST FLOTANTE */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#047857',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
            fontSize: '0.85rem',
            fontWeight: 700,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* 1. CABECERA PRINCIPAL Y ACCIONES */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <div 
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: '14px', 
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
                }}
              >
                <User size={22} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {hasName ? pInfo.full_name : <span style={{ color: '#f87171' }}>[Nombre No Registrado]</span>}
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                  {pInfo.headline || 'Perfil profesional listo para configurar'}
                </p>
              </div>
            </div>

            {/* Barra de completitud */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ width: '220px', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${completeness}%`, 
                    background: completeness >= 80 ? '#10b981' : completeness >= 50 ? '#38bdf8' : '#f59e0b',
                    borderRadius: '10px',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                Completitud: {completeness}%
              </span>
            </div>
          </div>

          {/* BOTONERA DE ACCIÓN RÁPIDA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <button 
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenEditModal('personal')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
            >
              <Edit3 size={14} />
              <span>Editar Perfil (Modal)</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={() => setShowCertUploadModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22), rgba(56, 189, 248, 0.22))',
                borderColor: 'rgba(168, 85, 247, 0.45)',
                color: '#d8b4fe',
                fontWeight: 700
              }}
              title="Subir cursos y certificados en PDF para que la IA los evalúe y los incorpore a tu CV Maestro"
            >
              <Award size={14} color="#c084fc" />
              <span>Subir Cursos (PDF / IA)</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={handleViewCvMarkdown}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Ver código fuente curricular en Markdown"
            >
              <FileText size={14} color="#818cf8" />
              <span>Markdown</span>
            </button>

            <button 
              type="button"
              className="btn btn-secondary" 
              onClick={() => setShowPrintModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Imprimir o exportar en PDF A4"
            >
              <Printer size={14} color="#f59e0b" />
              <span>PDF A4</span>
            </button>

            <button 
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981' }}
            >
              {saving ? <Loader2 size={14} className="spin-anim" /> : <Save size={14} />}
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>

            <button 
              type="button"
              onClick={handleResetToZero}
              style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                color: '#f87171', 
                padding: '0.45rem 0.75rem', 
                borderRadius: '8px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem'
              }}
              title="Restablecer toda la aplicación a Estado 0"
            >
              <RotateCcw size={13} />
              <span>Reset a 0</span>
            </button>
          </div>
        </div>
      </div>

      {/* ALERTA DE REGISTRO PREVIO OBLIGATORIO DE DATOS */}
      {!hasName && (
        <div 
          style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.18) 0%, rgba(245, 158, 11, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
          }}
        >
          <AlertCircle size={26} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#fef3c7', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>
              ⚠️ Registra tu nombre y datos de contacto en el CV Maestro
            </strong>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Sube tu currículum en PDF para autocompletar tus datos o pulsa en <strong>"Editar Perfil (Modal)"</strong> para rellenarlos manualmente.
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => handleOpenEditModal('personal')}
            className="btn btn-primary btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            Editar Ahora
          </button>
        </div>
      )}

      {/* SELECTOR EXCLUSIVO PARA DISPOSITIVOS MÓVILES (< 1024px) */}
      <div 
        className="mobile-only-toggle" 
        style={{ 
          display: 'none', 
          background: 'rgba(15, 23, 42, 0.7)', 
          padding: '4px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.1)' 
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab('audit')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: mobileTab === 'audit' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
            color: mobileTab === 'audit' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Activity size={15} />
          <span>Auditoría & Herramientas</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cv')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: mobileTab === 'cv' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
            color: mobileTab === 'cv' ? '#34d399' : '#94a3b8',
            fontWeight: 700,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Eye size={15} />
          <span>Ver CV Simulado</span>
        </button>
      </div>

      {/* =========================================================================
          2. LAYOUT SPLIT EN 2 COLUMNAS (PC / DESKTOP) & RESPONSIVE MÓVIL
          ========================================================================= */}
      <div 
        className="profile-split-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) minmax(380px, 1.15fr)',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* COLUMNA IZQUIERDA: 3 CAMPOS (CARGA CV, INFORME TALENTO, MAPA COMPETENCIAS) */}
        <div 
          ref={leftColRef}
          className={`split-col-left ${mobileTab === 'cv' ? 'hide-on-mobile' : ''}`}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <ProfileAuditDashboard
            audit={auditResult}
            auditing={auditing}
            uploading={uploading}
            onReaudit={handleRunAudit}
            onOpenEnhancer={() => setShowEnhancerModal(true)}
            onOpenEditModal={handleOpenEditModal}
            onUploadCv={handleFileUpload}
            onScrollToRoadmap={() => {
              document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>

        {/* COLUMNA DERECHA: CV SIMULADO EN VIVO (CV MAESTRO) CON ALTO SINCRONIZADO */}
        <div 
          className={`split-col-right ${mobileTab === 'audit' ? 'hide-on-mobile' : ''}`}
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: leftColHeight ? `${leftColHeight}px` : 'auto',
            maxHeight: leftColHeight ? `${leftColHeight}px` : 'none'
          }}
        >
          <SimulatedCvPreview
            profile={profile}
            onOpenEditModal={handleOpenEditModal}
            onOpenPrintModal={() => setShowPrintModal(true)}
            onOpenMarkdownModal={handleViewCvMarkdown}
            customHeight={leftColHeight}
          />
        </div>
      </div>

      {/* =========================================================================
          3. SEMÁFORO DE DESCARTE RECRUITER (100% ANCHO COMPLETO)
          ========================================================================= */}
      {auditResult && (
        <div style={{ width: '100%' }}>
          <RecruiterTrafficLight
            trafficLight={auditResult.traffic_light || {}}
            conversionRate={auditResult.interview_conversion_rate || `${Math.max(25, (auditResult.overall_score || 70) - 12)}%`}
            verdict={auditResult.verdict_summary || ''}
            softSkills={auditResult.inferred_soft_skills || []}
          />
        </div>
      )}

      {/* =========================================================================
          4. PARTE INFERIOR CONSTANTE: ROADMAP DE EMPLEABILIDAD CON CEREBRO / ÁRBOL
          ========================================================================= */}
      <div id="roadmap-section" style={{ marginTop: '0.25rem' }}>
        <CareerRoadmapView
          audit={auditResult}
          onAuditUpdated={(newAudit) => setAuditResult(newAudit)}
        />
      </div>

      {/* MODAL DE EDICIÓN DEL CV MAESTRO */}
      <ProfileEditModal
        isOpen={showEditModal}
        initialTab={editModalInitialTab}
        profile={profile}
        onClose={() => setShowEditModal(false)}
        onProfileSaved={handleProfileSavedFromModal}
      />

      {/* MODAL DE SUBIDA Y EVALUACIÓN IA DE CERTIFICADOS EN PDF */}
      {showCertUploadModal && (
        <UploadCertificateModal
          isOpen={showCertUploadModal}
          mode="profile"
          onClose={() => setShowCertUploadModal(false)}
          onSuccess={(res) => {
            if (res && res.profile) {
              setProfile(normalizeProfileSkills(res.profile));
            } else {
              loadProfile();
            }
            showToast('📜 ¡Cursos evaluados y registrados en tu CV Maestro con éxito!');
            if (onProfileUpdated) onProfileUpdated();
          }}
        />
      )}

      {/* MODAL DE OPTIMIZACIÓN ASISTIDA (1-CLICK ENHANCER) */}
      {showEnhancerModal && auditResult && (
        <ProfileImprovementModal
          audit={auditResult}
          onClose={() => setShowEnhancerModal(false)}
          onEnhancementsApplied={handleEnhancementsApplied}
        />
      )}

      {/* MODAL VISOR MARKDOWN */}
      <MarkdownViewerModal
        isOpen={showMarkdownModal}
        onClose={() => setShowMarkdownModal(false)}
        markdownContent={markdownModalContent}
        title={modalTitle}
        profileData={profile}
      />

      {/* MODAL IMPRESIÓN CV ATS EN PDF */}
      <DocumentPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        profileData={profile}
        initialDoc="cv"
      />

      {/* ESTILOS CSS INLINE PARA RESPONSIVE Y MOBILE TOGGLE */}
      <style>{`
        .cv-canvas-scrollable::-webkit-scrollbar {
          width: 6px;
        }
        .cv-canvas-scrollable::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
        }
        .cv-canvas-scrollable::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.35);
          border-radius: 8px;
        }
        .cv-canvas-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.6);
        }

        @media (max-width: 1024px) {
          .profile-split-container {
            grid-template-columns: 1fr !important;
          }
          .split-col-right {
            height: auto !important;
            max-height: none !important;
          }
          .simulated-cv-card {
            height: auto !important;
            max-height: none !important;
          }
          .cv-canvas-scrollable {
            max-height: 75vh !important;
          }
          .mobile-only-toggle {
            display: flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
