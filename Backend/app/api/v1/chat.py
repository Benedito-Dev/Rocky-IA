from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import ask
from app.services.tts_service import text_to_speech
from groq import Groq
from app.core.config import settings
import traceback
import base64

_groq = Groq(api_key=settings.GROQ_API_KEY)

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

@router.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        transcription = _groq.audio.transcriptions.create(
            file=(file.filename, audio_bytes),
            model="whisper-large-v3-turbo",
            language="pt",
        )
        user_text = transcription.text.strip()
        if not user_text:
            return JSONResponse(status_code=400, content={"detail": "Áudio sem conteúdo."})
        reply = ask(user_text)
        audio = await text_to_speech(reply)
        audio_b64 = base64.b64encode(audio).decode("utf-8")
        return JSONResponse(content={"transcription": user_text, "text": reply, "audio": audio_b64})
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": str(e)})
