import unittest
import asyncio
from unittest.mock import patch

from backend.services.agent_browser import (
    get_specialized_skill_context,
    build_honest_profile_diagnosis,
    agent_chat_conversation
)
from backend.services.career_advisor import (
    load_career_skill_text,
    chat_with_career_advisor
)

class TestAgentAndCareerSkills(unittest.TestCase):

    def test_get_specialized_skill_context_cv_audit(self):
        """Verifica que consultas de auditoría de CV cargan las skills de reclutador y optimizador ATS."""
        context = get_specialized_skill_context("Por favor evalúa mi CV y calcula el encaje ATS")
        self.assertTrue(len(context) > 100)
        # Debe contener referencias a reclutador o ATS
        self.assertTrue("ATS" in context or "reclutador" in context.lower() or "evaluador" in context.lower())

    def test_get_specialized_skill_context_career_path(self):
        """Verifica que consultas de itinerario cargan la skill de orientador de itinerarios y cursos."""
        context = get_specialized_skill_context("Quiero planificar mi carrera y ver qué certificaciones estudiar")
        self.assertTrue(len(context) > 100)
        self.assertTrue("itinerario" in context.lower() or "certificaci" in context.lower() or "orientador" in context.lower())

    def test_get_specialized_skill_context_job_search(self):
        """Verifica que consultas de empleo cargan la skill de búsqueda de empleo."""
        context = get_specialized_skill_context("Busca ofertas de trabajo remoto para mi perfil")
        self.assertTrue(len(context) > 100)
        self.assertTrue("job" in context.lower() or "búsqueda" in context.lower() or "opportunities" in context.lower())

    def test_build_honest_profile_diagnosis_empty(self):
        """Verifica que un perfil vacío no inventa ningún rol ni tecnología."""
        empty_profile = {
            "personal_info": {"headline": ""},
            "work_experience": [],
            "education": [],
            "hard_skills": []
        }
        res = build_honest_profile_diagnosis(empty_profile, "")
        self.assertFalse(res["has_cv"])
        self.assertEqual(len(res["recommendations"]), 0)
        # Cero fabricación de Python, Flutter, etc.
        summary_lower = res["summary"].lower()
        self.assertNotIn("python", summary_lower)
        self.assertNotIn("flutter", summary_lower)

    def test_build_honest_profile_diagnosis_with_data(self):
        """Verifica que un perfil con datos reales extrae únicamente las titulaciones y puestos reales."""
        real_profile = {
            "personal_info": {"headline": "Administrador de Sistemas Linux & Cloud"},
            "work_experience": [
                {"role": "SysAdmin DevOps", "company": "Tech Corp"}
            ],
            "education": [
                {"degree": "Grado Superior ASIR", "institution": "IES Tecnológico"}
            ],
            "hard_skills": ["Linux", "Docker", "Kubernetes"]
        }
        res = build_honest_profile_diagnosis(real_profile, "Experiencia como SysAdmin DevOps con Linux y Docker.")
        self.assertTrue(res["has_cv"])
        # Las recomendaciones deben basarse en el puesto real o titulación real
        roles_recommended = [r["role"] for r in res["recommendations"]]
        self.assertTrue(any("SysAdmin DevOps" in r or "ASIR" in r or "Linux" in r for r in roles_recommended))
        # No debe inventar Flutter ni Frontend
        for r in roles_recommended:
            self.assertNotIn("Flutter", r)
            self.assertNotIn("Frontend React", r)

    def test_load_career_skill_text(self):
        """Verifica que se cargan los manuales de orientador e itinerarios."""
        text = load_career_skill_text()
        self.assertTrue(len(text) > 100)
        self.assertTrue("itinerario" in text.lower() or "orientador" in text.lower())

    def test_career_advisor_fallback_socratic_questions(self):
        """Verifica que cuando el asesor entra en fallback, realiza preguntas socráticas sin asumir supuestos."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            with patch("backend.services.agent_browser.get_gemini_client", return_value=(None, "")):
                res = loop.run_until_complete(
                    chat_with_career_advisor(
                        messages=[],
                        user_message="Hola, no sé por dónde enfocar mi siguiente paso profesional"
                    )
                )
                self.assertIn("reply", res)
                self.assertIn("quick_replies", res)
                self.assertTrue(len(res["quick_replies"]) >= 2)
                # Verifica que formula preguntas de descubrimiento
                reply = res["reply"]
                self.assertTrue("?" in reply)
                self.assertFalse(res.get("plan_modified"))
        finally:
            loop.close()

if __name__ == "__main__":
    unittest.main()
