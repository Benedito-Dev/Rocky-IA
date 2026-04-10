import { useState, useRef, forwardRef } from 'react'

const ChatInput = forwardRef(function ChatInput({ onSend, onAudio, disabled }, ref) {
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
