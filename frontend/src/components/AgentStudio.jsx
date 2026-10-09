import React, { useState, useEffect } from 'react';
import { Bot, Search, Globe, FileText, CheckCircle2, ArrowRight, Plus, ExternalLink, Sparkles, Compass, AlertCircle, Loader2, Briefcase, MapPin, Clock } from 'lucide-react';
import { api } from '../services/api';
import AgentStatusBadge from './AgentStatusBadge';
import CvUploadCard from './CvUploadCard';
import AgentChat from './AgentChat';
import AgentBrowserNavigator from './AgentBrowserNavigator';
import ApplicationTailorModal from './ApplicationTailorModal';
import MarkdownRenderer from './MarkdownRenderer';
import MarkdownViewerModal from './MarkdownViewerModal';
import { detectPortalInfo, isExactJobUrl } from '../utils/portalHelpers';

export default function AgentStudio({ 
  onJobAddedToKanban, 
  onPlanAddedToStudio, 
  onOpenSettings,
  userProfile,
  onNavigateToProfile
}) {
  const hasCandidateName = Boolean(userProfile?.personal_info?.full_name && userProfile.personal_info.full_name.trim());
  const hasCandidateData = Boolean(
    hasCandidateName && 
    (
      (userProfile?.personal_info?.headline && userProfile.personal_info.headline.trim()) ||
      (userProfile?.work_experience && userProfile.work_experience.length > 0) ||
      (userProfile?.education && userProfile.education.length > 0)
    )
  );

  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('Cualquiera');
  const [publishedFilter, setPublishedFilter] = useState('today'); // 'today' (últimas 24h) | 'any'

  // Historial de ofertas descubiertas y deduplicación
  const [historyStats, setHistoryStats] = useState({ total_discovered: 0, today_discovered: 0 });

  // Estado del Agente: 'idle' | 'processing' | 'error' | 'blocked'
  const [agentStatus, setAgentStatus] = useState('idle');
  const [steps, setSteps] = useState([]);
  const [jobsResult, setJobsResult] = useState([]);
  const [markdownReport, setMarkdownReport] = useState('');
  const [careerPlanResult, setCareerPlanResult] = useState(null);
  const [addedJobs, setAddedJobs] = useState({});

  // Modal de Preparación ATS & Carta
  const [selectedJobForTailor, setSelectedJobForTailor] = useState(null);
  const [isTailorModalOpen, setIsTailorModalOpen] = useState(false);

  // Entrada de URL manual para análisis con IA
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [analyzingUrl, setAnalyzingUrl] = useState(false);

  // Modal para Informe Completo de la Oferta (Skill Protocol en Markdown)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedJobReportMarkdown, setSelectedJobReportMarkdown] = useState('');
  const [selectedJobReportTitle, setSelectedJobReportTitle] = useState('Informe Completo de la Oferta');
  const [loadingReportJobUrl, setLoadingReportJobUrl] = useState(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Diagnóstico previo del CV
  const [diagnostics, setDiagnostics] = useState(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  const handleOpenJobReport = async (job) => {
    const jobKey = job.url || job.role || 'job';
    setLoadingReportJobUrl(jobKey);
    try {
      const res = await api.getJobDetailedReport(job);
      setSelectedJobReportMarkdown(res.markdown_report || '');
      setSelectedJobReportTitle(`📋 Informe de Oferta: ${job.role} — ${job.company}`);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error('Error generando informe de la vacante:', err);
      alert(`Error al generar el informe completo de la oferta: ${err.message}`);
    } finally {
      setLoadingReportJobUrl(null);
    }
  };

  const fetchHistoryStats = async () => {
    try {
      const stats = await api.getAgentDiscoveredHistory();
      setHistoryStats(stats);
    } catch (e) {
      console.warn('No se pudo cargar estadísticas de historial:', e);
    }
  };

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const data = await api.getAgentDiagnostics();
      setDiagnostics(data);
    } catch (e) {
      console.error('Error cargando diagnóstico de CV:', e);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchHistoryStats();
  }, []);

  const handleRunJobSearch = async (customQuery, customLocation, customContract, customFilter) => {
    if (!hasCandidateName || !hasCandidateData) {
      alert("⚠️ Aviso indispensable: Antes de realizar cualquier búsqueda de empleo u otra actividad, debes registrar el nombre y los datos del candidato en 'Mi Perfil & CV' para optimizar y personalizar las búsquedas de empleo.");
      if (onNavigateToProfile) {
        onNavigateToProfile();
      }
      return;
    }

    const q = (customQuery !== undefined ? customQuery : query).trim();
    const loc = (customLocation !== undefined ? customLocation : location).trim();

    if (!q) {
      alert("Por favor, introduce el empleo o puesto que deseas buscar.");
      return;
    }

    const cType = customContract || contractType;
    const pFilter = customFilter || publishedFilter;

    setAgentStatus('processing');
    setJobsResult([]);
    setMarkdownReport('');
    setCareerPlanResult(null);
    setElapsedSeconds(0);

    const now = new Date().toLocaleTimeString();
    const timeParam = pFilter === 'today' ? '&tbs=qdr:d' : '';
    const googleSearchUrl = `https://www.google.es/search?q=empleo+${encodeURIComponent(q)}+${encodeURIComponent(loc)}+${encodeURIComponent(cType)}${timeParam}`;

    // Nivel 1 inicial inmediato
    setSteps([
      { 
        time: now, 
        level: 1, 
        type: 'skill_load', 
        title: 'Nivel 1: Protocolo de Búsqueda y CV', 
        url: 'talent-manager://skills/agente-busqueda-empleo.md',
        detail: `Cargando protocolo 'agente-busqueda-empleo.md'. Filtro temporal: ${pFilter === 'today' ? 'Publicadas hoy (24h)' : 'Cualquier fecha'}.` 
      }
    ]);

    // Timer en vivo para los segundos
    const timerInterval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    // Escalado de Nivel 2 (a los 1.5s)
    const t2 = setTimeout(() => {
      setSteps(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          level: 2,
          type: 'portal_select',
          title: 'Nivel 2: Selección Inteligente de Portales',
          url: `talent-manager://portal-engine?role=${encodeURIComponent(q)}&loc=${encodeURIComponent(loc)}`,
          detail: `Determinando plataformas especializadas idóneas para '${q}'...`
        }
      ]);
    }, 1500);

    // Escalado de Nivel 3 (a los 3.2s)
    const t3 = setTimeout(() => {
      setSteps(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          level: 3,
          type: 'search',
          title: 'Nivel 3: Rastreo en Google en Vivo',
          url: googleSearchUrl,
          detail: `Consultando ofertas activas (${cType}) en '${loc}' (${pFilter === 'today' ? 'Filtro últimas 24h activo' : 'Todas'})...`
        }
      ]);
    }, 3200);

    // Escalado de Nivel 4 (a los 5.5s)
    const t4 = setTimeout(() => {
      setSteps(prev => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          level: 4,
          type: 'browse',
          title: 'Nivel 4: Inspección de Portales y Deduplicación',
          url: `https://es.linkedin.com/jobs/search?keywords=${encodeURIComponent(q)}`,
          detail: `Extrayendo descripciones y contrastando con tu historial de vacantes ya mostradas...`
        }
      ]);
    }, 5500);

    try {
      const res = await api.searchJobsWithAgent(q, loc, cType, pFilter);
      clearInterval(timerInterval);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);

      setSteps(res.steps && res.steps.length > 0 ? res.steps : [
        { 
          time: new Date().toLocaleTimeString(), 
          level: 5, 
          type: 'complete', 
          title: 'Nivel 5: Análisis ATS y Scoring Final', 
          url: 'talent-manager://ats-engine/compatibility-matrix',
          detail: `Búsqueda completada y matriz de compatibilidad ATS calculada.` 
        }
      ]);
      setJobsResult(res.jobs || []);
      setMarkdownReport(res.markdown_report || '');

      // Actualizar estadísticas del historial
      fetchHistoryStats();

      if (res.status === 'blocked') {
        setAgentStatus('blocked');
      } else if (res.status === 'error') {
        setAgentStatus('error');
      } else {
        setAgentStatus('idle');
      }
    } catch (e) {
      clearInterval(timerInterval);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      setAgentStatus('error');
      alert(`Error en la búsqueda del agente: ${e.message}`);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('¿Deseas reiniciar el historial de ofertas descubiertas? Las ofertas actuales podrán volver a aparecer en futuras búsquedas.')) return;
    try {
      await api.clearAgentDiscoveredHistory();
      await fetchHistoryStats();
      alert('Historial de ofertas descubiertas reiniciado.');
    } catch (e) {
      alert('Error reiniciando historial: ' + e.message);
    }
  };

  const handleAnalyzeCustomUrl = async (e) => {
    if (e) e.preventDefault();
    if (!customUrlInput.trim()) {
      alert('Por favor, introduce o pega el enlace web de la oferta.');
      return;
    }

    setAnalyzingUrl(true);
    try {
      const analyzedJob = await api.analyzeJobUrl(customUrlInput.trim());
      // Añadir la oferta a la lista para tenerla visible
      setJobsResult(prev => [analyzedJob, ...prev]);
      // Abrir inmediatamente el modal de preparación ATS
      setSelectedJobForTailor(analyzedJob);
      setIsTailorModalOpen(true);
      setCustomUrlInput('');
    } catch (err) {
      alert(`Error al inspeccionar la web de la oferta: ${err.message}`);
    } finally {
      setAnalyzingUrl(false);
    }
  };

  const handleSelectRecommendedRole = (rec) => {
    setQuery(rec.role);
    if (rec.contract_type) setContractType(rec.contract_type);
    handleRunJobSearch(rec.role, location, rec.contract_type || contractType);
  };

  const handleRunCareerPlan = async (targetRole) => {
    setAgentStatus('processing');
    setJobsResult([]);
    setMarkdownReport('');
    setCareerPlanResult(null);
    setSteps([
      { time: 'Iniciando', type: 'search', title: 'Consultor de Carrera IA', detail: `Analizando directrices de itinerarios formativos para: ${targetRole}...` }
    ]);

    try {
      const plan = await api.generateCareerPlanWithAgent(targetRole, 'vertical_leap');
      setSteps([
        { time: 'Completado', type: 'complete', title: 'Mapa de Carrera Generado', detail: `Diagnóstico y matriz de brechas calculadas con éxito.` }
      ]);
      setCareerPlanResult(plan);
      setAgentStatus('idle');
    } catch (e) {
      setAgentStatus('error');
      alert('Error generando plan de carrera');
    }
  };

  const handleAddToPipeline = async (job) => {
    try {
      const res = await api.saveJobToPipeline({
        company: job.company,
        role: job.role,
        url: job.url,
        salary_range: job.salary_range,
        location_city: job.location,
        location_type: job.location?.toLowerCase().includes('remoto') ? 'remote' : 'onsite',
        notes: `Importada por Agente IA (${job.portal || 'Google'}). Match ATS: ${job.ats_match?.ats_score}%.`
      });
      setAddedJobs({ ...addedJobs, [job.url]: true });
      alert(res.message);
      if (onJobAddedToKanban) onJobAddedToKanban();
    } catch (e) {
      alert('Error añadiendo oferta al Kanban');
    }
  };

  const handleSavePlan = async () => {
    if (!careerPlanResult) return;
    try {
      const res = await api.saveCareerPlanFromAgent(careerPlanResult);
      alert(res.message);
      if (onPlanAddedToStudio) onPlanAddedToStudio();
    } catch (e) {
      alert('Error guardando plan');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. MÓDULO DE CARGA Y PARSER DE CV (PDF / WORD) */}
      <CvUploadCard onCvUpdated={fetchDiagnostics} />

      {/* 2. PANEL PRINCIPAL DEL AGENTE & ESTADO EN VIVO */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={26} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>Agente IA de Carrera & Búsqueda</h2>
                <span className="badge badge-indigo">Skill agente-busqueda-empleo</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                Búsqueda en Google y portales dinámicos decididos por la IA, contraste ATS contra tu CV y sincronización con Kanban.
              </p>
            </div>
          </div>

          {/* MONITOR DE ESTADO DEL AGENTE (PARPADEA EN PROCESO, QUIETO SI FALLA O EN REPOSO) */}
          <AgentStatusBadge status={agentStatus} onOpenSettings={onOpenSettings} />
        </div>

        {/* ALERTA DE OBLIGATORIEDAD DE REGISTRO DE DATOS ANTES DE BÚSQUEDA */}
        {!hasCandidateData && (
          <div 
            style={{
              background: 'linear-gradient(90deg, rgba(234, 88, 12, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '12px',
              padding: '1.1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertCircle size={26} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fef3c7', fontSize: '0.92rem', display: 'block', marginBottom: '3px' }}>
                  ⚠️ Atención: Registra los datos del candidato antes de buscar empleo
                </strong>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.45 }}>
                  {!hasCandidateName ? 'No se ha registrado el nombre ni los datos del candidato en el sistema. ' : 'Tu perfil aún no cuenta con experiencia laboral o formación registrada. '}
                  Antes de realizar búsquedas de empleo, <strong>debes registrar los datos del candidato</strong> para que la IA pueda optimizar la prospección, contrastar los requisitos de las vacantes y ofrecerte resultados afines.
                </p>
              </div>
            </div>
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="btn btn-primary"
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.55rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#1e1b4b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>👉 Ir a Mi Perfil</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* 3. DIAGNÓSTICO PREVIO DEL CV Y ROLES RECOMENDADOS */}
        {diagnostics?.has_cv && diagnostics?.recommendations?.length > 0 && (
          <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} /> Recomendación de la IA según tu CV Maestro:
              </span>
              {diagnostics.seniority && (
                <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                  Nivel: {diagnostics.seniority}
                </span>
              )}
            </div>

            {diagnostics.summary && (
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {diagnostics.summary}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {diagnostics.recommendations.map((rec, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectRecommendedRole(rec)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(165, 180, 252, 0.3)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem'
                  }}
                  title={rec.reason}
                >
                  <span>🎯 {rec.role}</span>
                  {rec.estimated_match && (
                    <span style={{ color: '#34d399', fontWeight: 700, marginLeft: '0.3rem' }}>
                      {rec.estimated_match}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. INSPECCIONAR OFERTA EXTERNA DESDE ENLACE WEB DIRECTO */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.05)',
          border: '1px dashed rgba(99, 102, 241, 0.35)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#c7d2fe', fontSize: '0.875rem', fontWeight: 600 }}>
              <Globe size={16} color="#818cf8" />
              <span>Inspeccionar Oferta Directa desde Enlace Web</span>
            </div>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Pega cualquier vacante de InfoJobs, LinkedIn, Tecnoempleo o web de empresa para que la IA la analice y adapte tu CV
            </span>
          </div>

          <form onSubmit={handleAnalyzeCustomUrl} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input
              type="url"
              className="form-input"
              placeholder="Pega aquí el enlace de la oferta: ej. https://www.infojobs.net/... o https://www.linkedin.com/jobs/..."
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              style={{ flex: 1, fontSize: '0.825rem' }}
              disabled={analyzingUrl}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={analyzingUrl || !customUrlInput.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}
            >
              {analyzingUrl ? <Loader2 size={15} className="spin-anim" /> : <Sparkles size={15} color="#fbbf24" />}
              <span>{analyzingUrl ? 'Inspeccionando web...' : 'Analizar Oferta con IA'}</span>
            </button>
          </form>
        </div>

        {/* 5. BARRA DE BÚSQUEDA UNIVERSAL (PUESTO + UBICACIÓN + TIPO DE JORNADA + FILTRO HOY) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.1fr 1.1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Término / Puesto
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Introduce aquí tu empleo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Lugar / Ubicación
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Tu ubicación"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Jornada / Contrato
            </label>
            <select
              className="form-select"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
            >
              <option value="Cualquiera">🌟 Cualquiera</option>
              <option value="Tiempo Completo">💼 Tiempo Completo</option>
              <option value="Media Jornada">⏱️ Media Jornada</option>
              <option value="Freelance / Apoyo Técnico">🤝 Freelance / Apoyo</option>
              <option value="Indefinido">🏛️ Indefinido</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#fbbf24', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 700 }}>
              📅 Publicación
            </label>
            <select
              className="form-select"
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value)}
              style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <option value="today">🔥 Publicadas Hoy (24h)</option>
              <option value="any">🌐 Cualquier Fecha</option>
            </select>
          </div>

          <div style={{ paddingTop: '1.25rem' }}>
            <button
              className="btn btn-primary"
              onClick={() => handleRunJobSearch()}
              disabled={agentStatus === 'processing'}
              style={{ padding: '0.75rem 1.4rem' }}
            >
              {agentStatus === 'processing' ? <Loader2 size={16} className="spin-anim" /> : <Search size={16} />}
              <span>Buscar en Google</span>
            </button>
          </div>
        </div>

        {/* BARRA DE CONTROL DE HISTORIAL Y DEDUPLICACIÓN */}
        <div style={{
          marginTop: '1.15rem',
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#a5b4fc', fontWeight: 600 }}>
              🛡️ Deduplicación Activa:
            </span>
            <span>
              <strong>{historyStats.total_discovered || 0}</strong> ofertas en historial (no se volverán a repetir ni registrar)
            </span>
            {publishedFilter === 'today' && (
              <span className="badge badge-amber" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                Filtro Hoy (24h) Activado
              </span>
            )}
          </div>

          {historyStats.total_discovered > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '0.7rem',
                textDecoration: 'underline'
              }}
              title="Borra el registro de ofertas vistas para poder verlas nuevamente"
            >
              Reiniciar Historial de Búsquedas
            </button>
          )}
        </div>
      </div>

      {/* 5. NAVEGADOR AUTÓNOMO DEL AGENTE & TELEMETRÍA EN DIRECTO (MULTI-NIVEL) */}
      {(steps.length > 0 || agentStatus === 'processing') && (
        <AgentBrowserNavigator
          status={agentStatus}
          steps={steps}
          currentQuery={query}
          currentLocation={location}
          currentContract={contractType}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* 6. RESUMEN VISUAL EN MARKDOWN SEGÚN LA SKILL (SI ESTÁ DISPONIBLE) */}
      {markdownReport && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FileText size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Informe Estructurado del Agente (Skill Protocol)</h3>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '10px' }}>
            <MarkdownRenderer content={markdownReport} />
          </div>
        </div>
      )}

      {/* 7. TARJETAS DE OPORTUNIDADES IDENTIFICADAS */}
      {jobsResult.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#fbbf24" />
            Oportunidades Identificadas & Análisis ATS
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            {jobsResult.map((job, idx) => {
              const ats = job.ats_match || {};
              const isAdded = addedJobs[job.url];
              const portalInfo = detectPortalInfo(job.portal, job.url);
              const isExact = isExactJobUrl(job.url);

              return (
                <div key={idx} className="glass-panel app-card animate-fade-in" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span 
                        className="badge" 
                        style={{ 
                          background: portalInfo.badgeBg, 
                          border: `1px solid ${portalInfo.badgeBorder}`, 
                          color: portalInfo.color,
                          fontWeight: 700 
                        }}
                      >
                        {portalInfo.emoji} {portalInfo.name}
                      </span>
                      <span className="badge badge-cyan">
                        📍 {job.location}
                      </span>
                      <span className="badge badge-amber" style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        🔥 {job.posted_time || 'Publicada hoy'}
                      </span>
                      {isExact && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '0.12rem 0.35rem' }}>
                          ✓ Enlace Directo
                        </span>
                      )}
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                      {ats.ats_score}% Match ATS
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.25rem' }}>{job.role}</h4>
                  <div style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {job.company}
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem', display: 'flex', gap: '0.85rem' }}>
                    <span>💼 {job.contract_type || contractType}</span>
                    {job.salary_range && <span>💰 {job.salary_range}</span>}
                  </div>

                  <p style={{ fontSize: '0.825rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {job.description}
                  </p>

                  {/* Coincidencias y faltantes del ATS */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                    <div style={{ marginBottom: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <strong style={{ color: '#34d399' }}>✓ Coincidencias en tu CV:</strong> {ats.matching_keywords?.join(', ') || 'Competencias transferibles'}
                    </div>
                    {ats.missing_keywords && ats.missing_keywords.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        <strong style={{ color: '#fbbf24' }}>⚡ Para reforzar:</strong> {ats.missing_keywords.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ 
                            padding: '0.35rem 0.65rem',
                            color: portalInfo.color,
                            background: portalInfo.badgeBg,
                            border: `1px solid ${portalInfo.badgeBorder}`,
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                          title={`Abrir oferta original directamente en ${portalInfo.name}`}
                        >
                          <ExternalLink size={13} color={portalInfo.color} />
                          <span>Abrir en {portalInfo.name}</span>
                        </a>
                      )}
                      
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAddToPipeline(job)}
                        disabled={isAdded}
                        style={{ 
                          padding: '0.35rem 0.65rem',
                          background: isAdded ? 'rgba(16, 185, 129, 0.15)' : undefined,
                          borderColor: isAdded ? 'rgba(16, 185, 129, 0.4)' : undefined,
                          color: isAdded ? '#34d399' : undefined
                        }}
                        title="Guardar directamente en el Kanban sin abrir el editor"
                      >
                        {isAdded ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                        <span>{isAdded ? 'En Kanban' : '+ Directo'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenJobReport(job)}
                        disabled={loadingReportJobUrl === (job.url || job.role)}
                        style={{ 
                          padding: '0.35rem 0.65rem',
                          background: 'rgba(99, 102, 241, 0.14)',
                          borderColor: 'rgba(129, 140, 248, 0.4)',
                          color: '#c7d2fe',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="Ver informe completo según el protocolo de la Skill de Búsqueda de Empleo"
                      >
                        {loadingReportJobUrl === (job.url || job.role) ? (
                          <Loader2 size={13} className="spin-anim" />
                        ) : (
                          <FileText size={13} color="#818cf8" />
                        )}
                        <span>Informe Completo de la Oferta</span>
                      </button>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSelectedJobForTailor(job);
                        setIsTailorModalOpen(true);
                      }}
                      style={{ 
                        padding: '0.4rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Sparkles size={13} color="#fbbf24" />
                      <span>🎯 Preparar Candidatura (CV ATS & Carta)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. MODAL DE PREPARACIÓN ATS & CARTA */}
      <ApplicationTailorModal
        job={selectedJobForTailor}
        isOpen={isTailorModalOpen}
        onClose={() => {
          setIsTailorModalOpen(false);
          setSelectedJobForTailor(null);
        }}
        onSavedToKanban={(savedApp) => {
          if (selectedJobForTailor?.url) {
            setAddedJobs(prev => ({ ...prev, [selectedJobForTailor.url]: true }));
          }
          if (onJobAddedToKanban) onJobAddedToKanban();
        }}
      />

      {/* 9. MODAL INFORME COMPLETO DE LA OFERTA (EN FORMATO MARKDOWN) */}
      <MarkdownViewerModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedJobReportMarkdown('');
        }}
        markdownContent={selectedJobReportMarkdown}
        title={selectedJobReportTitle}
        profileData={userProfile}
      />

      {/* 10. CHAT INTERACTIVO CON EL AGENTE (EN LA PARTE INFERIOR) */}
      <AgentChat onSearchRequested={(term) => handleRunJobSearch(term, location, contractType)} />
    </div>
  );
}
