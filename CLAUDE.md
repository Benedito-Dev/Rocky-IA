# CLAUDE.md - Rocky-IA

## IDIOMA
Claude deve responder em PORTUGUES BRASILEIRO.

## CONTEXTO
Rocky-IA é um assistente de IA pessoal com interface visual imersiva, voz sintetizada e personalidade única inspirada em Rocky de "Devorador de Estrelas". O projeto combina LLM (Groq), TTS (ElevenLabs) e STT (Groq Whisper) em uma interface React com orb animada.

## STACK

### Backend
- **Linguagem:** Python 3.x
- **Framework:** FastAPI
- **Servidor:** Uvicorn
- **LLM:** Groq API (modelo `llama-3.3-70b-versatile`)
- **TTS:** ElevenLabs API (modelo `eleven_multilingual_v2`)
- **STT:** Groq Whisper (`whisper-large-v3-turbo`)
- **Banco:** SQLite3 (arquivo `memory.db`)
- **Validação:** Pydantic / pydantic-settings
- **HTTP Client:** httpx (async)

### Frontend
- **Linguagem:** JavaScript (JSX)
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4

## MÓDULOS

### Backend (`Backend/app/`)
- `api/v1/chat.py` — Endpoints REST do chat (text, speak, stream, transcribe)
- `services/llm_service.py` — Integração Groq LLM + system prompt do Rocky
- `services/tts_service.py` — Integração ElevenLabs TTS
- `services/memory_service.py` — Gerenciamento de histórico conversacional (deque circular)
- `services/control_service.py` — Placeholder para controle de PC (futuro)
- `services/voice_service.py` — Placeholder STT/TTS unificado (futuro)
- `repositories/memory_repository.py` — Persistência SQLite (salvar/carregar histórico)
- `models/chat.py` — Schemas Pydantic (ChatRequest, ChatResponse)
- `core/config.py` — Settings (pydantic-settings, lê .env)
- `core/logging.py` — Configuração de logging
- `main.py` — App FastAPI + CORS

### Frontend (`Frontend/src/`)
- `screens/ChatScreen.jsx` — Tela única, estado principal da aplicação
- `components/RockyOrb.jsx` — Canvas com animação de 3 estados (idle/thinking/speaking)
- `components/ChatInput.jsx` — Input com botões (volume, microfone, enviar)
- `components/ChatMessage.jsx` — Bubble de mensagem (user/assistant)
- `services/api.js` — Cliente HTTP (4 funções: sendMessage, speak, stream, transcribe)

## PADRÕES CRÍTICOS

### Personalidade do Rocky
- Fala direta, lógica, sem floreios
- Usa "pergunta?" como marcador de interrogação único
- Estrutura: [observação] → [análise] → [ação/sugestão] → [pergunta?]
- Nunca emocional, nunca tenta parecer humano — mas empático na medida certa

### Memória Conversacional
- Deque circular: últimas 20 turns (40 mensagens)
- Limite: 3000 caracteres máximo
- Anti-redundância: threshold 85% de similaridade (não salva duplicatas)
- Lookback: analisa últimas 4 mensagens para detectar repetição
- Persistência: SQLite3 (criado automaticamente em `Backend/memory.db`)

### Segurança
- NUNCA hardcodar API keys no código — usar `.env` via pydantic-settings
- `.env` está no `.gitignore` do Backend
- Chaves necessárias: GROQ_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

### CORS
- Backend permite `http://localhost:5173` (dev)
- Para produção: ajustar `allow_origins` em `main.py`

### Banco SQLite
- Schema simples: `id`, `role`, `content`, `created_at`
- Sem ORM — queries SQL raw via `sqlite3` do Python
- NUNCA usar DROP TABLE ou TRUNCATE — dados de memória do usuário

### Áudio
- TTS retorna base64 → Frontend decodifica → Blob → URL objeto → HTML5 Audio
- STT: MediaRecorder (WebM) → Backend → Groq Whisper (PT-BR)
- Configuração ElevenLabs: stability=0.5, similarity_boost=0.75

## ENDPOINTS PRINCIPAIS

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/chat/` | Chat texto simples |
| POST | `/api/v1/chat/speak` | Chat + TTS (retorna audio base64) |
| POST | `/api/v1/chat/stream` | Chat com streaming de tokens |
| POST | `/api/v1/chat/transcribe` | STT (áudio) + LLM + TTS |

## COMO RODAR

```bash
# Backend
cd Backend
pip install -r requirements.txt
cp .env.example .env  # configurar API keys
uvicorn main:app --reload

# Frontend
cd Frontend
npm install
npm run dev
```

## SCRIPTS DISPONÍVEIS

### Frontend
- `npm run dev` — Dev server (porta 5173)
- `npm run build` — Build de produção
- `npm run lint` — ESLint
- `npm run preview` — Preview do build

### Backend
- Não tem Makefile — rodar uvicorn diretamente
- `pip install -r requirements.txt` — instalar dependências
