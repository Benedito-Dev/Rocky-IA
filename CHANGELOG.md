# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **[Frontend]** (Task 1) Interface imersiva com orb central substituindo chat tradicional
  - Canvas animado com 4 estados: idle, listening, thinking, speaking
  - Waveform radial no estado listening, ripples direcionais
  - Texto do Rocky em Fraunces itálico flutuante (sem bubbles de chat)
  - Tipografia dual: Fraunces (Rocky) + JetBrains Mono (sistema)
  - Voz real via MediaRecorder + Groq Whisper (/chat/transcribe)
  - AudioLevel real via Web Audio API AnalyserNode durante listening e speaking
  - HistoryLog fullscreen (tecla H), InlineInput minimalista, ActivationVeil na abertura
  - 8 novos componentes: Presence, StreamingResponse, UserEcho, ActivationVeil, HintDot, InlineInput, HistoryLog, StatusMark

- **[Voice]** (Task 2) VAD automático — Rocky detecta silêncio e envia sem segundo clique
  - Threshold RMS 0.012, timer de 1500ms de silêncio
  - Reset ao detectar fala, timeout de segurança de 4500ms mantido

- **[TTS]** (Task 3) Streaming de áudio sentença-a-sentença via SSE
  - Novo endpoint POST /api/v1/chat/speak-stream
  - AsyncGenerator ask_stream_async com run_in_executor (thread-safe)
  - Fila de AudioBufferSourceNode no frontend para reprodução sem gap
  - AbortController cancela stream ao pressionar Escape

### Fixed
- **[Backend]** Substituição de traceback.print_exc() por logger.exception() em chat.py
- **[Backend]** asyncio.get_running_loop() em vez de get_event_loop() (Python 3.10+ compat)
- **[Frontend]** AudioContext criado dentro de user gesture (fix autoplay policy browsers)
