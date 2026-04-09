import { useEffect, useRef, useState } from 'react'

export default function ResponseDrawer({ response, onClose }) {
  const drawerRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleCopy() {
    await navigator.clipboard.writeText(response)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* drawer */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-2xl mx-auto bg-zinc-900/95 border border-cyan-900/40 rounded-t-3xl shadow-[0_-8px_60px_rgba(6,182,212,0.12)] animate-slide-up flex flex-col max-h-[75vh]"
      >
        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-cyan-800/60" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-cyan-900/30">
          <span className="text-cyan-500 font-mono text-xs tracking-widest uppercase">Resposta</span>

          <div className="flex items-center gap-3">
            {/* botão copiar */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-cyan-400 transition-colors font-mono text-xs"
            >
              {copied ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-cyan-400">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                  <span className="text-cyan-400">copiado!</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10.5 3A1.501 1.501 0 009 4.5h6A1.5 1.5 0 0013.5 3h-3zm-2.693.178A3 3 0 0110.5 1.5h3a3 3 0 012.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 01-3 3H6.75a3 3 0 01-3-3V6.257c0-1.47 1.073-2.756 2.57-2.93.493-.057.989-.107 1.487-.15z" clipRule="evenodd" />
                  </svg>
                  <span>copiar</span>
                </>
              )}
            </button>

            {/* botão fechar */}
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-cyan-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* conteúdo com scroll */}
        <div className="overflow-y-auto px-6 py-5 flex-1 scrollbar-thin">
          <p className="text-cyan-400/90 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {response}
          </p>
        </div>

        {/* fade bottom */}
        <div className="h-6 bg-gradient-to-t from-zinc-900/95 to-transparent rounded-b-3xl pointer-events-none" />
      </div>
    </div>
  )
}
