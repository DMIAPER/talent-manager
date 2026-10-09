from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ColetillaNote(BaseModel):
    id: str
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    author: str = "Candidato"
    content: str
    category: str = "general"  # "entrevista", "contacto", "feedback", "salario", "sistema"

class Interaction(BaseModel):
    id: str
    date: str
    type: str  # "email", "linkedin", "phone", "technical_test", "interview_hr", "interview_tech", "other"
    contact_person: Optional[str] = None
    notes: str

class Application(BaseModel):
    id: str
    company: str
    role: str
    sector: str = "general"
    url: Optional[str] = None
    portal: Optional[str] = "Web"
    description: Optional[str] = None
    salary_range: Optional[str] = None
    location_type: str = "remote"  # "remote", "onsite", "hybrid", "shifts"
    location_city: Optional[str] = None
    
    # 4 Estados oficiales del Kanban:
    # 1: 'pending_action' (Oferta encontrada / recibida)
    # 2: 'sent' (Enviada / CV enviado - espera 15 días)
    # 3: 'in_progress' (En proceso - contacto empresa / entrevistas)
    # 4: 'discarded' (Descartada - manual o 15 días auto, retención 30 días)
    status: str = "pending_action"
    
    # Fechas de ciclo de vida
    created_at: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    application_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    sent_date: Optional[str] = None
    in_progress_date: Optional[str] = None
    discarded_date: Optional[str] = None
    
    # Parámetros de automatización
    wait_period_days: int = 15
    discard_retention_days: int = 30
    is_archived: bool = False
    
    # Justificaciones de estado y coletillas
    in_progress_reason: Optional[str] = None
    discard_reason: Optional[str] = None  # "timeout_15_days", "empresa_rechazo", "sueldo_bajo", "descarte_manual"
    notes: Optional[str] = None
    coletillas: List[ColetillaNote] = []
    
    # Métricas y artefactos del Agente IA (preparados para vinculación completa)
    ats_score: Optional[int] = None
    ats_match_details: Optional[Dict[str, Any]] = None
    keywords: List[str] = []
    ats_optimized_cv_url: Optional[str] = None
    ats_optimized_cv_content: Optional[str] = None
    cover_letter: Optional[str] = None
    
    # Contacto y verificación técnica
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    is_active_url: Optional[bool] = True
    last_url_check: Optional[str] = None
    interactions: List[Interaction] = []

class ApplicationCreate(BaseModel):
    company: str
    role: str
    sector: str = "general"
    url: Optional[str] = None
    portal: Optional[str] = "Web"
    description: Optional[str] = None
    salary_range: Optional[str] = None
    location_type: str = "remote"
    location_city: Optional[str] = None
    status: str = "pending_action"
    application_date: Optional[str] = None
    sent_date: Optional[str] = None
    wait_period_days: int = 15
    notes: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    ats_score: Optional[int] = None
    ats_match_details: Optional[Dict[str, Any]] = None
    keywords: List[str] = []
    ats_optimized_cv_url: Optional[str] = None
    ats_optimized_cv_content: Optional[str] = None
    cover_letter: Optional[str] = None

class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    sector: Optional[str] = None
    url: Optional[str] = None
    portal: Optional[str] = None
    description: Optional[str] = None
    salary_range: Optional[str] = None
    location_type: Optional[str] = None
    location_city: Optional[str] = None
    status: Optional[str] = None
    application_date: Optional[str] = None
    sent_date: Optional[str] = None
    in_progress_date: Optional[str] = None
    discarded_date: Optional[str] = None
    wait_period_days: Optional[int] = None
    is_archived: Optional[bool] = None
    in_progress_reason: Optional[str] = None
    discard_reason: Optional[str] = None
    notes: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    ats_score: Optional[int] = None
    ats_match_details: Optional[Dict[str, Any]] = None
    keywords: Optional[List[str]] = None
    ats_optimized_cv_url: Optional[str] = None
    ats_optimized_cv_content: Optional[str] = None
    cover_letter: Optional[str] = None
    is_active_url: Optional[bool] = None

class ColetillaCreate(BaseModel):
    content: str
    author: Optional[str] = "Candidato"
    category: Optional[str] = "general"
