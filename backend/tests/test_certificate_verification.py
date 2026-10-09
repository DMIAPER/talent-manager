import unittest
import asyncio
import os
import json
from pathlib import Path

from backend.services.certificate_verifier import (
    sanitize_filename,
    save_certificate_file,
    parse_certificate_heuristic,
    evaluate_and_register_profile_certificate,
    verify_and_complete_milestone_certificate,
    CERTIFICATES_DIR
)
from backend.services.profile_service import load_profile, CV_MAESTRO_PATH
from backend.services.data_store import load_json


class TestCertificateVerification(unittest.TestCase):

    def test_sanitize_filename(self):
        dirty = "Certificado de Ciberseguridad & Redes (2024)!?.pdf"
        clean = sanitize_filename(dirty)
        self.assertTrue(clean.endswith(".pdf"))
        self.assertNotIn("&", clean)
        self.assertNotIn("?", clean)
        self.assertNotIn("!", clean)

    def test_save_certificate_file(self):
        dummy_content = b"%PDF-1.4 dummy certificate content for unit testing"
        res = save_certificate_file(dummy_content, "test_diploma.pdf", prefix="test")
        
        self.assertIn("stored_filename", res)
        self.assertIn("relative_url", res)
        self.assertTrue(Path(res["file_path"]).exists())
        self.assertEqual(res["file_size"], len(dummy_content))

        # Cleanup
        try:
            os.remove(res["file_path"])
        except Exception:
            pass

    def test_parse_certificate_heuristic(self):
        sample_text = """
        CERTIFICADO DE ACREDITACIÓN PROFESIONAL
        Se certifica que DIÓGENES MIAJA PÉREZ ha completado con éxito el
        Curso Avanzado de Seguridad Cloud y DevSecOps
        Emitido por Coursera en colaboración con Google Cloud
        Duración total estimada: 60 horas lectivas
        Fecha de finalización: 2024
        ID de Credencial: COURSERA-SEC-998877
        """
        parsed = parse_certificate_heuristic(sample_text, "certificado_cloud.pdf")
        
        self.assertIn("Seguridad Cloud", parsed["course_title"])
        self.assertEqual(parsed["issuer"], "Coursera")
        self.assertEqual(parsed["hours"], "60")
        self.assertEqual(parsed["year"], "2024")
        self.assertEqual(parsed["credential_id"], "COURSERA-SEC-998877")
        self.assertTrue(parsed["is_verified"])

    def test_horizontal_diploma_fp_superior_with_noise(self):
        horizontal_fp_text = """
        JUAN CARLOS I / FELIPE VI, REY DE ESPAÑA
        Y en su nombre la Consejera de Educación de la Comunidad de Madrid
        Otorga a Don CARLOS GARCÍA LÓPEZ, nacido el 14 de marzo de 1998 en Madrid, con DNI 12345678Z,
        el título oficial de:
        TÉCNICO SUPERIOR EN DESARROLLO DE APLICACIONES MULTIPLATAFORMA
        con validez en todo el territorio nacional, expedido en Madrid a 24 de junio de 2022.
        Registro Nacional de Títulos: 2022/987654. Libro 45, Folio 12, Número 89.
        """
        parsed = parse_certificate_heuristic(horizontal_fp_text, "titulo_fp_dam.pdf")

        self.assertEqual(parsed["degree_type"], "fp_superior")
        self.assertEqual(parsed["target_cv_section"], "education")
        self.assertTrue(parsed["is_academic_degree"])
        self.assertTrue(parsed["is_official_degree"])
        self.assertIn("Desarrollo de Aplicaciones Multiplataforma", parsed["course_title"])
        self.assertNotIn("DNI", parsed["course_title"])
        self.assertNotIn("nacido", parsed["course_title"])
        self.assertTrue(len(parsed["filtered_noise"]) >= 2)
        # Verify student name clean extraction
        self.assertIn("CARLOS GARCÍA LÓPEZ", parsed["student_name"])

    def test_horizontal_diploma_university_degree_with_noise(self):
        horizontal_uni_text = """
        FELIPE VI, REY DE ESPAÑA
        Y en su nombre el Rector Magnífico de la Universidad Complutense de Madrid
        Hace constar que Don MIGUEL ÁNGEL RUIZ GÓMEZ, de 25 años de edad, natural de Toledo,
        con documento nacional de identidad número 87654321A, ha superado los estudios del
        GRADO EN INGENIERÍA DEL SOFTWARE
        con una dedicación de 240 créditos ECTS.
        Expedido con fecha 15 de julio de 2023. Libro de Grados número 12, folio 78.
        """
        parsed = parse_certificate_heuristic(horizontal_uni_text, "grado_software.pdf")

        self.assertEqual(parsed["degree_type"], "universidad_grado")
        self.assertEqual(parsed["target_cv_section"], "education")
        self.assertTrue(parsed["is_academic_degree"])
        self.assertTrue(parsed["is_official_degree"])
        self.assertIn("Ingeniería del Software", parsed["course_title"])
        self.assertNotIn("25 años", parsed["course_title"])
        self.assertIn("240", parsed["hours"])
        self.assertIn("MIGUEL ÁNGEL RUIZ GÓMEZ", parsed["student_name"])

    def test_certificado_profesionalidad_sepe(self):
        sepe_text = """
        MINISTERIO DE TRABAJO Y ECONOMÍA SOCIAL
        SERVICIO PÚBLICO DE EMPLEO ESTATAL (SEPE)
        Certificado de Profesionalidad:
        ADMINISTRACIÓN Y PROGRAMACIÓN DE REDES Y SISTEMAS (IFCT0410)
        Otorgado a Doña LAURA SÁNCHEZ MARTÍN, DNI 44556677B.
        Duración: 590 horas.
        Expedido el 10 de octubre de 2023.
        """
        parsed = parse_certificate_heuristic(sepe_text, "cert_profesionalidad.pdf")

        self.assertEqual(parsed["degree_type"], "certificado_profesionalidad")
        self.assertEqual(parsed["target_cv_section"], "certifications")
        self.assertFalse(parsed["is_academic_degree"])
        self.assertTrue(parsed["is_official_degree"])
        self.assertIn("IFCT0410", parsed["course_title"])
        self.assertEqual(parsed["hours"], "590")
        self.assertIn("SEPE", parsed["issuer"])

    def test_profile_certificate_registration(self):
        sample_text = """
        DIPLOMA DE SUPERACIÓN
        Curso de Especialización en Kubernetes y Docker en Producción
        Emitido por AWS Training & Certification
        Dedicación: 45 horas
        Año: 2024
        Credencial: AWS-K8S-2024-ABC
        """
        # Create minimal PDF bytes using pymupdf
        import pymupdf
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((50, 50), sample_text)
        pdf_bytes = doc.tobytes()
        doc.close()

        res = asyncio.run(evaluate_and_register_profile_certificate(
            file_bytes=pdf_bytes,
            filename="aws_kubernetes_diploma.pdf"
        ))

        self.assertEqual(res["status"], "success")
        self.assertIn("certificate_info", res)
        self.assertTrue(res["certificate_info"]["title"])
        
        # Verify in profile
        profile = load_profile()
        cert_names = [c.get("name", "").lower() for c in profile.get("certifications", [])]
        found = any("kubernetes" in name or "aws" in name or "curso" in name for name in cert_names)
        self.assertTrue(found, "Certificate was not found in profile certifications list")

        # Verify in CV Maestro markdown file
        self.assertTrue(CV_MAESTRO_PATH.exists())
        with open(CV_MAESTRO_PATH, "r", encoding="utf-8") as f:
            cv_text = f.read()
        self.assertTrue(len(cv_text) > 100)

    def test_milestone_certificate_verification(self):
        plans = load_json("career_plans.json", [])
        if not plans or not plans[0].get("branches"):
            self.skipTest("No career plans available to test milestone verification")

        plan = plans[0]
        plan_id = plan.get("id")
        branch = plan.get("branches")[0]
        milestone = branch.get("milestones")[0]
        ms_id = milestone.get("id")
        ms_title = milestone.get("title")

        sample_text = f"""
        CERTIFICADO OFICIAL
        Acreditamos que el participante ha superado con éxito la formación:
        {ms_title}
        Impartido por {milestone.get('provider', 'Coursera')}
        Horas: {milestone.get('duration_hours', 40)} horas
        Año de expedición: 2024
        ID: CERT-{ms_id}
        """

        import pymupdf
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((50, 50), sample_text)
        pdf_bytes = doc.tobytes()
        doc.close()

        res = asyncio.run(verify_and_complete_milestone_certificate(
            plan_id=plan_id,
            milestone_id=ms_id,
            file_bytes=pdf_bytes,
            filename=f"cert_{ms_id}.pdf"
        ))

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["milestone"]["status"], "completed")
        self.assertTrue(res["milestone"].get("certificate_verified"))
        self.assertTrue(res["milestone"].get("certificate_file"))

    def test_download_certificate_endpoint(self):
        """Verifica que el endpoint de descarga devuelve el archivo con Content-Disposition: attachment y nombre limpio."""
        from fastapi.testclient import TestClient
        from backend.main import app
        
        # Crear un archivo de prueba
        test_file = CERTIFICATES_DIR / "profile_cert_20261009_120000_abcdef_test_diploma_download.pdf"
        test_file.write_bytes(b"%PDF-1.4 test download pdf content")
        
        try:
            client = TestClient(app)
            response = client.get(f"/api/certificates-download/{test_file.name}")
            self.assertEqual(response.status_code, 200)
            self.assertIn("attachment", response.headers.get("content-disposition", ""))
            self.assertIn("test_diploma_download.pdf", response.headers.get("content-disposition", ""))
            self.assertEqual(response.content, b"%PDF-1.4 test download pdf content")

            # Probar 404 para archivo inexistente
            res_404 = client.get("/api/certificates-download/archivo_inexistente_12345.pdf")
            self.assertEqual(res_404.status_code, 404)
        finally:
            if test_file.exists():
                test_file.unlink()


if __name__ == "__main__":
    unittest.main()

