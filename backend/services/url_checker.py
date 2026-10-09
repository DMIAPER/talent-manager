import httpx
from datetime import datetime
from typing import Dict, Any

RETRACTED_INDICATORS = [
    "oferta no disponible",
    "oferta retirada",
    "proceso cerrado",
    "este anuncio ha caducado",
    "vacante no encontrada",
    "ha expirado",
    "job expired",
    "position closed",
    "job no longer available"
]

async def check_job_url(url: str) -> Dict[str, Any]:
    if not url or not url.startswith("http"):
        return {
            "is_active": False,
            "status_code": 0,
            "message": "URL no válida o vacía",
            "checked_at": datetime.now().isoformat()
        }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            
            # Si el código es 404, 410 o 500, la oferta ya no existe
            if response.status_code in [404, 410]:
                return {
                    "is_active": False,
                    "status_code": response.status_code,
                    "message": f"Oferta retirada o enlace no encontrado (HTTP {response.status_code})",
                    "checked_at": datetime.now().isoformat()
                }

            if response.status_code >= 400:
                return {
                    "is_active": False,
                    "status_code": response.status_code,
                    "message": f"Acceso restringido o error en el portal (HTTP {response.status_code})",
                    "checked_at": datetime.now().isoformat()
                }

            # Si el código es 200, comprobar si el contenido dice que la oferta expiró
            content_lower = response.text.lower()
            for indicator in RETRACTED_INDICATORS:
                if indicator in content_lower:
                    return {
                        "is_active": False,
                        "status_code": response.status_code,
                        "message": f"Detectado aviso de cierre: '{indicator}'",
                        "checked_at": datetime.now().isoformat()
                    }

            return {
                "is_active": True,
                "status_code": response.status_code,
                "message": "Oferta activa y verificada en el portal",
                "checked_at": datetime.now().isoformat()
            }
    except httpx.TimeoutException:
        return {
            "is_active": False,
            "status_code": 408,
            "message": "Tiempo de espera agotado al verificar la web",
            "checked_at": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "is_active": False,
            "status_code": 500,
            "message": f"Error de conexión: {str(e)[:100]}",
            "checked_at": datetime.now().isoformat()
        }
