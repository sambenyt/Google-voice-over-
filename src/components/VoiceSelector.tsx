import React from "react";
import { VoiceProfile, DialogueSpeaker } from "../types";
import { Volume2, Users, Check, Play, Square } from "lucide-react";

interface VoiceSelectorProps {
  voices: VoiceProfile[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  selectedStyle: string;
  onSelectStyle: (style: string) => void;
  customStylePrompt: string;
  onCustomStylePromptChange: (val: string) => void;
  isDialogue: boolean;
  onToggleDialogue: (enabled: boolean) => void;
  dialogueSpeakers: DialogueSpeaker[];
  onChangeDialogueSpeakers: (speakers: DialogueSpeaker[]) => void;
  onPreviewVoiceSample: (voiceId: string) => void;
  isPlayingPreview: string | null;
}

const STYLE_PRESETS = [
  { id: "commercial", label: "Commercial / High-Energy", prompt: "High-energy, charismatic, enthusiastic commercial voice" },
  { id: "documentary", label: "Documentary Narrator", prompt: "Deep, measured, cinematic documentary narrator with awe" },
  { id: "trailer", label: "Cinematic Movie Trailer", prompt: "Low baritone, theatrical movie trailer delivery with dramatic pauses" },
  { id: "storyteller", label: "Warm Storyteller", prompt: "Warm, authentic, grounded storyteller with subtle emotional nuance" },
  { id: "tech", label: "Tech Explainer / Clean", prompt: "Clear, crisp, modern instructor with approachable authority" },
  { id: "meditation", label: "Mindfulness & Sleep", prompt: "Soft, tranquil, gentle whisper-tempo meditation guide" },
  { id: "podcast", label: "Conversational Podcast", prompt: "Relaxed, spontaneous, engaging podcast host" },
  { id: "game", label: "Video Game Hero / Villain", prompt: "Gritty, intense, dramatic character delivery" },
];

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  selectedStyle,
  onSelectStyle,
  customStylePrompt,
  onCustomStylePromptChange,
  isDialogue,
  onToggleDialogue,
  dialogueSpeakers,
  onChangeDialogueSpeakers,
  onPreviewVoiceSample,
  isPlayingPreview,
}) => {
  return (
    <div className="space-y-5">
      {/* Dialogue Mode Switcher */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-amber-400" />
          <div>
            <h4 className="text-xs font-semibold text-white">Dual-Speaker Dialogue Mode</h4>
            <p className="text-[11px] text-neutral-400">
              Generate 2-actor conversations, podcasts, and screenplays with speaker tags
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggleDialogue(!isDialogue)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isDialogue ? "bg-amber-400" : "bg-neutral-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
              isDialogue ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* When Dialogue Mode is active */}
      {isDialogue ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-900/40 border border-amber-500/20">
          {dialogueSpeakers.map((spk, idx) => (
            <div key={idx} className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400 font-mono">
                  SPEAKER {idx + 1}
                </span>
                <span className="text-[11px] text-neutral-500">
                  Tag lines with <code className="text-neutral-300 font-mono">{spk.name}:</code>
                </span>
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Speaker Tag / Name</label>
                <input
                  type="text"
                  value={spk.name}
                  onChange={(e) => {
                    const next = [...dialogueSpeakers];
                    next[idx] = { ...next[idx], name: e.target.value };
                    onChangeDialogueSpeakers(next);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-750 rounded text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Assigned Voice</label>
                <select
                  value={spk.voice}
                  onChange={(e) => {
                    const next = [...dialogueSpeakers];
                    next[idx] = { ...next[idx], voice: e.target.value };
                    onChangeDialogueSpeakers(next);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-900 border border-neutral-750 rounded text-white focus:border-amber-400 focus:outline-none"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.gender} - {v.timbre})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single Speaker Voice Grid */
        <div className="space-y-2.5">
          <label className="block text-xs font-medium text-neutral-400">
            Voice Persona ({voices.length} Studio Models)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {voices.map((v) => {
              const isSelected = selectedVoice === v.id;
              const isAuditioning = isPlayingPreview === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/80 shadow-sm shadow-amber-500/5 ring-1 ring-amber-500/50"
                      : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white tracking-wide">
                          {v.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {v.gender}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-300/80 font-medium">
                        {v.timbre}
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Audition voice"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewVoiceSample(v.id);
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        isAuditioning
                          ? "bg-amber-400 text-neutral-950"
                          : "bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700"
                      }`}
                    >
                      {isAuditioning ? (
                        <Square className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {v.description}
                  </p>

                  {isSelected && (
                    <div className="absolute top-2 right-9 text-amber-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Style & Emotion Delivery Presets */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-neutral-400">
          Delivery Style & Tone Preset
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((st) => {
            const isActive = selectedStyle === st.label;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  onSelectStyle(st.label);
                  onCustomStylePromptChange(st.prompt);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-amber-400 text-neutral-950 font-semibold shadow-sm"
                    : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Director Tone Specification */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Director's Delivery Instruction</span>
          <span className="text-[10px] text-neutral-500 font-mono">Passed to Gemini Speech Engine</span>
        </div>
        <input
          type="text"
          value={customStylePrompt}
          onChange={(e) => onCustomStylePromptChange(e.target.value)}
          placeholder="e.g. Clear, warm, measured documentary narrator with awe and gentle cadence"
          className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none transition-colors"
        />
      </div>
    </div>
  );
};
