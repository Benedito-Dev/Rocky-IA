import { useState, useRef, useEffect } from 'react'
import RockyOrb from '../components/RockyOrb'
import ChatInput from '../components/ChatInput'
import ResponseDrawer from '../components/ResponseDrawer'
import { sendMessageWithSpeech } from '../services/api'

const PREVIEW_WORDS = 18

export default function ChatScreen() {
  const [orbState, setOrbState] = useState('idle')
  const [response, setResponse] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const audioRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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

  async function handleSend(text) {
    setDrawerOpen(false)
    setOrbState('thinking')
    setResponse('')

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    try {
      const { text: reply, audioUrl } = await sendMessageWithSpeech(text)
      setResponse(reply)
      setOrbState('speaking')

      const audio = new Audio(audioUrl)
      audioRef.current = audio
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
    } catch (e) {
      console.error(e)
      setOrbState('idle')
      inputRef.current?.focus()
    }
  }

  const words = (response || '').split(' ')
  const isLong = words.length > PREVIEW_WORDS
  const preview = isLong ? words.slice(0, PREVIEW_WORDS).join(' ') + '...' : response

  return (
    <div className="flex flex-col h-screen bg-zinc-900 overflow-hidden">

      {/* layout principal */}
      <div className="flex-1 flex flex-col items-center justify-center">

        {/* orb */}
        <div className="w-[420px] h-[420px] drop-shadow-[0_0_80px_rgba(6,182,212,0.3)]">
          <RockyOrb state={orbState} />
        </div>

        {/* preview da resposta */}
        {response && (
          <div className="max-w-lg text-center px-6 mt-2">
            <p className="text-cyan-400/80 font-mono text-sm leading-relaxed">
              {preview}
            </p>
            {isLong && (
              <button
                onClick={() => setDrawerOpen(true)}
                className="mt-2 text-cyan-600 hover:text-cyan-400 font-mono text-xs transition-colors"
              >
                ver resposta completa ↓
              </button>
            )}
          </div>
        )}
      </div>

      {/* input */}
      <div className="flex justify-center">
        <ChatInput ref={inputRef} onSend={handleSend} disabled={orbState === 'thinking' || orbState === 'speaking'} />
      </div>

      {/* drawer */}
      {drawerOpen && (
        <ResponseDrawer
          response={response}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}
