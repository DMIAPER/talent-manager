import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import OverviewBanner from './components/OverviewBanner';
import KanbanBoard from './components/KanbanBoard';
import CareerStudio from './components/CareerStudio';
import LinkedInHub from './components/LinkedInHub';
import AgentStudio from './components/AgentStudio';
import ProfileStudio from './components/ProfileStudio';
import ApplicationsHistoryView from './components/ApplicationsHistoryView';
import NewApplicationModal from './components/NewApplicationModal';
import FollowUpTemplateModal from './components/FollowUpTemplateModal';
import InteractionsModal from './components/InteractionsModal';
import SettingsModal from './components/SettingsModal';
import AtsDocumentStudio from './components/AtsDocumentStudio';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'kanban' | 'career' | 'agent'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [careerPlans, setCareerPlans] = useState([]);
  const [linkedInData, setLinkedInData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [showNewAppModal, setShowNewAppModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedAppForFollowUp, setSelectedAppForFollowUp] = useState(null);
  const [selectedAppForInteractions, setSelectedAppForInteractions] = useState(null);

  const fetchData = async () => {
    try {
      const [ovData, appsData, plansData, liData, profData] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getApplications().catch(() => []),
        api.getCareerPlans().catch(() => []),
        api.getLinkedInData().catch(() => null),
        api.getProfile().catch(() => null)
      ]);

      if (ovData) setOverview(ovData.metrics);
      if (appsData) setApplications(appsData);
      if (plansData) setCareerPlans(plansData);
      if (liData) setLinkedInData(liData);
      if (profData) setUserProfile(profData);
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetAll = async () => {
    if (window.confirm('⚠️ ¿Estás completamente seguro de restablecer toda la aplicación a Estado 0? Se vaciarán el perfil, las candidaturas del Kanban y los planes de carrera.')) {
      try {
        await api.resetAllData();
        await fetchData();
        alert('Aplicación restablecida con éxito a Estado 0.');
      } catch (e) {
        alert(`Error al restablecer: ${e.message}`);
      }
    }
  };

  const hasCandidateName = Boolean(userProfile?.personal_info?.full_name && userProfile.personal_info.full_name.trim());
  const hasCandidateData = Boolean(
    hasCandidateName && 
    (
      (userProfile?.personal_info?.headline && userProfile.personal_info.headline.trim()) ||
      (userProfile?.work_experience && userProfile.work_experience.length > 0) ||
      (userProfile?.education && userProfile.education.length > 0)
    )
  );

  return (
    <div className="app-layout">
      {/* 1. SIDEBAR LATERAL MODERNA (SUSTITUYE AL NAVBAR SUPERIOR) */}
      <Sidebar
        currentTab={activeTab === 'applications' ? 'kanban' : activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onResetAll={handleResetAll}
        userProfile={userProfile}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <div className="main-content">
        {/* ALERTA OBLIGATORIA SI NO HAY NOMBRE O DATOS DEL CANDIDATO REGISTRADOS */}
        {!hasCandidateData && (
          <div 
            style={{
              background: 'linear-gradient(90deg, rgba(234, 88, 12, 0.18) 0%, rgba(245, 158, 11, 0.14) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(245, 158, 11, 0.35)'
                }}
              >
                <AlertTriangle size={22} color="#fbbf24" />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fef3c7', marginBottom: '3px' }}>
                  ⚠️ Atención: Debes registrar los datos del candidato antes de continuar
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {!hasCandidateName 
                    ? 'No se ha detectado el nombre ni los datos del candidato en el sistema. ' 
                    : 'Aún no has registrado experiencia laboral o formación profesional en tu perfil. '}
                  Antes de realizar cualquier otra actividad (búsqueda de empleo, adaptaciones ATS o auditorías con IA), <strong>debes registrar los datos del candidato</strong> para poder optimizar y personalizar las búsquedas de empleo y el cálculo de afinidad.
                </div>
              </div>
            </div>
            {activeTab !== 'profile' && (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="btn btn-primary"
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#1e1b4b',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.3)'
                }}
              >
                <span>👉 Registrar Datos</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Banner de KPIs Globales solo cuando se está en Kanban o Vista General */}
        {(activeTab === 'kanban' || activeTab === 'applications') && (
          <div style={{ marginBottom: '1.5rem' }}>
            <OverviewBanner metrics={overview} />
          </div>
        )}

        <main>
          {activeTab === 'profile' && (
            <ProfileStudio onProfileUpdated={fetchData} />
          )}

          {activeTab === 'documents' && (
            <AtsDocumentStudio
              userProfile={userProfile}
              applications={applications}
              onRefresh={fetchData}
            />
          )}

          {(activeTab === 'kanban' || activeTab === 'applications') && (
            <KanbanBoard
              applications={applications}
              onRefresh={fetchData}
              onOpenFollowUpTemplate={(app) => setSelectedAppForFollowUp(app)}
              onOpenInteractions={(app) => setSelectedAppForInteractions(app)}
              onOpenNewApp={() => setShowNewAppModal(true)}
            />
          )}

          {activeTab === 'history' && (
            <ApplicationsHistoryView
              onRefreshOverview={fetchData}
            />
          )}

          {activeTab === 'agent' && (
            <AgentStudio
              onJobAddedToKanban={fetchData}
              onPlanAddedToStudio={fetchData}
              onOpenSettings={() => setShowSettingsModal(true)}
              userProfile={userProfile}
              onNavigateToProfile={() => setActiveTab('profile')}
            />
          )}

          {activeTab === 'career' && (
            <CareerStudio
              careerPlans={careerPlans}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'linkedin' && (
            <LinkedInHub
              linkedInData={linkedInData}
              onRefresh={fetchData}
            />
          )}
        </main>
      </div>

      {/* 3. MODALES */}
      {showSettingsModal && (
        <SettingsModal onClose={() => setShowSettingsModal(false)} />
      )}

      {showNewAppModal && (
        <NewApplicationModal
          onClose={() => setShowNewAppModal(false)}
          onSuccess={fetchData}
        />
      )}

      {selectedAppForFollowUp && (
        <FollowUpTemplateModal
          app={selectedAppForFollowUp}
          onClose={() => setSelectedAppForFollowUp(null)}
        />
      )}

      {selectedAppForInteractions && (
        <InteractionsModal
          app={selectedAppForInteractions}
          onClose={() => setSelectedAppForInteractions(null)}
          onSuccess={() => {
            fetchData();
            api.getApplication(selectedAppForInteractions.id).then(setSelectedAppForInteractions);
          }}
        />
      )}
    </div>
  );
}
