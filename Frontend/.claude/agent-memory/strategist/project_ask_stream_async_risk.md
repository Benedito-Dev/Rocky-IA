---
name: Risco critico — ask_stream sincrono bloqueia event loop do FastAPI
description: llm_service.ask_stream() e Generator sincrono; usar diretamente em endpoint async bloqueia Uvicorn
type: project
---

`ask_stream()` em `Backend/app/services/llm_service.py` e um `Generator` Python sincrono (usa SDK Groq com `stream=True` em loop `for` sincrono). Usar `for token in ask_stream()` dentro de um `async def` endpoint FastAPI bloqueia o event loop do Uvicorn durante toda a geracao do LLM.

**Why:** Descoberto durante planejamento da Task 2 (TTS Streaming). O endpoint `POST /stream` existente ja comete esse erro — usa `StreamingResponse(generate(), ...)` onde `generate()` e um generator sincrono dentro de uma funcao `def`, o que funciona porque `StreamingResponse` aceita generators sincronos e os executa em thread pool implicitamente. Mas um `async def speak_stream_generator` com `async for` precisaria de `AsyncGenerator`.

**How to apply:** Criar `ask_stream_async` como `AsyncGenerator` usando pattern `queue + loop.run_in_executor`. Nao alterar `ask_stream` sincrono (compatibilidade com `/stream` existente). Verificar sempre se generators LLM sao sincronos antes de usa-los em contexto async.
