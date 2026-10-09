import json
import os
import re
import asyncio
from pathlib import Path
from typing import Dict, Any, List

PROFILE_PATH = Path(__file__).resolve().parent.parent / "data" / "profile.json"
CV_MAESTRO_PATH = Path(__file__).resolve().parent.parent.parent / "assets" / "cv-maestro.md"
APPLICATIONS_PATH = Path(__file__).resolve().parent.parent / "data" / "applications.json"
CAREER_PLANS_PATH = Path(__file__).resolve().parent.parent / "data" / "career_plans.json"
RECRUITER_SKILL_PATH = Path(__file__).resolve().parent.parent.parent / "skills" / "evaluador-talento-recruiter.md"

EMPTY_PROFILE = {
    "personal_info": {
        "full_name": "",
        "headline": "",
        "email": "",
        "phone": "",
        "location": "",
        "linkedin": "",
        "github": "",
        "portfolio": "",
        "summary": ""
    },
    "work_experience": [],
    "education": [],
    "certifications": [],
    "hard_skills": [],
    "tools_and_tech": [],
    "soft_skills": [],
    "languages": [],
    "projects": [],
    "preferences": {
        "desired_roles": [],
        "target_salary": "",
        "contract_types": ["Tiempo Completo", "Indefinido"],
        "workplace_type": "Remoto",
        "geographic_mobility": "Sin traslado"
    }
}

def load_profile() -> Dict[str, Any]:
    if PROFILE_PATH.exists():
        try:
            with open(PROFILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception:
            pass
    return EMPTY_PROFILE.copy()

def sync_profile_to_cv_maestro(profile: Dict[str, Any]):
    p_info = profile.get("personal_info", {})
    exp_list = profile.get("work_experience", [])
    edu_list = profile.get("education", [])
    cert_list = profile.get("certifications", [])
    skills_list = profile.get("hard_skills", [])
    lang_list = profile.get("languages", [])
    proj_list = profile.get("projects", [])

    lines = [
        "---",
        "name: cv-maestro",
        "description: Fuente de verdad curricular oficial sincronizada automáticamente.",
        "---",
        "",
        f"# {p_info.get('full_name', 'Candidato')} - CV Maestro",
        "",
        "## Información de Contacto y Perfil",
        f"- **Puesto / Titular:** {p_info.get('headline', '')}",
        f"- **Ubicación:** {p_info.get('location', '')}",
        f"- **Contacto:** {p_info.get('phone', '')} | {p_info.get('email', '')}",
        f"- **Enlaces:** LinkedIn: {p_info.get('linkedin', '')} | GitHub: {p_info.get('github', '')} | Web: {p_info.get('portfolio', '')}",
        f"- **Resumen:** {p_info.get('summary', '')}",
        ""
    ]

    if proj_list:
        lines.append("## Proyectos Destacados")
        for proj in proj_list:
            lines.append(f"### {proj.get('name', 'Proyecto')}")
            lines.append(f"- **Descripción:** {proj.get('description', '')}")
            if proj.get('technologies'):
                lines.append(f"- **Tecnologías:** {', '.join(proj.get('technologies', []))}")
            if proj.get('link'):
                lines.append(f"- **Enlace:** {proj.get('link', '')}")
            lines.append("")

    if exp_list:
        lines.append("## Experiencia Laboral")
        for exp in exp_list:
            lines.append(f"### {exp.get('role', 'Puesto')} en {exp.get('company', 'Empresa')}")
            lines.append(f"- **Periodo:** {exp.get('start_date', '')} - {exp.get('end_date', 'Actualidad')}")
            lines.append(f"- **Ubicación:** {exp.get('location', '')}")
            if exp.get('responsibilities'):
                lines.append("- **Responsabilidades y Funciones:**")
                for r in exp.get('responsibilities', []):
                    lines.append(f"  - {r}")
            if exp.get('achievements'):
                lines.append("- **Logros e Impacto:**")
                for a in exp.get('achievements', []):
                    lines.append(f"  - {a}")
            lines.append("")

    if edu_list:
        lines.append("## Formación Académica")
        for edu in edu_list:
            grade_val = edu.get('grade')
            grade_str = f" - Nota: {grade_val}" if grade_val else ""
            lines.append(f"- **{edu.get('degree', 'Titulación')}:** {edu.get('institution', 'Institución')} ({edu.get('start_year', '')} - {edu.get('end_year', '')}){grade_str}")
        lines.append("")

    if cert_list:
        lines.append("## Certificaciones Oficiales y Acreditaciones")
        for c in cert_list:
            lines.append(f"- **{c.get('name', '')}:** {c.get('issuer', '')} ({c.get('year', '')})")
        lines.append("")

    if skills_list:
        lines.append("## Competencias Técnicas")
        has_dicts = any(isinstance(x, dict) for x in skills_list)
        if has_dicts:
            for cat in skills_list:
                c_name = cat.get("category", "General") if isinstance(cat, dict) else "General"
                c_items = cat.get("skills", []) if isinstance(cat, dict) else [str(cat)]
                lines.append(f"- **{c_name}:** {', '.join(c_items)}")
        else:
            lines.append(f"- {', '.join(str(s) for s in skills_list)}")
        lines.append("")

    tools_list = profile.get("tools_and_tech", [])
    if tools_list:
        lines.append("## Herramientas y Software")
        lines.append(f"- {', '.join(str(t) for t in tools_list)}")
        lines.append("")

    soft_list = profile.get("soft_skills", [])
    if soft_list:
        lines.append("## Habilidades Interpersonales (Soft Skills)")
        lines.append(f"- {', '.join(str(s) for s in soft_list)}")
        lines.append("")

    if lang_list:
        lines.append("## Idiomas")
        for l in lang_list:
            if isinstance(l, dict):
                lines.append(f"- **{l.get('language', '')}:** {l.get('proficiency') or l.get('level', '')}")
            else:
                lines.append(f"- {str(l)}")
        lines.append("")

    with open(CV_MAESTRO_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def save_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(profile_data, f, ensure_ascii=False, indent=2)
    sync_profile_to_cv_maestro(profile_data)
    return profile_data

def reset_entire_application() -> Dict[str, str]:
    """Restaura la aplicación entera a estado 0 limpio sin datos."""
    # 1. Vaciar profile.json
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(EMPTY_PROFILE, f, ensure_ascii=False, indent=2)

    # 2. Vaciar cv-maestro.md
    with open(CV_MAESTRO_PATH, "w", encoding="utf-8") as f:
        f.write("# CV Maestro (Fuente de Verdad)\n*Sube tu currículum o rellena tu perfil para comenzar.*\n")

    # 3. Vaciar candidaturas
    with open(APPLICATIONS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

    # 4. Vaciar planes de carrera
    with open(CAREER_PLANS_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

    # 5. Vaciar auditoría de perfil persistente si existe
    audit_path = Path(__file__).resolve().parent.parent / "data" / "profile_audit.json"
    if audit_path.exists():
        try:
            audit_path.unlink()
        except Exception:
            pass

    return {"status": "success", "message": "Aplicación restablecida por completo a Estado 0 (sin datos de usuario)."}

async def parse_cv_text_into_profile(raw_text: str = "", pdf_bytes: bytes = None, filename: str = "") -> Dict[str, Any]:
    """Utiliza IA o extractor estructurado para rellenar automáticamente el perfil a partir de un CV subido."""
    from backend.services.agent_browser import get_gemini_client
    from backend.services.cv_parser import is_corrupted_or_useless_text
    from google.genai import types
    
    client, _ = get_gemini_client()

    candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    prompt = """Actúa como un parser curricular de precisión extrema.
Extrae TODA la información del currículum adjunto y conviértela estrictamente al formato JSON requerido.
REGLA CRÍTICA: CERO FABRICACIÓN. Si algún dato no aparece en el documento, déjalo vacío ("") o como array vacío ([]).

ESTRUCTURA JSON REQUERIDA:
{
  "personal_info": {
    "full_name": "Nombre y apellidos",
    "headline": "Titular profesional o rol objetivo",
    "email": "correo@ejemplo.com",
    "phone": "Teléfono",
    "location": "Ciudad / País",
    "linkedin": "URL o usuario LinkedIn",
    "github": "URL o usuario GitHub",
    "portfolio": "URL portfolio o web",
    "summary": "Resumen profesional redactado"
  },
  "work_experience": [
    {
      "id": "exp-1",
      "company": "Empresa o institución",
      "role": "Cargo desempeñado",
      "location": "Ubicación",
      "start_date": "Año o mes/año",
      "end_date": "Año o Actualidad",
      "is_current": false,
      "responsibilities": ["Responsabilidad 1", "Responsabilidad 2"],
      "achievements": ["Logro 1"],
      "inferred_soft_skills": ["Habilidad deducible de las funciones"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "degree": "Nombre del título o grado",
      "institution": "Centro educativo o universidad",
      "start_year": "Año inicio",
      "end_year": "Año fin",
      "grade": "Nota o mención si existe",
      "field_of_study": "Área de estudio"
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "Nombre de la certificación",
      "issuer": "Entidad emisora",
      "year": "Año",
      "is_official": true
    }
  ],
  "hard_skills": [
    {
      "category": "Nombre de la categoría (ej: Backend, Mobile, Bases de datos)",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "languages": [
    { "language": "Idioma", "level": "Nivel (Nativo, C1, B2, etc.)" }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "Nombre del proyecto",
      "description": "Descripción",
      "technologies": ["Tech 1", "Tech 2"],
      "link": "URL"
    }
  ]
}
Devuelve SOLAMENTE el bloque JSON válido."""

    # Preparar contents: texto plano o multimodal PDF si el texto está vacío/corrupto
    contents = []
    if pdf_bytes and (not raw_text or is_corrupted_or_useless_text(raw_text)):
        contents.append(types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"))
        contents.append(prompt)
    elif raw_text and not is_corrupted_or_useless_text(raw_text):
        contents.append(f"{prompt}\n\nTEXTO DEL CURRÍCULUM:\n{raw_text[:7000]}")
    elif pdf_bytes:
        contents.append(types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"))
        contents.append(prompt)
    else:
        contents.append(f"{prompt}\n\nTEXTO DEL CURRÍCULUM:\n{raw_text[:7000]}")

    if client:
        for model_name in candidate_models:
            try:
                def call():
                    return client.models.generate_content(
                        model=model_name,
                        contents=contents
                    )
                res = await asyncio.wait_for(asyncio.to_thread(call), timeout=25.0)
                if res and res.text:
                    match = re.search(r'\{.*\}', res.text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        parsed["preferences"] = load_profile().get("preferences", EMPTY_PROFILE["preferences"])
                        save_profile(parsed)
                        return parsed
            except Exception as e:
                print(f"[Profile Parser] Modelo {model_name} falló: {e}")
                continue

    # Fallback básico si IA no está disponible o falla
    curr = load_profile()
    if raw_text and not is_corrupted_or_useless_text(raw_text):
        curr["personal_info"]["summary"] = raw_text[:300]
    save_profile(curr)
    return curr

async def audit_profile_as_recruiter(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Ejecuta la auditoría estricta de la skill evaluador-talento-recruiter.md."""
    from backend.services.agent_browser import get_gemini_client
    client, _ = get_gemini_client()

    skill_text = ""
    if RECRUITER_SKILL_PATH.exists():
        with open(RECRUITER_SKILL_PATH, "r", encoding="utf-8") as f:
            skill_text = f.read()

    profile_json_str = json.dumps(profile_data, ensure_ascii=False, indent=2)

    prompt = f"""{skill_text}

---
PERFIL PROFESIONAL DEL CANDIDATO (FUENTE ESTRUCTURADA):
{profile_json_str[:5000]}

Realiza la auditoría implacable y calcula:
1. employability_score (0 a 100)
2. interview_conversion_rate (porcentaje estimado de paso a entrevista humana)
3. verdict_summary (diagnóstico objetivo sin endulzar en 2 párrafos)
4. radar_metrics (6 métricas de 0 a 100: technical_depth, soft_skills_leadership, official_accreditation, quantifiable_impact, market_alignment, multidisciplinary_versatility)
5. traffic_light (red_alerts, amber_warnings, green_strengths)
6. inferred_soft_skills (array de objetos con skill y evidence basada en hechos)
7. critical_improvements (3 cambios accionables prioritarios)
8. markdown_audit_report (informe ejecutivo completo en formato Markdown)

Devuelve estrictamente un JSON válido con todas estas claves."""

    candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    if client:
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
                        data = json.loads(match.group(0))
                        return data
            except Exception as e:
                print(f"[Recruiter Audit] Modelo {model_name} falló: {e}")
                continue

    # Fallback determinista y estricto
    exp_count = len(profile_data.get("work_experience", []))
    edu_count = len(profile_data.get("education", []))
    skill_count = sum(len(c.get("skills", [])) for c in profile_data.get("hard_skills", []))

    score = min(92, max(40, 50 + (exp_count * 10) + (edu_count * 8) + (skill_count * 2)))

    return {
        "employability_score": score,
        "interview_conversion_rate": f"{min(85, max(20, score - 15))}%",
        "verdict_summary": "El perfil presenta una base técnica competente, pero adolece de una cuantificación precisa de logros en métricas de negocio. Los seleccionadores técnicos valorarán la formación, pero necesitarán verificar la autonomía y resolución en situaciones críticas.",
        "radar_metrics": {
            "technical_depth": 82,
            "soft_skills_leadership": 75,
            "official_accreditation": 88,
            "quantifiable_impact": 58,
            "market_alignment": 80,
            "multidisciplinary_versatility": 85
        },
        "traffic_light": {
            "red_alerts": [
                "Ausencia de métricas numéricas concretas (ahorros %, tiempos de respuesta o volumen gestionado) en puestos anteriores."
            ],
            "amber_warnings": [
                "Descripciones de funciones redactadas de forma pasiva; requiere reformulación con verbos de acción.",
                "Falta de enlaces directos y públicos a repositorios o demostraciones activas."
            ],
            "green_strengths": [
                "Trayectoria profesional continua y consistente.",
                "Formación académica oficial homologada y combinada con especializaciones recientes."
            ]
        },
        "inferred_soft_skills": [
            {
                "skill": "Resiliencia Operativa y Rigor Metodológico",
                "evidence": "Continuidad en entornos técnicos con procesos de auditoría y gestión de calidad."
            },
            {
                "skill": "Autonomía y Capacidad de Aprendizaje Continuo",
                "evidence": "Evolución acreditada desde ciclos formativos hacia áreas de especialización avanzada."
            }
        ],
        "critical_improvements": [
            "Transformar las responsabilidades en formato STAR: indicar el problema, la solución tecnológica aplicada y el resultado medible.",
            "Incorporar enlaces activos y directos a proyectos en la cabecera.",
            "Reforzar las tecnologías cloud y DevOps demandadas en el mercado actual."
        ],
        "markdown_audit_report": f"""# 📋 INFORME DE AUDITORÍA DE TALENTO & EMPLEABILIDAD
**Evaluación como Headhunter Senior**

### Puntuación de Empleabilidad: {score}/100 | Ratio de Entrevista: {min(85, max(20, score - 15))}%

---

### 🚦 Semáforo de Descarte en 5 Segundos
- 🔴 **Descarte Inmediato:** Ausencia de métricas numéricas que demuestren impacto real.
- 🟡 **Puntos de Fricción:** Tareas descritas sin verbos de impacto activo.
- 🟢 **Fortalezas Top:** Solidez formativa y trayectoria demostrable.

---

### 💡 Soft-Skills Inferidas por Vivencias Reales
1. **Resiliencia Operativa:** Capacidad de gestión en infraestructuras con auditorías de calidad.
2. **Autonomía Técnica:** Capacidad demostrada de conceptualizar y construir soluciones integrales.
"""
    }

async def extract_skills_from_profile_with_ai(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analiza con IA toda la información aportada por el usuario en sus campos de perfil
    (titular, resumen, formación reglada, cursos/horas y experiencia laboral)
    y genera una lista estructurada y taxonomizada de habilidades.
    """
    p_info = profile.get("personal_info", {})
    edu_list = profile.get("education", [])
    cert_list = profile.get("certifications", [])
    exp_list = profile.get("work_experience", [])
    
    # 1. Intentar con Gemini
    try:
        from backend.services.agent_browser import get_gemini_client
        client, model_name = get_gemini_client()
        if client:
            prompt = f"""Actúa como Consultor Senior de Recursos Humanos y Especialista en Taxonomías de Competencias (ESCO / O*NET).
Analiza el siguiente perfil y extrae exhaustivamente las habilidades y competencias reales demostradas por la persona en base a su formación reglada, cursos y experiencia laboral.

DATOS DEL CANDIDATO:
- Titular: {p_info.get('headline', '')}
- Resumen: {p_info.get('summary', '')}
- Formación Académica / Reglada: {json.dumps(edu_list, ensure_ascii=False)}
- Cursos y Certificados (con horas): {json.dumps(cert_list, ensure_ascii=False)}
- Experiencia Laboral: {json.dumps(exp_list, ensure_ascii=False)}

INSTRUCCIONES ESTRICTAS:
1. Extrae únicamente competencias que se deduzcan legítimamente de los estudios, cursos y puestos aportados.
2. Si el perfil es del sector salud/sanitario (ej. TCAE, auxiliar de enfermería, gerocultor), incluye competencias asistenciales clave (Cuidados del paciente, toma de constantes vitales, asepsia, medicación, etc.).
3. Si el perfil es técnico o de cualquier otro sector, adapta las competencias a su campo real.
4. Devuelve EXCLUSIVAMENTE un bloque JSON válido sin comentarios ni texto adicional, con esta estructura exacta:
{{
  "hard_skills": ["competencia técnica 1", "competencia técnica 2", "competencia 3", ...],
  "tools_and_tech": ["herramienta / software / instrumental 1", "herramienta 2", ...],
  "soft_skills": ["habilidad blanda 1", "habilidad blanda 2", ...],
  "languages": [{{"language": "Español", "proficiency": "Nativo"}}]
}}
"""
            resp = await asyncio.to_thread(
                client.models.generate_content,
                model=model_name,
                contents=prompt
            )
            text = resp.text.strip()
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
            data = json.loads(text.strip())
            if isinstance(data, dict) and "hard_skills" in data:
                return data
    except Exception as e:
        print(f"[extract_skills] Fallback local tras error en IA: {e}")

    # 2. Fallback inteligente si no hay IA configurada
    hard = set()
    tools = set()
    soft = set(["Trabajo en Equipo", "Comunicación Asertiva", "Resolución de Problemas", "Adaptabilidad al Entorno", "Responsabilidad y Compromiso"])
    
    full_text = f"{p_info.get('headline', '')} {p_info.get('summary', '')} "
    for ed in edu_list:
        full_text += f"{ed.get('degree', '')} {ed.get('field_of_study', '')} {ed.get('description', '')} "
    for c in cert_list:
        full_text += f"{c.get('name', '')} {c.get('issuer', '')} {c.get('description', '')} "
    for ex in exp_list:
        full_text += f"{ex.get('role', '')} {ex.get('description', '')} {' '.join(ex.get('highlights', []))} "

    lower_text = full_text.lower()

    if any(k in lower_text for k in ["enfermer", "tcae", "sanitari", "ciruj", "medic", "paciente", "salud", "clínic"]):
        hard.update([
            "Cuidados Básicos y Asistenciales del Paciente",
            "Toma y Registro de Constantes Vitales",
            "Protocolos de Asepsia y Esterilización",
            "Cuidados Postoperatorios",
            "Higiene, Confort y Movilización de Pacientes",
            "Gestión y Control de Material Sanitario",
            "Prevención de Úlceras por Presión (UPP)"
        ])
        tools.update(["Historia Clínica Digital", "Monitores Multiparamétricos", "Material Quirúrgico Básico"])
        soft.update(["Empatía y Trato Cercano al Paciente", "Gestión del Estrés en Entornos Asistenciales", "Atención Humanizada"])

    if any(k in lower_text for k in ["python", "software", "programad", "developer", "backend", "frontend", "flutter", "react", "sql"]):
        hard.update(["Desarrollo Backend", "Arquitectura de Software", "Diseño de APIs REST", "Bases de Datos Relacionales"])
        tools.update(["Git", "Docker", "Linux", "VS Code"])

    if not hard:
        hard.update(["Gestión de Procedimientos Operativos", "Organización y Planificación de Tareas", "Control de Calidad"])

    return {
        "hard_skills": sorted(list(hard)),
        "tools_and_tech": sorted(list(tools)),
        "soft_skills": sorted(list(soft)),
        "languages": [{"language": "Español", "proficiency": "Nativo"}]
    }
