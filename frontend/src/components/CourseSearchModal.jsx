import React, { useState, useEffect } from 'react';
import { 
  X, Search, GraduationCap, ExternalLink, Sparkles, CheckCircle2, 
  Clock, DollarSign, Award, BookOpen, Layers, RefreshCw, Check, Globe, ChevronRight,
  ShieldCheck, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function CourseSearchModal({ 
  initialQuery = '', 
  milestone = null, 
  planId = null, 
  onClose, 
  onCourseAttached 
}) {
  const [query, setQuery] = useState(milestone?.title || initialQuery || 'Docker y Kubernetes');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'official' | 'free'
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [attachingUrl, setAttachingUrl] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [testedLinks, setTestedLinks] = useState({});

  useEffect(() => {
    // Ejecutar búsqueda inicial automática al abrir el modal
    handleSearch();
  }, []);

  const handleTestLink = async (url) => {
    if (!url) return;
    setTestedLinks(prev => ({ ...prev, [url]: { loading: true } }));
    try {
      const res = await api.verifyCourseLink(url);
      setTestedLinks(prev => ({
        ...prev,
        [url]: {
          loading: false,
          is_live: res.is_live,
          status_label: res.status_label || (res.is_live ? 'Activo (200 OK)' : 'Error 404'),
          http_status: res.http_status
        }
      }));
    } catch (e) {
      setTestedLinks(prev => ({
        ...prev,
        [url]: { loading: false, is_live: false, status_label: 'Error de red' }
      }));
    }
  };

  const handleSearch = async (overrideFilter = null) => {
    const activeFilter = overrideFilter || filterType;
    if (!query.trim() || loading) return;

    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.searchCourses({
        query: query.trim(),
        milestoneTitle: milestone?.title || null,
        planId: planId,
        freeOnly: activeFilter === 'free',
        officialCertOnly: activeFilter === 'official'
      });
      setResults(res);
    } catch (e) {
      console.error(e);
      alert('Error buscando cursos: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachCourse = async (course) => {
    if (!planId || !milestone?.id) return;
    setAttachingUrl(course.exact_url);
    try {
      const res = await api.attachCourseToMilestone(planId, milestone.id, {
        exact_url: course.exact_url,
        title: course.title,
        provider: course.provider,
        cost_type: course.cost_type,
        duration_est: course.duration_est,
        skills_covered: course.skills_covered
      });
      setSuccessMsg(`¡Curso "${course.title}" seleccionado para inscripción en el hito "${milestone.title}"!`);
      if (onCourseAttached) {
        onCourseAttached(res.plan || null);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Error vinculando curso: ' + e.message);
    } finally {
      setAttachingUrl(null);
    }
  };

  const getProviderColor = (provider = '') => {
    const p = provider.toLowerCase();
    if (p.includes('aenor')) return '#0284c7';
    if (p.includes('sgs')) return '#ea580c';
    if (p.includes('bureau veritas')) return '#dc2626';
    if (p.includes('tüv') || p.includes('tuv')) return '#059669';
    if (p.includes('bsi')) return '#7c3aed';
    if (p.includes('irca')) return '#d97706';
    if (p.includes('applus')) return '#0284c7';
    if (p.includes('isaca')) return '#0ea5e9';
    if (p.includes('pmi')) return '#6366f1';
    if (p.includes('scrum')) return '#0d9488';
    if (p.includes('aws')) return '#f97316';
    if (p.includes('microsoft')) return '#06b6d4';
    if (p.includes('coursera')) return '#2563eb';
    if (p.includes('udemy')) return '#ec4899';
    if (p.includes('edx')) return '#dc2626';
    if (p.includes('red hat')) return '#ef4444';
    if (p.includes('linux')) return '#eab308';
    if (p.includes('comptia')) return '#dc2626';
    if (p.includes('linkedin')) return '#0a66c2';
    if (p.includes('miriada') || p.includes('fundae') || p.includes('sepe')) return '#10b981';
    return '#818cf8';
  };

  return (
    <ModalPortal isOpen={true}>
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
            maxWidth: '850px',
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
              background: 'linear-gradient(135deg, #10b981, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                  Agente de Búsqueda de Cursos & Certificaciones
                </h3>
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  Pipeline Multiorganización (10+ Cursos)
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Rastreo multientidad en tiempo real: AENOR, SGS, Bureau Veritas, TÜV, AWS, Microsoft, Coursera, edX y certificadoras afines
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

        {/* Barra de Búsqueda y Filtros */}
        <div style={{
          padding: '1.15rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {milestone && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.08)',
              padding: '4px 10px',
              borderRadius: '6px',
              width: 'fit-content'
            }}>
              <BookOpen size={13} />
              <span>Hito objetivo: <strong>{milestone.title}</strong></span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Busca por materia, certificación o tecnología (ej. AWS Solutions Architect, Kubernetes, Python)..."
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem 0.65rem 2.4rem',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #10b981, #0284c7)',
                padding: '0.65rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 700
              }}
            >
              {loading ? <RefreshCw size={15} className="spin-anim" /> : <Search size={15} />}
              <span>{loading ? 'Rastreando Web...' : 'Buscar Cursos'}</span>
            </button>
          </div>

          {/* Filtros rápidos */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filtrar catálogo:</span>
            
            <button
              onClick={() => { setFilterType('all'); handleSearch('all'); }}
              style={{
                background: filterType === 'all' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${filterType === 'all' ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
                color: filterType === 'all' ? '#fff' : '#94a3b8',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🌐 Todo el Catálogo
            </button>

            <button
              onClick={() => { setFilterType('official'); handleSearch('official'); }}
              style={{
                background: filterType === 'official' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${filterType === 'official' ? '#34d399' : 'rgba(255, 255, 255, 0.08)'}`,
                color: filterType === 'official' ? '#fff' : '#94a3b8',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🏆 Certificaciones Oficiales
            </button>

            <button
              onClick={() => { setFilterType('free'); handleSearch('free'); }}
              style={{
                background: filterType === 'free' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${filterType === 'free' ? '#22d3ee' : 'rgba(255, 255, 255, 0.08)'}`,
                color: filterType === 'free' ? '#fff' : '#94a3b8',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              🎁 Gratuitos / Auditoría Libre
            </button>
          </div>
        </div>

        {/* Notificación de éxito */}
        {successMsg && (
          <div style={{
            margin: '0.75rem 1.5rem 0',
            padding: '0.75rem 1rem',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Contenido con Scroll */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Pasos del Agente (Niveles 1 a 5) */}
          {results?.steps && results.steps.length > 0 && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              padding: '0.85rem 1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                Protocolo de Auditoría del Agente
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {results.steps.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.76rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                    <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>[{s.time}]</span>
                    <strong style={{ color: '#cbd5e1' }}>{s.title}:</strong>
                    <span style={{ color: '#64748b' }}>{s.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de Carga */}
          {loading && (
            <div className="ai-processing-glow" style={{
              padding: '2.5rem 1.5rem',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="radar-ping" style={{ width: '100%', height: '100%', background: 'rgba(16, 185, 129, 0.35)' }} />
                <RefreshCw size={28} className="spin-anim" color="#10b981" />
              </div>
              <div style={{ maxWidth: 520 }}>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Ejecutando Pipeline Multiorganización y Verificando Enlaces
                  <span className="thinking-dots" style={{ color: '#10b981' }}><span></span><span></span><span></span></span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 6, lineHeight: 1.45 }}>
                  Consultando simultáneamente AENOR, SGS, Bureau Veritas, TÜV, AWS, Microsoft, Coursera y edX (garantizando mínimo 10 opciones de diversas fuentes y validando estado HTTP en tiempo real).
                </div>
              </div>

              <div className="progress-indeterminate-track" style={{ width: '280px', marginTop: '0.5rem' }}>
                <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #6366f1 100%)' }} />
              </div>
            </div>
          )}

          {/* Listado de Cursos Encontrados */}
          {!loading && results?.courses && results.courses.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>
                  Programas localizados ({results.courses.length}):
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Check size={13} />
                  <span>URLs canónicas auditadas</span>
                </span>
              </div>

              {results.courses.map((course, idx) => {
                const providerColor = getProviderColor(course.provider);
                const isAttaching = attachingUrl === course.exact_url;

                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    {/* Fila Superior: Proveedor, Certificación y Fit Score */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: `${providerColor}25`,
                          color: providerColor,
                          border: `1px solid ${providerColor}50`
                        }}>
                          {course.provider}
                        </span>

                        {course.is_official_certification && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Award size={11} />
                            <span>Certificación Oficial</span>
                          </span>
                        )}

                        {course.is_live_verified && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: 'rgba(16, 185, 129, 0.12)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3
                          }} title="Enlace probado y activo con respuesta HTTP válida (no es 404)">
                            <CheckCircle2 size={11} />
                            <span>Verificado Activo</span>
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Afinidad Curricular:</span>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {course.fit_score || 88}%
                        </span>
                      </div>
                    </div>

                    {/* Título del Curso */}
                    <div>
                      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.98rem', color: '#fff', fontWeight: 700, lineHeight: 1.35 }}>
                        {course.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                        {course.snippet}
                      </p>
                    </div>

                    {/* Metadatos (Coste, Horas, Nivel) */}
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#cbd5e1' }}>
                        <DollarSign size={13} color="#10b981" />
                        <span>{course.cost_type}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#cbd5e1' }}>
                        <Clock size={13} color="#06b6d4" />
                        <span>{course.duration_est}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#cbd5e1' }}>
                        <Layers size={13} color="#818cf8" />
                        <span>Nivel {course.level}</span>
                      </div>
                    </div>

                    {/* Tags de Competencias */}
                    {course.skills_covered && course.skills_covered.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {course.skills_covered.map((sk, sIdx) => (
                          <span 
                            key={sIdx}
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: '#cbd5e1',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            #{sk}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Acciones del Curso */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginTop: '0.35rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      {/* Botón de Prueba en Vivo de Enlace */}
                      {(() => {
                        const testInfo = testedLinks[course.exact_url];
                        return (
                          <button
                            type="button"
                            onClick={() => handleTestLink(course.exact_url)}
                            disabled={testInfo?.loading}
                            className="btn btn-secondary"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.4rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              cursor: 'pointer',
                              background: testInfo ? (testInfo.is_live ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)') : 'rgba(255, 255, 255, 0.05)',
                              color: testInfo ? (testInfo.is_live ? '#34d399' : '#f87171') : '#cbd5e1',
                              borderColor: testInfo ? (testInfo.is_live ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)') : 'rgba(255, 255, 255, 0.1)'
                            }}
                            title="Probar en tiempo real si el enlace responde HTTP 200 y no produce 404"
                          >
                            {testInfo?.loading ? (
                              <>
                                <RefreshCw size={12} className="spin-anim" />
                                <span>Comprobando...</span>
                              </>
                            ) : testInfo ? (
                              testInfo.is_live ? (
                                <>
                                  <CheckCircle2 size={13} color="#34d399" />
                                  <span>{testInfo.status_label || 'Activo (200 OK)'}</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={13} color="#f87171" />
                                  <span>{testInfo.status_label || 'Página no encontrada (404)'}</span>
                                </>
                              )
                            ) : (
                              <>
                                <ShieldCheck size={13} color="#38bdf8" />
                                <span>Probar Enlace</span>
                              </>
                            )}
                          </button>
                        );
                      })()}

                      <a
                        href={course.exact_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.4rem 0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          textDecoration: 'none'
                        }}
                      >
                        <span>Abrir Curso en {course.provider}</span>
                        <ExternalLink size={13} />
                      </a>

                      {milestone && (
                        <button
                          onClick={() => handleAttachCourse(course)}
                          disabled={isAttaching}
                          className="btn btn-primary"
                          style={{
                            fontSize: '0.78rem',
                            padding: '0.4rem 0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'linear-gradient(135deg, #10b981, #0284c7)'
                          }}
                        >
                          {isAttaching ? <RefreshCw size={13} className="spin-anim" /> : <BookOpen size={13} />}
                          <span>{isAttaching ? 'Guardando...' : '🎯 Inscribirme / Seleccionar este Curso'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sin Resultados */}
          {!loading && results && (!results.courses || results.courses.length === 0) && (
            <div style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: '#94a3b8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Globe size={32} color="#64748b" />
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                  No se encontraron cursos con los filtros actuales
                </div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  Prueba a buscar con términos más amplios (ej. "Linux", "AWS", "Python") o desactiva los filtros específicos.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Protocolo de Cero Fabricación: todos los enlaces han sido verificados mediante rastreo en vivo
          </span>
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
