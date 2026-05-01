"""
intent_service — classifica intenção e parseia comandos de controle de PC.

Fluxo:
  classify_intent(message) -> "control" | "conversation"
  parse_command(message)   -> ControlCommand | None
"""
import asyncio
import json
import logging

from groq import Groq

from app.core.config import settings
from app.models.control import ControlAction, ControlCommand

logger = logging.getLogger(__name__)

_client = Groq(api_key=settings.GROQ_API_KEY)

# Lista das ações válidas para incluir no prompt de parse
_ACTION_LIST = ", ".join(a.value for a in ControlAction)

_CLASSIFY_SYSTEM = """Você é um classificador de intenção. Responda APENAS com JSON válido, sem texto adicional.

Formato:
{"type": "control"}
ou
{"type": "conversation"}

"control" = comandos de ação no PC: abrir/fechar apps, volume, print/screenshot, janelas, URLs.
"conversation" = tudo mais: perguntas, chat, análise, código, conteúdo, etc."""

_PARSE_SYSTEM = f"""Você extrai comandos de controle de PC. Responda APENAS com JSON válido, sem texto adicional.

Ações disponíveis: {_ACTION_LIST}

Formato obrigatório:
{{
  "action": "<nome_da_acao>",
  "params": {{}},
  "requires_confirmation": false
}}

Regras de params:
- open_app / close_app: {{"app": "<nome>"}} — use nomes em inglês minúsculo: spotify, chrome, firefox, vscode, notepad, calculator, explorer, discord, telegram, whatsapp
- open_url: {{"url": "<url completa com https://>"}}
- volume_up / volume_down: {{"amount": <número 1-100>}} — padrão 10 se não especificado
- screenshot: {{"save_path": "<caminho>"}} — omitir se não especificado
- Outras ações: params vazio {{}}

requires_confirmation = true APENAS para close_app (pode perder trabalho não salvo)."""


async def classify_intent(message: str) -> str:
    """
    Classifica a mensagem como "control" ou "conversation" via LLM.
    Fallback para "conversation" em caso de erro ou parse inválido.
    """
    try:
        raw = await asyncio.to_thread(
            _client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _CLASSIFY_SYSTEM},
                {"role": "user", "content": message},
            ],
            response_format={"type": "json_object"},
            max_tokens=20,
        )
        content = raw.choices[0].message.content or ""
        data = json.loads(content)
        intent_type = data.get("type", "conversation")
        if intent_type not in ("control", "conversation"):
            intent_type = "conversation"
        logger.info(f"classify_intent: '{intent_type}' para mensagem de {len(message)} chars")
        return intent_type
    except Exception as e:
        logger.warning(f"classify_intent falhou ({e}) — fallback para 'conversation'")
        return "conversation"


async def parse_command(message: str) -> ControlCommand | None:
    """
    Extrai ação e parâmetros de uma mensagem de controle via LLM.
    Tenta até 2 vezes. Retorna None se ambas falharem.
    """
    for attempt in range(1, 3):
        try:
            raw = await asyncio.to_thread(
                _client.chat.completions.create,
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": _PARSE_SYSTEM},
                    {"role": "user", "content": message},
                ],
                response_format={"type": "json_object"},
                max_tokens=120,
            )
            content = raw.choices[0].message.content or ""
            data = json.loads(content)

            action_raw = data.get("action", "")
            params = data.get("params", {})
            requires_confirmation = bool(data.get("requires_confirmation", False))

            # Validar action contra enum (segurança: nunca aceitar string arbitrária)
            action = ControlAction(action_raw)

            cmd = ControlCommand(
                action=action,
                params=params if isinstance(params, dict) else {},
                requires_confirmation=requires_confirmation,
            )
            logger.info(f"parse_command: ação={cmd.action.value}, params={cmd.params}")
            return cmd

        except Exception as e:
            logger.warning(f"parse_command tentativa {attempt} falhou: {e}")

    logger.error("parse_command: ambas as tentativas falharam — retornando None")
    return None
