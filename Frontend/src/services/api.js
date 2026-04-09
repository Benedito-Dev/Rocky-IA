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
