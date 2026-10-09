from pydantic import BaseModel
from typing import List, Optional

class WeeklyStat(BaseModel):
    week_label: str  # Ej. "Semana 38 - 2026"
    profile_views: int
    search_appearances: int
    post_impressions: int
    new_connections: int

class ProfileAuditItem(BaseModel):
    id: str
    section: str  # "Titular", "Acerca de", "Experiencia", "Competencias & Certificaciones"
    title: str
    description: str
    completed: bool
    impact_level: str  # "Alto", "Medio", "Crítico"

class LinkedInProfileData(BaseModel):
    profile_url: Optional[str] = ""
    current_headline: Optional[str] = None
    ssi_score: Optional[int] = 72
    weekly_stats: List[WeeklyStat] = []
    audit_checklist: List[ProfileAuditItem] = []
