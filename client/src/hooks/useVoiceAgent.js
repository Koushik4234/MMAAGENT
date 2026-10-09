import { useCallback, useEffect, useRef, useState } from 'react';
import { chunkLevel, MicCapture } from '../audio/MicCapture.js';
import { PcmPlayer } from '../audio/PcmPlayer.js';

const wsUrl = () => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/voice`;

/**
 * All voice-call logic in one hook: mic -> WebSocket -> speaker, plus transcript and status.
 * status: idle | connecting | live | ended | error
 */
export function useVoiceAgent() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [level, setLevel] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mock, setMock] = useState(false);

  const ref = useRef({ ws: null, mic: null, player: null, ready: false });

  const cleanup = useCallback(() => {
    const r = ref.current;
    r.mic?.close();
    r.player?.close();
    if (r.ws && r.ws.readyState <= 1) r.ws.close();
    ref.current = { ws: null, mic: null, player: null, ready: false };
    setLevel(0);
    setAiSpeaking(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  // While live: tick the timer and watch whether the AI is audibly talking.
  useEffect(() => {
    if (status !== 'live') return undefined;
    const startedAt = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      setAiSpeaking(Boolean(ref.current.player?.isPlaying));
    }, 150);
    return () => clearInterval(id);
  }, [status]);

  const addTranscript = useCallback((role, text) => {
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.final) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      const closed = prev.map((e, i) => (i === prev.length - 1 ? { ...e, final: true } : e));
      return [...closed, { id: crypto.randomUUID(), role, text, final: false }];
    });
  }, []);

  const finalizeTranscript = useCallback(() => {
    setTranscript((prev) => prev.map((e) => ({ ...e, final: true })));
  }, []);

  const handleServerMessage = useCallback(
    (msg) => {
      const r = ref.current;
      switch (msg.type) {
        case 'ready':
          r.ready = true;
          setMock(Boolean(msg.mock));
          setStatus('live');
          break;
        case 'transcript':
          addTranscript(msg.role, msg.text);
          break;
        case 'interrupted':
          r.player?.clear(); // stop talking immediately when the user barges in
          finalizeTranscript();
          break;
        case 'turn_complete':
          finalizeTranscript();
          break;
        case 'error':
          setError(msg.message || 'Something went wrong.');
          setStatus('error');
          break;
        case 'ended':
          setStatus((s) => (s === 'error' ? s : 'ended'));
          cleanup();
          break;
        default:
          break;
      }
    },
    [addTranscript, cleanup, finalizeTranscript],
  );

  const start = useCallback(
    async ({ personaId, systemPrompt } = {}) => {
      if (status === 'connecting' || status === 'live') return;
      setError('');
      setTranscript([]);
      setElapsed(0);
      setStatus('connecting');

      try {
        const mic = new MicCapture();
        await mic.open(); // permission prompt happens before any session is created
        const player = new PcmPlayer();
        const ws = new WebSocket(wsUrl());
        ws.binaryType = 'arraybuffer';
        ref.current = { ws, mic, player, ready: false };

        mic.onChunk = (chunk) => {
          setLevel(chunkLevel(chunk));
          const r = ref.current;
          if (r.ready && r.ws?.readyState === WebSocket.OPEN) r.ws.send(chunk);
        };

        ws.onopen = () => ws.send(JSON.stringify({ type: 'start', personaId, systemPrompt }));
        ws.onmessage = (event) => {
          if (typeof event.data === 'string') handleServerMessage(JSON.parse(event.data));
          else ref.current.player?.enqueue(event.data);
        };
        ws.onerror = () => {
          setError('Connection problem. Is the server running?');
          setStatus('error');
          cleanup();
        };
        ws.onclose = () => {
          setStatus((s) => (s === 'live' || s === 'connecting' ? 'ended' : s));
          cleanup();
        };
      } catch (err) {
        cleanup();
        setError(
          err?.name === 'NotAllowedError'
            ? 'Microphone permission was denied.'
            : err?.message || 'Could not start the call.',
        );
        setStatus('error');
      }
    },
    [cleanup, handleServerMessage, status],
  );

  const stop = useCallback(() => {
    const ws = ref.current.ws;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'stop' }));
    cleanup();
    setStatus('ended');
  }, [cleanup]);

  /** Replaces the text of one of the user's chat bubbles. With resend=true the AI is also told the corrected wording. */
  const editEntry = useCallback((id, text, resend = false) => {
    const clean = text.trim();
    if (!clean) return false;
    if (resend) {
      const { ws, ready } = ref.current;
      if (!ready || !ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify({ type: 'correction', text: clean }));
    }
    setTranscript((prev) => prev.map((e) => (e.id === id ? { ...e, text: clean, edited: true } : e)));
    return true;
  }, []);

  return { status, error, transcript, level, aiSpeaking, elapsed, mock, start, stop, editEntry };
}