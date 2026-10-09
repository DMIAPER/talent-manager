import re
import urllib.parse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import httpx
from bs4 import BeautifulSoup

try:
    from ddgs import DDGS
    HAS_DDGS = True
except ImportError:
    try:
        from duckduckgo_search import DDGS
        HAS_DDGS = True
    except ImportError:
        HAS_DDGS = False


class JobSearchResult(BaseModel):
    title: str = Field(..., description="Título de la vacante")
    company: str = Field(..., description="Nombre de la empresa contratante")
    location: str = Field("Remoto", description="Ubicación o modalidad de la oferta")
    exact_url: str = Field(..., description="URL canónica y directa a la ficha de la oferta")
    platform: str = Field("General", description="Portal de procedencia (LinkedIn, Tecnoempleo, InfoJobs, etc.)")
    snippet: str = Field("", description="Extracto o requisitos resumidos")
    salary_text: Optional[str] = Field(None, description="Banda salarial si está disponible")
    posted_time: Optional[str] = Field("Reciente", description="Tiempo de publicación")


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
}


def is_exact_job_url(url: str) -> bool:
    """Verifica que una URL sea una ficha concreta de vacante y no un buscador o listado genérico."""
    if not url or not url.startswith("http"):
        return False
    u = url.lower()
    # Descartar páginas de búsqueda genéricas
    if any(q in u for q in [
        "/search?", "?keywords=", "?keyword=", "?q=", "?te=",
        "/ofertas-trabajo/?", "/jobsearch/search-results", "/jobs?q="
    ]):
        return False

    # Reconocer patrones canónicos de ficha exacta
    if "linkedin.com/jobs/view/" in u:
        return True
    if "tecnoempleo.com/" in u and "/rf-" in u:
        return True
    if "infojobs.net/" in u and "/of-" in u:
        return True
    if "indeed.com/viewjob" in u or "indeed.es/viewjob" in u:
        return True
    if "manfred.com/ofertas/" in u or "getmanfred.com/ofertas/" in u:
        return True
    
    # Portales corporativos directos que contienen slugs de job/oferta/careers
    if any(k in u for k in ["/job/", "/jobs/", "/careers/", "/oferta/", "/vacante/", "/position/"]) and len(u.split("/")) >= 4:
        return True

    return False


COMMON_ACRONYMS = {
    "tcae": "auxiliar de enfermeria",
    "due": "enfermero",
    "mir": "medico interno residente",
    "daw": "desarrollador web",
    "dam": "desarrollador multiplataforma",
    "asir": "administrador sistemas redes",
    "rrhh": "recursos humanos",
    "prl": "prevencion riesgos laborales",
    "seo": "especialista seo",
    "sem": "especialista sem"
}


def normalize_search_query(keywords: str) -> str:
    """Normaliza acrónimos y expresiones para que los motores de búsqueda de empleo encuentren vacantes exactas."""
    k = keywords.strip().lower()
    if k in COMMON_ACRONYMS:
        return COMMON_ACRONYMS[k]
    for acr, expansion in COMMON_ACRONYMS.items():
        if re.search(rf"\b{acr}\b", k):
            k = re.sub(rf"\b{acr}\b", expansion, k)
    return k


def is_tech_query(keywords: str) -> bool:
    """Verifica si la búsqueda pertenece al ámbito tecnológico/TI para saber si usar portales de nicho como Tecnoempleo."""
    k = keywords.lower()
    tech_terms = [
        "python", "javascript", "react", "flutter", "dart", "java", "c#", ".net", "php",
        "sql", "backend", "frontend", "fullstack", "full stack", "devops", "cloud", "aws",
        "azure", "docker", "kubernetes", "software", "desarrollador", "programador",
        "sistemas", "redes", "ciberseguridad", "data", "qa", "testing", "it", "ti",
        "plm", "cad", "arquitecto", "machine learning", "inteligencia artificial", "ia",
        "daw", "dam", "asir", "ingeniero de software", "scrum"
    ]
    return any(t in k for t in tech_terms)


def is_job_relevant_to_query(query: str, title: str, snippet: str = "") -> bool:
    """
    Filtro de relevancia semántica estricto:
    Evita que búsquedas sanitarias, administrativas o especializadas devuelvan ofertas
    completamente ajenas (ej: 'Ingeniero de Validación en CAF' para 'auxiliar de enfermería').
    """
    if not query or not title:
        return True

    q_lower = query.lower().strip()
    t_lower = title.lower().strip()
    s_lower = snippet.lower().strip()

    # Si coincide directamente
    if q_lower in t_lower:
        return True

    expanded_query = COMMON_ACRONYMS.get(q_lower, q_lower)
    stop_words = {"de", "del", "la", "el", "en", "para", "por", "y", "o", "a", "con", "un", "una", "los", "las"}
    q_tokens = [w for w in re.findall(r"\w+", expanded_query) if w not in stop_words and len(w) > 2]
    if not q_tokens:
        return True

    # 1. Dominio Sanitario / Salud (TCAE, Auxiliar de enfermería, etc.)
    health_queries = ["enfermer", "tcae", "auxiliar enfermer", "gerocultor", "medico", "médico", "sanitari", "farmaci", "clinica", "clínica"]
    if any(hq in q_lower or hq in expanded_query for hq in health_queries):
        valid_health_roots = ["enfermer", "tcae", "auxiliar", "gerocultor", "sanitar", "salud", "clínic", "clinic", "hospital", "paciente", "cuidados"]
        title_has_health = any(hr in t_lower for hr in valid_health_roots)
        if not title_has_health:
            return False
        # Filtro negativo: si el título es explícitamente industrial, financiero o ferroviario
        negative_terms = ["tracción", "traccion", "ferrocarril", "due diligence", "banco", "activo", "plm", "cad innovation", "obra hidráulica", "csp"]
        if any(neg in t_lower for neg in negative_terms):
            return False
        return True

    # 2. Dominio Legal / Jurídico
    legal_queries = ["abogad", "juridic", "jurídic", "legal", "compliance", "notar"]
    if any(lq in q_lower for lq in legal_queries):
        valid_legal_roots = ["abogad", "legal", "jurídic", "juridic", "derecho", "compliance", "litigio"]
        return any(lr in t_lower for lr in valid_legal_roots)

    # 3. Dominio Tecnológico
    if is_tech_query(query):
        # Si busca desarrollo/TI, rechazar ofertas exclusivamente sanitarias u operativas
        negative_tech = ["enfermer", "médico", "camarero", "conductor"]
        if any(neg in t_lower for neg in negative_tech):
            return False

    # 4. Relevancia por tokens léxicos (al menos un token principal en el título)
    matching_tokens = [tok for tok in q_tokens if tok in t_lower]
    if matching_tokens:
        return True

    # 5. Si no está en el título, verificar si está fuertemente presente en el snippet
    snippet_matches = [tok for tok in q_tokens if tok in s_lower]
    if len(snippet_matches) >= len(q_tokens) * 0.7:
        return True

    return False


class LinkedInGuestProvider:
    """Conector para ofertas reales de LinkedIn usando el API público Jobs-Guest."""

    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"

    async def search(
        self,
        keywords: str,
        location: str = "Spain",
        remote: bool = False,
        published_today: bool = False,
        limit: int = 5
    ) -> List[JobSearchResult]:
        search_query = normalize_search_query(keywords)
        params = {
            "keywords": search_query,
            "location": location or "Spain",
            "start": "0"
        }
        if remote or "remoto" in (location or "").lower():
            params["f_WT"] = "2"  # 2 = Remote en LinkedIn
        if published_today:
            params["f_TPR"] = "r86400"  # Últimas 24h

        results: List[JobSearchResult] = []
        try:
            async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=10.0, follow_redirects=True) as client:
                res = await client.get(self.BASE_URL, params=params)
                
                # Auto-fallback temporal: si 'hoy' no devuelve nada, reintentar con ofertas recientes activas
                if (res.status_code != 200 or not res.text.strip()) and published_today:
                    params_fallback = params.copy()
                    params_fallback.pop("f_TPR", None)
                    res = await client.get(self.BASE_URL, params=params_fallback)

                if res.status_code != 200 or not res.text.strip():
                    return []

                soup = BeautifulSoup(res.text, "html.parser")
                cards = soup.find_all("li")

                # Si no había cards y teníamos filtro de 'hoy', reintentar sin filtro temporal
                if not cards and published_today:
                    params_fallback = params.copy()
                    params_fallback.pop("f_TPR", None)
                    res = await client.get(self.BASE_URL, params=params_fallback)
                    if res.status_code == 200 and res.text.strip():
                        soup = BeautifulSoup(res.text, "html.parser")
                        cards = soup.find_all("li")

                for card in cards:
                    if len(results) >= limit:
                        break

                    link_tag = card.find("a", href=True)
                    if not link_tag:
                        continue

                    raw_url = link_tag["href"]
                    # Extraer URL canónica limpia de LinkedIn sin parámetros de rastreo
                    clean_url = raw_url.split("?")[0]
                    if "linkedin.com/jobs/view/" not in clean_url:
                        continue

                    title_tag = card.find("h3")
                    title = title_tag.get_text(strip=True) if title_tag else "Oferta de Empleo"

                    # FILTRO DE RELEVANCIA: Rechazar inmediatamente títulos ajenos a la búsqueda
                    if not is_job_relevant_to_query(keywords, title):
                        continue

                    company_tag = card.find("h4")
                    company = company_tag.get_text(strip=True) if company_tag else "Empresa"

                    loc_tag = card.find("span", class_="job-search-card__location")
                    loc = loc_tag.get_text(strip=True) if loc_tag else location

                    time_tag = card.find("time")
                    posted = time_tag.get_text(strip=True) if time_tag else "Publicada recientemente"

                    # Salario si estuviera presente en el snippet de LinkedIn
                    salary_tag = card.find("span", class_="job-search-card__salary-info")
                    salary = salary_tag.get_text(strip=True) if salary_tag else None

                    results.append(JobSearchResult(
                        title=title,
                        company=company,
                        location=loc,
                        exact_url=clean_url,
                        platform="LinkedIn",
                        snippet=f"Vacante activa en LinkedIn para {title} en {company} ({loc}). {posted}.",
                        salary_text=salary,
                        posted_time=posted
                    ))
        except Exception as e:
            print(f"Error en LinkedInGuestProvider: {e}")

        return results


class TecnoempleoProvider:
    """Conector y scraper para ofertas directas del portal Tecnoempleo con enlace /rf- (solo ámbito tecnológico)."""

    BASE_URL = "https://www.tecnoempleo.com/ofertas-trabajo/"

    async def search(
        self,
        keywords: str,
        location: str = "",
        limit: int = 5
    ) -> List[JobSearchResult]:
        # Solo consultar Tecnoempleo si es un puesto de TI/tecnología
        if not is_tech_query(keywords):
            return []

        search_query = normalize_search_query(keywords)
        params = {"te": search_query}
        if location and "remoto" not in location.lower():
            params["pr"] = location
        elif location and "remoto" in location.lower():
            params["te"] = f"{search_query} remoto"

        results: List[JobSearchResult] = []
        try:
            async with httpx.AsyncClient(headers=DEFAULT_HEADERS, timeout=10.0, follow_redirects=True) as client:
                res = await client.get(self.BASE_URL, params=params)
                if res.status_code != 200:
                    return []

                soup = BeautifulSoup(res.text, "html.parser")
                # Buscar enlaces con rf-
                for a_tag in soup.find_all("a", href=True):
                    if len(results) >= limit:
                        break

                    href = a_tag["href"]
                    if "/rf-" not in href:
                        continue

                    exact_url = href if href.startswith("http") else f"https://www.tecnoempleo.com{href}"
                    # Evitar duplicar la misma URL
                    if any(r.exact_url == exact_url for r in results):
                        continue

                    card = a_tag.find_parent("div", class_=lambda c: c and "p-3" in c)
                    if not card:
                        continue

                    title = a_tag.get_text(strip=True) or "Especialista TI"

                    # FILTRO DE RELEVANCIA
                    if not is_job_relevant_to_query(keywords, title):
                        continue

                    # Empresa
                    comp_tag = card.find("a", class_=lambda c: c and "link-muted" in c) or card.find("a", href=lambda h: h and "/empresas/" in h)
                    company = comp_tag.get_text(strip=True) if comp_tag else "Empresa Tecnológica"

                    # Parsear detalles en el contenedor
                    card_text = card.get_text(separator=" | ", strip=True)
                    parts = [p.strip() for p in card_text.split(" | ") if p.strip()]

                    loc = "Remoto" if "remoto" in card_text.lower() else location or "España"
                    salary = None
                    for p in parts:
                        if "€" in p or "b/a" in p.lower():
                            salary = p
                            break

                    snippet = card_text[:280]

                    results.append(JobSearchResult(
                        title=title,
                        company=company,
                        location=loc,
                        exact_url=exact_url,
                        platform="Tecnoempleo",
                        snippet=snippet,
                        salary_text=salary,
                        posted_time="Publicada recientemente"
                    ))
        except Exception as e:
            print(f"Error en TecnoempleoProvider: {e}")

        return results


class UniversalSearchProvider:
    """
    Fallback y buscador universal usando DDGS con operadores específicos de fichas de empleo
    para InfoJobs (/of-), Indeed (/viewjob), Tecnoempleo (/rf-) y LinkedIn (/jobs/view/).
    """

    async def search_portal(
        self,
        keywords: str,
        portal: str = "infojobs",
        location: str = "España",
        limit: int = 5
    ) -> List[JobSearchResult]:
        if not HAS_DDGS:
            return []

        results: List[JobSearchResult] = []
        portal_lower = portal.lower()

        # Si el portal es de nicho tecnológico y la búsqueda no es técnica, omitir
        if portal_lower in ["tecnoempleo", "manfred"] and not is_tech_query(keywords):
            return []

        search_query = normalize_search_query(keywords)

        if "infojobs" in portal_lower:
            query = f"site:infojobs.net of- {search_query} {location}".strip()
            platform_name = "InfoJobs"
            filter_fn = lambda u: "infojobs.net" in u and "/of-" in u
        elif "indeed" in portal_lower:
            query = f"site:es.indeed.com/viewjob {search_query} {location}".strip()
            platform_name = "Indeed"
            filter_fn = lambda u: "indeed.com/viewjob" in u or "indeed.es/viewjob" in u
        elif "manfred" in portal_lower:
            query = f"site:getmanfred.com/ofertas {search_query}".strip()
            platform_name = "Manfred"
            filter_fn = lambda u: "manfred.com/ofertas" in u
        elif "tecnoempleo" in portal_lower:
            query = f"site:tecnoempleo.com rf- {search_query}".strip()
            platform_name = "Tecnoempleo"
            filter_fn = lambda u: "tecnoempleo.com" in u and "/rf-" in u
        elif "linkedin" in portal_lower:
            query = f"site:linkedin.com/jobs/view {search_query} {location}".strip()
            platform_name = "LinkedIn"
            filter_fn = lambda u: "linkedin.com/jobs/view" in u
        else:
            query = f"site:infojobs.net of- {search_query}".strip()
            platform_name = "InfoJobs"
            filter_fn = lambda u: "infojobs.net" in u and "/of-" in u

        try:
            ddgs = DDGS()
            items = list(ddgs.text(query, max_results=limit * 2))
            for item in items:
                if len(results) >= limit:
                    break

                href = (item.get("href") or "").split("?")[0]
                if not filter_fn(href):
                    continue

                if any(r.exact_url == href for r in results):
                    continue

                raw_title = item.get("title") or "Oferta de Empleo"
                body = item.get("body") or ""

                # Limpieza de títulos de buscadores
                clean_title = raw_title.replace("Oferta de empleo:", "").replace("Ofertas de trabajo de", "")
                for sep in ["- InfoJobs", "| InfoJobs", "- LinkedIn", "| Tecnoempleo", "- Indeed", "| Indeed"]:
                    clean_title = clean_title.replace(sep, "")
                clean_title = clean_title.strip()

                # Inferir empresa si está en el título o cuerpo
                company = "Empresa Contratante"
                if " en " in clean_title:
                    parts = clean_title.split(" en ")
                    clean_title = parts[0].strip()
                    company = parts[1].split("-")[0].strip()
                elif " - " in clean_title:
                    parts = clean_title.split(" - ")
                    clean_title = parts[0].strip()
                    company = parts[1].strip()

                # FILTRO DE RELEVANCIA
                if not is_job_relevant_to_query(keywords, clean_title, body):
                    continue

                results.append(JobSearchResult(
                    title=clean_title,
                    company=company,
                    location=location or "Remoto",
                    exact_url=href,
                    platform=platform_name,
                    snippet=body[:280] or f"Oferta verificada en {platform_name}: {clean_title}",
                    salary_text=None,
                    posted_time="Publicada recientemente"
                ))
        except Exception as e:
            # Capturar DDGSException ("No results found") u otros errores sin propagar fallo
            pass

        return results


async def search_real_jobs(
    keywords: str,
    location: str = "España",
    platform: str = "all",
    remote: bool = False,
    published_filter: str = "today",
    max_results: int = 5
) -> List[JobSearchResult]:
    """
    Función orquestadora principal:
    Consulta los proveedores adecuados al perfil de búsqueda,
    garantizando que todas las ofertas devueltas sean relevantes y tengan URLs exactas verificadas.
    """
    all_results: List[JobSearchResult] = []
    seen_urls = set()

    is_today = (published_filter == "today")
    is_remote = remote or ("remoto" in (location or "").lower())
    p_lower = platform.lower()

    # 1. LinkedIn Provider (si platform es 'all' o 'linkedin')
    if p_lower in ["all", "linkedin"]:
        li_provider = LinkedInGuestProvider()
        li_jobs = await li_provider.search(
            keywords=keywords,
            location=location,
            remote=is_remote,
            published_today=is_today,
            limit=max_results
        )
        for j in li_jobs:
            if j.exact_url not in seen_urls and is_job_relevant_to_query(keywords, j.title, j.snippet):
                all_results.append(j)
                seen_urls.add(j.exact_url)

    # 2. Tecnoempleo Provider (solo para puestos TI / tecnología)
    if is_tech_query(keywords) and p_lower in ["all", "tecnoempleo"] and len(all_results) < max_results:
        te_provider = TecnoempleoProvider()
        te_jobs = await te_provider.search(
            keywords=keywords,
            location=location,
            limit=max_results - len(all_results)
        )
        for j in te_jobs:
            if j.exact_url not in seen_urls and is_job_relevant_to_query(keywords, j.title, j.snippet):
                all_results.append(j)
                seen_urls.add(j.exact_url)

    # 3. Fallback Universal (InfoJobs, Indeed) si faltan vacantes
    if len(all_results) < max_results:
        needed = max_results - len(all_results)
        universal = UniversalSearchProvider()

        # Probar InfoJobs
        if p_lower in ["all", "infojobs"]:
            infojobs_res = await universal.search_portal(keywords, portal="infojobs", location=location, limit=needed)
            for j in infojobs_res:
                if j.exact_url not in seen_urls and is_job_relevant_to_query(keywords, j.title, j.snippet) and len(all_results) < max_results:
                    all_results.append(j)
                    seen_urls.add(j.exact_url)

        # Probar Indeed si aún se necesitan
        if len(all_results) < max_results and p_lower in ["all", "indeed"]:
            needed = max_results - len(all_results)
            indeed_res = await universal.search_portal(keywords, portal="indeed", location=location, limit=needed)
            for j in indeed_res:
                if j.exact_url not in seen_urls and is_job_relevant_to_query(keywords, j.title, j.snippet) and len(all_results) < max_results:
                    all_results.append(j)
                    seen_urls.add(j.exact_url)

    return all_results[:max_results]
