import base64
import json
import logging

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from groq import Groq

from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse
from app.services.llm_service import ask, ask_stream, ask_stream_async
from app.services.tts_service import flush_sentence, synthesize_sentence, text_to_speech

logger = logging.getLogger(__name__)

_groq = Groq(api_key=settings.GROQ_API_KEY)

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = ask(request.message)
        return ChatResponse(response=response)
    except Exception as e:
        logger.exception(f"Erro em /chat/: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/speak")
async def speak(request: ChatRequest):
    try:
        text = ask(request.message)
        audio = await text_to_speech(text)
        audio_b64 = base64.b64encode(audio).decode("utf-8")
        return JSONResponse(content={"text": text, "audio": audio_b64})
    except Exception as e:
        logger.exception(f"Erro em /chat/speak: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream")
async def stream(request: ChatRequest):
    def generate():
        try:
            for token in ask_stream(request.message):
                yield token
        except Exception as e:
            logger.error(f"Erro em /chat/stream: {e}")
            yield f"[ERRO: {str(e)}]"
    return StreamingResponse(generate(), media_type="text/plain")

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
        logger.exception(f"Erro em /chat/transcribe: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/speak-stream")
async def speak_stream(request: ChatRequest):
    """
    Endpoint SSE: LLM stream → acumula por sentença → TTS por sentença → emite chunks de áudio.
    Eventos emitidos:
      data: {"type": "text", "content": "<token>"}
      data: {"type": "audio", "text": "<sentença>", "data": "<base64_mp3>"}
      data: {"type": "done"}
    """
    async def generate():
        buffer = ""

        async for token in ask_stream_async(request.message):
            buffer += token
            yield f"data: {json.dumps({'type': 'text', 'content': token}, ensure_ascii=False)}\n\n"

            sentence, remaining = flush_sentence(buffer)
            if sentence:
                buffer = remaining
                try:
                    audio_bytes = await synthesize_sentence(sentence)
                    audio_b64 = base64.b64encode(audio_bytes).decode()
                    yield f"data: {json.dumps({'type': 'audio', 'text': sentence, 'data': audio_b64}, ensure_ascii=False)}\n\n"
                except Exception as exc:
                    logger.error(f"TTS chunk falhou para sentença '{sentence[:30]}...': {exc}")

        # Flush do buffer restante (última frase sem pontuação final)
        if buffer.strip() and len(buffer.strip()) > 3:
            try:
                audio_bytes = await synthesize_sentence(buffer.strip())
                audio_b64 = base64.b64encode(audio_bytes).decode()
                yield f"data: {json.dumps({'type': 'audio', 'text': buffer.strip(), 'data': audio_b64}, ensure_ascii=False)}\n\n"
            except Exception as exc:
                logger.error(f"TTS flush final falhou: {exc}")

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
