import json
import os
from pathlib import Path
from typing import List, Dict, Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def _ensure_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_json(filename: str, default: Any = None) -> Any:
    _ensure_data_dir()
    filepath = DATA_DIR / filename
    if not filepath.exists():
        if default is not None:
            save_json(filename, default)
            return default
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return default if default is not None else []

def save_json(filename: str, data: Any) -> bool:
    _ensure_data_dir()
    filepath = DATA_DIR / filename
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False
