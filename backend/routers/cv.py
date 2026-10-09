from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.services.cv_parser import extract_text_from_bytes, save_cv_as_master, get_current_cv_info

router = APIRouter(prefix="/api/cv", tags=["CV Management"])

@router.get("/current")
def get_cv():
    return get_current_cv_info()

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    allowed_extensions = ["pdf", "docx", "doc", "txt", "md"]
    ext = file.filename.lower().split(".")[-1]
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no permitido: .{ext}. Sube un archivo en formato PDF, Word (.docx) o Texto (.txt/.md)."
        )

    try:
        content_bytes = await file.read()
        extracted_text = extract_text_from_bytes(content_bytes, file.filename)
        result = save_cv_as_master(extracted_text, file.filename)
        return {
            "message": f"¡CV '{file.filename}' procesado y guardado como Fuente de Verdad!",
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
