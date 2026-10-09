import React, { useState, useEffect } from 'react';
import { Printer, Copy, Check, Download, X, FileText, Mail, Eye, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { exportElementToPdf } from '../utils/pdfExport';
import { api } from '../services/api';
import ModalPortal from './ModalPortal';

/**
 * Modal universal de Vista Previa e Impresión A4 de CV ATS y Carta de Presentación.
 * Aplica normativa ATS: orden semántico lineal, caracteres seguros, fuentes vectoriales,
 * fondos 100% blancos para ahorro de tinta y paginación exacta.
 */
export default function DocumentPrintModal({
  isOpen,
  onClose,
  profileData = null,
  tailoredCvMarkdown = '',
  coverLetterText = '',
  targetJob = null,
  initialDoc = 'cv' // 'cv' | 'letter'
}) {
  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profileData);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc, isOpen]);

  useEffect(() => {
    if (profileData) {
      setCurrentProfile(profileData);
    } else if (isOpen) {
      api.getProfile().then(p => {
        if (p) setCurrentProfile(p);
      }).catch(() => {});
    }
  }, [profileData, isOpen]);

  if (!isOpen) return null;

  // Extracción de datos del perfil con mensaje informativo si no se ha incluido nombre
  const pInfo = currentProfile?.personal_info || {};
  const hasName = Boolean(pInfo.full_name && pInfo.full_name.trim());
  const fullName = hasName 
    ? pInfo.full_name.trim() 
    : '[Nombre no incluido - Por favor, registra tu nombre en "Mi Perfil & CV"]';

  const headline = targetJob?.role 
    ? `${targetJob.role} | Enfoque Especializado ${targetJob.company ? `en ${targetJob.company}` : ''}`
    : (pInfo.headline || 'Perfil Profesional');

  const location = pInfo.location || '';
  const email = pInfo.email || '';
  const phone = pInfo.phone || '';
  const linkedin = pInfo.linkedin || '';
  const github = pInfo.github || '';
  const portfolio = pInfo.portfolio || '';
  const summary = pInfo.summary || 'Resumen profesional no especificado.';

  const experiences = currentProfile?.work_experience || [];
  const projects = currentProfile?.projects || [];
  const education = currentProfile?.education || [];
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
  const hardSkills = flattenList(currentProfile?.hard_skills);
  const languages = Array.isArray(currentProfile?.languages) ? currentProfile.languages : [];

  // Guardar en archivo PDF directo mediante html2pdf
  const handleSavePdf = async () => {
    const sheetEl = document.getElementById('ats-printable-document');
    if (!sheetEl) return;

    setIsExporting(true);
    const safeName = hasName ? fullName.replace(/\s+/g, '_') : 'Candidato';
    const companyPart = targetJob?.company ? `_${targetJob.company.replace(/\s+/g, '_')}` : '';
    const filename = activeDoc === 'cv' 
      ? `CV_ATS_${safeName}${companyPart}.pdf`
      : `Carta_Presentacion_${safeName}${companyPart}.pdf`;

    try {
      await exportElementToPdf(sheetEl, filename);
    } catch (err) {
      console.error('Error al generar PDF directo:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Función de impresión nativa A4
  const handlePrint = () => {
    window.print();
  };

  // Copia de texto plano para formularios web ATS
  const handleCopyPlainText = () => {
    let plain = '';
    if (activeDoc === 'cv') {
      if (tailoredCvMarkdown) {
        plain = tailoredCvMarkdown;
      } else {
        plain = `${fullName}\n${headline}\nUbicación: ${location} | Email: ${email} | LinkedIn: ${linkedin}\n\n` +
          `PERFIL PROFESIONAL\n${summary}\n\n` +
          `EXPERIENCIA LABORAL\n` +
          experiences.map(e => `${e.role} en ${e.company} (${e.start_date || ''} - ${e.end_date || 'Presente'})\n${(e.highlights || []).map(h => `• ${h}`).join('\n')}`).join('\n\n') +
          `\n\nFORMACIÓN ACADÉMICA\n` +
          education.map(ed => `• ${ed.degree} — ${ed.institution} (${ed.end_date || ''})`).join('\n') +
          `\n\nCOMPETENCIAS TÉCNICAS\n${hardSkills.join(', ')}`;
      }
    } else {
      plain = coverLetterText || `Estimado equipo de selección,\n\nPresento mi candidatura para la posición...\n\nAtentamente,\n${fullName}`;
    }

    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Descarga de HTML autónomo para abrir fuera de la app
  const handleDownloadHtml = () => {
    const sheetEl = document.getElementById('ats-printable-document');
    if (!sheetEl) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activeDoc === 'cv' ? `CV — ${fullName}` : `Carta de Presentación — ${fullName}`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${document.querySelector('style[data-vite-dev-id*="printAtsStyles.css"]')?.textContent || ''}
    body { background: #F3F4F6; margin: 0; padding: 20px 10px; display: flex; justify-content: center; }
  </style>
</head>
<body>
  ${sheetEl.outerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = hasName ? fullName.replace(/\s+/g, '_') : 'Candidato';
    a.download = activeDoc === 'cv' 
      ? `CV_ATS_${safeName}.html`
      : `Carta_Presentacion_${safeName}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="ats-modal-backdrop" onClick={onClose}>
      {/* BARRA FLOTANTE DE ACCIONES (NO SE IMPRIME) */}
      <div className="ats-action-bar no-print" onClick={(e) => e.stopPropagation()}>
        {/* Selector de Documento si hay carta disponible */}
        {coverLetterText && (
          <div style={{ display: 'flex', gap: '4px', background: '#F3F4F6', padding: '3px', borderRadius: '24px' }}>
            <button
              type="button"
              className={`ats-btn-tab ${activeDoc === 'cv' ? 'active' : ''}`}
              onClick={() => setActiveDoc('cv')}
            >
              <FileText size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              CV Adaptado ATS
            </button>
            <button
              type="button"
              className={`ats-btn-tab ${activeDoc === 'letter' ? 'active' : ''}`}
              onClick={() => setActiveDoc('letter')}
            >
              <Mail size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Carta de Presentación
            </button>
          </div>
        )}

        {/* Botón Guardar en PDF directo */}
        <button
          type="button"
          onClick={handleSavePdf}
          disabled={isExporting}
          className="ats-btn-action ats-btn-primary"
          title="Guardar directamente como archivo PDF descargable (.pdf)"
        >
          {isExporting ? <Loader2 size={15} className="spin-anim" /> : <Download size={15} />}
          <span>{isExporting ? 'Generando PDF...' : 'Guardar en PDF (.pdf)'}</span>
        </button>

        {/* Botón Imprimir A4 (Diálogo del Navegador) */}
        <button
          type="button"
          onClick={handlePrint}
          className="ats-btn-action ats-btn-secondary"
          title="Abrir diálogo de impresión para imprimir físicamente o configurar opciones de papel"
        >
          <Printer size={15} />
          <span>Imprimir A4</span>
        </button>

        {/* Copiar Texto Plano ATS */}
        <button
          type="button"
          onClick={handleCopyPlainText}
          className="ats-btn-action ats-btn-secondary"
          title="Copiar contenido en texto plano optimizado para formularios web ATS"
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? '¡Copiado!' : 'Copiar Texto ATS'}</span>
        </button>

        {/* Descargar HTML */}
        <button
          type="button"
          onClick={handleDownloadHtml}
          className="ats-btn-action ats-btn-secondary"
          title="Descargar archivo HTML independiente con todos los estilos integrados"
        >
          <Download size={14} />
          <span>Descargar HTML</span>
        </button>

        {/* Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="ats-btn-action ats-btn-secondary"
          style={{ padding: '6px 10px' }}
          title="Cerrar vista de impresión"
        >
          <X size={15} />
        </button>
      </div>

      {/* HOJA A4 IMPRIMIBLE */}
      <div 
        id="ats-printable-document" 
        className="ats-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ats-top-stripe"></div>

        {/* ENCABEZADO COMÚN PARA CV Y CARTA */}
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
                <span className="ats-contact-item">LinkedIn: {linkedin.replace('https://www.linkedin.com/in/', '').replace('https://linkedin.com/in/', '')}</span>
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

        {/* ==============================================================
            CONTENIDO SEGÚN EL DOCUMENTO SELECCIONADO
            ============================================================== */}

        {activeDoc === 'cv' ? (
          /* VISTA DEL CURRICULUM VITAE */
          tailoredCvMarkdown ? (
            /* Si tenemos el CV adaptado en Markdown generado para la vacante */
            <div className="ats-cv-tailored-body">
              <MarkdownRenderer content={tailoredCvMarkdown} />
            </div>
          ) : (
            /* Vista del CV estructurado desde la base de datos oficial */
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
                          <span className="ats-project-meta">{proj.technologies}</span>
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
                  {experiences.map((exp, idx) => (
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
                      {exp.highlights && exp.highlights.length > 0 ? (
                        <ul className="ats-bullet-list">
                          {exp.highlights.map((h, hIdx) => (
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
                  ))}
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
                            {edu.institution} {edu.grade ? <span className="ats-highlight-badge">{edu.grade}</span> : null}
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
                            {cert.issuer} {cert.issue_date ? `(${cert.issue_date})` : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* HABILIDADES TÉCNICAS */}
              {hardSkills.length > 0 && (
                <section className="ats-section" style={{ marginBottom: 0 }}>
                  <h2 className="ats-section-heading">Competencias Técnicas (Keywords ATS)</h2>
                  <div className="ats-skills-block">
                    <div className="ats-skill-category">
                      <span className="ats-cat-name">Tecnologías & Skills:</span>
                      <span className="ats-cat-items">{hardSkills.join(' • ')}</span>
                    </div>
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
          )
        ) : (
          /* VISTA DE LA CARTA DE PRESENTACIÓN */
          <div className="ats-letter-sheet">
            {/* Destinatario y Fecha */}
            <div className="ats-letter-recipient">
              <div className="ats-letter-date">
                {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="ats-letter-company">
                A la atención de: Equipo de Selección de {targetJob?.company || 'la Empresa'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--ats-text-muted)' }}>
                Referencia: Candidatura para la vacante de {targetJob?.role || 'Desarrollador/a de Software'}
              </div>
            </div>

            {/* Cuerpo de la Carta */}
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
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
