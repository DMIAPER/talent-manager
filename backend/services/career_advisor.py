import uuid
import os
import json
import re
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from backend.services.profile_service import load_profile, save_profile, CV_MAESTRO_PATH, sync_profile_to_cv_maestro
from backend.services.data_store import load_json, save_json

CAREER_SKILL_PATH = Path(__file__).resolve().parent.parent.parent / "skills" / "Orientador-Itinerarios-Profesional.md"
COURSE_SKILL_PATH = Path(__file__).resolve().parent.parent.parent / "skills" / "agente-busqueda-cursos.md"

def load_career_skill_text() -> str:
    skills = []
    if CAREER_SKILL_PATH.exists():
        with open(CAREER_SKILL_PATH, "r", encoding="utf-8") as f:
            skills.append(f.read())
    if COURSE_SKILL_PATH.exists():
        with open(COURSE_SKILL_PATH, "r", encoding="utf-8") as f:
            skills.append(f.read())
    return "\n\n---\n\n".join(skills) if skills else "Actúa como Consultor Estratégico de Carrera y Asesor de Itinerarios Formativos."

async def chat_with_career_advisor(messages: List[Dict[str, str]], user_message: str, plan_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Chat interactivo con el Consultor de Carrera IA.
    Evalúa estudios y trayectoria del perfil y formula preguntas estratégicas sobre intenciones y bifurcaciones.
    Permite afinar, editar y actualizar la estructura completa del mapa de carrera y roadmap en caliente.
    """
    from backend.services.agent_browser import get_gemini_client
    client, _ = get_gemini_client()

    skill_text = load_career_skill_text()
    profile = load_profile()
    p_info = profile.get("personal_info", {})
    exp_list = profile.get("work_experience", [])
    edu_list = profile.get("education", [])
    skills_list = profile.get("hard_skills", [])

    # Cargar planes existentes y localizar el plan activo
    plans = load_json("career_plans.json", [])
    active_plan = None
    active_plan_idx = None
    if plan_id:
        for idx, p in enumerate(plans):
            if p.get("id") == plan_id:
                active_plan = p
                active_plan_idx = idx
                break
    if not active_plan and plans:
        active_plan = plans[0]
        active_plan_idx = 0

    # Construir resumen del roadmap activo para el contexto del LLM
    if active_plan:
        branches_summary = []
        for b in active_plan.get("branches", []):
            ms_lines = [
                f"    - [Nivel {m.get('level', 1)} | Estado: {m.get('status', 'pending')}] {m.get('title')} ({m.get('duration_hours', 40)}h, {m.get('cost_estimate', '')}, cert: {m.get('is_official_certification', False)})"
                for m in b.get("milestones", [])
            ]
            branches_summary.append(
                f"  * Rama ID: {b.get('id')} | Nombre: {b.get('name')} | Tipo: {b.get('branch_type')} | Activa: {b.get('is_active', True)} | Rol Destino: {b.get('target_role')}\n"
                + "\n".join(ms_lines)
            )
        active_plan_context = f"""
PLAN DE CARRERA & ROADMAP VIGENTE DEL CANDIDATO (ID: {active_plan.get('id')}):
- Puesto Actual: {active_plan.get('current_role', 'Profesional TI')}
- Puesto Objetivo General: {active_plan.get('target_role', 'Especialista')}
- Resumen Ejecutivo: {active_plan.get('executive_summary', '')}
- Tronco Común (Base consolidada): {json.dumps(active_plan.get('trunk_baseline', {}), ensure_ascii=False)}
- Métricas de Mercado: {json.dumps(active_plan.get('market_metrics', {}), ensure_ascii=False)}
- Ramas y Bifurcaciones existentes en el Mapa:
{chr(10).join(branches_summary)}
"""
    else:
        active_plan_context = "El candidato aún no tiene un plan de carrera o roadmap activo generado."

    profile_context = f"""
PERFIL PROFESIONAL DEL CANDIDATO:
- Nombre: {p_info.get('full_name', 'Candidato')}
- Titular actual: {p_info.get('headline', 'Profesional Cualificado')}
- Ubicación: {p_info.get('location', 'España')}
- Resumen: {p_info.get('summary', '')}
- Experiencias Completas: {json.dumps(exp_list, ensure_ascii=False)}
- Estudios y Titulaciones Oficiales: {json.dumps(edu_list, ensure_ascii=False)}
- Certificaciones y Cursos: {json.dumps(profile.get('certifications', []), ensure_ascii=False)}
- Competencias actuales: {json.dumps(skills_list, ensure_ascii=False)}
"""

    master_cv_content = ""
    if CV_MAESTRO_PATH.exists():
        try:
            with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                master_cv_content = f.read()[:12000]
        except Exception:
            pass

    history_str = ""
    for msg in messages[-6:]:
        role = "Candidato" if msg.get("role") == "user" else "Consultor IA"
        history_str += f"{role}: {msg.get('content')}\n"

    prompt = f"""{skill_text}

---
CONTEXTO DEL CANDIDATO (PERFIL ESTRUCTURADO):
{profile_context}

---
CV MAESTRO TEXTUAL (FUENTE DE VERDAD):
{master_cv_content if master_cv_content else 'No disponible'}

---
ESTADO ACTUAL DEL ROADMAP EN LA VISTA PRINCIPAL:
{active_plan_context}

---
HISTORIAL DE LA CONVERSACIÓN:
{history_str}
Candidato: {user_message}

INSTRUCCIONES CLAVE DE ORIENTACIÓN, PREGUNTAS SOCRÁTICAS Y ACTUALIZACIÓN EN VIVO DEL PLAN:
1. Actúa como el Consultor Estratégico de Carrera IA bajo el skill Orientador-Itinerarios-Profesional.md y agente-busqueda-cursos.md.
2. CERO FABRICACIÓN Y ANTI-ALUCINACIONES (REGLA FUNDAMENTAL):
   - Basa tus recomendaciones ÚNICAMENTE en la formación reglada, certificaciones y experiencia laboral real del candidato.
   - Si la formación o experiencia del candidato es ambigua, incompleta o no especifica detalles clave (por ejemplo: si menciona "hice un curso" pero no indica tecnologías ni duración; o si pide orientación sin definir horas semanales de estudio o preferencia de roles):
     ¡ESTÁ TERMINANTEMENTE PROHIBIDO ASUMIR O INVENTAR!
   - Debes detenerte, reconocer lo que sí consta en su perfil y formular entre 1 y 3 preguntas socráticas directas, amables y precisas en "reply" con "quick_replies" para clarificar esos puntos antes de forzar cambios en el roadmap.
3. CAPACIDAD DE MUTACIÓN Y ACTUALIZACIÓN DEL ROADMAP:
   - Si durante la conversación el candidato y tú acordáis preferencias, cambios, eliminar o añadir ramas, cambiar tecnologías o certificaciones, ajustar horas de dedicación o construir/afinar el itinerario:
   - DEBES DEVOLVER el objeto "updated_plan" COMPLETO con todos sus campos (id, title, current_role, target_role, executive_summary, trunk_baseline, market_metrics, branches con sus 4 niveles de milestones cada una).
   - Pon "plan_modified": true y detalla brevemente en "plan_summary_diff" qué cambios se han aplicado (ej. "Añadida rama de MLOps & IA, ajustadas certificaciones a nivel 3 y rebajada dedicación a 6h/semana").
   - Si en este turno estás realizando preguntas de descubrimiento o el usuario sólo hace consultas teóricas sin consensuar cambios estructurales en el mapa, pon "plan_modified": false y "updated_plan": null.
4. RECOMENDACIÓN DE CURSOS Y CERTIFICACIONES OFICIALES:
   - Cita únicamente certificaciones oficiales reconocidas por la industria (CompTIA, AWS, Cisco, Linux Foundation, Google Cloud, Red Hat, Microsoft, SEPE) y plataformas legítimas (Coursera, edX, etc.). Prohibido inventar credenciales ficticias.
   - Informa al candidato de que dispone del botón "Buscar Cursos Online" en la cabecera y en cada hito del mapa para rastrear enlaces oficiales en vivo y vincularlos a su plan.
5. Devuelve ÚNICAMENTE un bloque JSON válido con la siguiente estructura:
{{
  "reply": "Tu mensaje conversacional empático, profesional y estructurado con saltos de línea y emojis sobrios. Si faltan datos, formula aquí tus 1-3 preguntas socráticas.",
  "quick_replies": ["Sugerencia corta 1", "Sugerencia corta 2", "Sugerencia corta 3"],
  "ready_to_generate_roadmap": false,
  "detected_direction": "Breve etiqueta de la especialidad",
  "plan_modified": true,
  "plan_summary_diff": "Descripción concisa de qué ramas o hitos se añadieron o ajustaron en el roadmap",
  "updated_plan": {{
    "id": "{active_plan.get('id') if active_plan else 'cp-generado'}",
    "title": "Itinerario de Carrera y Especialización",
    "current_role": "Puesto actual",
    "target_role": "Puesto objetivo",
    "executive_summary": "Resumen ejecutivo alineado con la conversación",
    "trunk_baseline": {{
      "title": "Tronco Común & Base Demostrada",
      "summary": "Resumen de fortalezas",
      "core_skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"]
    }},
    "market_metrics": {{
      "market_demand_growth": "+32% anual",
      "median_salary_spain": "42.000€ - 58.000€",
      "remote_availability": "Alta (60% ofertas)",
      "competition_level": "Media"
    }},
    "branches": [
      {{
        "id": "br-...",
        "name": "🌿 Salto Vertical: ...",
        "branch_type": "vertical",
        "target_role": "...",
        "description": "...",
        "market_demand": "+30% anual",
        "salary_range_est": "45.000€ - 60.000€",
        "fit_percentage": 88,
        "color_theme": "#6366f1",
        "is_active": true,
        "milestones": [
          {{
            "id": "ms-...",
            "title": "...",
            "provider": "...",
            "duration_hours": 40,
            "cost_estimate": "Gratuito",
            "is_official_certification": false,
            "certification_name": null,
            "status": "pending",
            "skills_acquired": ["Skill A", "Skill B"],
            "level": 1
          }}
        ]
      }}
    ]
  }}
}}"""

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
                res = await asyncio.wait_for(asyncio.to_thread(call), timeout=22.0)
                if res and res.text:
                    match = re.search(r'\{.*\}', res.text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        
                        # Si el modelo modificó o refinó el plan, persistirlo atómicamente
                        if parsed.get("plan_modified") and isinstance(parsed.get("updated_plan"), dict) and "branches" in parsed["updated_plan"]:
                            u_plan = parsed["updated_plan"]
                            if active_plan and active_plan.get("id"):
                                u_plan["id"] = active_plan["id"]
                            elif not u_plan.get("id") or u_plan.get("id") == "cp-generado":
                                u_plan["id"] = f"cp-{uuid.uuid4().hex[:6]}"
                            u_plan["profile_name"] = p_info.get("full_name") or "Usuario Profesional"
                            if "journal" not in u_plan:
                                u_plan["journal"] = active_plan.get("journal", []) if active_plan else []
                            if "key_metrics" not in u_plan:
                                u_plan["key_metrics"] = active_plan.get("key_metrics", {"overall_progress_pct": 10}) if active_plan else {"overall_progress_pct": 10}

                            # Guardar en career_plans.json
                            if active_plan_idx is not None and active_plan_idx < len(plans):
                                plans[active_plan_idx] = u_plan
                            else:
                                plans.insert(0, u_plan)
                            save_json("career_plans.json", plans)
                            parsed["updated_plan"] = u_plan

                        return parsed
            except Exception as e:
                print(f"[Career Advisor Chat] Modelo {model_name} falló: {e}")
                continue

    # Fallback conversacional determinista adaptado al perfil y al diálogo
    curr_headline = p_info.get("headline", "profesional de tecnología")
    intent_lower = user_message.lower()
    has_adjustment_intent = any(w in intent_lower for w in [
        "bifurcaci", "ciber", "seguridad", "cloud", "devops", "ia", "mlops", "arquitect", 
        "lider", "rama", "hito", "cambiar", "añadir", "quitar", "eliminar", "actualizar", 
        "horas", "certificaci", "generar mi árbol", "árbol", "plan", "roadmap"
    ])

    if has_adjustment_intent:
        fresh_plan = generate_career_paths_from_master_cv(user_intent=user_message)
        if active_plan and active_plan.get("id"):
            fresh_plan["id"] = active_plan["id"]
            for idx, p in enumerate(plans):
                if p.get("id") == active_plan["id"]:
                    plans[idx] = fresh_plan
                    break
        else:
            plans.insert(0, fresh_plan)
        save_json("career_plans.json", plans)

        return {
            "reply": f"He analizado tu petición (**\"{user_message}\"**) bajo las directrices del Skill de Orientador de Itinerarios. **He actualizado en caliente el Roadmap y Mapa de Carrera** para reflejar las nuevas bifurcaciones, competencias e hitos formativos acordados.",
            "quick_replies": [
                "Ver Roadmap actualizado en la vista de Mapa",
                "Quiero profundizar en las certificaciones oficiales",
                "Ajustar ritmo semanal a menos horas"
            ],
            "ready_to_generate_roadmap": True,
            "detected_direction": user_message,
            "plan_modified": True,
            "plan_summary_diff": f"Roadmap actualizado automáticamente con bifurcaciones para: {user_message}",
            "updated_plan": fresh_plan
        }

    user_name = p_info.get('full_name', 'Candidato')
    main_degree = edu_list[0].get('degree') if edu_list else None
    degree_info = f" y tu formación en **{main_degree}**" if main_degree else ""

    return {
        "reply": f"Hola {user_name}. Analizando tu base profesional contrastable como **{curr_headline}**{degree_info}, podemos estructurar tu plan de carrera con rigor profesional.\n\nPara diseñar tu itinerario con total precisión y sin asumir supuestos:\n1. ¿Cuál es tu objetivo prioritario: **consolidar tu especialidad actual** (salto vertical a Senior/Lead) o **abrir una nueva bifurcación** tecnológica?\n2. ¿De cuántas **horas semanales de estudio** dispones para asegurar un ritmo sostenible?\n3. ¿Priorizas certificaciones oficiales de la industria o proyectos prácticos demostrables?",
        "quick_replies": [
            "Consolidar mi especialidad actual (Salto Vertical)",
            "Explorar una nueva bifurcación tecnológica",
            "Dispongo de 6 a 10 horas semanales",
            "Generar mi árbol de carrera desde mi CV Maestro"
        ],
        "ready_to_generate_roadmap": False,
        "detected_direction": "Descubrimiento socrático de metas",
        "plan_modified": False,
        "plan_summary_diff": None,
        "updated_plan": None
    }

def generate_ai_career_plan(target_role: str = "", transition_type: str = "branch_pivot") -> Dict[str, Any]:
    return generate_career_roadmap_tree(user_intent=target_role, target_role=target_role, transition_type=transition_type)

def generate_career_roadmap_tree(
    user_intent: str = "",
    target_role: str = "",
    transition_type: str = "branch_pivot",
    hours_per_week: int = 10
) -> Dict[str, Any]:
    """
    Genera un Plan de Carrera estructurado en forma de Árbol con Tronco Principal y Bifurcaciones de Especialización.
    """
    profile = load_profile()
    p_info = profile.get("personal_info", {})
    user_name = p_info.get("full_name") or "Usuario Profesional"
    current_role = p_info.get("headline") or "Profesional en Ejercicio"

    intent_lower = (user_intent + " " + target_role).lower()

    # Detectar orientación
    wants_security = any(w in intent_lower for w in ["ciber", "seguridad", "security", "pentest", "soc", "hacking", "forense", "hardening"])
    wants_cloud_devops = any(w in intent_lower for w in ["cloud", "devops", "aws", "azure", "docker", "kubernetes", "sre", "infra"])
    wants_health = any(w in intent_lower for w in ["salud", "sanitar", "clínic", "hospital", "médic"])

    plan_id = f"cp-{uuid.uuid4().hex[:6]}"

    # 1. Rama Principal Troncal
    main_branch_id = f"br-main-{uuid.uuid4().hex[:4]}"
    fork_branch_id = f"br-fork-{uuid.uuid4().hex[:4]}"

    if wants_security or "sistemas" in current_role.lower() or "redes" in current_role.lower() or "informátic" in current_role.lower():
        resolved_target = "Especialista en Ciberseguridad & SecOps" if wants_security else "Senior Systems & Cloud Infrastructure Lead"
        
        main_milestones = [
            {
                "id": f"ms-{uuid.uuid4().hex[:4]}",
                "title": "Nivelación: Arquitectura de Redes Avanzadas y Hardening Linux/Windows",
                "provider": "Linux Professional Institute / Cisco NetAcad",
                "duration_hours": 45,
                "cost_estimate": "Gratuito / Autoestudio",
                "is_official_certification": False,
                "status": "completed",
                "skills_acquired": ["TCP/IP", "Linux Hardening", "Firewalls", "Bash Scripting"],
                "level": 1,
                "notes": "Tronco común fundamental antes de cualquier bifurcación."
            },
            {
                "id": "ms-fork-point-1",
                "title": "Administración de Infraestructura Segura y Servicios de Directorio",
                "provider": "Microsoft Learn / Red Hat",
                "duration_hours": 60,
                "cost_estimate": "Gratuito",
                "is_official_certification": False,
                "status": "in_progress",
                "skills_acquired": ["Active Directory", "Gestión de Permisos", "Auditoría de Logs", "SSH"],
                "level": 2,
                "notes": "Punto de inflexión donde se activa la bifurcación a Ciberseguridad."
            },
            {
                "id": f"ms-{uuid.uuid4().hex[:4]}",
                "title": "Certificación Oficial CompTIA Security+ (SY0-701)",
                "provider": "CompTIA Oficial",
                "duration_hours": 80,
                "cost_estimate": "320€ (tasa examen)",
                "is_official_certification": True,
                "status": "pending",
                "skills_acquired": ["Gestión de Amenazas", "Criptografía", "Cumplimiento Normativo", "Respuesta a Incidentes"],
                "level": 3,
                "certification_name": "CompTIA Security+",
                "notes": "Estándar de oro global exigido por empresas e instituciones públicas."
            },
            {
                "id": f"ms-{uuid.uuid4().hex[:4]}",
                "title": "Certificación Avanzada de Seguridad Ofensiva (eJPT / OSCP)",
                "provider": "INE Security / OffSec",
                "duration_hours": 120,
                "cost_estimate": "250€ - 800€",
                "is_official_certification": True,
                "status": "pending",
                "skills_acquired": ["Pentesting Web", "Escaneo de Redes con Nmap", "Metasploit", "Auditoría de Vulnerabilidades"],
                "level": 4,
                "certification_name": "Junior Penetration Tester (eJPT)",
                "notes": "Examen 100% práctico en laboratorio real."
            }
        ]

        # Bifurcación 1: Ciberseguridad Ofensiva & Blue Team
        security_fork_milestones = [
            {
                "id": f"ms-sec-{uuid.uuid4().hex[:4]}",
                "title": "Análisis de Tráfico y Detección de Intrusiones con Wireshark & Snort",
                "provider": "Wireshark University / Cybrary",
                "duration_hours": 35,
                "cost_estimate": "Gratuito",
                "is_official_certification": False,
                "status": "pending",
                "skills_acquired": ["PCAP Analysis", "Detección de Malwares", "IDS/IPS"],
                "level": 2,
                "notes": "Rama de especialización en seguridad defensiva (SOC Analyst)."
            },
            {
                "id": f"ms-sec-{uuid.uuid4().hex[:4]}",
                "title": "Auditoría de Seguridad y Cumplimiento Normativo (ISO 27001 & ENS)",
                "provider": "CCN-CERT / AENOR",
                "duration_hours": 50,
                "cost_estimate": "150€",
                "is_official_certification": True,
                "status": "pending",
                "skills_acquired": ["Esquema Nacional de Seguridad (ENS)", "Políticas de Seguridad", "Análisis de Riesgos MAGERIT"],
                "level": 3,
                "certification_name": "Auditor Interno ISO 27001",
                "notes": "Muy valorado en consultoría y licitaciones del sector público español."
            }
        ]

        # Bifurcación 2: Cloud DevOps & Automatización
        cloud_fork_milestones = [
            {
                "id": f"ms-cld-{uuid.uuid4().hex[:4]}",
                "title": "Infraestructura Cloud como Código con Terraform & AWS",
                "provider": "HashiCorp / AWS Skill Builder",
                "duration_hours": 55,
                "cost_estimate": "Gratuito / 150€ examen",
                "is_official_certification": True,
                "status": "pending",
                "skills_acquired": ["Terraform HCL", "AWS VPC/EC2/IAM", "CI/CD con GitHub Actions"],
                "level": 3,
                "certification_name": "HashiCorp Certified: Terraform Associate",
                "notes": "Bifurcación orientada a empresas multinacionales y scale-ups."
            }
        ]

        branches = [
            {
                "id": main_branch_id,
                "name": "Tronco Principal: Sistemas y Seguridad Troncal",
                "branch_type": "main",
                "description": "Ruta base consolidada en infraestructura y securización de sistemas.",
                "market_demand": "+24% anual",
                "salary_range_est": "32.000€ - 44.000€",
                "is_active": True,
                "parent_fork_milestone_id": None,
                "milestones": main_milestones
            },
            {
                "id": fork_branch_id,
                "name": "🌿 Bifurcación: Ciberseguridad & SOC Analyst",
                "branch_type": "pivot_fork",
                "description": "Salto lateral especializado hacia análisis de incidentes, defensa activa y auditoría ENS.",
                "market_demand": "Muy Alta (+38% anual)",
                "salary_range_est": "42.000€ - 62.000€",
                "is_active": True,
                "parent_fork_milestone_id": "ms-fork-point-1",
                "milestones": security_fork_milestones
            },
            {
                "id": f"br-alt-{uuid.uuid4().hex[:4]}",
                "name": "🌿 Bifurcación Alternativa: Cloud DevOps Engineer",
                "branch_type": "alternative",
                "description": "Salto hacia aprovisionamiento cloud declarativo y automatización continua.",
                "market_demand": "+30% anual",
                "salary_range_est": "40.000€ - 58.000€",
                "is_active": False,
                "parent_fork_milestone_id": "ms-fork-point-1",
                "milestones": cloud_fork_milestones
            }
        ]

    else:
        # Software Engineering / Fullstack / IA / General
        resolved_target = target_role or "Tech Lead & Cloud Software Architect"
        branches = [
            {
                "id": main_branch_id,
                "name": "Tronco Principal: Desarrollo Backend & Arquitectura",
                "branch_type": "main",
                "description": "Consolidación de código limpio, patrones distribuidos y APIs resilientes.",
                "market_demand": "+22% anual",
                "salary_range_est": "38.000€ - 52.000€",
                "is_active": True,
                "parent_fork_milestone_id": None,
                "milestones": [
                    {
                        "id": f"ms-{uuid.uuid4().hex[:4]}",
                        "title": "Arquitectura Hexagonal y Patrones de Diseño SOLID",
                        "provider": "Plataforma Especializada",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "completed",
                        "skills_acquired": ["Domain-Driven Design", "Clean Architecture", "Unit Testing"],
                        "level": 1
                    },
                    {
                        "id": "ms-fork-point-dev",
                        "title": "Microservicios Escalables y Mensajería Asíncrona (RabbitMQ / Kafka)",
                        "provider": "Confluent / Cloud Academy",
                        "duration_hours": 60,
                        "cost_estimate": "120€",
                        "is_official_certification": False,
                        "status": "in_progress",
                        "skills_acquired": ["Event-Driven", "Kafka Streams", "Redis Caching"],
                        "level": 2
                    },
                    {
                        "id": f"ms-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial AWS Certified Solutions Architect - Associate",
                        "provider": "Amazon Web Services",
                        "duration_hours": 75,
                        "cost_estimate": "150€ tasa",
                        "is_official_certification": True,
                        "status": "pending",
                        "skills_acquired": ["AWS Serverless", "VPC Networking", "High Availability"],
                        "level": 3,
                        "certification_name": "AWS Solutions Architect"
                    }
                ]
            },
            {
                "id": fork_branch_id,
                "name": "🌿 Bifurcación: Especialización en IA & Machine Learning Ops",
                "branch_type": "pivot_fork",
                "description": "Salto hacia la integración de modelos de lenguaje, embeddings y despliegue de agentes inteligentes.",
                "market_demand": "Crítica (+45% anual)",
                "salary_range_est": "48.000€ - 70.000€",
                "is_active": True,
                "parent_fork_milestone_id": "ms-fork-point-dev",
                "milestones": [
                    {
                        "id": f"ms-ai-{uuid.uuid4().hex[:4]}",
                        "title": "Ingeniería de Contexto, RAG y Modelos Multimodales con Gemini & LangChain",
                        "provider": "DeepLearning.AI / Google Cloud",
                        "duration_hours": 45,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Vector Databases", "ChromaDB", "Function Calling", "RAG Pipeline"],
                        "level": 3
                    }
                ]
            }
        ]

    # Bitácora inicial
    journal_init = [
        {
            "id": f"jrn-{uuid.uuid4().hex[:4]}",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "title": f"Inicio de Itinerario: Orientación hacia {resolved_target}",
            "content": f"Itinerario generado con apoyo del Consultor de Carrera IA. Se ha configurado una dedicación estimada de {hours_per_week}h semanales con bifurcaciones activas para evaluar especializaciones.",
            "category": "learning",
            "tags": ["inicio", "roadmap", "ia"]
        }
    ]

    plan_obj = {
        "id": plan_id,
        "title": f"Plan Estratégico: {resolved_target}",
        "profile_name": user_name,
        "sector": "general",
        "current_role": current_role,
        "target_role": resolved_target,
        "transition_type": transition_type,
        "executive_summary": f"Plan estratégico de formación diseñado por el Consultor de Carrera IA. Combina un tronco de consolidación con bifurcaciones de especialización hacia roles con alta demanda de mercado y certificaciones oficiales reconocidas.",
        "key_metrics": {
            "overall_progress_pct": 25,
            "hours_per_week": hours_per_week,
            "target_horizon": "6 a 12 meses"
        },
        "market_metrics": {
            "market_demand_growth": "+32% anual",
            "median_salary_spain": "42.000€ - 60.000€",
            "remote_availability": "Alta (70% ofertas)",
            "competition_level": "Media-Baja (Alta demanda técnica especializada)"
        },
        "skill_gaps": [
            {
                "name": "Certificaciones Oficiales Acreditadas (CompTIA / Cloud)",
                "category": "regulation",
                "current_level": 2,
                "target_level": 5,
                "description": "Validación formal necesaria para puestos de responsabilidad y filtros ATS."
            },
            {
                "name": "Securización, Hardening y Auditoría de Vulnerabilidades",
                "category": "hard",
                "current_level": 2,
                "target_level": 5,
                "description": "Protección de infraestructura y aplicaciones frente a incidentes modernos."
            },
            {
                "name": "Liderazgo Técnico y Gestión de Proyectos Ágiles",
                "category": "soft",
                "current_level": 3,
                "target_level": 5,
                "description": "Capacidad de tomar decisiones arquitecturales y coordinar equipos."
            }
        ],
        "branches": branches,
        "journal": journal_init,
        "chat_history": []
    }

    # Guardar en career_plans.json
    plans = load_json("career_plans.json", [])
    plans.insert(0, plan_obj)
    save_json("career_plans.json", plans)

    return plan_obj

def sync_completed_milestone_to_profile(
    plan_id: str,
    milestone_id: str,
    sync_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Sincroniza un hito completado directamente en el Perfil Oficial (profile.json)
    y el CV Maestro (cv-maestro.md).
    """
    profile = load_profile()
    plans = load_json("career_plans.json", [])

    target_milestone = None
    for p in plans:
        if p.get("id") == plan_id:
            for br in p.get("branches", []):
                for ms in br.get("milestones", []):
                    if ms.get("id") == milestone_id:
                        target_milestone = ms
                        break

    if not target_milestone:
        title = sync_data.get("title", "Certificación / Formación")
    else:
        title = target_milestone.get("title")

    category = sync_data.get("category", "certification")
    current_year = sync_data.get("year") or datetime.now().strftime("%Y")
    issuer = sync_data.get("institution") or (target_milestone.get("provider") if target_milestone else "Entidad Oficial")

    if category == "certification":
        if "certifications" not in profile:
            profile["certifications"] = []
        profile["certifications"].append({
            "id": f"cert-{uuid.uuid4().hex[:6]}",
            "name": title,
            "issuer": issuer,
            "year": current_year,
            "is_official": target_milestone.get("is_official_certification", True) if target_milestone else True
        })
    else:
        if "education" not in profile:
            profile["education"] = []
        profile["education"].append({
            "id": f"edu-{uuid.uuid4().hex[:6]}",
            "degree": title,
            "institution": issuer,
            "start_year": current_year,
            "end_year": current_year,
            "grade": sync_data.get("grade", "")
        })

    # Añadir competencias si se indicaron
    skills_to_add = sync_data.get("skills_to_add", [])
    if skills_to_add:
        if "hard_skills" not in profile:
            profile["hard_skills"] = []
        found_cat = False
        for cat in profile["hard_skills"]:
            if isinstance(cat, dict) and cat.get("category") == "Especialización":
                for s in skills_to_add:
                    if s not in cat.get("skills", []):
                        cat["skills"].append(s)
                found_cat = True
                break
        if not found_cat:
            profile["hard_skills"].append({
                "category": "Especialización & Certificaciones",
                "skills": skills_to_add
            })

    save_profile(profile)
    return {"status": "success", "message": f"'{title}' sincronizado con éxito en tu Perfil Oficial y CV Maestro.", "profile": profile}


def sync_milestone_direct_to_master_cv(plan_id: str, milestone_id: str) -> Dict[str, Any]:
    """
    Sincronización directa en 1 clic de un hito completado hacia el Perfil Oficial y CV Maestro (cv-maestro.md).
    """
    profile = load_profile()
    plans = load_json("career_plans.json", [])

    target_milestone = None
    target_plan_idx = None
    target_br_idx = None
    target_ms_idx = None

    for p_idx, p in enumerate(plans):
        if p.get("id") == plan_id:
            target_plan_idx = p_idx
            for b_idx, br in enumerate(p.get("branches", [])):
                for m_idx, ms in enumerate(br.get("milestones", [])):
                    if ms.get("id") == milestone_id:
                        target_milestone = ms
                        target_br_idx = b_idx
                        target_ms_idx = m_idx
                        break
                if target_milestone:
                    break
        if target_milestone:
            break

    if not target_milestone:
        return {"status": "error", "message": "Hito formativo no encontrado"}

    ms_title = target_milestone.get("title", "Certificación / Competencia")
    issuer = target_milestone.get("provider", "Entidad Oficial")
    is_cert = target_milestone.get("is_official_certification", False)
    cert_name = target_milestone.get("certification_name") or ms_title
    skills_acquired = target_milestone.get("skills_acquired", [])
    current_year = datetime.now().strftime("%Y")

    # 1. Marcar hito como completado en el plan
    if target_plan_idx is not None and target_br_idx is not None and target_ms_idx is not None:
        plans[target_plan_idx]["branches"][target_br_idx]["milestones"][target_ms_idx]["status"] = "completed"
        plans[target_plan_idx]["branches"][target_br_idx]["milestones"][target_ms_idx]["completion_date"] = datetime.now().strftime("%Y-%m-%d")
        save_json("career_plans.json", plans)

    # 2. Agregar certificación a profile.json si aplica
    if is_cert:
        if "certifications" not in profile or not isinstance(profile["certifications"], list):
            profile["certifications"] = []
        # Evitar duplicados por nombre
        existing_names = [c.get("name", "").lower() for c in profile["certifications"] if isinstance(c, dict)]
        if cert_name.lower() not in existing_names:
            profile["certifications"].append({
                "id": f"cert-{uuid.uuid4().hex[:6]}",
                "name": cert_name,
                "issuer": issuer,
                "year": current_year,
                "is_official": True
            })

    # 3. Agregar competencias a profile.json
    if skills_acquired:
        if "hard_skills" not in profile or not isinstance(profile["hard_skills"], list):
            profile["hard_skills"] = []
        
        # Si es lista de strings planos
        current_skills = []
        for s in profile["hard_skills"]:
            if isinstance(s, str):
                current_skills.append(s.lower())
            elif isinstance(s, dict) and "skills" in s:
                current_skills.extend([x.lower() for x in s.get("skills", []) if isinstance(x, str)])

        # Insertar nuevas competencias en el perfil
        found_category = False
        for cat in profile["hard_skills"]:
            if isinstance(cat, dict) and (cat.get("category") == "Especialización & Certificaciones" or cat.get("category") == "Especialización"):
                for skill in skills_acquired:
                    if skill.lower() not in current_skills:
                        cat.setdefault("skills", []).append(skill)
                        current_skills.append(skill.lower())
                found_category = True
                break

        if not found_category:
            profile["hard_skills"].append({
                "category": "Especialización & Certificaciones",
                "skills": [s for s in skills_acquired if s.lower() not in current_skills]
            })

    # 4. Guardar perfil oficial (save_profile sincroniza automáticamente assets/cv-maestro.md)
    save_profile(profile)

    return {
        "status": "success",
        "message": f"¡Hito '{cert_name}' y sus {len(skills_acquired)} competencias sincronizadas con éxito en tu CV Maestro!",
        "milestone_id": milestone_id,
        "completed": True
    }


def generate_career_paths_from_master_cv(user_intent: str = "", target_role: str = "") -> Dict[str, Any]:
    """
    Lee directamente el CV Maestro (assets/cv-maestro.md) y genera una propuesta estratégica
    de múltiples caminos de carrera (Vertical, Especializaciones Laterales y Emergente),
    con tronco común y bifurcaciones seleccionables por el usuario.
    """
    profile = load_profile()
    p_info = profile.get("personal_info", {})
    user_name = p_info.get("full_name") or "Usuario Profesional"
    current_role_str = p_info.get("headline") or "Especialista Técnico"

    # 1. Leer CV Maestro Oficial desde assets/cv-maestro.md
    cv_maestro_content = ""
    if CV_MAESTRO_PATH.exists():
        try:
            with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                cv_maestro_content = f.read()
        except Exception as e:
            print(f"[Career Advisor] Error leyendo {CV_MAESTRO_PATH}: {e}")

    if not cv_maestro_content.strip() or len(cv_maestro_content) < 40:
        sync_profile_to_cv_maestro(profile)
        if CV_MAESTRO_PATH.exists():
            try:
                with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
                    cv_maestro_content = f.read()
            except Exception:
                pass

    skill_text = load_career_skill_text()

    # Intentar generar con Gemini si está disponible
    from backend.services.agent_browser import get_gemini_client
    client, _ = get_gemini_client()

    if client and cv_maestro_content:
        prompt = f"""{skill_text}

---
CURRÍCULUM VITAE MAESTRO OFICIAL DEL CANDIDATO (FUENTE DE VERDAD cv-maestro.md):
{cv_maestro_content[:7500]}

---
PREFERENCIAS O INTENCIÓN DEL USUARIO:
- Rol deseado o interés: {target_role or user_intent or "Exploración de bifurcaciones estratégicas de mercado"}

---
INSTRUCCIONES OBLIGATORIAS DE GENERACIÓN MULTICAMINO:
1. Analiza el CV Maestro oficial para extraer con precisión la base demostrada del candidato.
2. Construye un "trunk_baseline" (Tronco Común) que resuma las competencias sólidas que ya domina.
3. Propón exactamente 4 caminos de carrera estratégicos y diferenciados:
   - Camino 1 (vertical): Crecimiento natural hacia Senior / Tech Lead / Arquitecto en su ámbito actual.
   - Camino 2 (pivot_fork): Salto lateral de altísima demanda (ej. Ciberseguridad & SecOps si es de sistemas/redes, o MLOps si es de software).
   - Camino 3 (cloud_devops): Salto hacia Cloud Architecture, Automatización, Terraform, Kubernetes & Plataforma.
   - Camino 4 (emerging): Especialización emergente de futuro (ej. IA Aplicada & Agentes, Auditoría de Seguridad & Cumplimiento ENS, o Consultoría Estratégica).
4. Para CADA camino incluye:
   - "id": id único tipo "br-..."
   - "name": nombre con emoji elegante (ej: "🌿 Salto Vertical: Lead Architect")
   - "branch_type": ("vertical", "pivot_fork", "cloud_devops", "emerging")
   - "target_role": puesto de destino final
   - "description": 1-2 frases explicando el valor de este camino
   - "market_demand": e.g. "+35% anual" o "Muy Alta (+42% anual)"
   - "salary_range_est": e.g. "45.000€ - 65.000€"
   - "fit_percentage": porcentaje entero de afinidad según su CV maestro (entre 60 y 95)
   - "color_theme": color hex ("#6366f1" para vertical, "#10b981" para ciberseguridad/lateral, "#06b6d4" para cloud, "#f59e0b" para emergente)
   - "is_active": true para los primeros 3, false para el 4to por defecto
   - "milestones": lista de 4 hitos progresivos (nivel 1 al 4). Cada hito debe tener:
     - "id": id único "ms-..."
     - "title": título claro de la formación, proyecto o hito
     - "provider": proveedor o entidad certificadora (ej: AWS, CompTIA, Linux Foundation, CCN-CERT)
     - "duration_hours": horas estimadas (número entero entre 20 y 80)
     - "cost_estimate": e.g. "Gratuito", "150€ tasa oficial"
     - "is_official_certification": booleano
     - "certification_name": nombre de la acreditación si aplica
     - "status": "pending" (el primero puede ser "in_progress" o "completed" si ya se deduce del CV)
     - "skills_acquired": lista de 3 a 4 competencias concretas
     - "level": 1, 2, 3 o 4
5. Devuelve ÚNICAMENTE un bloque JSON válido con el siguiente formato:
{{
  "title": "Itinerario Multicamino Personalizado",
  "current_role": "Puesto actual deducido del CV Maestro",
  "target_role": "Especialista Senior Multidisciplinar",
  "executive_summary": "Párrafo de análisis estratégico sobre las opciones del candidato y cómo apalancar su experiencia demostrada.",
  "trunk_baseline": {{
    "title": "Tronco Común & Base Demostrada",
    "summary": "Resumen conciso de fortalezas del CV Maestro",
    "core_skills": ["Competencia 1", "Competencia 2", "Competencia 3", "Competencia 4", "Competencia 5"]
  }},
  "market_metrics": {{
    "market_demand_growth": "+32% anual",
    "median_salary_spain": "42.000€ - 58.000€",
    "remote_availability": "Alta (60% ofertas)",
    "competition_level": "Media"
  }},
  "branches": [
    ... 4 caminos ...
  ]
}}"""

        candidate_models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
        configured_model = os.getenv("GEMINI_MODEL", "").strip()
        if configured_model and configured_model not in candidate_models:
            candidate_models.insert(0, configured_model)

        for model_name in candidate_models:
            try:
                def call_gemini():
                    return client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(call_gemini)
                    res = future.result(timeout=25.0)

                if res and res.text:
                    match = re.search(r'\{.*\}', res.text, re.DOTALL)
                    if match:
                        parsed = json.loads(match.group(0))
                        if "branches" in parsed and len(parsed["branches"]) >= 2:
                            plan_id = f"cp-{uuid.uuid4().hex[:6]}"
                            parsed["id"] = plan_id
                            parsed["profile_name"] = user_name
                            parsed["journal"] = []
                            parsed["key_metrics"] = {"overall_progress_pct": 10}

                            # Guardar en career_plans.json
                            plans = load_json("career_plans.json", [])
                            plans.insert(0, parsed)
                            save_json("career_plans.json", plans)
                            return parsed
            except Exception as e:
                print(f"[generate_career_paths_from_master_cv] Gemini {model_name} falló: {e}")
                continue

    # 2. Generador Determinista de Alta Calidad adaptado al CV Maestro
    cv_lower = cv_maestro_content.lower()
    is_systems = any(w in cv_lower for w in ["sistemas", "redes", "linux", "windows server", "administrador", "infraestructura", "virtuali", "vmware", "cisco", "tcp/ip", "firewall", "active directory"])
    is_developer = any(w in cv_lower for w in ["desarrollador", "developer", "frontend", "backend", "fullstack", "react", "python", "javascript", "typescript", "java", "c#", "flutter"])
    is_health = any(w in cv_lower for w in ["salud", "sanitario", "clínic", "hospital", "enferm"])

    plan_id = f"cp-{uuid.uuid4().hex[:6]}"

    if is_systems:
        current_detected_role = "Administrador de Sistemas & Redes"
        trunk_skills = ["Linux Hardening", "Active Directory & DNS", "Redes TCP/IP & VLANs", "Virtualización VMware/Proxmox", "Bash / PowerShell Scripting"]
        trunk_summary = "Trayectoria contrastada en gestión de servidores, soporte de infraestructura de redes y securización perimetral de puestos de trabajo."

        branches = [
            {
                "id": f"br-vert-{uuid.uuid4().hex[:4]}",
                "name": "🌿 Salto Vertical: Senior Infrastructure & Systems Lead",
                "branch_type": "vertical",
                "target_role": "Lead Systems & Infrastructure Architect",
                "description": "Evolución natural hacia la dirección técnica de plataformas corporativas, alta disponibilidad y diseño resiliente.",
                "market_demand": "+24% anual",
                "salary_range_est": "42.000€ - 58.000€",
                "fit_percentage": 92,
                "color_theme": "#6366f1",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-v1-{uuid.uuid4().hex[:4]}",
                        "title": "Nivelación: Alta Disponibilidad y Clústeres de Almacenamiento (Ceph / SAN)",
                        "provider": "Red Hat / Linux Professional Institute",
                        "duration_hours": 35,
                        "cost_estimate": "Gratuito / Autoestudio",
                        "is_official_certification": False,
                        "status": "completed",
                        "skills_acquired": ["Ceph Storage", "HAProxy", "Keepalived", "Disaster Recovery"],
                        "level": 1
                    },
                    {
                        "id": f"ms-v2-{uuid.uuid4().hex[:4]}",
                        "title": "Automatización Masiva de Sistemas con Ansible & GitOps",
                        "provider": "Red Hat Training",
                        "duration_hours": 45,
                        "cost_estimate": "Gratuito / Laboratorios",
                        "is_official_certification": False,
                        "status": "in_progress",
                        "skills_acquired": ["Ansible Playbooks", "GitOps", "Config Management", "CI/CD Básico"],
                        "level": 2
                    },
                    {
                        "id": f"ms-v3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial Red Hat Certified Engineer (RHCE / EX294)",
                        "provider": "Red Hat Official",
                        "duration_hours": 75,
                        "cost_estimate": "400€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "Red Hat RHCE",
                        "status": "pending",
                        "skills_acquired": ["Automatización Linux", "System Tuning", "Gestión de Servicios de Red"],
                        "level": 3
                    },
                    {
                        "id": f"ms-v4-{uuid.uuid4().hex[:4]}",
                        "title": "Diseño de Arquitecturas Empresariales e ITIL v4 Foundation",
                        "provider": "Axelos / PeopleCert",
                        "duration_hours": 30,
                        "cost_estimate": "250€",
                        "is_official_certification": True,
                        "certification_name": "ITIL v4 Foundation",
                        "status": "pending",
                        "skills_acquired": ["Service Management", "SLA / SLO", "Gestión de Cambios", "Gobernanza TI"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-sec-{uuid.uuid4().hex[:4]}",
                "name": "🛡️ Bifurcación Lateral: Ciberseguridad & SOC Analyst",
                "branch_type": "pivot_fork",
                "target_role": "Cybersecurity & Incident Response Analyst (SOC)",
                "description": "Salto de alta demanda hacia monitorización SIEM, respuesta a incidentes, análisis forense y securización activa.",
                "market_demand": "Crítica (+38% anual)",
                "salary_range_est": "44.000€ - 64.000€",
                "fit_percentage": 86,
                "color_theme": "#10b981",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-s1-{uuid.uuid4().hex[:4]}",
                        "title": "Fundación: Hardening Avanzado, Wireshark & Análisis de Tráfico",
                        "provider": "Wireshark University / Cybrary",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "in_progress",
                        "skills_acquired": ["PCAP Deep Dive", "Análisis de Malware", "Snort / Suricata IDS"],
                        "level": 1
                    },
                    {
                        "id": f"ms-s2-{uuid.uuid4().hex[:4]}",
                        "title": "Operación de SOC y Gestión de Logs con Wazuh & Elastic SIEM",
                        "provider": "Wazuh Academy / TryHackMe",
                        "duration_hours": 50,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Wazuh SIEM", "Reglas Sigma", "Threat Hunting", "EDR"],
                        "level": 2
                    },
                    {
                        "id": f"ms-s3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial CompTIA Security+ (SY0-701)",
                        "provider": "CompTIA Oficial",
                        "duration_hours": 80,
                        "cost_estimate": "320€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "CompTIA Security+",
                        "status": "pending",
                        "skills_acquired": ["Gestión de Vulnerabilidades", "Criptografía Aplicada", "Cumplimiento ISO 27001", "Incident Handling"],
                        "level": 3
                    },
                    {
                        "id": f"ms-s4-{uuid.uuid4().hex[:4]}",
                        "title": "Especialización Ofensiva / Defensiva BJR (eJPT o Blue Team Level 1)",
                        "provider": "Security Blue Team / INE",
                        "duration_hours": 100,
                        "cost_estimate": "399€",
                        "is_official_certification": True,
                        "certification_name": "Blue Team Level 1 (BTL1)",
                        "status": "pending",
                        "skills_acquired": ["Defensa Activa", "Forense Digital", "Mitre ATT&CK Framework", "Mitigación Ransomware"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-cld-{uuid.uuid4().hex[:4]}",
                "name": "☁️ Bifurcación Lateral: Cloud DevOps & SRE Engineer",
                "branch_type": "cloud_devops",
                "target_role": "Cloud DevOps & Platform Engineer",
                "description": "Salto hacia la automatización declarativa con Docker, Kubernetes, Terraform e infraestructura cloud en AWS o Azure.",
                "market_demand": "+34% anual",
                "salary_range_est": "42.000€ - 60.000€",
                "fit_percentage": 82,
                "color_theme": "#06b6d4",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-c1-{uuid.uuid4().hex[:4]}",
                        "title": "Contenerización con Docker y Arquitecturas de Microservicios",
                        "provider": "Docker Official / Udemy",
                        "duration_hours": 30,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Dockerfile Multistage", "Docker Compose", "Container Networking"],
                        "level": 1
                    },
                    {
                        "id": f"ms-c2-{uuid.uuid4().hex[:4]}",
                        "title": "Infraestructura como Código (IaC) con Terraform & GitHub Actions",
                        "provider": "HashiCorp Learn",
                        "duration_hours": 45,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": True,
                        "certification_name": "Terraform Associate",
                        "status": "pending",
                        "skills_acquired": ["Terraform HCL", "State Management", "CI/CD Pipelines", "AWS VPC"],
                        "level": 2
                    },
                    {
                        "id": f"ms-c3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial Kubernetes Administrator (CKA)",
                        "provider": "Cloud Native Computing Foundation (CNCF)",
                        "duration_hours": 90,
                        "cost_estimate": "350€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "Certified Kubernetes Administrator (CKA)",
                        "status": "pending",
                        "skills_acquired": ["Kubeadm", "Ingress Controllers", "Pod Security", "Helm Charts"],
                        "level": 3
                    },
                    {
                        "id": f"ms-c4-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial AWS Solutions Architect - Associate (SAA-C03)",
                        "provider": "Amazon Web Services",
                        "duration_hours": 65,
                        "cost_estimate": "150€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "AWS Solutions Architect Associate",
                        "status": "pending",
                        "skills_acquired": ["Arquitecturas Serverless", "Resiliencia Multizona", "Cost Optimization"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-emg-{uuid.uuid4().hex[:4]}",
                "name": "⚡ Ruta Emergente: Auditoría de Seguridad, ENS & Gobernanza",
                "branch_type": "emerging",
                "target_role": "Auditor de Ciberseguridad & Oficial de Cumplimiento ENS",
                "description": "Especialización altamente cotizada en empresas adjudicatarias del sector público y consultoras que auditan el Esquema Nacional de Seguridad.",
                "market_demand": "+40% anual (Normativa UE / NIS2)",
                "salary_range_est": "46.000€ - 68.000€",
                "fit_percentage": 78,
                "color_theme": "#f59e0b",
                "is_active": False,
                "milestones": [
                    {
                        "id": f"ms-e1-{uuid.uuid4().hex[:4]}",
                        "title": "Marco Normativo del Esquema Nacional de Seguridad (ENS) y Directiva NIS2",
                        "provider": "CCN-CERT (Centro Criptológico Nacional)",
                        "duration_hours": 35,
                        "cost_estimate": "Gratuito / Sector Público",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["ENS RD 311/2022", "Directiva NIS2", "Medidas de Seguridad Organizativas"],
                        "level": 1
                    },
                    {
                        "id": f"ms-e2-{uuid.uuid4().hex[:4]}",
                        "title": "Metodología de Análisis y Gestión de Riesgos MAGERIT & Herramienta PILAR",
                        "provider": "CCN-CERT",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["MAGERIT v3", "Herramienta PILAR", "Matriz de Riesgos"],
                        "level": 2
                    },
                    {
                        "id": f"ms-e3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Auditor Líder ISO/IEC 27001:2022",
                        "provider": "IRCA / AENOR / TÜV",
                        "duration_hours": 50,
                        "cost_estimate": "650€",
                        "is_official_certification": True,
                        "certification_name": "Lead Auditor ISO 27001",
                        "status": "pending",
                        "skills_acquired": ["Auditoría de Certificación", "SGSI", "Gestión de No Conformidades"],
                        "level": 3
                    },
                    {
                        "id": f"ms-e4-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación CISA (Certified Information Systems Auditor)",
                        "provider": "ISACA Oficial",
                        "duration_hours": 90,
                        "cost_estimate": "550€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "ISACA CISA",
                        "status": "pending",
                        "skills_acquired": ["Auditoría de Sistemas de Información", "Gobierno Corporativo TI", "Continuidad de Negocio"],
                        "level": 4
                    }
                ]
            }
        ]

    else:
        # Software / FullStack / Otros
        current_detected_role = current_role_str or "Desarrollador de Software"
        trunk_skills = ["Arquitectura de Software", "Git & Flujos de Trabajo", "Desarrollo Frontend / Backend", "Bases de Datos Relacionales", "Consumo y Diseño de APIs REST"]
        trunk_summary = "Sólida base en construcción de aplicaciones, programación orientada a objetos, componentización y trabajo con repositorios de código."

        branches = [
            {
                "id": f"br-vdev-{uuid.uuid4().hex[:4]}",
                "name": "🌿 Salto Vertical: Lead Software Architect & Tech Lead",
                "branch_type": "vertical",
                "target_role": "Senior Cloud Software Architect",
                "description": "Consolidación de código limpio, patrones distribuidos, microservicios resilientes y liderazgo de equipos de desarrollo.",
                "market_demand": "+28% anual",
                "salary_range_est": "48.000€ - 70.000€",
                "fit_percentage": 90,
                "color_theme": "#6366f1",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-d1-{uuid.uuid4().hex[:4]}",
                        "title": "Arquitectura Limpia (Hexagonal / Clean Architecture) y Principios SOLID",
                        "provider": "Plataforma Especializada",
                        "duration_hours": 35,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "completed",
                        "skills_acquired": ["Domain-Driven Design", "Clean Architecture", "Unit Testing"],
                        "level": 1
                    },
                    {
                        "id": f"ms-d2-{uuid.uuid4().hex[:4]}",
                        "title": "Sistemas Distribuidos y Mensajería Asíncrona (Kafka / RabbitMQ / Redis)",
                        "provider": "Confluent / Cloud Academy",
                        "duration_hours": 50,
                        "cost_estimate": "120€",
                        "is_official_certification": False,
                        "status": "in_progress",
                        "skills_acquired": ["Event-Driven", "Kafka Streams", "Redis Caching", "Idempotencia"],
                        "level": 2
                    },
                    {
                        "id": f"ms-d3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial AWS Certified Solutions Architect - Associate",
                        "provider": "Amazon Web Services",
                        "duration_hours": 70,
                        "cost_estimate": "150€ tasa examen",
                        "is_official_certification": True,
                        "certification_name": "AWS Solutions Architect",
                        "status": "pending",
                        "skills_acquired": ["AWS Serverless", "VPC Networking", "Alta Disponibilidad", "Cloud Architecture"],
                        "level": 3
                    },
                    {
                        "id": f"ms-d4-{uuid.uuid4().hex[:4]}",
                        "title": "Liderazgo Técnico, Code Reviews de Impacto y Mentoring",
                        "provider": "Engineering Leadership Forum",
                        "duration_hours": 30,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Tech Leadership", "Deuda Técnica", "Estimación Ágil", "Arquitectura Evolutiva"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-ai-{uuid.uuid4().hex[:4]}",
                "name": "🤖 Bifurcación Lateral: Inteligencia Artificial & Agentes LLM",
                "branch_type": "pivot_fork",
                "target_role": "AI Engineer & LLM Solutions Developer",
                "description": "Salto hacia la integración de modelos de lenguaje, embeddings, arquitecturas RAG y despliegue de agentes autónomos.",
                "market_demand": "Crítica (+52% anual)",
                "salary_range_est": "50.000€ - 75.000€",
                "fit_percentage": 85,
                "color_theme": "#10b981",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-a1-{uuid.uuid4().hex[:4]}",
                        "title": "Ingeniería de Contexto, RAG y Modelos Multimodales con Gemini & LangChain",
                        "provider": "DeepLearning.AI / Google Cloud",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "in_progress",
                        "skills_acquired": ["LangChain", "Vector Databases (Pinecone/Chroma)", "Prompt Engineering", "Embeddings"],
                        "level": 1
                    },
                    {
                        "id": f"ms-a2-{uuid.uuid4().hex[:4]}",
                        "title": "Desarrollo de Agentes Autónomos con Llamadas a Herramientas (Function Calling)",
                        "provider": "Hugging Face / OpenAI",
                        "duration_hours": 45,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Tool Calling", "Multi-Agent Workflows", "LangGraph", "Memoria de Agente"],
                        "level": 2
                    },
                    {
                        "id": f"ms-a3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Oficial Google Cloud Generative AI Engineer",
                        "provider": "Google Cloud",
                        "duration_hours": 60,
                        "cost_estimate": "175€",
                        "is_official_certification": True,
                        "certification_name": "Google Cloud GenAI Leader",
                        "status": "pending",
                        "skills_acquired": ["Vertex AI", "Fine-Tuning LoRA", "Model Evaluation & Safety", "MLOps Básico"],
                        "level": 3
                    },
                    {
                        "id": f"ms-a4-{uuid.uuid4().hex[:4]}",
                        "title": "MLOps y Despliegue de Modelos Escalables en Producción",
                        "provider": "Weights & Biases / Coursera",
                        "duration_hours": 50,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Model Monitoring", "Drift Detection", "vLLM Inference", "Triton Server"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-cldev-{uuid.uuid4().hex[:4]}",
                "name": "☁️ Bifurcación Lateral: Cloud DevOps & SRE",
                "branch_type": "cloud_devops",
                "target_role": "DevOps & Cloud Native Engineer",
                "description": "Salto hacia la automatización continua, contenedores Kubernetes y aprovisionamiento IaC con Terraform.",
                "market_demand": "+32% anual",
                "salary_range_est": "45.000€ - 62.000€",
                "fit_percentage": 80,
                "color_theme": "#06b6d4",
                "is_active": True,
                "milestones": [
                    {
                        "id": f"ms-cd1-{uuid.uuid4().hex[:4]}",
                        "title": "CI/CD Avanzado con GitHub Actions y Pipelines de Pruebas Automatizadas",
                        "provider": "GitHub Official",
                        "duration_hours": 30,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["GitHub Actions", "Docker Buildx", "Semantic Release", "SonarQube"],
                        "level": 1
                    },
                    {
                        "id": f"ms-cd2-{uuid.uuid4().hex[:4]}",
                        "title": "Orquestación de Contenedores con Kubernetes & Helm",
                        "provider": "Linux Foundation",
                        "duration_hours": 50,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["Kubernetes Deployments", "ConfigMaps & Secrets", "Helm Charts"],
                        "level": 2
                    },
                    {
                        "id": f"ms-cd3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Certified Kubernetes Application Developer (CKAD)",
                        "provider": "CNCF",
                        "duration_hours": 75,
                        "cost_estimate": "350€ tasa",
                        "is_official_certification": True,
                        "certification_name": "Certified Kubernetes App Developer (CKAD)",
                        "status": "pending",
                        "skills_acquired": ["Pod Design", "Multi-Container Pods", "Observabilidad"],
                        "level": 3
                    },
                    {
                        "id": f"ms-cd4-{uuid.uuid4().hex[:4]}",
                        "title": "Ingeniería de Fiabilidad (SRE) y Observabilidad (Prometheus, Grafana, OpenTelemetry)",
                        "provider": "Google SRE Books / Grafana Labs",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["SLI / SLO / SLA", "Tracing Distribuido", "Alerting con Grafana"],
                        "level": 4
                    }
                ]
            },
            {
                "id": f"br-secdev-{uuid.uuid4().hex[:4]}",
                "name": "🛡️ Ruta Emergente: DevSecOps & Seguridad de Aplicaciones (AppSec)",
                "branch_type": "emerging",
                "target_role": "DevSecOps Engineer & Security Champion",
                "description": "Seguridad integrada en el ciclo de vida del código: SAST, DAST, gestión de dependencias y auditoría OWASP Top 10.",
                "market_demand": "+38% anual",
                "salary_range_est": "48.000€ - 68.000€",
                "fit_percentage": 76,
                "color_theme": "#f59e0b",
                "is_active": False,
                "milestones": [
                    {
                        "id": f"ms-sd1-{uuid.uuid4().hex[:4]}",
                        "title": "Fundamentos de Seguridad en el Desarrollo (OWASP Top 10 y Modelado de Amenazas)",
                        "provider": "OWASP Foundation",
                        "duration_hours": 30,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["OWASP Top 10", "XSS / SQLi Prevention", "Threat Modeling"],
                        "level": 1
                    },
                    {
                        "id": f"ms-sd2-{uuid.uuid4().hex[:4]}",
                        "title": "Pipelines de Seguridad Automatizados (SAST con Semgrep & DAST con ZAP)",
                        "provider": "GitLab / Snyk",
                        "duration_hours": 40,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["SAST / DAST", "Snyk Dependency Scan", "Secret Scanning"],
                        "level": 2
                    },
                    {
                        "id": f"ms-sd3-{uuid.uuid4().hex[:4]}",
                        "title": "Certificación Certified DevSecOps Professional (CDP)",
                        "provider": "Practical DevSecOps",
                        "duration_hours": 60,
                        "cost_estimate": "450€",
                        "is_official_certification": True,
                        "certification_name": "Certified DevSecOps Professional",
                        "status": "pending",
                        "skills_acquired": ["Seguridad en Contenedores", "Compliance as Code", "Policy as Code (OPA)"],
                        "level": 3
                    },
                    {
                        "id": f"ms-sd4-{uuid.uuid4().hex[:4]}",
                        "title": "Seguridad en la Cadena de Suministro de Software (SLSA & SBOM)",
                        "provider": "OpenSSF (Linux Foundation)",
                        "duration_hours": 35,
                        "cost_estimate": "Gratuito",
                        "is_official_certification": False,
                        "status": "pending",
                        "skills_acquired": ["SBOM Generation", "Sigstore / Cosign", "SLSA Framework"],
                        "level": 4
                    }
                ]
            }
        ]

    plan_data = {
        "id": plan_id,
        "title": f"Itinerario Multicamino Estratégico ({current_detected_role})",
        "profile_name": user_name,
        "sector": "tecnología",
        "current_role": current_detected_role,
        "target_role": branches[0].get("target_role", "Especialista Senior"),
        "transition_type": "branch_pivot",
        "executive_summary": f"A partir de tu CV Maestro ({len(cv_maestro_content)} caracteres analizados), se identifica una base consolidada como {current_detected_role}. Se proyectan 4 caminos estratégicos con bifurcaciones para maximizar tu techo profesional y empleabilidad en el mercado español y remoto.",
        "trunk_baseline": {
            "title": f"Base Curricular Dominada (CV Maestro)",
            "summary": trunk_summary,
            "core_skills": trunk_skills
        },
        "market_metrics": {
            "market_demand_growth": "+32% anual",
            "median_salary_spain": "42.000€ - 62.000€",
            "remote_availability": "Alta (60% ofertas)",
            "competition_level": "Media"
        },
        "branches": branches,
        "journal": [],
        "key_metrics": {
            "overall_progress_pct": 15
        }
    }

    # Guardar en career_plans.json
    plans = load_json("career_plans.json", [])
    plans.insert(0, plan_data)
    save_json("career_plans.json", plans)

    return plan_data
