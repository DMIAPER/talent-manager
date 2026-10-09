import React, { useState } from 'react';
import { 
  X, ExternalLink, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, 
  GraduationCap, Clock, DollarSign, Building, Sparkles, Trash2, BookOpen, Link as LinkIcon
} from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function EnrollmentCourseModal({ 
  planId, 
  milestone, 
  onClose, 
  onSaved,
  onOpenSearchModal 
}) {
  if (!milestone) return null;

  const [exactUrl, setExactUrl] = useState(milestone.certificate_link || '');
  const [title, setTitle] = useState(milestone.course_title || milestone.title || '');
  const [provider, setProvider] = useState(milestone.provider || '');
  const [costType, setCostType] = useState(milestone.cost_estimate || 'Gratuito');
  const [durationHours, setDurationHours] = useState(milestone.duration_hours || 40);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestLink = async () => {
    if (!exactUrl.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.verifyCourseLink(exactUrl.trim());
      setTestResult(res);
    } catch (e) {
      setTestResult({
        is_live: false,
        status_label: 'Error de conexión',
        message: 'No se pudo conectar con el servidor para verificar'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!exactUrl.trim()) {
      alert('Por favor introduce la URL del curso para inscribirte.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.attachCourseToMilestone(planId, milestone.id, {
        exact_url: exactUrl.trim(),
        title: title.trim() || milestone.title,
        provider: provider.trim() || 'Proveedor Oficial',
        cost_type: costType.trim() || 'Gratuito',
        duration_hours: parseInt(durationHours) || 40,
        skills_covered: milestone.skills_acquired || []
      });

      if (onSaved) onSaved(res.plan || null);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error guardando el enlace de inscripción: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLink = async () => {
    if (!window.confirm('¿Deseas desvincular el enlace de inscripción de este hito?')) return;
    setSaving(true);
    try {
      const res = await api.attachCourseToMilestone(planId, milestone.id, {
        exact_url: '',
        title: '',
        provider: milestone.provider || 'Proveedor Oficial',
        cost_type: milestone.cost_estimate || 'Gratuito',
        duration_hours: milestone.duration_hours || 40,
        skills_covered: milestone.skills_acquired || []
      });
      if (onSaved) onSaved(res.plan || null);
      onClose();
    } catch (e) {
      alert('Error desvinculando el curso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={Boolean(milestone)}>
      <div 
        className="modal-overlay animate-fade-in" 
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
          className="modal-content animate-slide-up"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}
        >
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.12rem', color: '#fff', fontWeight: 800 }}>
                  Planificar Inscripción a Curso
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  🎯 Curso Objetivo
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Define el curso exacto al que tienes intención de apuntarte en esta rama de carrera
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="btn-icon"
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
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

        {/* Formulario */}
        <form onSubmit={handleSave} style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.1rem'
        }}>
          {/* Hito Asociado */}
          <div style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#38bdf8'
          }}>
            <BookOpen size={15} flexShrink={0} />
            <div>
              <span style={{ color: '#94a3b8' }}>Hito de la Rama: </span>
              <strong>{milestone.title}</strong>
            </div>
          </div>

          {/* Campo URL con comprobación en vivo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              Enlace Web del Curso o Matrícula <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="url"
                  required
                  placeholder="https://www.coursera.org/learn/... o página oficial del curso"
                  value={exactUrl}
                  onChange={(e) => {
                    setExactUrl(e.target.value);
                    setTestResult(null);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem 0.6rem 2.2rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <LinkIcon size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <button
                type="button"
                onClick={handleTestLink}
                disabled={testing || !exactUrl.trim()}
                className="btn btn-secondary"
                style={{
                  padding: '0.6rem 0.95rem',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  fontWeight: 600,
                  flexShrink: 0
                }}
                title="Comprobar en tiempo real que el enlace existe y no devuelve 404"
              >
                {testing ? <RefreshCw size={13} className="spin-anim" /> : <ShieldCheck size={14} color="#38bdf8" />}
                <span>{testing ? 'Comprobando...' : 'Probar Enlace'}</span>
              </button>
            </div>

            {/* Resultado del test de enlace */}
            {testResult && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: testResult.is_live ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${testResult.is_live ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.is_live ? '#34d399' : '#f87171'
              }}>
                {testResult.is_live ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span><strong>{testResult.status_label}:</strong> {testResult.message}</span>
              </div>
            )}
          </div>

          {/* Nombre del Curso */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              Nombre del Curso o Especialización
            </label>
            <input
              type="text"
              placeholder="Ej: Google Cybersecurity Professional Certificate o Curso Auditor ISO 9001"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Proveedor y Horas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Entidad o Plataforma Emisora
              </label>
              <input
                type="text"
                placeholder="Ej: Coursera, AENOR, AWS, edX, SGS"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
                Coste Estimado / Tasa
              </label>
              <input
                type="text"
                placeholder="Ej: Gratuito, 39€/mes, 150€ tasa examen"
                value={costType}
                onChange={(e) => setCostType(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.85rem',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 6 }}>
              Duración Estimada (Horas de estudio)
            </label>
            <input
              type="number"
              min="1"
              max="600"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.6rem 0.85rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Botonera de Acción */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}>
            <div>
              {milestone.certificate_link ? (
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  disabled={saving}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 600
                  }}
                >
                  <Trash2 size={13} />
                  <span>Quitar Enlace</span>
                </button>
              ) : onOpenSearchModal ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSearchModal(milestone);
                  }}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: '#38bdf8',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontWeight: 600
                  }}
                >
                  <Sparkles size={13} />
                  <span>O Buscar Cursos con IA</span>
                </button>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || !exactUrl.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'linear-gradient(135deg, #10b981, #0284c7)',
                  fontWeight: 700
                }}
              >
                {saving ? <RefreshCw size={14} className="spin-anim" /> : <CheckCircle2 size={14} />}
                <span>{saving ? 'Guardando...' : 'Guardar Curso de Inscripción'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
}
