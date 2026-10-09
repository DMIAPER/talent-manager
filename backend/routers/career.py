from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uuid
from datetime import datetime

from backend.models.career_plan import (
    CareerPlan,
    CareerAdvisorChatRequest,
    GenerateRoadmapTreeRequest,
    MilestoneSyncPayload,
    CareerJournalEntry,
    SelectBranchesRequest
)
from backend.services.data_store import load_json, save_json
from backend.services.career_advisor import (
    chat_with_career_advisor,
    generate_career_roadmap_tree,
    generate_career_paths_from_master_cv,
    sync_completed_milestone_to_profile,
    sync_milestone_direct_to_master_cv
)

from backend.services.course_search_service import (
    run_agent_course_search,
    attach_course_to_milestone_in_plan,
    verify_course_link,
    test_and_verify_links
)

router = APIRouter(prefix="/api/career", tags=["Career & Skills"])
DATA_FILE = "career_plans.json"

@router.get("/plans")
def get_career_plans():
    plans = load_json(DATA_FILE, [])
    return plans

@router.get("/plans/{plan_id}")
def get_career_plan(plan_id: str):
    plans = load_json(DATA_FILE, [])
    for p in plans:
        if p.get("id") == plan_id:
            return p
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")

@router.post("/advisor/chat")
async def chat_career_advisor_endpoint(req: CareerAdvisorChatRequest):
    """Conversa con el Consultor Estratégico de Carrera IA."""
    reply = await chat_with_career_advisor(
        messages=req.messages,
        user_message=req.user_message,
        plan_id=req.plan_id
    )
    return reply

@router.post("/roadmap/generate-from-cv-master")
def generate_roadmap_from_cv_master_endpoint(req: GenerateRoadmapTreeRequest):
    """
    Genera un itinerario multicamino completo leyendo directamente el CV Maestro (cv-maestro.md),
    con tronco común y bifurcaciones estratégicas (Vertical, Especializaciones Laterales y Emergente).
    """
    plan = generate_career_paths_from_master_cv(
        user_intent=req.user_intent or "",
        target_role=req.target_role or ""
    )
    return plan

@router.post("/roadmap/generate")
def generate_roadmap_tree_endpoint(req: GenerateRoadmapTreeRequest):
    """Genera un árbol estructurado de carrera y formación con ramales y bifurcaciones."""
    plan = generate_career_paths_from_master_cv(
        user_intent=req.user_intent or "",
        target_role=req.target_role or ""
    )
    return plan

@router.post("/plans/{plan_id}/branches/select")
def select_branches_endpoint(plan_id: str, req: SelectBranchesRequest):
    """Actualiza de forma interactiva las bifurcaciones activas seleccionadas por el usuario."""
    plans = load_json(DATA_FILE, [])
    for i, p in enumerate(plans):
        if p.get("id") == plan_id:
            for j, br in enumerate(p.get("branches", [])):
                plans[i]["branches"][j]["is_active"] = br.get("id") in req.branch_ids
            save_json(DATA_FILE, plans)
            return {"plan_id": plan_id, "active_branch_ids": req.branch_ids, "plan": plans[i]}
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")

@router.post("/plans/{plan_id}/milestones/{milestone_id}/sync-to-master-cv")
def sync_milestone_direct_endpoint(plan_id: str, milestone_id: str):
    """Sincroniza directamente en 1 clic un hito completado al CV Maestro y Perfil Oficial."""
    res = sync_milestone_direct_to_master_cv(plan_id, milestone_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message", "Error al sincronizar"))
    return res

@router.post("/plans/{plan_id}/branch/{branch_id}/toggle")
def toggle_branch_active_endpoint(plan_id: str, branch_id: str):
    """Activa o desactiva una bifurcación de especialización del árbol."""
    plans = load_json(DATA_FILE, [])
    for i, p in enumerate(plans):
        if p.get("id") == plan_id:
            for j, br in enumerate(p.get("branches", [])):
                if br.get("id") == branch_id:
                    new_val = not br.get("is_active", True)
                    plans[i]["branches"][j]["is_active"] = new_val
                    save_json(DATA_FILE, plans)
                    return {"plan_id": plan_id, "branch_id": branch_id, "is_active": new_val}
            raise HTTPException(status_code=404, detail="Bifurcación no encontrada")
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")

@router.post("/plans/{plan_id}/milestones/{milestone_id}/toggle")
def toggle_milestone_status(plan_id: str, milestone_id: str):
    """Conmuta el estado de un hito formativo (pending -> in_progress -> completed)."""
    plans = load_json(DATA_FILE, [])
    for i, p in enumerate(plans):
        if p.get("id") == plan_id:
            found = False
            # Buscar en branches
            for j, br in enumerate(p.get("branches", [])):
                for k, ms in enumerate(br.get("milestones", [])):
                    if ms.get("id") == milestone_id:
                        curr = ms.get("status", "pending")
                        next_status = "in_progress" if curr == "pending" else ("completed" if curr == "in_progress" else "pending")
                        plans[i]["branches"][j]["milestones"][k]["status"] = next_status
                        if next_status == "completed":
                            plans[i]["branches"][j]["milestones"][k]["completion_date"] = datetime.now().strftime("%Y-%m-%d")
                        found = True
                        break
                if found:
                    break

            # Buscar en roadmap tradicional para retrocompatibilidad
            if not found:
                for k, ms in enumerate(p.get("roadmap", [])):
                    if ms.get("id") == milestone_id:
                        curr = ms.get("status", "pending")
                        next_status = "in_progress" if curr == "pending" else ("completed" if curr == "in_progress" else "pending")
                        plans[i]["roadmap"][k]["status"] = next_status
                        found = True
                        break

            if found:
                # Recalcular porcentaje general
                all_milestones = []
                for br in plans[i].get("branches", []):
                    all_milestones.extend(br.get("milestones", []))
                if not all_milestones:
                    all_milestones = plans[i].get("roadmap", [])

                total_m = len(all_milestones)
                comp_m = sum(1 for m in all_milestones if m.get("status") == "completed")
                pct = int((comp_m / max(1, total_m)) * 100)
                if "key_metrics" not in plans[i]:
                    plans[i]["key_metrics"] = {}
                plans[i]["key_metrics"]["overall_progress_pct"] = pct

                save_json(DATA_FILE, plans)
                return {"plan_id": plan_id, "milestone_id": milestone_id, "new_status": next_status, "overall_progress_pct": pct}

            raise HTTPException(status_code=404, detail="Hito no encontrado")
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")

@router.post("/plans/{plan_id}/milestones/{milestone_id}/sync-to-profile")
def sync_milestone_endpoint(plan_id: str, milestone_id: str, payload: MilestoneSyncPayload):
    """Sincroniza un hito completado con el Perfil Oficial y CV Maestro tras confirmación del modal."""
    res = sync_completed_milestone_to_profile(
        plan_id=plan_id,
        milestone_id=milestone_id,
        sync_data=payload.model_dump()
    )
    return res

@router.post("/plans/{plan_id}/journal")
def add_journal_entry(plan_id: str, entry: CareerJournalEntry):
    """Añade una nota o reflexión a la bitácora de aprendizaje del plan de carrera."""
    plans = load_json(DATA_FILE, [])
    for i, p in enumerate(plans):
        if p.get("id") == plan_id:
            if "journal" not in plans[i]:
                plans[i]["journal"] = []
            
            entry_dict = entry.model_dump()
            if not entry_dict.get("id"):
                entry_dict["id"] = f"jrn-{uuid.uuid4().hex[:6]}"
            plans[i]["journal"].insert(0, entry_dict)
            save_json(DATA_FILE, plans)
            return {"status": "success", "entry": entry_dict, "journal": plans[i]["journal"]}
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")

@router.delete("/plans/{plan_id}/journal/{journal_id}")
def delete_journal_entry(plan_id: str, journal_id: str):
    """Elimina una entrada de la bitácora de aprendizaje."""
    plans = load_json(DATA_FILE, [])
    for i, p in enumerate(plans):
        if p.get("id") == plan_id:
            if "journal" in plans[i]:
                plans[i]["journal"] = [j for j in plans[i]["journal"] if j.get("id") != journal_id]
                save_json(DATA_FILE, plans)
                return {"status": "success", "journal": plans[i]["journal"]}
    raise HTTPException(status_code=404, detail="Plan de carrera no encontrado")


class CourseSearchRequest(BaseModel):
    query: str
    milestone_title: Optional[str] = None
    plan_id: Optional[str] = None
    free_only: bool = False
    official_cert_only: bool = False

class AttachCourseRequest(BaseModel):
    exact_url: str
    title: Optional[str] = "Curso Seleccionado"
    provider: Optional[str] = "Proveedor Oficial"
    cost_type: Optional[str] = "Gratuito"
    duration_est: Optional[str] = None
    duration_hours: Optional[int] = None
    skills_covered: Optional[List[str]] = []

@router.post("/courses/search")
async def search_courses_endpoint(req: CourseSearchRequest):
    """
    Rastrea en tiempo real cursos y certificaciones oficiales en internet con enlaces verificados (Cero fabricación).
    """
    res = await run_agent_course_search(
        query=req.query,
        milestone_title=req.milestone_title,
        plan_id=req.plan_id,
        free_only=req.free_only,
        official_cert_only=req.official_cert_only
    )
    return res

@router.post("/plans/{plan_id}/milestones/{milestone_id}/attach-course")
def attach_course_endpoint(plan_id: str, milestone_id: str, req: AttachCourseRequest):
    """
    Vincula un curso verificado encontrado en internet a un hito concreto del plan de carrera.
    """
    res = attach_course_to_milestone_in_plan(
        plan_id=plan_id,
        milestone_id=milestone_id,
        course_data=req.model_dump()
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

class LinkVerificationRequest(BaseModel):
    url: str

class BatchLinkVerificationRequest(BaseModel):
    urls: List[str]

@router.post("/courses/verify-link")
async def verify_link_endpoint(req: LinkVerificationRequest):
    """
    Prueba y audita en tiempo real si un enlace a un curso responde adecuadamente
    y no produce error 404 (Página no encontrada).
    """
    res = await verify_course_link(req.url)
    return res

@router.post("/courses/verify-links-batch")
async def verify_links_batch_endpoint(req: BatchLinkVerificationRequest):
    """
    Prueba masivamente en paralelo una lista de enlaces para verificar disponibilidad.
    """
    res = await test_and_verify_links(req.urls)
    return res

@router.post("/plans/{plan_id}/milestones/{milestone_id}/upload-certificate")
async def upload_milestone_certificate_endpoint(
    plan_id: str,
    milestone_id: str,
    file: UploadFile = File(...)
):
    """
    Permite al usuario subir su certificado de superación del curso/hito (PDF o imagen).
    La IA extrae el texto, audita la correspondencia temática con el hito,
    marca el hito como completado y lo sincroniza de inmediato al CV Maestro.
    """
    from backend.services.certificate_verifier import verify_and_complete_milestone_certificate
    try:
        content = await file.read()
        res = await verify_and_complete_milestone_certificate(
            plan_id=plan_id,
            milestone_id=milestone_id,
            file_bytes=content,
            filename=file.filename or "certificado.pdf"
        )
        if res.get("status") == "error":
            raise HTTPException(status_code=400, detail=res.get("message"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al evaluar y registrar certificado: {str(e)}")

