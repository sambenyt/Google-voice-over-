import React, { useRef } from "react";
import { Sparkles, Clock, FileText, CornerDownRight, RotateCcw, Lightbulb } from "lucide-react";
import { SAMPLE_SCRIPTS, SampleScript } from "../data/sampleScripts";

interface ScriptEditorProps {
  scriptText: string;
  onChangeScript: (text: string) => void;
  onDirectScript: () => void;
  isDirecting: boolean;
  onLoadSample: (sample: SampleScript) => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scriptText,
  onChangeScript,
  onDirectScript,
  isDirecting,
  onLoadSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate telemetry
  const trimmed = scriptText.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const charCount = scriptText.length;
  // Estimated read time at broadcast standard 140 WPM
  const estimatedSeconds = Math.round((wordCount / 140) * 60);
  const minutes = Math.floor(estimatedSeconds / 60);
  const seconds = estimatedSeconds % 60;
  const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const insertCue = (cue: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChangeScript(scriptText + " " + cue);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = scriptText.substring(0, start);
    const after = scriptText.substring(end);
    const updated = before + (before.endsWith(" ") || before.length === 0 ? "" : " ") + cue + " " + after;
    onChangeScript(updated);

    setTimeout(() => {
      el.focus();
      const nextPos = start + cue.length + 2;
      el.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  return (
    <div className="space-y-3">
      {/* Top Header & Sample Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">Voiceover Script Master</span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="font-mono text-[11px] text-neutral-400">
            {wordCount} words
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="font-mono text-[11px] text-neutral-400">
            {charCount} characters
          </span>
          <span aria-hidden="true" className="text-neutral-600">·</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400">
            <Clock className="w-3 h-3" />
            ~{formattedDuration} EST
          </span>
        </div>

        {/* Sample presets loader */}
        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              const found = SAMPLE_SCRIPTS.find((s) => s.id === e.target.value);
              if (found) onLoadSample(found);
            }}
            defaultValue=""
            className="text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-300 focus:outline-none focus:border-amber-400"
          >
            <option value="" disabled>Load Sample Script...</option>
            {SAMPLE_SCRIPTS.map((s) => (
              <option key={s.id} value={s.id}>
                [{s.category}] {s.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onChangeScript("")}
            title="Clear script"
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cue Insertion Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800/80">
        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider mr-1">
          Insert Cues:
        </span>
        <button
          type="button"
          onClick={() => insertCue("[pause: 0.5s]")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded font-mono transition-colors"
        >
          [pause: 0.5s]
        </button>
        <button
          type="button"
          onClick={() => insertCue("[pause: 1.0s]")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded font-mono transition-colors"
        >
          [pause: 1s]
        </button>
        <button
          type="button"
          onClick={() => insertCue("<breath>")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-sky-300 rounded font-mono transition-colors"
        >
          &lt;breath&gt;
        </button>
        <button
          type="button"
          onClick={() => insertCue("<laugh>")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-emerald-300 rounded font-mono transition-colors"
        >
          &lt;laugh&gt;
        </button>
        <button
          type="button"
          onClick={() => insertCue("<sigh>")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-purple-300 rounded font-mono transition-colors"
        >
          &lt;sigh&gt;
        </button>
        <button
          type="button"
          onClick={() => insertCue("|mhm|")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono transition-colors"
        >
          |mhm|
        </button>
        <button
          type="button"
          onClick={() => insertCue("|yeah|")}
          className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-mono transition-colors"
        >
          |yeah|
        </button>
      </div>

      {/* Main Script Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={scriptText}
          onChange={(e) => onChangeScript(e.target.value)}
          rows={7}
          placeholder="Write or paste your voiceover copy here... Use cues like <breath>, [pause: 0.5s], or tag dialogue with Speaker: for multi-actor conversations."
          className="w-full p-4 text-sm font-sans bg-neutral-900/90 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 focus:outline-none transition-colors leading-relaxed tracking-wide resize-y min-h-[160px]"
        />
      </div>

      {/* Action Footer: AI Director Button & Advice */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Tip: Add pauses before key reveals to build dramatic anticipation.</span>
        </div>

        <button
          type="button"
          onClick={onDirectScript}
          disabled={isDirecting || !scriptText.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-neutral-900 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isDirecting ? "Analyzing & Directing..." : "AI Director Polish"}
        </button>
      </div>
    </div>
  );
};
