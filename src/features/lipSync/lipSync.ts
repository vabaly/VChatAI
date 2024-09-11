import { type LipSyncAnalyzeResult } from "./lipSyncAnalyzeResult";

const TIME_DOMAIN_DATA_LENGTH = 2048;

export class LipSync {
  public readonly audio: AudioContext;
  public readonly analyser: AnalyserNode;
  public readonly timeDomainData: Float32Array;

  public constructor(audio: AudioContext) {
    this.audio = audio;

    // Can be used to expose audio time and frequency data, e.g. to create data visualizations.
    this.analyser = audio.createAnalyser();
    // Corresponds to the C floating-point data type.
    this.timeDomainData = new Float32Array(TIME_DOMAIN_DATA_LENGTH);
  }

  public update(): LipSyncAnalyzeResult {
    this.analyser.getFloatTimeDomainData(this.timeDomainData);

    let volume = 0.0;
    for (let i = 0; i < TIME_DOMAIN_DATA_LENGTH; i++) {
      volume = Math.max(volume, Math.abs(this.timeDomainData[i] ?? volume));
    }

    // cook
    volume = 1 / (1 + Math.exp(-45 * volume + 5));
    if (volume < 0.1) volume = 0;

    return {
      volume,
    };
  }

  // Synchronization based on audio file lip sync
  public async playFromArrayBuffer(buffer: ArrayBuffer, onEnded?: () => void) {
    const audioBuffer = await this.audio.decodeAudioData(buffer);

    const bufferSource = this.audio.createBufferSource();
    bufferSource.buffer = audioBuffer;

    bufferSource.connect(this.audio.destination);
    bufferSource.connect(this.analyser);
    // Play audio.
    bufferSource.start();
    if (onEnded) {
      bufferSource.addEventListener("ended", onEnded);
    }
  }
}
