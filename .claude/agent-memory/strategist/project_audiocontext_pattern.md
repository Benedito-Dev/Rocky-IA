---
name: Padrão AudioContext no Frontend
description: Como usar Web Audio API corretamente para audioLevel real na orb (listening e speaking)
type: project
---

AudioContext deve ser criado APENAS dentro de event handlers (user gesture). Nunca em useEffect de mount — viola autoplay policy dos browsers.

**Listening (microfone):**
AudioContext → createAnalyser → createMediaStreamSource(stream) → analyser → rAF loop com getByteTimeDomainData → RMS normalizado.

**Speaking (HTML5 Audio):**
AudioContext → createAnalyser → createMediaElementSource(audioEl) → analyser → analyser.connect(destination) → rAF loop.
CRITICO: conectar analyser ao destination, senão audio toca em silencio.

**Why:** Padrão definido na Task 1 para substituir simulação de audioLevel com setInterval do protótipo HTML.

**How to apply:** Qualquer componente que precise de audioLevel real deve seguir este padrão. Fechar AudioContext no cleanup (audio.ended ou cleanup do componente).
