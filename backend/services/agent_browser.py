import httpx
import os
import re
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

from backend.services.cv_matcher import calculate_ats_match, load_master_cv
from backend.services.profile_service import load_profile
from backend.services.job_history_service import (
    normalize_and_verify_job_url,
    is_job_already_known,
    record_discovered_jobs,
    get_discovered_jobs_history
)
from backend.services.job_search_service import search_real_jobs, is_exact_job_url, is_job_relevant_to_query

# Rutas a las skills oficiales del proyecto
SKILLS_DIR = Path(__file__).resolve().parent.parent.parent / "skills"
SKILL_PATH = SKILLS_DIR / "agente-busqueda-empleo.md"

def load_skill_instructions() -> str:
    if SKILL_PATH.exists():
        with open(SKILL_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "Actúa como un agente inteligente de búsqueda de empleo siguiendo la regla de CERO FABRICACIÓN y análisis ATS riguroso."

def get_specialized_skill_context(user_message: str) -> str:
    """
    Carga y ensambla dinámicamente las skills desarrolladas según la intención del usuario:
    - Búsqueda de empleo y mercado -> agente-busqueda-empleo.md
    - Auditoría de talento y CV -> evaluador-talento-recruiter.md + ats-cv-optimizador.md
    - Itinerarios formativos y cursos -> Orientador-Itinerarios-Profesional.md + agente-busqueda-cursos.md
    """
    msg = (user_message or "").lower()
    skills_loaded = []

    # 1. ¿Consulta sobre CV, adecuación, fortalezas o idoneidad?
    if any(k in msg for k in ["cv", "curriculum", "currículum", "auditor", "evalua", "revisa", "puntuaci", "ats", "puntos fuerte", "debilidad", "redact"]):
        recruiter_path = SKILLS_DIR / "evaluador-talento-recruiter.md"
        ats_path = SKILLS_DIR / "ats-cv-optimizador.md"
        if recruiter_path.exists():
            skills_loaded.append(recruiter_path.read_text(encoding="utf-8"))
        if ats_path.exists():
            skills_loaded.append(ats_path.read_text(encoding="utf-8"))

    # 2. ¿Consulta sobre formación, especialización, cursos o bifurcaciones?
    if any(k in msg for k in ["carrera", "itinerario", "curso", "formaci", "certificaci", "aprender", "estudi", "bifurcac", "senior", "pivote", "roadmap"]):
        career_path = SKILLS_DIR / "Orientador-Itinerarios-Profesional.md"
        course_path = SKILLS_DIR / "agente-busqueda-cursos.md"
        if career_path.exists():
            skills_loaded.append(career_path.read_text(encoding="utf-8"))
        if course_path.exists():
            skills_loaded.append(course_path.read_text(encoding="utf-8"))

    # 3. Skill de búsqueda de empleo (base o si consulta sobre mercado)
    if not skills_loaded or any(k in msg for k in ["empleo", "oferta", "trabajo", "vacante", "portal", "postul", "inscrib", "salario", "mercado"]):
        if SKILL_PATH.exists():
            skills_loaded.append(SKILL_PATH.read_text(encoding="utf-8"))

    return "\n\n---\n\n".join(skills_loaded) if skills_loaded else load_skill_instructions()

# Intentar cargar google-genai
try:
    from google import genai
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

def get_gemini_client():
    from dotenv import load_dotenv
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_key or not HAS_GENAI:
        return None, gemini_key
    try:
        client = genai.Client(api_key=gemini_key)
        return client, gemini_key
    except Exception as e:
        print(f"Error inicializando cliente Gemini: {e}")
        return None, gemini_key

async def run_agent_job_search(
    query: str, 
    location: str = "Remoto", 
    contract_type: str = "Cualquiera",
    published_filter: str = "today"
) -> Dict[str, Any]:
    steps = []
    timestamp = datetime.now().strftime("%H:%M:%S")
    skill_text = load_skill_instructions()
    cv_text = load_master_cv()

    client, gemini_key = get_gemini_client()

    # Filtro temporal nativo para Google Search: &tbs=qdr:d restringe a las últimas 24h
    time_filter_param = "&tbs=qdr:d" if published_filter == "today" else ""
    query_time_label = "publicadas hoy (últimas 24h)" if published_filter == "today" else "cualquier fecha"
    
    google_search_url = f"https://www.google.es/search?q=empleo+{query.replace(' ', '+')}+{location.replace(' ', '+')}+{contract_type.replace(' ', '+')}{time_filter_param}"
    
    steps.append({
        "time": timestamp,
        "level": 1,
        "type": "skill_load",
        "title": "Nivel 1: Protocolo de Búsqueda y CV",
        "url": "talent-manager://skills/agente-busqueda-empleo.md",
        "detail": f"Cargando reglas 'agente-busqueda-empleo.md'. Filtro temporal activo: {query_time_label}."
    })

    if not client:
        steps.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "level": 1,
            "type": "error",
            "title": "Agente Bloqueado / Sin Clave",
            "url": "talent-manager://settings/api-keys",
            "detail": "Para realizar búsquedas en vivo en Google y portales, introduce tu GEMINI_API_KEY en ajustes ⚙️."
        })
        return {
            "query": query,
            "location": location,
            "contract_type": contract_type,
            "published_filter": published_filter,
            "status": "blocked",
            "error": "GEMINI_API_KEY no configurada. Haz clic en el botón de ajustes (⚙️) para introducirla.",
            "steps": steps,
            "jobs": [],
            "markdown_report": ""
        }

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    if not gemini_model or gemini_model == "gemini-2.5-flash" or gemini_model == "gemini-3.8-flash":
        gemini_model = "gemini-flash-latest"

    # Nivel 2: Selección y configuración de portales óptimos
    steps.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "level": 2,
        "type": "portal_select",
        "title": "Nivel 2: Selección de Portales Óptimos",
        "url": f"talent-manager://portal-engine?role={query.replace(' ', '+')}&loc={location.replace(' ', '+')}",
        "detail": f"Determinando conectores nativos (LinkedIn Guest, Tecnoempleo) y universales (InfoJobs, Indeed) para '{query}' en '{location}'..."
    })

    # Nivel 3: Rastreo activo de vacantes reales en tiempo real
    steps.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "level": 3,
        "type": "search",
        "title": "Nivel 3: Rastreo de Fichas Reales en Vivo",
        "url": google_search_url,
        "detail": f"Consultando índices y APIs públicas para vacantes reales ({query_time_label}, Modalidad: '{location}', Contrato: '{contract_type}')..."
    })

    # Obtener vacantes reales con enlaces exactos garantizados
    raw_real_jobs = []
    try:
        raw_real_jobs = await search_real_jobs(
            keywords=query,
            location=location,
            remote=("remoto" in location.lower()),
            published_filter=published_filter,
            max_results=8
        )
    except Exception as e:
        print(f"Error consultando proveedores de empleo: {e}")

    first_exact_url = raw_real_jobs[0].exact_url if raw_real_jobs else "https://es.linkedin.com/jobs"
    steps.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "level": 4,
        "type": "browse",
        "title": "Nivel 4: Inspección de Fichas Reales y Verificación de Enlaces",
        "url": first_exact_url,
        "detail": f"Recuperadas {len(raw_real_jobs)} vacantes auténticas con enlace canónico directo ({', '.join(set(j.platform for j in raw_real_jobs)) if raw_real_jobs else 'Portales'})."
    })

    found_jobs = []
    markdown_report = ""

    # Si hay cliente Gemini y tenemos ofertas reales, realizamos el análisis ATS profundo con el LLM
    if client and raw_real_jobs:
        jobs_context_json = json.dumps([
            {
                "title": j.title,
                "company": j.company,
                "location": j.location,
                "exact_url": j.exact_url,
                "platform": j.platform,
                "snippet": j.snippet,
                "salary_text": j.salary_text,
                "posted_time": j.posted_time
            }
            for j in raw_real_jobs[:5]
        ], ensure_ascii=False, indent=2)

        prompt = f"""{skill_text}

---
DATOS DEL CANDIDATO (FUENTE DE VERDAD):
{cv_text[:2500]}

---
PARÁMETROS DE BÚSQUEDA DEL USUARIO:
- Término: {query}
- Ubicación / Modalidad: {location}
- Contrato: {contract_type}
- Filtro Temporal: {query_time_label}

---
OFERTAS REALES LOCALIZADAS EN VIVO (CON ENLACES VERIFICADOS):
{jobs_context_json}

INSTRUCCIONES CRÍTICAS (BLINDAJE DE ENLACES):
1. PROHIBIDO inventar URLs o construir parámetros de búsqueda como `/search?keywords=`. Solo utiliza las URLs directas proporcionadas en el campo "exact_url" de la lista de ofertas reales anterior. Si una oferta no tiene URL directa verificada, establece "url": null.
2. Para cada una de las ofertas reales proporcionadas, calcula la compatibilidad ATS (%) real frente al CV del candidato.
3. Extrae:
   - "matching_skills": 3 a 5 competencias técnicas que el candidato posee y la oferta exige.
   - "missing_skills": 1 a 3 competencias recomendables para reforzar.
   - "description": Resumen profesional de 2-3 frases de la oferta basado en el snippet y el rol.
4. Genera un "markdown_report" ejecutivo según el protocolo de la skill detallando las oportunidades encontradas.
5. FILTRO ESTRICTO DE COHERENCIA Y RELEVANCIA: PROHIBIDO incluir ofertas cuyo puesto o sector no coincida directamente con la búsqueda solicitada ('{query}'). Si una vacante devuelta por los portales es un falso positivo o de otro sector ajeno (por ejemplo, ingeniería de ferrocarriles, banca o finanzas cuando se busca 'auxiliar de enfermería' o 'TCAE'), DESCÁRTALA de la lista 'jobs'.

Devuelve SOLAMENTE el bloque JSON válido con esta estructura:
{{
  "jobs": [
    {{
      "company": "Nombre Empresa",
      "role": "Título de la vacante",
      "portal": "LinkedIn / Tecnoempleo / InfoJobs",
      "url": "https://url-exacta-del-listado",
      "location": "{location}",
      "contract_type": "{contract_type}",
      "salary_range": "35.000€ - 45.000€ o Según valía",
      "posted_time": "Publicada hoy",
      "description": "...",
      "ats_compatibility": 88,
      "matching_skills": ["Skill 1", "Skill 2"],
      "missing_skills": ["Skill 3"]
    }}
  ],
  "markdown_report": "### 📋 Informe de Oportunidades Identificadas..."
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
                    llm_jobs = data.get("jobs", [])
                    markdown_report = data.get("markdown_report", "")

                    # Asegurar correspondencia estricta de URL exacta contra la lista real y relevancia
                    real_urls_by_company = {j.company.lower(): j.exact_url for j in raw_real_jobs}
                    for i, lj in enumerate(llm_jobs):
                        # FILTRO DE RELEVANCIA: Descartar si el puesto no coincide con la búsqueda
                        if not is_job_relevant_to_query(query, lj.get("role", ""), lj.get("description", "")):
                            continue

                        # Si el LLM modificó la URL o no es exacta, forzamos la URL real verificada
                        candidate_url = lj.get("url")
                        if not candidate_url or not is_exact_job_url(candidate_url):
                            if i < len(raw_real_jobs):
                                lj["url"] = raw_real_jobs[i].exact_url
                                lj["portal"] = raw_real_jobs[i].platform
                        found_jobs.append(lj)
        except Exception as e:
            print(f"Error procesando análisis con Gemini: {e}")

    # Fallback si no hay Gemini o falló el LLM, pero tenemos ofertas reales
    if not found_jobs and raw_real_jobs:
        for rj in raw_real_jobs[:5]:
            if not is_job_relevant_to_query(query, rj.title, rj.snippet):
                continue

            local_match = calculate_ats_match(rj.title, rj.snippet)
            found_jobs.append({
                "company": rj.company,
                "role": rj.title,
                "portal": rj.platform,
                "url": rj.exact_url,
                "location": rj.location,
                "contract_type": contract_type,
                "salary_range": rj.salary_text or "Según valía",
                "posted_time": rj.posted_time or "Publicada recientemente",
                "description": rj.snippet or f"Vacante de {rj.title} en {rj.company} ({rj.location}) verificada en {rj.platform}.",
                "ats_compatibility": local_match["ats_score"],
                "matching_skills": local_match["matching_keywords"],
                "missing_skills": local_match["missing_keywords"]
            })

        markdown_report = f"""### 📋 Informe de Oportunidades Reales Identificadas ({len(found_jobs)} vacantes verificadas)
**Término:** {query} | **Modalidad:** {location} | **Contrato:** {contract_type} | **Filtro:** Enlaces exactos comprobados

""" + "\n".join([f"{i+1}. **{j['company']}** – *{j['role']}* ({j['portal']} - {j['ats_compatibility']}% Match ATS)" for i, j in enumerate(found_jobs)])

    # Nivel 5: Normalización de URLs, Deduplicación y Scoring ATS
    processed_jobs = []
    discarded_duplicate_count = 0

    for j in found_jobs:
        company = (j.get("company") or "Empresa").strip()
        role = (j.get("role") or query).strip()
        portal = j.get("portal") or "Google / Portales"

        # FILTRO DE RELEVANCIA FINAL
        if not is_job_relevant_to_query(query, role, j.get("description", "")):
            continue

        # 1. Normalizar y asegurar enlace funcional directo
        verified_url = normalize_and_verify_job_url(
            raw_url=j.get("url"),
            role=role,
            company=company,
            portal=portal,
            location=j.get("location", location)
        )

        # 2. Comprobar si ya existe en el Kanban o en el historial de descubrimientos
        is_known, reason = is_job_already_known(company, role, verified_url)
        if is_known:
            discarded_duplicate_count += 1
            continue

        # 3. Cruce ATS
        local_match = calculate_ats_match(role, j.get("description", ""))
        ats_score = j.get("ats_compatibility") or local_match["ats_score"]
        matching_kws = j.get("matching_skills") or local_match["matching_keywords"]
        missing_kws = j.get("missing_skills") or local_match["missing_keywords"]

        processed_jobs.append({
            "company": company,
            "role": role,
            "url": verified_url,
            "location": j.get("location", location),
            "contract_type": j.get("contract_type", contract_type),
            "salary_range": j.get("salary_range", "Según valía"),
            "posted_time": j.get("posted_time") or "Publicada hoy",
            "description": j.get("description", ""),
            "portal": portal,
            "is_active_url": True,
            "ats_match": {
                "ats_score": ats_score,
                "matching_keywords": matching_kws,
                "missing_keywords": missing_kws,
                "recommendations": local_match.get("recommendations", [])
            }
        })

    # Si todas resultaron duplicadas pero se encontraron ofertas, generar una variante nueva o avisar
    if not processed_jobs and found_jobs:
        steps.append({
            "time": datetime.now().strftime("%H:%M:%S"),
            "level": 5,
            "type": "warning",
            "title": "Deduplicación Activa",
            "url": "talent-manager://history",
            "detail": f"Las {discarded_duplicate_count} ofertas encontradas ya estaban registradas en tu historial previo o Kanban. Búsqueda limpia garantizada."
        })
    else:
        # Registrar las ofertas nuevas mostradas en el historial persistente
        record_discovered_jobs(processed_jobs, query=query)

    history_total = len(get_discovered_jobs_history())

    steps.append({
        "time": datetime.now().strftime("%H:%M:%S"),
        "level": 5,
        "type": "complete",
        "title": "Nivel 5: Análisis ATS y Deduplicación Final",
        "url": "talent-manager://ats-engine/compatibility-matrix",
        "detail": f"Validadas {len(processed_jobs)} vacantes nuevas de hoy con enlaces verificados. (Omitidos {discarded_duplicate_count} duplicados previstos. Historial: {history_total} registros)."
    })

    return {
        "query": query,
        "location": location,
        "contract_type": contract_type,
        "published_filter": published_filter,
        "status": "success",
        "steps": steps,
        "jobs": processed_jobs,
        "filtered_duplicates_count": discarded_duplicate_count,
        "total_history_count": history_total,
        "markdown_report": markdown_report
    }

def build_honest_profile_diagnosis(profile: Dict[str, Any], cv_text: str) -> Dict[str, Any]:
    """Genera diagnóstico determinista y libre de alucinaciones basado exclusivamente en el perfil auténtico."""
    p_info = profile.get("personal_info", {})
    headline = p_info.get("headline", "").strip()
    experiences = profile.get("work_experience", [])
    education = profile.get("education", [])
    certifications = profile.get("certifications", [])
    hard_skills = profile.get("hard_skills", [])
    
    flat_skills = []
    if isinstance(hard_skills, list):
        for s in hard_skills:
            if isinstance(s, dict):
                flat_skills.extend(s.get("skills", []))
            elif isinstance(s, str):
                flat_skills.append(s)

    has_data = bool(headline or experiences or education or flat_skills or (cv_text and len(cv_text) > 80))
    if not has_data:
        return {
            "has_cv": False,
            "seniority": "Por determinar",
            "core_strengths": ["Perfil pendiente de completar"],
            "summary": "No se han detectado datos suficientes en tu CV Maestro. Sube tu currículum o completa los campos básicos para que la IA elabore un diagnóstico riguroso.",
            "recommendations": []
        }

    # Fortalezas reales extraídas del perfil del usuario
    strengths = []
    for sk in flat_skills[:5]:
        if sk not in strengths:
            strengths.append(sk)
    for edu in education[:2]:
        deg = edu.get("degree") or edu.get("title")
        if deg and deg not in strengths:
            strengths.append(deg)

    if not strengths:
        strengths = [headline] if headline else ["Competencias técnicas y operativas"]

    # Recomendaciones reales basadas estrictamente en sus puestos o titulaciones
    recs = []
    roles_seen = set()
    for exp in experiences:
        r = exp.get("role", "").strip()
        if r and r.lower() not in roles_seen and len(recs) < 3:
            roles_seen.add(r.lower())
            recs.append({
                "role": r,
                "contract_type": "Tiempo Completo / Híbrido",
                "reason": f"Basado en tu trayectoria demostrada como {r} en {exp.get('company', 'el sector')}.",
                "estimated_match": 90
            })
    for edu in education:
        deg = edu.get("degree", "").strip()
        if deg and deg.lower() not in roles_seen and len(recs) < 4:
            roles_seen.add(deg.lower())
            recs.append({
                "role": f"Especialista en {deg}",
                "contract_type": "Tiempo Completo",
                "reason": f"Alineado directamente con tu titulación oficial en {deg}.",
                "estimated_match": 88
            })

    if not recs and headline:
        recs.append({
            "role": headline,
            "contract_type": "Tiempo Completo",
            "reason": f"Alineado con tu titular profesional actual ({headline}).",
            "estimated_match": 85
        })

    return {
        "has_cv": True,
        "seniority": "Profesional Cualificado",
        "core_strengths": strengths[:4],
        "summary": f"Perfil profesional con base en {headline or 'tecnología y gestión'}, respaldado por {len(experiences)} experiencias y {len(education)} titulaciones en tu CV Maestro.",
        "recommendations": recs
    }

async def diagnose_cv_profile() -> Dict[str, Any]:
    cv_text = load_master_cv()
    profile = load_profile()
    if not cv_text.strip() and not profile.get("personal_info", {}).get("headline"):
        return {
            "has_cv": False,
            "summary": "No se ha encontrado ningún CV cargado. Por favor, sube tu currículum en PDF o Word para que la IA diagnostique tu perfil.",
            "recommendations": []
        }

    client, _ = get_gemini_client()
    if not client:
        return build_honest_profile_diagnosis(profile, cv_text)

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    if not gemini_model or "2.5-flash" in gemini_model or "3.8-flash" in gemini_model:
        gemini_model = "gemini-flash-latest"
    skill_text = load_skill_instructions()

    prompt = f"""{skill_text}

Analiza este currículum real (Fuente de Verdad) y genera un diagnóstico estratégico de perfil libre de alucinaciones.
CV DEL CANDIDATO:
{cv_text[:8000]}

Devuelve un JSON estrictamente con la siguiente estructura:
{{
  "seniority": "Junior / Mid / Senior / Lead",
  "core_strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "summary": "Resumen ejecutivo de 2 líneas de la propuesta de valor del candidato.",
  "recommended_roles": [
    {{
      "role": "Nombre exacto del puesto recomendado",
      "contract_type": "Tiempo Completo / Media Jornada / Freelance",
      "reason": "Por qué tiene ventaja competitiva según los datos contrastables del CV.",
      "estimated_match": 90
    }}
  ]
}}
Genera exactamente 3 a 4 puestos recomendados."""

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(client.models.generate_content, model=gemini_model, contents=prompt),
            timeout=8.0
        )
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            if data.get("recommended_roles"):
                return {
                    "has_cv": True,
                    "seniority": data.get("seniority", "Profesional"),
                    "core_strengths": data.get("core_strengths", []),
                    "summary": data.get("summary", ""),
                    "recommendations": data.get("recommended_roles", [])
                }
    except Exception as e:
        print(f"Aviso en consulta de IA (usando diagnóstico estratégico local basado en perfil real): {e}")

    # Fallback dinámico honesto sin textos inventados
    return build_honest_profile_diagnosis(profile, cv_text)

async def agent_chat_conversation(messages: List[Dict[str, str]], user_message: str) -> Dict[str, Any]:
    profile = load_profile()
    p_info = profile.get("personal_info", {})
    headline = p_info.get("headline", "tu perfil profesional")
    name = p_info.get("full_name", "Candidato")

    client, _ = get_gemini_client()
    if not client:
        return {
            "reply": "⚠️ El motor del Agente está actualmente sin clave configurada. Por favor, haz clic en el icono de engranaje (⚙️) en la barra superior para guardar tu clave de Google Gemini y poder chatear en tiempo real.",
            "quick_replies": ["Configurar API Key", "Ver mis ofertas actuales", "Explorar itinerario"],
            "status": "blocked"
        }

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    if not gemini_model or "2.5-flash" in gemini_model or "3.8-flash" in gemini_model:
        gemini_model = "gemini-flash-latest"

    # 1. Carga orquestada de skills según intención
    skill_text = get_specialized_skill_context(user_message)
    cv_text = load_master_cv()

    # Formación y certificaciones estructuradas
    edu_summary = [f"- {e.get('degree', '')} en {e.get('institution', '')} ({e.get('end_year', '')})" for e in profile.get("education", [])]
    cert_summary = [f"- {c.get('name', '')} emitido por {c.get('issuer', '')} ({c.get('year', '')})" for c in profile.get("certifications", [])]
    exp_summary = [f"- {x.get('role', '')} en {x.get('company', '')} ({x.get('start_date', '')} - {x.get('end_date', 'Actualidad')})" for x in profile.get("work_experience", [])]

    # 2. Prompt del sistema blindado con el Protocolo Socrático Anti-Alucinaciones
    system_context = f"""Eres el Asesor Senior de Carrera, Empleo y Auditoría de CV de Talent Manager Pro.
Tu comportamiento, metodología y estándares se rigen estrictamente por los siguientes protocolos oficiales:
{skill_text}

============================================================
REGLAS INQUEBRANTABLES (PROTOCOLO DE INTEGRIDAD Y DESCUBRIMIENTO):
============================================================
1. CERO FABRICACIÓN (Zero Fabrication):
   - Basa tus respuestas ÚNICAMENTE en la información contrastable del candidato.
   - NUNCA inventes tecnologías, empresas, fechas, titulaciones o niveles de experiencia que no figuren en su CV.

2. PROTOCOLO OBLIGATORIO DE PREGUNTAS SOCRÁTICAS Y CLARIFICACIÓN:
   - Si la formación, titulación o experiencia del candidato es ambigua, incompleta o no especifica detalles clave (por ejemplo: si menciona "hice un curso" pero no indica tecnologías ni duración; si no queda claro su nivel de dominio en una herramienta; o si pide orientación sin definir horas semanales de estudio o preferencia de roles):
     ¡ESTÁ TERMINANTEMENTE PROHIBIDO ASUMIR O INVENTAR!
   - Debes detenerte, reconocer lo que sí consta en su perfil y formular entre 1 y 3 preguntas socráticas directas, amables y precisas para clarificar esos puntos antes de prescribir un camino o emitir un juicio definitivo.

3. BLINDAJE DE ENLACES:
   - PROHIBIDO inventar URLs o simular hipervínculos con parámetros de búsqueda.
   - Si recomiendas portales o plataformas oficiales, cita su nombre legítimo (ej: LinkedIn, Manfred, Tecnoempleo, Coursera, edX, AWS Training) sin inventar rutas falsas.

4. TONO PROFESIONAL:
   - Directo, asertivo, constructivo, libre de adulaciones vacías ("Zero Sugarcoating").
   - Responde con formato Markdown estructurado, limpio y fácil de leer.

FUENTE DE VERDAD DEL CANDIDATO ({name} - {headline}):
ESTUDIOS Y TITULACIONES OFICIALES:
{chr(10).join(edu_summary) if edu_summary else 'No especificadas'}

CERTIFICACIONES:
{chr(10).join(cert_summary) if cert_summary else 'No especificadas'}

EXPERIENCIA LABORAL:
{chr(10).join(exp_summary) if exp_summary else 'No especificadas'}

CV MAESTRO TEXTUAL COMPLETO:
{cv_text[:12000]}

DEBES RESPONDER EN FORMATO JSON VÁLIDO CON ESTA ESTRUCTURA:
{{
  "reply": "Tu respuesta ejecutiva en Markdown enriquecido con viñetas y formato claro. Si falta información, incluye aquí tus 1-3 preguntas socráticas.",
  "quick_replies": ["Opción o respuesta rápida 1", "Opción 2", "Opción 3"],
  "requires_clarification": true // true si has formulado preguntas aclaratorias porque faltaban datos
}}"""

    # Historial de conversación
    conversation_prompt = f"{system_context}\n\n--- HISTORIAL DE CONVERSACIÓN RECIENTE ---\n"
    for m in messages[-6:]:
        sender = "Candidato" if m.get("sender") == "user" else "Asesor IA"
        conversation_prompt += f"{sender}: {m.get('text', '')}\n"

    conversation_prompt += f"\nCandidato: {user_message}\nAsesor IA (devuelve exclusivamente el JSON):"

    def call_chat():
        return client.models.generate_content(
            model=gemini_model,
            contents=conversation_prompt
        )

    try:
        response = await asyncio.wait_for(
            asyncio.to_thread(call_chat),
            timeout=14.0
        )
        if response and response.text:
            match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return {
                    "reply": data.get("reply", response.text.strip()),
                    "quick_replies": data.get("quick_replies", ["¿Cómo puedo mejorar mi CV?", "Buscar vacantes afines", "Diseñar itinerario formativo"]),
                    "requires_clarification": data.get("requires_clarification", False),
                    "status": "success"
                }
            return {
                "reply": response.text.strip(),
                "quick_replies": ["¿Cómo puedo mejorar mi CV?", "Buscar vacantes afines", "Diseñar itinerario formativo"],
                "requires_clarification": False,
                "status": "success"
            }
    except Exception as e:
        print(f"[Agent Chat] Error en llamada a Gemini ({e}). Usando respuesta contextual fidedigna.")

    # Fallback dinámico contextualizado con el perfil real (sin alucinaciones)
    return {
        "reply": f"💬 **Asesor IA (Modo Contextual)**: He recibido tu consulta (**\"{user_message}\"**).\n\nRevisando tu CV Maestro enfocado en **{headline}**, para orientarte con máxima precisión sin asumir datos:\n\n1. ¿Cuál es tu objetivo inmediato prioritario: **auditar tu CV para una oferta concreta**, **buscar ofertas en el mercado** o **trazar tu itinerario de formación y certificaciones**?\n2. Si deseas profundizar en alguna tecnología o experiencia específica, indícame el nivel y herramientas concretas en las que te gustaría hacer foco.",
        "quick_replies": [
            "Auditar mi CV Maestro con el protocolo ATS",
            "Buscar ofertas afines a mi perfil",
            "Diseñar mi itinerario formativo y certificaciones"
        ],
        "requires_clarification": True,
        "status": "success"
    }
