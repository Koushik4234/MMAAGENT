// Runs on the audio thread. Downsamples microphone audio to 16 kHz mono PCM16
// and posts 100 ms chunks (1600 samples) to the main thread.
class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000; // input samples per output sample
    this.phase = 0;
    this.acc = 0;
    this.count = 0;
    this.out = new Int16Array(1600);
    this.idx = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this.acc += channel[i];
      this.count += 1;
      this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.acc / this.count));
        this.acc = 0;
        this.count = 0;
        this.out[this.idx++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        if (this.idx === this.out.length) {
          this.port.postMessage(this.out.buffer.slice(0));
          this.idx = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('pcm-capture', PcmCaptureProcessor);
