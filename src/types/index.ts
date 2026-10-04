export interface VoiceProfile {
  id: string;
  name: string;
  gender: string;
  timbre: string;
  description: string;
  samplePrompt: string;
}

export type VoiceStylePreset =
  | "Commercial / High-Energy"
  | "Documentary Narrator"
  | "Cinematic Movie Trailer"
  | "Warm Storyteller"
  | "Tech Explainer / Clear"
  | "Mindfulness & Sleep / Calming"
  | "Conversational Podcast"
  | "Video Game Character";

export interface AudioEffectsConfig {
  playbackRate: number; // 0.5 to 2.0
  pitchCents: number; // -1200 to +1200 cents (-12 to +12 semitones)
  eqBass: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqTreble: number; // -12 to +12 dB
  reverbMix: number; // 0 to 1 (dry to wet)
  reverbRoom: "dry" | "booth" | "studio" | "hall";
  compressorEnabled: boolean;
  compressorThreshold: number; // -40 to 0 dB
  compressorRatio: number; // 1 to 12
  volume: number; // 0 to 1.5
}

export interface VoiceoverTake {
  id: string;
  title: string;
  source: "tts" | "mic";
  audioUrl: string;
  audioBlob?: Blob;
  audioBase64?: string;
  duration: number; // in seconds
  createdAt: number;
  voiceName: string;
  styleName: string;
  scriptText: string;
  starred?: boolean;
  peaks?: number[];
}

export interface DialogueSpeaker {
  name: string;
  voice: string;
  style: string;
}

export interface GeneratedScript {
  title: string;
  scriptText: string;
  directorNotes: string;
  estimatedSeconds: number;
  wordCount: number;
}

export interface DirectedScriptResult {
  directedScript: string;
  pronunciationGuide: Array<{ word: string; phonetic: string; tip: string }>;
  cadenceAdvice: string;
  recommendedVoice: string;
}
