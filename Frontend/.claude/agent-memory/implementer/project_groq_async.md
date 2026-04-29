---
name: Groq ask_stream é Generator síncrono
description: ask_stream() em llm_service.py é Generator síncrono — nunca usar direto em async def; padrão correto é queue + run_in_executor
type: project
---

`ask_stream()` em `Backend/app/services/llm_service.py` usa `yield` em loop síncrono sobre o SDK Groq.
Usar diretamente em `async def` bloqueia o event loop do Uvicorn.

**Padrão correto:** `ask_stream_async` com queue + `loop.run_in_executor(None, _produce)`.
O produtor roda em thread separada e envia tokens via `asyncio.Queue`. Sentinel `None` sinaliza fim.

**Why:** O SDK Groq não tem interface async nativa — o streaming é Generator síncrono.

**How to apply:** Sempre que precisar consumir `ask_stream` em contexto async, usar `ask_stream_async`. Nunca `for token in ask_stream()` dentro de `async def`.
