from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

from backend.models.application import (
    Application,
    ApplicationCreate,
    ApplicationUpdate,
    ColetillaCreate,
    ColetillaNote,
    Interaction
)
from backend.services.data_store import load_json, save_json
from backend.services.url_checker import check_job_url
from backend.services.application_lifecycle import (
    process_applications_lifecycle,
    calculate_monthly_stats
)
from backend.services.cv_tailor_service import generate_tailored_application_package
from backend.services.cv_evaluator_skill_service import evaluate_cv_with_recruiter_skill

router = APIRouter(prefix="/api/applications", tags=["Applications"])
DATA_FILE = "applications.json"

@router.get("/")
def get_applications(include_archived: bool = Query(False, description="Incluir ofertas archivadas (+30 días en descartadas)")):
    apps = load_json(DATA_FILE, [])
    processed, has_changes = process_applications_lifecycle(apps)
    if has_changes:
        save_json(DATA_FILE, processed)

    if not include_archived:
        # Para el Kanban: solo ofertas activas en el pipeline
        return [a for a in processed if not a.get("is_archived", False)]
    return processed

@router.get("/history")
def get_applications_history():
    """Devuelve todo el historial completo de candidaturas (incluyendo las archivadas)."""
    apps = load_json(DATA_FILE, [])
    processed, has_changes = process_applications_lifecycle(apps)
    if has_changes:
        save_json(DATA_FILE, processed)
    return processed

@router.get("/stats/monthly")
def get_monthly_activity_stats():
    """Devuelve estadísticas agrupadas por mes y KPIs del candidato."""
    apps = load_json(DATA_FILE, [])
    processed, has_changes = process_applications_lifecycle(apps)
    if has_changes:
        save_json(DATA_FILE, processed)
    return calculate_monthly_stats(processed)

@router.post("/", status_code=201)
def create_application(payload: ApplicationCreate):
    apps = load_json(DATA_FILE, [])
    now_date = datetime.now().strftime("%Y-%m-%d")
    
    app_data = payload.model_dump()
    app_id = f"app-{uuid.uuid4().hex[:8]}"
    app_data["id"] = app_id
    app_data["created_at"] = now_date
    app_data["application_date"] = payload.application_date or now_date
    
    # Si se crea directamente como enviada, registrar sent_date
    if app_data.get("status") == "sent" and not app_data.get("sent_date"):
        app_data["sent_date"] = now_date
    
    new_app = Application(**app_data)
    apps.insert(0, new_app.model_dump())
    save_json(DATA_FILE, apps)
    return new_app

@router.get("/{app_id}")
def get_application(app_id: str):
    apps = load_json(DATA_FILE, [])
    processed, has_changes = process_applications_lifecycle(apps)
    if has_changes:
        save_json(DATA_FILE, processed)

    for app in processed:
        if app.get("id") == app_id:
            return app
    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.put("/{app_id}")
def update_application(app_id: str, payload: ApplicationUpdate):
    apps = load_json(DATA_FILE, [])
    now_date = datetime.now().strftime("%Y-%m-%d")
    now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            updated_data = payload.model_dump(exclude_unset=True)
            old_status = app.get("status")
            new_status = updated_data.get("status", old_status)

            # Transición a 'sent' -> registrar fecha de envío
            if new_status == "sent" and old_status != "sent":
                updated_data["sent_date"] = now_date
                if "coletillas" not in app:
                    app["coletillas"] = []
                app["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": now_dt_str,
                    "author": "Candidato",
                    "content": f"Candidatura enviada a la empresa. Comienza periodo de espera de {app.get('wait_period_days', 15)} días.",
                    "category": "contacto"
                })

            # Transición a 'in_progress' -> registrar fecha y exigir o anotar motivación
            if new_status == "in_progress" and old_status != "in_progress":
                updated_data["in_progress_date"] = now_date
                reason = updated_data.get("in_progress_reason") or "Contacto inicial de la empresa"
                if "coletillas" not in app:
                    app["coletillas"] = []
                app["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": now_dt_str,
                    "author": "Candidato",
                    "content": f"Oferta en proceso activo: {reason}",
                    "category": "entrevista"
                })

            # Transición a 'discarded' -> registrar fecha de descarte
            if new_status == "discarded" and old_status != "discarded":
                updated_data["discarded_date"] = now_date
                disc_reason = updated_data.get("discard_reason") or "Descarte manual"
                if "coletillas" not in app:
                    app["coletillas"] = []
                app["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": now_dt_str,
                    "author": "Candidato",
                    "content": f"Candidatura descartada. Motivo: {disc_reason}",
                    "category": "feedback"
                })

            apps[i].update(updated_data)
            save_json(DATA_FILE, apps)

            # Devolver con ciclo de vida calculado
            processed, _ = process_applications_lifecycle([apps[i]])
            return processed[0]

    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.post("/{app_id}/coletillas")
def add_coletilla_to_application(app_id: str, coletilla: ColetillaCreate):
    """Agrega una coletilla / apunte de seguimiento a la oferta."""
    apps = load_json(DATA_FILE, [])
    now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            if "coletillas" not in apps[i]:
                apps[i]["coletillas"] = []

            new_note = {
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": now_dt_str,
                "author": coletilla.author or "Candidato",
                "content": coletilla.content.strip(),
                "category": coletilla.category or "general"
            }
            apps[i]["coletillas"].append(new_note)
            save_json(DATA_FILE, apps)

            processed, _ = process_applications_lifecycle([apps[i]])
            return processed[0]

    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.post("/{app_id}/extend-wait")
def extend_application_wait(app_id: str, extra_days: int = Query(7, ge=1, le=30)):
    """Extiende el plazo de espera de la candidatura antes de su auto-descarte."""
    apps = load_json(DATA_FILE, [])
    now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            curr_wait = apps[i].get("wait_period_days", 15)
            new_wait = curr_wait + extra_days
            apps[i]["wait_period_days"] = new_wait

            if "coletillas" not in apps[i]:
                apps[i]["coletillas"] = []
            apps[i]["coletillas"].append({
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": now_dt_str,
                "author": "Candidato",
                "content": f"Plazo de espera extendido en +{extra_days} días (Nuevo plazo: {new_wait} días).",
                "category": "sistema"
            })

            save_json(DATA_FILE, apps)
            processed, _ = process_applications_lifecycle([apps[i]])
            return processed[0]

    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.post("/{app_id}/reopen")
def reopen_application(app_id: str, target_status: str = Query("sent")):
    """Reabre una oferta descartada o archivada devolviéndola al pipeline activo."""
    apps = load_json(DATA_FILE, [])
    now_date = datetime.now().strftime("%Y-%m-%d")
    now_dt_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            apps[i]["status"] = target_status
            apps[i]["is_archived"] = False
            apps[i]["discarded_date"] = None
            apps[i]["discard_reason"] = None
            
            if target_status == "sent":
                apps[i]["sent_date"] = now_date

            if "coletillas" not in apps[i]:
                apps[i]["coletillas"] = []
            apps[i]["coletillas"].append({
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": now_dt_str,
                "author": "Candidato",
                "content": f"Candidatura reabierta y devuelta al estado '{target_status}'.",
                "category": "contacto"
            })

            save_json(DATA_FILE, apps)
            processed, _ = process_applications_lifecycle([apps[i]])
            return processed[0]

    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.delete("/{app_id}")
def delete_application(app_id: str):
    apps = load_json(DATA_FILE, [])
    new_apps = [a for a in apps if a.get("id") != app_id]
    if len(new_apps) == len(apps):
        raise HTTPException(status_code=404, detail="Candidatura no encontrada")
    save_json(DATA_FILE, new_apps)
    return {"message": "Candidatura eliminada correctamente"}

@router.post("/{app_id}/check-url")
async def verify_application_url(app_id: str):
    apps = load_json(DATA_FILE, [])
    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            url = app.get("url")
            if not url:
                return {"is_active": False, "message": "No hay URL asignada a esta candidatura"}
            
            check_result = await check_job_url(url)
            apps[i]["is_active_url"] = check_result["is_active"]
            apps[i]["last_url_check"] = check_result["checked_at"]
            
            if not check_result["is_active"] and apps[i]["status"] not in ["in_progress"]:
                if "coletillas" not in apps[i]:
                    apps[i]["coletillas"] = []
                apps[i]["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "author": "Sistema URL Checker",
                    "content": f"Alerta: La oferta original en {url} ya no parece estar activa en el portal.",
                    "category": "sistema"
                })

            save_json(DATA_FILE, apps)
            return {
                "app_id": app_id,
                "url": url,
                **check_result
            }
    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.post("/{app_id}/generate-materials")
async def generate_application_materials(app_id: str):
    """Genera bajo demanda el CV Adaptado ATS y Carta de Presentación para una candidatura existente."""
    apps = load_json(DATA_FILE, [])
    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            package = await generate_tailored_application_package(
                role=app.get("role", ""),
                company=app.get("company", ""),
                description=app.get("description", ""),
                salary_range=app.get("salary_range", ""),
                location=app.get("location_city", ""),
                portal=app.get("portal", "Portal Web"),
                job_url=app.get("url", "")
            )
            
            apps[i]["ats_score"] = package["ats_score"]
            apps[i]["keywords"] = package["keywords"]
            apps[i]["ats_match_details"] = {
                "matching_skills": package["matching_skills"],
                "missing_skills": package["missing_skills"],
                "star_bullets": package["star_bullets"]
            }
            apps[i]["ats_optimized_cv_content"] = package["tailored_cv"]
            apps[i]["cover_letter"] = package["cover_letter"]
            
            # Registrar coletilla
            if "coletillas" not in apps[i]:
                apps[i]["coletillas"] = []
            apps[i]["coletillas"].append({
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "author": "Agente IA",
                "content": f"Materiales de candidatura generados con éxito: CV Adaptado ATS y Carta de Presentación ({package['ats_score']}% Match).",
                "category": "sistema"
            })
            
            save_json(DATA_FILE, apps)
            processed, _ = process_applications_lifecycle([apps[i]])
            return {
                "status": "success",
                "message": "Materiales de candidatura generados exitosamente.",
                "application": processed[0],
                "package": package
            }
            
    raise HTTPException(status_code=404, detail="Candidatura no encontrada")

@router.post("/{app_id}/evaluate-cv")
async def evaluate_application_cv(app_id: str):
    """Evalúa la adecuación e idoneidad del CV para la candidatura usando la skill de Recruiter & ATS."""
    apps = load_json(DATA_FILE, [])
    for i, app in enumerate(apps):
        if app.get("id") == app_id:
            evaluation = await evaluate_cv_with_recruiter_skill(application=app)
            
            apps[i]["ats_score"] = evaluation["real_ats_score"]
            apps[i]["ats_match_details"] = evaluation
            
            # Registrar coletilla en el historial
            if "coletillas" not in apps[i]:
                apps[i]["coletillas"] = []
            apps[i]["coletillas"].append({
                "id": f"col-{uuid.uuid4().hex[:6]}",
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "author": "Skill Recruiter ATS",
                "content": f"Auditoría de idoneidad: {evaluation['real_ats_score']}% Match. Veredicto: {evaluation['verdict']}.",
                "category": "sistema"
            })
            
            save_json(DATA_FILE, apps)
            processed, _ = process_applications_lifecycle([apps[i]])
            return {
                "status": "success",
                "message": f"Auditoría completada ({evaluation['real_ats_score']}% Match).",
                "application": processed[0],
                "evaluation": evaluation
            }
            
    raise HTTPException(status_code=404, detail="Candidatura no encontrada")


