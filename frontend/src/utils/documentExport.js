/**
 * Utilidades para exportación y descarga de documentos de candidatura:
 * - Nomenclaturas estandarizadas (ATS y Cartas)
 * - Descarga directa en UTF-8 (.md y .txt)
 * - Copiado seguro al portapapeles
 */

export function sanitizeFilename(str) {
  if (!str) return 'Documento';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar tildes
    .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, '_'); // Espacios a guiones bajos
}

export function generateCvFilename(candidateName, company, role, extension = 'md') {
  const safeName = sanitizeFilename(candidateName || 'Candidato');
  const safeComp = sanitizeFilename(company || 'Empresa');
  const safeRole = sanitizeFilename(role || 'Puesto');
  const ext = extension.replace(/^\./, '');
  return `CV_${safeName}_${safeComp}_${safeRole}_ATS.${ext}`;
}

export function generateCoverLetterFilename(candidateName, company, role, extension = 'md') {
  const safeName = sanitizeFilename(candidateName || 'Candidato');
  const safeComp = sanitizeFilename(company || 'Empresa');
  const safeRole = sanitizeFilename(role || 'Puesto');
  const ext = extension.replace(/^\./, '');
  return `Carta_Presentacion_${safeName}_${safeComp}_${safeRole}.${ext}`;
}

export function downloadDocument(content, filename, extension = 'md') {
  if (!content) return false;
  
  const mimeType = extension === 'txt' 
    ? 'text/plain;charset=utf-8' 
    : 'text/markdown;charset=utf-8';

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}

export async function copyToClipboard(text) {
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback tradicional
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}
