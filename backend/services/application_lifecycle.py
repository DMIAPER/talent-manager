from datetime import datetime, date
from typing import List, Dict, Any, Optional
import uuid

LEGACY_STATUS_MAP = {
    "saved": "pending_action",
    "discovered": "pending_action",
    "applied": "sent",
    "follow_up_due": "sent",
    "interviewing": "in_progress",
    "offer": "in_progress",
    "withdrawn": "discarded",
    "rejected": "discarded"
}

def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
        except Exception:
            continue
    return None

def process_applications_lifecycle(apps: List[Dict[str, Any]]) -> (List[Dict[str, Any]], bool):
    """
    Evalúa el ciclo de vida de las candidaturas:
    - Normaliza estados antiguos.
    - Aplica descarte automático a los 15 días sin respuesta en estado 'sent'.
    - Aplica archivado a los 30 días en estado 'discarded'.
    - Inyecta métricas dinámicas de tiempo (días de espera, restantes, avisos).
    Devuelve la lista procesada y un booleano indicando si hubo cambios que requieren persistencia.
    """
    has_changes = False
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")

    processed_apps = []

    for app in apps:
        app_dict = dict(app)

        # 1. Normalizar estado
        raw_status = app_dict.get("status", "pending_action")
        if raw_status in LEGACY_STATUS_MAP:
            app_dict["status"] = LEGACY_STATUS_MAP[raw_status]
            has_changes = True

        status = app_dict.get("status", "pending_action")
        wait_period_days = app_dict.get("wait_period_days", 15)
        discard_retention_days = app_dict.get("discard_retention_days", 30)

        # Asegurar campo coletillas
        if "coletillas" not in app_dict or not isinstance(app_dict["coletillas"], list):
            app_dict["coletillas"] = []
            has_changes = True

        # 2. Evaluación de estado 'sent' (Enviada) -> auto descarte a los 15 días
        if status == "sent":
            sent_dt = parse_date(app_dict.get("sent_date")) or parse_date(app_dict.get("application_date"))
            if not sent_dt:
                sent_dt = today
                app_dict["sent_date"] = today_str
                has_changes = True

            days_waiting = (today - sent_dt).days
            days_remaining = max(0, wait_period_days - days_waiting)
            is_warning = (days_waiting >= 10)

            # Auto-descarte si superó el plazo de espera
            if days_waiting >= wait_period_days:
                app_dict["status"] = "discarded"
                app_dict["discarded_date"] = today_str
                app_dict["discard_reason"] = "timeout_15_days"
                app_dict["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "author": "Sistema Talent Manager",
                    "content": f"Descarte automático por inactividad al cumplirse los {wait_period_days} días de espera sin feedback de la empresa.",
                    "category": "sistema"
                })
                has_changes = True
                status = "discarded"
                app_dict["lifecycle_info"] = {
                    "days_waiting": days_waiting,
                    "days_remaining": 0,
                    "is_warning_threshold": False,
                    "state_message": "Descartada automáticamente por superar 15 días sin respuesta"
                }
            else:
                app_dict["lifecycle_info"] = {
                    "days_waiting": days_waiting,
                    "days_remaining": days_remaining,
                    "is_warning_threshold": is_warning,
                    "state_message": f"Día {days_waiting} de {wait_period_days} ({days_remaining} días restantes)"
                }

        # 3. Evaluación de estado 'discarded' -> archivado a los 30 días
        if status == "discarded":
            discard_dt = parse_date(app_dict.get("discarded_date")) or parse_date(app_dict.get("application_date")) or today
            days_since_discard = (today - discard_dt).days
            days_until_archived = max(0, discard_retention_days - days_since_discard)

            if days_since_discard >= discard_retention_days and not app_dict.get("is_archived", False):
                app_dict["is_archived"] = True
                app_dict["coletillas"].append({
                    "id": f"col-{uuid.uuid4().hex[:6]}",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    "author": "Sistema Talent Manager",
                    "content": "Candidatura trasladada al Historial Permanente tras 30 días en estado Descartada.",
                    "category": "sistema"
                })
                has_changes = True

            app_dict["lifecycle_info"] = {
                "days_since_discard": days_since_discard,
                "days_until_archived": days_until_archived,
                "is_archived": app_dict.get("is_archived", False),
                "state_message": "Archivada en Historial" if app_dict.get("is_archived") else f"{days_until_archived} días para archivado definitivo"
            }

        # 4. Estado 'in_progress'
        if status == "in_progress":
            in_prog_dt = parse_date(app_dict.get("in_progress_date")) or parse_date(app_dict.get("application_date")) or today
            days_in_process = (today - in_prog_dt).days
            app_dict["lifecycle_info"] = {
                "days_in_process": days_in_process,
                "state_message": f"En proceso activo ({days_in_process} días)"
            }

        # 5. Estado 'pending_action'
        if status == "pending_action":
            created_dt = parse_date(app_dict.get("created_at")) or today
            days_pending = (today - created_dt).days
            app_dict["lifecycle_info"] = {
                "days_pending": days_pending,
                "state_message": "Pendiente de postulación por el candidato"
            }

        processed_apps.append(app_dict)

    return processed_apps, has_changes

def calculate_monthly_stats(apps: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calcula la distribución mensual de actividad (últimos 12 meses) y KPIs agregados.
    """
    monthly_data: Dict[str, Dict[str, int]] = {}
    discard_reasons: Dict[str, int] = {}
    
    total_apps = len(apps)
    total_sent = 0
    total_in_progress = 0
    total_discarded = 0
    total_pending = 0
    response_times_days = []

    for app in apps:
        status = app.get("status", "pending_action")
        # Fecha de referencia para el mes: sent_date o created_at o application_date
        ref_date = parse_date(app.get("sent_date")) or parse_date(app.get("created_at")) or parse_date(app.get("application_date"))
        month_key = ref_date.strftime("%Y-%m") if ref_date else datetime.now().strftime("%Y-%m")

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": month_key,
                "pending_action": 0,
                "sent": 0,
                "in_progress": 0,
                "discarded": 0,
                "total": 0
            }

        monthly_data[month_key]["total"] += 1
        if status in monthly_data[month_key]:
            monthly_data[month_key][status] += 1

        # Totales globales
        if status == "pending_action":
            total_pending += 1
        elif status == "sent":
            total_sent += 1
        elif status == "in_progress":
            total_in_progress += 1
            # Tiempo de respuesta
            s_dt = parse_date(app.get("sent_date"))
            p_dt = parse_date(app.get("in_progress_date"))
            if s_dt and p_dt and p_dt >= s_dt:
                response_times_days.append((p_dt - s_dt).days)
        elif status == "discarded":
            total_discarded += 1
            reason = app.get("discard_reason", "descarte_manual")
            discard_reasons[reason] = discard_reasons.get(reason, 0) + 1

    # Ordenar meses cronológicamente
    sorted_months = sorted(monthly_data.values(), key=lambda x: x["month"])

    # Calcular ratios
    candidate_sent_pool = total_sent + total_in_progress + total_discarded
    conversion_rate = round((total_in_progress / max(1, candidate_sent_pool)) * 100, 1) if candidate_sent_pool > 0 else 0.0
    avg_response_time = round(sum(response_times_days) / max(1, len(response_times_days)), 1) if response_times_days else None

    return {
        "monthly_breakdown": sorted_months,
        "kpis": {
            "total_applications": total_apps,
            "total_pending_action": total_pending,
            "total_sent": total_sent,
            "total_in_progress": total_in_progress,
            "total_discarded": total_discarded,
            "conversion_rate_percent": conversion_rate,
            "avg_response_time_days": avg_response_time
        },
        "discard_reasons": discard_reasons
    }
