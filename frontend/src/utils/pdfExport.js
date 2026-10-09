/**
 * Utilidad de exportación directa a PDF A4 de alta fidelidad para CV ATS y Carta de Presentación.
 * Utiliza html2pdf.js con canvas escalado a 2x para nitidez vectorial y ahorro de tinta.
 */

export async function exportElementToPdf(element, filename = 'documento.pdf') {
  if (!element) {
    throw new Error('No se encontró el elemento para exportar.');
  }

  try {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const opt = {
      margin: [6, 8, 6, 8], // márgenes en mm (arriba, izquierda, abajo, derecha)
      filename: filename,
      image: { type: 'jpeg', quality: 0.99 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        backgroundColor: '#FFFFFF',
        windowWidth: 840
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    const worker = typeof html2pdf === 'function' ? html2pdf() : (window.html2pdf ? window.html2pdf() : null);
    if (!worker) {
      throw new Error('No se pudo inicializar la librería de generación de PDF.');
    }

    return await worker.set(opt).from(element).save();
  } catch (error) {
    console.error('Error al generar PDF con html2pdf:', error);
    // Fallback elegante
    throw error;
  }
}
