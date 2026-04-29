import asyncio
import json
import logging
import re

from groq import Groq
from app.core.config import settings
from app.repositories import long_term_memory_repository

logger = logging.getLogger(__name__)

_client = Groq(api_key=settings.GROQ_API_KEY)

EXTRACTION_PROMPT = """Analise as mensagens a seguir e extraia APENAS fatos relevantes e duradouros sobre o usuário.
Fatos relevantes: preferências, projetos ativos, hábitos, contexto pessoal, pessoas mencionadas.
NÃO extraia: perguntas pontuais, comandos, respostas do assistente, informações temporárias.

Categorias disponíveis: preference, project, person, habit, context

Responda APENAS com JSON válido. Se não houver fatos novos, responda: []

Formato obrigatório: [{{"fact": "...", "category": "..."}}]

Mensagens:
{messages}"""


def _parse_facts(raw: str) -> list[dict]:
    """
    Parser robusto para o JSON retornado pelo LLM.
    Tenta parse direto primeiro; se falhar, busca array no texto com regex.
    """
    stripped = raw.strip()
    try:
        result = json.loads(stripped)
        if isinstance(result, list):
            return result
    except json.JSONDecodeError:
        pass

    # LLM às vezes adiciona texto antes/depois do array
    match = re.search(r'\[.*?\]', stripped, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass

    logger.debug(f"Nao foi possivel parsear fatos do LLM. Raw: {raw[:200]}")
    return []


def _format_messages_for_extraction(messages: list[dict]) -> str:
    """Formata as mensagens em texto legível para o prompt de extração."""
    lines = []
    for msg in messages:
        role = "Usuário" if msg.get("role") == "user" else "Rocky"
        content = msg.get("content", "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines)


async def extract_and_save_facts(recent_messages: list[dict]) -> list[dict]:
    """
    Chama o LLM para extrair fatos das mensagens recentes.
    Salva fatos novos (nao duplicados) na long_term_memory.
    Retorna lista de fatos efetivamente salvos.
    Nunca lanca excecao — falha silenciosamente com log.
    """
    if not recent_messages:
        return []

    try:
        messages_text = _format_messages_for_extraction(recent_messages)
        prompt = EXTRACTION_PROMPT.format(messages=messages_text)

        response = await asyncio.to_thread(
            _client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=512,
        )

        raw = response.choices[0].message.content or ""
        facts = _parse_facts(raw)

        saved = []
        for item in facts:
            if not isinstance(item, dict):
                continue
            fact = item.get("fact", "").strip()
            category = item.get("category", "context").strip()
            if fact and long_term_memory_repository.save_fact(fact, category):
                saved.append({"fact": fact, "category": category})

        if saved:
            logger.info(f"Memoria de longo prazo: {len(saved)} fato(s) novo(s) salvo(s)")

        return saved

    except Exception as e:
        logger.error(f"Extracao de fatos falhou silenciosamente: {e}")
        return []


def build_context_block() -> str:
    """
    Carrega fatos do SQLite e formata como bloco para injetar no system prompt.
    Retorna string vazia se nao houver fatos.
    """
    try:
        facts = long_term_memory_repository.load_facts()
        if not facts:
            return ""

        lines = ["CONTEXTO PESSOAL (lembranças de conversas anteriores):"]
        for item in facts:
            category = item.get("category", "context")
            fact = item.get("fact", "")
            lines.append(f"- [{category}] {fact}")

        block = "\n".join(lines)
        logger.debug(f"Contexto pessoal carregado: {len(facts)} fato(s)")
        return block

    except Exception as e:
        logger.error(f"Falha ao carregar contexto pessoal: {e}")
        return ""
