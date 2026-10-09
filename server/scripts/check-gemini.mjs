import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config/env.js';

if (!config.gemini.apiKey) {
  console.error('No GEMINI_API_KEY found in .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

// 1) Does the key work? (same call as Google's sample)
const res = await ai.models.generateContent({
  model: 'gemini-flash-latest',
  contents: 'Say hello in five words',
});
console.log('Key works. Reply:', res.text);

// 2) Which models support the Live (voice) API?
console.log('\nLive-capable models (use one of these as GEMINI_MODEL):');
const pager = await ai.models.list();
for await (const m of pager) {
  if ((m.supportedActions || []).includes('bidiGenerateContent')) {
    console.log(' -', m.name.replace('models/', ''));
  }
}