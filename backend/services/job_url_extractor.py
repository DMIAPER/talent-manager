import re
import os
import json
import asyncio
import urllib.parse
from typing import Dict, Any, Tuple
from bs4 import BeautifulSoup
import httpx

from backend.services.cv_matcher import calculate_ats_match, load_master_cv
from backend.services.job_history_service import clean_url, normalize_and_verify_job_url

try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

def get_gemini_client():
    from dotenv import load_dotenv
    from pathlib import Path
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_key or not HAS_GENAI:
        return None
    try:
        return genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"Error inicializando cliente Gemini en job_url_extractor: {e}")
        return None

async def fetch_webpage_clean_text(url: str) -> Tuple[str, str, str]:
    """
    Descarga el contenido de la web y extrae el texto relevante del anuncio
    eliminando scripts, estilos y elementos de navegación.
    Devuelve (clean_text, page_title, detected_domain).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }

    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc.replace("www.", "")

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            if response.status_code >= 400:
                return "", f"Error HTTP {response.status_code}", domain

            soup = BeautifulSoup(response.text, "html.parser")

            # Extraer títulos y metadatos relevantes
            page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
            
            meta_desc = ""
            for tag in soup.find_all("meta"):
                if tag.get("property") in ["og:description", "twitter:description"] or tag.get("name") in ["description"]:
                    meta_desc = tag.get("content", "").strip()
                    if meta_desc:
                        break

            # Eliminar etiquetas ruidosas
            for noise in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "svg"]):
                noise.extract()

            # Extraer texto del cuerpo principal
            text = soup.get_text(separator="\n")
            lines = [line.strip() for line in text.splitlines() if len(line.strip()) > 3]
            clean_body = "\n".join(lines[:300]) # Primeras 300 líneas significativas

            full_context = f"Título de la página: {page_title}\nDescripción Meta: {meta_desc}\n\nContenido del Anuncio:\n{clean_body}"
            return full_context[:5000], page_title, domain

    except Exception as e:
        print(f"Error descargando web {url}: {e}")
        return f"Error accediendo a la URL: {str(e)}", "", domain

async def extract_and_analyze_job_from_url(url: str) -> Dict[str, Any]:
    """
    Accede a la URL proporcionada por el usuario, extrae la descripción del puesto y la empresa,
    y ejecuta el análisis de compatibilidad ATS frente al CV del usuario.
    """
    cleaned_url = clean_url(url)
    if not cleaned_url or not cleaned_url.startswith("http"):
        raise ValueError("Por favor, introduce una URL válida que empiece por http:// o https://")

    web_text, page_title, domain = await fetch_webpage_clean_text(cleaned_url)
    cv_text = load_master_cv()
    client = get_gemini_client()

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    if not gemini_model or "2.5-flash" in gemini_model or "3.8-flash" in gemini_model:
        gemini_model = "gemini-flash-latest"

    # Si tenemos IA, estructuramos con Gemini
    if client and len(web_text) > 40:
        prompt = f"""Eres un experto analizador de ofertas de empleo.
Analiza el siguiente texto extraído de la página web de una vacante ({cleaned_url}):

---
DATOS DE LA PÁGINA:
{web_text[:4000]}

---
CV MAESTRO DEL CANDIDATO (FUENTE DE VERDAD):
{cv_text[:2000]}

---
INSTRUCCIONES:
1. Extrae con precisión los datos de la oferta:
   - "company": Nombre exacto de la empresa contratante o institución.
   - "role": Nombre exacto del puesto o título de la vacante.
   - "portal": Nombre del portal web (ej: LinkedIn, InfoJobs, Tecnoempleo, Indeed, o el nombre de la empresa si es portal corporativo).
   - "location": Modalidad o lugar (Remoto, Híbrido, Presencial, Ciudad).
   - "contract_type": Tipo de contrato o jornada (Tiempo Completo, Indefinido, Freelance, etc.).
   - "salary_range": Salario o banda salarial indicada (o "Según valía" si no se especifica).
   - "description": Resumen detallado (150-250 palabras) con las responsabilidades clave y requisitos técnicos exigidos.
   - "ats_compatibility": Porcentaje estimado de afinidad (número entre 60 y 98) frente al CV del candidato.
   - "matching_skills": 3 a 5 competencias técnicas que el candidato tiene y pide la vacante.
   - "missing_skills": 2 a 3 competencias o requisitos que convendría reforzar.

Devuelve SOLAMENTE el bloque JSON válido:
{{
  "company": "Empresa",
  "role": "Puesto",
  "portal": "Portal Web",
  "location": "Remoto",
  "contract_type": "Tiempo Completo",
  "salary_range": "35.000€ - 45.000€",
  "description": "...",
  "ats_compatibility": 88,
  "matching_skills": ["Python", "APIs"],
  "missing_skills": ["Docker"]
}}"""

        try:
            res = await asyncio.wait_for(
                asyncio.to_thread(client.models.generate_content, model=gemini_model, contents=prompt),
                timeout=15.0
            )
            if res and res.text:
                match = re.search(r'\{.*\}', res.text, re.DOTALL)
                if match:
                    data = json.loads(match.group(0))
                    role = data.get("role") or page_title or "Puesto de Empleo"
                    company = data.get("company") or domain or "Empresa Contratante"
                    desc = data.get("description") or web_text[:500]

                    local_match = calculate_ats_match(role, desc)
                    ats_score = data.get("ats_compatibility") or local_match["ats_score"]

                    return {
                        "company": company.strip(),
                        "role": role.strip(),
                        "url": cleaned_url,
                        "portal": data.get("portal") or domain or "Portal Web",
                        "location": data.get("location") or "Remoto",
                        "contract_type": data.get("contract_type") or "Tiempo Completo",
                        "salary_range": data.get("salary_range") or "Según valía",
                        "posted_time": "Publicada hoy / Activa en portal",
                        "description": desc.strip(),
                        "is_active_url": True,
                        "ats_match": {
                            "ats_score": ats_score,
                            "matching_keywords": data.get("matching_skills") or local_match["matching_keywords"],
                            "missing_keywords": data.get("missing_skills") or local_match["missing_keywords"],
                            "recommendations": local_match.get("recommendations", [])
                        }
                    }
        except Exception as e:
            print(f"Error procesando con Gemini en analyze_job_from_url: {e}")

    # Fallback heurístico si no hay IA o falló la extracción LLM
    role_guess = page_title.split("-")[0].split("|")[0].strip() if page_title else "Vacante Tecnológica"
    company_guess = domain.capitalize().replace(".com", "").replace(".es", "")
    desc_guess = web_text[:600] if len(web_text) > 40 else "Oferta extraída directamente desde enlace web para adaptación curricular ATS."

    local_match = calculate_ats_match(role_guess, desc_guess)

    return {
        "company": company_guess,
        "role": role_guess,
        "url": cleaned_url,
        "portal": domain or "Web Externa",
        "location": "Remoto",
        "contract_type": "Tiempo Completo",
        "salary_range": "Según valía",
        "posted_time": "Analizada en vivo",
        "description": desc_guess,
        "is_active_url": True,
        "ats_match": {
            "ats_score": local_match["ats_score"],
            "matching_keywords": local_match["matching_keywords"],
            "missing_keywords": local_match["missing_keywords"],
            "recommendations": local_match.get("recommendations", [])
        }
    }
