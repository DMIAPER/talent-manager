import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Award, 
  ExternalLink, 
  X, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  BookOpen,
  Code2
} from 'lucide-react';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

export default function SkillVerificationQuizModal({
  step,
  onClose,
  onVerificationSuccess
}) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [githubUrl, setGithubUrl] = useState('');
  
  // Estado de evaluación y feedback
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [step]);

  const loadQuiz = async () => {
    if (!step) return;
    setLoading(true);
    setEvaluationResult(null);
    try {
      const res = await api.generateSkillQuiz(step.id, step.tech || step.title, step.description);
      if (res && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setSelectedAnswers({});
      }
    } catch (e) {
      console.error('Error cargando quiz:', e);
      alert('Error cargando la micro-evaluación técnica: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    if (evaluationResult) return; // No permitir cambios tras evaluar
    setSelectedAnswers({
      ...selectedAnswers,
      [qIndex]: optionIndex
    });
  };

  const handleSubmitQuiz = async () => {
    // Validar que se hayan respondido todas
    const unanswered = questions.some((_, idx) => selectedAnswers[idx] === undefined);
    if (unanswered) {
      alert('Por favor responde a todas las preguntas antes de enviar la evaluación.');
      return;
    }

    setEvaluating(true);
    try {
      const userAnswersList = questions.map((_, idx) => selectedAnswers[idx]);
      const res = await api.verifySkillQuiz({
        stepId: step.id,
        skillName: step.tech || step.title,
        userAnswers: userAnswersList,
        questions: questions,
        githubUrl: githubUrl.trim()
      });

      setEvaluationResult(res);
      if (res.passed && onVerificationSuccess) {
        onVerificationSuccess(res);
      }
    } catch (e) {
      console.error('Error evaluando quiz:', e);
      alert('Error evaluando la micro-evaluación: ' + e.message);
    } finally {
      setEvaluating(false);
    }
  };

  if (!step) return null;

  const currentQ = questions[currentIndex];
  const allAnswered = questions.length > 0 && questions.every((_, idx) => selectedAnswers[idx] !== undefined);

  return (
    <ModalPortal isOpen={Boolean(step)}>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 10, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 10000,
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
            maxWidth: '750px',
            maxHeight: '90vh',
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
          borderRadius: '18px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera del Modal */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
                  Micro-Evaluación Técnica
                </h3>
                <span 
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    fontWeight: 600
                  }}
                >
                  {step.tech || 'Skill Técnica'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Valida tu competencia real con preguntas de entrevista técnica y obtén la insignia 🟢 Verified.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido Principal */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div className="ai-processing-glow" style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              borderRadius: '14px',
              background: 'rgba(99, 102, 241, 0.06)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: '#94a3b8'
            }}>
              <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="radar-ping" style={{ width: '100%', height: '100%', background: 'rgba(99, 102, 241, 0.35)' }} />
                <Loader2 size={32} className="spin-anim" color="#818cf8" />
              </div>
              <div>
                <h4 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Generando preguntas contextuales
                  <span className="thinking-dots" style={{ color: '#818cf8' }}><span></span><span></span><span></span></span>
                </h4>
                <p style={{ fontSize: '0.85rem', margin: 0, color: '#94a3b8' }}>
                  Analizando el estándar de entrevistas del sector para {step.tech || step.title}.
                </p>
              </div>
              <div className="progress-indeterminate-track" style={{ width: '260px', marginTop: '0.25rem' }}>
                <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }} />
              </div>
            </div>
          ) : evaluationResult ? (
            /* VISTA DE RESULTADOS Y FEEDBACK DETALLADO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div 
                style={{
                  padding: '1.5rem',
                  borderRadius: '14px',
                  background: evaluationResult.passed 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.25))',
                  border: `1px solid ${evaluationResult.passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                {evaluationResult.passed ? (
                  <CheckCircle size={44} color="#34d399" style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle size={44} color="#f87171" style={{ flexShrink: 0 }} />
                )}
                <div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: evaluationResult.passed ? '#a7f3d0' : '#fecaca', fontWeight: 800 }}>
                    {evaluationResult.passed ? '🎉 ¡Competencia Técnica Acreditada con Éxito!' : 'Prueba No Superada (Requiere Refuerzo)'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                    Has acertado <strong>{evaluationResult.correct_count} de {evaluationResult.total_questions}</strong> ({evaluationResult.score_percentage}%).
                    {evaluationResult.passed ? (
                      <> Se ha otorgado la insignia <strong>🟢 Verified Competence</strong> y se ha sumado un bono a tu Puntuación de Empleabilidad.</>
                    ) : (
                      <> Se requiere al menos un 75% de acierto para obtener la certificación. Revisa las explicaciones técnicas a continuación.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Lista de Respuestas con Explicaciones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ margin: '0.5rem 0 0 0', color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700 }}>
                  Desglose y Explicaciones de Criterio Técnico:
                </h5>
                {evaluationResult.feedback?.map((item, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${item.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '1rem 1.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
                        Pregunta {idx + 1}
                      </span>
                      <span 
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: item.is_correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: item.is_correct ? '#34d399' : '#f87171'
                        }}
                      >
                        {item.is_correct ? 'Correcta ✓' : 'Incorrecta ✕'}
                      </span>
                    </div>

                    <p style={{ color: '#f1f5f9', fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                      {item.question}
                    </p>

                    <div 
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${item.is_correct ? '#10b981' : '#ef4444'}`,
                        fontSize: '0.8rem',
                        color: '#cbd5e1',
                        lineHeight: 1.45
                      }}
                    >
                      <strong style={{ color: '#e2e8f0', display: 'block', marginBottom: '2px' }}>
                        Criterio Técnico:
                      </strong>
                      {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentQ ? (
            /* VISTA DE PREGUNTAS EN CURSO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Barra de Progreso de Preguntas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                  Pregunta {currentIndex + 1} de {questions.length}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {questions.map((_, i) => (
                    <div 
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      style={{
                        width: '24px',
                        height: '6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        background: selectedAnswers[i] !== undefined 
                          ? '#6366f1' 
                          : i === currentIndex 
                            ? '#cbd5e1' 
                            : 'rgba(255, 255, 255, 0.15)',
                        transition: 'background 0.2s'
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Escenario Práctico */}
              {currentQ.scenario && (
                <div 
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    color: '#c7d2fe',
                    lineHeight: 1.45
                  }}
                >
                  <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '3px' }}>
                    Situación o Caso de Uso:
                  </strong>
                  {currentQ.scenario}
                </div>
              )}

              {/* Enunciado de la Pregunta */}
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', fontWeight: 700, lineHeight: 1.4 }}>
                {currentQ.question}
              </h4>

              {/* Opciones Seleccionables */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {currentQ.options?.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentIndex, optIdx)}
                      style={{
                        textAlign: 'left',
                        padding: '0.85rem 1.1rem',
                        borderRadius: '10px',
                        border: isSelected 
                          ? '1px solid #6366f1' 
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected 
                          ? 'rgba(99, 102, 241, 0.2)' 
                          : 'rgba(15, 23, 42, 0.5)',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <span 
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #6366f1' : '1px solid #64748b',
                          background: isSelected ? '#6366f1' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#fff',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo Opcional de Proof of Work (GitHub URL) en la última pregunta */}
              {currentIndex === questions.length - 1 && (
                <div 
                  style={{
                    marginTop: '0.75rem',
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                    🔗 Evidencia Práctica ("Proof of Work") Opcional:
                  </label>
                  <input 
                    type="url"
                    placeholder="https://github.com/tu-usuario/proyecto-o-commit"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.82rem'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Un enlace a código funcional quedará vinculado permanentemente a tu insignia de verificación.
                  </span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Barra de Navegación Inferior */}
        <div 
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)'
          }}
        >
          {evaluationResult ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', gap: '0.75rem' }}>
              {!evaluationResult.passed && (
                <button
                  type="button"
                  onClick={loadQuiz}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem' }}
                >
                  🔄 Intentar de Nuevo
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', background: '#6366f1' }}
              >
                Cerrar y Volver
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || loading}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                  opacity: currentIndex === 0 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    disabled={selectedAnswers[currentIndex] === undefined}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.82rem',
                      background: '#6366f1'
                    }}
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    disabled={!allAnswered || evaluating}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {evaluating ? (
                      <>
                        <Loader2 size={16} className="spin-anim" />
                        <span>Evaluando...</span>
                      </>
                    ) : (
                      <>
                        <Award size={16} />
                        <span>Finalizar y Evaluar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
