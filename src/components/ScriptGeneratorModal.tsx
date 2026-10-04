import React, { useState } from "react";
import { Sparkles, X, Clock, FileText, Check } from "lucide-react";
import { GeneratedScript } from "../types";

interface ScriptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (script: string, suggestedStyle?: string) => void;
}

const CATEGORIES = [
  "Commercial / Promo",
  "Documentary",
  "Podcast Dialogue",
  "Tech Explainer",
  "Mindfulness & Meditation",
  "Cinematic Movie Trailer",
  "Video Game Narrative",
  "E-Learning Course",
];

const DURATIONS = [
  { label: "15s (Quick Hit)", seconds: 15 },
  { label: "30s (Broadcast Standard)", seconds: 30 },
  { label: "60s (Full Commercial)", seconds: 60 },
  { label: "90s (Explainer Deep Dive)", seconds: 90 },
];

export const ScriptGeneratorModal: React.FC<ScriptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyScript,
}) => {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("Commercial / Promo");
  const [targetDuration, setTargetDuration] = useState(30);
  const [tone, setTone] = useState("Confident, punchy, persuasive and cinematic");
  const [targetAudience, setTargetAudience] = useState("Modern consumers and professionals");
  const [brandName, setBrandName] = useState("");
  const [includeDirectorCues, setIncludeDirectorCues] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedScript | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/script/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          category,
          targetDuration,
          tone,
          targetAudience,
          brandName,
          includeDirectorCues,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to generate script.");
      }

      setGeneratedResult(json.data);
    } catch (err: any) {
      console.error("Script generation error:", err);
      setErrorMessage(err.message || "Failed to generate voiceover script.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    onApplyScript(generatedResult.scriptText, tone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                AI Voiceover Scriptwriter
              </h3>
              <p className="text-[11px] text-neutral-400">
                Powered by Gemini 3.8 Flash · Generates timed copy with vocal bursts & breathing marks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-200">
              {errorMessage}
            </div>
          )}

          {!generatedResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Product / Topic Brief <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Next-gen noise-canceling headphones with spatial audio"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Target Duration
                  </label>
                  <select
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white focus:border-amber-400 focus:outline-none"
                  >
                    {DURATIONS.map((dur) => (
                      <option key={dur.seconds} value={dur.seconds}>
                        {dur.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Brand / Character Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Vesper Audio"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Audio enthusiasts & remote workers"
                    className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tone & Delivery Style
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="e.g. Confident, charismatic, cinematic, smooth pacing"
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="director-cues"
                  checked={includeDirectorCues}
                  onChange={(e) => setIncludeDirectorCues(e.target.checked)}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="director-cues" className="text-xs text-neutral-300 cursor-pointer">
                  Include Director Timing Cues (<code className="text-amber-400 font-mono">&lt;breath&gt;</code>, <code className="text-amber-400 font-mono">[pause: 0.5s]</code>, vocal bursts)
                </label>
              </div>
            </div>
          ) : (
            /* Result Preview */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="text-xs font-semibold text-white">
                    {generatedResult.title || "Voiceover Copy Master"}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Clock className="w-3 h-3" />
                      ~{generatedResult.estimatedSeconds || targetDuration}s
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {generatedResult.wordCount} words
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                  {generatedResult.scriptText}
                </div>
              </div>

              {generatedResult.directorNotes && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                  <div className="text-[11px] font-semibold text-amber-400 font-mono uppercase tracking-wider">
                    DIRECTOR'S VOICE ADVICE
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {generatedResult.directorNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between gap-3 bg-neutral-950">
          {generatedResult ? (
            <>
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                ← Back to Prompt
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Load into Studio Editor
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? "Generating Script..." : "Generate Voiceover Script"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
