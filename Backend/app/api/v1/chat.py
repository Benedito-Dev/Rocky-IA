from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import ask
from app.services.tts_service import text_to_speech
import traceback
import base64

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = ask(request.message)
        return ChatResponse(response=response)
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.post("/speak")
async def speak(request: ChatRequest):
    try:
        text = ask(request.message)
        audio = await text_to_speech(text)
        audio_b64 = base64.b64encode(audio).decode("utf-8")
        return JSONResponse(content={"text": text, "audio": audio_b64})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})
