const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Converts Gemini's `usageMetadata` into our four counters.
 * Gemini reports per-modality breakdowns in promptTokensDetails / responseTokensDetails:
 *   [{ modality: 'AUDIO' | 'TEXT' | ..., tokenCount: 123 }]
 * Returns null when the message carries no usage information.
 */
export function parseUsageMetadata(meta) {
  if (!meta) return null;

  const sumBy = (details, modality) =>
    (details || [])
      .filter((d) => String(d.modality).toUpperCase() === modality)
      .reduce((acc, d) => acc + num(d.tokenCount), 0);

  const inDetails = meta.promptTokensDetails;
  const outDetails = meta.responseTokensDetails;
  const hasDetails = (inDetails && inDetails.length) || (outDetails && outDetails.length);

  if (hasDetails) {
    const inputAudio = sumBy(inDetails, 'AUDIO');
    const outputAudio = sumBy(outDetails, 'AUDIO');
    return {
      inputAudioTokens: inputAudio,
      inputTextTokens: Math.max(0, num(meta.promptTokenCount) - inputAudio),
      outputAudioTokens: outputAudio,
      outputTextTokens: Math.max(0, num(meta.responseTokenCount) - outputAudio),
    };
  }

  // No breakdown: only totals are known. Attribute everything to audio, the dominant modality.
  if (meta.promptTokenCount || meta.responseTokenCount) {
    return {
      inputAudioTokens: num(meta.promptTokenCount),
      inputTextTokens: 0,
      outputAudioTokens: num(meta.responseTokenCount),
      outputTextTokens: 0,
    };
  }
  return null;
}
