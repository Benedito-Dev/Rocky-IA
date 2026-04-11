const API_URL = 'http://127.0.0.1:8000/api/v1/chat/'

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