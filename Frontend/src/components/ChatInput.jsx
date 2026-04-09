import { useState, forwardRef } from 'react'

const ChatInput = forwardRef(function ChatInput({ onSend, disabled }, ref) {
  const [text, setText] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
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
