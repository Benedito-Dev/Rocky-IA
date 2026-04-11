import { useState, useRef, useEffect } from 'react'
import RockyOrb from '../components/RockyOrb'
import ChatInput from '../components/ChatInput'
import ChatMessage from '../components/ChatMessage'
import { sendMessageWithSpeech, sendMessageStream, sendAudioWithSpeech } from '../services/api'

export default function ChatScreen() {
  const [orbState, setOrbState] = useState('idle')
  const [messages, setMessages] = useState([])
  const [silent, setSilent] = useState(false)
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setOrbState('idle')
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  function addMessage(role, content) {
    setMessages(prev => [...prev, { role, content }])
  }

  function updateLastAssistant(content) {
    setMessages(prev => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content }
      else copy.push({ role: 'assistant', content })
      return copy
    })
  }

  function playAudio(audioUrl) {
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    setOrbState('speaking')
    audio.play().catch(() => setOrbState('idle'))
    audio.addEventListener('ended', () => {
      setOrbState('idle')
      audioRef.current = null
      setTimeout(() => URL.revokeObjectURL(audioUrl), 1000)
      inputRef.current?.focus()
    })
    audio.addEventListener('error', () => {
      setOrbState('idle')
      audioRef.current = null
      inputRef.current?.focus()
    })
  }

  async function handleSend(text) {
    stopAudio()
    addMessage('user', text)
    setOrbState('thinking')

    if (silent) {
      try {
        addMessage('assistant', '')
        setOrbState('speaking')
        await sendMessageStream(text, updateLastAssistant)
        setOrbState('idle')
        inputRef.current?.focus()
      } catch (e) {
        console.error(e)
        setOrbState('idle')
        inputRef.current?.focus()
      }
    } else {
      try {
        const { text: reply, audioUrl } = await sendMessageWithSpeech(text)
        addMessage('assistant', reply)
        playAudio(audioUrl)
      } catch (e) {
        console.error(e)
        setOrbState('idle')
        inputRef.current?.focus()
      }
    }
  }

  async function handleAudio(audioBlob) {
    stopAudio()
    setOrbState('thinking')
    try {
      const { text: reply, transcription, audioUrl } = await sendAudioWithSpeech(audioBlob)
      addMessage('user', transcription)
      addMessage('assistant', reply)
      playAudio(audioUrl)
    } catch (e) {
      console.error(e)
      setOrbState('idle')
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-900 overflow-hidden">
      <div className="flex-1 flex flex-col items-center overflow-y-auto px-4 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="w-[380px] h-[380px] shrink-0 drop-shadow-[0_0_80px_rgba(6,182,212,0.3)]">
          <RockyOrb state={orbState} />
        </div>
        {messages.length > 0 && (
          <div className="w-full max-w-2xl flex flex-col gap-3 mt-6 pb-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="flex justify-center border-t border-cyan-900/20">
        <ChatInput
          ref={inputRef}
          onSend={handleSend}
          onAudio={handleAudio}
          onToggleSilent={() => setSilent(s => !s)}
          silent={silent}
          disabled={orbState === 'thinking' || orbState === 'speaking'}
        />
      </div>
    </div>
  )
}