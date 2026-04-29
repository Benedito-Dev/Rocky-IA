export default function StatusMark({ state }) {
  const label =
    state === 'idle' ? '' :
    state === 'listening' ? 'ouvindo' :
    state === 'thinking' ? 'pensando' : 'falando';

  return (
    <div style={{
      position: 'fixed', top: 24, left: 28,
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--mono)', fontSize: 9,
      letterSpacing: '0.3em',
      color: 'rgba(34,211,238,0.4)',
      zIndex: 10, pointerEvents: 'none',
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%',
        background: '#22d3ee',
        boxShadow: '0 0 6px #22d3ee',
        animation: state === 'idle' ? 'breath 3s ease-in-out infinite' : 'none',
      }} />
      <span style={{ opacity: state === 'idle' ? 0 : 1, transition: 'opacity 0.5s ease' }}>
        {label}
      </span>
    </div>
  );
}
