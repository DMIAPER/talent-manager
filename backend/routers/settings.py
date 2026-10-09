from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import os

from backend.services.config_service import get_api_keys_status, update_api_key, update_gemini_model

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class ApiKeyPayload(BaseModel):
    provider: str  # "gemini", "openai", "tavily"
    api_key: str

@router.get("/keys")
def get_keys():
    return get_api_keys_status()

@router.post("/keys")
def save_key(payload: ApiKeyPayload):
    if payload.provider not in ["gemini", "openai", "tavily"]:
        raise HTTPException(status_code=400, detail="Proveedor no compatible")
    
    success = update_api_key(payload.provider, payload.api_key)
    if not success:
        raise HTTPException(status_code=500, detail="Error guardando la clave en .env")
    
    return {
        "message": f"Clave de {payload.provider.upper()} guardada correctamente",
        "status": get_api_keys_status()
    }

class ModelPayload(BaseModel):
    model: str

@router.get("/gemini/models")
def get_gemini_models():
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_key:
        raise HTTPException(status_code=400, detail="API Key de Gemini no configurada")
    
    try:
        from google import genai
        client = genai.Client(api_key=gemini_key)
        # Buscar modelos que soportan generacion de contenido (texto)
        models = []
        for m in client.models.list():
            if "generateContent" in m.supported_actions:
                models.append({
                    "name": m.name.replace("models/", ""),
                    "display_name": m.display_name,
                    "description": m.description
                })
        # Ordenar modelos principales primero
        models.sort(key=lambda x: ("flash" not in x["name"].lower(), "pro" not in x["name"].lower(), x["name"]))
        return {"models": models}
    except ImportError:
        raise HTTPException(status_code=500, detail="Librería google-genai no está instalada")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo modelos: {str(e)}")

@router.post("/gemini/model")
def save_gemini_model(payload: ModelPayload):
    success = update_gemini_model(payload.model)
    if not success:
        raise HTTPException(status_code=500, detail="Error guardando el modelo en .env")
    
    return {
        "message": f"Modelo Gemini '{payload.model}' seleccionado correctamente",
        "status": get_api_keys_status()
    }

@router.post("/gemini/test")
def test_gemini_connection():
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    
    if not gemini_key:
        raise HTTPException(status_code=400, detail="API Key de Gemini no configurada")
        
    try:
        from google import genai
        client = genai.Client(api_key=gemini_key)
        response = client.models.generate_content(
            model=gemini_model,
            contents="Responde únicamente con la palabra 'OK'."
        )
        if response.text:
            return {"message": f"¡Conexión exitosa! El modelo {gemini_model} está respondiendo correctamente."}
        else:
            raise HTTPException(status_code=500, detail="El modelo no devolvió ningún texto.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")
