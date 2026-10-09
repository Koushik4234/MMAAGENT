/**
 * Captures the microphone and emits 16 kHz mono PCM16 chunks (ArrayBuffer, ~100 ms each).
 */
export class MicCapture {
  constructor() {
    this.stream = null;
    this.context = null;
    this.node = null;
    this.onChunk = null;
  }

  /** Asks for mic permission and builds the audio graph. Throws if denied. */
  async open() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.context = new AudioContext();
    await this.context.audioWorklet.addModule('/pcm-capture-worklet.js');

    const source = this.context.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.context, 'pcm-capture');
    this.node.port.onmessage = (e) => this.onChunk?.(e.data);

    // Some browsers only run a worklet that reaches the destination; use a muted gain node.
    const mute = this.context.createGain();
    mute.gain.value = 0;
    source.connect(this.node).connect(mute).connect(this.context.destination);
  }

  close() {
    this.onChunk = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.node?.disconnect();
    this.context?.close().catch(() => {});
    this.stream = this.context = this.node = null;
  }
}

/** Loudness 0..1 of a PCM16 chunk, for the on-screen level meter. */
export function chunkLevel(arrayBuffer) {
  const samples = new Int16Array(arrayBuffer);
  if (!samples.length) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.min(1, Math.sqrt(sum / samples.length) / 8000);
}
