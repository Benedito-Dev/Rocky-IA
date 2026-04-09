export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-100'}`}>
        {message.content}
      </div>
    </div>
  )
}
