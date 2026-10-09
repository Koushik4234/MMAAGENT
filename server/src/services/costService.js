const PER_MILLION = 1_000_000;

/**
 * Turns token counts into an estimated USD cost.
 * `usage` = { inputTextTokens, inputAudioTokens, outputTextTokens, outputAudioTokens }
 */
export function calculateCost(usage, pricing) {
  return (
    (usage.inputTextTokens * pricing.textInput +
      usage.inputAudioTokens * pricing.audioInput +
      usage.outputTextTokens * pricing.textOutput +
      usage.outputAudioTokens * pricing.audioOutput) /
    PER_MILLION
  );
}

/** Audio tokens we estimate ourselves when Gemini does not report them. */
export function estimateAudioTokens(seconds, pricing) {
  return Math.round(seconds * pricing.audioTokensPerSecond);
}
