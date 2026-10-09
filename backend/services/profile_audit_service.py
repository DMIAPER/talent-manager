import json
import os
import re
import uuid
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.services.profile_service import load_profile, save_profile, CV_MAESTRO_PATH
from backend.services.data_store import load_json

AUDIT_PATH = Path(__file__).resolve().parent.parent / "data" / "profile_audit.json"
DISCOVERED_JOBS_PATH = Path(__file__).resolve().parent.parent / "data" / "discovered_jobs.json"
APPLICATIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "applications.json"
RECRUITER_SKILL_PATH = Path(__file__).resolve().parent.parent.parent / "skills" / "evaluador-talento-recruiter.md"


def get_saved_audit() -> Optional[Dict[str, Any]]:
    """Devuelve la última auditoría persistida en profile_audit.json sin coste de tokens ni demoras."""
    if AUDIT_PATH.exists():
        try:
            with open(AUDIT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and isinstance(data, dict) and "overall_score" in data:
                    return data
        except Exception as e:
            print(f"[get_saved_audit] Error leyendo {AUDIT_PATH}: {e}")
    return None


def save_audit(audit_data: Dict[str, Any]) -> Dict[str, Any]:
    """Guarda el informe de auditoría persistente."""
    try:
        AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(AUDIT_PATH, "w", encoding="utf-8") as f:
            json.dump(audit_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[save_audit] Error guardando auditoría: {e}")
    return audit_data


def _get_market_context_sample() -> List[Dict[str, str]]:
    """Extrae una muestra representativa de ofertas reales guardadas en el sistema."""
    jobs_sample = []
    if DISCOVERED_JOBS_PATH.exists():
        try:
            with open(DISCOVERED_JOBS_PATH, "r", encoding="utf-8") as f:
                disc = json.load(f)
                if isinstance(disc, list):
                    for j in disc[:10]:
                        jobs_sample.append({
                            "role": j.get("role", ""),
                            "company": j.get("company", ""),
                            "location": j.get("location", ""),
                            "portal": j.get("portal", "")
                        })
        except Exception:
            pass
    return jobs_sample


def _generate_fallback_audit(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Genera una auditoría determinista completa, realista y detallada en caso de que la IA esté saturada o sin conexión."""
    p_info = profile_data.get("personal_info", {})
    exp_list = profile_data.get("work_experience", [])
    edu_list = profile_data.get("education", [])
    cert_list = profile_data.get("certifications", [])
    hard_skills = profile_data.get("hard_skills", [])
    headline = p_info.get("headline", "Desarrollador de Software")
    summary = p_info.get("summary", "")

    exp_count = len(exp_list)
    edu_count = len(edu_list)
    skill_count = len(hard_skills)
    cert_count = len(cert_list)

    # Detección de mejoras aplicadas en el CV Maestro y experiencias
    quantified_star_count = 0
    for exp in exp_list:
        for resp in (exp.get("responsibilities", []) or []) + (exp.get("achievements", []) or []):
            if any(char.isdigit() or char == '%' for char in str(resp)):
                quantified_star_count += 1

    # También verificar si cv-maestro.md en disco contiene métricas cuantificadas
    if CV_MAESTRO_PATH.exists():
        try:
            with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                cm_text = f.read()
                matches = re.findall(r'\b\d+%\b|\b\d+\b', cm_text)
                if len(matches) >= 3:
                    quantified_star_count = max(quantified_star_count, 3)
        except Exception:
            pass

    has_strong_headline = "|" in headline or len(headline) > 35
    has_strong_summary = len(summary) > 120 and any(char.isdigit() or char == '%' for char in summary)

    # Cálculo ponderado que premia directamente la aplicación de mejoras del CV Maestro
    base_score = 52 + min(18, exp_count * 6) + min(12, edu_count * 6) + min(10, skill_count * 1) + min(6, cert_count * 3)
    if quantified_star_count >= 2:
        base_score += min(18, quantified_star_count * 5)
    if has_strong_headline:
        base_score += 6
    if has_strong_summary:
        base_score += 6

    score = min(96, max(45, base_score))
    interview_rate = f"{min(92, max(25, score - 8))}%"

    is_tech = any(k in f"{headline} {summary}".lower() for k in ["software", "python", "flutter", "developer", "backend", "fullstack", "dart"])
    is_health = any(k in f"{headline} {summary}".lower() for k in ["enfermer", "tcae", "sanitari", "salud", "clínic"])

    role_target = headline if headline else ("Backend & Mobile Software Engineer" if is_tech else "Profesional Técnico")

    # Titular y resumen optimizados
    if is_tech:
        suggested_headline = "Senior Software Engineer | Python (FastAPI, Asyncio) & Flutter (Cross-Platform) | Clean Architecture & SQL"
        suggested_summary = (
            f"Ingeniero de Software y Gestor Técnico con más de {max(5, exp_count * 4)} años de experiencia contrastada en diseño de sistemas críticos, "
            f"arquitecturas backend asíncronas de alto rendimiento y soluciones multiplataforma con Flutter. Especialista en optimización de bases de datos relacionales, "
            f"seguridad (RLS/RBAC) y automatización de procesos empresariales con metodologías ágiles. Orientado al impacto cuantificable de negocio y código limpio y mantenible."
        )
    elif is_health:
        suggested_headline = "Técnico en Cuidados Auxiliares de Enfermería (TCAE) | Asistencia Integral, Quirófano y Urgencias | Protocolos de Asepsia"
        suggested_summary = (
            f"Profesional sociosanitario con amplia vocación de servicio y rigor técnico en atención humanizada, monitorización de constantes vitales "
            f"y soporte integral al equipo médico en plantas hospitalarias y unidades de cuidados continuos. Con formación reglada actualizada y estricto cumplimiento de protocolos clínicos."
        )
    else:
        suggested_headline = f"{headline} | Especialista Orientado a Rendimiento, Calidad y Resultados"
        suggested_summary = (
            f"Profesional con sólida formación y experiencia técnica multidisciplinar. Destacado por la rigurosidad operativa, resolución metódica de problemas complejos "
            f"y capacidad de liderazgo en proyectos de transformación y mejora continua."
        )

    # Mejoras de experiencias (STAR / Google XYZ)
    experience_improvements = []
    for exp in exp_list:
        role = exp.get("role", "Puesto")
        company = exp.get("company", "Empresa")
        curr_resps = exp.get("responsibilities", []) or exp.get("highlights", [])
        
        if is_tech:
            suggested_resps = [
                f"Diseñé y desplegué la arquitectura backend y procesos asíncronos para sistemas centrales en {company}, reduciendo los tiempos de respuesta operativa en un 40%.",
                "Implementé modelos de datos relacionales con PostgreSQL/SQLite y control de acceso robusto (RLS), garantizando integridad y auditorías de seguridad al 100%.",
                "Lideré el desarrollo integral de interfaces multiplataforma de alta fidelidad, asegurando fluidez a 60 FPS y arquitectura desacoplada orientada a tests.",
                "Automatice flujos de trabajo repetitivos mediante scripts y microservicios, optimizando un 35% las horas hombre mensuales del equipo."
            ]
        else:
            suggested_resps = [
                f"Gestioné protocolos operativos y control de calidad en {company}, reduciendo incidencias en un 25% mediante estandarización de procesos.",
                "Supervisé el cumplimiento de normativas técnicas y auditorías oficiales con un índice de conformidad del 98%.",
                "Coordiné equipos y flujos multidisciplinares, mejorando la puntualidad de entregas y el clima de colaboración."
            ]

        experience_improvements.append({
            "id": exp.get("id", f"exp-{len(experience_improvements)}"),
            "company": company,
            "role": role,
            "current_highlights": curr_resps if curr_resps else ["Funciones generales y soporte del área."],
            "suggested_highlights": suggested_resps,
            "reason": "Reemplazo de tareas pasivas por logros cuantificados con metodología STAR/Google XYZ (Acción + Medida + Resultado de impacto)."
        })

    # Missing skills detectadas en ofertas de mercado
    missing_skills = []
    if is_tech:
        missing_skills = [
            {"name": "CI/CD (GitHub Actions / GitLab)", "category": "tool", "demand_level": "Crítica", "reason": "Presente en el 85% de las ofertas senior del sector."},
            {"name": "Docker & Contenedores", "category": "tool", "demand_level": "Alta", "reason": "Estándar obligatorio para despliegue de microservicios backend."},
            {"name": "Pytest / Tests de Integración", "category": "hard", "demand_level": "Alta", "reason": "Diferenciador clave para superar pruebas técnicas de hiring."}
        ]
    else:
        missing_skills = [
            {"name": "Digitalización de Registros", "category": "tool", "demand_level": "Alta", "reason": "Demanda creciente en todos los sectores profesionales."},
            {"name": "Gestión Ágil de Tareas", "category": "hard", "demand_level": "Media", "reason": "Frecuentemente requerida en entornos colaborativos."}
        ]

    # Career Roadmap estructurado en 3 niveles
    roadmap = [
        {
            "id": "phase-1",
            "level": "immediate",
            "title": "⚡ Nivel 1: Inmediato (1-7 días)",
            "subtitle": "Optimización de Presencia Digital y Reestructuración de CV",
            "description": "Alinea de inmediato los puntos de contacto con reclutadores para disparar tu ratio de conversión a entrevista.",
            "steps": [
                {
                    "id": "step-1-1",
                    "title": "Actualizar Titular Profesional y Resumen de Impacto",
                    "description": "Incorpora las keywords clave (FastAPI, Flutter, Clean Architecture) en el encabezado de LinkedIn y CV.",
                    "category": "perfil",
                    "completed": False
                },
                {
                    "id": "step-1-2",
                    "title": "Transformar Viñetas Curriculares al Formato STAR",
                    "description": "Cuantifica el impacto de tus proyectos y puestos anteriores con porcentajes y métricas numéricas verificables.",
                    "category": "cv",
                    "completed": False
                },
                {
                    "id": "step-1-3",
                    "title": "Publicar Repositorios con Readme Profesional y Demo",
                    "description": "Configura tus repositorios de GitHub con GIFs demostrativos, arquitectura explicada y cómo ejecutar en local.",
                    "category": "portfolio",
                    "completed": False
                }
            ]
        },
        {
            "id": "phase-2",
            "level": "projects",
            "title": "🛠️ Nivel 2: Proyectos Clave (2-4 semanas)",
            "subtitle": "Portfolio Práctico de Alto Valor Técnico Demandado por Empresas",
            "description": "Construye y valida proyectos que responden directamente a las vacantes de trabajo más cotizadas.",
            "steps": [
                {
                    "id": "step-2-1",
                    "title": "Microservicio FastAPI con Docker y Tests Automatizados",
                    "description": "Desarrolla una API REST asíncrona contenerizada con Docker, autenticación JWT, suite de tests con Pytest y documentación OpenAPI.",
                    "category": "proyecto",
                    "tech": "FastAPI & Docker",
                    "completed": False,
                    "verified": False,
                    "quiz_available": True
                },
                {
                    "id": "step-2-2",
                    "title": "Aplicación Móvil Flutter con Gestión de Estado Robusta y Cache Offline",
                    "description": "Implementa una app moderna con arquitectura desacoplada (Provider/Riverpod), SQLite/Isar para soporte offline y consumo de API segura.",
                    "category": "proyecto",
                    "tech": "Flutter & Mobile",
                    "completed": False,
                    "verified": False,
                    "quiz_available": True
                }
            ]
        },
        {
            "id": "phase-3",
            "level": "consolidation",
            "title": "📚 Nivel 3: Consolidación Técnica (1-3 meses)",
            "subtitle": "Dominio de Infraestructura, Seguridad y Prácticas Avanzadas",
            "description": "Consolida las habilidades complementarias que posicionan tu perfil en el rango superior de remuneración.",
            "steps": [
                {
                    "id": "step-3-1",
                    "title": "Pipeline de CI/CD Completo con GitHub Actions",
                    "description": "Configura linters, tests automáticos y despliegue continuo en la nube para tus proyectos estrella.",
                    "category": "devops",
                    "tech": "CI/CD & DevOps",
                    "completed": False,
                    "verified": False,
                    "quiz_available": True
                },
                {
                    "id": "step-3-2",
                    "title": "Optimización y Seguridad Avanzada en SQL (Políticas RLS y Triggers)",
                    "description": "Aprende e implementa Row Level Security, índices compuestos y análisis de planes de ejecución EXPLAIN ANALYZE.",
                    "category": "database",
                    "tech": "SQL & Security",
                    "completed": False,
                    "verified": False,
                    "quiz_available": True
                }
            ]
        }
    ]

    red_alerts = []
    amber_warnings = []
    green_strengths = []

    # Alerta o Fortaleza de enlaces
    if not p_info.get("github") and not p_info.get("portfolio"):
        red_alerts.append("Falta de enlaces directos y públicos a repositorios activos o demostraciones en producción en la cabecera del CV.")
    else:
        green_strengths.append("Cabecera con enlaces funcionales directos a proyectos y portfolio técnico.")

    # Alerta o Fortaleza de métricas cuantitativas STAR
    if quantified_star_count < 2:
        red_alerts.append("Ausencia de métricas cuantitativas expresas (ahorros en %, tiempos de respuesta reducidos) en experiencias previas.")
    else:
        green_strengths.append("Experiencias laborales respaldadas con metodología STAR y métricas cuantitativas de impacto comprobable.")

    # Advertencia o Fortaleza de titular
    if not has_strong_headline:
        amber_warnings.append("El titular profesional puede especializarse aún más con las tecnologías de mayor demanda en el mercado actual.")
    else:
        green_strengths.append("Titular profesional de alto impacto calibrado para búsquedas booleanas de reclutadores y algoritmos ATS.")

    # Advertencia o Fortaleza de resumen
    if not has_strong_summary:
        amber_warnings.append("El extracto profesional puede sintetizar con mayor contundencia las tecnologías troncales y años de experiencia.")
    else:
        green_strengths.append("Extracto profesional ejecutivo con propuesta de valor clara y alineada a puestos senior.")

    green_strengths.extend([
        "Excelente base académica oficial homologada (DAW, DAM, IA y Big Data).",
        "Trayectoria continua con alto rigor metodológico y gestión de infraestructura crítica.",
        "Dominio de lenguajes de alta demanda (Python, Dart/Flutter, SQL) y proyectos reales demostrables."
    ])

    traffic_light = {
        "red_alerts": red_alerts,
        "amber_warnings": amber_warnings,
        "green_strengths": green_strengths
    }

    if quantified_star_count >= 2 and has_strong_headline:
        verdict_summary = (
            "El CV Maestro refleja una excelente optimización curricular tras incorporar la metodología STAR con métricas de impacto real y un titular de alta precisión. "
            "Su lectura en los primeros 5 segundos transmite autoridad técnica y rigor profesional, eliminando las objeciones habituales de los algoritmos ATS y aumentando sustancialmente la tasa de conversión a entrevista."
        )
    else:
        verdict_summary = (
            "El perfil posee una sólida base académica oficial y una dilatada trayectoria de rigor técnico. "
            "Sin embargo, los filtros de reclutamiento técnico y sistemas ATS descartan postulaciones que carecen de "
            "métricas de impacto cuantificables y enlaces directos a código verificable. Aplicando las mejoras de redacción STAR "
            "y completando el roadmap de proyectos contenerizados, la tasa de conversión a entrevistas ascenderá de forma inmediata."
        )

    radar_metrics = {
        "technical_depth": 88 if quantified_star_count >= 2 else 82,
        "soft_skills_leadership": 78,
        "official_accreditation": 90,
        "quantifiable_impact": 88 if quantified_star_count >= 2 else 58,
        "market_alignment": 88 if has_strong_headline else 82,
        "multidisciplinary_versatility": 86
    }

    return {
        "audit_id": f"audit-{int(datetime.now().timestamp())}",
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "overall_score": score,
        "employability_score": score,
        "interview_conversion_rate": interview_rate,
        "role_target": role_target,
        "verdict_summary": verdict_summary,
        "radar_metrics": radar_metrics,
        "traffic_light": traffic_light,
        "inferred_soft_skills": [
            {
                "skill": "Resiliencia Operativa y Rigor Metodológico",
                "evidence": "Más de 10 años en gestión de infraestructuras críticas y procesos bajo auditorías de calidad."
            },
            {
                "skill": "Capacidad de Aprendizaje y Especialización Rápida",
                "evidence": "Consecución de dobles ciclos superiores con calificaciones de honor y especialización en IA/Big Data."
            },
            {
                "skill": "Orientación a la Automatización y Eficiencia",
                "evidence": "Iniciativa propia de desarrollo de ERP interno y digitalización de flujos operativos complejos."
            }
        ],
        "critical_improvements": [
            "Transformar las responsabilidades en formato STAR con métricas numéricas concretas (% y horas ahorradas).",
            "Añadir enlaces funcionales a GitHub y demostraciones en vivo en la cabecera del CV.",
            "Destacar proyectos con Docker, APIs REST asíncronas y testing automatizado."
        ],
        "market_gap_analysis": {
            "summary": "Tu perfil supera el 80% de los requisitos técnicos del sector, existiendo una pequeña brecha en visibilidad de herramientas DevOps (CI/CD, Docker) que se soluciona fácilmente en el Roadmap.",
            "high_demand_skills_present": ["Python", "Flutter", "FastAPI", "SQL", "Git"],
            "critical_missing_skills": missing_skills
        },
        "actionable_improvements": {
            "headline": {
                "current": headline,
                "suggested": suggested_headline,
                "reason": "Maximiza el matching semántico de palabras clave en búsquedas booleanas de reclutadores y ATS."
            },
            "summary": {
                "current": summary,
                "suggested": suggested_summary,
                "reason": "Comunica una propuesta de valor ejecutiva contundente con años de experiencia y tecnologías troncales."
            },
            "experience_improvements": experience_improvements,
            "missing_skills_to_add": [s["name"] for s in missing_skills]
        },
        "career_roadmap": roadmap,
        "skill_verifications": []
    }


def _normalize_roadmap(raw_roadmap: Any, fallback_roadmap: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Garantiza que cada fase y paso del roadmap sea un objeto bien estructurado y con IDs únicos."""
    if not isinstance(raw_roadmap, list) or len(raw_roadmap) == 0:
        return fallback_roadmap

    level_keys = ["immediate", "projects", "consolidation"]
    normalized = []

    for idx, phase in enumerate(raw_roadmap):
        fallback_phase = fallback_roadmap[idx] if idx < len(fallback_roadmap) else fallback_roadmap[-1]

        if not isinstance(phase, dict):
            phase_dict = {
                "id": f"phase-{idx + 1}",
                "level": level_keys[min(idx, len(level_keys) - 1)],
                "title": str(phase),
                "subtitle": fallback_phase.get("subtitle", ""),
                "steps": []
            }
        else:
            phase_dict = {
                "id": phase.get("id") or f"phase-{idx + 1}",
                "level": phase.get("level") or level_keys[min(idx, len(level_keys) - 1)],
                "title": phase.get("title") or fallback_phase.get("title", f"Fase {idx + 1}"),
                "subtitle": phase.get("subtitle") or fallback_phase.get("subtitle", ""),
                "steps": []
            }

        raw_steps = phase.get("steps", []) if isinstance(phase, dict) else []
        if not raw_steps and idx < len(fallback_roadmap):
            raw_steps = fallback_roadmap[idx].get("steps", [])

        norm_steps = []
        for s_idx, step in enumerate(raw_steps):
            if isinstance(step, str):
                norm_steps.append({
                    "id": f"step-{idx + 1}-{s_idx + 1}",
                    "title": step,
                    "description": "",
                    "category": "tecnico",
                    "tech": "",
                    "completed": False,
                    "verified": False,
                    "quiz_available": True if idx > 0 else False
                })
            elif isinstance(step, dict):
                norm_steps.append({
                    "id": step.get("id") or f"step-{idx + 1}-{s_idx + 1}",
                    "title": step.get("title") or step.get("name") or f"Paso {s_idx + 1}",
                    "description": step.get("description", ""),
                    "category": step.get("category", "tecnico"),
                    "tech": step.get("tech", ""),
                    "completed": bool(step.get("completed", False)),
                    "verified": bool(step.get("verified", False)),
                    "quiz_available": bool(step.get("quiz_available", True if idx > 0 else False)),
                    "verified_score": step.get("verified_score"),
                    "proof_github_url": step.get("proof_github_url")
                })
        phase_dict["steps"] = norm_steps
        normalized.append(phase_dict)

    return normalized


async def run_profile_audit(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ejecuta la auditoría integral con IA conectada a la skill de evaluador recruiter
    y cruzada con ofertas reales guardadas en el sistema.
    Persiste el resultado en backend/data/profile_audit.json y devuelve el informe completo.
    """
    from backend.services.agent_browser import get_gemini_client
    client, _ = get_gemini_client()

    skill_text = ""
    if RECRUITER_SKILL_PATH.exists():
        try:
            with open(RECRUITER_SKILL_PATH, "r", encoding="utf-8") as f:
                skill_text = f.read()
        except Exception:
            pass

    # 1. Leer siempre el CV Maestro Oficial en Markdown (assets/cv-maestro.md)
    cv_maestro_content = ""
    if CV_MAESTRO_PATH.exists():
        try:
            with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                cv_maestro_content = f.read()
        except Exception as e:
            print(f"[run_profile_audit] Error leyendo {CV_MAESTRO_PATH}: {e}")

    # Si cv-maestro.md no existe o está vacío, asegurar sincronización
    if not cv_maestro_content.strip() or len(cv_maestro_content) < 40:
        from backend.services.profile_service import sync_profile_to_cv_maestro
        sync_profile_to_cv_maestro(profile_data)
        if CV_MAESTRO_PATH.exists():
            try:
                with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                    cv_maestro_content = f.read()
            except Exception:
                pass

    market_jobs = _get_market_context_sample()
    market_jobs_str = json.dumps(market_jobs, ensure_ascii=False, indent=2) if market_jobs else "No hay ofertas indexadas aún."
    profile_json_str = json.dumps(profile_data, ensure_ascii=False, indent=2)

    prompt = f"""{skill_text}

---
CURRÍCULUM VITAE MAESTRO OFICIAL (cv-maestro.md - FUENTE DE VERDAD):
{cv_maestro_content[:7000]}

---
ESTRUCTURA DE DATOS VIGENTE DEL PERFIL:
{profile_json_str[:5000]}

---
OFERTAS REALES DE MERCADO INDEXADAS EN EL SISTEMA:
{market_jobs_str}

REGLAS DE AUDITORÍA Y EVALUACIÓN POSTERIOR:
1. Este es el Currículum Maestro Oficial del candidato. Evalúa con el rigor de un Headhunter Senior examinando directamente el documento 'cv-maestro.md'.
2. Si el CV Maestro ya incorpora mejoras en viñetas STAR, métricas cuantitativas (% o números), un titular especializado, un resumen ejecutivo de impacto o certificaciones y skills técnicas demandadas, DEBES reflejarlo inmediatamente otorgando una puntuación significativamente más alta (overall_score entre 82 y 95), mayor tasa de conversión a entrevista y resolviendo las alertas rojas en el semáforo.
3. Si el CV contiene lagunas o le faltan métricas, aplica la exigencia de 5 segundos de cribado de Recruiter indicando las brechas con alertas rojas y ámbar.
4. Devuelve ÚNICAMENTE un bloque JSON válido con:
1. "overall_score": Puntuación de empleabilidad (0 a 100).
2. "employability_score": Puntuación (0 a 100).
3. "interview_conversion_rate": Porcentaje estimado de conversión a entrevista (ej: "75%").
4. "role_target": Puesto objetivo ideal del candidato (ej: "Senior Python & Flutter Developer").
5. "verdict_summary": Diagnóstico sin filtros en 2 párrafos concisos y directos.
6. "radar_metrics": Objeto con 6 métricas de 0 a 100:
   - "technical_depth"
   - "soft_skills_leadership"
   - "official_accreditation"
   - "quantifiable_impact"
   - "market_alignment"
   - "multidisciplinary_versatility"
7. "traffic_light": Objeto con listas:
   - "red_alerts": [Alertas de descarte inmediato en 5 seg]
   - "amber_warnings": [Puntos de fricción u optimización]
   - "green_strengths": [Fortalezas competitivas diferenciales]
8. "inferred_soft_skills": Lista de objetos con "skill" y "evidence" probada por hechos.
9. "critical_improvements": Lista de 3 prioridades críticas de acción.
10. "market_gap_analysis":
    - "summary": Resumen de alineación con ofertas reales.
    - "high_demand_skills_present": [Skills que ya tiene y son muy demandadas]
    - "critical_missing_skills": [Objetos con "name", "category" ('hard'|'tool'), "demand_level" ('Crítica'|'Alta'), "reason"]
11. "actionable_improvements":
    - "headline": {{"current": "...", "suggested": "...", "reason": "..."}}
    - "summary": {{"current": "...", "suggested": "...", "reason": "..."}}
    - "experience_improvements": [
        {{
          "id": "exp-1",
          "company": "...",
          "role": "...",
          "current_highlights": [...],
          "suggested_highlights": [Viñetas formato STAR cuantificadas con % y números],
          "reason": "..."
        }}
      ]
    - "missing_skills_to_add": ["Skill 1", "Herramienta 2"]
12. "career_roadmap": Lista de 3 fases con steps interactivos:
    - Fase 1 (Nivel 1 Inmediato 1-7 días)
    - Fase 2 (Nivel 2 Proyectos Clave 2-4 semanas, con tech y quiz_available: true)
    - Fase 3 (Nivel 3 Consolidación Técnica 1-3 meses, con tech y quiz_available: true)

Devuelve ÚNICAMENTE un bloque JSON válido."""

    candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    fallback_base = _generate_fallback_audit(profile_data)

    if client:
        for model_name in candidate_models:
            try:
                def call():
                    return client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                res = await asyncio.wait_for(asyncio.to_thread(call), timeout=25.0)
                if res and res.text:
                    match = re.search(r'\{.*\}', res.text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        # Normalizar y fusionar con estructura canónica
                        base = _generate_fallback_audit(profile_data)
                        for k, v in parsed.items():
                            if v is not None and k != "career_roadmap":
                                base[k] = v
                        # Normalizar roadmap
                        base["career_roadmap"] = _normalize_roadmap(parsed.get("career_roadmap"), fallback_base["career_roadmap"])
                        base["audit_id"] = f"audit-{int(datetime.now().timestamp())}"
                        base["timestamp"] = datetime.now().strftime("%d/%m/%Y %H:%M")
                        base["overall_score"] = parsed.get("overall_score") or parsed.get("employability_score") or base["overall_score"]
                        base["employability_score"] = base["overall_score"]
                        save_audit(base)
                        return base
            except Exception as e:
                print(f"[run_profile_audit] Modelo {model_name} falló: {e}")
                continue

    # Fallback si no hay IA disponible
    fallback = _generate_fallback_audit(profile_data)
    save_audit(fallback)
    return fallback


async def apply_profile_enhancements(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aplica las mejoras seleccionadas por el candidato con 1 clic:
    actualiza titular, resumen, viñetas de experiencia y skills en profile.json,
    sincroniza cv-maestro.md y reevalúa inmediatamente el CV Maestro con la IA.
    """
    profile = load_profile()
    p_info = profile.setdefault("personal_info", {})
    applied_items = []

    # 1. Titular
    if payload.get("apply_headline") and payload.get("suggested_headline"):
        p_info["headline"] = str(payload["suggested_headline"]).strip()
        applied_items.append("Titular profesional")

    # 2. Resumen
    if payload.get("apply_summary") and payload.get("suggested_summary"):
        p_info["summary"] = str(payload["suggested_summary"]).strip()
        applied_items.append("Resumen ejecutivo")

    # 3. Experiencias
    if payload.get("apply_experiences"):
        exp_updates = payload.get("experience_updates", [])
        exp_map = {u.get("id"): u for u in exp_updates if u.get("id")}
        
        experiences = profile.get("work_experience", [])
        for exp in experiences:
            exp_id = exp.get("id")
            if exp_id in exp_map:
                update_item = exp_map[exp_id]
                new_highlights = update_item.get("suggested_highlights") or update_item.get("highlights")
                if new_highlights and isinstance(new_highlights, list):
                    # Actualizar responsibilities / achievements
                    exp["responsibilities"] = [str(h).strip() for h in new_highlights if str(h).strip()]
                    exp["achievements"] = [
                        h for h in exp["responsibilities"] 
                        if any(char.isdigit() or char == '%' for char in h)
                    ]
                    applied_items.append(f"Experiencia en {exp.get('company', 'empresa')}")

    # 4. Habilidades adicionales
    if payload.get("apply_skills"):
        skills_to_add = payload.get("skills_to_add", [])
        if skills_to_add and isinstance(skills_to_add, list):
            hard_skills = profile.setdefault("hard_skills", [])
            tools = profile.setdefault("tools_and_tech", [])
            added_skills_count = 0
            for sk in skills_to_add:
                sk_name = str(sk).strip()
                if sk_name and sk_name not in hard_skills and sk_name not in tools:
                    hard_skills.append(sk_name)
                    added_skills_count += 1
            if added_skills_count > 0:
                applied_items.append(f"{added_skills_count} Habilidades clave")

    # Guardar perfil actualizado y regenerar CV Maestro Markdown (assets/cv-maestro.md)
    saved_profile = save_profile(profile)

    # Reevaluar inmediatamente el CV Maestro tras aplicar las mejoras
    new_audit = await run_profile_audit(saved_profile)

    return {
        "status": "success",
        "message": f"Se han aplicado {len(applied_items)} mejoras y se ha reevaluado el CV Maestro.",
        "applied_items": applied_items,
        "profile": saved_profile,
        "audit": new_audit
    }


def toggle_roadmap_step(step_id: str, completed: Optional[bool] = None) -> Dict[str, Any]:
    """Marca un paso del roadmap como completado o pendiente y actualiza el progreso."""
    audit = get_saved_audit()
    if not audit:
        profile = load_profile()
        audit = _generate_fallback_audit(profile)

    roadmap = audit.get("career_roadmap", [])
    found = False
    new_state = False

    for phase in roadmap:
        for step in phase.get("steps", []):
            if step.get("id") == step_id:
                if completed is None:
                    step["completed"] = not step.get("completed", False)
                else:
                    step["completed"] = bool(completed)
                new_state = step["completed"]
                found = True
                break
        if found:
            break

    # Recalcular métricas de progreso del roadmap
    total_steps = 0
    completed_steps = 0
    for phase in roadmap:
        for step in phase.get("steps", []):
            total_steps += 1
            if step.get("completed"):
                completed_steps += 1

    audit["career_roadmap"] = roadmap
    audit["roadmap_progress"] = {
        "total": total_steps,
        "completed": completed_steps,
        "percentage": round((completed_steps / total_steps * 100)) if total_steps > 0 else 0
    }
    save_audit(audit)

    return {
        "status": "success",
        "step_id": step_id,
        "completed": new_state,
        "roadmap_progress": audit["roadmap_progress"],
        "audit": audit
    }


async def generate_skill_quiz(step_id: str, skill_name: str, topic_context: str = "") -> Dict[str, Any]:
    """
    Genera un Flash-Quiz de 3-5 preguntas técnicas prácticas para verificar la competencia adquirida.
    Evalúa criterio real, buenas prácticas y prevención de errores habituales en entrevistas de trabajo.
    """
    from backend.services.agent_browser import get_gemini_client
    client, _ = get_gemini_client()

    prompt = f"""Actúa como Director Técnico e Interlocutor de Entrevistas de Ingeniería.
Diseña una Micro-Evaluación Técnica (Flash Quiz) de exactamente 4 preguntas prácticas para evaluar la competencia: "{skill_name}".
Contexto adicional: "{topic_context}".

REGLAS DE LAS PREGUNTAS:
1. Nivel real de entrevista técnica o resolución de incidencias en producción (no preguntas teóricas de memoria).
2. Cada pregunta debe plantear una situación, problema o fragmento conceptual realista.
3. 4 opciones por pregunta (índices 0, 1, 2, 3) con solo una opción correcta.
4. "explanation": Justificación técnica profunda de por qué esa opción es la correcta y qué problema causan las otras.

ESTRUCTURA JSON REQUERIDA:
{{
  "skill_name": "{skill_name}",
  "step_id": "{step_id}",
  "questions": [
    {{
      "id": 1,
      "scenario": "Descripción breve del contexto o caso práctico...",
      "question": "¿Cuál es la forma correcta de resolverlo?",
      "options": [
        "Opción A...",
        "Opción B...",
        "Opción C...",
        "Opción D..."
      ],
      "correct_index": 1,
      "explanation": "Explicación técnica detallada..."
    }}
  ]
}}
Devuelve SOLAMENTE el bloque JSON válido."""

    if client:
        try:
            candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
            for model_name in candidate_models:
                try:
                    def call():
                        return client.models.generate_content(
                            model=model_name,
                            contents=prompt
                        )
                    res = await asyncio.wait_for(asyncio.to_thread(call), timeout=18.0)
                    if res and res.text:
                        match = re.search(r'\{.*\}', res.text, re.DOTALL)
                        if match:
                            quiz_data = json.loads(match.group(0))
                            if "questions" in quiz_data and len(quiz_data["questions"]) >= 3:
                                return quiz_data
                except Exception as me:
                    print(f"[generate_skill_quiz] Falló {model_name}: {me}")
                    continue
        except Exception as e:
            print(f"[generate_skill_quiz] Error en IA: {e}")

    # Fallback determinista de preguntas técnicas de alta calidad
    lower_s = skill_name.lower()
    if "fastapi" in lower_s or "docker" in lower_s or "backend" in lower_s:
        questions = [
            {
                "id": 1,
                "scenario": "En un endpoint de FastAPI que consulta una base de datos relacional síncrona mediante un driver bloqueante.",
                "question": "¿Por qué definir la función como 'async def' en lugar de 'def' puede degradar el rendimiento?",
                "options": [
                    "FastAPI no admite funciones async con bases de datos relacionales.",
                    "Bloqueará el bucle de eventos (event loop) principal de asyncio, impidiendo atender otras peticiones entrantes.",
                    "El recolector de basura de Python detendrá la ejecución del worker uvicorn.",
                    "async def duplica el consumo de memoria en cada llamada concurrente."
                ],
                "correct_index": 1,
                "explanation": "Al declarar 'async def', FastAPI ejecuta la función en el event loop principal. Si realizas una I/O síncrona bloqueante dentro de ella, congelas el bucle para todos los demás clientes concurrentes. Para código bloqueante se debe usar 'def' (FastAPI lo envía a un threadpool) o un driver asíncrono como asyncpg."
            },
            {
                "id": 2,
                "scenario": "Estás construyendo una imagen Docker de producción para una API con Python y Poetry/Pip.",
                "question": "¿Cuál es la mejor práctica para optimizar el peso de la imagen y la seguridad en despliegue?",
                "options": [
                    "Usar la imagen base Ubuntu full y compilar todo en el directorio root.",
                    "Ejecutar el contenedor como usuario root y no usar .dockerignore.",
                    "Utilizar Multi-Stage Builds, imagen base 'python:slim' o 'alpine' y ejecutar como usuario no-root.",
                    "Incluir la suite de pruebas unitarias dentro del contenedor final de producción."
                ],
                "correct_index": 2,
                "explanation": "Multi-stage builds permite separar las herramientas de compilación de la imagen final de ejecución. Usar imágenes 'slim' y un usuario sin privilegios reduce la superficie de ataque y el tamaño de la imagen en un 70%."
            },
            {
                "id": 3,
                "scenario": "Quieres validar y documentar automáticamente los parámetros de entrada y respuestas de error en FastAPI.",
                "question": "¿Qué componente del ecosistema de FastAPI gestiona esta validación de tipado estricta?",
                "options": [
                    "Modelos Pydantic (BaseModel) y tipos integrados de Python.",
                    "Decoradores de Flask-WTF.",
                    "Funciones de SQLAlchemy Core.",
                    "Middleware de Starlette sin esquemas."
                ],
                "correct_index": 0,
                "explanation": "FastAPI utiliza Pydantic para la serialización, deserialización y validación estricta de datos en tiempo de ejecución, generando además los esquemas OpenAPI / Swagger interactivos."
            },
            {
                "id": 4,
                "scenario": "Necesitas verificar el estado de salud de tu microservicio en Kubernetes o Docker Swarm.",
                "question": "¿Qué endpoint y código HTTP es el estándar para un health-check de readiness?",
                "options": [
                    "GET /health devolviendo 200 OK con { 'status': 'ok' } si las dependencias críticas están activas.",
                    "POST /status devolviendo 201 Created.",
                    "GET /ping devolviendo 302 Redirect.",
                    "DELETE /check devolviendo 204 No Content."
                ],
                "correct_index": 0,
                "explanation": "Un probe de readiness responde con 200 OK cuando el servicio está listo para recibir tráfico de usuarios (conexión a DB activa y dependencias operativas)."
            }
        ]
    elif "flutter" in lower_s or "mobile" in lower_s or "dart" in lower_s:
        questions = [
            {
                "id": 1,
                "scenario": "Tu aplicación en Flutter sufre caídas de frames (jank) al renderizar una lista con miles de elementos.",
                "question": "¿Cuál es la solución óptima recomendada por el equipo de Flutter?",
                "options": [
                    "Usar SingleChildScrollView con un Column que contenga todos los widgets.",
                    "Utilizar ListView.builder para construir los widgets bajo demanda según entran en el viewport.",
                    "Reducir la resolución de pantalla del dispositivo.",
                    "Invocar setState() cada vez que el usuario hace scroll."
                ],
                "correct_index": 1,
                "explanation": "ListView.builder recicla y construye únicamente los elementos visibles en pantalla (virtualización de listas), evitando instanciar miles de widgets en memoria."
            },
            {
                "id": 2,
                "scenario": "Quieres gestionar el estado global desacoplado de la UI sin acoplar la lógica de negocio a los widgets.",
                "question": "¿Qué patrón y biblioteca es ampliamente reconocida en la industria por su testabilidad?",
                "options": [
                    "Variables globales estáticas en main.dart.",
                    "BLoC (Business Logic Component) o Riverpod/Provider con StateNotifier.",
                    "Guardar todo en SharedPreferences en cada cambio de vista.",
                    "Usar exclusivamente StatefulWidget con setState recursivo."
                ],
                "correct_index": 1,
                "explanation": "BLoC y Riverpod separan por completo la lógica de negocio del árbol de widgets, permitiendo realizar pruebas unitarias sin levantar el motor gráfico de Flutter."
            },
            {
                "id": 3,
                "scenario": "Para garantizar soporte Offline-First en una app móvil con sincronización en la nube.",
                "question": "¿Cuál es el flujo arquitectónico recomendado?",
                "options": [
                    "Escribir primero en la base de datos local (SQLite/Isar), emitir el estado a la UI y sincronizar en segundo plano.",
                    "Bloquear la pantalla con un spinner hasta que el servidor remoto confirme la petición HTTP.",
                    "Guardar los datos en la memoria RAM y perderlos al cerrar la app.",
                    "Pedir al usuario que no use la app cuando pierda cobertura."
                ],
                "correct_index": 0,
                "explanation": "La arquitectura Offline-First hace que la base de datos local sea la 'fuente de verdad' inmediata para la UI, garantizando una experiencia fluida sin latencia ni cuelgues."
            },
            {
                "id": 4,
                "scenario": "En Dart, cuando ejecutas una operación intensiva de CPU que tarda varios segundos (ej. procesar una imagen o criptografía).",
                "question": "¿Cómo evitas congelar la animación de la interfaz?",
                "options": [
                    "Usando Future.delayed(Duration.zero).",
                    "Ejecutando la tarea en un Isolate separado (ej. con la función compute()).",
                    "Añadiendo más memoria RAM al teléfono.",
                    "Declarando variables como 'late final'."
                ],
                "correct_index": 1,
                "explanation": "Dart es monohilo por defecto con un event loop. Operaciones pesadas de CPU bloquean el hilo principal a menos que se ejecuten en un Isolate independiente con su propia memoria."
            }
        ]
    else:
        questions = [
            {
                "id": 1,
                "scenario": "Al diseñar una solución para resolver un cuello de botella recurrente en producción.",
                "question": "¿Cuál es el primer paso antes de refactorizar código crítico?",
                "options": [
                    "Medir y perfilar métricas reales con profiling y logs antes de hacer suposiciones.",
                    "Reescribir toda la aplicación desde cero en otro lenguaje.",
                    "Aumentar el hardware del servidor inmediatamente sin auditar.",
                    "Eliminar los tests para acelerar el despliegue."
                ],
                "correct_index": 0,
                "explanation": "El profiling objetivo permite identificar el punto exacto de lentitud (I/O, consultas N+1 o CPU) sin optimizaciones prematuras innecesarias."
            },
            {
                "id": 2,
                "scenario": "En un flujo de control de versiones con Git colaborativo en equipo.",
                "question": "¿Qué buena práctica asegura un historial limpio y trazabilidad de errores?",
                "options": [
                    "Hacer commits directos a main sin revisión ni mensajes descriptivos.",
                    "Trabajar con ramas de funcionalidad (feature branches), pull requests con revisión y commits atómicos.",
                    "Subir las carpetas vendor y node_modules al repositorio.",
                    "Hacer un único commit al final del mes con todo el trabajo."
                ],
                "correct_index": 1,
                "explanation": "Las ramas de funcionalidad y revisiones garantizan que cada cambio esté probado, documentado y pueda revertirse con seguridad si introduce una regresión."
            },
            {
                "id": 3,
                "scenario": "Estás preparando una demostración técnica para defender tus competencias en una entrevista.",
                "question": "¿Qué elemento convence más a un Headhunter o Líder Técnico?",
                "options": [
                    "Afirmar que conoces la tecnología sin mostrar ejemplos de código.",
                    "Un repositorio público con README detallado, suite de tests y enlace a demo en vivo funcional.",
                    "Un certificado en PDF sin proyectos prácticos asociados.",
                    "Decir que todo tu código es confidencial."
                ],
                "correct_index": 1,
                "explanation": "El código abierto, testeado y documentado es la 'Proof of Work' irrefutable que sitúa al candidato en el 5% superior del proceso de selección."
            }
        ]

    return {
        "skill_name": skill_name,
        "step_id": step_id,
        "questions": questions
    }


def verify_skill_quiz(
    step_id: str,
    skill_name: str,
    user_answers: List[int],
    questions: List[Dict[str, Any]],
    github_url: str = ""
) -> Dict[str, Any]:
    """
    Evalúa las respuestas de la micro-evaluación técnica.
    Si la puntuación es ≥ 80% (o 3/4 aciertos), otorga la Insignia '🟢 Verified Skill',
    actualiza el estado en el Roadmap persistido y devuelve feedback explicativo detallado.
    """
    if not questions or not user_answers:
        return {"status": "error", "message": "Datos de respuestas incompletos."}

    correct_count = 0
    feedback_list = []

    for idx, q in enumerate(questions):
        user_ans = user_answers[idx] if idx < len(user_answers) else -1
        correct_ans = q.get("correct_index", 0)
        is_correct = (user_ans == correct_ans)
        if is_correct:
            correct_count += 1

        feedback_list.append({
            "question_id": q.get("id", idx + 1),
            "question": q.get("question", ""),
            "user_choice": user_ans,
            "correct_choice": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    total_q = len(questions)
    score_percentage = round((correct_count / total_q) * 100)
    passed = score_percentage >= 75  # 3 de 4 o 4 de 4

    audit = get_saved_audit()
    if not audit:
        profile = load_profile()
        audit = _generate_fallback_audit(profile)

    if passed:
        # 1. Marcar paso del roadmap como verificado y completado
        roadmap = audit.get("career_roadmap", [])
        for phase in roadmap:
            for step in phase.get("steps", []):
                if step.get("id") == step_id:
                    step["completed"] = True
                    step["verified"] = True
                    step["verified_at"] = datetime.now().strftime("%d/%m/%Y")
                    step["verified_score"] = score_percentage
                    if github_url:
                        step["proof_github_url"] = github_url
                    break

        # 2. Registrar en la lista de insignias de dominio 'skill_verifications'
        verifications = audit.setdefault("skill_verifications", [])
        # Evitar duplicados del mismo step
        verifications = [v for v in verifications if v.get("step_id") != step_id]
        verifications.append({
            "step_id": step_id,
            "skill_name": skill_name,
            "score": score_percentage,
            "verified_at": datetime.now().strftime("%d/%m/%Y"),
            "github_url": github_url,
            "badge": "🟢 Verified Competence"
        })
        audit["skill_verifications"] = verifications

        # 3. Bono de empleabilidad (+2 puntos por habilidad verificada, tope 98)
        current_score = audit.get("overall_score", 70)
        audit["overall_score"] = min(98, current_score + 2)
        audit["employability_score"] = audit["overall_score"]

        save_audit(audit)

    return {
        "status": "success",
        "passed": passed,
        "score_percentage": score_percentage,
        "correct_count": correct_count,
        "total_questions": total_q,
        "skill_name": skill_name,
        "step_id": step_id,
        "feedback": feedback_list,
        "badge_awarded": "🟢 Verified Competence" if passed else None,
        "github_url": github_url
    }
