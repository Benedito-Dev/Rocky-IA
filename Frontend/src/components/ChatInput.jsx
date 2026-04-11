import { useState, useRef, forwardRef } from 'react'

const ChatInput = forwardRef(function ChatInput({ onSend, onAudio, onToggleSilent, silent, disabled }, ref) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  async function toggleRecording() {
    if (recording) {
      mediaRef.current?.stop()
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorder.ondataavailable = e => chunksRef.current.push(e.data)
    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      onAudio(blob)
      setRecording(false)
    }
    recorder.start()
    mediaRef.current = recorder
    setRecording(true)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl px-6 pb-8">
      <div className="flex items-center gap-3 bg-zinc-800/60 border border-cyan-900/50 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-[0_0_30px_rgba(6,182,212,0.08)]">
        <input
          ref={ref}
          className="flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-500 text-sm"
          placeholder="Fale com Rocky..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={disabled}
        />
        {/* modo silencioso */}
        <button
          type="button"
          onClick={onToggleSilent}
          title={silent ? 'Ativar voz' : 'Modo silencioso'}
          className={`transition-colors ${
            silent ? 'text-zinc-500 hover:text-zinc-300' : 'text-cyan-500 hover:text-cyan-300'
          }`}
        >
          {silent ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06L19.5 13.06l1.72 1.72a.75.75 0 001.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06L19.5 10.94l-1.72-1.72z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
              <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
            </svg>
          )}
        </button>
        {/* microfone */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled}
          className={`transition-colors disabled:opacity-30 ${
            recording ? 'text-red-400 animate-pulse' : 'text-cyan-500 hover:text-cyan-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        </button>
        {/* enviar */}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="text-cyan-500 hover:text-cyan-300 disabled:opacity-30 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </form>
  )
})

export default ChatInput