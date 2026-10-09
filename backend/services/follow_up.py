from datetime import datetime, date
from typing import Dict, Any, Optional

def calculate_follow_up_status(application_date_str: str, follow_up_days: int = 7, last_interaction_date_str: Optional[str] = None) -> Dict[str, Any]:
    try:
        # Si hubo una interacción posterior a la postulación, calcular desde esa fecha
        ref_date_str = last_interaction_date_str if last_interaction_date_str else application_date_str
        ref_date = datetime.strptime(ref_date_str[:10], "%Y-%m-%d").date()
    except Exception:
        ref_date = date.today()

    today = date.today()
    days_elapsed = (today - ref_date).days
    days_remaining = follow_up_days - days_elapsed

    if days_remaining > 1:
        status_code = "on_track"  # En plazo
        badge_label = f"En plazo ({days_remaining}d restantes)"
        urgency = "low"
    elif days_remaining in [0, 1]:
        status_code = "due_today"  # Momento óptimo de contacto
        badge_label = "¡Hacer follow-up hoy!"
        urgency = "medium"
    else:
        status_code = "overdue"  # Plazo superado
        badge_label = f"Plazo vencido ({abs(days_remaining)}d de retraso)"
        urgency = "high"

    return {
        "status_code": status_code,
        "badge_label": badge_label,
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "urgency": urgency,
        "target_follow_up_date": (ref_date.toordinal() + follow_up_days)
    }

def generate_follow_up_template(company: str, role: str, contact_person: Optional[str] = None, sector: str = "tech") -> Dict[str, str]:
    salutation = f"Estimado/a {contact_person}" if contact_person else "Estimado equipo de selección de " + company
    
    if sector == "health":
        subject = f"Seguimiento de candidatura: {role} - {company}"
        body = f"""{salutation},

Espero que se encuentre muy bien.

Le escribo para dar seguimiento a mi candidatura para la posición de {role} presentada recientemente. Sigo sumamente motivado/a con la posibilidad de aportar mi experiencia asistencial, rigor metodológico y compromiso con la calidad de atención en su institución.

Quedo a su entera disposición por si precisan alguna acreditación complementaria, referencias clínicas o si desean coordinar una breve conversación preliminar.

Agradezco de antemano su tiempo y atención.

Atentamente,
[Tu Nombre]
[Teléfono] | [Perfil Profesional]"""
    else:
        subject = f"Seguimiento de candidatura: {role} en {company}"
        body = f"""{salutation},

Espero que estés teniendo una excelente semana.

Te escribo brevemente para dar seguimiento a mi postulación al puesto de {role}. Continúo con gran entusiasmo por el impacto técnico y los retos que afronta el equipo en {company}.

Quería consultar si disponen de alguna novedad sobre el estado del proceso o si requieren cualquier detalle técnico adicional sobre mi trayectoria y proyectos desarrollados.

Quedo a vuestra disposición para mantener una breve conversación cuando os resulte más conveniente.

Muchas gracias por vuestro tiempo y consideración.

Un cordial saludo,
[Tu Nombre]
[Teléfono] | [LinkedIn / GitHub]"""

    return {
        "subject": subject,
        "body": body
    }
