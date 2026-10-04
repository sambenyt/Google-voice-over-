import { AudioEffectsConfig } from "../types";

export const DEFAULT_EFFECTS: AudioEffectsConfig = {
  playbackRate: 1.0,
  pitchCents: 0,
  eqBass: 0,
  eqMid: 0,
  eqTreble: 0,
  reverbMix: 0,
  reverbRoom: "dry",
  compressorEnabled: true,
  compressorThreshold: -24,
  compressorRatio: 4,
  volume: 1.0,
};

// Converts Base64 data (with or without data:audio/wav;base64 prefix) to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const clean = base64.replace(/^data:audio\/\w+;base64,/, "").trim();
  const binaryString = window.atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generates an impulse response buffer for room reverb
export function createImpulseResponse(
  ctx: BaseAudioContext,
  duration = 1.5,
  decay = 2.0
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const factor = Math.exp(-t * decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

// Extracts 100 waveform peak values between 0 and 1 for visualizer
export function extractWaveformPeaks(buffer: AudioBuffer, numPeaks = 120): number[] {
  const rawData = buffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / numPeaks);
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(rawData[start + j] || 0);
      sum += val;
    }
    const avg = sum / (blockSize || 1);
    peaks.push(Math.min(1, avg * 3.5)); // scaled for visual presence
  }
  return peaks;
}

// Encodes AudioBuffer to 16-bit PCM WAV Blob
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* file length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write interleaved PCM samples
  let offset = 44;
  const channels = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generates a studio acoustic vocal tone buffer matching speech cadence and voice persona
export function createSyntheticVoiceAudio(
  text: string,
  voiceName: string
): { blob: Blob; buffer: AudioBuffer; peaks: number[] } {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();
  const sampleRate = 24000;

  // Pitch base per persona
  let f0 = 200; // Kore default
  if (voiceName === "Charon") f0 = 105;
  else if (voiceName === "Puck") f0 = 180;
  else if (voiceName === "Fenrir") f0 = 125;
  else if (voiceName === "Zephyr") f0 = 190;

  // Calculate timing based on syllables / words
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const totalSeconds = Math.max(3, Math.min(120, (wordCount / 140) * 60));
  const numSamples = Math.floor(sampleRate * totalSeconds);

  const buffer = tempCtx.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Synthesize rich voice formant harmonics with syllabic amplitude modulation
  const syllabicRate = (wordCount * 1.8) / totalSeconds; // syllables per second
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Word envelope with natural cadence
    const syllabicEnv = 0.5 + 0.5 * Math.sin(2 * Math.PI * syllabicRate * t);
    const pauseFactor = Math.sin(2 * Math.PI * 0.25 * t) > 0.8 ? 0.05 : 1.0;

    // Harmonic vocal cord simulation (fundamental + 2nd & 3rd formant harmonics)
    const harmonic1 = Math.sin(2 * Math.PI * f0 * t);
    const harmonic2 = 0.4 * Math.sin(2 * Math.PI * (f0 * 2) * t);
    const harmonic3 = 0.25 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    const breathNoise = 0.04 * (Math.random() * 2 - 1);

    const val = (harmonic1 + harmonic2 + harmonic3 + breathNoise) * syllabicEnv * pauseFactor * 0.35;
    data[i] = val;
  }

  const peaks = extractWaveformPeaks(buffer, 120);
  const blob = audioBufferToWav(buffer);
  tempCtx.close().catch(() => {});

  return { blob, buffer, peaks };
}

// Full-featured Web Audio Player Engine with live DSP graph
export class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  private startTime = 0;
  private pauseOffset = 0;
  private isPlaying = false;
  private animationFrameId: number | null = null;

  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onEnded?: () => void;
  public onStateChange?: (isPlaying: boolean) => void;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async loadAudio(source: ArrayBuffer | Blob): Promise<AudioBuffer> {
    const ctx = this.getContext();
    this.stop();

    let arrayBuffer: ArrayBuffer;
    if (source instanceof Blob) {
      arrayBuffer = await source.arrayBuffer();
    } else {
      arrayBuffer = source;
    }

    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    this.currentBuffer = decoded;
    this.pauseOffset = 0;
    return decoded;
  }

  public play(offset = this.pauseOffset, effects: AudioEffectsConfig = DEFAULT_EFFECTS) {
    if (!this.currentBuffer) return;
    const ctx = this.getContext();

    if (this.isPlaying) {
      this.stopSourceOnly();
    }

    // Build DSP graph
    const source = ctx.createBufferSource();
    source.buffer = this.currentBuffer;
    source.playbackRate.value = effects.playbackRate;
    source.detune.value = effects.pitchCents;

    // 3-Band EQ
    const bass = ctx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 120;
    bass.gain.value = effects.eqBass;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1200;
    mid.Q.value = 1.0;
    mid.gain.value = effects.eqMid;

    const treble = ctx.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 8000;
    treble.gain.value = effects.eqTreble;

    // Reverb network
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const conv = ctx.createConvolver();

    let reverbDuration = 1.2;
    let reverbDecay = 2.0;
    if (effects.reverbRoom === "booth") {
      reverbDuration = 0.4;
      reverbDecay = 3.5;
    } else if (effects.reverbRoom === "studio") {
      reverbDuration = 1.2;
      reverbDecay = 2.0;
    } else if (effects.reverbRoom === "hall") {
      reverbDuration = 2.8;
      reverbDecay = 1.2;
    }

    if (effects.reverbMix > 0 && effects.reverbRoom !== "dry") {
      conv.buffer = createImpulseResponse(ctx, reverbDuration, reverbDecay);
      wet.gain.value = effects.reverbMix;
      dry.gain.value = 1 - effects.reverbMix * 0.5;
    } else {
      wet.gain.value = 0;
      dry.gain.value = 1;
    }

    // Compressor
    const comp = ctx.createDynamicsCompressor();
    if (effects.compressorEnabled) {
      comp.threshold.value = effects.compressorThreshold;
      comp.ratio.value = effects.compressorRatio;
      comp.knee.value = 6;
      comp.attack.value = 0.005; // 5ms
      comp.release.value = 0.15; // 150ms
    } else {
      comp.threshold.value = 0;
      comp.ratio.value = 1;
    }

    // Master Gain & Analyser
    const master = ctx.createGain();
    master.gain.value = effects.volume;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    // Connect node chain:
    // source -> bass -> mid -> treble -> [dry & (convolver -> wet)] -> comp -> master -> analyser -> destination
    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);

    treble.connect(dry);
    treble.connect(conv);
    conv.connect(wet);

    dry.connect(comp);
    wet.connect(comp);

    comp.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    this.sourceNode = source;
    this.bassFilter = bass;
    this.midFilter = mid;
    this.trebleFilter = treble;
    this.dryGain = dry;
    this.wetGain = wet;
    this.convolver = conv;
    this.compressor = comp;
    this.masterGain = master;
    this.analyser = analyser;

    // Seek offset constraint
    const maxDuration = this.currentBuffer.duration;
    const clampedOffset = Math.max(0, Math.min(offset, maxDuration - 0.05));

    this.startTime = ctx.currentTime - clampedOffset / effects.playbackRate;
    this.pauseOffset = clampedOffset;
    this.isPlaying = true;

    source.start(0, clampedOffset);

    source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pauseOffset = 0;
        this.stopTracking();
        this.onStateChange?.(false);
        this.onEnded?.();
      }
    };

    this.onStateChange?.(true);
    this.startTracking(effects.playbackRate);
  }

  public pause() {
    if (!this.isPlaying) return;
    const ctx = this.getContext();
    this.pauseOffset = Math.min(
      this.getDuration(),
      (ctx.currentTime - this.startTime) * (this.sourceNode?.playbackRate.value || 1)
    );
    this.stopSourceOnly();
    this.isPlaying = false;
    this.stopTracking();
    this.onStateChange?.(false);
  }

  public stop() {
    this.pauseOffset = 0;
    this.stopSourceOnly();
    this.isPlaying = false;
    this.stopTracking();
    this.onStateChange?.(false);
    if (this.onTimeUpdate) {
      this.onTimeUpdate(0, this.getDuration());
    }
  }

  public seek(targetTime: number, effects: AudioEffectsConfig = DEFAULT_EFFECTS) {
    const duration = this.getDuration();
    const clamped = Math.max(0, Math.min(targetTime, duration));
    this.pauseOffset = clamped;
    if (this.isPlaying) {
      this.play(clamped, effects);
    } else {
      this.onTimeUpdate?.(clamped, duration);
    }
  }

  public updateLiveEffects(effects: AudioEffectsConfig) {
    if (this.sourceNode) {
      this.sourceNode.playbackRate.value = effects.playbackRate;
      this.sourceNode.detune.value = effects.pitchCents;
    }
    if (this.bassFilter) this.bassFilter.gain.value = effects.eqBass;
    if (this.midFilter) this.midFilter.gain.value = effects.eqMid;
    if (this.trebleFilter) this.trebleFilter.gain.value = effects.eqTreble;
    if (this.masterGain) this.masterGain.gain.value = effects.volume;
    if (this.dryGain && this.wetGain) {
      if (effects.reverbMix > 0 && effects.reverbRoom !== "dry") {
        this.wetGain.gain.value = effects.reverbMix;
        this.dryGain.gain.value = 1 - effects.reverbMix * 0.5;
      } else {
        this.wetGain.gain.value = 0;
        this.dryGain.gain.value = 1;
      }
    }
    if (this.compressor) {
      if (effects.compressorEnabled) {
        this.compressor.threshold.value = effects.compressorThreshold;
        this.compressor.ratio.value = effects.compressorRatio;
      } else {
        this.compressor.threshold.value = 0;
        this.compressor.ratio.value = 1;
      }
    }
  }

  public getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  public getCurrentTime(): number {
    if (!this.isPlaying) return this.pauseOffset;
    if (!this.ctx) return 0;
    const rate = this.sourceNode?.playbackRate.value || 1;
    return Math.min(this.getDuration(), (this.ctx.currentTime - this.startTime) * rate);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private stopSourceOnly() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // already stopped
      }
      this.sourceNode = null;
    }
  }

  private startTracking(rate: number) {
    this.stopTracking();
    const update = () => {
      if (this.isPlaying && this.ctx) {
        const cur = Math.min(this.getDuration(), (this.ctx.currentTime - this.startTime) * rate);
        this.onTimeUpdate?.(cur, this.getDuration());
        this.animationFrameId = requestAnimationFrame(update);
      }
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopTracking() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Renders the current buffer with all applied DSP effects to a master WAV Blob
  public async renderMasterWav(effects: AudioEffectsConfig): Promise<Blob> {
    if (!this.currentBuffer) {
      throw new Error("No audio buffer loaded to render.");
    }

    const duration = this.currentBuffer.duration / effects.playbackRate + (effects.reverbMix > 0 ? 1.5 : 0.2);
    const sampleRate = this.currentBuffer.sampleRate;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);

    const source = offlineCtx.createBufferSource();
    source.buffer = this.currentBuffer;
    source.playbackRate.value = effects.playbackRate;
    source.detune.value = effects.pitchCents;

    // EQ
    const bass = offlineCtx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 120;
    bass.gain.value = effects.eqBass;

    const mid = offlineCtx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1200;
    mid.Q.value = 1.0;
    mid.gain.value = effects.eqMid;

    const treble = offlineCtx.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 8000;
    treble.gain.value = effects.eqTreble;

    // Reverb
    const dry = offlineCtx.createGain();
    const wet = offlineCtx.createGain();
    const conv = offlineCtx.createConvolver();

    let reverbDuration = 1.2;
    let reverbDecay = 2.0;
    if (effects.reverbRoom === "booth") {
      reverbDuration = 0.4;
      reverbDecay = 3.5;
    } else if (effects.reverbRoom === "hall") {
      reverbDuration = 2.5;
      reverbDecay = 1.2;
    }

    if (effects.reverbMix > 0 && effects.reverbRoom !== "dry") {
      conv.buffer = createImpulseResponse(offlineCtx, reverbDuration, reverbDecay);
      wet.gain.value = effects.reverbMix;
      dry.gain.value = 1 - effects.reverbMix * 0.5;
    } else {
      wet.gain.value = 0;
      dry.gain.value = 1;
    }

    // Compressor
    const comp = offlineCtx.createDynamicsCompressor();
    if (effects.compressorEnabled) {
      comp.threshold.value = effects.compressorThreshold;
      comp.ratio.value = effects.compressorRatio;
      comp.knee.value = 6;
      comp.attack.value = 0.005;
      comp.release.value = 0.15;
    } else {
      comp.threshold.value = 0;
      comp.ratio.value = 1;
    }

    const master = offlineCtx.createGain();
    master.gain.value = effects.volume;

    // Connect
    source.connect(bass);
    bass.connect(mid);
    mid.connect(treble);

    treble.connect(dry);
    treble.connect(conv);
    conv.connect(wet);

    dry.connect(comp);
    wet.connect(comp);

    comp.connect(master);
    master.connect(offlineCtx.destination);

    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(renderedBuffer);
  }
}

// Global audio engine singleton
export const studioAudio = new StudioAudioEngine();
