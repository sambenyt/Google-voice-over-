import React from "react";
import { Mic, Sliders, Sparkles, Layers, PlusCircle, Volume2 } from "lucide-react";

export type StudioTab = "editor" | "generator" | "booth" | "mastering" | "takes";

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onNewScript: () => void;
  takesCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onNewScript,
  takesCount,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/10">
            <Volume2 className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-display">
            VoxStudio
          </span>
          <span className="hidden sm:inline text-xs text-neutral-500 font-mono tracking-wider">
            AI AUDIO SUITE
          </span>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            onClick={() => onSelectTab("editor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === "editor"
                ? "bg-neutral-800 text-white shadow-sm font-semibold text-amber-400"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Studio Editor
          </button>

          <button
            onClick={() => onSelectTab("generator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === "generator"
                ? "bg-neutral-800 text-white shadow-sm font-semibold text-amber-400"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Scriptwriter
          </button>

          <button
            onClick={() => onSelectTab("booth")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === "booth"
                ? "bg-neutral-800 text-white shadow-sm font-semibold text-amber-400"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Recording Booth
          </button>

          <button
            onClick={() => onSelectTab("mastering")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === "mastering"
                ? "bg-neutral-800 text-white shadow-sm font-semibold text-amber-400"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Mastering FX
          </button>

          <button
            onClick={() => onSelectTab("takes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === "takes"
                ? "bg-neutral-800 text-white shadow-sm font-semibold text-amber-400"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/40"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Takes Reel
            {takesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-neutral-700 text-neutral-300 rounded font-mono">
                {takesCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewScript}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Script
          </button>
        </div>
      </div>
    </header>
  );
};
