import { useEffect, useRef, useState } from 'react';

export default function Presence({ state, audioLevel, size, onTap }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef(state);
  const levelRef = useRef(audioLevel);
  const particlesRef = useRef([]);
  const ripplesRef = useRef([]);
  const lastRippleRef = useRef(0);
  const currentAmpRef = useRef(2.5);
  const nameAlphaRef = useRef(0.28);
  const activityRef = useRef(0);
  const [hover, setHover] = useState(false);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { levelRef.current = audioLevel; }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2, cy = size / 2;
    const baseR = size * 0.22;

    // Single layer of close-orbit particles — sparse, intentional
    particlesRef.current = Array.from({ length: 90 }, () => ({
      angle: Math.random() * Math.PI * 2,
      orbitR: baseR + 8 + Math.random() * 36,
      speed: (0.0008 + Math.random() * 0.0018) * (Math.random() > 0.5 ? 1 : -1),
      sz: 0.3 + Math.random() * 1.1,
      alpha: 0.15 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    }));

    function blobPath(t, amp) {
      const pts = [];
      for (let i = 0; i <= 200; i++) {
        const a = (i / 200) * Math.PI * 2;
        let r = baseR;
        r += amp * 0.55 * Math.sin(2 * a + t * 0.7);
        r += amp * 0.40 * Math.sin(3 * a - t * 1.05);
        r += amp * 0.28 * Math.sin(5 * a + t * 0.85);
        r += amp * 0.18 * Math.sin(7 * a - t * 1.3);
        r += amp * 0.12 * Math.sin(11 * a + t * 1.6);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      return pts;
    }

    function trace(pts) {
      ctx.beginPath();
      pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
    }

    function frame(ts) {
      const t = ts * 0.001;
      const s = stateRef.current;
      const lvl = levelRef.current || 0;
      const isActive = s !== 'idle';
      const isListening = s === 'listening';
      const isThinking = s === 'thinking';
      const isSpeaking = s === 'speaking';

      // activity: 0 = idle, 1 = fully active — interpolated smoothly
      const targetActivity = isActive ? 1 : 0;
      activityRef.current += (targetActivity - activityRef.current) * 0.018;
      const act = activityRef.current;

      let targetAmp;
      if (isListening) targetAmp = 6 + lvl * 28;
      else if (isThinking) targetAmp = 18 + Math.sin(t * 5) * 7;
      else if (isSpeaking) targetAmp = 22 + lvl * 24;
      else targetAmp = 2.5 + Math.sin(t * 1.0) * 1.2;
      currentAmpRef.current += (targetAmp - currentAmpRef.current) * 0.028;
      const amp = currentAmpRef.current;

      ctx.clearRect(0, 0, size, size);

      // Ripples on activity — outward when speaking/thinking, INWARD when listening
      const interval = isThinking ? 0.55 : isSpeaking ? 0.4 : isListening ? 0.55 : 999;
      if (t - lastRippleRef.current > interval) {
        ripplesRef.current.push({ born: t, inward: isListening });
        lastRippleRef.current = t;
      }
      ripplesRef.current = ripplesRef.current.filter(rip => {
        const age = t - rip.born;
        if (age > 2.8) return false;
        const prog = age / 2.8;
        // Inward ripples start outside and contract toward the orb
        const r = rip.inward
          ? baseR * (2.4 - prog * 1.4)
          : baseR * (1 + prog * 1.4);
        const a = 0.5 * (1 - prog) * (1 - prog);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(34,211,238,${a * (rip.inward ? 0.6 : 0.45)})`;
        ctx.lineWidth = rip.inward ? 1.2 : 1;
        ctx.stroke();
        return true;
      });

      // Outer ambient halo — soft, large
      const halo = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, baseR * 2.6);
      halo.addColorStop(0, `rgba(34,211,238,${0.05 + Math.sin(t * 1.0) * 0.015 + act * 0.13})`);
      halo.addColorStop(0.5, `rgba(34,211,238,${0.012 + act * 0.038})`);
      halo.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Hover ring (subtle)
      if (hover && !isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + 14, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34,211,238,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Blob outline — luminous
      const pts = blobPath(t * (isActive ? 2.2 : 1.0), amp);
      trace(pts);
      ctx.save();
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 14 + act * 22;
      ctx.strokeStyle = `rgba(34,211,238,${0.42 + act * 0.43})`;
      ctx.lineWidth = 1.1 + act * 0.7;
      ctx.stroke();
      ctx.restore();

      // Fill — depth
      trace(pts);
      const fillG = ctx.createRadialGradient(cx - baseR * 0.2, cy - baseR * 0.22, 0, cx, cy, baseR * 1.2);
      fillG.addColorStop(0, '#04101a');
      fillG.addColorStop(0.6, '#02090e');
      fillG.addColorStop(1, '#000');
      ctx.fillStyle = fillG;
      ctx.fill();

      // Inner core glow
      trace(pts);
      ctx.save();
      ctx.clip();
      const corePulse = 0.18 + Math.sin(t * 1.1) * 0.05
        + act * (0.37 + Math.sin(t * 3) * 0.15 + lvl * 0.35);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.9);
      core.addColorStop(0, `rgba(34,211,238,${corePulse})`);
      core.addColorStop(0.3, `rgba(34,211,238,${corePulse * 0.45})`);
      core.addColorStop(0.7, `rgba(34,211,238,${corePulse * 0.12})`);
      core.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, size, size);

      // Listening — radial waveform bars inside the orb (audio reactive)
      if (isListening) {
        const bars = 32;
        for (let k = 0; k < bars; k++) {
          const a = (k / bars) * Math.PI * 2;
          const noise = 0.5 + 0.5 * Math.sin(t * 6 + k * 0.7) * Math.sin(t * 3.2 + k * 1.5);
          const barLen = baseR * 0.55 * (0.25 + lvl * 0.85 * noise);
          const inR = baseR * 0.18;
          const x1 = cx + inR * Math.cos(a);
          const y1 = cy + inR * Math.sin(a);
          const x2 = cx + (inR + barLen) * Math.cos(a);
          const y2 = cy + (inR + barLen) * Math.sin(a);
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, `rgba(207,250,254,${0.7 + lvl * 0.3})`);
          grad.addColorStop(1, 'rgba(34,211,238,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        // Bright inhale center
        const inhale = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.3);
        inhale.addColorStop(0, `rgba(207,250,254,${0.5 + lvl * 0.4})`);
        inhale.addColorStop(1, 'rgba(207,250,254,0)');
        ctx.fillStyle = inhale;
        ctx.beginPath();
        ctx.arc(cx, cy, baseR * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Internal energy threads when speaking/thinking only
      if (isSpeaking || isThinking) {
        for (let k = 0; k < 4; k++) {
          const phase = (k / 4) * Math.PI * 2 + t * 0.5;
          const sR = baseR * (0.3 + 0.4 * Math.sin(t * 0.7 + k * 1.3));
          const sx1 = cx + sR * Math.cos(phase);
          const sy1 = cy + sR * Math.sin(phase);
          const sx2 = cx + sR * Math.cos(phase + 1.3);
          const sy2 = cy + sR * Math.sin(phase + 1.3);
          const grad = ctx.createLinearGradient(sx1, sy1, sx2, sy2);
          grad.addColorStop(0, 'rgba(34,211,238,0)');
          grad.addColorStop(0.5, `rgba(207,250,254,${0.4 + lvl * 0.4})`);
          grad.addColorStop(1, 'rgba(34,211,238,0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
          ctx.stroke();
        }
      }

      // Specular bright spot
      const spec = ctx.createRadialGradient(cx - baseR * 0.3, cy - baseR * 0.32, 0, cx - baseR * 0.15, cy - baseR * 0.15, baseR * 0.55);
      spec.addColorStop(0, `rgba(207,250,254,${isActive ? 0.18 : 0.08})`);
      spec.addColorStop(1, 'rgba(207,250,254,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // Inner rim
      trace(pts);
      ctx.save();
      ctx.shadowColor = 'rgba(207,250,254,0.7)';
      ctx.shadowBlur = 2 + act * 3;
      ctx.strokeStyle = `rgba(207,250,254,${0.2 + act * 0.3})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();

      // ROCKY name — fades out when active, fades in on idle
      const targetNameAlpha = isActive ? 0 : 0.28 + Math.sin(t * 1.1) * 0.06;
      nameAlphaRef.current += (targetNameAlpha - nameAlphaRef.current) * 0.03;
      if (nameAlphaRef.current > 0.008) {
        ctx.save();
        ctx.font = `300 ${Math.round(baseR * 0.38)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 6;
        ctx.fillStyle = `rgba(207,250,254,${nameAlphaRef.current})`;
        ctx.fillText('ROCKY', cx, cy);
        ctx.restore();
      }

      // Particles — minimal field
      const pSpeed = 1.0 + act * (2.0 + lvl * 1.2);
      particlesRef.current.forEach(p => {
        p.angle += p.speed * pSpeed;
        const wobble = Math.sin(t * 1.6 + p.phase) * 6;
        const r = p.orbitR + wobble + (isSpeaking ? lvl * 10 : 0);
        const px = cx + r * Math.cos(p.angle);
        const py = cy + r * Math.sin(p.angle);
        const tw = 0.5 + 0.5 * Math.sin(t * 2 + p.phase);
        const pa = p.alpha * tw * (0.4 + act * 0.55);
        ctx.beginPath();
        ctx.arc(px, py, p.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${pa})`;
        if (isActive && p.sz > 0.9) {
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 5;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size, hover]);
  // state e audioLevel são lidos via stateRef/levelRef para não recriar o canvas a cada frame

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onClick={onTap}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'block', width: size, height: size,
        cursor: state === 'idle' ? 'pointer' : 'default',
        filter: `drop-shadow(0 0 ${state === 'idle' ? 28 : 56}px rgba(34,211,238,${state === 'idle' ? 0.28 : 0.55}))`,
        transition: 'filter 1.8s ease',
      }}
    />
  );
}
