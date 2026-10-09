/**
 * Utilidades para detección de portal, enlaces exactos y badges de empleo.
 */

export function detectPortalInfo(portal, url) {
  const p = (portal || '').toLowerCase();
  const u = (url || '').toLowerCase();

  if (p.includes('linkedin') || u.includes('linkedin.com')) {
    return { 
      name: 'LinkedIn', 
      color: '#38bdf8', 
      badgeBg: 'rgba(56, 189, 248, 0.15)', 
      badgeBorder: 'rgba(56, 189, 248, 0.4)', 
      tag: 'LinkedIn',
      emoji: '💼' 
    };
  }
  if (p.includes('tecnoempleo') || u.includes('tecnoempleo.com')) {
    return { 
      name: 'Tecnoempleo', 
      color: '#00a8e8', 
      badgeBg: 'rgba(0, 168, 232, 0.15)', 
      badgeBorder: 'rgba(0, 168, 232, 0.4)', 
      tag: 'Tecnoempleo',
      emoji: '💻' 
    };
  }
  if (p.includes('infojobs') || u.includes('infojobs.net')) {
    return { 
      name: 'InfoJobs', 
      color: '#ff7a00', 
      badgeBg: 'rgba(255, 122, 0, 0.15)', 
      badgeBorder: 'rgba(255, 122, 0, 0.4)', 
      tag: 'InfoJobs',
      emoji: '🟠' 
    };
  }
  if (p.includes('indeed') || u.includes('indeed.com')) {
    return { 
      name: 'Indeed', 
      color: '#60a5fa', 
      badgeBg: 'rgba(96, 165, 250, 0.15)', 
      badgeBorder: 'rgba(96, 165, 250, 0.4)', 
      tag: 'Indeed',
      emoji: '🌐' 
    };
  }
  if (p.includes('manfred') || u.includes('manfred.com')) {
    return { 
      name: 'Manfred', 
      color: '#34d399', 
      badgeBg: 'rgba(52, 211, 153, 0.15)', 
      badgeBorder: 'rgba(52, 211, 153, 0.4)', 
      tag: 'Manfred',
      emoji: '⚡' 
    };
  }
  return { 
    name: portal || 'Portal Oficial', 
    color: '#818cf8', 
    badgeBg: 'rgba(129, 140, 248, 0.15)', 
    badgeBorder: 'rgba(129, 140, 248, 0.35)', 
    tag: portal || 'Oficial',
    emoji: '🏢' 
  };
}

export function isExactJobUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  const u = url.toLowerCase();

  // Descartar búsquedas genéricas
  if (
    u.includes('/search?') || 
    u.includes('?keywords=') || 
    u.includes('?keyword=') || 
    u.includes('?te=') || 
    u.includes('/ofertas-trabajo/?') || 
    u.includes('/jobsearch/search-results') ||
    u.includes('/jobs?q=')
  ) {
    return false;
  }

  // Fichas canónicas directas
  if (u.includes('linkedin.com/jobs/view/')) return true;
  if (u.includes('tecnoempleo.com/') && u.includes('/rf-')) return true;
  if (u.includes('infojobs.net/') && u.includes('/of-')) return true;
  if (u.includes('indeed.com/viewjob') || u.includes('indeed.es/viewjob')) return true;
  if (u.includes('manfred.com/ofertas/')) return true;

  // URLs con identificadores de oferta
  return u.includes('/job/') || u.includes('/jobs/') || u.includes('/careers/') || u.includes('/oferta/');
}
