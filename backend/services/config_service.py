import os
from pathlib import Path
from dotenv import load_dotenv, set_key
from typing import Dict, Any

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

def init_env():
    if not ENV_PATH.exists():
        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.write("# Talent Manager Pro - Configuración de API Keys\n")
            f.write("GEMINI_API_KEY=\n")
            f.write("GEMINI_MODEL=gemini-flash-latest\n")
            f.write("OPENAI_API_KEY=\n")
            f.write("TAVILY_API_KEY=\n")
    load_dotenv(ENV_PATH, override=True)

init_env()

def get_api_keys_status() -> Dict[str, Any]:
    load_dotenv(ENV_PATH, override=True)
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")
    tavily_key = os.getenv("TAVILY_API_KEY", "")

    gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

    def mask_key(k: str) -> str:
        if not k or len(k) < 8:
            return ""
        return k[:6] + "..." + k[-4:]

    return {
        "gemini": {
            "configured": bool(gemini_key.strip()),
            "masked": mask_key(gemini_key),
            "model": gemini_model
        },
        "openai": {
            "configured": bool(openai_key.strip()),
            "masked": mask_key(openai_key)
        },
        "tavily": {
            "configured": bool(tavily_key.strip()),
            "masked": mask_key(tavily_key)
        },
        "env_file_path": str(ENV_PATH)
    }

def update_api_key(provider: str, key_value: str) -> bool:
    load_dotenv(ENV_PATH, override=True)
    var_name = f"{provider.upper()}_API_KEY"
    try:
        set_key(str(ENV_PATH), var_name, key_value.strip())
        os.environ[var_name] = key_value.strip()
        load_dotenv(ENV_PATH, override=True)
        return True
    except Exception as e:
        print(f"Error updating API key: {e}")
        return False

def update_gemini_model(model_name: str) -> bool:
    load_dotenv(ENV_PATH, override=True)
    try:
        set_key(str(ENV_PATH), "GEMINI_MODEL", model_name.strip())
        os.environ["GEMINI_MODEL"] = model_name.strip()
        load_dotenv(ENV_PATH, override=True)
        return True
    except Exception as e:
        print(f"Error updating Gemini model: {e}")
        return False
