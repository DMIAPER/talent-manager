import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Mail, Printer, Download, Copy, Check, Eye, 
  Sparkles, ZoomIn, ZoomOut, Maximize2, Columns, ArrowRight,
  Briefcase, Building, MapPin, CheckCircle2, Loader2, RefreshCw, FileCheck,
  FileCode, Upload
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { exportElementToPdf } from '../utils/pdfExport';
import ApplicationTailorModal from './ApplicationTailorModal';
import ApplicationCvHistoryTable from './ApplicationCvHistoryTable';
import { api } from '../services/api';

/**
 * Vista completa de Estudio de Documentos ATS (A4).
 * Permite previsualizar, conmutar, comparar, imprimir y guardar directamente en PDF
 * el Curriculum Vitae y la Carta de Presentación tanto del Perfil Oficial como de
 * cualquiera de las candidaturas del pipeline.
 */
export default function AtsDocumentStudio({ userProfile, applications = [], onRefresh }) {
  // Pestaña principal: 'history' (Control de CVs y ofertas) | 'studio' (Visor A4) | 'markdown' (Fuente)
  const [mainSectionTab, setMainSectionTab] = useState('history');

  // Selección de contexto: 'master' o ID de la aplicación
  const [selectedContextId, setSelectedContextId] = useState('master');
  
  // Selección de documento: 'cv' | 'letter' | 'dual' | 'markdown'
  const [activeDocTab, setActiveDocTab] = useState('cv');

  // Nivel de Zoom: 1.0 (100%), 0.9 (90%), 0.8 (80%), 0.7 (70%)
  const [zoomLevel, setZoomLevel] = useState(0.95);

  // Estados de exportación y feedback
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportingDocType, setExportingDocType] = useState(null); // 'cv' | 'letter'
  const [copiedType, setCopiedType] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [profile, setProfile] = useState(userProfile);

  // Estados para documentos cargados y Markdown sincronizado
  const [cvInfo, setCvInfo] = useState(null);
  const [masterMarkdown, setMasterMarkdown] = useState('');
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  // Sincronizar o cargar perfil desde la API si no vino precargado
  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    } else {
      api.getProfile().then(res => {
        if (res) setProfile(res);
      }).catch(() => {});
    }
  }, [userProfile]);

  // Cargar metadatos del documento cargado (cv-maestro.md)
  const loadCvInfo = async () => {
    try {
      const [info, md] = await Promise.all([
        api.getCurrentCv().catch(() => null),
        api.getMarkdownExport().catch(() => '')
      ]);
      if (info) setCvInfo(info);
      if (md) setMasterMarkdown(md);
    } catch (e) {
      console.warn('Error cargando información de documentos:', e);
    }
  };

  useEffect(() => {
    loadCvInfo();
  }, []);

  // Modal de adaptación IA si la oferta seleccionada no tiene materiales generados
  const [tailorJob, setTailorJob] = useState(null);

  // Referencias a los elementos imprimibles
  const cvSheetRef = useRef(null);
  const letterSheetRef = useRef(null);

  // Obtener la aplicación seleccionada si no es 'master'
  const selectedApp = selectedContextId === 'master' 
    ? null 
    : applications.find(a => a.id === selectedContextId) || null;

  // Datos personales del perfil con texto sustitutivo informativo si no se ha incluido
  const pInfo = profile?.personal_info || {};
  const hasName = Boolean(pInfo.full_name && pInfo.full_name.trim());
  const fullName = hasName 
    ? pInfo.full_name.trim() 
    : '[Nombre no incluido - Por favor, registra tu nombre en "Mi Perfil & CV"]';
  
  const headline = selectedApp 
    ? `${selectedApp.role} | Candidatura ${selectedApp.company ? `para ${selectedApp.company}` : ''}`
    : (pInfo.headline || 'Perfil Profesional');

  const location = pInfo.location || '';
  const email = pInfo.email || '';
  const phone = pInfo.phone || '';
  const linkedin = pInfo.linkedin || '';
  const github = pInfo.github || '';
  const summary = pInfo.summary || 'Resumen profesional no especificado.';

  const experiences = profile?.work_experience || [];
  const projects = profile?.projects || [];
  const education = profile?.education || [];
  const certifications = profile?.certifications || [];
  const flattenList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.flatMap(it => {
        if (typeof it === 'string') return [it.trim()];
        if (it && Array.isArray(it.skills)) return it.skills.map(s => typeof s === 'string' ? s.trim() : (s?.name || '')).filter(Boolean);
        if (it && it.name) return [it.name.trim()];
        return [];
      });
    }
    return [String(raw)];
  };
  const hardSkills = flattenList(profile?.hard_skills);
  const toolsAndTech = flattenList(profile?.tools_and_tech);
  const softSkills = flattenList(profile?.soft_skills);
  const languages = Array.isArray(profile?.languages) ? profile.languages : [];

  // Manejador para cargar/actualizar CV directamente desde esta vista
  const handleUploadCvInStudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingCv(true);
    try {
      const res = await api.uploadAndParseCv(file);
      if (res && res.profile) {
        setProfile(res.profile);
      }
      await loadCvInfo();
      showNotification('📄 ¡Currículum procesado y actualizado con éxito!');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setIsUploadingCv(false);
      e.target.value = '';
    }
  };

  // Materiales de la candidatura (si existen)
  const tailoredCvMarkdown = selectedApp?.ats_optimized_cv_content || '';
  const coverLetterText = selectedApp?.cover_letter || (selectedApp ? 
    `Estimado/a responsable de selección de ${selectedApp.company},\n\nLe escribo para presentar formalmente mi candidatura a la posición de **${selectedApp.role}** publicada recientemente.\n\nTras analizar los requisitos del puesto, considero que mi trayectoria profesional y competencias técnicas se alinean estrechamente con los objetivos de su equipo.\n\nQuedo a su entera disposición para ampliar cualquier detalle en una entrevista personal.\n\nAtentamente,\n${fullName}` 
    : `Estimado equipo de selección,\n\nPresento mi candidatura para integrarme en su equipo profesional...\n\nAtentamente,\n${fullName}`
  );

  const showNotification = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Guardar en archivo PDF directo mediante html2pdf
  const handleSavePdf = async (docType) => {
    const targetRef = docType === 'cv' ? cvSheetRef.current : letterSheetRef.current;
    if (!targetRef) return;

    setIsExportingPdf(true);
    setExportingDocType(docType);

    const safeName = hasName ? fullName.replace(/\s+/g, '_') : 'Candidato';
    const companyPart = selectedApp?.company ? `_${selectedApp.company.replace(/\s+/g, '_')}` : '';
    const filename = docType === 'cv' 
      ? `CV_ATS_${safeName}${companyPart}.pdf`
      : `Carta_Presentacion_${safeName}${companyPart}.pdf`;

    try {
      showNotification(`Compilando archivo ${filename}...`);
      await exportElementToPdf(targetRef, filename);
      showNotification(`✅ ¡PDF guardado correctamente con éxito! (${filename})`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      showNotification('⚠️ Se abrió el diálogo nativo de impresión como respaldo.');
      window.print();
    } finally {
      setIsExportingPdf(false);
      setExportingDocType(null);
    }
  };

  // Impresión nativa del sistema
  const handleNativePrint = () => {
    window.print();
  };

  // Copiar texto plano para portales ATS
  const handleCopyText = (docType) => {
    let text = '';
    if (docType === 'cv') {
      if (tailoredCvMarkdown) {
        text = tailoredCvMarkdown;
      } else {
        text = `${fullName}\n${headline}\nUbicación: ${location} | Email: ${email} | LinkedIn: ${linkedin}\n\n` +
          `PERFIL PROFESIONAL\n${summary}\n\n` +
          `EXPERIENCIA LABORAL\n` +
          experiences.map(e => `${e.role} en ${e.company} (${e.start_date || ''} - ${e.end_date || 'Presente'})\n${(e.highlights || []).map(h => `• ${h}`).join('\n')}`).join('\n\n') +
          `\n\nFORMACIÓN ACADÉMICA\n` +
          education.map(ed => `• ${ed.degree} — ${ed.institution} (${ed.end_date || ''})`).join('\n') +
          `\n\nCOMPETENCIAS TÉCNICAS\n${hardSkills.join(', ')}`;
      }
    } else {
      text = coverLetterText;
    }

    navigator.clipboard.writeText(text);
    setCopiedType(docType);
    showNotification('📋 Texto plano copiado al portapapeles');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Descarga de HTML autónomo
  const handleDownloadHtml = (docType) => {
    const targetRef = docType === 'cv' ? cvSheetRef.current : letterSheetRef.current;
    if (!targetRef) return;

    const safeName = hasName ? fullName.replace(/\s+/g, '_') : 'Candidato';
    const docTitle = docType === 'cv' ? `CV — ${fullName}` : `Carta de Presentación — ${fullName}`;
    const filename = docType === 'cv' ? `CV_ATS_${safeName}.html` : `Carta_${safeName}.html`;

    const stylesText = document.querySelector('style[data-vite-dev-id*="printAtsStyles.css"]')?.textContent || '';

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${stylesText}
    body { background: #F3F4F6; margin: 0; padding: 24px 12px; display: flex; justify-content: center; }
  </style>
</head>
<body>
  ${targetRef.outerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`💾 HTML guardado (${filename})`);
  };

  return (
    <div className="ats-studio-container" style={{ padding: '0 0 3rem 0', minHeight: 'calc(100vh - 80px)' }}>
      {/* 1. CABECERA PRINCIPAL DEL ESTUDIO */}
      <div 
        style={{
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.25rem 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <div 
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b, #c2410c)', 
                  width: 32, 
                  height: 32, 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(245, 158, 11, 0.3)'
                }}
              >
                <FileCheck size={18} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                Centro de Control de Documentos, Historial & Visor ATS
              </h2>
              <span 
                style={{ 
                  background: 'rgba(245, 158, 11, 0.15)', 
                  color: '#fbbf24', 
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Control & Normativa A4
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              Controla y audita los CVs utilizados en tus candidaturas, evalúa su idoneidad ATS con la skill de recruiter y genera archivos <strong>PDF descargables</strong> sin pérdida de datos.
            </p>
          </div>

          {/* MENSAJE DE FEEDBACK TOAST */}
          {feedbackMsg && (
            <div 
              style={{ 
                background: '#047857', 
                color: '#fff', 
                padding: '6px 14px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.4)',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              {feedbackMsg}
            </div>
          )}
        </div>

        {/* SUB-NAVEGACIÓN PRINCIPAL: HISTORIAL DE CVS vs ESTUDIO A4 vs FUENTE MARKDOWN */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMainSectionTab('history')}
            style={{
              background: mainSectionTab === 'history' ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : '#1e293b',
              color: '#fff',
              border: mainSectionTab === 'history' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mainSectionTab === 'history' ? '0 0 12px rgba(59, 130, 246, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📊 Historial & Control de CVs ({applications.length})
          </button>

          <button
            type="button"
            onClick={() => setMainSectionTab('studio')}
            style={{
              background: mainSectionTab === 'studio' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#1e293b',
              color: '#fff',
              border: mainSectionTab === 'studio' ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mainSectionTab === 'studio' ? '0 0 12px rgba(245, 158, 11, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📄 Visor de Impresión A4 & PDF
          </button>

          <button
            type="button"
            onClick={() => setMainSectionTab('markdown')}
            style={{
              background: mainSectionTab === 'markdown' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : '#1e293b',
              color: '#fff',
              border: mainSectionTab === 'markdown' ? '1px solid #a78bfa' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: mainSectionTab === 'markdown' ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📝 Fuente Cargada (Markdown)
          </button>
        </div>

        {/* BARRA DE CONTROLES DEL VISOR A4 (SOLO VISIBLE EN MODO ESTUDIO A4) */}
        {mainSectionTab === 'studio' && (
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '0.85rem', 
              paddingTop: '0.85rem', 
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap', 
              gap: '0.75rem' 
            }}
          >
            {/* Selector de Contexto y Botón Volver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setMainSectionTab('history')}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="Volver a la tabla de historial de CVs y candidaturas"
              >
                ← Volver al Historial
              </button>

              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Candidatura:</span>
              <select
                value={selectedContextId}
                onChange={(e) => setSelectedContextId(e.target.value)}
                style={{
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '320px'
                }}
              >
                <option value="master">🌟 Currículum General (Perfil Oficial Master)</option>
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    🎯 {app.role} — {app.company} ({app.status === 'sent' ? 'Enviada' : 'En Pipeline'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Pestaña de Documento A4 */}
            <div 
              style={{ 
                display: 'flex', 
                gap: '4px', 
                background: '#0f172a', 
                padding: '4px', 
                borderRadius: '24px', 
                border: '1px solid rgba(255, 255, 255, 0.08)' 
              }}
            >
              <button
                type="button"
                className={`ats-btn-tab ${activeDocTab === 'cv' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('cv')}
                style={{ color: activeDocTab === 'cv' ? '#fff' : '#94a3b8' }}
              >
                <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                CV ATS A4
              </button>
              <button
                type="button"
                className={`ats-btn-tab ${activeDocTab === 'letter' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('letter')}
                style={{ color: activeDocTab === 'letter' ? '#fff' : '#94a3b8' }}
              >
                <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Carta A4
              </button>
              <button
                type="button"
                className={`ats-btn-tab ${activeDocTab === 'dual' ? 'active' : ''}`}
                onClick={() => setActiveDocTab('dual')}
                style={{ color: activeDocTab === 'dual' ? '#fff' : '#94a3b8' }}
                title="Ver ambos documentos en paralelo"
              >
                <Columns size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Vista Dual
              </button>
            </div>

            {/* Controles de Zoom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Zoom:</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.65, Number((prev - 0.1).toFixed(2))))}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Reducir zoom"
              >
                <ZoomOut size={13} />
              </button>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', minWidth: '40px', textAlign: 'center', fontWeight: 700 }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(1.25, Number((prev + 0.1).toFixed(2))))}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                title="Aumentar zoom"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(0.95)}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                title="Restablecer tamaño óptimo"
              >
                100%
              </button>
            </div>

            {/* ACCIONES GLOBALES: GUARDAR PDF / IMPRIMIR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSavePdf(activeDocTab === 'letter' ? 'letter' : 'cv')}
                disabled={isExportingPdf}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #c2410c, #ea580c)',
                  boxShadow: '0 4px 14px rgba(194, 65, 12, 0.4)',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Guardar directamente el archivo .PDF en tu disco"
              >
                {isExportingPdf ? (
                  <Loader2 size={15} className="spin-anim" />
                ) : (
                  <Download size={15} />
                )}
                <span>
                  {isExportingPdf ? 'Generando PDF...' : `📥 Guardar PDF (${activeDocTab === 'letter' ? 'Carta' : 'CV'})`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleNativePrint}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  background: '#1e293b'
                }}
                title="Abrir diálogo de impresión física o PDF del navegador"
              >
                <Printer size={15} />
                <span>Imprimir A4</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BANNER DE VISIBILIDAD DE DOCUMENTOS CARGADOS */}
      <div 
        style={{
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#cbd5e1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#94a3b8' }}>Documento activo:</span>
            <span style={{ 
              fontWeight: 700, 
              color: '#38bdf8', 
              background: 'rgba(56, 189, 248, 0.1)', 
              padding: '2px 8px', 
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontFamily: 'monospace'
            }}>
              {cvInfo?.filename || 'cv-maestro.md'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '0.75rem' }}>
            <span>• {experiences.length} Experiencias</span>
            <span>• {projects.length} Proyectos</span>
            <span>• {education.length} Formaciones</span>
            <span>• {certifications.length} Certificaciones</span>
            <span>• {hardSkills.length} Skills</span>
            {cvInfo?.char_count > 0 && (
              <span>• {cvInfo.char_count.toLocaleString()} caracteres extraídos</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label 
            style={{
              background: isUploadingCv ? '#475569' : 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '8px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isUploadingCv ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {isUploadingCv ? (
              <>
                <Loader2 size={13} className="spin-slow" />
                Procesando Documento...
              </>
            ) : (
              <>
                <Upload size={13} />
                Cargar / Actualizar Documento (PDF, DOCX, MD)
              </>
            )}
            <input 
              type="file" 
              accept=".pdf,.docx,.doc,.txt,.md" 
              onChange={handleUploadCvInStudio} 
              disabled={isUploadingCv} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>

      {/* 2. CONTENIDO PRINCIPAL SEGÚN SUB-PESTAÑA SELECCIONADA */}
      
      {/* VISTA 1: HISTORIAL & CONTROL DE CVS Y OFERTAS */}
      {mainSectionTab === 'history' && (
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 2rem' }}>
          <ApplicationCvHistoryTable
            applications={applications}
            onRefresh={onRefresh}
            onSelectApplicationForA4={(appId) => {
              setSelectedContextId(appId);
              setMainSectionTab('studio');
              setActiveDocTab('cv');
            }}
            onOpenTailorModal={(app) => setTailorJob(app)}
          />
        </div>
      )}

      {/* VISTA 2: ESTUDIO DE IMPRESIÓN Y GUARDADO A4 */}
      {mainSectionTab === 'studio' && (
        <div>
          {/* AVISO INFORMATIVO SI SE ELIGE UNA CANDIDATURA SIN MATERIALES GENERADOS */}
          {selectedApp && !tailoredCvMarkdown && (
            <div 
              style={{ 
                maxWidth: '920px', 
                margin: '1rem auto 0 auto', 
                background: 'rgba(245, 158, 11, 0.1)', 
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={20} color="#fbbf24" />
                <div style={{ fontSize: '0.82rem', color: '#fef3c7' }}>
                  <strong>Esta candidatura aún no tiene un CV adaptado específicamente con IA.</strong>
                  <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: 2 }}>
                    Se está mostrando tu perfil general con el título enfocado a {selectedApp.role}. Puedes generar la adaptación completa con 1 clic.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setTailorJob(selectedApp)}
                style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', whiteSpace: 'nowrap' }}
              >
                ✨ Adaptar con IA para esta Oferta
              </button>
            </div>
          )}

          {/* ÁREA DE TRABAJO / CANVAS DE VISUALIZACIÓN A4 */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '2rem 1rem',
              background: '#090d16',
              minHeight: '800px',
              overflowX: 'auto'
            }}
          >
        <div 
          style={{ 
            display: 'flex', 
            gap: '2.5rem', 
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
        >
          {/* =========================================================
              DOCUMENTO 1: CURRÍCULUM VITAE ATS
              ========================================================= */}
          {(activeDocTab === 'cv' || activeDocTab === 'dual') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Barra de utilidades sobre el CV */}
              <div 
                className="no-print"
                style={{ 
                  width: '100%', 
                  maxWidth: '820px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '10px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  color: '#94a3b8'
                }}
              >
                <span>📄 <strong>Curículum Vitae ATS</strong> • Formato A4 Estándar</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSavePdf('cv')}
                    disabled={isExportingPdf}
                    style={{
                      background: 'rgba(194, 65, 12, 0.2)',
                      border: '1px solid #c2410c',
                      color: '#fb923c',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    Guardar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText('cv')}
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedType === 'cv' ? '✓ Copiado' : 'Copiar Texto CV'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadHtml('cv')}
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {/* HOJA IMPRIMIBLE DEL CV */}
              <div 
                ref={cvSheetRef}
                id="ats-printable-cv-sheet"
                className="ats-sheet"
              >
                <div className="ats-top-stripe"></div>

                {/* ENCABEZADO OFICIAL ATS */}
                <header className="ats-header">
                  <div className="ats-header-top">
                    <div>
                      <h1>{fullName}</h1>
                      <div className="ats-header-role">{headline}</div>
                    </div>
                  </div>

                  <div className="ats-header-contact">
                    <span className="ats-contact-item">Ubicación: {location}</span>
                    <span className="ats-contact-sep">•</span>
                    <span className="ats-contact-item">Email: {email}</span>
                    {phone && (
                      <>
                        <span className="ats-contact-sep">•</span>
                        <span className="ats-contact-item">Tel: {phone}</span>
                      </>
                    )}
                    {linkedin && (
                      <>
                        <span className="ats-contact-sep">•</span>
                        <span className="ats-contact-item">
                          LinkedIn: {linkedin.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '')}
                        </span>
                      </>
                    )}
                    {github && (
                      <>
                        <span className="ats-contact-sep">•</span>
                        <span className="ats-contact-item">GitHub: {github.replace('https://github.com/', '')}</span>
                      </>
                    )}
                  </div>
                </header>

                {/* CONTENIDO DEL CV */}
                {tailoredCvMarkdown ? (
                  <div className="ats-cv-tailored-body">
                    <MarkdownRenderer content={tailoredCvMarkdown} />
                  </div>
                ) : (
                  <div>
                    {/* PERFIL PROFESIONAL */}
                    <section className="ats-section">
                      <h2 className="ats-section-heading">Perfil Profesional</h2>
                      <p className="ats-summary">{summary}</p>
                    </section>

                    {/* PROYECTOS DESTACADOS */}
                    {projects.length > 0 && (
                      <section className="ats-section">
                        <h2 className="ats-section-heading">Proyectos Destacados</h2>
                        {projects.map((proj, idx) => (
                          <div key={idx} className="ats-project-entry">
                            <div className="ats-project-header">
                              <span className="ats-project-title">{proj.name}</span>
                              {proj.technologies && (
                                <span className="ats-project-meta">
                                  {Array.isArray(proj.technologies) ? proj.technologies.join(' • ') : proj.technologies}
                                </span>
                              )}
                            </div>
                            {proj.description && (
                              <div className="ats-project-tagline">{proj.description}</div>
                            )}
                            {proj.highlights && proj.highlights.length > 0 && (
                              <ul className="ats-bullet-list">
                                {proj.highlights.map((h, hIdx) => (
                                  <li key={hIdx}>
                                    <MarkdownRenderer content={h} />
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </section>
                    )}

                    {/* EXPERIENCIA LABORAL */}
                    {experiences.length > 0 && (
                      <section className="ats-section">
                        <h2 className="ats-section-heading">Experiencia Laboral</h2>
                        {experiences.map((exp, idx) => {
                          const expBullets = (exp.highlights && exp.highlights.length > 0)
                            ? exp.highlights
                            : (exp.responsibilities && exp.responsibilities.length > 0 ? exp.responsibilities : []);
                          return (
                            <div key={idx} className="ats-exp-entry">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span className="ats-exp-title">{exp.role}</span>
                                <span style={{ fontSize: '10px', color: 'var(--ats-master-gold)', fontWeight: 700 }}>
                                  {exp.start_date || ''} — {exp.is_current ? 'Actualidad' : (exp.end_date || 'Finalizado')}
                                </span>
                              </div>
                              <div className="ats-exp-org">
                                {exp.company} {exp.location ? `• ${exp.location}` : ''}
                              </div>
                              {expBullets.length > 0 ? (
                                <ul className="ats-bullet-list">
                                  {expBullets.map((h, hIdx) => (
                                    <li key={hIdx}>
                                      <MarkdownRenderer content={h} />
                                    </li>
                                  ))}
                                </ul>
                              ) : exp.description ? (
                                <p style={{ margin: '3px 0 0 0', fontSize: '10.2px', color: 'var(--ats-text-secondary)' }}>
                                  {exp.description}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </section>
                    )}

                    {/* FORMACIÓN ACADÉMICA Y CERTIFICACIONES */}
                    <section className="ats-section">
                      <h2 className="ats-section-heading">Formación Académica & Certificaciones</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: education.length > 0 && certifications.length > 0 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                        {education.length > 0 && (
                          <ul className="ats-edu-list">
                            {education.map((edu, idx) => (
                              <li key={idx} className="ats-edu-row">
                                <div className="ats-edu-row-title">{edu.degree}</div>
                                <div className="ats-edu-row-sub">
                                  {edu.institution || 'Institución'}
                                  {(edu.start_year || edu.end_year || edu.end_date) ? ` • ${edu.start_year ? `${edu.start_year} - ` : ''}${edu.end_year || edu.end_date || ''}` : ''}
                                  {edu.grade ? <> • <span className="ats-highlight-badge">{edu.grade}</span></> : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}

                        {certifications.length > 0 && (
                          <ul className="ats-edu-list">
                            {certifications.map((cert, idx) => (
                              <li key={idx} className="ats-edu-row">
                                <div className="ats-edu-row-title">{cert.name}</div>
                                <div className="ats-edu-row-sub">
                                  {cert.issuer} {cert.year || cert.issue_date ? `(${cert.year || cert.issue_date})` : ''}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>

                    {/* HABILIDADES TÉCNICAS */}
                    {(hardSkills.length > 0 || toolsAndTech.length > 0 || softSkills.length > 0 || languages.length > 0) && (
                      <section className="ats-section" style={{ marginBottom: 0 }}>
                        <h2 className="ats-section-heading">Competencias Técnicas & Habilidades (Keywords ATS)</h2>
                        <div className="ats-skills-block">
                          {hardSkills.length > 0 && (
                            <div className="ats-skill-category">
                              <span className="ats-cat-name">Tecnologías & Skills:</span>
                              <span className="ats-cat-items">{hardSkills.join(' • ')}</span>
                            </div>
                          )}
                          {toolsAndTech.length > 0 && (
                            <div className="ats-skill-category">
                              <span className="ats-cat-name">Herramientas & Entornos:</span>
                              <span className="ats-cat-items">{toolsAndTech.join(' • ')}</span>
                            </div>
                          )}
                          {softSkills.length > 0 && (
                            <div className="ats-skill-category">
                              <span className="ats-cat-name">Competencias Clave:</span>
                              <span className="ats-cat-items">{softSkills.join(' • ')}</span>
                            </div>
                          )}
                          {languages.length > 0 && (
                            <div className="ats-skill-category">
                              <span className="ats-cat-name">Idiomas:</span>
                              <span className="ats-cat-items">
                                {languages.map(l => typeof l === 'string' ? l : `${l.language || ''}${l.proficiency || l.level ? ` (${l.proficiency || l.level})` : ''}`).join(' • ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* =========================================================
              DOCUMENTO 2: CARTA DE PRESENTACIÓN ATS
              ========================================================= */}
          {(activeDocTab === 'letter' || activeDocTab === 'dual') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Barra de utilidades sobre la Carta */}
              <div 
                className="no-print"
                style={{ 
                  width: '100%', 
                  maxWidth: '820px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '10px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  color: '#94a3b8'
                }}
              >
                <span>✉️ <strong>Carta de Presentación</strong> • Formato A4 Estándar</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSavePdf('letter')}
                    disabled={isExportingPdf}
                    style={{
                      background: 'rgba(194, 65, 12, 0.2)',
                      border: '1px solid #c2410c',
                      color: '#fb923c',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    Guardar PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText('letter')}
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {copiedType === 'letter' ? '✓ Copiado' : 'Copiar Texto Carta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadHtml('letter')}
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {/* HOJA IMPRIMIBLE DE LA CARTA */}
              <div 
                ref={letterSheetRef}
                id="ats-printable-letter-sheet"
                className="ats-sheet"
              >
                <div className="ats-top-stripe"></div>

                {/* ENCABEZADO OFICIAL */}
                <header className="ats-header">
                  <div className="ats-header-top">
                    <div>
                      <h1>{fullName}</h1>
                      <div className="ats-header-role">{headline}</div>
                    </div>
                  </div>

                  <div className="ats-header-contact">
                    <span className="ats-contact-item">Ubicación: {location}</span>
                    <span className="ats-contact-sep">•</span>
                    <span className="ats-contact-item">Email: {email}</span>
                    {phone && (
                      <>
                        <span className="ats-contact-sep">•</span>
                        <span className="ats-contact-item">Tel: {phone}</span>
                      </>
                    )}
                    {linkedin && (
                      <>
                        <span className="ats-contact-sep">•</span>
                        <span className="ats-contact-item">
                          LinkedIn: {linkedin.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '')}
                        </span>
                      </>
                    )}
                  </div>
                </header>

                {/* CONTENIDO DE LA CARTA */}
                <div className="ats-letter-sheet">
                  {/* Destinatario y Fecha */}
                  <div className="ats-letter-recipient">
                    <div className="ats-letter-date">
                      {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="ats-letter-company">
                      A la atención de: Equipo de Selección de {selectedApp?.company || 'la Empresa'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ats-text-muted)' }}>
                      Referencia: Candidatura para la vacante de {selectedApp?.role || 'la posición convocada'}
                    </div>
                  </div>

                  {/* Cuerpo de la Carta con Markdown Enriquecido */}
                  <div className="ats-letter-body">
                    <MarkdownRenderer content={coverLetterText} />
                  </div>

                  {/* Despedida y Firma */}
                  <div className="ats-letter-sign">
                    <div style={{ fontSize: '10.5px', color: 'var(--ats-text-secondary)', marginBottom: '8px' }}>
                      Agradeciendo de antemano su atención y consideración, atentamente:
                    </div>
                    <div className="ats-letter-sign-name">{fullName}</div>
                    <div className="ats-letter-sign-role">{headline}</div>
                    <div style={{ fontSize: '9.8px', color: 'var(--ats-text-muted)', marginTop: '2px' }}>
                      {email} {phone ? `• ${phone}` : ''} • {location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* VISTA 3: FUENTE MARKDOWN / TEXTO EXTRAÍDO COMPLETO */}
  {mainSectionTab === 'markdown' && (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '1.5rem 2rem' }}>
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          padding: '8px 14px',
          fontSize: '0.8rem',
          color: '#94a3b8',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <span>📝 <strong>Código Fuente Curricular ({cvInfo?.filename || 'cv-maestro.md'})</strong> • {(masterMarkdown || cvInfo?.content || '').length.toLocaleString()} caracteres extraídos</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(masterMarkdown || cvInfo?.content || '');
              showNotification('📋 Markdown copiado al portapapeles');
            }}
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          >
            Copiar Markdown
          </button>
        </div>
      </div>

      <div 
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.75rem',
          color: '#e6edf3',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          maxHeight: '850px',
          overflowY: 'auto',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
        }}
      >
        {masterMarkdown || cvInfo?.content || 'Cargando documento o no hay texto disponible.'}
      </div>
    </div>
  )}

      {/* MODAL PARA GENERAR MATERIALES CON IA SI SE SOLICITA */}
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
