import { useState, useEffect, useRef } from 'react';

export default function InlineInput({ visible, onSend, onClose, disabled }) {
  const [val, setVal] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (visible) {
      ref.current?.focus();
    }
  }, [visible]);

  const handleClose = () => {
    setVal('');
    onClose();
  };

  const send = () => {
    if (!val.trim() || disabled) return;
    onSend(val.trim());
    setVal('');
    handleClose();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      padding: '0 24px 60px',
      display: 'flex', justifyContent: 'center',
      pointerEvents: visible ? 'auto' : 'none',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      zIndex: 30,
    }}>
      <div style={{
        width: 'min(520px, 88vw)',
        position: 'relative',
        paddingBottom: 8,
      }}>
        <input
          ref={ref}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); send(); }
            if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
          }}
          placeholder="diga algo"
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            color: '#e7faff',
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 22,
            textAlign: 'center',
            caretColor: '#22d3ee',
            paddingBottom: 12,
          }}
        />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: 1,
          background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.6), transparent)',
          transformOrigin: 'center',
          animation: visible ? 'line-grow 0.7s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
        }} />
      </div>
    </div>
  );
}
