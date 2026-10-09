import re
from pathlib import Path
from typing import Dict, Any, List

CV_PATH = Path(__file__).resolve().parent.parent.parent / "assets" / "cv-maestro.md"

def load_master_cv() -> str:
    if CV_PATH.exists():
        with open(CV_PATH, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def calculate_ats_match(job_title: str, job_description: str, cv_text: str = None) -> Dict[str, Any]:
    if not cv_text:
        cv_text = load_master_cv()

    cv_text_lower = cv_text.lower()
    job_lower = (job_title + " " + job_description).lower()

    # Diccionario de competencias clave según sector
    tech_keywords = [
        "python", "django", "fastapi", "flask", "flutter", "dart", "sql", "postgresql", 
        "mysql", "sqlite", "git", "github", "docker", "apis", "api rest", "restful", 
        "solid", "clean architecture", "mvvm", "bloc", "provider", "javascript", "vue", 
        "react", "html", "css", "linux", "ci/cd", "testing", "pytest", "unit testing", "scrum", "agile"
    ]

    health_keywords = [
        "enfermería", "clínico", "asistencial", "paciente", "urgencias", "cuidados", 
        "protocolos", "gcp", "ensayos clínicos", "farmacología", "triaje", "historia clínica", 
        "coordinación", "dirección médica", "calidad asistencial", "supervisión", "seguridad del paciente"
    ]

    all_keywords = tech_keywords + health_keywords

    # Detectar palabras clave presentes en la oferta
    detected_in_job = []
    for kw in all_keywords:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, job_lower):
            detected_in_job.append(kw)

    if not detected_in_job:
        # Fallback si la oferta es general
        detected_in_job = ["python", "apis", "git", "sql"]

    # Cruzar con las que están en el CV
    matching = []
    missing = []
    for kw in detected_in_job:
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, cv_text_lower):
            matching.append(kw)
        else:
            missing.append(kw)

    # Calcular porcentaje
    total_req = len(detected_in_job)
    score = int((len(matching) / total_req) * 100) if total_req > 0 else 75
    # Normalizar entre 65% y 98% según el estándar ATS
    score = max(min(score, 98), 65)

    recommendations = []
    if missing:
        recommendations.append(f"Menciona o destaca experiencia transferible en: {', '.join(missing[:3])}.")
    recommendations.append("Cuantifica logros en tu experiencia utilizando métricas de impacto (metodología STAR).")

    return {
        "ats_score": score,
        "matching_keywords": matching,
        "missing_keywords": missing,
        "recommendations": recommendations,
        "cv_source": "assets/cv-maestro.md"
    }
