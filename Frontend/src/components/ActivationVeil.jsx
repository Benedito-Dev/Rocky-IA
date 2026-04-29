export default function ActivationVeil({ done }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#000',
      zIndex: 100,
      opacity: done ? 0 : 1,
      transition: 'opacity 1.2s ease',
      pointerEvents: done ? 'none' : 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.4em',
        color: 'rgba(34,211,238,0.5)',
        opacity: done ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}>
        ATIVANDO
        <span style={{ animation: 'blink 1s step-end infinite', marginLeft: 4 }}>_</span>
      </div>
    </div>
  );
}
