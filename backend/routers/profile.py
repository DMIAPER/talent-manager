from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import PlainTextResponse
from typing import Dict, Any

from backend.services.profile_service import (
    load_profile,
    save_profile,
    reset_entire_application,
    parse_cv_text_into_profile,
    audit_profile_as_recruiter,
    extract_skills_from_profile_with_ai,
    CV_MAESTRO_PATH
)
from backend.services.cv_parser import extract_text_from_bytes

from backend.services.profile_audit_service import (
    get_saved_audit,
    run_profile_audit,
    apply_profile_enhancements as apply_enhancements_service,
    toggle_roadmap_step,
    generate_skill_quiz,
    verify_skill_quiz
)

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("/")
def get_user_profile():
    return load_profile()

@router.put("/")
def update_user_profile(profile_data: Dict[str, Any]):
    return save_profile(profile_data)

@router.post("/upload-and-parse")
async def upload_and_parse_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        is_pdf = file.filename.lower().endswith(".pdf")

        raw_text = ""
        try:
            raw_text = extract_text_from_bytes(content, file.filename)
        except Exception as parse_err:
            if not is_pdf:
                raise parse_err

        parsed_profile = await parse_cv_text_into_profile(
            raw_text=raw_text,
            pdf_bytes=content if is_pdf else None,
            filename=file.filename
        )
        return {
            "status": "success",
            "message": f"Currículum '{file.filename}' procesado y perfil autocompletado con éxito.",
            "profile": parsed_profile
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando archivo: {str(e)}")

@router.post("/upload-certificate")
async def upload_certificate_endpoint(file: UploadFile = File(...)):
    """
    Sube un certificado o diploma de curso realizado (PDF o imagen) en 'MI PERFIL'.
    La IA evalúa la titulación, extrae emisor, año, horas, competencias acreditadas
    y lo registra en 'Formación y Certificaciones' con sincronización en CV Maestro.
    """
    from backend.services.certificate_verifier import evaluate_and_register_profile_certificate
    try:
        content = await file.read()
        res = await evaluate_and_register_profile_certificate(
            file_bytes=content,
            filename=file.filename or "certificado.pdf"
        )
        if res.get("status") == "error":
            raise HTTPException(status_code=400, detail=res.get("message"))
        return res
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando certificado: {str(e)}")

@router.post("/upload-certificates-batch")
async def upload_certificates_batch_endpoint(files: list[UploadFile] = File(...)):
    """
    Sube un lote de certificados y diplomas en PDF para registrar de forma masiva
    toda la formación previa del usuario en el perfil y CV Maestro.
    """
    from backend.services.certificate_verifier import evaluate_and_register_profile_certificate
    results = []
    errors = []
    for f in files:
        try:
            content = await f.read()
            res = await evaluate_and_register_profile_certificate(
                file_bytes=content,
                filename=f.filename or "certificado.pdf"
            )
            results.append(res)
        except Exception as err:
            errors.append({"filename": f.filename, "error": str(err)})

    latest_profile = load_profile()
    return {
        "status": "success",
        "processed_count": len(results),
        "errors_count": len(errors),
        "results": results,
        "errors": errors,
        "profile": latest_profile,
        "message": f"Se han procesado y registrado {len(results)} certificados de formación con éxito."
    }

@router.post("/reset")
def reset_application_data():
    return reset_entire_application()

@router.get("/audit")
def get_persisted_profile_audit():
    """Devuelve la última auditoría guardada sin consumo de tokens ni demoras."""
    audit = get_saved_audit()
    return audit

@router.post("/audit")
@router.post("/audit/run")
async def run_profile_audit_endpoint():
    """Ejecuta una nueva auditoría completa con IA, la persiste en disco y la devuelve."""
    profile = load_profile()
    audit_result = await run_profile_audit(profile)
    return audit_result

@router.post("/apply-enhancements")
async def apply_profile_enhancements_endpoint(payload: Dict[str, Any]):
    """Aplica con 1 clic las mejoras de redacción, STAR y skills directamente al perfil y reevalúa el CV Maestro."""
    return await apply_enhancements_service(payload)

@router.post("/audit/roadmap-step/toggle")
def toggle_roadmap_step_endpoint(payload: Dict[str, Any]):
    """Marca o desmarca un paso del roadmap de empleabilidad."""
    step_id = payload.get("step_id")
    completed = payload.get("completed")
    return toggle_roadmap_step(step_id, completed)

@router.post("/audit/generate-quiz")
async def generate_quiz_endpoint(payload: Dict[str, Any]):
    """Genera una micro-evaluación contextual técnica (Flash-Quiz) para validar una competencia."""
    step_id = payload.get("step_id", "")
    skill_name = payload.get("skill_name", "")
    topic_context = payload.get("topic_context", "")
    return await generate_skill_quiz(step_id, skill_name, topic_context)

@router.post("/audit/verify-quiz")
def verify_quiz_endpoint(payload: Dict[str, Any]):
    """Evalúa las respuestas del flash-quiz y otorga la certificación Verified Skill si supera el 80%."""
    step_id = payload.get("step_id", "")
    skill_name = payload.get("skill_name", "")
    user_answers = payload.get("user_answers", [])
    questions = payload.get("questions", [])
    github_url = payload.get("github_url", "")
    return verify_skill_quiz(step_id, skill_name, user_answers, questions, github_url)

@router.post("/extract-skills")
async def extract_skills_endpoint(profile_data: Dict[str, Any] = None):
    """
    Analiza con IA toda la formación, cursos y experiencia del perfil
    para inferir y categorizar habilidades técnicas, blandas y herramientas.
    """
    profile = profile_data if profile_data and any(profile_data.values()) else load_profile()
    return await extract_skills_from_profile_with_ai(profile)

@router.get("/markdown-export", response_class=PlainTextResponse)
def export_cv_markdown():
    if CV_MAESTRO_PATH.exists():
        with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return "# CV Maestro\n*No hay datos disponibles.*"
