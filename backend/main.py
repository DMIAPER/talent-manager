from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env en la raíz del proyecto
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ENV_PATH, override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from backend.routers import applications, career, linkedin, calendar, agent, settings, cv, profile
from backend.services.data_store import load_json

app = FastAPI(
    title="Talent Manager Pro API",
    description="Backend para gestión de carrera multidisciplinar, candidaturas, seguimiento de ofertas y LinkedIn",
    version="1.0.0"
)

# Permitir CORS para desarrollo con React / Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Registrar routers
app.include_router(applications.router)
app.include_router(career.router)
app.include_router(linkedin.router)
app.include_router(calendar.router)
app.include_router(agent.router)
app.include_router(settings.router)
app.include_router(cv.router)
app.include_router(profile.router)

import re
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse

# Servir certificados subidos
CERTIFICATES_DIR = Path(__file__).resolve().parent.parent / "assets" / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/api/certificates-download/{filename}")
def download_certificate(filename: str):
    file_path = CERTIFICATES_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Certificado o titulación no encontrado")
    
    # Limpiar prefijos de almacenamiento como 'profile_cert_20261009_180943_39055a_' para descarga amigable
    clean_name = re.sub(r'^(profile_cert|cert|ms)_[0-9]{8}_[0-9]{6}_[a-f0-9]{6}_', '', filename)
    if not clean_name.lower().endswith(".pdf"):
        clean_name += ".pdf"
        
    return FileResponse(
        path=str(file_path),
        filename=clean_name,
        media_type="application/pdf",
        content_disposition_type="attachment"
    )

app.mount("/api/certificates", StaticFiles(directory=str(CERTIFICATES_DIR)), name="certificates")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Talent Manager Pro Backend",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/overview")
def get_global_overview():
    apps = load_json("applications.json", [])
    plans = load_json("career_plans.json", [])
    linkedin_data = load_json("linkedin_stats.json", {})

    total_apps = len(apps)
    active_apps = sum(1 for a in apps if a.get("status") in ["applied", "interviewing", "follow_up_due"])
    interviewing_count = sum(1 for a in apps if a.get("status") == "interviewing")
    
    # Calcular follow-ups vencidos o para hoy
    due_today_count = 0
    overdue_count = 0
    from backend.services.follow_up import calculate_follow_up_status
    for a in apps:
        if a.get("status") in ["applied", "follow_up_due"]:
            last_int_date = a["interactions"][-1].get("date") if a.get("interactions") else None
            f_info = calculate_follow_up_status(a.get("application_date", ""), a.get("follow_up_days", 7), last_int_date)
            if f_info["status_code"] == "due_today":
                due_today_count += 1
            elif f_info["status_code"] == "overdue":
                overdue_count += 1

    return {
        "metrics": {
            "total_applications": total_apps,
            "active_applications": active_apps,
            "interviewing_count": interviewing_count,
            "follow_up_due_today": due_today_count,
            "follow_up_overdue": overdue_count,
            "active_career_plans": len(plans),
            "ssi_score": linkedin_data.get("ssi_score", 70)
        },
        "last_updated": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
