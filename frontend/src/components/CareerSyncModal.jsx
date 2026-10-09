import React, { useState } from 'react';
import { X, Award, CheckCircle, Calendar, Building, Link, Tag, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function CareerSyncModal({ planId, milestone, onClose, onSuccess }) {
  if (!milestone) return null;

  const [category, setCategory] = useState(milestone.is_official_certification ? 'certification' : 'education');
  const [title, setTitle] = useState(milestone.title || '');
  const [institution, setInstitution] = useState(milestone.provider || '');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [grade, setGrade] = useState('');
  const [certificateLink, setCertificateLink] = useState(milestone.certificate_link || '');
  const [skillsText, setSkillsText] = useState((milestone.skills_acquired || []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillsArray = skillsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.syncMilestoneToProfile(planId, milestone.id, {
        category,
        institution: institution.trim(),
        year: year.trim(),
        grade: grade.trim(),
        certificate_link: certificateLink.trim(),
        skills_to_add: skillsArray
      });

      alert(res.message || '¡Formación sincronizada con éxito en tu Perfil Oficial!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error sincronizando con el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(milestone)}>
      <div 
        className="modal-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 25, 0.85)',
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
            maxWidth: '580px',
            maxHeight: '90vh',
            margin: 'auto',
            padding: '1.75rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: '1.25rem'
          }}
        >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={11} />
                Sincronización 1-Click
              </span>
              <span className="badge badge-indigo">Perfil Oficial & CV Maestro</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>
              Añadir Formación Completada a tu Perfil
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              Revisa o amplía los datos antes de transferirlos a tu perfil oficial y recalcular tu radar.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tipo de entrada */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Registrar en la sección:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCategory('certification')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: category === 'certification' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${category === 'certification' ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                  color: category === 'certification' ? '#fff' : '#94a3b8'
                }}
              >
                🏅 Certificaciones Oficiales
              </button>

              <button
                type="button"
                onClick={() => setCategory('education')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: category === 'education' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${category === 'education' ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                  color: category === 'education' ? '#fff' : '#94a3b8'
                }}
              >
                🎓 Formación Académica
              </button>
            </div>
          </div>

          {/* Nombre / Título */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Título del Curso o Certificación:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Entidad emisora y Año */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Entidad / Institución Emisora:
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej: AWS, CompTIA, Universidad"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Año de Obtención:
              </label>
              <input
                type="text"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Enlace o Credencial Digital y Nota */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Enlace / ID Credencial (Opcional):
              </label>
              <input
                type="text"
                value={certificateLink}
                onChange={(e) => setCertificateLink(e.target.value)}
                placeholder="URL badge Credly o certificado"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                Calificación / Mención (Opcional):
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Sobresaliente / Aprobado"
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Competencias adquiridas a inyectar en hard_skills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Habilidades Adquiridas a Sumar a tus Competencias:
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Separadas por comas: Wireshark, Hardening, ISO 27001"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3, display: 'block' }}>
              Se añadirán a tu categoría de competencias y se reflejarán en el Gráfico Radar de empleabilidad.
            </span>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle size={15} />
              <span>{saving ? 'Sincronizando...' : 'Confirmar y Guardar en Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
