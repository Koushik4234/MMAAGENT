import { WebSocketServer } from 'ws';
import { getPersona } from '../config/personas.js';
import { isOriginAllowed } from '../utils/origin.js';

const MAX_PROMPT_LENGTH = 2000;

/**
 * WebSocket endpoint  /ws/voice
 *
 * Protocol
 *   client -> server  JSON   {type:'start', personaId, systemPrompt?}  (first message)
 *   client -> server  binary raw PCM16 mono 16 kHz microphone audio
 *   client -> server  JSON   {type:'correction', text}  (user edited one of their messages)
 *   client -> server  JSON   {type:'stop'}
 *   server -> client  JSON   {type:'ready'|'transcript'|'interrupted'|'turn_complete'|'error'|'ended'}
 *   server -> client  binary raw PCM16 mono 24 kHz AI audio
 */
export function attachVoiceSocket({ server, provider, sessionService, config }) {
  const wss = new WebSocketServer({
    server,
    path: '/ws/voice',
    verifyClient: ({ origin, req }) => isOriginAllowed(origin, req.headers.host, config.allowedOrigins),
  });

  wss.on('connection', (ws) => {
    let tracker = null;
    let live = null;
    let ended = false;
    let maxTimer = null;

    const send = (obj) => ws.readyState === ws.OPEN && ws.send(JSON.stringify(obj));

    const endSession = (reason, status = 'completed') => {
      if (ended) return;
      ended = true;
      clearTimeout(maxTimer);
      live?.close();
      tracker?.finish(reason, status);
      send({ type: 'ended', reason });
      if (ws.readyState === ws.OPEN) ws.close();
    };

    const handlers = {
      onAudio: (buf) => {
        tracker.addAudioOut(buf.length);
        if (ws.readyState === ws.OPEN) ws.send(buf, { binary: true });
      },
      onInputTranscript: (text) => {
        tracker.addTranscriptChunk('user', text);
        send({ type: 'transcript', role: 'user', text });
      },
      onOutputTranscript: (text) => {
        tracker.addTranscriptChunk('assistant', text);
        send({ type: 'transcript', role: 'assistant', text });
      },
      onInterrupted: () => {
        tracker.flushRole('assistant');
        send({ type: 'interrupted' });
      },
      onTurnComplete: () => {
        tracker.flushTranscript();
        send({ type: 'turn_complete' });
      },
      onUsage: (usage) => tracker.applyUsage(usage),
      onError: (err) => {
        console.error('[voice] provider error:', err.message);
        send({ type: 'error', message: 'The voice service had a problem. Please try again.' });
        endSession('provider_error', 'error');
      },
      onClose: () => endSession('provider_closed'),
    };

    /** The user edited a message. Tell the model what they actually meant and log it. */
    const handleCorrection = (msg) => {
      const text = typeof msg.text === 'string' ? msg.text.trim().slice(0, 1000) : '';
      if (!live || !text) return;
      try {
        live.sendText(
          `The user corrected their earlier message. What they actually meant to say: "${text}". Please respond to this corrected version.`,
        );
      } catch (err) {
        console.error('[voice] correction failed:', err.message);
        return;
      }
      tracker.addTranscriptChunk('user', `Corrected message: ${text}`);
      tracker.flushRole('user');
    };

    const start = async (msg) => {
      const persona = getPersona(msg.personaId);
      const custom = typeof msg.systemPrompt === 'string' ? msg.systemPrompt.trim() : '';
      const systemPrompt = (custom || persona.systemPrompt).slice(0, MAX_PROMPT_LENGTH);

      tracker = sessionService.startSession({
        personaId: persona.id,
        provider: provider.name,
        model: provider.model,
      });

      try {
        live = await provider.connect({ systemPrompt, handlers });
      } catch (err) {
        console.error('[voice] connect failed:', err.message);
        send({ type: 'error', message: 'Could not connect to the AI service.' });
        return endSession('connect_failed', 'error');
      }

      if (ended) return live.close(); // client left while we were connecting
      maxTimer = setTimeout(() => endSession('max_duration'), config.maxSessionSeconds * 1000);
      send({ type: 'ready', sessionId: tracker.id, mock: provider.name === 'mock' });
    };

    ws.on('message', (data, isBinary) => {
      if (ended) return;
      if (isBinary) {
        if (live) {
          tracker.addAudioIn(data.length);
          live.sendAudio(data);
        }
        return;
      }
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return;
      }
      if (msg.type === 'start' && !tracker) start(msg);
      else if (msg.type === 'correction') handleCorrection(msg);
      else if (msg.type === 'stop') endSession('client_ended');
    });

    ws.on('close', () => endSession('client_disconnected'));
    ws.on('error', () => endSession('socket_error', 'error'));
  });

  return wss;
}