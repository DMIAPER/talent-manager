import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Compass, Lightbulb, RefreshCw, ArrowRight, GitFork, CheckCircle2, GraduationCap } from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';
import CourseSearchModal from './CourseSearchModal';

export default function CareerAdvisorChat({ 
  onRoadmapGenerated, 
  onPlanUpdated, 
  activePlan, 
  planId, 
  onGoToRoadmap 
}) {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu **Consultor Estratégico de Carrera & Orientador Formativo**. Mi misión es analizar tu trayectoria contrastable en tu **CV Maestro** para diseñar itinerarios de formación continua y bifurcaciones de especialización con el máximo impacto en tu empleabilidad.\n\nPara orientarte con rigor y sin asumir supuestos:\n1. ¿Cuál es tu objetivo profesional prioritario: **consolidar tu área actual** (salto vertical a Senior/Lead) o **abrir una nueva bifurcación tecnológica**?\n2. ¿De cuántas **horas semanales de estudio** dispones aproximadamente?\n3. ¿Tienes preferencia por alguna certificación oficial de la industria o proyectos aplicados?',
      quickReplies: [
        'Consolidar mi especialidad actual (Salto Vertical)',
        'Abrir una nueva bifurcación tecnológica',
        'Dispongo de 6 a 10 horas semanales',
        'Trazar mi mapa formativo desde mi CV Maestro'
      ],
      planModified: false
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingTree, setGeneratingTree] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = null) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const targetPlanId = planId || activePlan?.id || null;
      const res = await api.chatCareerAdvisor(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        text,
        targetPlanId
      );

      const isModified = !!(res.plan_modified && res.updated_plan);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.reply || 'He tomado nota de tus objetivos. Podemos estructurar las ramas de tu itinerario.',
          quickReplies: res.quick_replies || [],
          planModified: isModified,
          planSummaryDiff: res.plan_summary_diff || null,
          updatedPlan: res.updated_plan || null
        }
      ]);

      if (isModified && res.updated_plan) {
        if (onPlanUpdated) {
          onPlanUpdated(res.updated_plan);
        }
      }
    } catch (e) {
      console.error(e);
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Aviso: No pude conectar con el servicio en este momento, pero puedo generar tu árbol formativo directamente con el botón superior.',
          quickReplies: ['Generar mi Árbol Formativo ahora'],
          planModified: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTree = async (userIntentOverride = null) => {
    setGeneratingTree(true);
    try {
      const lastUserMsg = userIntentOverride || messages.filter(m => m.role === 'user').pop()?.content || '';
      const plan = await api.generateCareerPathsFromMasterCv({
        userIntent: lastUserMsg,
        targetRole: ''
      });

      alert(`¡Árbol formativo generado con éxito para "${plan.target_role}" con sus ramales y bifurcaciones desde tu CV Maestro!`);
      if (onPlanUpdated) onPlanUpdated(plan);
      if (onRoadmapGenerated) onRoadmapGenerated(plan);
    } catch (e) {
      console.error(e);
      alert('Error generando el árbol formativo');
    } finally {
      setGeneratingTree(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      height: '640px',
      overflow: 'hidden'
    }}>
      {/* Cabecera del Chat */}
      <div style={{
        padding: '1.15rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Compass size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                Consultor de Carrera & Formación IA
              </h3>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                Skill: Orientador de Itinerarios
              </span>
              {activePlan?.target_role && (
                <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                  🎯 Vinculado a: {activePlan.target_role}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
              Asesoramiento interactivo: afina tus preferencias y la IA actualizará el Mapa de Carrera en caliente
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => handleSendMessage('Sincroniza y vuelca todas las preferencias, ramas y decisiones acordadas en nuestro diálogo directamente al mapa de carrera.')}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem' }}
            title="Aplica todos los acuerdos de la conversación al Roadmap"
          >
            <GitFork size={13} color="#34d399" />
            <span>Sincronizar con Roadmap</span>
          </button>

          <button
            onClick={() => setShowCourseModal(true)}
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 5, 
              fontSize: '0.78rem',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: '#38bdf8'
            }}
            title="Buscar cursos y certificaciones oficiales en tiempo real con enlaces verificados"
          >
            <GraduationCap size={13} color="#38bdf8" />
            <span>Buscar Cursos Online</span>
          </button>

          <button
            onClick={() => handleGenerateTree()}
            disabled={generatingTree}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', background: 'linear-gradient(135deg, #10b981, #0284c7)' }}
          >
            <Sparkles size={14} />
            <span>{generatingTree ? 'Analizando CV...' : '⚡ Trazar Caminos IA'}</span>
          </button>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        {messages.map((m, idx) => {
          const isAssistant = m.role === 'assistant';
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                justifyContent: isAssistant ? 'flex-start' : 'flex-end'
              }}>
                {isAssistant && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={17} color="#10b981" />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  padding: '0.85rem 1.15rem',
                  borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                  background: isAssistant ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: isAssistant ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  lineHeight: 1.5
                }}>
                  {isAssistant ? (
                    <div>
                      <MarkdownRenderer content={m.content} />
                      
                      {/* TARJETA DE MAPA MODIFICADO EN VIVO */}
                      {m.planModified && (
                        <div style={{
                          marginTop: '0.85rem',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 182, 212, 0.1) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.82rem' }}>
                              <GitFork size={15} />
                              <span>🌿 Roadmap & Mapa de Carrera Actualizado</span>
                            </div>
                            {onGoToRoadmap && (
                              <button
                                onClick={onGoToRoadmap}
                                className="btn btn-primary"
                                style={{
                                  fontSize: '0.74rem',
                                  padding: '0.3rem 0.7rem',
                                  background: 'linear-gradient(135deg, #10b981, #0284c7)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span>Ver en Mapa Principal</span>
                                <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                            {m.planSummaryDiff || 'Las bifurcaciones y los hitos del mapa se han ajustado en tiempo real con las preferencias acordadas.'}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  )}
                </div>

                {!isAssistant && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={17} color="#818cf8" />
                  </div>
                )}
              </div>

              {/* Botones de Respuesta Rápida Sugeridos por la IA */}
              {isAssistant && m.quickReplies && m.quickReplies.length > 0 && idx === messages.length - 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginLeft: '2.75rem' }}>
                  {m.quickReplies.map((qr, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSendMessage(qr)}
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#6ee7b7',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="ai-processing-glow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '2.75rem', padding: '0.6rem 1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <RefreshCw size={14} className="spin-anim" color="#10b981" />
            <span style={{ display: 'flex', alignItems: 'center' }}>
              El Consultor IA está analizando tu perfil y adaptando tu mapa
              <span className="thinking-dots" style={{ color: '#10b981' }}><span></span><span></span><span></span></span>
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Envío */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <input
          type="text"
          placeholder="Escribe a tu consultor: tus metas, dudas sobre especialización, tiempo disponible o cambios de ramas..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={loading}
          style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '8px',
            padding: '0.65rem 0.95rem',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none'
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.25rem' }}
        >
          <Send size={15} />
          <span>Enviar</span>
        </button>
      </div>

      {/* MODAL DE BÚSQUEDA DE CURSOS EN VIVO DESDE EL CHAT */}
      {showCourseModal && (
        <CourseSearchModal
          initialQuery={activePlan?.target_role || 'Cursos y Certificaciones'}
          planId={planId || activePlan?.id}
          onClose={() => setShowCourseModal(false)}
          onCourseAttached={(updatedPlan) => {
            if (onPlanUpdated && updatedPlan) {
              onPlanUpdated(updatedPlan);
            }
          }}
        />
      )}
    </div>
  );
}
