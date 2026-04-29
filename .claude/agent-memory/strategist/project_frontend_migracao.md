---
name: Migração Frontend Rocky.html para React (Task 1)
description: Decisões arquiteturais e riscos identificados na migração do protótipo Rocky.html para o projeto Vite/React 19
type: project
---

Task 1 aprovada: migração completa do frontend do paradigma chat-bubbles para interface imersiva orb-centralizada.

**Decisoes tomadas:**
- 8 componentes novos (Presence, StreamingResponse, UserEcho, ActivationVeil, HintDot, InlineInput, HistoryLog, StatusMark)
- ChatScreen.jsx reescrito como orquestrador; componentes antigos (RockyOrb, ChatInput, ChatMessage, ResponseDrawer) descartados mas não deletados
- CSS inline para gradientes/animações complexas; Tailwind apenas onde agrega legibilidade (flex, position, overflow)
- Sem bibliotecas externas — canvas puro, Web Audio API nativa, MediaRecorder nativa

**Why:** Protótipo externo (Rocky.html) aprovado pelo usuário como design canônico. Frontend antigo era paradigma incompatível (chat bubbles vs orb imersiva).

**How to apply:** Qualquer nova feature de frontend deve seguir o novo paradigma: fundo preto, orb central, sem chrome de chat, tipografia Fraunces+JetBrains Mono.
