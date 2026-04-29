# PRD — Rocky-IA

Roadmap de evolução do Rocky rumo a um assistente pessoal estilo Jarvis.
Marcar `[x]` ao concluir cada item.

---

## Concluído

- [x] Interface imersiva com orb central (fundo preto, sem chrome de chat)
- [x] Canvas animado com 4 estados: idle, listening, thinking, speaking
- [x] Waveform radial no estado listening, ripples direcionais
- [x] Tipografia dual: Fraunces (Rocky) + JetBrains Mono (sistema)
- [x] Voz real via MediaRecorder + Groq Whisper (/chat/transcribe)
- [x] AudioLevel real via Web Audio API AnalyserNode
- [x] HistoryLog fullscreen (tecla H), InlineInput minimalista, ActivationVeil
- [x] Nome "ROCKY" na orb — aparece no idle, some quando ativo
- [x] Transição suave entre idle e estados ativos (interpolação via activityRef)

---

## Backlog

### 1. Experiência de Voz

- [x] **VAD (Voice Activity Detection)** — detectar automaticamente quando o usuário parou de falar e enviar sem precisar clicar novamente
- [ ] **Wake word** — "ei Rocky" ativa a escuta sem toque (Web Speech API ou Picovoice)
- [x] **Streaming de TTS** — Rocky começa a falar enquanto ainda processa o restante da resposta, eliminando a espera

### 2. Memória Real

- [x] **Memória de longo prazo** — salvar fatos importantes sobre o usuário (projetos, preferências, contexto) em SQLite com busca semântica simples
- [x] **Resumo automático de sessão** — ao encerrar, Rocky extrai os pontos relevantes e salva; na próxima sessão carrega esse contexto
- [x] **Recuperação por referência** — "Rocky, lembra que te falei sobre X?" funcionar de verdade

### 3. Consciência do Ambiente

- [ ] **Contexto de tela** — capturar screenshot e enviar ao LLM; "Rocky, o que tem de errado nesse código?" olhando para o VS Code
- [ ] **Controle de PC** — ativar o `control_service.py` (placeholder existente): abrir apps, buscar arquivos, executar comandos
- [ ] **Busca web** — tool use no LLM para o Rocky buscar informações em tempo real quando não sabe algo

### 4. Personalidade e Presença

- [ ] **Som de ativação** — som sutil ao mudar de estado, como o Jarvis
- [ ] **Variação de voz por estado** — falar mais devagar ao pensar, mais direto em respostas simples
- [ ] **Respostas proativas** — após longo período idle, Rocky comenta algo relacionado ao contexto anterior

### 5. Infraestrutura

- [ ] **Modo offline** — LLM local via Ollama como fallback sem internet
- [ ] **App desktop** — empacotar com Electron ou Tauri para rodar sem browser e iniciar com o sistema

---

## Prioridade sugerida

| # | Item | Impacto | Esforço |
|---|------|---------|---------|
| 1 | VAD | Alto | Baixo |
| 2 | Memória de longo prazo + resumo de sessão | Alto | Médio |
| 3 | Contexto de tela (screenshot → LLM) | Muito alto | Médio |
| 4 | Wake word | Alto | Alto |
| 5 | Controle de PC | Muito alto | Alto |
