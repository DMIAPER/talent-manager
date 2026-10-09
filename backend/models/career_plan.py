from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class SkillGapItem(BaseModel):
    name: str
    category: str = "hard"  # "hard", "soft", "regulation"
    current_level: int = 2  # 1 a 5
    target_level: int = 5   # 1 a 5
    description: Optional[str] = None

class TrainingMilestone(BaseModel):
    id: str
    title: str
    provider: str = "Plataforma / Entidad Oficial"
    duration_hours: int = 40
    cost_estimate: str = "Gratuito / Tasa oficial"
    is_official_certification: bool = False
    status: str = "pending"  # "pending", "in_progress", "completed"
    skills_acquired: List[str] = []
    level: int = 1  # 1: Fundación, 2: Especialización, 3: Dominio Senior, 4: Arquitectura/Liderazgo
    certification_name: Optional[str] = None
    certificate_link: Optional[str] = None
    completion_date: Optional[str] = None
    notes: Optional[str] = None

class CareerBranch(BaseModel):
    id: str
    name: str  # Ej: "Rama Principal: Infraestructura & SysAdmin", "Bifurcación: Ciberseguridad & SecOps"
    branch_type: str = "main"  # "vertical", "pivot_fork", "cloud_devops", "emerging"
    description: str = ""
    target_role: Optional[str] = None
    market_demand: str = "Alta (+25% Demanda)"
    salary_range_est: str = "35.000€ - 50.000€"
    fit_percentage: int = 80
    color_theme: str = "#6366f1"
    is_active: bool = True
    parent_fork_milestone_id: Optional[str] = None
    milestones: List[TrainingMilestone] = []

class CareerJournalEntry(BaseModel):
    id: str
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    title: str
    content: str
    category: str = "learning"  # "learning", "certification", "wishlist", "experience"
    tags: List[str] = []

class MilestoneSyncPayload(BaseModel):
    institution: Optional[str] = None
    year: Optional[str] = None
    certificate_link: Optional[str] = None
    grade: Optional[str] = None
    skills_to_add: List[str] = []
    category: str = "certification"  # "certification" o "education"

class SelectBranchesRequest(BaseModel):
    branch_ids: List[str]

class CareerAdvisorChatRequest(BaseModel):
    messages: List[Dict[str, str]] = []
    user_message: str
    plan_id: Optional[str] = None

class GenerateRoadmapTreeRequest(BaseModel):
    user_intent: Optional[str] = None
    target_role: Optional[str] = None
    transition_type: str = "branch_pivot"  # "vertical_leap", "branch_pivot", "consolidation"
    hours_per_week: int = 10

class CareerPlan(BaseModel):
    id: str
    title: Optional[str] = None
    profile_name: str
    sector: str = "general"
    current_role: str
    target_role: str
    transition_type: str = "branch_pivot"
    executive_summary: str
    trunk_baseline: Optional[Dict[str, Any]] = None
    key_metrics: Dict[str, Any] = {}
    market_metrics: Dict[str, Any] = {
        "market_demand_growth": "+28% anual",
        "median_salary_spain": "42.000€ - 55.000€",
        "remote_availability": "Alta (65% ofertas)",
        "competition_level": "Media"
    }
    skill_gaps: List[SkillGapItem] = []
    branches: List[CareerBranch] = []
    roadmap: List[Any] = []  # Para retrocompatibilidad
    journal: List[CareerJournalEntry] = []
    chat_history: List[Dict[str, str]] = []
