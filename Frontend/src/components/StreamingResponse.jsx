export default function StreamingResponse({ text, streaming, visible }) {
  if (!text) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(50% + 36vh)',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(640px, 86vw)',
      textAlign: 'center',
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1.4s ease',
    }}>
      <p style={{
        fontFamily: 'var(--serif)',
        fontWeight: 300,
        fontSize: 'clamp(18px, 2vw, 23px)',
        lineHeight: 1.55,
        color: '#e7faff',
        letterSpacing: '0.005em',
        textShadow: '0 0 22px rgba(34,211,238,0.45), 0 0 44px rgba(34,211,238,0.15)',
        fontStyle: 'italic',
      }}>
        {text}
        {streaming && (
          <span style={{
            display: 'inline-block', width: 2, height: '1em',
            background: '#22d3ee', marginLeft: 4,
            verticalAlign: 'text-bottom',
            animation: 'blink 0.65s step-end infinite',
            boxShadow: '0 0 10px #22d3ee',
          }} />
        )}
      </p>
    </div>
  );
}
