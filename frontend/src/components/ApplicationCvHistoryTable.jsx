import React, { useState } from 'react';
import { 
  FileText, Mail, ExternalLink, ChevronDown, ChevronUp, Sparkles, 
  Brain, ShieldCheck, CheckCircle2, AlertTriangle, AlertOctagon,
  Clock, ArrowRight, Download, Search, Filter, Briefcase, Building,
  Loader2, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../services/api';
import CvSuitabilityAuditModal from './CvSuitabilityAuditModal';
import ApplicationTailorModal from './ApplicationTailorModal';

export default function ApplicationCvHistoryTable({ 
  applications = [], 
  onRefresh, 
  onSelectApplicationForA4,
  onOpenTailorModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'tailored' | 'pending_action' | 'sent' | 'in_progress' | 'discarded'
  const [expandedAppId, setExpandedAppId] = useState(null);
  
  // Estados para evaluación de la skill
  const [evaluatingAppId, setEvaluatingAppId] = useState(null);
  const [activeAuditApp, setActiveAuditApp] = useState(null);
  const [activeAuditResult, setActiveAuditResult] = useState(null);

  // Modal para adaptar con IA si se solicita
  const [tailorJob, setTailorJob] = useState(null);

  // Función para evaluar con la Skill de Recruiter
  const handleEvaluateSkill = async (app) => {
    setEvaluatingAppId(app.id);
    try {
      const res = await api.evaluateApplicationCv(app.id);
      if (res && res.evaluation) {
        setActiveAuditApp(res.application || app);
        setActiveAuditResult(res.evaluation);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert(`Error evaluando CV: ${err.message}`);
    } finally {
      setEvaluatingAppId(null);
    }
  };

  // Abrir modal de auditoría si ya está evaluado
  const handleOpenExistingAudit = (app) => {
    setActiveAuditApp(app);
    setActiveAuditResult(app.ats_match_details || {
      real_ats_score: app.ats_score || 70,
      verdict: app.ats_score >= 80 ? 'Alta probabilidad de entrevista' : 'Candidatura Competitiva',
      traffic_light: {
        red_flags: [],
        amber_flags: ['Verifica las métricas de tu experiencia laboral'],
        green_signals: ['Experiencia técnica consolidada']
      },
      keyword_gaps: {
        missing_hard_skills: [],
        missing_soft_skills: []
      },
      matching_skills: app.keywords || [],
      star_bullets_recommended: [
        'Desarrollo de arquitecturas optimizadas reduciendo la latencia de respuesta y asegurando alta disponibilidad.'
      ],
      audit_summary: 'Evaluación previa almacenada en el sistema.'
    });
  };

  // Filtrado de candidaturas
  const filteredApps = applications.filter(app => {
    const matchSearch = 
      (app.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.portal || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (statusFilter === 'tailored') return Boolean(app.ats_optimized_cv_content);
    if (statusFilter === 'pending_action') return app.status === 'pending_action';
    if (statusFilter === 'sent') return app.status === 'sent';
    if (statusFilter === 'in_progress') return app.status === 'in_progress';
    if (statusFilter === 'discarded') return app.status === 'discarded';

    return true;
  });

  // Conteo para píldoras de filtro
  const countTailored = applications.filter(a => Boolean(a.ats_optimized_cv_content)).length;
  const countSent = applications.filter(a => a.status === 'sent').length;
  const countInProgress = applications.filter(a => a.status === 'in_progress').length;
  const countDiscarded = applications.filter(a => a.status === 'discarded').length;

  const getStatusBadge = (app) => {
    switch (app.status) {
      case 'sent': {
        const daysLeft = Math.max(0, (app.wait_period_days || 15) - Math.floor((new Date() - new Date(app.sent_date || app.application_date || new Date())) / (1000 * 60 * 60 * 24)));
        return (
          <span 
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '3px 9px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            🚀 Enviada {daysLeft > 0 ? `(${daysLeft}d restantes)` : '(Vencida)'}
          </span>
        );
      }
      case 'in_progress':
        return (
          <span 
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              padding: '3px 9px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            💼 En Proceso / Entrevistas
          </span>
        );
      case 'discarded':
        return (
          <span 
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              padding: '3px 9px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ⛔ Descartada {app.discard_reason ? `(${app.discard_reason})` : ''}
          </span>
        );
      case 'pending_action':
      default:
        return (
          <span 
            style={{
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#c084fc',
              padding: '3px 9px',
              borderRadius: '12px',
              fontSize: '0.73rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            📌 Pendiente de Acción
          </span>
        );
    }
  };

  const getScoreBadge = (sc) => {
    if (!sc && sc !== 0) {
      return (
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
          Sin auditar
        </span>
      );
    }
    const color = sc >= 80 ? '#34d399' : sc >= 60 ? '#fbbf24' : '#f87171';
    const bg = sc >= 80 ? 'rgba(16, 185, 129, 0.15)' : sc >= 60 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    const border = sc >= 80 ? 'rgba(16, 185, 129, 0.35)' : sc >= 60 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)';

    return (
      <span 
        style={{
          background: bg,
          border: `1px solid ${border}`,
          color: color,
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <ShieldCheck size={13} />
        {sc}% ATS Match
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. BARRA SUPERIOR DE FILTROS & BÚSQUEDA */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Buscador */}
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
          <Search size={15} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por puesto, empresa o portal..."
            style={{
              width: '100%',
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              color: '#f8fafc',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Píldoras de Filtro */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              background: statusFilter === 'all' ? '#334155' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === 'all' ? '#fff' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Todas ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('tailored')}
            style={{
              background: statusFilter === 'tailored' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === 'tailored' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ✨ Con CV Adaptado ({countTailored})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('sent')}
            style={{
              background: statusFilter === 'sent' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === 'sent' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🚀 Enviadas ({countSent})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            style={{
              background: statusFilter === 'in_progress' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === 'in_progress' ? '#34d399' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            💼 En Proceso ({countInProgress})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('discarded')}
            style={{
              background: statusFilter === 'discarded' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === 'discarded' ? '#f87171' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⛔ Descartadas ({countDiscarded})
          </button>
        </div>
      </div>

      {/* 2. TABLA INTERACTIVA DE CVS USADOS Y OFERTAS */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        {filteredApps.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={36} color="#64748b" style={{ margin: '0 auto 10px auto', display: 'block' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              No hay candidaturas que coincidan con los filtros
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Añade ofertas a tu pipeline desde el Kanban o ajusta los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.7)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Oferta & Empresa</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Versión de CV Asignada</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Score ATS & Idoneidad</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Carta de Presentación</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Estado de la Oferta</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => {
                  const isExpanded = expandedAppId === app.id;
                  const hasTailoredCv = Boolean(app.ats_optimized_cv_content);
                  const hasLetter = Boolean(app.cover_letter);
                  const isEvaluating = evaluatingAppId === app.id;

                  return (
                    <React.Fragment key={app.id}>
                      <tr 
                        style={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: isExpanded ? 'rgba(30, 41, 59, 0.4)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Columna 1: Oferta & Empresa */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '2px',
                                marginTop: '2px'
                              }}
                              title={isExpanded ? 'Contraer información' : 'Desplegar información de la oferta'}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <div>
                              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.86rem' }}>
                                {app.role}
                              </div>
                              <div style={{ color: '#38bdf8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span>{app.company}</span>
                                {app.portal && (
                                  <span style={{ color: '#64748b', fontSize: '0.7rem' }}>• {app.portal}</span>
                                )}
                                {app.url && (
                                  <a 
                                    href={app.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center' }}
                                    title="Abrir enlace original de la vacante"
                                  >
                                    <ExternalLink size={11} style={{ marginLeft: 2 }} />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna 2: Versión de CV */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {hasTailoredCv ? (
                            <div>
                              <span 
                                style={{
                                  background: 'rgba(56, 189, 248, 0.15)',
                                  color: '#38bdf8',
                                  border: '1px solid rgba(56, 189, 248, 0.35)',
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Sparkles size={11} />
                                CV Adaptado con IA
                              </span>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                                Personalizado para esta vacante
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span 
                                style={{
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: '#cbd5e1',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600
                                }}
                              >
                                🌟 CV Maestro General
                              </span>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                                Perfil Oficial sin adaptar
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Columna 3: Score ATS & Idoneidad */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getScoreBadge(app.ats_score)}
                            {app.ats_match_details && (
                              <button
                                type="button"
                                onClick={() => handleOpenExistingAudit(app)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  fontSize: '0.72rem',
                                  textDecoration: 'underline'
                                }}
                                title="Ver informe de idoneidad guardado"
                              >
                                Ver Informe
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Columna 4: Carta de Presentación */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {hasLetter ? (
                            <span 
                              style={{
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Mail size={11} />
                              ✓ Carta Lista
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Pendiente
                            </span>
                          )}
                        </td>

                        {/* Columna 5: Estado de la Oferta */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          {getStatusBadge(app)}
                        </td>

                        {/* Columna 6: Acciones Rápidas */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {/* Botón 1: Cargar en Visor A4 con 1 clic */}
                            <button
                              type="button"
                              onClick={() => onSelectApplicationForA4(app.id)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Cargar y previsualizar este CV en la hoja A4"
                            >
                              <Eye size={12} />
                              Ver en A4
                            </button>

                            {/* Botón 2: Evaluar con la Skill de Recruiter */}
                            <button
                              type="button"
                              onClick={() => handleEvaluateSkill(app)}
                              disabled={isEvaluating}
                              style={{
                                background: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                color: '#a5b4fc',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: isEvaluating ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Auditar idoneidad y score con la Skill de Recruiter & ATS"
                            >
                              {isEvaluating ? (
                                <>
                                  <Loader2 size={12} className="spin-slow" />
                                  Auditando...
                                </>
                              ) : (
                                <>
                                  <Brain size={12} />
                                  Auditar con Skill
                                </>
                              )}
                            </button>

                            {/* Botón 3: Adaptar con IA si no tiene CV específico */}
                            {!hasTailoredCv && (
                              <button
                                type="button"
                                onClick={() => setTailorJob(app)}
                                style={{
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  color: '#fbbf24',
                                  borderRadius: '6px',
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Generar CV Adaptado para esta posición"
                              >
                                <Sparkles size={11} />
                                Adaptar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ACORDEÓN DESPLEGABLE CON DETALLES DE LA OFERTA */}
                      {isExpanded && (
                        <tr style={{ background: '#0b1120', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <td colSpan={6} style={{ padding: '1.25rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                              
                              {/* Tarjeta Izquierda: Información y Requisitos de la Oferta */}
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Briefcase size={14} color="#38bdf8" />
                                  <span>Descripción & Requisitos de la Oferta ({app.role}):</span>
                                </div>
                                <div 
                                  style={{
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    fontSize: '0.76rem',
                                    color: '#cbd5e1',
                                    lineHeight: 1.5,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    whiteSpace: 'pre-wrap'
                                  }}
                                >
                                  {app.description || 'No se incluyó descripción extendida para esta oferta.'}
                                </div>

                                {app.salary_range && (
                                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    💰 Rango Salarial: <strong style={{ color: '#f8fafc' }}>{app.salary_range}</strong>
                                  </div>
                                )}
                              </div>

                              {/* Tarjeta Derecha: Análisis de Coincidencias & Acciones */}
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <ShieldCheck size={14} color="#34d399" />
                                  <span>Estado Curricular para esta Candidatura:</span>
                                </div>
                                
                                <div 
                                  style={{
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    fontSize: '0.76rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                  }}
                                >
                                  <div>
                                    <span style={{ color: '#94a3b8' }}>Documento utilizado: </span>
                                    <strong style={{ color: hasTailoredCv ? '#38bdf8' : '#e2e8f0' }}>
                                      {hasTailoredCv ? 'CV Personalizado (Generado por IA)' : 'CV Oficial Master (General)'}
                                    </strong>
                                  </div>

                                  {app.keywords && app.keywords.length > 0 && (
                                    <div>
                                      <div style={{ color: '#94a3b8', marginBottom: '3px' }}>Palabras clave asociadas:</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                        {app.keywords.map((kw, kwIdx) => (
                                          <span 
                                            key={kwIdx}
                                            style={{
                                              background: 'rgba(56, 189, 248, 0.1)',
                                              border: '1px solid rgba(56, 189, 248, 0.25)',
                                              color: '#38bdf8',
                                              padding: '1px 6px',
                                              borderRadius: '4px',
                                              fontSize: '0.7rem'
                                            }}
                                          >
                                            {kw}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                    <button
                                      type="button"
                                      onClick={() => onSelectApplicationForA4(app.id)}
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                                    >
                                      📄 Abrir en Visor A4
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleEvaluateSkill(app)}
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                                    >
                                      🧠 Auditar Idoneidad
                                    </button>
                                  </div>
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE AUDITORÍA DE IDONEIDAD CON LA SKILL DE RECRUITER */}
      {activeAuditResult && (
        <CvSuitabilityAuditModal
          isOpen={!!activeAuditResult}
          onClose={() => {
            setActiveAuditResult(null);
            setActiveAuditApp(null);
          }}
          application={activeAuditApp}
          evaluation={activeAuditResult}
          onOpenA4View={(appId) => onSelectApplicationForA4(appId)}
          onAdaptWithAi={(app) => setTailorJob(app)}
        />
      )}

      {/* MODAL PARA GENERAR / RE-ADAPTAR MATERIALES CON IA */}
      {tailorJob && (
        <ApplicationTailorModal
          isOpen={!!tailorJob}
          job={tailorJob}
          onClose={() => setTailorJob(null)}
          onSavedToKanban={() => {
            setTailorJob(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
}
