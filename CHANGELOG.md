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
