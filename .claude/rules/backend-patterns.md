---
name: backend-patterns
description: Padroes de codigo Python/FastAPI para o Rocky-IA
---

# Padroes Backend Python/FastAPI

**Aplicavel a:** Todo codigo Python em `Backend/app/` do Rocky-IA.

---

## 1. TYPE HINTS

Obrigatorio em funcoes publicas:

```python
# ERRADO
async def get_response(message):
    ...

# CORRETO
async def get_response(message: str) -> dict:
    ...
```

---

## 2. PYDANTIC PARA VALIDACAO

Validar TODO input que vem de fora (HTTP, form):

```python
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    audio: str | None = None
```

---

## 3. CONFIGURACAO VIA SETTINGS

Nunca `os.getenv()` espalhado — usar `settings`:

```python
# ERRADO
api_key = os.getenv("GROQ_API_KEY")

# CORRETO
from app.core.config import settings
client = Groq(api_key=settings.GROQ_API_KEY)
```

---

## 4. HTTP ASYNC — httpx

Para chamadas externas em endpoints async:

```python
# ERRADO — bloqueia o event loop
import requests
response = requests.post(url, ...)

# CORRETO
import httpx
async with httpx.AsyncClient() as client:
    response = await client.post(url, ...)
```

---

## 5. ERROR HANDLING

```python
# ERRADO — engole erro
try:
    result = await llm_service.chat(message)
except:
    return {"response": "erro"}

# CORRETO — exception especifica com contexto
from fastapi import HTTPException

try:
    result = await llm_service.chat(message)
except Exception as e:
    logger.error(f"LLM call failed: {e}")
    raise HTTPException(status_code=500, detail="LLM service unavailable")
```

---

## 6. LOGGING

```python
# ERRADO
print(f"Processing message: {message}")

# CORRETO
import logging
logger = logging.getLogger(__name__)
logger.info(f"Processing message (len={len(message)})")
```

Nunca logar:
- API keys ou tokens
- Conteudo completo de mensagens longas em producao

---

## 7. SEGURANCA

### SQL Injection
```python
# ERRADO — concatenacao direta
cursor.execute(f"INSERT INTO memory VALUES ('{role}', '{content}')")

# CORRETO — parametros
cursor.execute("INSERT INTO memory VALUES (?, ?)", (role, content))
```

### Secrets
- SEMPRE via `.env` + `pydantic-settings`
- `.env` no `.gitignore`
- `.env.example` atualizado com todas as variaveis necessarias

---

## 8. SEPARACAO DE RESPONSABILIDADES

- **Endpoint (api/):** Recebe request, valida, delega ao service, retorna response
- **Service:** Logica de negocio (LLM, TTS, memory)
- **Repository:** Persistencia SQLite
- **Model:** Schemas Pydantic

```python
# ERRADO — endpoint com logica
@router.post("/chat")
async def chat(request: ChatRequest):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    history = db.execute("SELECT ...").fetchall()
    response = client.chat.completions.create(...)
    db.execute("INSERT ...")
    return {"response": response}

# CORRETO — endpoint delega
@router.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    response = await llm_service.chat(request.message)
    return ChatResponse(response=response)
```

---

## 9. CHECKLIST DE QUALIDADE

- [ ] Backend sobe: `uvicorn main:app`
- [ ] Frontend build: `npm run build`
- [ ] Zero `print()` no backend
- [ ] Zero API keys hardcoded
- [ ] Pydantic em endpoints publicos
- [ ] httpx async (nao requests sync)
- [ ] Error handling com HTTPException
- [ ] Config via settings
