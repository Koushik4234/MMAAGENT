/**
 * Fake "AI" used when there is no Gemini key (or MOCK_MODE=true).
 * It listens to microphone energy, and after the user stops talking it "replies" with a
 * short synthesized tone plus a canned transcript. If the user talks over it, it reports an
 * interruption. This exercises the whole pipeline (audio, transcripts, usage, cost, dashboard).
 */
const SILENCE_MS = 900;
const ENERGY_THRESHOLD = 600; // RMS on int16 scale
const OUT_RATE = 24000;
const CHUNK_MS = 100;

const REPLIES = [
  'This is a mock reply. Add a Gemini API key to talk to the real model.',
  'I heard you loud and clear. Everything on the dashboard is updating live.',
  'Mock mode is on, so this answer is canned, but the cost tracking is real.',
];

const rms = (buffer) => {
  const samples = buffer.length >> 1;
  if (!samples) return 0;
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const s = buffer.readInt16LE(i * 2);
    sum += s * s;
  }
  return Math.sqrt(sum / samples);
};

function toneChunk(offset, freq) {
  const n = (OUT_RATE * CHUNK_MS) / 1000;
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = (offset + i) / OUT_RATE;
    const v = Math.sin(2 * Math.PI * freq * t) * 0.15 * 32767;
    buf.writeInt16LE(Math.round(v), i * 2);
  }
  return buf;
}

export class MockLiveProvider {
  constructor() {
    this.name = 'mock';
    this.model = 'mock';
  }

  async connect({ handlers }) {
    let speaking = false; // is the user currently talking?
    let userSpokeMs = 0;
    let lastVoiceAt = 0;
    let replyTimer = null;
    let silenceTimer = null;
    let replyCount = 0;
    let usage = { inputTextTokens: 0, inputAudioTokens: 0, outputTextTokens: 0, outputAudioTokens: 0 };
    let closed = false;

    const stopReply = () => {
      if (replyTimer) clearInterval(replyTimer);
      const wasReplying = Boolean(replyTimer);
      replyTimer = null;
      return wasReplying;
    };

    const startReply = () => {
      const text = REPLIES[replyCount++ % REPLIES.length];
      const durationMs = Math.min(4000, 1200 + text.length * 25);
      const totalChunks = Math.ceil(durationMs / CHUNK_MS);
      let sent = 0;
      let offset = 0;

      handlers.onOutputTranscript(text);
      usage = {
        ...usage,
        outputTextTokens: usage.outputTextTokens + Math.ceil(text.length / 4),
      };

      replyTimer = setInterval(() => {
        if (closed) return;
        const freq = 300 + (sent % 8) * 40;
        handlers.onAudio(toneChunk(offset, freq));
        offset += (OUT_RATE * CHUNK_MS) / 1000;
        usage = { ...usage, outputAudioTokens: usage.outputAudioTokens + Math.round((CHUNK_MS / 1000) * 25) };
        handlers.onUsage(usage);
        if (++sent >= totalChunks) {
          stopReply();
          handlers.onTurnComplete();
        }
      }, CHUNK_MS);
    };

    const endUserTurn = () => {
      speaking = false;
      const seconds = (userSpokeMs / 1000).toFixed(1);
      userSpokeMs = 0;
      handlers.onInputTranscript(`(mock) You spoke for about ${seconds} seconds.`);
      usage = { ...usage, inputTextTokens: usage.inputTextTokens + 12 };
      handlers.onUsage(usage);
      startReply();
    };

    return {
      sendText: () => {}, // the canned mock AI ignores corrections
      sendAudio: (buffer) => {
        if (closed) return;
        const chunkMs = (buffer.length / 2 / 16000) * 1000;
        usage = { ...usage, inputAudioTokens: usage.inputAudioTokens + Math.round((chunkMs / 1000) * 25) };

        if (rms(buffer) > ENERGY_THRESHOLD) {
          if (!speaking) {
            speaking = true;
            if (stopReply()) handlers.onInterrupted(); // user talked over the AI
          }
          lastVoiceAt = Date.now();
          userSpokeMs += chunkMs;
          clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (!closed && speaking && Date.now() - lastVoiceAt >= SILENCE_MS - 50) endUserTurn();
          }, SILENCE_MS);
        }
      },
      close: () => {
        closed = true;
        stopReply();
        clearTimeout(silenceTimer);
        handlers.onClose();
      },
    };
  }
}