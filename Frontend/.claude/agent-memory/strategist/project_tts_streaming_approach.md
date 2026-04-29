---
name: Decisao de arquitetura TTS Streaming — SSE sobre WebSocket
description: Task 2 do PRD usa SSE (fetch + ReadableStream) para streaming de audio TTS, descartando WebSocket e chunked HTTP
type: project
---

SSE via `POST` + `fetch` + `ReadableStream` foi escolhido para o endpoint `/chat/speak-stream`.

**Why:** WebSocket foi descartado por overkill (comunicacao e unidirecional no caso de uso), complexidade de reconnect e gestao de estado. Chunked HTTP com `multipart/x-mixed-replace` foi descartado por parsing fragil no frontend e comportamento de buffering inconsistente entre browsers.

**How to apply:** Qualquer feature futura que precise de streaming servidor → cliente no Rocky-IA deve seguir o mesmo padrao SSE. So considerar WebSocket se for necessario canal bidirecional em tempo real (ex: interrupcao de fala mid-stream enviando sinal ao backend para cancelar geracao).
