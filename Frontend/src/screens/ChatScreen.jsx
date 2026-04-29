import { useState, useEffect, useRef, useCallback } from 'react';
import { sendMessageWithSpeech, sendAudioWithSpeech } from '../services/api';
import Presence from '../components/Presence';
import StreamingResponse from '../components/StreamingResponse';
import UserEcho from '../components/UserEcho';
import ActivationVeil from '../components/ActivationVeil';
import HintDot from '../components/HintDot';
import InlineInput from '../components/InlineInput';
import HistoryLog from '../components/HistoryLog';
import StatusMark from '../components/StatusMark';

export default function ChatScreen() {
  const [appState, setAppState] = useState('idle'); // idle | listening | thinking | speaking
  const [audioLevel, setAudioLevel] = useState(0);
  const [rockyText, setRockyText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [responseVisible, setResponseVisible] = useState(false);
  const [userEcho, setUserEcho] = useState('');
  const [echoVisible, setEchoVisible] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [log, setLog] = useState([]);
  const [activated, setActivated] = useState(false);
  const [orbSize, setOrbSize] = useState(() => Math.min(window.innerWidth, window.innerHeight) * 0.45);

  // Refs para controle de fluxo de áudio e gravação
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const micStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const rafAudioRef = useRef(null);
  const listenAutoRef = useRef(null);
  const fadeRef = useRef(null);
  const echoFadeRef = useRef(null);
  const appStateRef = useRef(appState);

  useEffect(() => { appStateRef.current = appState; }, [appState]);

  // Resize listener para orbSize
  useEffect(() => {
    const handleResize = () => setOrbSize(Math.min(window.innerWidth, window.innerHeight) * 0.45);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sequência de ativação
  useEffect(() => {
    const t = setTimeout(() => setActivated(true), 1100);
    return () => clearTimeout(t);
  }, []);

  const nowStr = () => {
    const d = new Date();
    return d.toTimeString().slice(0, 5);
  };

  const logEntry = useCallback((role, content) => {
    setLog(l => [...l, { role, content, time: nowStr() }]);
  }, []);

  // Para e limpa reprodução de áudio
  const stopPlayback = useCallback(() => {
    if (rafAudioRef.current) {
      cancelAnimationFrame(rafAudioRef.current);
      rafAudioRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    clearTimeout(fadeRef.current);
    clearTimeout(echoFadeRef.current);
  }, []);

  // Para e limpa gravação de microfone
  const stopRecording = useCallback(() => {
    clearTimeout(listenAutoRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (rafAudioRef.current) {
      cancelAnimationFrame(rafAudioRef.current);
      rafAudioRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Reproduz áudio com AnalyserNode real para audioLevel
  const playAudio = useCallback((audioUrl) => {
    stopPlayback();

    const audio = new Audio(audioUrl);
    const actx = new AudioContext();
    const analyser = actx.createAnalyser();
    analyser.fftSize = 256;
    const source = actx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(actx.destination); // obrigatório para o áudio tocar

    audioRef.current = audio;
    audioCtxRef.current = actx;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!audioRef.current) return;
      analyser.getByteTimeDomainData(data);
      const rms = Math.sqrt(
        data.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / data.length
      );
      setAudioLevel(Math.min(1, rms * 3));
      rafAudioRef.current = requestAnimationFrame(tick);
    };

    audio.play().catch(() => {});
    setAppState('speaking');
    requestAnimationFrame(tick);

    audio.onended = () => {
      setAppState('idle');
      setAudioLevel(0);
      audioRef.current = null;
      actx.close().catch(() => {});
      audioCtxRef.current = null;
      rafAudioRef.current = null;
      URL.revokeObjectURL(audioUrl);
      fadeRef.current = setTimeout(() => setResponseVisible(false), 6500);
      echoFadeRef.current = setTimeout(() => setEchoVisible(false), 5500);
    };
  }, [stopPlayback]);

  // Envia áudio gravado ao backend
  const sendAudio = useCallback(async (audioBlob) => {
    try {
      setAppState('thinking');
      const { text, transcription, audioUrl } = await sendAudioWithSpeech(audioBlob);
      setUserEcho(transcription);
      setEchoVisible(true);
      logEntry('user', transcription);
      setRockyText(text);
      setResponseVisible(true);
      setStreaming(false);
      logEntry('rocky', text);
      playAudio(audioUrl);
    } catch {
      setAppState('idle');
      setAudioLevel(0);
    }
  }, [logEntry, playAudio]);

  // Toque na orb: controla estado idle → listening → thinking e interrupções
  const handlePresenceTap = useCallback(() => {
    const s = appStateRef.current;

    if (s === 'thinking' || s === 'speaking') {
      // Interrompe tudo e volta a idle
      stopPlayback();
      stopRecording();
      setAppState('idle');
      setAudioLevel(0);
      return;
    }

    if (s === 'listening') {
      // Commit: para gravação e envia via onstop
      clearTimeout(listenAutoRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // idle → listening
    setRockyText('');
    setResponseVisible(false);
    setUserEcho('');
    setEchoVisible(false);
    clearTimeout(fadeRef.current);
    clearTimeout(echoFadeRef.current);

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(micStream => {
        micStreamRef.current = micStream;
        chunksRef.current = [];

        // AudioContext para audioLevel do microfone — criado dentro de user gesture
        const actx = new AudioContext();
        audioCtxRef.current = actx;
        const analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        const micSource = actx.createMediaStreamSource(micStream);
        micSource.connect(analyser);
        // Não conectar ao destination: evita feedback do microfone

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (appStateRef.current !== 'listening') return;
          analyser.getByteTimeDomainData(data);
          const rms = Math.sqrt(
            data.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / data.length
          );
          setAudioLevel(Math.min(1, rms * 3));
          rafAudioRef.current = requestAnimationFrame(tick);
        };

        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const recorder = new MediaRecorder(micStream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          // Limpa microfone antes de enviar
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
          }
          if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
          }
          if (rafAudioRef.current) {
            cancelAnimationFrame(rafAudioRef.current);
            rafAudioRef.current = null;
          }
          setAudioLevel(0);

          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          sendAudio(blob);
        };

        recorder.start();
        setAppState('listening');
        requestAnimationFrame(tick);

        // Timeout automático de 4500ms para enviar
        listenAutoRef.current = setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 4500);
      })
      .catch(() => {
        // Microfone negado ou indisponível
        setAppState('idle');
      });
  }, [stopPlayback, stopRecording, sendAudio]);

  // Envia mensagem de texto via InlineInput
  const handleSend = useCallback(async (text) => {
    clearTimeout(fadeRef.current);
    clearTimeout(echoFadeRef.current);
    setUserEcho(text);
    setEchoVisible(true);
    logEntry('user', text);
    setRockyText('');
    setResponseVisible(false);
    setStreaming(false);
    setAppState('thinking');

    try {
      const { text: reply, audioUrl } = await sendMessageWithSpeech(text);
      setRockyText(reply);
      setResponseVisible(true);
      logEntry('rocky', reply);
      playAudio(audioUrl);
    } catch {
      setAppState('idle');
      setAudioLevel(0);
    }
  }, [logEntry, playAudio]);

  // Keyboard handler
  useEffect(() => {
    const handler = e => {
      if (e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') setTextOpen(false);
        return;
      }
      if (e.key === 'Escape') {
        stopPlayback();
        stopRecording();
        setAppState('idle');
        setAudioLevel(0);
        setStreaming(false);
        setLogOpen(false);
        setTextOpen(false);
        setResponseVisible(false);
        setEchoVisible(false);
      } else if (e.key === ' ' && !textOpen && !logOpen) {
        e.preventDefault();
        handlePresenceTap();
      } else if ((e.key === 't' || e.key === 'T') && !textOpen && appState === 'idle') {
        e.preventDefault();
        setTextOpen(true);
      } else if ((e.key === 'h' || e.key === 'H') && appState === 'idle') {
        e.preventDefault();
        setLogOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePresenceTap, textOpen, logOpen, appState, stopPlayback, stopRecording]);

  return (
    <div style={{ position: 'relative', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <ActivationVeil done={activated} />
      <StatusMark state={appState} />

      {/* Log toggle — top right */}
      <button
        onClick={() => setLogOpen(o => !o)}
        style={{
          position: 'fixed', top: 24, right: 28, zIndex: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(34,211,238,0.4)',
          fontFamily: 'var(--mono)', fontSize: 9,
          letterSpacing: '0.3em',
          padding: 6,
          transition: 'color 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(34,211,238,0.8)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(34,211,238,0.4)'}
      >
        log · h
      </button>

      {/* Orb centralizada */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
        opacity: activated ? 1 : 0,
        transform: activated ? 'scale(1)' : 'scale(0.6)',
        transition: 'opacity 1.5s ease, transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <Presence
          state={appState}
          audioLevel={audioLevel}
          size={orbSize}
          onTap={handlePresenceTap}
        />
      </div>

      <UserEcho text={userEcho} visible={echoVisible} />
      <StreamingResponse text={rockyText} streaming={streaming} visible={responseVisible} />

      {/* HintDot — apenas quando idle, sem overlays abertos */}
      {appState === 'idle' && !textOpen && !logOpen && (
        <HintDot onClick={() => setTextOpen(true)} label="digitar · t" />
      )}

      <InlineInput
        visible={textOpen}
        onSend={handleSend}
        onClose={() => setTextOpen(false)}
        disabled={appState !== 'idle'}
      />

      <HistoryLog
        visible={logOpen}
        entries={log}
        onClose={() => setLogOpen(false)}
      />
    </div>
  );
}
