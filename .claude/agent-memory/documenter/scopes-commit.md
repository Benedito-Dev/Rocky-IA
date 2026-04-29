---
name: Scopes de Commit Rocky-IA
description: Scopes válidos e frequência esperada no projeto
type: reference
---

## Scopes Válidos
`chat`, `llm`, `tts`, `stt`, `memory`, `voice`, `control`, `frontend`, `api`, `config`, `common`, `docs`

## Frequência Esperada (Task 1)
- `frontend` — mudanças em componentes React (mais frequente)
- `llm` — mudanças em serviço Groq
- `tts` — mudanças em ElevenLabs
- `chat` — mudanças em endpoints
- `config` — mudanças em settings/.env
- `memory` — mudanças em histórico conversacional

## Padrão Obrigatório
Conventional Commits: `<type>(<scope>): <subject em português imperativo>`

Body obrigatório:
- Seção "- Frontend:" (ou "- Backend:") com detalhes
- Seção "- Tests:" com resultado de build
- Seção "- Documentation:" com o que foi documentado
- Footer: `Co-Authored-By: Claude <noreply@anthropic.com>`

**How to apply:** Toda Task gera um commit, sempre usar template acima
