from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

from backend.services.agent_browser import (
    run_agent_job_search,
    diagnose_cv_profile,
    agent_chat_conversation
)
from backend.services.career_advisor import generate_ai_career_plan
from backend.services.cv_tailor_service import (
    generate_tailored_application_package,
    generate_full_job_report_markdown
)
from backend.services.data_store import load_json, save_json
from backend.services.job_history_service import (
    normalize_and_verify_job_url,
    get_discovered_jobs_history,
    clear_discovered_history,
    is_job_already_known,
    record_discovered_jobs
)

from backend.services.job_url_extractor import extract_and_analyze_job_from_url
from backend.services.job_search_service import search_real_jobs

router = APIRouter(prefix="/api/agent", tags=["AI Agent"])

class AnalyzeJobUrlRequest(BaseModel):
    url: str

class RealJobSearchRequest(BaseModel):
    keywords: str = "Python"
    location: str = "España"
    platform: str = "all"
    remote: bool = False
    published_filter: str = "today"
    max_results: int = 5

class JobSearchRequest(BaseModel):
    query: str = "Python"
    location: str = "Remoto"
    contract_type: str = "Cualquiera"
    published_filter: str = "today"  # "today" (últimas 24h) | "any" (cualquiera)

class CareerPlanRequest(BaseModel):
    target_role: Optional[str] = None
    transition_type: str = "vertical_leap"

class TailorApplicationRequest(BaseModel):
    role: str
    company: str
    description: Optional[str] = ""
    salary_range: Optional[str] = ""
    location: Optional[str] = ""
    portal: Optional[str] = "Portal de Empleo"
    url: Optional[str] = ""

class JobReportRequest(BaseModel):
    job: Dict[str, Any]

class SaveJobRequest(BaseModel):
    company: str
    role: str
    url: Optional[str] = None
    portal: Optional[str] = "Google"
    description: Optional[str] = None
    salary_range: Optional[str] = None
    location_city: Optional[str] = None
    location_type: str = "remote"
    notes: Optional[str] = None
    wait_period_days: int = 15
    follow_up_days: int = 7
    ats_score: Optional[int] = None
    ats_match_details: Optional[Dict[str, Any]] = None
    keywords: Optional[List[str]] = []
    ats_optimized_cv_url: Optional[str] = None
    ats_optimized_cv_content: Optional[str] = None
    cover_letter: Optional[str] = None

class ChatMessagePayload(BaseModel):
    messages: List[Dict[str, str]] = []
    user_message: str

@router.post("/analyze-job-url")
async def agent_analyze_job_url(req: AnalyzeJobUrlRequest):
    """Inspecciona cualquier enlace web de oferta de empleo, extrae el texto y calcula el Match ATS."""
    try:
        job_data = await extract_and_analyze_job_from_url(req.url)
        return job_data
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analizando la oferta web: {str(e)}")

@router.post("/tailor-application")
async def agent_tailor_application(req: TailorApplicationRequest):
    """Genera paquete de candidatura ATS: Análisis, Viñetas STAR, CV Adaptado y Carta de Presentación."""
    package = await generate_tailored_application_package(
        role=req.role,
        company=req.company,
        description=req.description or "",
        salary_range=req.salary_range or "",
        location=req.location or "",
        portal=req.portal or "Portal de Empleo",
        job_url=req.url or ""
    )
    return package

@router.post("/job-report")
async def agent_job_report(req: JobReportRequest):
    """Genera el informe exhaustivo en Markdown de la oferta siguiendo el protocolo de la skill agente-busqueda-empleo.md."""
    try:
        report_md = await generate_full_job_report_markdown(req.job)
        return {
            "status": "success",
            "markdown_report": report_md,
            "role": req.job.get("role", "Oferta"),
            "company": req.job.get("company", "Empresa")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando informe de la oferta: {str(e)}")

@router.post("/search-jobs")
async def agent_search_jobs(req: JobSearchRequest):
    result = await run_agent_job_search(
        query=req.query,
        location=req.location,
        contract_type=req.contract_type,
        published_filter=req.published_filter
    )
    return result

@router.post("/search-real-jobs")
async def agent_search_real_jobs(req: RealJobSearchRequest):
    """Consulta directa a los proveedores nativos y universales devolviendo enlaces exactos verificados."""
    jobs = await search_real_jobs(
        keywords=req.keywords,
        location=req.location,
        platform=req.platform,
        remote=req.remote,
        published_filter=req.published_filter,
        max_results=req.max_results
    )
    return {"jobs": [j.model_dump() for j in jobs], "count": len(jobs)}

@router.get("/cv-diagnostics")
async def agent_cv_diagnostics():
    return await diagnose_cv_profile()

@router.post("/chat")
async def agent_chat(payload: ChatMessagePayload):
    return await agent_chat_conversation(
        messages=payload.messages,
        user_message=payload.user_message
    )

@router.post("/career-advisor")
def agent_career_advisor(req: CareerPlanRequest):
    plan = generate_ai_career_plan(
        target_role=req.target_role or "",
        transition_type=req.transition_type
    )
    return plan

@router.get("/discovered-history")
def get_agent_discovered_history():
    """Devuelve las estadísticas y las últimas ofertas descubiertas por el agente."""
    history = get_discovered_jobs_history()
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_count = sum(1 for h in history if h.get("date") == today_str)
    return {
        "total_discovered": len(history),
        "today_discovered": today_count,
        "recent_jobs": history[:30]
    }

@router.delete("/discovered-history")
def clear_agent_discovered_history():
    """Limpia el historial de ofertas descubiertas."""
    clear_discovered_history()
    return {"message": "Historial de ofertas descubiertas reiniciado exitosamente."}

@router.post("/save-to-pipeline")
def save_agent_job_to_pipeline(req: SaveJobRequest):
    apps = load_json("applications.json", [])
    
    # Asegurar URL funcional y directa
    verified_url = normalize_and_verify_job_url(
        raw_url=req.url,
        role=req.role,
        company=req.company,
        portal=req.portal or "Google / Portales",
        location=req.location_city or req.location_type or "Remoto"
    )

    # Comprobar si ya existe por URL o empresa/puesto
    for a in apps:
        if verified_url and a.get("url") == verified_url:
            return {"message": "Esta oferta ya se encuentra en tu pipeline", "app": a}
        if a.get("company").lower().strip() == req.company.lower().strip() and a.get("role").lower().strip() == req.role.lower().strip():
            return {"message": "Esta oferta ya se encuentra en tu pipeline", "app": a}

    now_str = datetime.now().strftime("%Y-%m-%d")
    now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_app = {
        "id": f"app-{uuid.uuid4().hex[:8]}",
        "company": req.company.strip(),
        "role": req.role.strip(),
        "sector": "general",
        "url": verified_url,
        "portal": req.portal or "Google / Portales",
        "description": req.description or "",
        "salary_range": req.salary_range,
        "location_type": req.location_type,
        "location_city": req.location_city or "100% Remoto",
        "status": "pending_action",  # Estado 1: Ofertas encontradas / recibidas (Pendiente de acción)
        "created_at": now_str,
        "application_date": now_str,
        "sent_date": None,
        "in_progress_date": None,
        "discarded_date": None,
        "wait_period_days": req.wait_period_days or 15,
        "discard_retention_days": 30,
        "is_archived": False,
        "notes": req.notes or "Importada mediante Agente de IA",
        "contact_person": "Reclutador / Portal",
        "is_active_url": True,
        "last_url_check": datetime.now().isoformat(),
        "ats_score": req.ats_score,
        "ats_match_details": req.ats_match_details,
        "keywords": req.keywords or [],
        "ats_optimized_cv_url": req.ats_optimized_cv_url,
        "ats_optimized_cv_content": req.ats_optimized_cv_content,
        "cover_letter": req.cover_letter,
        "coletillas": [
            {
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": now_dt_str,
                "author": "Agente IA",
                "content": f"Oferta descubierta por el Agente IA y agregada a 'Ofertas Encontradas/Recibidas'. Match ATS estimado: {req.ats_score or 0}%. Enlace directo verificado.",
                "category": "sistema"
            }
        ],
        "interactions": []
    }
    apps.insert(0, new_app)
    save_json("applications.json", apps)

    # Registrar también en el historial de descubrimientos
    record_discovered_jobs([{
        "company": req.company,
        "role": req.role,
        "url": verified_url,
        "portal": req.portal or "Google / Portales",
        "salary_range": req.salary_range,
        "location": req.location_city
    }], query=req.role)

    return {"message": "¡Oferta añadida a Ofertas Encontradas (Pendiente de acción)!", "app": new_app}

@router.post("/save-career-plan")
def save_agent_career_plan(plan_data: Dict[str, Any]):
    plans = load_json("career_plans.json", [])
    if not plan_data.get("id"):
        plan_data["id"] = f"cp-{uuid.uuid4().hex[:6]}"
    plans.append(plan_data)
    save_json("career_plans.json", plans)
    return {"message": "¡Plan de carrera importado exitosamente a tu Career Studio!", "plan": plan_data}
