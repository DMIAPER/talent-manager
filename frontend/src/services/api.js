const BASE_URL = 'http://127.0.0.1:8000/api';

export const api = {
  // Global Overview
  getOverview: async () => {
    const res = await fetch(`${BASE_URL}/overview`);
    return res.json();
  },

  // Applications
  getApplications: async (sector = null) => {
    const url = sector ? `${BASE_URL}/applications/?sector=${sector}` : `${BASE_URL}/applications/`;
    const res = await fetch(url);
    return res.json();
  },

  getApplication: async (id) => {
    const res = await fetch(`${BASE_URL}/applications/${id}`);
    return res.json();
  },

  createApplication: async (payload) => {
    const res = await fetch(`${BASE_URL}/applications/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  updateApplication: async (id, payload) => {
    const res = await fetch(`${BASE_URL}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  deleteApplication: async (id) => {
    const res = await fetch(`${BASE_URL}/applications/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  checkUrl: async (id) => {
    const res = await fetch(`${BASE_URL}/applications/${id}/check-url`, {
      method: 'POST'
    });
    return res.json();
  },

  addInteraction: async (appId, interaction) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction)
    });
    return res.json();
  },

  getApplicationsHistory: async () => {
    const res = await fetch(`${BASE_URL}/applications/history`);
    return res.json();
  },

  getMonthlyStats: async () => {
    const res = await fetch(`${BASE_URL}/applications/stats/monthly`);
    return res.json();
  },

  addColetilla: async (appId, { content, author = 'Candidato', category = 'general' }) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/coletillas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, author, category })
    });
    return res.json();
  },

  extendWaitPeriod: async (appId, extraDays = 7) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/extend-wait?extra_days=${extraDays}`, {
      method: 'POST'
    });
    return res.json();
  },

  reopenApplication: async (appId, targetStatus = 'sent') => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/reopen?target_status=${targetStatus}`, {
      method: 'POST'
    });
    return res.json();
  },

  evaluateApplicationCv: async (appId) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/evaluate-cv`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error evaluando el CV con la skill de recruiter');
    }
    return res.json();
  },

  generateApplicationMaterials: async (appId) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/generate-materials`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error generando materiales adaptados');
    }
    return res.json();
  },

  // Career Plans & Learning Studio
  getCareerPlans: async () => {
    const res = await fetch(`${BASE_URL}/career/plans`);
    return res.json();
  },

  getCareerPlan: async (planId) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}`);
    return res.json();
  },

  chatCareerAdvisor: async (messages, userMessage, planId = null) => {
    const res = await fetch(`${BASE_URL}/career/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, user_message: userMessage, plan_id: planId })
    });
    return res.json();
  },

  generateRoadmapTree: async ({ userIntent = '', targetRole = '', transitionType = 'branch_pivot', hoursPerWeek = 10 }) => {
    const res = await fetch(`${BASE_URL}/career/roadmap/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_intent: userIntent,
        target_role: targetRole,
        transition_type: transitionType,
        hours_per_week: hoursPerWeek
      })
    });
    return res.json();
  },

  generateCareerPathsFromMasterCv: async ({ userIntent = '', targetRole = '' } = {}) => {
    const res = await fetch(`${BASE_URL}/career/roadmap/generate-from-cv-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_intent: userIntent,
        target_role: targetRole,
        transition_type: 'branch_pivot',
        hours_per_week: 10
      })
    });
    if (!res.ok) throw new Error('Error generando caminos desde el CV Maestro');
    return res.json();
  },

  toggleCareerBranch: async (planId, branchId) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/branch/${branchId}/toggle`, {
      method: 'POST'
    });
    return res.json();
  },

  selectCareerBranches: async (planId, branchIds) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/branches/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch_ids: branchIds })
    });
    if (!res.ok) throw new Error('Error seleccionando bifurcaciones');
    return res.json();
  },

  toggleMilestone: async (planId, milestoneId) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/milestones/${milestoneId}/toggle`, {
      method: 'POST'
    });
    return res.json();
  },

  syncMilestoneToProfile: async (planId, milestoneId, syncPayload) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/milestones/${milestoneId}/sync-to-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syncPayload)
    });
    return res.json();
  },

  syncMilestoneToMasterCv: async (planId, milestoneId) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/milestones/${milestoneId}/sync-to-master-cv`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error sincronizando hito con el CV Maestro');
    return res.json();
  },

  addCareerJournalEntry: async (planId, entry) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/journal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.json();
  },

  searchCourses: async ({ query, milestoneTitle = null, planId = null, freeOnly = false, officialCertOnly = false }) => {
    const res = await fetch(`${BASE_URL}/career/courses/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        milestone_title: milestoneTitle,
        plan_id: planId,
        free_only: freeOnly,
        official_cert_only: officialCertOnly
      })
    });
    if (!res.ok) throw new Error('Error buscando cursos en la web');
    return res.json();
  },

  attachCourseToMilestone: async (planId, milestoneId, courseData) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/milestones/${milestoneId}/attach-course`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });
    if (!res.ok) throw new Error('Error vinculando curso al hito');
    return res.json();
  },

  verifyCourseLink: async (url) => {
    const res = await fetch(`${BASE_URL}/career/courses/verify-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) throw new Error('Error al verificar el enlace del curso');
    return res.json();
  },

  verifyCourseLinksBatch: async (urls) => {
    const res = await fetch(`${BASE_URL}/career/courses/verify-links-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    });
    if (!res.ok) throw new Error('Error al verificar lote de enlaces');
    return res.json();
  },

  uploadMilestoneCertificate: async (planId, milestoneId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/milestones/${milestoneId}/upload-certificate`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al subir y verificar el certificado del hito');
    }
    return res.json();
  },

  deleteCareerJournalEntry: async (planId, journalId) => {
    const res = await fetch(`${BASE_URL}/career/plans/${planId}/journal/${journalId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // LinkedIn
  getLinkedInData: async () => {
    const res = await fetch(`${BASE_URL}/linkedin/data`);
    return res.json();
  },

  toggleLinkedInChecklist: async (itemId) => {
    const res = await fetch(`${BASE_URL}/linkedin/checklist/${itemId}/toggle`, {
      method: 'POST'
    });
    return res.json();
  },

  addLinkedInStat: async (stat) => {
    const res = await fetch(`${BASE_URL}/linkedin/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stat)
    });
    return res.json();
  },

  // Google Calendar
  generateCalendarLink: async (eventData) => {
    const res = await fetch(`${BASE_URL}/calendar/generate-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return res.json();
  },

  // AI Agent
  searchJobsWithAgent: async (query, location, contractType = 'Cualquiera', publishedFilter = 'today') => {
    const res = await fetch(`${BASE_URL}/agent/search-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        location, 
        contract_type: contractType,
        published_filter: publishedFilter
      })
    });
    return res.json();
  },

  searchRealJobs: async (keywords, location = 'España', platform = 'all', remote = false, publishedFilter = 'today', maxResults = 5) => {
    const res = await fetch(`${BASE_URL}/agent/search-real-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        location,
        platform,
        remote,
        published_filter: publishedFilter,
        max_results: maxResults
      })
    });
    return res.json();
  },

  analyzeJobUrl: async (url) => {
    const res = await fetch(`${BASE_URL}/agent/analyze-job-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error analizando la URL de la oferta');
    }
    return res.json();
  },

  getAgentDiscoveredHistory: async () => {
    const res = await fetch(`${BASE_URL}/agent/discovered-history`);
    return res.json();
  },

  clearAgentDiscoveredHistory: async () => {
    const res = await fetch(`${BASE_URL}/agent/discovered-history`, {
      method: 'DELETE'
    });
    return res.json();
  },

  getAgentDiagnostics: async () => {
    const res = await fetch(`${BASE_URL}/agent/cv-diagnostics`);
    return res.json();
  },

  sendAgentChatMessage: async (messages, userMessage) => {
    const res = await fetch(`${BASE_URL}/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, user_message: userMessage })
    });
    return res.json();
  },

  generateCareerPlanWithAgent: async (targetRole, transitionType = 'vertical_leap') => {
    const res = await fetch(`${BASE_URL}/agent/career-advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_role: targetRole, transition_type: transitionType })
    });
    return res.json();
  },

  saveJobToPipeline: async (jobData) => {
    const res = await fetch(`${BASE_URL}/agent/save-to-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });
    return res.json();
  },

  saveCareerPlanFromAgent: async (planData) => {
    const res = await fetch(`${BASE_URL}/agent/save-career-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planData)
    });
    return res.json();
  },

  tailorApplication: async (payload) => {
    const res = await fetch(`${BASE_URL}/agent/tailor-application`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error tailoring application materials');
    return res.json();
  },

  getJobDetailedReport: async (job) => {
    const res = await fetch(`${BASE_URL}/agent/job-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al generar el informe completo de la oferta');
    }
    return res.json();
  },

  generateApplicationMaterials: async (appId) => {
    const res = await fetch(`${BASE_URL}/applications/${appId}/generate-materials`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error generating materials');
    return res.json();
  },

  // CV Upload & Management
  uploadCv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/cv/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCurrentCv: async () => {
    const res = await fetch(`${BASE_URL}/cv/current`);
    return res.json();
  },

  // Settings & API Keys
  getApiKeys: async () => {
    const res = await fetch(`${BASE_URL}/settings/keys`);
    return res.json();
  },

  saveApiKey: async (provider, apiKey) => {
    const res = await fetch(`${BASE_URL}/settings/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, api_key: apiKey })
    });
    return res.json();
  },

  getGeminiModels: async () => {
    const res = await fetch(`${BASE_URL}/settings/gemini/models`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  saveGeminiModel: async (model) => {
    const res = await fetch(`${BASE_URL}/settings/gemini/model`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });
    return res.json();
  },

  testGeminiConnection: async () => {
    const res = await fetch(`${BASE_URL}/settings/gemini/test`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Error de conexión');
    return data;
  },

  // Perfil Profesional & Auditoría de Talento
  getProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile/`);
    if (!res.ok) throw new Error('Error obteniendo perfil');
    return res.json();
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${BASE_URL}/profile/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error('Error actualizando perfil');
    return res.json();
  },

  uploadAndParseCv: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/profile/upload-and-parse`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error procesando CV');
    }
    return res.json();
  },

  uploadProfileCertificate: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/profile/upload-certificate`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al evaluar y registrar certificado en el perfil');
    }
    return res.json();
  },

  uploadProfileCertificatesBatch: async (files) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    const res = await fetch(`${BASE_URL}/profile/upload-certificates-batch`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al subir lote de certificados');
    }
    return res.json();
  },

  getCurrentCv: async () => {
    const res = await fetch(`${BASE_URL}/cv/current`);
    if (!res.ok) return null;
    return res.json();
  },

  uploadCvMaster: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/cv/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error subiendo CV');
    }
    return res.json();
  },

  resetAllData: async () => {
    const res = await fetch(`${BASE_URL}/profile/reset`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error restableciendo datos');
    return res.json();
  },

  auditProfile: async () => {
    const res = await fetch(`${BASE_URL}/profile/audit/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error ejecutando auditoría de talento');
    return res.json();
  },

  getProfileAudit: async () => {
    const res = await fetch(`${BASE_URL}/profile/audit`);
    if (!res.ok) return null;
    return res.json();
  },

  runProfileAudit: async () => {
    const res = await fetch(`${BASE_URL}/profile/audit/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Error ejecutando auditoría de talento');
    return res.json();
  },

  applyProfileEnhancements: async (payload) => {
    const res = await fetch(`${BASE_URL}/profile/apply-enhancements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Error al aplicar las mejoras al perfil');
    }
    return res.json();
  },

  toggleRoadmapStep: async (stepId, completed = null) => {
    const res = await fetch(`${BASE_URL}/profile/audit/roadmap-step/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: stepId, completed })
    });
    if (!res.ok) throw new Error('Error actualizando paso del roadmap');
    return res.json();
  },

  generateSkillQuiz: async (stepId, skillName, topicContext = '') => {
    const res = await fetch(`${BASE_URL}/profile/audit/generate-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_id: stepId, skill_name: skillName, topic_context: topicContext })
    });
    if (!res.ok) throw new Error('Error generando micro-evaluación técnica');
    return res.json();
  },

  verifySkillQuiz: async ({ stepId, skillName, userAnswers, questions, githubUrl = '' }) => {
    const res = await fetch(`${BASE_URL}/profile/audit/verify-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        step_id: stepId,
        skill_name: skillName,
        user_answers: userAnswers,
        questions: questions,
        github_url: githubUrl
      })
    });
    if (!res.ok) throw new Error('Error al evaluar la micro-evaluación');
    return res.json();
  },

  extractSkillsWithAi: async (profileData = null) => {
    const res = await fetch(`${BASE_URL}/profile/extract-skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData || {})
    });
    if (!res.ok) throw new Error('Error al extraer habilidades con IA');
    return res.json();
  },

  getMarkdownExport: async () => {
    const res = await fetch(`${BASE_URL}/profile/markdown-export`);
    if (!res.ok) throw new Error('Error exportando Markdown');
    return res.text();
  },

  getCertificateViewUrl: (certUrlOrFilename) => {
    if (!certUrlOrFilename) return '';
    const filename = String(certUrlOrFilename).split('/').pop().trim();
    return `http://127.0.0.1:8000/api/certificates/${filename}`;
  },

  getCertificateDownloadUrl: (certUrlOrFilename) => {
    if (!certUrlOrFilename) return '';
    const filename = String(certUrlOrFilename).split('/').pop().trim();
    return `http://127.0.0.1:8000/api/certificates-download/${filename}`;
  }
};

