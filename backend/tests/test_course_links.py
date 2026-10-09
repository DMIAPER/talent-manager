import unittest
import asyncio
from backend.services.course_search_service import (
    clean_canonical_url,
    clean_course_title,
    is_exact_course_url,
    verify_url_live,
    verify_course_link,
    test_and_verify_links
)

class TestCourseLinks(unittest.TestCase):

    def test_clean_canonical_url(self):
        # 1. Normal URL with tracking params
        raw = "https://www.coursera.org/learn/docker-for-the-absolute-beginner?utm_source=google&utm_medium=cpc&ref=123"
        cleaned = clean_canonical_url(raw)
        self.assertEqual(cleaned, "https://www.coursera.org/learn/docker-for-the-absolute-beginner")

        # 2. DuckDuckGo redirect unpacking
        ddg_url = "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.coursera.org%2Flearn%2Fdocker-for-the-absolute-beginner&rut=xyz"
        cleaned_ddg = clean_canonical_url(ddg_url)
        self.assertEqual(cleaned_ddg, "https://www.coursera.org/learn/docker-for-the-absolute-beginner")

        # 3. Google redirect unpacking
        google_url = "https://www.google.com/url?q=https%3A%2F%2Faws.amazon.com%2Fcertification%2Fcertified-devops-engineer-professional&sa=U"
        cleaned_google = clean_canonical_url(google_url)
        self.assertEqual(cleaned_google, "https://aws.amazon.com/certification/certified-devops-engineer-professional")

        # 4. Bing redirect unpacking (with a1 prefix)
        bing_url = "https://www.bing.com/ck/a?!&&p=abc&u=a1aHR0cHM6Ly93d3cuZWR4Lm9yZy9sZWFybi9kb2NrZXI"
        cleaned_bing = clean_canonical_url(bing_url)
        self.assertIn("https://www.edx.org/learn/docker", cleaned_bing)

        # 5. Empty or invalid URL
        self.assertEqual(clean_canonical_url(""), "")
        self.assertEqual(clean_canonical_url(None), "")

    def test_clean_course_title(self):
        raw_snippet = "Docker for Beginners with Hands-on labs - CourseraIntroduction to Docker - Coursera"
        cleaned = clean_course_title(raw_snippet)
        self.assertNotIn("Coursera", cleaned)
        self.assertTrue(len(cleaned) < len(raw_snippet))

    def test_is_exact_course_url(self):
        # Valid courses
        self.assertTrue(is_exact_course_url("https://www.coursera.org/learn/docker-for-the-absolute-beginner"))
        self.assertTrue(is_exact_course_url("https://aws.amazon.com/certification/certified-devops-engineer-professional"))
        self.assertTrue(is_exact_course_url("https://www.aenor.com/certificacion/empresas/calidad/iso-9001"))
        self.assertTrue(is_exact_course_url("https://www.udemy.com/course/learn-docker"))
        self.assertTrue(is_exact_course_url("https://learn.microsoft.com/credentials/certifications/azure-developer"))

        # Invalid / generic / aggregators
        self.assertFalse(is_exact_course_url("https://duckduckgo.com/l/?uddg=123"))
        self.assertFalse(is_exact_course_url("https://www.coursera.org/courses?query=docker"))
        self.assertFalse(is_exact_course_url("https://www.google.com/search?q=docker"))
        self.assertFalse(is_exact_course_url("https://www.coursera.org"))
        self.assertFalse(is_exact_course_url("https://www.aenor.com/"))
        self.assertFalse(is_exact_course_url(""))

    def test_verify_url_live_real_and_fake(self):
        async def run_test():
            # Enlace real verificado (debe devolver is_live == True)
            real_url = "https://aws.amazon.com/certification/certified-devops-engineer-professional"
            is_live, status, final_url = await verify_url_live(real_url)
            self.assertTrue(is_live)
            self.assertTrue(200 <= status < 400)

            # Enlace falso / inexistente (debe devolver is_live == False y status == 404)
            fake_url = "https://www.coursera.org/learn/curso-inexistente-totalmente-falso-12345"
            is_live_fake, status_fake, _ = await verify_url_live(fake_url)
            self.assertFalse(is_live_fake)
            self.assertEqual(status_fake, 404)

        asyncio.run(run_test())

    def test_verify_course_link_endpoint_logic(self):
        async def run_test():
            real_url = "https://www.coursera.org/learn/foundations-of-cybersecurity"
            res = await verify_course_link(real_url)
            self.assertTrue(res["is_live"])
            self.assertEqual(res["http_status"], 200)
            self.assertIn("Activo", res["status_label"])

            fake_url = "https://www.coursera.org/learn/fakexyz-no-existe-404"
            res_fake = await verify_course_link(fake_url)
            self.assertFalse(res_fake["is_live"])
            self.assertEqual(res_fake["http_status"], 404)
            self.assertIn("404", res_fake["status_label"])

        asyncio.run(run_test())

    def test_batch_verify_links(self):
        async def run_test():
            urls = [
                "https://aws.amazon.com/certification/certified-devops-engineer-professional",
                "https://www.coursera.org/learn/non-existent-course-abc-404"
            ]
            batch_res = await test_and_verify_links(urls)
            self.assertEqual(len(batch_res), 2)
            self.assertTrue(batch_res[0]["is_live"])
            self.assertFalse(batch_res[1]["is_live"])

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
