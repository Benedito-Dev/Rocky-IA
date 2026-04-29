import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SENTENCE_ENDINGS = {'.', '!', '?', '\n'}
MIN_SENTENCE_CHARS = 15


def flush_sentence(buffer: str) -> tuple[str, str]:
    """
    Varre o buffer procurando o primeiro fim de sentença após MIN_SENTENCE_CHARS.
    Retorna (sentença_para_tts, buffer_restante).
    Se não encontrar sentença completa, retorna ("", buffer).
    """
    for i, ch in enumerate(buffer):
        if ch in SENTENCE_ENDINGS and i + 1 >= MIN_SENTENCE_CHARS:
            return buffer[:i + 1].strip(), buffer[i + 1:].lstrip()
    return "", buffer


async def synthesize_sentence(text: str) -> bytes:
    """
    Sintetiza uma sentença via ElevenLabs e retorna os bytes de áudio.
    Reutiliza a mesma configuração de text_to_speech.
    """
    return await text_to_speech(text)


async def text_to_speech(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": settings.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        }
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.content
