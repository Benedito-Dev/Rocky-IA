export const API_URL = 'http://127.0.0.1:8000/api/v1/chat/'

export async function sendMessage(message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const data = await response.json()
  return data.response
}

export async function sendMessageWithSpeech(message) {
  const response = await fetch(`${API_URL}speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const data = await response.json()
  const audioBlob = new Blob(
    [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
    { type: 'audio/mpeg' }
  )
  const audioUrl = URL.createObjectURL(audioBlob)
  return { text: data.text, audioUrl }
}

export async function sendMessageStream(message, onToken) {
  const response = await fetch(`${API_URL}stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let full = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    full += decoder.decode(value)
    onToken(full)
  }
  return full
}

export async function sendAudioWithSpeech(audioBlob) {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  const response = await fetch(`${API_URL}transcribe`, {
    method: 'POST',
    body: formData,
  })
  const data = await response.json()
  const replyBlob = new Blob(
    [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
    { type: 'audio/mpeg' }
  )
  const audioUrl = URL.createObjectURL(replyBlob)
  return { text: data.text, transcription: data.transcription, audioUrl }
}

export async function summarizeSession() {
  try {
    await fetch(`${API_URL}summarize`, { method: 'POST' })
  } catch {
    // fire-and-forget: falha silenciosa — nao impacta UX
  }
}

/**
 * Envia mensagem e recebe resposta via SSE com chunks de texto e áudio.
 * @param {string} message - Mensagem do usuário
 * @param {object} callbacks
 * @param {function} callbacks.onText - Chamado a cada token de texto recebido
 * @param {function} callbacks.onAudio - Chamado a cada chunk de áudio (base64, texto da sentença)
 * @param {function} callbacks.onDone - Chamado quando o stream termina
 * @param {AbortSignal} [signal] - AbortSignal para cancelamento via AbortController
 */
export async function sendMessageWithSpeechStream(message, { onText, onAudio, onDone }, signal) {
  const response = await fetch(`${API_URL}speak-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`speak-stream HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() // fragmento incompleto fica no buffer

    for (const part of parts) {
      if (!part.startsWith('data: ')) continue
      try {
        const event = JSON.parse(part.slice(6))
        if (event.type === 'text') onText?.(event.content)
        else if (event.type === 'audio') onAudio?.(event.data, event.text)
        else if (event.type === 'done') onDone?.()
      } catch {
        // fragmento JSON malformado — ignorar silenciosamente
      }
    }
  }
}