import { useState } from 'react';

export default function HintDot({ onClick, label }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'fixed',
        bottom: 28, left: '50%',
        transform: 'translateX(-50%)',
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: 8,
        opacity: hover ? 1 : 0.5,
        transition: 'opacity 0.4s ease',
        color: 'rgba(34,211,238,0.6)',
        fontFamily: 'var(--mono)', fontSize: 9,
        letterSpacing: '0.3em',
      }}
    >
      <div style={{
        width: 4, height: 4, borderRadius: '50%',
        background: '#22d3ee',
        animation: 'breath 3s ease-in-out infinite',
        boxShadow: '0 0 6px #22d3ee',
      }} />
      {hover && <span style={{ animation: 'fade-up 0.3s ease' }}>{label}</span>}
    </button>
  );
}
