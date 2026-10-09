from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from backend.models.linkedin import WeeklyStat, ProfileAuditItem
from backend.services.data_store import load_json, save_json

router = APIRouter(prefix="/api/linkedin", tags=["LinkedIn Hub"])
DATA_FILE = "linkedin_stats.json"

class HeadlineUpdate(BaseModel):
    headline: str

@router.get("/data")
def get_linkedin_data():
    return load_json(DATA_FILE, {})

@router.post("/stats")
def add_weekly_stat(stat: WeeklyStat):
    data = load_json(DATA_FILE, {})
    if "weekly_stats" not in data:
        data["weekly_stats"] = []
    data["weekly_stats"].append(stat.model_dump())
    save_json(DATA_FILE, data)
    return data["weekly_stats"]

@router.post("/checklist/{item_id}/toggle")
def toggle_checklist_item(item_id: str):
    data = load_json(DATA_FILE, {})
    for i, item in enumerate(data.get("audit_checklist", [])):
        if item.get("id") == item_id:
            data["audit_checklist"][i]["completed"] = not data["audit_checklist"][i]["completed"]
            save_json(DATA_FILE, data)
            return data["audit_checklist"][i]
    raise HTTPException(status_code=404, detail="Elemento de auditoría no encontrado")

@router.put("/headline")
def update_headline(payload: HeadlineUpdate):
    data = load_json(DATA_FILE, {})
    data["current_headline"] = payload.headline
    save_json(DATA_FILE, data)
    return {"headline": data["current_headline"]}
