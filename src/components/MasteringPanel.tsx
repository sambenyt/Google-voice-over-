import React from "react";
import { Sliders, RotateCcw, Activity, Disc, Radio, Waves } from "lucide-react";
import { AudioEffectsConfig } from "../types";
import { DEFAULT_EFFECTS } from "../utils/audioEngine";

interface MasteringPanelProps {
  effects: AudioEffectsConfig;
  onChangeEffects: (effects: AudioEffectsConfig) => void;
}

export const MasteringPanel: React.FC<MasteringPanelProps> = ({
  effects,
  onChangeEffects,
}) => {
  const updateField = <K extends keyof AudioEffectsConfig>(
    key: K,
    val: AudioEffectsConfig[K]
  ) => {
    onChangeEffects({
      ...effects,
      [key]: val,
    });
  };

  const handleReset = () => {
    onChangeEffects(DEFAULT_EFFECTS);
  };

  return (
    <div className="space-y-6">
      {/* Header with reset */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Studio DSP Mastering & Audio FX
          </h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Rack
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Module 1: Time & Pitch Engine */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 text-amber-400" />
              Tempo & Pitch Shift
            </span>
            <span className="text-[10px] font-mono text-neutral-500">RESAMPLER</span>
          </div>

          {/* Speed slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Playback Rate</span>
              <span className="font-mono text-amber-400 font-semibold tabular-nums">
                {effects.playbackRate.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={effects.playbackRate}
              onChange={(e) => updateField("playbackRate", parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>0.5x (Slow)</span>
              <span>1.0x (Normal)</span>
              <span>2.0x (Rapid)</span>
            </div>
          </div>

          {/* Pitch slider */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Pitch Detune</span>
              <span className="font-mono text-amber-400 font-semibold tabular-nums">
                {effects.pitchCents > 0 ? `+${effects.pitchCents}` : effects.pitchCents} cents (
                {(effects.pitchCents / 100).toFixed(1)} st)
              </span>
            </div>
            <input
              type="range"
              min="-1200"
              max="1200"
              step="50"
              value={effects.pitchCents}
              onChange={(e) => updateField("pitchCents", parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
              <span>-1 Octave</span>
              <span>0 (Natural)</span>
              <span>+1 Octave</span>
            </div>
          </div>
        </div>

        {/* Module 2: 3-Band Vocal EQ */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-amber-400" />
              3-Band Vocal Equalizer
            </span>
            <span className="text-[10px] font-mono text-neutral-500">PARAMETRIC</span>
          </div>

          {/* Bass */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Low / Chest Warmth (120 Hz)</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {effects.eqBass > 0 ? `+${effects.eqBass}` : effects.eqBass} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={effects.eqBass}
              onChange={(e) => updateField("eqBass", parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Mid */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Mid / Articulation (1.2 kHz)</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {effects.eqMid > 0 ? `+${effects.eqMid}` : effects.eqMid} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={effects.eqMid}
              onChange={(e) => updateField("eqMid", parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Treble */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">High / Air & Presence (8 kHz)</span>
              <span className="font-mono text-amber-400 tabular-nums">
                {effects.eqTreble > 0 ? `+${effects.eqTreble}` : effects.eqTreble} dB
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={effects.eqTreble}
              onChange={(e) => updateField("eqTreble", parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Module 3: Space Reverb & Broadcast Compressor */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              Acoustic Reverb & Dynamics
            </span>
            <span className="text-[10px] font-mono text-neutral-500">CONVOLUTION</span>
          </div>

          {/* Reverb room selector */}
          <div className="space-y-1.5">
            <label className="block text-xs text-neutral-400">Room Acoustic Simulation</label>
            <div className="grid grid-cols-4 gap-1">
              {(["dry", "booth", "studio", "hall"] as const).map((room) => (
                <button
                  key={room}
                  type="button"
                  onClick={() => {
                    updateField("reverbRoom", room);
                    if (room === "dry") {
                      updateField("reverbMix", 0);
                    } else if (effects.reverbMix === 0) {
                      updateField("reverbMix", 0.2);
                    }
                  }}
                  className={`py-1 text-[11px] font-medium capitalize rounded-md transition-colors ${
                    effects.reverbRoom === room
                      ? "bg-amber-400 text-neutral-950 font-semibold"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          {/* Reverb mix slider */}
          {effects.reverbRoom !== "dry" && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Wet / Dry Balance</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {Math.round(effects.reverbMix * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={effects.reverbMix}
                onChange={(e) => updateField("reverbMix", parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {/* Broadcast Compressor */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-white font-medium">Broadcast Loudness Compressor</span>
              </div>
              <input
                type="checkbox"
                checked={effects.compressorEnabled}
                onChange={(e) => updateField("compressorEnabled", e.target.checked)}
                className="accent-amber-400 w-4 h-4 cursor-pointer"
              />
            </div>

            {effects.compressorEnabled && (
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-400">
                <div>
                  <span>Threshold: </span>
                  <span className="font-mono text-amber-400 tabular-nums">
                    {effects.compressorThreshold} dB
                  </span>
                </div>
                <div>
                  <span>Ratio: </span>
                  <span className="font-mono text-amber-400 tabular-nums">
                    {effects.compressorRatio}:1
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
