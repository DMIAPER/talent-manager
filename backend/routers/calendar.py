from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from urllib.parse import quote
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])

class CalendarEventRequest(BaseModel):
    title: str
    company: str
    role: str
    event_type: str = "follow_up"  # "follow_up", "interview", "deadline"
    target_date: Optional[str] = None  # YYYY-MM-DD
    target_time: Optional[str] = "10:00"  # HH:MM
    duration_minutes: int = 30
    notes: Optional[str] = None
    url: Optional[str] = None

@router.post("/generate-link")
def generate_google_calendar_link(req: CalendarEventRequest):
    # Calcular fecha y hora de inicio en formato ISO para Google Calendar (YYYYMMDDTHHMMSSZ)
    now = datetime.now()
    if req.target_date:
        try:
            start_dt = datetime.strptime(f"{req.target_date} {req.target_time}", "%Y-%m-%d %H:%M")
        except Exception:
            start_dt = now + timedelta(days=7)
    else:
        # Por defecto follow-up en 7 días a las 10:00
        start_dt = now + timedelta(days=7)
        start_dt = start_dt.replace(hour=10, minute=0, second=0, microsecond=0)

    end_dt = start_dt + timedelta(minutes=req.duration_minutes)

    dates_param = f"{start_dt.strftime('%Y%m%dT%H%M%S')}/{end_dt.strftime('%Y%m%dT%H%M%S')}"

    # Construir descripción completa
    details = f"Evento registrado desde Talent Manager Pro.\n"
    details += f"Empresa: {req.company}\n"
    details += f"Posición: {req.role}\n"
    if req.url:
        details += f"Enlace oferta: {req.url}\n"
    if req.notes:
        details += f"Notas: {req.notes}\n"
    details += "\nRecordatorio: revisar estado de la vacante e interacciones registradas."

    calendar_url = (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={quote(req.title)}"
        f"&dates={dates_param}"
        f"&details={quote(details)}"
        f"&add={quote('10')}"  # Notificación 10 min antes
    )

    return {
        "google_calendar_url": calendar_url,
        "title": req.title,
        "start_time": start_dt.isoformat(),
        "end_time": end_dt.isoformat()
    }
