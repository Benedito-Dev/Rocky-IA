import base64
import json
import logging

from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from groq import Groq

from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse, FactItem, SummarizeResponse
from app.services.llm_service import ask, ask_stream, ask_stream_async, ask_with_control
from app.services.tts_service import flush_sentence, synthesize_sentence, text_to_speech
from app.services.memory_service import memory
from app.services import long_term_memory_service

logger = logging.getLogger(__name__)

_groq = Groq(api_key=settings.GROQ_API_KEY)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/")
async def chat(request: ChatRequest):
    try:
        reply, control_result = await ask_with_control(request.message)
        response_body: dict = {"response": reply}
        if control_result is not None:
            response_body["action_executed"] = control_result.model_dump()
        return JSONResponse(content=response_body)
    except Exception as e:
        logger.exception(f"Erro em /chat/: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/speak")
async def speak(request: ChatRequest):
    try:
        text = await ask(request.message)
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
        reply, control_result = await ask_with_control(user_text)
        audio = await text_to_speech(reply)
        audio_b64 = base64.b64encode(audio).decode("utf-8")
        response_body = {"transcription": user_text, "text": reply, "audio": audio_b64}
        if control_result is not None:
            response_body["action_executed"] = control_result.model_dump()
        return JSONResponse(content=response_body)
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
      data: {"type": "control", "action_executed": {...}}  (somente para comandos de controle)
      data: {"type": "done"}

    Para comandos de controle: executa ação, retorna resposta curta (sem stream).
    Para conversa normal: fluxo SSE normal.
    """
    from app.services import intent_service

    # Verificar intenção antes de decidir o modo de resposta
    intent = await intent_service.classify_intent(request.message)

    if intent == "control":
        # Comandos de controle: resposta rápida sem streaming
        # parse_command e execute são chamados diretamente para evitar re-classificar
        async def generate_control():
            cmd = await intent_service.parse_command(request.message)
            if cmd is None:
                # Parse falhou: cai para resposta de conversa normal (não stream)
                fallback_reply = await ask(request.message)
                yield f"data: {json.dumps({'type': 'text', 'content': fallback_reply}, ensure_ascii=False)}\n\n"
                try:
                    audio_bytes = await synthesize_sentence(fallback_reply)
                    audio_b64 = base64.b64encode(audio_bytes).decode()
                    yield f"data: {json.dumps({'type': 'audio', 'text': fallback_reply, 'data': audio_b64}, ensure_ascii=False)}\n\n"
                except Exception as exc:
                    logger.error(f"TTS falhou no fallback de controle: {exc}")
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            if cmd.requires_confirmation:
                app_name = cmd.params.get("app", "aplicativo")
                reply = (
                    f"Fechar o {app_name.capitalize()} pode perder trabalho não salvo. "
                    f"Confirmar, pergunta?"
                )
                control_result = None
            else:
                import asyncio as _asyncio
                from app.services import control_service
                control_result_obj = await _asyncio.to_thread(control_service.execute, cmd)
                # Gerar confirmação Rocky via LLM
                status = "sucesso" if control_result_obj.success else "falha"
                conf_prompt = (
                    f"Ação executada: {control_result_obj.action}. Status: {status}. "
                    f"Resultado: {control_result_obj.message}. "
                    f"Gere uma resposta curta e direta no estilo Rocky confirmando o resultado."
                )
                reply = await ask(conf_prompt)
                control_result = control_result_obj

            yield f"data: {json.dumps({'type': 'text', 'content': reply}, ensure_ascii=False)}\n\n"
            if control_result is not None:
                yield f"data: {json.dumps({'type': 'control', 'action_executed': control_result.model_dump()}, ensure_ascii=False)}\n\n"
            try:
                audio_bytes = await synthesize_sentence(reply)
                audio_b64 = base64.b64encode(audio_bytes).decode()
                yield f"data: {json.dumps({'type': 'audio', 'text': reply, 'data': audio_b64}, ensure_ascii=False)}\n\n"
            except Exception as exc:
                logger.error(f"TTS falhou para resposta de controle: {exc}")
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(
            generate_control(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

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


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: Request):
    """
    Extrai e salva fatos relevantes da sessão atual na memória de longo prazo.
    Aceita body vazio (compatível com navigator.sendBeacon que envia Content-Type: text/plain).
    """
    try:
        recent = memory.get()[-10:]
        if not recent:
            return SummarizeResponse(facts_saved=0, facts=[])
        facts = await long_term_memory_service.extract_and_save_facts(recent)
        return SummarizeResponse(
            facts_saved=len(facts),
            facts=[FactItem(**f) for f in facts]
        )
    except Exception as e:
        logger.exception(f"Erro em /chat/summarize: {e}")
        raise HTTPException(status_code=500, detail=str(e))
