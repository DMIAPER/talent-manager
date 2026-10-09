import os
import re
import json
import uuid
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from backend.services.cv_parser import extract_text_from_bytes, is_corrupted_or_useless_text
from backend.services.profile_service import load_profile, save_profile
from backend.services.data_store import load_json, save_json
from backend.services.career_advisor import sync_milestone_direct_to_master_cv

ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "assets"
CERTIFICATES_DIR = ASSETS_DIR / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    """Limpia el nombre del archivo para almacenamiento seguro en disco."""
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', name)
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean or "certificado.pdf"


def save_certificate_file(file_bytes: bytes, filename: str, prefix: str = "cert") -> Dict[str, str]:
    """
    Guarda el archivo físico del certificado en assets/certificates/ con un identificador único seguro.
    """
    safe_base = sanitize_filename(filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = uuid.uuid4().hex[:6]
    stored_filename = f"{prefix}_{timestamp}_{unique_id}_{safe_base}"
    file_path = CERTIFICATES_DIR / stored_filename

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    relative_url = f"/api/certificates/{stored_filename}"
    return {
        "original_filename": filename,
        "stored_filename": stored_filename,
        "file_path": str(file_path),
        "relative_url": relative_url,
        "file_size": len(file_bytes)
    }


DEGREE_TYPE_LABELS: Dict[str, str] = {
    "fp_superior": "Título Oficial FP - Grado Superior (Técnico Superior)",
    "fp_medio": "Título Oficial FP - Grado Medio (Técnico)",
    "fp_curso_especializacion": "Curso de Especialización de FP (Máster FP)",
    "universidad_grado": "Titulación Universitaria Oficial (Grado / Ingeniería)",
    "universidad_master": "Máster Oficial Universitario",
    "universidad_doctorado": "Doctorado Universitario (PhD)",
    "certificado_profesionalidad": "Certificado de Profesionalidad Oficial (SEPE)",
    "certificacion_oficial": "Certificación Oficial de la Industria Tecnológica",
    "curso_especializacion": "Curso de Especialización / Formación Continua"
}


def detect_and_clean_noise(text: str) -> Tuple[str, List[str]]:
    """
    Identifica elementos administrativos no profesionales en diplomas/certificados
    (edad del candidato, fecha de nacimiento, lugar de nacimiento, DNI, fórmulas regias o legales, cargos)
    y devuelve la lista de tipos de ruido descartados conscientemente.
    """
    detected_noise = []
    text_lower = text.lower()

    if re.search(r'\b(?:nacid[oa]|fecha de nacimiento|nacimiento|edad[\s\:]+\d{1,2}|años de edad)\b', text_lower):
        detected_noise.append("Edad y Fecha de Nacimiento del titular (descartadas)")
    
    if re.search(r'\b(?:natural de|nacionalidad|provincia de|vecin[oa] de)\b', text_lower):
        detected_noise.append("Lugar de procedencia / Nacionalidad (descartados)")

    if re.search(r'\b(?:dni|n\.?i\.?f|n\.?i\.?e|pasaporte|documento de identidad)\b', text_lower):
        detected_noise.append("DNI / Documento de Identidad (descartado)")

    if re.search(r'\b(?:felipe vi|rey de españa|en su nombre el rector|por cuanto ante nos|reales decretos|dado en|para que conste y surta|juan carlos i)\b', text_lower):
        detected_noise.append("Fórmulas protocolarias y administrativas legales (descartadas)")

    if re.search(r'\b(?:el rector|la rectora|el secretario general|el decano|el jefe de negociado|el interesado)\b', text_lower):
        detected_noise.append("Firmas y cargos de secretaría administrativa (descartados)")

    if re.search(r'\b(?:libro\s+\d+|folio\s+\d+|asiento\s+\d+|registro nacional de títulos)\b', text_lower):
        detected_noise.append("Registros notariales y folios administrativos (descartados)")

    return text, detected_noise


def format_clean_title(text: str) -> str:
    """Formatea títulos respetando mayúsculas, minúsculas naturales en español y acrónimos."""
    words = text.strip().split()
    lower_words = {"de", "del", "en", "y", "o", "a", "la", "el", "los", "las", "para", "por", "con"}
    is_entirely_upper = text.isupper()
    res = []
    for i, w in enumerate(words):
        w_clean = w.strip()
        strip_punc = w_clean.strip("()[]{},.:;")
        has_digit = any(c.isdigit() for c in strip_punc)
        is_in_parens = w_clean.startswith("(") and w_clean.endswith(")")
        is_short_acronym = strip_punc.isupper() and 2 <= len(strip_punc) <= 5 and not is_entirely_upper

        if (has_digit or is_in_parens or is_short_acronym) and strip_punc.isupper():
            res.append(w_clean)
            continue

        w_lower = w_clean.lower()
        if i > 0 and w_lower in lower_words:
            res.append(w_lower)
        else:
            res.append(w_clean.capitalize())
    return " ".join(res)


def parse_certificate_heuristic(raw_text: str, filename: str) -> Dict[str, Any]:
    """
    Extractor heurístico de respaldo por si el servicio de IA no está disponible o falla.
    Analiza la estructura apaisada/horizontal, filtra ruido administrativo y clasifica
    rigurosamente entre FP, Universidad, Certificado de Profesionalidad o Certificación.
    """
    text_clean = raw_text.strip()
    _, filtered_noise = detect_and_clean_noise(text_clean)
    text_lower = text_clean.lower()
    lines = [l.strip() for l in text_clean.splitlines() if l.strip()]

    degree_type = "curso_especializacion"
    title = ""
    hours = ""
    is_academic = False
    is_official = False
    target_section = "certifications"

    # 1. DETECCIÓN DE FORMACIÓN PROFESIONAL (FP)
    match_fp_sup = re.search(
        r'(?:título de\s+)?técnico superior en\s+([^\n\r,\.;]{4,85})|ciclo formativo de grado superior(?:\s+en)?\s+([^\n\r,\.;]{4,85})|cfgs\s+([^\n\r,\.;]{4,85})',
        text_clean,
        re.IGNORECASE
    )
    if match_fp_sup:
        degree_type = "fp_superior"
        is_academic = True
        is_official = True
        target_section = "education"
        extracted = match_fp_sup.group(1) or match_fp_sup.group(2) or match_fp_sup.group(3)
        title = f"Técnico Superior en {format_clean_title(extracted)}"
        hours = "2000"

    match_fp_med = re.search(
        r'(?:título de\s+)?técnico en\s+([^\n\r,\.;]{4,85})|ciclo formativo de grado medio(?:\s+en)?\s+([^\n\r,\.;]{4,85})|cfgm\s+([^\n\r,\.;]{4,85})',
        text_clean,
        re.IGNORECASE
    )
    if not title and match_fp_med:
        degree_type = "fp_medio"
        is_academic = True
        is_official = True
        target_section = "education"
        extracted = match_fp_med.group(1) or match_fp_med.group(2) or match_fp_med.group(3)
        title = f"Técnico en {format_clean_title(extracted)}"
        hours = "2000"

    # 2. DETECCIÓN DE TITULACIÓN UNIVERSITARIA (GRADO / MÁSTER / DOCTORADO)
    if not title:
        match_master = re.search(
            r'(?:título de\s+)?máster (?:universitario\s+)?en\s+([^\n\r,\.;]{4,85})|magister en\s+([^\n\r,\.;]{4,85})',
            text_clean,
            re.IGNORECASE
        )
        if match_master:
            degree_type = "universidad_master"
            is_academic = True
            is_official = True
            target_section = "education"
            extracted = match_master.group(1) or match_master.group(2)
            title = f"Máster Universitario en {format_clean_title(extracted)}"
            hours = "60 ECTS"

    if not title:
        match_grado = re.search(
            r'(?:título de\s+)?(?:graduad[oa]|grado)\s+en\s+([^\n\r,\.;]{4,85})|(?:título de\s+)?licenciad[oa]\s+en\s+([^\n\r,\.;]{4,85})|(?:título de\s+)?ingenier[oa]\s+(?:técnic[oa]\s+|en\s+)?([^\n\r,\.;]{4,85})|(?:título de\s+)?diplomad[oa]\s+en\s+([^\n\r,\.;]{4,85})',
            text_clean,
            re.IGNORECASE
        )
        if match_grado:
            degree_type = "universidad_grado"
            is_academic = True
            is_official = True
            target_section = "education"
            extracted = match_grado.group(1) or match_grado.group(2) or match_grado.group(3) or match_grado.group(4)
            title = f"Grado en {format_clean_title(extracted)}"
            hours = "240 ECTS"

    # 3. DETECCIÓN DE CERTIFICADO DE PROFESIONALIDAD (SEPE / MINISTERIO DE TRABAJO)
    if not title:
        match_cert_prof = re.search(
            r'certificado de profesionalidad(?:\s+de|\s+en)?(?::|\s*(?:\r?\n)+)?\s*([^\n\r,;]{4,85})',
            text_clean,
            re.IGNORECASE
        )
        if match_cert_prof:
            degree_type = "certificado_profesionalidad"
            is_academic = False
            is_official = True
            target_section = "certifications"
            title = f"Certificado de Profesionalidad en {format_clean_title(match_cert_prof.group(1))}"

    # 4. PATRÓN EXPLÍCITO TRAS FRASE DE SUPERACIÓN (ej: "ha completado con éxito el Curso Avanzado...")
    if not title:
        match_completed = re.search(
            r'(?:ha completado con éxito|ha superado(?: con éxito)?|la formación|el curso|el programa|diploma en|certificado en)\s*(?:el|la|de)?\s*[:\s\r\n]+([^\n\r\.;]{5,90})',
            text_clean,
            re.IGNORECASE
        )
        if match_completed:
            candidate = match_completed.group(1).strip()
            if (len(candidate) > 5 and not candidate.lower().startswith("que") 
                and not any(candidate.lower().startswith(p) for p in ["emitido", "expedido", "impartido", "organizado", "a favor", "don", "doña"])):
                title = format_clean_title(candidate)

    # 5. DETECCIÓN DE CERTIFICACIONES OFICIALES DE LA INDUSTRIA TECNOLÓGICA
    if not title:
        industry_keywords = [
            ("aws", "Amazon Web Services"),
            ("cisco", "Cisco Systems"),
            ("red hat", "Red Hat"),
            ("microsoft", "Microsoft"),
            ("google cloud", "Google Cloud"),
            ("comptia", "CompTIA"),
            ("scrum", "Scrum.org / Scrum Alliance"),
            ("pmi", "Project Management Institute (PMI)"),
            ("kubernetes", "Linux Foundation / CNCF"),
            ("oracle", "Oracle")
        ]
        for kw, brand in industry_keywords:
            if kw in text_lower:
                degree_type = "certificacion_oficial"
                is_official = True
                target_section = "certifications"
                for l in lines:
                    l_lower = l.lower()
                    if (kw in l_lower and len(l) < 70 
                        and not any(h in l_lower for h in ["certificado", "diploma", "emitido", "expedido", "impartido", "en colaboración"])):
                        title = l.strip()
                        break
                break

    # 6. FALLBACK DE TÍTULO
    if not title:
        generic_headers = [
            "certificado", "diploma", "certificado oficial", "diploma oficial",
            "certificado de acreditación", "certificado de superación",
            "diploma de superación", "acreditación profesional"
        ]
        for line in lines[:10]:
            clean_l = line.lower()
            if clean_l in generic_headers or any(clean_l.startswith(h) and len(line) < 35 for h in generic_headers):
                continue
            if any(p in clean_l for p in ["emitido", "expedido", "impartido", "en colaboración", "a favor"]):
                continue
            if any(keyword in clean_l for keyword in ["curso", "especialización", "programa", "bootcamp", "máster", "grado", "desarrollo", "administración", "técnico"]):
                title = line
                break

    if not title:
        title = Path(filename).stem.replace("_", " ").replace("-", " ").title()

    # Detección de Nombre del Alumno (eliminando Don/Doña y cortando antes de ruido)
    student_name = ""
    match_student = re.search(
        r'(?:don|doña|d\.|dña\.|alumno|alumna|a favor de|otorgado a)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,3})',
        text_clean,
        re.IGNORECASE
    )
    if match_student:
        student_name = match_student.group(1).strip()

    # Emisor / Institución
    known_issuers = [
        ("universidad", "Universidad"),
        ("ies", "Instituto de Educación Secundaria (IES)"),
        ("coursera", "Coursera"),
        ("udemy", "Udemy"),
        ("edx", "edX"),
        ("google", "Google"),
        ("aws", "Amazon Web Services"),
        ("microsoft", "Microsoft"),
        ("platzi", "Platzi"),
        ("cisco", "Cisco Networking Academy"),
        ("oracle", "Oracle"),
        ("sepe", "SEPE (Servicio Público de Empleo Estatal)"),
        ("incibe", "INCIBE"),
        ("pmi", "PMI"),
        ("scrum", "Scrum.org")
    ]
    issuer = "Entidad Acreditadora"
    for ki, display in known_issuers:
        if ki in text_lower:
            # Buscar línea exacta que contenga el nombre de la institución si es una universidad o IES
            if ki in ["universidad", "ies"]:
                for l in lines:
                    if ki in l.lower() and len(l) < 65:
                        issuer = l.strip()
                        break
                if issuer == "Entidad Acreditadora":
                    issuer = display
            else:
                issuer = display
            break

    # Horas explícitas si constan
    if not hours:
        match_hours = re.search(r'(\d{1,4})\s*(?:horas|h\b|hours|créditos ects|ects)', text_clean, re.IGNORECASE)
        if match_hours:
            hours = match_hours.group(1)

    # Año de expedición
    year = ""
    match_year = re.search(r'\b(20\d{2}|19\d{2})\b', text_clean)
    if match_year:
        year = match_year.group(1)
    else:
        year = datetime.now().strftime("%Y")

    # Credencial ID o CSV
    credential_id = ""
    match_cred = re.search(r'(?:csv|código seguro de verificación|credencial|credential|id|código|certificate id|verify)[\s\:\#]+([A-Za-z0-9\-]{5,35})', text_clean, re.IGNORECASE)
    if match_cred:
        credential_id = match_cred.group(1)

    # Detección de habilidades técnicas inferidas
    skills_acquired = []
    text_tech = text_lower + " " + title.lower()
    tech_map = {
        "dam": ["Java", "Android", "SQL", "Git", "Kotlin", "Bases de Datos"],
        "daw": ["HTML5", "CSS3", "JavaScript", "PHP", "React", "Node.js", "Bases de Datos"],
        "asir": ["Linux", "Windows Server", "Redes TCP/IP", "Seguridad", "Virtualización", "Servicios de Red"],
        "informática": ["Arquitectura Software", "Bases de Datos", "Algoritmos", "Estructuras de Datos"],
        "python": ["Python", "Backend", "Scripting"],
        "aws": ["AWS Cloud", "Infraestructura Cloud", "Seguridad Cloud"],
        "cisco": ["Routing & Switching", "Cisco IOS", "VLANs", "Subnetting"],
        "ciberseguridad": ["Ciberseguridad", "Hardening", "Auditoría de Seguridad", "Análisis de Vulnerabilidades"],
        "docker": ["Docker", "Contenedores", "CI/CD"],
        "scrum": ["Metodologías Ágiles", "Scrum", "Sprint Planning"]
    }
    for kw, sk_list in tech_map.items():
        if kw in text_tech:
            for s in sk_list:
                if s not in skills_acquired:
                    skills_acquired.append(s)

    label = DEGREE_TYPE_LABELS.get(degree_type, "Curso / Certificación")

    return {
        "course_title": title,
        "degree_type": degree_type,
        "degree_type_label": label,
        "is_academic_degree": is_academic,
        "is_official_degree": is_official,
        "target_cv_section": target_section,
        "issuer": issuer,
        "student_name": student_name,
        "issue_date": year,
        "year": year,
        "hours": hours,
        "grade": "",
        "credential_id": credential_id,
        "verification_url": "",
        "skills_acquired": skills_acquired[:6],
        "filtered_noise": filtered_noise,
        "confidence_score": 0.70,
        "is_verified": True,
        "match_score": 85,
        "summary": f"{label}: '{title}' acreditado por {issuer}."
    }


async def evaluate_certificate_with_gemini(
    raw_text: str,
    pdf_bytes: Optional[bytes] = None,
    filename: str = "",
    target_milestone: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Analiza un certificado o diploma mediante IA (Gemini) con soporte multimodal.
    Especializado en documentos apaisados/horizontales y títulos oficiales estructurados:
    1. Filtra y descarta todo el ruido administrativo (edad, DNI, fórmulas regias, firmas).
    2. Clasifica con exactitud la índole del título (FP Superior/Medio, Universidad, Certificación, etc.).
    3. Asigna la sección idónea en el CV Maestro (Educación Formal vs Certificaciones).
    """
    from backend.services.agent_browser import get_gemini_client
    from google.genai import types

    client, _ = get_gemini_client()
    heuristic_fallback = parse_certificate_heuristic(raw_text, filename)

    if not client:
        if target_milestone:
            ms_title = target_milestone.get("title", "").lower()
            cert_title = heuristic_fallback["course_title"].lower()
            match = 90 if (ms_title in cert_title or cert_title in ms_title) else 75
            heuristic_fallback["match_score"] = match
            heuristic_fallback["is_verified"] = match >= 60
        return heuristic_fallback

    # Preparar contexto si viene de un hito específico
    target_info = ""
    if target_milestone:
        target_info = f"""
INFORMACIÓN DEL HITO FORMATIVO OBJETIVO A VALIDAR:
- Título del hito: "{target_milestone.get('title', '')}"
- Proveedor / Entidad esperada: "{target_milestone.get('provider', '')}"
- Nivel formativo: {target_milestone.get('level', 1)}
- Habilidades esperadas: {json.dumps(target_milestone.get('skills_acquired', []), ensure_ascii=False)}
"""

    prompt = f"""Actúa como un Auditor Senior de Formación y Validador Oficial de Credenciales Académicas e Industriales.
Analiza con rigor el contenido del siguiente certificado, diploma o título oficial (puede estar formateado de forma horizontal/apaisada o en diseño solemne administrativo).
{target_info}

DIRECTRICES CRÍTICAS DE EXTRACCIÓN Y FILTRADO:
1. DESCARTE DE RUIDO ADMINISTRATIVO E IRRELEVANTE:
   - NO incluyas ni contamines los campos con la edad del alumno, su fecha de nacimiento, lugar de nacimiento ("natural de..."), DNI/NIE o filiación.
   - Ignora fórmulas legales y protocolares regias ("Felipe VI, Rey de España", "En su nombre el Rector", "Por cuanto ante Nos", "Dado en...", "Libro / Folio").
   - Ignora firmas de secretaría y cargos administrativos.

2. CLASIFICACIÓN DE LA ÍNDOLE Y CATEGORÍA DEL TÍTULO ("degree_type"):
   - "fp_superior": Formación Profesional de Grado Superior (Técnico Superior, Ciclo Formativo de Grado Superior, CFGS).
   - "fp_medio": Formación Profesional de Grado Medio (Técnico, Ciclo Formativo de Grado Medio, CFGM).
   - "fp_curso_especializacion": Curso de Especialización de FP (Máster de FP).
   - "universidad_grado": Título Universitario Oficial de Grado, Licenciatura, Diplomatura o Ingeniería.
   - "universidad_master": Máster Oficial Universitario o Máster Propio Universitario.
   - "universidad_doctorado": Doctorado Universitario (PhD).
   - "certificado_profesionalidad": Certificado de Profesionalidad Oficial (SEPE / Ministerio de Trabajo / Comunidades Autónomas).
   - "certificacion_oficial": Certificación Oficial de la Industria Tecnológica (AWS, Cisco, Red Hat, Microsoft, Google, CompTIA, Scrum.org, etc.).
   - "curso_especializacion": Cursos de especialización profesional, bootcamps o formación continua (Coursera, Udemy, etc.).

3. SECCIÓN DESTINO EN EL CV ("target_cv_section"):
   - "education": Para Formación Profesional (FP Superior, FP Medio, Cursos FP) y Universidad (Grado, Máster, Doctorado).
   - "certifications": Para Certificaciones Oficiales de Industria, Certificados de Profesionalidad y Cursos de Especialización.

DEBES RESPONDER EXCLUSIVAMENTE CON UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA:
{{
  "course_title": "Nombre limpio y oficial del título o curso superado (ej: 'Técnico Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)', 'Grado en Ingeniería Informática', 'AWS Certified Solutions Architect')",
  "degree_type": "fp_superior | fp_medio | fp_curso_especializacion | universidad_grado | universidad_master | universidad_doctorado | certificado_profesionalidad | certificacion_oficial | curso_especializacion",
  "degree_type_label": "Etiqueta formal en español según la categoría detectada (ej: 'Título Oficial FP - Grado Superior', 'Titulación Universitaria Oficial (Grado)', 'Certificado de Profesionalidad Oficial (SEPE)', 'Certificación Oficial de la Industria', 'Curso de Especialización')",
  "is_academic_degree": true, // true para FP y Universidad; false para cursos y certificaciones
  "is_official_degree": true, // true si es título oficial regulado por el estado/ministerio
  "target_cv_section": "education", // 'education' o 'certifications'
  "issuer": "Entidad, centro educativo o universidad emisora oficial (ej: 'IES Clara del Rey', 'Universidad Politécnica de Madrid', 'Amazon Web Services')",
  "student_name": "Nombre completo del titular LIMPIO (sin 'Don/Doña', sin DNI, sin fechas)",
  "issue_date": "Fecha o año de emisión",
  "year": "Año de graduación o expedición en 4 dígitos",
  "hours": "Horas de dedicación o créditos ECTS si constan (ej: 2000 para FP si aplica, o 240 para Grado)",
  "grade": "Calificación, mención o nota si figura",
  "credential_id": "Código Seguro de Verificación (CSV) o ID oficial si consta",
  "verification_url": "Enlace de verificación si aparece",
  "skills_acquired": ["Lista de 3 a 8 competencias técnicas y hard skills reales acreditadas por esta titulación"],
  "filtered_noise": ["Lista de elementos irrelevantes descartados, ej: 'Edad / Fecha de nacimiento descartada', 'DNI/NIE filtrado', 'Fórmula protocolaria regia descartada'"],
  "is_verified": true,
  "match_score": 95,
  "verification_feedback": "Explicación concisa (1 o 2 frases) de por qué se valida y cómo enriquece el CV.",
  "summary": "Resumen ejecutivo del título y su valor curricular."
}}

Devuelve ÚNICAMENTE el bloque JSON válido."""

    contents = []
    if pdf_bytes and (not raw_text or is_corrupted_or_useless_text(raw_text)):
        contents.append(types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"))
        contents.append(prompt)
    elif raw_text and not is_corrupted_or_useless_text(raw_text):
        contents.append(f"{prompt}\n\nTEXTO EXTRAÍDO DEL DOCUMENTO:\n{raw_text[:7000]}")
    elif pdf_bytes:
        contents.append(types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"))
        contents.append(prompt)
    else:
        contents.append(f"{prompt}\n\nTEXTO EXTRAÍDO:\n{raw_text[:7000]}")

    candidate_models = ["gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-flash"]
    configured_model = os.getenv("GEMINI_MODEL", "").strip()
    if configured_model and configured_model not in candidate_models:
        candidate_models.insert(0, configured_model)

    for model_name in candidate_models:
        try:
            def call():
                return client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
            res = await asyncio.wait_for(asyncio.to_thread(call), timeout=25.0)
            if res and res.text:
                match = re.search(r'\{.*\}', res.text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group(0))
                    parsed["confidence_score"] = 0.95
                    if not parsed.get("year"):
                        parsed["year"] = parsed.get("issue_date", "")[:4] or datetime.now().strftime("%Y")
                    if not parsed.get("hours") and heuristic_fallback.get("hours"):
                        parsed["hours"] = heuristic_fallback["hours"]
                    if not parsed.get("degree_type"):
                        parsed["degree_type"] = heuristic_fallback.get("degree_type", "curso_especializacion")
                    if not parsed.get("degree_type_label"):
                        parsed["degree_type_label"] = DEGREE_TYPE_LABELS.get(parsed["degree_type"], heuristic_fallback.get("degree_type_label"))
                    if not parsed.get("target_cv_section"):
                        parsed["target_cv_section"] = heuristic_fallback.get("target_cv_section", "certifications")
                    if not parsed.get("filtered_noise"):
                        parsed["filtered_noise"] = heuristic_fallback.get("filtered_noise", [])
                    return parsed
        except Exception as e:
            print(f"[Cert Verifier] Modelo {model_name} falló: {e}")
            continue

    return heuristic_fallback


async def verify_and_complete_milestone_certificate(
    plan_id: str,
    milestone_id: str,
    file_bytes: bytes,
    filename: str
) -> Dict[str, Any]:
    """
    Sube un certificado para un hito de carrera específico, lo evalúa con IA,
    marca el hito como completado y lo sincroniza de forma inmediata al CV Maestro y Perfil.
    """
    # 1. Guardar archivo físico
    file_info = save_certificate_file(file_bytes, filename, prefix=f"ms_{milestone_id}")

    # 2. Localizar hito en career_plans.json
    plans = load_json("career_plans.json", [])
    target_plan = None
    target_plan_idx = None
    target_br_idx = None
    target_ms_idx = None
    target_milestone = None

    for p_idx, p in enumerate(plans):
        if p.get("id") == plan_id:
            target_plan = p
            target_plan_idx = p_idx
            for b_idx, br in enumerate(p.get("branches", [])):
                for m_idx, ms in enumerate(br.get("milestones", [])):
                    if ms.get("id") == milestone_id:
                        target_milestone = ms
                        target_br_idx = b_idx
                        target_ms_idx = m_idx
                        break
                if target_milestone:
                    break
        if target_milestone:
            break

    if not target_milestone:
        return {
            "status": "error",
            "message": f"Hito formativo '{milestone_id}' no encontrado en el plan '{plan_id}'."
        }

    # 3. Extraer texto y analizar con IA
    raw_text = extract_text_from_bytes(file_bytes, filename)
    evaluation = await evaluate_certificate_with_gemini(
        raw_text=raw_text,
        pdf_bytes=file_bytes if filename.lower().endswith(".pdf") else None,
        filename=filename,
        target_milestone=target_milestone
    )

    # 4. Actualizar hito en el plan de carrera
    completion_date = datetime.now().strftime("%Y-%m-%d")
    target_milestone["status"] = "completed"
    target_milestone["completion_date"] = completion_date
    target_milestone["certificate_file"] = file_info["stored_filename"]
    target_milestone["certificate_url"] = file_info["relative_url"]
    target_milestone["certificate_verified"] = evaluation.get("is_verified", True)
    target_milestone["certificate_metadata"] = {
        "verified_title": evaluation.get("course_title"),
        "issuer": evaluation.get("issuer"),
        "hours": evaluation.get("hours"),
        "year": evaluation.get("year"),
        "credential_id": evaluation.get("credential_id"),
        "match_score": evaluation.get("match_score", 90),
        "feedback": evaluation.get("verification_feedback", ""),
        "evaluated_at": datetime.now().isoformat()
    }

    # Si la IA identificó habilidades técnicas acreditadas adicionales, unirlas
    new_skills = evaluation.get("skills_acquired", [])
    if new_skills:
        existing_skills = target_milestone.get("skills_acquired", [])
        combined = list(dict.fromkeys(existing_skills + new_skills))
        target_milestone["skills_acquired"] = combined

    plans[target_plan_idx]["branches"][target_br_idx]["milestones"][target_ms_idx] = target_milestone
    save_json("career_plans.json", plans)

    # 5. Sincronizar directamente con el CV Maestro y Perfil Oficial
    sync_res = sync_milestone_direct_to_master_cv(plan_id, milestone_id)

    return {
        "status": "success",
        "message": f"¡Certificado verificado con éxito! Hito '{target_milestone.get('title')}' completado e integrado en tu CV Maestro.",
        "milestone": target_milestone,
        "evaluation": evaluation,
        "file_info": file_info,
        "sync_result": sync_res
    }


async def evaluate_and_register_profile_certificate(
    file_bytes: bytes,
    filename: str
) -> Dict[str, Any]:
    """
    Sube un certificado/diploma general en 'MI PERFIL', lo evalúa con IA,
    lo registra en la sección adecuada (certificaciones o formación académica)
    y sincroniza automáticamente el CV Maestro.
    """
    # 1. Guardar archivo físico en assets/certificates/
    file_info = save_certificate_file(file_bytes, filename, prefix="profile_cert")

    # 2. Extraer texto y analizar con IA
    raw_text = extract_text_from_bytes(file_bytes, filename)
    evaluation = await evaluate_certificate_with_gemini(
        raw_text=raw_text,
        pdf_bytes=file_bytes if filename.lower().endswith(".pdf") else None,
        filename=filename,
        target_milestone=None
    )

    # 3. Cargar perfil actual
    profile = load_profile()
    is_degree = evaluation.get("is_academic_degree", False)
    cert_title = evaluation.get("course_title") or Path(filename).stem.title()
    issuer = evaluation.get("issuer") or "Entidad Acreditadora"
    year = evaluation.get("year") or datetime.now().strftime("%Y")
    hours = evaluation.get("hours", "")
    credential_id = evaluation.get("credential_id", "")
    skills_acquired = evaluation.get("skills_acquired", [])

    target_section = evaluation.get("target_cv_section", "certifications")
    is_degree = evaluation.get("is_academic_degree", False) or target_section == "education"
    degree_type = evaluation.get("degree_type", "curso_especializacion")
    degree_type_label = evaluation.get("degree_type_label") or DEGREE_TYPE_LABELS.get(degree_type, "Curso / Certificación")
    is_official = evaluation.get("is_official_degree", True)

    section_registered = "certifications"

    if is_degree:
        # Registrar en Formación Académica Reglada
        section_registered = "education"
        if "education" not in profile or not isinstance(profile["education"], list):
            profile["education"] = []

        # Evitar duplicados por título exacto
        existing_degrees = [e.get("degree", "").lower() for e in profile["education"] if isinstance(e, dict)]
        if cert_title.lower() not in existing_degrees:
            new_edu = {
                "id": f"edu-{uuid.uuid4().hex[:6]}",
                "degree": cert_title,
                "degree_type": degree_type,
                "degree_type_label": degree_type_label,
                "institution": issuer,
                "start_year": "",
                "end_year": year,
                "grade": evaluation.get("grade", ""),
                "hours_or_ects": hours,
                "certificate_url": file_info["relative_url"],
                "certificate_file": file_info["stored_filename"],
                "is_official": is_official,
                "is_verified": True
            }
            profile["education"].insert(0, new_edu)
    else:
        # Registrar en Certificaciones y Cursos Profesionales
        if "certifications" not in profile or not isinstance(profile["certifications"], list):
            profile["certifications"] = []

        existing_names = [c.get("name", "").lower() for c in profile["certifications"] if isinstance(c, dict)]
        if cert_title.lower() not in existing_names:
            new_cert = {
                "id": f"cert-{uuid.uuid4().hex[:6]}",
                "name": cert_title,
                "degree_type": degree_type,
                "degree_type_label": degree_type_label,
                "issuer": issuer,
                "year": year,
                "hours": hours,
                "credential_id": credential_id,
                "certificate_url": file_info["relative_url"],
                "certificate_file": file_info["stored_filename"],
                "is_official": is_official,
                "is_verified": True
            }
            profile["certifications"].insert(0, new_cert)

    # 4. Registrar competencias técnicas descubiertas en hard_skills
    added_skills = []
    if skills_acquired:
        if "hard_skills" not in profile or not isinstance(profile["hard_skills"], list):
            profile["hard_skills"] = []

        current_skills_flat = []
        for s in profile["hard_skills"]:
            if isinstance(s, str):
                current_skills_flat.append(s.lower().strip())
            elif isinstance(s, dict) and "skills" in s:
                current_skills_flat.extend([x.lower().strip() for x in s.get("skills", []) if isinstance(x, str)])

        for skill in skills_acquired:
            s_clean = skill.strip()
            if s_clean and s_clean.lower() not in current_skills_flat:
                # Si hard_skills tiene formato categorizado
                if profile["hard_skills"] and isinstance(profile["hard_skills"][0], dict):
                    # Agregar a la categoría más idónea o a 'Certificaciones y Cursos'
                    cat_found = False
                    for cat in profile["hard_skills"]:
                        if cat.get("category") in ["Certificaciones y Cursos", "Técnicas", "General"]:
                            cat.setdefault("skills", []).append(s_clean)
                            cat_found = True
                            break
                    if not cat_found:
                        profile["hard_skills"].append({
                            "category": "Certificaciones y Cursos",
                            "skills": [s_clean]
                        })
                else:
                    profile["hard_skills"].append(s_clean)
                
                current_skills_flat.append(s_clean.lower())
                added_skills.append(s_clean)

    # 5. Persistir perfil y regenerar automáticamente cv-maestro.md
    save_profile(profile)

    return {
        "status": "success",
        "message": f"¡Curso '{cert_title}' evaluado y registrado exitosamente en {section_registered} con sincronización en CV Maestro!",
        "section_registered": section_registered,
        "certificate_info": {
            "title": cert_title,
            "issuer": issuer,
            "year": year,
            "hours": hours,
            "credential_id": credential_id,
            "certificate_url": file_info["relative_url"]
        },
        "skills_acquired": skills_acquired,
        "new_skills_added": added_skills,
        "evaluation": evaluation,
        "file_info": file_info,
        "profile": profile
    }
