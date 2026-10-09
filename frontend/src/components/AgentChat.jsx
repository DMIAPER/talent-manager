import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Loader2, MessageSquare, CornerDownLeft } from 'lucide-react';
import { api } from '../services/api';
import MarkdownRenderer from './MarkdownRenderer';

export default function AgentChat({ onSearchRequested }) {
  const [messages, setMessages] = useState([
    {
      sender: 'agent',
      text: '¡Hola! Soy tu Asesor Inteligente de Carrera, Empleo y Auditoría de CV en Talent Manager Pro.\n\nEstoy instruido bajo los protocolos oficiales de `skills/` (Búsqueda de Empleo, Evaluador de Talento y Orientador de Itinerarios) y tengo acceso a tu **CV Maestro** como Fuente de Verdad.\n\nPuedes pedirme:\n- 🎯 **Buscar ofertas de empleo** y analizar compatibilidad ATS.\n- 📋 **Auditar tu CV Maestro** para detectar debilidades y reformular logros STAR.\n- 🌿 **Diseñar itinerarios formativos** y certificaciones oficiales para un salto profesional.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dynamicQuickReplies, setDynamicQuickReplies] = useState([]);
  const [requiresClarification, setRequiresClarification] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend) => {
    const msg = (textToSend || input).trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { sender: 'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendAgentChatMessage(newMessages, msg);
      setMessages([...newMessages, { sender: 'agent', text: res.reply || 'Sin respuesta' }]);
      if (res.quick_replies && Array.isArray(res.quick_replies) && res.quick_replies.length > 0) {
        setDynamicQuickReplies(res.quick_replies);
      }
      setRequiresClarification(!!res.requires_clarification);
    } catch (e) {
      setMessages([...newMessages, { sender: 'agent', text: `Error al conectar con el motor del Agente: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const defaultQuickPrompts = [
    '🎯 ¿Qué puestos encajan mejor con mi experiencia real?',
    '📋 Audita mi CV Maestro con el protocolo ATS',
    '🌿 ¿Qué certificaciones oficiales me convienen para dar un salto profesional?',
    '✉️ Redacta un mensaje de contacto profesional para reclutadores'
  ];

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginTop: '1.5rem', background: 'rgba(11, 16, 28, 0.75)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>Asesor de Carrera, Ofertas & Auditoría de CV</h3>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Multi-Skill Protocol (`agente-busqueda-empleo`, `evaluador-talento`, `orientador-itinerarios`)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {requiresClarification && (
            <span style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 600 }}>
              💡 Preguntas de Clarificación
            </span>
          )}
          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
            <Sparkles size={11} /> Cero Fabricación
          </span>
        </div>
      </div>

      {/* Historial de Mensajes */}
      <div style={{ maxHeight: '320px', minHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
        {messages.map((m, idx) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                justifyContent: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Bot size={16} color="#818cf8" />
                </div>
              )}

              <div
                style={{
                  maxWidth: '82%',
                  padding: '0.85rem 1.1rem',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isUser ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : 'rgba(255, 255, 255, 0.04)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.865rem',
                  lineHeight: 1.55
                }}
              >
                {isUser ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                ) : (
                  <MarkdownRenderer content={m.text} />
                )}
              </div>

              {isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  <User size={16} color="#cbd5e1" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 28, height: 28, borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
              <Bot size={16} color="#818cf8" />
            </div>
            <div className="ai-processing-glow" style={{ padding: '0.65rem 1rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#cbd5e1', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 size={14} className="spin-anim" color="#818cf8" />
              <span style={{ display: 'flex', alignItems: 'center' }}>
                El Agente está razonando con la skill
                <span className="thinking-dots" style={{ color: '#818cf8' }}><span></span><span></span><span></span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias Rápidas y Opciones de Clarificación */}
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'center' }}>
        {dynamicQuickReplies && dynamicQuickReplies.length > 0 ? (
          <>
            <span style={{ fontSize: '0.7rem', color: requiresClarification ? '#fbbf24' : '#818cf8', fontWeight: 600, marginRight: '4px' }}>
              {requiresClarification ? '⚡ Respuestas rápidas:' : '💡 Sugerencias:'}
            </span>
            {dynamicQuickReplies.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                disabled={loading}
                style={{
                  background: requiresClarification ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.12)',
                  border: requiresClarification ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(99, 102, 241, 0.3)',
                  color: requiresClarification ? '#fde68a' : '#c7d2fe',
                  fontSize: '0.74rem',
                  fontWeight: 500,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = requiresClarification ? 'rgba(245, 158, 11, 0.22)' : 'rgba(99, 102, 241, 0.25)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = requiresClarification ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.12)';
                  e.currentTarget.style.color = requiresClarification ? '#fde68a' : '#c7d2fe';
                }}
              >
                {qp}
              </button>
            ))}
          </>
        ) : (
          defaultQuickPrompts.map((qp, i) => (
            <button
              key={i}
              onClick={() => handleSend(qp)}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                color: '#94a3b8',
                fontSize: '0.725rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              {qp}
            </button>
          ))
        )}
      </div>

      {/* Input de Mensaje */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Habla con el agente o pídele instrucciones para tu búsqueda..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ padding: '0.75rem 1.1rem', fontSize: '0.875rem' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !input.trim()}
          style={{ padding: '0.75rem 1.25rem', flexShrink: 0 }}
        >
          {loading ? <Loader2 size={16} className="spin-anim" /> : <Send size={16} />}
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}
