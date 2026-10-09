const OUTPUT_SAMPLE_RATE = 24000;

/**
 * Plays raw PCM16 24 kHz chunks gaplessly, and can cut playback instantly
 * (used when the user interrupts the AI).
 */
export class PcmPlayer {
  constructor() {
    this.context = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
    this.nextTime = 0;
    this.sources = new Set();
  }

  enqueue(arrayBuffer) {
    const pcm = new Int16Array(arrayBuffer);
    if (!pcm.length) return;

    const buffer = this.context.createBuffer(1, pcm.length, OUTPUT_SAMPLE_RATE);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) data[i] = pcm[i] / 0x8000;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.onended = () => this.sources.delete(source);

    const startAt = Math.max(this.nextTime, this.context.currentTime + 0.03);
    source.start(startAt);
    this.nextTime = startAt + buffer.duration;
    this.sources.add(source);
  }

  /** Stop everything that is queued or playing. */
  clear() {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    this.sources.clear();
    this.nextTime = 0;
  }

  get isPlaying() {
    return this.sources.size > 0 && this.nextTime > this.context.currentTime;
  }

  close() {
    this.clear();
    this.context.close().catch(() => {});
  }
}
