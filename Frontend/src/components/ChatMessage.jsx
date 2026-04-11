export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-end gap-2 ${
      isUser ? 'justify-end' : 'justify-start'
    }`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-cyan-900/80 border border-cyan-700/50 flex items-center justify-center shrink-0 text-cyan-400 text-xs font-bold">
          R
        </div>
      )}
      <div className={`max-w-[75%] px-4 py-2.5 text-sm font-mono leading-relaxed ${
        isUser
          ? 'bg-cyan-950/70 text-cyan-100 border border-cyan-800/50 rounded-2xl rounded-br-sm'
          : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/40 rounded-2xl rounded-bl-sm'
      }`}>
        {message.content}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700/80 border border-zinc-600/50 flex items-center justify-center shrink-0 text-zinc-300 text-xs font-bold">
          U
        </div>
      )}
    </div>
  )
}
