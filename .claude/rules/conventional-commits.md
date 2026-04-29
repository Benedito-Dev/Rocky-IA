---
name: conventional-commits
description: Padrao internacional de commits para o Rocky-IA
---

# Conventional Commits

Padrao internacional. Referencia: https://www.conventionalcommits.org/

---

## FORMATO OBRIGATORIO

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## TYPES

| Type | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correcao de bug |
| `docs` | Apenas documentacao |
| `refactor` | Refatoracao sem mudanca de comportamento |
| `perf` | Melhoria de performance |
| `test` | Adicionar/corrigir testes |
| `chore` | Build, configs, dependencies |
| `style` | Formatacao (sem mudanca logica) |

---

## SCOPES VALIDOS (Rocky-IA)

`chat`, `llm`, `tts`, `stt`, `memory`, `voice`, `control`, `frontend`, `api`, `config`, `common`, `docs`

---

## SUBJECT

- Portugues
- Imperativo (`adiciona`, nao `adicionado`)
- Primeira letra minuscula
- Sem ponto final
- Max 72 caracteres

---

## EXEMPLOS

```
feat(tts): adiciona cache de audio para respostas repetidas

- TTS:
  * Cache em memoria com LRU (max 50 entradas)
  * Hit rate esperado: 30% em conversas normais

- Backend:
  * Backend: OK
  * Frontend build: PASS

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
fix(memory): corrige duplicatas no historico conversacional

- Problema:
  * Threshold de similaridade nao estava sendo aplicado
  * Mensagens identicas sendo salvas multiplas vezes

- Solucao:
  * Corrigido calculo de similarity em memory_service.py

Fixes #12
```
