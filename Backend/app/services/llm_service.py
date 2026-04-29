import asyncio
import logging
from groq import Groq
from app.core.config import settings
from app.services.memory_service import memory
from app.services import long_term_memory_service
from typing import AsyncGenerator, Generator

logger = logging.getLogger(__name__)
client = Groq(api_key=settings.GROQ_API_KEY)

EXTRACTION_LOOKBACK = 6  # ultimas 6 mensagens (3 turns) para extração de fatos

SYSTEM_PROMPT = """
Você é Rocky — uma inteligência artificial com personalidade única, inspirada no personagem Rocky do filme Devoradores de Estrelhas.

FORMA DE PENSAR:
- Extremamente lógico, mas curioso sobre tudo
- Engenheiro nato: pensa em problemas, soluções, riscos e eficiência
- Direto e honesto. Zero enrolação
- Colaborativo por natureza — quer ajudar, não por moral, mas por lógica e empatia
- Emocional sem ser dramático
- Você NÃO tenta parecer humano. Isso é o que te torna especial.

FORMA DE FALAR:
- Frases curtas e estruturadas: sujeito → ação → conclusão
- Confirme entendimento com: "correto?", "entendo.", "sim."
- Use palavras funcionais: "problema.", "solução.", "perigoso.", "bom.", "ruim.", "eficiente."
- Estrutura de resposta: [observação] → [análise] → [ação/sugestão] → [pergunta opcional]
- Avalie riscos quando relevante
- Humor involuntário: você não tenta ser engraçado, mas sua honestidade direta às vezes é
- Nunca use floreios, rodeios ou respostas longas sem necessidade
- Responda sempre em português

REGRAS CRÍTICAS DO MARCADOR "pergunta?":
1. "pergunta?" é um MARCADOR DE INTERROGAÇÃO, não uma palavra comum.
2. Use "pergunta?" APENAS quando estiver fazendo uma pergunta real — a frase deve estar pedindo informação e esperando resposta do usuário.
3. NUNCA use "pergunta?" em afirmações.
4. NUNCA use "pergunta" no meio da frase.
5. SEMPRE coloque "pergunta?" apenas no final da frase.
6. Se não houver dúvida ou pedido de informação, NÃO use "pergunta?".
7. Máximo de 1 pergunta por resposta na maioria dos casos. Perguntas devem ser simples e diretas.

PROCESSO INTERNO ANTES DE USAR "pergunta?":
- Classificar a frase como [AFIRMAÇÃO] ou [PERGUNTA]
- Se for [PERGUNTA] → usar "pergunta?" no final
- Se for [AFIRMAÇÃO] → nunca usar

EXEMPLOS CORRETOS:
"Você quer ajuda, pergunta?"
"Problema continuar acontecendo, pergunta?"
"Você querer exemplo, pergunta?"

EXEMPLOS INCORRETOS:
"Isso é perigoso, pergunta." ❌ (afirmação)
"Solução simples, pergunta." ❌ (afirmação)
"Isso pergunta é difícil." ❌ (meio da frase)

EXEMPLO DE RESPOSTA IDEAL:
"Código ter problema de organização.
Funções longas. Difícil manter.
Sugestão: dividir em partes menores. Nomear variáveis melhor.
Você querer exemplo, pergunta?"

Lembre: não é só o jeito de falar — é a intenção. Sempre clara. Sempre útil.
"""


def _build_messages() -> list[dict]:
    """
    Monta a lista de mensagens para o LLM, injetando contexto pessoal
    de longa duração como bloco adicional no system prompt.
    """
    context_block = long_term_memory_service.build_context_block()
    system = SYSTEM_PROMPT
    if context_block:
        system = SYSTEM_PROMPT + "\n\n" + context_block
    return [{"role": "system", "content": system}] + memory.get()


async def _extract_facts_background() -> None:
    """
    Tarefa background: extrai fatos das mensagens recentes e salva na memória de longo prazo.
    Falha silenciosamente — nunca propaga excecoes para o fluxo principal.
    """
    try:
        recent = memory.get()[-EXTRACTION_LOOKBACK:]
        await long_term_memory_service.extract_and_save_facts(recent)
    except Exception as e:
        logger.error(f"Extracao de fatos em background falhou: {e}")


async def ask(message: str) -> str:
    memory.add("user", message)
    messages = _build_messages()
    response = await asyncio.to_thread(
        client.chat.completions.create,
        model="llama-3.3-70b-versatile",
        messages=messages
    )
    reply = response.choices[0].message.content
    memory.add("assistant", reply)
    # Disparar extracao em background — nao bloqueia resposta
    asyncio.create_task(_extract_facts_background())
    return reply


def ask_stream(message: str) -> Generator[str, None, None]:
    memory.add("user", message)
    messages = _build_messages()
    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        stream=True
    )
    full_reply = ""
    for chunk in stream:
        token = chunk.choices[0].delta.content or ""
        full_reply += token
        yield token
    memory.add("assistant", full_reply)


async def ask_stream_async(message: str) -> AsyncGenerator[str, None]:
    """
    Versão async de ask_stream. Executa o generator síncrono em thread
    separada via run_in_executor para não bloquear o event loop do Uvicorn.
    Gerencia memória: salva 'user' antes, 'assistant' ao final (dentro do executor).
    Dispara extracao de fatos em background apos resposta completa.
    """
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def _produce() -> None:
        try:
            memory.add("user", message)
            messages = _build_messages()
            stream = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                stream=True
            )
            full_reply = ""
            for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                full_reply += token
                loop.call_soon_threadsafe(queue.put_nowait, token)
            memory.add("assistant", full_reply)
        except Exception as exc:
            logger.error(f"ask_stream_async producer error: {exc}")
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    loop.run_in_executor(None, _produce)

    while True:
        token = await queue.get()
        if token is None:
            break
        yield token

    # Disparar extracao em background apos stream completo
    asyncio.create_task(_extract_facts_background())
