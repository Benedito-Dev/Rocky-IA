import { useEffect, useRef } from 'react'

export default function RockyOrb({ state = 'idle' }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    let frame = 0
    let animId
    let currentAgitation = 8

    // partículas nas bordas internas
    const particles = Array.from({ length: 120 }, (_, i) => ({
      angle: (i / 120) * Math.PI * 2,
      offset: Math.random() * 12 - 6,
      speed: 0.002 + Math.random() * 0.004,
      size: 1 + Math.random() * 2.5,
      alpha: 0.4 + Math.random() * 0.6,
      radialOffset: Math.random() * 22 - 11,
    }))

    function getBlobRadius(angle, t, agitation) {
      return (
        173 +
        Math.sin(angle * 2 + t * 0.8) * agitation * 0.35 +
        Math.sin(angle * 3 - t * 1.1) * agitation * 0.25 +
        Math.sin(angle * 5 + t * 1.5) * agitation * 0.2 +
        Math.sin(angle * 7 - t * 0.6) * agitation * 0.1
      )
    }

    function drawBlobBorder(t, agitation) {
      const count = 200
      ctx.beginPath()
      for (let i = 0; i <= count; i++) {
        const angle = (i / count) * Math.PI * 2
        const r = getBlobRadius(angle, t, agitation)
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()

      // borda brilhante fina
      ctx.strokeStyle = 'rgba(6,182,212,0.55)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 22
      ctx.stroke()

      // borda exterior mais suave
      ctx.strokeStyle = 'rgba(103,232,249,0.15)'
      ctx.lineWidth = 8
      ctx.shadowBlur = 40
      ctx.stroke()
    }

    function drawInnerRim(t, agitation) {
      const count = 200
      ctx.beginPath()
      for (let i = 0; i <= count; i++) {
        const angle = (i / count) * Math.PI * 2
        const r = getBlobRadius(angle, t, agitation) - 14
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(6,182,212,0.12)'
      ctx.lineWidth = 10
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 18
      ctx.stroke()
    }

    function drawParticles(t, agitation) {
      particles.forEach(p => {
        p.angle += p.speed * (1 + agitation * 0.04)
        const blobR = getBlobRadius(p.angle, t, agitation)
        const r = blobR + p.radialOffset - 4
        const x = cx + r * Math.cos(p.angle)
        const y = cy + r * Math.sin(p.angle)

        const flicker = 0.5 + 0.5 * Math.sin(t * 3 + p.angle * 10)
        const alpha = p.alpha * flicker * (agitation > 12 ? 1 : 0.6)

        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(6,182,212,${alpha})`
        ctx.shadowColor = '#06b6d4'
        ctx.shadowBlur = 10
        ctx.fill()
      })
    }

    function drawRipples(t, agitation) {
      if (agitation < 12) return
      for (let i = 0; i < 3; i++) {
        const progress = ((t * 0.5 + i * 0.33) % 1)
        const r = 180 + progress * 110
        const alpha = (1 - progress) * 0.2
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(6,182,212,${alpha})`
        ctx.lineWidth = 1.5
        ctx.shadowColor = '#06b6d4'
        ctx.shadowBlur = 6
        ctx.stroke()
      }
    }

    function drawText(t, agitation) {
      const state = stateRef.current
      ctx.shadowColor = '#06b6d4'
      ctx.shadowBlur = 18
      ctx.fillStyle = 'rgba(224,247,250,0.92)'
      ctx.font = 'bold 22px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ROCKY', cx, cy - 8)

      const blink = Math.sin(t * 3) > 0
      ctx.fillStyle = blink ? '#06b6d4' : '#0e7490'
      ctx.font = '9px monospace'
      ctx.shadowBlur = 6
      const label = state === 'thinking' ? 'THINKING...' : state === 'speaking' ? 'SPEAKING...' : 'ONLINE'
      ctx.fillText('● ' + label, cx, cy + 12)
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const t = frame * 0.016
      const isActive = stateRef.current !== 'idle'
      const targetAgitation = isActive ? 36 : 8
      currentAgitation += (targetAgitation - currentAgitation) * 0.04

      drawRipples(t, currentAgitation)
      drawInnerRim(t, currentAgitation)
      drawBlobBorder(t, currentAgitation)
      drawParticles(t, currentAgitation)
      drawText(t, currentAgitation)

      frame++
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={625}
      height={625}
      className="drop-shadow-[0_0_80px_rgba(6,182,212,0.3)] w-full h-full"
    />
  )
}
