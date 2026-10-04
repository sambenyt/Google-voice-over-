import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Square, RotateCcw, Volume2, VolumeX, Download, Repeat, Sparkles } from "lucide-react";
import { studioAudio } from "../utils/audioEngine";
import { AudioEffectsConfig, VoiceoverTake } from "../types";

interface WaveformPlayerProps {
  currentTake: VoiceoverTake | null;
  effects: AudioEffectsConfig;
  onExportMasterWav: () => void;
  isExporting: boolean;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  currentTake,
  effects,
  onExportMasterWav,
  isExporting,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Sync state with audio engine
  useEffect(() => {
    studioAudio.onStateChange = (playing) => {
      setIsPlaying(playing);
    };

    studioAudio.onTimeUpdate = (cur, dur) => {
      setCurrentTime(cur);
      if (dur > 0) setDuration(dur);
    };

    studioAudio.onEnded = () => {
      if (isLooping) {
        studioAudio.play(0, effects);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    return () => {
      studioAudio.onStateChange = undefined;
      studioAudio.onTimeUpdate = undefined;
      studioAudio.onEnded = undefined;
    };
  }, [isLooping, effects]);

  // When currentTake changes, reset playhead
  useEffect(() => {
    if (currentTake) {
      setDuration(currentTake.duration || studioAudio.getDuration());
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [currentTake]);

  // Keyboard shortcut: Spacebar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, effects]);

  const handleTogglePlay = () => {
    if (!currentTake) return;
    if (isPlaying) {
      studioAudio.pause();
    } else {
      studioAudio.play(currentTime, effects);
    }
  };

  const handleStop = () => {
    studioAudio.stop();
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || duration <= 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    setCurrentTime(target);
    studioAudio.seek(target, effects);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(ratio);
  };

  // Draw Waveform Canvas
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Fallback peaks or take peaks
    const peaks = currentTake?.peaks && currentTake.peaks.length > 0
      ? currentTake.peaks
      : Array.from({ length: 120 }, (_, i) => 0.2 + 0.5 * Math.abs(Math.sin(i * 0.15)));

    const numBars = peaks.length;
    const barWidth = width / numBars;
    const progress = duration > 0 ? currentTime / duration : 0;

    for (let i = 0; i < numBars; i++) {
      const peak = peaks[i];
      const barHeight = Math.max(4, peak * (height - 16));
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      const isPlayed = i / numBars <= progress;

      if (isPlayed) {
        ctx.fillStyle = "#f59e0b"; // amber-500
      } else {
        ctx.fillStyle = "#262626"; // neutral-800
      }

      // Draw rounded bar
      ctx.beginPath();
      const r = Math.min(barWidth * 0.4, 2);
      ctx.roundRect(x + 1, y, Math.max(1, barWidth - 2), barHeight, r);
      ctx.fill();
    }

    // Playhead line
    if (duration > 0) {
      const playheadX = progress * width;
      ctx.fillStyle = "#fbbf24"; // amber-400
      ctx.fillRect(playheadX - 1, 0, 2, height);

      // Playhead beacon head
      ctx.beginPath();
      ctx.arc(playheadX, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hover indicator
    if (isHovering && duration > 0) {
      const hoverX = hoverPosition * width;
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(hoverX - 0.5, 0, 1, height);
    }
  }, [currentTake, currentTime, duration, isHovering, hoverPosition]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Format time MM:SS.S
  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = (timeInSec % 60).toFixed(1);
    const paddedSecs = parseFloat(secs) < 10 ? `0${secs}` : secs;
    return `${mins}:${paddedSecs}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4">
      {/* Waveform Header: Title & Info */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide truncate max-w-[260px] md:max-w-md">
              {currentTake?.title || "No Take Loaded"}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span>{currentTake?.voiceName || "Kore (Default)"}</span>
              <span aria-hidden="true">·</span>
              <span>{currentTake?.styleName || "Natural Delivery"}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-amber-400/90">24kHz WAV</span>
            </div>
          </div>
        </div>

        <button
          onClick={onExportMasterWav}
          disabled={!currentTake || isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? "Rendering FX..." : "Export Master .WAV"}
        </button>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative group cursor-pointer bg-neutral-950 rounded-xl p-3 border border-neutral-800/80">
        <canvas
          ref={canvasRef}
          width={800}
          height={90}
          onClick={handleSeek}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          className="w-full h-[90px] block"
        />

        {/* Hover Time Tooltip */}
        {isHovering && duration > 0 && (
          <div
            className="absolute top-1 -translate-x-1/2 bg-neutral-800 text-[10px] font-mono text-amber-300 px-1.5 py-0.5 rounded shadow pointer-events-none"
            style={{ left: `${hoverPosition * 100}%` }}
          >
            {formatTime(hoverPosition * duration)}
          </div>
        )}
      </div>

      {/* Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            disabled={!currentTake}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isPlaying
                ? "bg-amber-500 text-neutral-950"
                : "bg-white text-neutral-950 hover:bg-neutral-200"
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={!currentTake}
            title="Stop & Reset to 00:00"
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-40"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            title="Loop Take"
            className={`p-2 rounded-lg transition-colors ${
              isLooping
                ? "text-amber-400 bg-amber-500/10"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Time Readout */}
          <div className="flex items-center gap-1 font-mono text-xs pl-2">
            <span className="text-white font-semibold tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Audio Output */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isMuted) {
                setIsMuted(false);
                studioAudio.updateLiveEffects({ ...effects, volume });
              } else {
                setIsMuted(true);
                studioAudio.updateLiveEffects({ ...effects, volume: 0 });
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              setIsMuted(false);
              studioAudio.updateLiveEffects({ ...effects, volume: val });
            }}
            className="w-20 md:w-24 accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-[10px] font-mono text-neutral-400 w-8 tabular-nums">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
