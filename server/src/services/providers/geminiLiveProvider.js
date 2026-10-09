import { GoogleGenAI, Modality } from '@google/genai';
import { parseUsageMetadata } from '../../utils/usageParser.js';

/**
 * Provider interface (shared with the mock provider):
 *
 *   connect({ systemPrompt, handlers }) -> Promise<{ sendAudio(buffer), sendText(text), close() }>
 *
 * handlers: onAudio(buffer) onInputTranscript(text) onOutputTranscript(text)
 *           onInterrupted() onTurnComplete() onUsage(usage) onError(err) onClose()
 */
export class GeminiLiveProvider {
  constructor({ apiKey, model, voice }) {
    this.name = 'gemini';
    this.model = model;
    this.voice = voice;
    this.client = new GoogleGenAI({ apiKey });
  }

  async connect({ systemPrompt, handlers }) {
    const session = await this.client.live.connect({
      model: this.model,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemPrompt,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voice } } },
      },
      callbacks: {
        onopen: () => {},
        onmessage: (message) => this.handleMessage(message, handlers),
        onerror: (e) => handlers.onError(new Error(e?.message || 'Gemini connection error')),
        onclose: () => handlers.onClose(),
      },
    });

    return {
      sendAudio: (buffer) =>
        session.sendRealtimeInput({
          audio: { data: buffer.toString('base64'), mimeType: 'audio/pcm;rate=16000' },
        }),
      // Plain text input, used when the user corrects one of their messages.
      sendText: (text) => session.sendRealtimeInput({ text }),
      close: () => {
        try {
          session.close();
        } catch {
          /* already closed */
        }
      },
    };
  }

  handleMessage(message, h) {
    const content = message.serverContent;

    if (content) {
      for (const part of content.modelTurn?.parts || []) {
        if (part.inlineData?.data) h.onAudio(Buffer.from(part.inlineData.data, 'base64'));
      }
      if (content.inputTranscription?.text) h.onInputTranscript(content.inputTranscription.text);
      if (content.outputTranscription?.text) h.onOutputTranscript(content.outputTranscription.text);
      if (content.interrupted) h.onInterrupted();
      if (content.turnComplete) h.onTurnComplete();
    }

    const usage = parseUsageMetadata(message.usageMetadata);
    if (usage) h.onUsage(usage);
  }
}