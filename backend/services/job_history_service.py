import re
import urllib.parse
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from pathlib import Path
from backend.services.data_store import load_json, save_json

HISTORY_FILE = "discovered_jobs.json"
APPLICATIONS_FILE = "applications.json"

def normalize_text(text: str) -> str:
    """Normaliza texto eliminando tildes, caracteres especiales y espacios redundantes."""
    if not text:
        return ""
    text = text.lower().strip()
    text = text.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n")
    # Quitar sufijos empresariales comunes
    text = re.sub(r'\b(s\.l\.?|s\.a\.?|sl|sa|inc\.?|corp\.?|espana|spain)\b', '', text)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    return " ".join(text.split())

def clean_url(url: str) -> str:
    """Limpia una URL quitando parámetros de seguimiento UTM y fragmentos innecesarios."""
    if not url or not isinstance(url, str):
        return ""
    url = url.strip()
    # Si viene con markdown [Texto](http...)
    md_match = re.search(r'\((https?://[^\)]+)\)', url)
    if md_match:
        url = md_match.group(1)
    
    try:
        parsed = urllib.parse.urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return ""
        # Quitar parámetros de tracking
        query_params = urllib.parse.parse_qs(parsed.query)
        cleaned_params = {
            k: v for k, v in query_params.items() 
            if not k.startswith("utm_") and k not in ["ref", "source", "trk", "trackingId"]
        }
        new_query = urllib.parse.urlencode(cleaned_params, doseq=True)
        return urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, ""))
    except Exception:
        return url

def build_job_fingerprint(company: str, role: str) -> str:
    """Genera una huella única (hash) a partir de empresa y puesto normalizados."""
    norm_c = normalize_text(company)
    norm_r = normalize_text(role)
    raw = f"{norm_c}___{norm_r}"
    return hashlib.md5(raw.encode("utf-8")).hexdigest()

def normalize_and_verify_job_url(
    raw_url: Optional[str],
    role: str = "",
    company: str = "",
    portal: str = "Google",
    location: str = "Remoto"
) -> Optional[str]:
    """
    Asegura que las URLs registradas sean enlaces directos y reales a la oferta.
    PROHIBIDO generar enlaces de búsqueda genéricos (/?keywords=, /search?, /ofertas-trabajo/?te=).
    Si la URL proporcionada es válida y directa, la limpia de tracking UTM.
    Si la URL es genérica, vacía, ficticia o un parámetro de búsqueda, retorna None.
    """
    cleaned = clean_url(raw_url or "")
    if not cleaned or not cleaned.startswith("http"):
        return None

    # Detectar si la URL es ficticia o genérica de ejemplo
    fake_patterns = [
        "ejemplo.com", "example.com", "enlace-directo", "enlace.com", "localhost",
        "dominio.com", "portal.com/oferta", "empleo.com$"
    ]
    if any(fp in cleaned.lower() for fp in fake_patterns):
        return None

    # Detectar y rechazar URLs de búsqueda genérica
    search_query_patterns = [
        "/search?", "?keywords=", "?keyword=", "?q=", "?te=", 
        "/jobsearch/search-results", "/jobs?q=", "/ofertas-trabajo/?"
    ]
    if any(sq in cleaned.lower() for sq in search_query_patterns):
        return None

    return cleaned

def get_existing_pipeline_jobs() -> List[Dict[str, Any]]:
    """Obtiene las ofertas activas registradas en el pipeline Kanban."""
    return load_json(APPLICATIONS_FILE, [])

def get_discovered_jobs_history() -> List[Dict[str, Any]]:
    """Carga el historial de ofertas ya descubiertas/mostradas por el agente."""
    return load_json(HISTORY_FILE, [])

def is_job_already_known(company: str, role: str, url: str = "") -> Tuple[bool, str]:
    """
    Comprueba si una oferta ya fue registrada en el Kanban o ya fue mostrada en búsquedas previas.
    Retorna (is_known: bool, reason: str).
    """
    fingerprint = build_job_fingerprint(company, role)
    cleaned_url = clean_url(url)

    # 1. Verificar contra el pipeline Kanban
    pipeline = get_existing_pipeline_jobs()
    for app in pipeline:
        app_fp = build_job_fingerprint(app.get("company", ""), app.get("role", ""))
        if fingerprint == app_fp:
            return True, "Ya está registrada en tu pipeline Kanban"
        app_url = clean_url(app.get("url", ""))
        if cleaned_url and app_url and cleaned_url == app_url:
            return True, "URL ya registrada en tu pipeline Kanban"

    # 2. Verificar contra el historial de ofertas descubiertas previamente
    history = get_discovered_jobs_history()
    for h in history:
        if h.get("fingerprint") == fingerprint:
            return True, f"Ya mostrada en búsqueda previa el {h.get('date', 'recientemente')}"
        h_url = clean_url(h.get("url", ""))
        if cleaned_url and h_url and cleaned_url == h_url:
            return True, f"URL ya descubierta el {h.get('date', 'recientemente')}"

    return False, ""

def record_discovered_jobs(jobs: List[Dict[str, Any]], query: str = "") -> int:
    """
    Registra nuevas ofertas en el historial de descubrimientos para no volver a mostrarlas.
    Devuelve la cantidad de ofertas nuevas agregadas al historial.
    """
    history = get_discovered_jobs_history()
    now_dt = datetime.now()
    now_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
    today_str = now_dt.strftime("%Y-%m-%d")

    existing_fps = {h.get("fingerprint") for h in history if h.get("fingerprint")}
    existing_urls = {clean_url(h.get("url", "")) for h in history if clean_url(h.get("url", ""))}

    added_count = 0
    for j in jobs:
        company = j.get("company", "")
        role = j.get("role", "")
        url = clean_url(j.get("url", ""))
        fp = build_job_fingerprint(company, role)

        if fp not in existing_fps and (not url or url not in existing_urls):
            entry = {
                "id": f"disc-{hashlib.md5(f'{fp}_{now_str}'.encode()).hexdigest()[:8]}",
                "fingerprint": fp,
                "company": company,
                "role": role,
                "portal": j.get("portal", "Portal Web"),
                "url": url,
                "salary_range": j.get("salary_range", ""),
                "location": j.get("location", ""),
                "discovered_at": now_str,
                "date": today_str,
                "search_query": query
            }
            history.insert(0, entry)
            existing_fps.add(fp)
            if url:
                existing_urls.add(url)
            added_count += 1

    if added_count > 0:
        # Limitar el historial a los últimos 500 registros para optimizar memoria
        save_json(HISTORY_FILE, history[:500])

    return added_count

def clear_discovered_history() -> bool:
    """Limpia el historial de ofertas descubiertas."""
    save_json(HISTORY_FILE, [])
    return True
