export default function HistoryLog({ visible, entries, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(20px)',
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? 'auto' : 'none',
      transition: 'opacity 0.5s ease',
      zIndex: 50,
      display: 'flex', flexDirection: 'column',
      padding: '60px 0 40px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 32px 28px',
        borderBottom: '1px solid rgba(34,211,238,0.1)',
        margin: '0 24px',
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10,
          color: 'rgba(34,211,238,0.5)', letterSpacing: '0.3em',
        }}>
          LOG · {entries.length} ENTRADAS
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(34,211,238,0.5)',
          fontFamily: 'var(--mono)', fontSize: 10,
          letterSpacing: '0.3em', padding: 4,
        }}>
          FECHAR · ESC
        </button>
      </div>

      <div style={{
        flex: 1, overflow: 'auto',
        padding: '32px 56px 40px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {entries.length === 0 && (
          <div style={{
            opacity: 0.3, textAlign: 'center', padding: 80,
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 18, color: 'rgba(34,211,238,0.5)',
          }}>
            Sem registros ainda.
          </div>
        )}
        {entries.map((e, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '90px 1fr',
            gap: 24,
            alignItems: 'baseline',
            animation: 'log-in 0.3s ease',
            animationDelay: `${i * 0.03}s`,
            animationFillMode: 'backwards',
            maxWidth: 800, margin: '0 auto', width: '100%',
          }}>
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 9, letterSpacing: '0.25em',
              color: e.role === 'user' ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.7)',
              textAlign: 'right',
            }}>
              {e.role === 'user' ? '— VOCÊ' : '— ROCKY'}
              <div style={{
                fontSize: 8, opacity: 0.5,
                marginTop: 4, letterSpacing: '0.15em',
              }}>{e.time}</div>
            </div>
            <div style={{
              fontFamily: e.role === 'user' ? 'var(--mono)' : 'var(--serif)',
              fontWeight: e.role === 'user' ? 400 : 300,
              fontStyle: e.role === 'user' ? 'normal' : 'italic',
              fontSize: e.role === 'user' ? 14 : 18,
              lineHeight: 1.6,
              color: e.role === 'user' ? '#a1d8e0' : '#e7faff',
              textShadow: e.role === 'user' ? 'none' : '0 0 16px rgba(34,211,238,0.2)',
            }}>
              {e.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
