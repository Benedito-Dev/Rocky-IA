export default function UserEcho({ text, visible }) {
  if (!text) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 'calc(50% - 36vh)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(560px, 80vw)',
      textAlign: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 1s ease',
      pointerEvents: 'none',
      fontFamily: 'var(--mono)',
      fontSize: 12,
      letterSpacing: '0.04em',
      color: 'rgba(34,211,238,0.55)',
      fontWeight: 300,
    }}>
      <span style={{ opacity: 0.45, marginRight: 10 }}>—</span>
      {text}
      <span style={{ opacity: 0.45, marginLeft: 10 }}>—</span>
    </div>
  );
}
