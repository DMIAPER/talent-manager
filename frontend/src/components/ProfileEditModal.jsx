import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Save, 
  Camera, 
  Trash2, 
  Plus, 
  Sparkles, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Award,
  Eye,
  Download,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import UploadCertificateModal from './UploadCertificateModal';
import CertificatePdfViewerModal from './CertificatePdfViewerModal';
import ModalPortal from './ModalPortal';

export default function ProfileEditModal({
  isOpen,
  initialTab = 'personal',
  profile,
  onClose,
  onProfileSaved
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isExtractingSkills, setIsExtractingSkills] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCertForViewer, setSelectedCertForViewer] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para añadir skills e idiomas rápidamente
  const [newSkillInputs, setNewSkillInputs] = useState({
    hard: '',
    tool: '',
    soft: ''
  });
  const [newLanguageInput, setNewLanguageInput] = useState({
    language: '',
    proficiency: 'Intermedio (B2)'
  });

  useEffect(() => {
    if (isOpen && profile) {
      // Clon profundo seguro para edición
      setFormData(JSON.parse(JSON.stringify(profile)));
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, profile, initialTab]);

  if (!isOpen || !formData) return null;

  const pInfo = formData.personal_info || {};
  const experiences = formData.work_experience || [];
  const educations = formData.education || [];
  const certs = formData.certifications || [];
  const hardSkills = Array.isArray(formData.hard_skills) ? formData.hard_skills : [];
  const toolsAndTech = Array.isArray(formData.tools_and_tech) ? formData.tools_and_tech : [];
  const softSkills = Array.isArray(formData.soft_skills) ? formData.soft_skills : [];
  const languages = Array.isArray(formData.languages) ? formData.languages : [];

  // Manejo de Foto de Perfil
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setFormData({
          ...formData,
          personal_info: {
            ...pInfo,
            avatar_url: dataUrl
          }
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    setFormData({
      ...formData,
      personal_info: {
        ...pInfo,
        avatar_url: ''
      }
    });
  };

  // Manejo de Guardado
  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(formData);
      if (onProfileSaved) onProfileSaved(formData);
      onClose();
    } catch (e) {
      alert(`Error guardando perfil: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Manejadores de Formación
  const handleAddEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      degree: '',
      level: 'fp_medio',
      institution: '',
      field_of_study: '',
      start_year: '',
      end_year: '',
      is_current: false,
      grade: '',
      description: ''
    };
    setFormData({
      ...formData,
      education: [newEdu, ...educations]
    });
  };

  const handleUpdateEducation = (id, field, value) => {
    const updated = educations.map(e => e.id === id ? { ...e, [field]: value } : e);
    setFormData({ ...formData, education: updated });
  };

  const handleDeleteEducation = (id) => {
    setFormData({ ...formData, education: educations.filter(e => e.id !== id) });
  };

  // Manejadores de Certificaciones
  const handleAddCert = () => {
    const newCert = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      hours: '',
      year: new Date().getFullYear().toString()
    };
    setFormData({
      ...formData,
      certifications: [newCert, ...certs]
    });
  };

  const handleUpdateCert = (id, field, value) => {
    const updated = certs.map(c => c.id === id ? { ...c, [field]: value } : c);
    setFormData({ ...formData, certifications: updated });
  };

  const handleDeleteCert = (id) => {
    setFormData({ ...formData, certifications: certs.filter(c => c.id !== id) });
  };

  // Manejadores de Experiencia Laboral
  const handleAddExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      role: '',
      company: '',
      start_date: '',
      end_date: '',
      is_current: false,
      location: '',
      contract_type: 'Tiempo Completo',
      achievements: ['']
    };
    setFormData({
      ...formData,
      work_experience: [newExp, ...experiences]
    });
  };

  const handleUpdateExperience = (id, field, value) => {
    const updated = experiences.map(e => e.id === id ? { ...e, [field]: value } : e);
    setFormData({ ...formData, work_experience: updated });
  };

  const handleDeleteExperience = (id) => {
    setFormData({ ...formData, work_experience: experiences.filter(e => e.id !== id) });
  };

  const handleAddAchievement = (expId) => {
    const updated = experiences.map(exp => {
      if (exp.id === expId) {
        return {
          ...exp,
          achievements: [...(exp.achievements || []), '']
        };
      }
      return exp;
    });
    setFormData({ ...formData, work_experience: updated });
  };

  const handleUpdateAchievement = (expId, achIdx, text) => {
    const updated = experiences.map(exp => {
      if (exp.id === expId) {
        const achs = [...(exp.achievements || [])];
        achs[achIdx] = text;
        return { ...exp, achievements: achs };
      }
      return exp;
    });
    setFormData({ ...formData, work_experience: updated });
  };

  const handleDeleteAchievement = (expId, achIdx) => {
    const updated = experiences.map(exp => {
      if (exp.id === expId) {
        return {
          ...exp,
          achievements: (exp.achievements || []).filter((_, idx) => idx !== achIdx)
        };
      }
      return exp;
    });
    setFormData({ ...formData, work_experience: updated });
  };

  // Manejadores de Skills
  const handleAddSkill = (category) => {
    const val = (newSkillInputs[category] || '').trim();
    if (!val) return;

    if (category === 'hard') {
      if (!hardSkills.includes(val)) {
        setFormData({ ...formData, hard_skills: [...hardSkills, val] });
      }
    } else if (category === 'tool') {
      if (!toolsAndTech.includes(val)) {
        setFormData({ ...formData, tools_and_tech: [...toolsAndTech, val] });
      }
    } else if (category === 'soft') {
      if (!softSkills.includes(val)) {
        setFormData({ ...formData, soft_skills: [...softSkills, val] });
      }
    }

    setNewSkillInputs({ ...newSkillInputs, [category]: '' });
  };

  const handleDeleteSkill = (category, item) => {
    if (category === 'hard') {
      setFormData({ ...formData, hard_skills: hardSkills.filter(s => s !== item) });
    } else if (category === 'tool') {
      setFormData({ ...formData, tools_and_tech: toolsAndTech.filter(t => t !== item) });
    } else if (category === 'soft') {
      setFormData({ ...formData, soft_skills: softSkills.filter(s => s !== item) });
    }
  };

  // Manejo de Idiomas
  const handleAddLanguage = () => {
    const lang = (newLanguageInput.language || '').trim();
    if (!lang) return;

    const newLang = { language: lang, proficiency: newLanguageInput.proficiency };
    setFormData({ ...formData, languages: [...languages, newLang] });
    setNewLanguageInput({ language: '', proficiency: 'Intermedio (B2)' });
  };

  const handleDeleteLanguage = (index) => {
    setFormData({ ...formData, languages: languages.filter((_, idx) => idx !== index) });
  };

  // Extracción Asistida de Skills con IA
  const handleExtractSkillsWithAi = async () => {
    setIsExtractingSkills(true);
    try {
      const extracted = await api.extractSkillsWithAi(formData);
      const combinedHard = Array.from(new Set([...hardSkills, ...(extracted.hard_skills || [])]));
      const combinedTools = Array.from(new Set([...toolsAndTech, ...(extracted.tools_and_tech || [])]));
      const combinedSoft = Array.from(new Set([...softSkills, ...(extracted.soft_skills || [])]));

      setFormData({
        ...formData,
        hard_skills: combinedHard,
        tools_and_tech: combinedTools,
        soft_skills: combinedSoft
      });
      alert(`✨ ¡Extracción completada! Se detectaron y agregaron ${extracted.hard_skills?.length || 0} habilidades técnicas.`);
    } catch (e) {
      alert(`Error extrayendo habilidades: ${e.message}`);
    } finally {
      setIsExtractingSkills(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
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
            maxWidth: '920px',
            maxHeight: '90vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* CABECERA DEL MODAL */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 800 }}>
              Editar Perfil Profesional (CV Maestro)
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Personaliza tus datos. Al guardar, se sincronizará automáticamente con el CV Maestro y el simulador en vivo.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <div 
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.4)',
            overflowX: 'auto'
          }}
        >
          <button
            onClick={() => setActiveTab('personal')}
            className={`btn btn-sm ${activeTab === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <User size={14} />
            <span>1. Datos Personales & Foto</span>
          </button>

          <button
            onClick={() => setActiveTab('education')}
            className={`btn btn-sm ${activeTab === 'education' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <GraduationCap size={14} />
            <span>2. Formación ({educations.length + certs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`btn btn-sm ${activeTab === 'experience' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Briefcase size={14} />
            <span>3. Experiencia ({experiences.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`btn btn-sm ${activeTab === 'skills' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <Code size={14} />
            <span>4. Skills & Competencias</span>
          </button>
        </div>

        {/* CUERPO DEL MODAL (SCROLLABLE) */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* TAB 1: DATOS PERSONALES & CONTACTO */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* SECCIÓN DE FOTO DE PERFIL */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.25rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div style={{ position: 'relative' }}>
                  {pInfo.avatar_url ? (
                    <img 
                      src={pInfo.avatar_url} 
                      alt="Avatar" 
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: '2px solid #38bdf8'
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5rem',
                        fontWeight: 700
                      }}
                    >
                      <User size={36} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Fotografía de Perfil Profesional
                  </label>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Sube una foto profesional en formato JPG, PNG o WebP (máximo 2MB). Se reflejará en el CV Maestro simulado.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/png,image/jpeg,image/webp" 
                      onChange={handleImageFileChange} 
                      style={{ display: 'none' }} 
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                    >
                      <Camera size={13} color="#38bdf8" />
                      <span>{pInfo.avatar_url ? 'Cambiar Imagen' : 'Subir Imagen de Perfil'}</span>
                    </button>

                    {pInfo.avatar_url && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.78rem' }}
                      >
                        <Trash2 size={13} />
                        <span>Quitar Foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CAMPOS DE TEXTO PRINCIPALES */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Nombre y Apellidos *
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Carmen García Soler"
                    value={pInfo.full_name || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, full_name: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Titular Profesional *
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Senior Frontend Developer | React & TypeScript"
                    value={pInfo.headline || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, headline: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Correo Electrónico
                  </label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="carmen.dev@ejemplo.com"
                    value={pInfo.email || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, email: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Teléfono de Contacto
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="+34 600 000 000"
                    value={pInfo.phone || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, phone: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Ciudad / Residencia
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Madrid, España (Remoto)"
                    value={pInfo.location || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, location: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Perfil LinkedIn (URL o usuario)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="linkedin.com/in/carmen-dev"
                    value={pInfo.linkedin || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, linkedin: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    GitHub (URL o usuario)
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="github.com/carmendev"
                    value={pInfo.github || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, github: e.target.value } })} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                    Portfolio Web Personal
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="https://carmengarcia.dev"
                    value={pInfo.portfolio || ''} 
                    onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, portfolio: e.target.value } })} 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                  Extracto / Resumen Profesional (Elevator Pitch)
                </label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  placeholder="Resumen conciso de tu trayectoria profesional, logros cuantitativos y propuesta de valor..."
                  value={pInfo.summary || ''} 
                  onChange={(e) => setFormData({ ...formData, personal_info: { ...pInfo, summary: e.target.value } })} 
                />
              </div>
            </div>
          )}

          {/* TAB 2: FORMACIÓN Y CERTIFICACIONES */}
          {activeTab === 'education' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* TARJETA DESTACADA: SUBIDA DE CURSOS EN PDF CON IA */}
              <div style={{
                padding: '1.1rem 1.35rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ maxWidth: '440px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#c084fc" />
                    <span style={{ fontSize: '0.92rem', color: '#f8fafc', fontWeight: 800 }}>
                      Subir Cursos y Diplomas en PDF (Evaluación IA)
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Sube los certificados de los cursos que has realizado. La IA extraerá los datos oficiales (titulación, emisor, horas, año) y registrará las competencias acreditadas en tu CV Maestro.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #9333ea 0%, #0284c7 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(147, 51, 234, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Upload size={14} />
                  <span>Subir Cursos (PDF / IA)</span>
                </button>
              </div>

              {/* Formación Reglada */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                    Formación Académica Reglada
                  </h4>
                  <button type="button" onClick={handleAddEducation} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={14} /> <span>Añadir Titulación</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {educations.map((edu) => (
                    <div key={edu.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Titulación</label>
                          <input type="text" className="form-input" placeholder="Ej. Grado en Ingeniería Informática" value={edu.degree || ''} onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Institución / Universidad</label>
                          <input type="text" className="form-input" placeholder="Ej. Universidad Complutense" value={edu.institution || ''} onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Año Inicio</label>
                          <input type="text" className="form-input" placeholder="2018" value={edu.start_year || ''} onChange={(e) => handleUpdateEducation(edu.id, 'start_year', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Año Fin</label>
                          <input type="text" className="form-input" placeholder="2022" value={edu.end_year || ''} onChange={(e) => handleUpdateEducation(edu.id, 'end_year', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Boolean(edu.certificate_url || edu.certificate_file) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedCertForViewer({ ...edu, title: edu.degree, degree_type_label: edu.degree_type_label || 'Titulación Oficial' })}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)', background: 'rgba(56, 189, 248, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Ver documento PDF cargado"
                            >
                              <Eye size={12} />
                              <span>Ver PDF</span>
                            </button>
                            <a
                              href={api.getCertificateDownloadUrl(edu.certificate_file || edu.certificate_url)}
                              download={String(edu.certificate_file || edu.certificate_url).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') || 'titulo.pdf'}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', padding: '3px 7px', color: '#cbd5e1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Descargar PDF"
                            >
                              <Download size={12} />
                              <span>Descargar</span>
                            </a>
                            <span style={{ fontSize: '0.66rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              <ShieldCheck size={11} /> Verificado
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Sin archivo adjunto</span>
                        )}
                        <button type="button" onClick={() => handleDeleteEducation(edu.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={12} /> <span>Eliminar Titulación</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificaciones Técnicas */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                    Cursos y Certificaciones Profesionales
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowCertModal(true)} 
                      className="btn btn-secondary btn-sm" 
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(168, 85, 247, 0.4)', color: '#d8b4fe' }}
                    >
                      <Upload size={13} color="#c084fc" /> <span>Subir PDF (IA)</span>
                    </button>
                    <button type="button" onClick={handleAddCert} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={14} /> <span>Añadir Manual</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {certs.map((c) => {
                    const hasCert = Boolean(c.certificate_url || c.certificate_file);
                    return (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: hasCert ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: '0.65rem', alignItems: 'center' }}>
                          <input type="text" className="form-input" placeholder="Nombre certificación" value={c.name || ''} onChange={(e) => handleUpdateCert(c.id, 'name', e.target.value)} />
                          <input type="text" className="form-input" placeholder="Emisor (ej. AWS, Google)" value={c.issuer || ''} onChange={(e) => handleUpdateCert(c.id, 'issuer', e.target.value)} />
                          <input type="text" className="form-input" placeholder="Horas (ej. 120)" value={c.hours || ''} onChange={(e) => handleUpdateCert(c.id, 'hours', e.target.value)} />
                          <input type="text" className="form-input" placeholder="Año" value={c.year || ''} onChange={(e) => handleUpdateCert(c.id, 'year', e.target.value)} />
                          <button type="button" onClick={() => handleDeleteCert(c.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {hasCert && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedCertForViewer({ ...c, title: c.name, degree_type_label: c.degree_type_label || 'Certificación' })}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.08)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Ver documento PDF cargado"
                              >
                                <Eye size={12} />
                                <span>Ver PDF</span>
                              </button>
                              <a
                                href={api.getCertificateDownloadUrl(c.certificate_file || c.certificate_url)}
                                download={String(c.certificate_file || c.certificate_url).split('/').pop().replace(/^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_/, '') || 'certificado.pdf'}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.72rem', padding: '2px 7px', color: '#cbd5e1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                title="Descargar PDF"
                              >
                                <Download size={12} />
                                <span>Descargar</span>
                              </a>
                            </div>
                            <span style={{ fontSize: '0.66rem', color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                              <ShieldCheck size={11} /> Certificado Oficial
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPERIENCIA LABORAL */}
          {activeTab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                  Historial de Experiencia Laboral
                </h4>
                <button type="button" onClick={handleAddExperience} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={14} /> <span>Añadir Experiencia</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {experiences.map((exp) => (
                  <div key={exp.id} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Puesto / Rol</label>
                        <input type="text" className="form-input" placeholder="Ej. Tech Lead" value={exp.role || ''} onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Empresa</label>
                        <input type="text" className="form-input" placeholder="Ej. Acme Corp" value={exp.company || ''} onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Fecha Inicio</label>
                        <input type="text" className="form-input" placeholder="01/2022" value={exp.start_date || ''} onChange={(e) => handleUpdateExperience(exp.id, 'start_date', e.target.value)} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Fecha Fin</label>
                        <input type="text" className="form-input" placeholder="Actualidad" value={exp.end_date || ''} onChange={(e) => handleUpdateExperience(exp.id, 'end_date', e.target.value)} />
                      </div>
                    </div>

                    {/* Logros STAR */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                          Logros Cuantitativos y Responsabilidades (Viñetas STAR)
                        </span>
                        <button type="button" onClick={() => handleAddAchievement(exp.id)} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Plus size={11} /> Añadir Viñeta
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {(exp.achievements || []).map((ach, aIdx) => (
                          <div key={aIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Ej. Rediseñé la arquitectura backend reduciendo latencias en un 40%..."
                              value={ach} 
                              onChange={(e) => handleUpdateAchievement(exp.id, aIdx, e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            />
                            <button type="button" onClick={() => handleDeleteAchievement(exp.id, aIdx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                      <button type="button" onClick={() => handleDeleteExperience(exp.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trash2 size={12} /> Eliminar Experiencia
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SKILLS & IDIOMAS */}
          {activeTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
                  Competencias Técnicas y Habilidades
                </h4>
                <button
                  type="button"
                  onClick={handleExtractSkillsWithAi}
                  disabled={isExtractingSkills}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                >
                  <Sparkles size={13} className={isExtractingSkills ? 'spin-anim' : ''} />
                  <span>{isExtractingSkills ? 'Analizando...' : 'Extraer Skills con IA'}</span>
                </button>
              </div>

              {/* Hard Skills */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  HARD SKILLS (TÉCNICAS)
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.65rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Python, FastAPI, Docker, SQL..." 
                    value={newSkillInputs.hard}
                    onChange={(e) => setNewSkillInputs({ ...newSkillInputs, hard: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('hard'))}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button type="button" onClick={() => handleAddSkill('hard')} className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {hardSkills.map((s, idx) => (
                    <span key={idx} style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {typeof s === 'string' ? s : s?.name}
                      <button type="button" onClick={() => handleDeleteSkill('hard', s)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tools & Tech */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  HERRAMIENTAS & SOFTWARE
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.65rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Git, Jira, VS Code, Postman..." 
                    value={newSkillInputs.tool}
                    onChange={(e) => setNewSkillInputs({ ...newSkillInputs, tool: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('tool'))}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button type="button" onClick={() => handleAddSkill('tool')} className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {toolsAndTech.map((t, idx) => (
                    <span key={idx} style={{ background: 'rgba(129, 140, 248, 0.12)', border: '1px solid rgba(129, 140, 248, 0.25)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {typeof t === 'string' ? t : t?.name}
                      <button type="button" onClick={() => handleDeleteSkill('tool', t)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  HABILIDADES INTERPERSONALES (SOFT SKILLS)
                </span>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '0.65rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Liderazgo, Comunicación asertiva, Resolución de problemas..." 
                    value={newSkillInputs.soft}
                    onChange={(e) => setNewSkillInputs({ ...newSkillInputs, soft: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('soft'))}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button type="button" onClick={() => handleAddSkill('soft')} className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {softSkills.map((sk, idx) => (
                    <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {typeof sk === 'string' ? sk : sk?.name}
                      <button type="button" onClick={() => handleDeleteSkill('soft', sk)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Idiomas */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                  IDIOMAS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '6px', marginBottom: '0.65rem' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Idioma (ej. Inglés)"
                    value={newLanguageInput.language}
                    onChange={(e) => setNewLanguageInput({ ...newLanguageInput, language: e.target.value })}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <select
                    className="form-select"
                    value={newLanguageInput.proficiency}
                    onChange={(e) => setNewLanguageInput({ ...newLanguageInput, proficiency: e.target.value })}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <option value="Nativo / Bilingüe">Nativo / Bilingüe</option>
                    <option value="Avanzado (C1/C2)">Avanzado (C1/C2)</option>
                    <option value="Intermedio (B2)">Intermedio (B2)</option>
                    <option value="Intermedio (B1)">Intermedio (B1)</option>
                    <option value="Básico (A1/A2)">Básico (A1/A2)</option>
                  </select>
                  <button type="button" onClick={handleAddLanguage} className="btn btn-secondary btn-sm">
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {languages.map((l, idx) => {
                    const lName = typeof l === 'string' ? l : l?.language;
                    const lProf = typeof l === 'string' ? '' : (l?.proficiency || l?.level || '');
                    return (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong>{lName}</strong> {lProf ? `(${lProf})` : ''}
                        <button type="button" onClick={() => handleDeleteLanguage(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}><X size={10} /></button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
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
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            {saving ? <Loader2 size={15} className="spin-anim" /> : <Save size={15} />}
            <span>{saving ? 'Guardando...' : 'Guardar y Sincronizar CV Maestro'}</span>
          </button>
        </div>
      </div>

      {/* MODAL IA PARA SUBIR CERTIFICADOS Y DIPLOMAS EN PDF */}
      {showCertModal && (
        <UploadCertificateModal
          isOpen={showCertModal}
          mode="profile"
          onClose={() => setShowCertModal(false)}
          onSuccess={(res) => {
            if (res.profile) {
              setFormData(res.profile);
              if (onProfileSaved) onProfileSaved(res.profile);
            }
          }}
        />
      )}

      {/* MODAL VISOR PDF DE CERTIFICADOS Y TÍTULOS */}
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
