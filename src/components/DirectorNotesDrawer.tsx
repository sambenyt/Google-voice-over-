import React from "react";
import { X, Sparkles, Check, Mic, Volume2 } from "lucide-react";
import { DirectedScriptResult } from "../types";

interface DirectorNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: DirectedScriptResult | null;
  onApplyDirectedScript: (script: string, voice?: string) => void;
}

export const DirectorNotesDrawer: React.FC<DirectorNotesDrawerProps> = ({
  isOpen,
  onClose,
  result,
  onApplyDirectedScript,
}) => {
  if (!isOpen || !result) return null;

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
                Director's Performance Master
              </h3>
              <p className="text-[11px] text-neutral-400">
                Pacing analysis, pronunciation guide & cue annotations
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Recommended Voice & Cadence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                <Volume2 className="w-3.5 h-3.5" />
                Recommended Voice
              </div>
              <div className="text-sm font-bold text-white">
                {result.recommendedVoice || "Kore"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                <Mic className="w-3.5 h-3.5" />
                Cadence & Mic Placement
              </div>
              <div className="text-xs text-neutral-300 leading-relaxed">
                {result.cadenceAdvice || "Maintain 4-6 inches from mic capsule, slight 15-degree off-axis."}
              </div>
            </div>
          </div>

          {/* Directed Script with Cues */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300">
              Enhanced Script with Timing & Vocal Cues
            </label>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
              {result.directedScript}
            </div>
          </div>

          {/* Pronunciation Guide Table (if any) */}
          {result.pronunciationGuide && result.pronunciationGuide.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-300">
                Pronunciation Key & Enunciation Notes
              </label>
              <div className="border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400">
                    <tr>
                      <th className="p-2.5 font-medium">Word / Term</th>
                      <th className="p-2.5 font-medium font-mono">Phonetic</th>
                      <th className="p-2.5 font-medium">Vocal Tip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/40">
                    {result.pronunciationGuide.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-800/30">
                        <td className="p-2.5 font-semibold text-white">{item.word}</td>
                        <td className="p-2.5 font-mono text-amber-300">{item.phonetic}</td>
                        <td className="p-2.5 text-neutral-400">{item.tip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between gap-3 bg-neutral-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyDirectedScript(result.directedScript, result.recommendedVoice);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Directed Script to Master
          </button>
        </div>
      </div>
    </div>
  );
};
