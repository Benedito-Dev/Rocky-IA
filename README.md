# Rocky IA

Uma assistente de inteligência artificial com interface visual imersiva, voz sintetizada e personalidade própria — inspirada no personagem Rocky do filme *Devoradores de Estrelhas*.

---

## Tecnologias

**Frontend**
- React + Vite
- Tailwind CSS
- Canvas API (animação da orb)

**Backend**
- FastAPI (Python)
- Groq API — modelo `llama-3.3-70b-versatile`
- ElevenLabs API — síntese de voz

---

## Funcionalidades

- Orb animada com estados visuais: `idle`, `thinking`, `speaking`
- Respostas em texto com preview e drawer para respostas longas
- Voz sintetizada com a personalidade do Rocky
- Interrupção de fala com `Esc`
- Foco automático no input após cada resposta
- Botão de copiar resposta

---

## Como rodar

### Backend

```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

---

## Variáveis de ambiente

Crie um arquivo `.env` dentro de `Backend/` com base no `.env.example`:

```env
APP_NAME=Rocky
GROQ_API_KEY=sua_chave_groq
ELEVENLABS_API_KEY=sua_chave_elevenlabs
ELEVENLABS_VOICE_ID=id_da_voz
```

---

## Estrutura

```
Rocky/
├── Backend/
│   ├── app/
│   │   ├── api/        # rotas
│   │   ├── core/       # configurações
│   │   ├── models/     # schemas
│   │   └── services/   # groq, elevenlabs
│   └── main.py
└── Frontend/
    └── src/
        ├── components/ # Orb, ChatInput, ResponseDrawer
        ├── screens/    # ChatScreen
        └── services/   # api.js
```
