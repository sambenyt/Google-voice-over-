import React from "react";
import { VoiceoverTake } from "../types";
import { Play, Star, Trash2, Download, Mic, Sparkles, Layers } from "lucide-react";

interface TakesHistoryProps {
  takes: VoiceoverTake[];
  activeTakeId: string | null;
  onSelectTake: (take: VoiceoverTake) => void;
  onDeleteTake: (takeId: string) => void;
  onToggleStar: (takeId: string) => void;
  onDownloadTake: (take: VoiceoverTake) => void;
  onNewVoiceover: () => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  activeTakeId,
  onSelectTake,
  onDeleteTake,
  onToggleStar,
  onDownloadTake,
  onNewVoiceover,
}) => {
  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = (timeInSec % 60).toFixed(1);
    const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${mins}:${paddedSecs}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">
            Takes Reel & Production Archive
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            ({takes.length} {takes.length === 1 ? "take" : "takes"})
          </span>
        </div>

        <button
          onClick={onNewVoiceover}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300"
        >
          + Record / Generate Take
        </button>
      </div>

      {takes.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-neutral-800 bg-neutral-900/30 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No Voiceover Takes Yet</h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Generate an AI voiceover from your script or record live microphone takes in the vocal booth.
          </p>
          <button
            onClick={onNewVoiceover}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
          >
            Generate First Take
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {takes.map((take) => {
            const isActive = activeTakeId === take.id;
            return (
              <div
                key={take.id}
                onClick={() => onSelectTake(take)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? "bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30"
                    : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                {/* Left zone: Play affordance & title */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-amber-400 text-neutral-950"
                        : "bg-neutral-800 text-neutral-300 group-hover:bg-neutral-700"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tracking-wide">
                        {take.title}
                      </span>
                      {take.source === "mic" ? (
                        <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono">
                          <Mic className="w-2.5 h-2.5" /> MIC
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                          <Sparkles className="w-2.5 h-2.5" /> AI TTS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-0.5">
                      <span>{take.voiceName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{take.styleName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-neutral-400">
                        {formatDate(take.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right zone: Duration & Action icons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-mono text-xs text-amber-400 tabular-nums">
                    {formatTime(take.duration)}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title={take.starred ? "Unstar" : "Star take"}
                      onClick={() => onToggleStar(take.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        take.starred
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${take.starred ? "fill-current" : ""}`} />
                    </button>

                    <button
                      type="button"
                      title="Download take (.wav)"
                      onClick={() => onDownloadTake(take)}
                      className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="Delete take"
                      onClick={() => onDeleteTake(take.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
