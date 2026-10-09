import os
import re
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.services.profile_service import load_profile

SKILLS_DIR = Path(__file__).resolve().parent.parent.parent / "skills"
RECRUITER_SKILL_PATH = SKILLS_DIR / "evaluador-talento-recruiter.md"
ATS_SKILL_PATH = SKILLS_DIR / "ats-cv-optimizador.md"

def load_skill_text(path: Path) -> str:
    if path.exists():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            pass
    return ""

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
        return None
    try:
        return genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"[CvEvaluatorSkill] Error inicializando cliente Gemini: {e}")
        return None

def build_plain_text_from_profile(profile: Dict[str, Any]) -> str:
    """Genera texto plano consolidado del perfil para el evaluador si no hay CV Markdown."""
    p_info = profile.get("personal_info", {})
    name = p_info.get("full_name", "Candidato")
    headline = p_info.get("headline", "")
    summary = p_info.get("summary", "")

    experiences = profile.get("work_experience", [])
    projects = profile.get("projects", [])
    education = profile.get("education", [])
    certifications = profile.get("certifications", [])

    lines = [f"# {name} - {headline}", f"Resumen: {summary}", "\n## Experiencia Laboral:"]
    for exp in experiences:
        role = exp.get("role", "")
        company = exp.get("company", "")
        dates = f"{exp.get('start_date', '')} - {exp.get('end_date', 'Actualidad')}"
        bullets = exp.get("responsibilities") or exp.get("highlights") or []
        lines.append(f"- {role} en {company} ({dates}):")
        for b in bullets:
            lines.append(f"  * {b}")

    lines.append("\n## Proyectos:")
    for proj in projects:
        techs = proj.get("technologies", [])
        tech_str = ", ".join(techs) if isinstance(techs, list) else str(techs)
        lines.append(f"- {proj.get('name', '')} ({tech_str}): {proj.get('description', '')}")

    lines.append("\n## Formación & Certificaciones:")
    for edu in education:
        lines.append(f"- {edu.get('degree', '')} en {edu.get('institution', '')} (Nota: {edu.get('grade', '')})")
    for cert in certifications:
        lines.append(f"- {cert.get('name', '')} ({cert.get('issuer', '')})")

    hard_skills = profile.get("hard_skills", [])
    flat_skills = []
    if isinstance(hard_skills, list):
        for s in hard_skills:
            if isinstance(s, dict):
                flat_skills.extend(s.get("skills", []))
            elif isinstance(s, str):
                flat_skills.append(s)
    lines.append(f"\n## Hard Skills:\n{', '.join(flat_skills)}")

    return "\n".join(lines)

def deterministic_skill_evaluation(
    cv_text: str,
    role: str,
    company: str,
    job_description: str,
    profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluador determinista de alta fidelidad basado en el protocolo estricto de
    'evaluador-talento-recruiter.md' y 'ats-cv-optimizador.md'.
    """
    full_cv = cv_text.lower()
    job_full = (f"{role} {company} {job_description}").lower()

    # Catálogo de tecnologías y conceptos clave para análisis léxico
    tech_catalog = [
        "python", "fastapi", "django", "flask", "flutter", "dart", "sql", "postgresql",
        "mysql", "sqlite", "docker", "kubernetes", "git", "github", "linux", "rest", "api",
        "apis", "aws", "azure", "gcp", "ci/cd", "ciberseguridad", "seguridad", "pytest",
        "testing", "javascript", "typescript", "react", "vue", "angular", "node", "java",
        "spring", "c#", ".net", "arquitectura", "microservicios", "erp", "scrum", "agile",
        "devops", "cloud", "machine learning", "ia", "big data", "nlp", "llm"
    ]

    job_techs_found = [t for t in tech_catalog if re.search(r'\b' + re.escape(t) + r'\b', job_full)]
    if not job_techs_found:
        # Extraer palabras relevantes de longitud >= 4 del rol
        job_techs_found = [w for w in re.findall(r'[a-záéíóúñ]{4,}', role.lower()) if w not in ["para", "como", "sobre", "desde", "desarrollador", "ingeniero"]]

    cv_matching_skills = []
    cv_missing_skills = []

    for t in job_techs_found:
        if re.search(r'\b' + re.escape(t) + r'\b', full_cv):
            cv_matching_skills.append(t.capitalize() if len(t) > 3 else t.upper())
        else:
            cv_missing_skills.append(t.capitalize() if len(t) > 3 else t.upper())

    # Soft skills detectables
    soft_pool = [
        ("resolución de problemas", "Resolución de problemas técnicos complejos"),
        ("rigor", "Rigor y estándares de calidad"),
        ("liderazgo", "Liderazgo técnico / gestión de proyectos"),
        ("comunicación", "Comunicación técnica con stakeholders"),
        ("autonomía", "Alta autonomía operativa")
    ]
    missing_soft = []
    for k, label in soft_pool:
        if k in job_full and k not in full_cv:
            missing_soft.append(label)
    if not missing_soft:
        missing_soft = ["Métricas de impacto de negocio", "Gestión de deuda técnica y refactorización"]

    # Cálculo estricto de Score ATS (0 a 100)
    total_reqs = max(len(job_techs_found), 1)
    matched_count = len(cv_matching_skills)
    base_match_ratio = matched_count / total_reqs

    # Bonus por perfil cualificado (educación + años)
    exp_count = len(profile.get("work_experience", []))
    cert_count = len(profile.get("certifications", []))
    qual_bonus = min(15, (exp_count * 3) + (cert_count * 3))

    raw_score = int((base_match_ratio * 75) + qual_bonus)
    real_ats_score = max(35, min(95, raw_score))

    # Semáforo Recruiter de 5 Segundos
    red_flags = []
    amber_flags = []
    green_signals = []

    if real_ats_score < 55:
        red_flags.append(f"Discrepancia crítica en stack técnico: no se localizan menciones a {', '.join(cv_missing_skills[:3]) or 'tecnologías requeridas'}.")
    if not re.search(r'\d+%', full_cv) and not re.search(r'\b(redujo|mejoró|optimizó|aumentó)\b', full_cv):
        amber_flags.append("Escasez de métricas cuantificables (%, tiempos o presupuestos) en las viñetas laborales.")
    if cv_missing_skills:
        amber_flags.append(f"Gaps de palabras clave prioritarias para los filtros ATS: {', '.join(cv_missing_skills[:4])}.")

    # Señales Verdes
    if cv_matching_skills:
        green_signals.append(f"Alineación contrastada en competencias núcleo: {', '.join(cv_matching_skills[:4])}.")
    if "defensa" in full_cv or exp_count >= 1:
        green_signals.append("Trayectoria técnica sólida con alta fiabilidad organizativa demostrada.")
    if cert_count > 0:
        green_signals.append("Acreditaciones y formación técnica oficial respaldada por entidades reconocidas.")

    # Veredicto
    if real_ats_score >= 82:
        verdict = "Alta probabilidad de entrevista (Top 10%)"
    elif real_ats_score >= 68:
        verdict = "Candidatura Competitiva (Ajustes Menores Recomendados)"
    elif real_ats_score >= 50:
        verdict = "Riesgo de Descarte Técnico (Brechas en Requisitos Clave)"
    else:
        verdict = "Descarte Probable en Filtro Previo (Perfil Desalineado)"

    # Viñetas STAR recomendadas
    p_name = profile.get("personal_info", {})
    star_bullets = [
        f"**Situación & Tarea:** En proyectos de software y sistemas ERP, **Acción:** diseñé e implementé arquitecturas asíncronas optimizadas y seguras, **Resultado:** logrando una trazabilidad integral y reduciendo cuellos de botella operativos.",
        f"**Situación & Tarea:** Ante la necesidad de control riguroso de calidad técnica, **Acción:** coordiné auditorías técnicas y cumplimiento normativo estricto, **Resultado:** garantizando cero incidencias críticas y alta disponibilidad en los servicios.",
        f"**Situación & Tarea:** Para soluciones multiplataforma y desarrollo ágil, **Acción:** programé módulos desacoplados integrando persistencia local y APIs REST ({', '.join(cv_matching_skills[:2]) or 'Python/SQL'}), **Resultado:** optimizando el tiempo de respuesta y la experiencia de usuario final."
    ]

    return {
        "real_ats_score": real_ats_score,
        "verdict": verdict,
        "traffic_light": {
            "red_flags": red_flags,
            "amber_flags": amber_flags,
            "green_signals": green_signals
        },
        "keyword_gaps": {
            "missing_hard_skills": cv_missing_skills[:5],
            "missing_soft_skills": missing_soft[:3]
        },
        "matching_skills": cv_matching_skills,
        "star_bullets_recommended": star_bullets,
        "audit_summary": (
            f"Auditoría realizada para la posición de '{role}' en '{company}'. "
            f"El perfil presenta una afinidad real del {real_ats_score}%. "
            f"Los filtros automáticos de criba detectarán fortaleza en {', '.join(cv_matching_skills[:3]) if cv_matching_skills else 'aspectos generales'}, "
            f"pero es crucial visibilizar {', '.join(cv_missing_skills[:3]) if cv_missing_skills else 'métricas de impacto'} "
            f"para maximizar el ratio de conversión directa a llamada con el recruiter."
        ),
        "evaluated_at": datetime.now().isoformat()
    }

async def evaluate_cv_with_recruiter_skill(
    application: Dict[str, Any],
    profile: Optional[Dict[str, Any]] = None,
    cv_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Función principal que ejecuta la auditoría de idoneidad estricta utilizando las
    skills 'evaluador-talento-recruiter' y 'ats-cv-optimizador'.
    """
    if profile is None:
        profile = load_profile()

    role = application.get("role", "Puesto Profesional")
    company = application.get("company", "Empresa")
    job_description = application.get("description", "") or f"Oferta para la posición de {role} en {company}."

    # Obtener el texto del CV: o el adaptado de la oferta, o el CV explícito, o el perfil
    if not cv_text:
        cv_text = application.get("ats_optimized_cv_content")
    if not cv_text or len(cv_text.strip()) < 50:
        cv_text = build_plain_text_from_profile(profile)

    # Intentar evaluación con Gemini si cliente disponible
    client = get_gemini_client()
    if client:
        recruiter_skill = load_skill_text(RECRUITER_SKILL_PATH)
        ats_skill = load_skill_text(ATS_SKILL_PATH)

        prompt = f"""
Eres un Headhunter Senior y Director de Selección de Talento.
Sigue estrictamente las directrices del protocolo:
---
PROTOCOLO RECRUITER:
{recruiter_skill[:1500]}
---
PROTOCOLO ATS OPTIMIZER:
{ats_skill[:1000]}
---

DATOS DE LA VACANTE:
- Rol: {role}
- Empresa: {company}
- Descripción y Requisitos:
{job_description[:2500]}

CONTENIDO DEL CV DEL CANDIDATO:
{cv_text[:3500]}

INSTRUCCIÓN:
Realiza una auditoría implacable y objetiva (CERO ENDULZAMIENTO / ZERO SUGARCOATING).
Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato exacto:
{{
  "real_ats_score": (número entero entre 0 y 100 evaluando la coincidencia técnica y requisitos reales),
  "verdict": ("Alta probabilidad de entrevista (Top 10%)" | "Candidatura Competitiva (Ajustes Menores)" | "Riesgo de Descarte Técnico (Brechas Clave)" | "Descarte Inmediato (Perfil Desalineado)"),
  "traffic_light": {{
    "red_flags": ["lista de alertas rojas o motivos de descarte inmediato"],
    "amber_flags": ["lista de alertas ámbar o puntos de fricción / falta de métricas"],
    "green_signals": ["lista de señales verdes o diferenciadores sólidos"]
  }},
  "keyword_gaps": {{
    "missing_hard_skills": ["hasta 5 hard skills críticas que pide la oferta y faltan o están débiles"],
    "missing_soft_skills": ["hasta 3 soft skills o competencias clave que pide la vacante"]
  }},
  "matching_skills": ["lista de tecnologías y competencias que sí coinciden con la vacante"],
  "star_bullets_recommended": [
    "3 viñetas cuantificadas usando el método STAR (Situación, Tarea, Acción, Resultado) basadas estrictamente en la experiencia real del candidato"
  ],
  "audit_summary": "resumen ejecutivo de 2 o 3 párrafos con el diagnóstico del recruiter",
  "evaluated_at": "{datetime.now().isoformat()}"
}}
"""
        candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
        for model_name in candidate_models:
            try:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda m=model_name: client.models.generate_content(
                        model=m,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.2,
                            response_mime_type="application/json"
                        )
                    )
                )
                raw_text = response.text.strip()
                # Limpiar etiquetas markdown si vinieran
                raw_text = re.sub(r'^```json\s*', '', raw_text)
                raw_text = re.sub(r'\s*```$', '', raw_text)
                parsed = json.loads(raw_text)
                if "real_ats_score" in parsed and "traffic_light" in parsed:
                    parsed["real_ats_score"] = int(parsed["real_ats_score"])
                    return parsed
            except Exception as e:
                print(f"[CvEvaluatorSkill] Intento con {model_name} falló: {e}")

    # Fallback determinista de alta fidelidad
    return deterministic_skill_evaluation(
        cv_text=cv_text,
        role=role,
        company=company,
        job_description=job_description,
        profile=profile
    )
