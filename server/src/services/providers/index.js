import { GeminiLiveProvider } from './geminiLiveProvider.js';
import { MockLiveProvider } from './mockLiveProvider.js';

/** Picks the live-audio provider. To add OpenAI Realtime etc., add a class and a branch here. */
export function createProvider(config) {
  if (config.mockMode) return new MockLiveProvider();
  return new GeminiLiveProvider(config.gemini);
}
