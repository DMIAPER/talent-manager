import React, { useState, useEffect } from 'react';
import { 
  Compass, GitFork, BookOpen, MessageSquare, Plus, Sparkles, 
  ArrowRight, Award, Target, TrendingUp, RefreshCw, FileText, GraduationCap
} from 'lucide-react';
import { api } from '../services/api';
import CareerBranchingMap from './CareerBranchingMap';
import CareerAdvisorChat from './CareerAdvisorChat';
import CareerJournal from './CareerJournal';
import CourseSearchModal from './CourseSearchModal';

export default function CareerStudio({ careerPlans = [], onRefresh }) {
  const [plans, setPlans] = useState(careerPlans);
  const [selectedPlanId, setSelectedPlanId] = useState(careerPlans[0]?.id || null);
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'chat' | 'journal'
  const [generating, setGenerating] = useState(false);
  const [showCourseExplorerModal, setShowCourseExplorerModal] = useState(false);

  useEffect(() => {
    setPlans(careerPlans);
    if (!selectedPlanId && careerPlans.length > 0) {
      setSelectedPlanId(careerPlans[0].id);
    }
  }, [careerPlans]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleGenerateFromMasterCv = async () => {
    setGenerating(true);
    try {
      const newPlan = await api.generateCareerPathsFromMasterCv({
        userIntent: 'Análisis multicamino y bifurcaciones desde CV Maestro',
        targetRole: ''
      });

      alert('¡Rutas profesionales generadas con éxito desde tu cv-maestro.md!');
      if (onRefresh) onRefresh();
      setSelectedPlanId(newPlan.id);
      setActiveTab('tree');
    } catch (e) {
      console.error(e);
      alert('Error generando itinerario desde el CV Maestro');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Cabecera Principal y Selector de Planes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            Career & Learning Studio
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Consultoría de carrera por IA (Skill: Orientador de Itinerarios Profesionales), árbol formativo con bifurcaciones de especialización y sincronización con CV Maestro
          </p>
        </div>

        {/* Botón rápido para generar nuevo plan */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {plans.length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  style={{
                    background: p.id === activePlan?.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${p.id === activePlan?.id ? '#818cf8' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: p.id === activePlan?.id ? '#fff' : '#94a3b8',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.785rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🎯 {p.target_role || 'Itinerario'}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowCourseExplorerModal(true)}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: '0.825rem',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: '#38bdf8'
            }}
            title="Buscar cursos y certificaciones oficiales en internet en tiempo real"
          >
            <GraduationCap size={15} color="#38bdf8" />
            <span>🎓 Buscador de Cursos IA</span>
          </button>

          <button
            onClick={handleGenerateFromMasterCv}
            disabled={generating}
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: '0.825rem',
              background: 'linear-gradient(135deg, #10b981, #0284c7)'
            }}
          >
            {generating ? <RefreshCw size={14} className="spin-anim" /> : <Sparkles size={14} />}
            <span>{generating ? 'Analizando CV Maestro...' : '⚡ Trazar Caminos desde CV Maestro'}</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Pestañas de la Sección */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('tree')}
          style={{
            background: activeTab === 'tree' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            border: activeTab === 'tree' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            color: activeTab === 'tree' ? '#fff' : '#94a3b8',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <GitFork size={15} color={activeTab === 'tree' ? '#818cf8' : '#94a3b8'} />
          <span>🌿 Mapa de Bifurcaciones & Skills</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          style={{
            background: activeTab === 'chat' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: activeTab === 'chat' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
            color: activeTab === 'chat' ? '#fff' : '#94a3b8',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Compass size={15} color={activeTab === 'chat' ? '#10b981' : '#94a3b8'} />
          <span>💬 Consultor de Carrera IA</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          style={{
            background: activeTab === 'journal' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            border: activeTab === 'journal' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
            color: activeTab === 'journal' ? '#fff' : '#94a3b8',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <BookOpen size={15} color={activeTab === 'journal' ? '#38bdf8' : '#94a3b8'} />
          <span>📔 Bitácora de Aprendizaje ({activePlan?.journal?.length || 0})</span>
        </button>
      </div>

      {/* Banner de procesamiento vivo si generating está activo */}
      {generating && (
        <div className="ai-processing-glow animate-fade-in" style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          margin: '1.25rem 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="radar-ping" style={{ width: '100%', height: '100%' }} />
              <RefreshCw size={20} className="spin-anim" color="#818cf8" />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center' }}>
                Auditoría y Trazado de Bifurcaciones con IA en curso
                <span className="thinking-dots" style={{ color: '#818cf8' }}><span></span><span></span><span></span></span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                Analizando experiencias, competencias e hitos de tu CV Maestro para construir los nodos y bifurcaciones de carrera...
              </div>
            </div>
          </div>
          <div className="progress-indeterminate-track">
            <div className="progress-indeterminate-runner" style={{ background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #818cf8 100%)' }} />
          </div>
        </div>
      )}

      {/* 3. Renderizado del Contenido Activo */}
      {activeTab === 'chat' && (
        <CareerAdvisorChat
          planId={activePlan?.id}
          activePlan={activePlan}
          onPlanUpdated={(newPlan) => {
            setPlans((prevPlans) => {
              const idx = prevPlans.findIndex((p) => p.id === newPlan.id);
              if (idx >= 0) {
                const copy = [...prevPlans];
                copy[idx] = newPlan;
                return copy;
              }
              return [newPlan, ...prevPlans];
            });
            setSelectedPlanId(newPlan.id);
            if (onRefresh) onRefresh();
          }}
          onRoadmapGenerated={(newPlan) => {
            setPlans((prevPlans) => [newPlan, ...prevPlans.filter((p) => p.id !== newPlan.id)]);
            setSelectedPlanId(newPlan.id);
            if (onRefresh) onRefresh();
            setActiveTab('tree');
          }}
          onGoToRoadmap={() => setActiveTab('tree')}
        />
      )}

      {activeTab === 'tree' && (!activePlan ? (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={24} color="#818cf8" />
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.25rem' }}>
              No tienes ningún itinerario de carrera activo todavía
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', maxWidth: '500px' }}>
              La IA puede leer directamente tu <strong>cv-maestro.md</strong> para trazar automáticamente múltiples caminos profesionales con sus bifurcaciones.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveTab('chat')}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Compass size={15} />
              <span>Hablar con el Consultor IA</span>
            </button>

            <button
              onClick={handleGenerateFromMasterCv}
              disabled={generating}
              className="btn btn-primary"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                background: 'linear-gradient(135deg, #10b981, #0284c7)'
              }}
            >
              <Sparkles size={15} />
              <span>{generating ? 'Analizando CV Maestro...' : '⚡ Trazar Caminos desde CV Maestro'}</span>
            </button>
          </div>
        </div>
      ) : (
        <CareerBranchingMap
          plan={activePlan}
          onRefresh={onRefresh}
        />
      ))}

      {activeTab === 'journal' && (
        !activePlan ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Genera o selecciona un plan de carrera para acceder a su bitácora de aprendizaje.
          </div>
        ) : (
          <CareerJournal
            planId={activePlan.id}
            journal={activePlan.journal || []}
            onRefresh={onRefresh}
          />
        )
      )}

      {/* MODAL EXPLORADOR GLOBAL DE CURSOS IA */}
      {showCourseExplorerModal && (
        <CourseSearchModal
          initialQuery={activePlan?.target_role || 'AWS Cloud DevOps'}
          planId={activePlan?.id}
          onClose={() => setShowCourseExplorerModal(false)}
          onCourseAttached={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

    </div>
  );
}
