import React, { useState, useEffect, useCallback } from "react";
import { TopBar, StudioTab } from "./components/TopBar";
import { VoiceSelector } from "./components/VoiceSelector";
import { ScriptEditor } from "./components/ScriptEditor";
import { WaveformPlayer } from "./components/WaveformPlayer";
import { MasteringPanel } from "./components/MasteringPanel";
import { RecordingBooth } from "./components/RecordingBooth";
import { TakesHistory } from "./components/TakesHistory";
import { ScriptGeneratorModal } from "./components/ScriptGeneratorModal";
import { DirectorNotesDrawer } from "./components/DirectorNotesDrawer";
import {
  VoiceProfile,
  VoiceoverTake,
  AudioEffectsConfig,
  DialogueSpeaker,
  DirectedScriptResult,
} from "./types";
import {
  studioAudio,
  base64ToArrayBuffer,
  extractWaveformPeaks,
  createSyntheticVoiceAudio,
  DEFAULT_EFFECTS,
} from "./utils/audioEngine";
import { SAMPLE_SCRIPTS, SampleScript } from "./data/sampleScripts";
import { Sparkles, Wand2, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";

const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Female",
    timbre: "Articulate, balanced & natural",
    description: "Versatile studio standard voice, ideal for documentaries, narrations, tech explainer videos and audiobooks.",
    samplePrompt: "Clear, warm, and highly articulate documentary narrator",
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Male",
    timbre: "Energetic, youthful & vibrant",
    description: "Punchy, modern tone suited for energetic commercials, YouTube promos, gaming characters and tech launches.",
    samplePrompt: "High-energy, charismatic, enthusiastic commercial voice",
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Male",
    timbre: "Deep, resonant & authoritative",
    description: "Low, commanding cinematic presence perfect for movie trailers, prestige corporate manifestos, and dramatic trailers.",
    samplePrompt: "Deep baritone, cinematic movie trailer delivery with gravity",
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Male",
    timbre: "Warm, textured & conversational",
    description: "Grounded, relatable storyteller voice suitable for podcasts, heartfelt testimonials, and long-form education.",
    samplePrompt: "Warm, conversational, authentic storyteller with subtle texture",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Neutral / Soft",
    timbre: "Gentle, soothing & airy",
    description: "Calm, relaxing whisper-like delivery suited for guided sleep meditations, mindfulness apps, and ASMR content.",
    samplePrompt: "Soft, tranquil, gentle whisper-tempo meditation guide",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>("editor");
  const [voices, setVoices] = useState<VoiceProfile[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [selectedStyle, setSelectedStyle] = useState("Commercial / High-Energy");
  const [customStylePrompt, setCustomStylePrompt] = useState(
    "High-energy, charismatic, enthusiastic commercial voice"
  );

  // Dialogue mode state
  const [isDialogue, setIsDialogue] = useState(false);
  const [dialogueSpeakers, setDialogueSpeakers] = useState<DialogueSpeaker[]>([
    { name: "Alex", voice: "Puck", style: "Enthusiastic podcast host" },
    { name: "Jordan", voice: "Kore", style: "Articulate tech founder" },
  ]);

  // Script text & title
  const [scriptTitle, setScriptTitle] = useState("Aura X1 Commercial");
  const [scriptText, setScriptText] = useState(SAMPLE_SCRIPTS[0].script);

  // Studio takes & player state
  const [takes, setTakes] = useState<VoiceoverTake[]>([]);
  const [currentTake, setCurrentTake] = useState<VoiceoverTake | null>(null);

  // Effects DSP Rack
  const [effects, setEffects] = useState<AudioEffectsConfig>(DEFAULT_EFFECTS);

  // Loading & status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [quotaCooldown, setQuotaCooldown] = useState<number | null>(null);

  // Modals & Drawers
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isDirectorOpen, setIsDirectorOpen] = useState(false);
  const [directorResult, setDirectorResult] = useState<DirectedScriptResult | null>(null);
  const [isDirecting, setIsDirecting] = useState(false);

  // Quota cooldown decrement timer
  useEffect(() => {
    if (quotaCooldown === null) return;
    if (quotaCooldown <= 0) {
      setQuotaCooldown(null);
      setNotification("Gemini free tier quota has reset. Ready for next AI take!");
      return;
    }
    const timer = setInterval(() => {
      setQuotaCooldown((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [quotaCooldown]);

  // Fetch available voices from backend on mount and initialize demo take if empty
  useEffect(() => {
    fetch("/api/voices")
      .then((res) => res.json())
      .then((data) => {
        if (data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.log("Using default voice profiles", err));

    // Initialize instant playable demo take on first boot so audio player is never empty
    const demoSample = SAMPLE_SCRIPTS[0];
    const { blob, buffer, peaks } = createSyntheticVoiceAudio(demoSample.script, demoSample.recommendedVoice);
    const audioUrl = URL.createObjectURL(blob);
    const initialTake: VoiceoverTake = {
      id: "initial-demo-take",
      title: `${demoSample.title} (${demoSample.recommendedVoice})`,
      source: "tts",
      audioUrl,
      audioBlob: blob,
      duration: buffer.duration,
      createdAt: Date.now(),
      voiceName: `${demoSample.recommendedVoice} (Studio Master)`,
      styleName: demoSample.recommendedStyle,
      scriptText: demoSample.script,
      peaks,
    };
    setTakes([initialTake]);
    setCurrentTake(initialTake);
    studioAudio.loadAudio(blob).catch(() => {});
  }, []);

  // Update live effects in audio engine when changed
  useEffect(() => {
    studioAudio.updateLiveEffects(effects);
  }, [effects]);

  // Load take into the audio player
  const loadTakeIntoPlayer = useCallback(async (take: VoiceoverTake) => {
    setCurrentTake(take);
    try {
      if (take.audioBlob) {
        await studioAudio.loadAudio(take.audioBlob);
      } else if (take.audioBase64) {
        const arrayBuf = base64ToArrayBuffer(take.audioBase64);
        await studioAudio.loadAudio(arrayBuf);
      }
    } catch (err) {
      console.error("Failed to load take into audio engine", err);
    }
  }, []);

  // Notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // High-fidelity fallback synthesizer generator (used when offline or quota is cooling down)
  const generateBrowserSpeechFallback = async (
    textToSpeak: string,
    voiceName: string,
    title: string
  ) => {
    const cleanText = textToSpeak.replace(/<[^>]*>/g, "").replace(/\[[^\]]*\]/g, "");

    // 1. Synthesize audio buffer with genuine waveform peaks and WAV blob
    const { blob, buffer, peaks } = createSyntheticVoiceAudio(cleanText, voiceName);
    const audioUrl = URL.createObjectURL(blob);

    const fallbackTake: VoiceoverTake = {
      id: `preview-${Date.now()}`,
      title: `${title} (${voiceName} Synthesizer)`,
      source: "tts",
      audioUrl,
      audioBlob: blob,
      duration: buffer.duration,
      createdAt: Date.now(),
      voiceName: `${voiceName} (Studio Synthesizer)`,
      styleName: selectedStyle,
      scriptText: textToSpeak,
      peaks,
    };

    setTakes((prev) => [fallbackTake, ...prev]);
    setCurrentTake(fallbackTake);
    await studioAudio.loadAudio(blob);

    // 2. Play audible speech via browser SpeechSynthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = effects.playbackRate;

      if (voiceName === "Puck") utterance.pitch = 1.25;
      else if (voiceName === "Charon") utterance.pitch = 0.72;
      else if (voiceName === "Fenrir") utterance.pitch = 0.85;
      else if (voiceName === "Zephyr") utterance.pitch = 0.95;
      else utterance.pitch = 1.05;

      window.speechSynthesis.speak(utterance);
    }

    setNotification(`Rendered take with Studio Synthesizer (${voiceName}).`);
  };

  // Main Speech Generation Trigger
  const handleGenerateVoiceover = async () => {
    if (!scriptText.trim()) {
      setErrorMessage("Please enter or generate a script before synthesizing.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGenerationStep("Connecting to Google Gemini TTS Model...");

    try {
      const payload = {
        text: scriptText.trim(),
        voice: selectedVoice,
        style: customStylePrompt || selectedStyle,
        isDialogue,
        dialogueSpeakers: isDialogue ? dialogueSpeakers : [],
        modelType: isDialogue ? "gemini-3.8-flash-tts" : "gemini-3.8-flash-lite-tts",
      };

      setGenerationStep("Synthesizing broadcast audio (24kHz WAV)...");

      const response = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Check for rate limit / quota exhaustion
      if (response.status === 429 || data.isQuotaExhausted) {
        const delay = data.retryDelay || 20;
        setQuotaCooldown(delay);
        await generateBrowserSpeechFallback(scriptText, selectedVoice, scriptTitle);
        setErrorMessage(null);
        setNotification(
          `Gemini Free Tier limit reached (3 req/min). Generated instant take with Studio Synthesizer. Quota resets in ${delay}s.`
        );
        return;
      }

      if (!response.ok || data.error) {
        if (data.isFallbackEligible || response.status === 503) {
          await generateBrowserSpeechFallback(scriptText, selectedVoice, scriptTitle);
          setErrorMessage(
            "Note: GEMINI_API_KEY is not configured on the backend. Created an instant audio take using the Studio Synthesizer."
          );
          return;
        }
        throw new Error(data.error || "Failed to generate voiceover.");
      }

      setGenerationStep("Processing audio waveform & mastering chain...");

      const arrayBuffer = base64ToArrayBuffer(data.audioAudio || data.audioBase64);
      const audioBlob = new Blob([arrayBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Load buffer into audio engine to extract waveform peaks
      const audioBuffer = await studioAudio.loadAudio(arrayBuffer);
      const peaks = extractWaveformPeaks(audioBuffer);

      const newTake: VoiceoverTake = {
        id: `take-${Date.now()}`,
        title: `${scriptTitle || "Voiceover Take"} (${selectedVoice})`,
        source: "tts",
        audioUrl,
        audioBlob,
        audioBase64: data.audioBase64,
        duration: audioBuffer.duration,
        createdAt: Date.now(),
        voiceName: data.voice || selectedVoice,
        styleName: selectedStyle,
        scriptText,
        peaks,
      };

      setTakes((prev) => [newTake, ...prev]);
      setCurrentTake(newTake);
      setNotification(`Take successfully rendered with ${selectedVoice}!`);
    } catch (err: any) {
      console.error("Speech generation error:", err);

      const isQuota =
        err?.message?.includes("429") ||
        err?.message?.includes("quota") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isQuota) {
        setQuotaCooldown(20);
        await generateBrowserSpeechFallback(scriptText, selectedVoice, scriptTitle);
        setNotification("Gemini quota cooling down (20s). Rendered with Studio Synthesizer.");
      } else {
        await generateBrowserSpeechFallback(scriptText, selectedVoice, scriptTitle);
        setErrorMessage(
          `Note: ${err.message}. Rendered using Studio Synthesizer so your session can continue uninterrupted.`
        );
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep("");
    }
  };

  // Audition voice persona without consuming precious Gemini API quota
  const handlePreviewVoiceSample = (voiceId: string) => {
    if (isPlayingPreview === voiceId) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      studioAudio.stop();
      setIsPlayingPreview(null);
      return;
    }

    setIsPlayingPreview(voiceId);

    const voiceObj = voices.find((v) => v.id === voiceId) || DEFAULT_VOICES[0];
    const sampleText = `Hello, I'm ${voiceObj.name}. Ready to record your next voiceover project.`;

    // High quality local audition
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sampleText);

      if (voiceId === "Puck") {
        utterance.pitch = 1.25;
        utterance.rate = 1.1;
      } else if (voiceId === "Charon") {
        utterance.pitch = 0.72;
        utterance.rate = 0.88;
      } else if (voiceId === "Fenrir") {
        utterance.pitch = 0.85;
        utterance.rate = 0.95;
      } else if (voiceId === "Zephyr") {
        utterance.pitch = 0.95;
        utterance.rate = 0.82;
      } else {
        utterance.pitch = 1.05;
        utterance.rate = 1.0;
      }

      utterance.onend = () => setIsPlayingPreview(null);
      utterance.onerror = () => setIsPlayingPreview(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingPreview(null), 2500);
    }
  };

  // AI Director polish trigger
  const handleDirectScript = async () => {
    if (!scriptText.trim()) return;
    setIsDirecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/script/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText,
          targetTone: customStylePrompt || selectedStyle,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to analyze script.");
      }

      setDirectorResult(json.data);
      setIsDirectorOpen(true);
    } catch (err: any) {
      console.error("Director error:", err);
      setErrorMessage(err.message || "Failed to direct script.");
    } finally {
      setIsDirecting(false);
    }
  };

  // Export Master WAV with all applied DSP FX
  const handleExportMasterWav = async () => {
    if (!currentTake) return;
    setIsExporting(true);

    try {
      const renderedBlob = await studioAudio.renderMasterWav(effects);
      const url = URL.createObjectURL(renderedBlob);
      const a = document.createElement("a");
      a.href = url;
      const cleanTitle = (currentTake.title || "voxstudio-master").replace(/[^a-zA-Z0-9_-]/g, "_");
      a.download = `${cleanTitle}_mastered.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotification("Mastered 24kHz .WAV exported successfully!");
    } catch (err: any) {
      console.error("Export error:", err);
      setErrorMessage(err.message || "Failed to export mastered audio.");
    } finally {
      setIsExporting(false);
    }
  };

  // Load a sample script project
  const handleLoadSample = (sample: SampleScript) => {
    setScriptTitle(sample.title);
    setScriptText(sample.script);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedStyle(sample.recommendedStyle);
    setCustomStylePrompt(sample.recommendedStyle);
    if (sample.isDialogue) {
      setIsDialogue(true);
      if (sample.dialogueSpeakers) {
        setDialogueSpeakers(sample.dialogueSpeakers);
      }
    } else {
      setIsDialogue(false);
    }
    setNotification(`Loaded "${sample.title}" template.`);
  };

  // New script action
  const handleNewScript = () => {
    setScriptTitle("Untitled Voiceover");
    setScriptText("");
    setActiveTab("editor");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Contract (Wordmark, Nav links, New Script Action) */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewScript={handleNewScript}
        takesCount={takes.length}
      />

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-amber-500/50 text-amber-200 text-xs rounded-xl shadow-xl animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Global Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white text-xs font-mono ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: STUDIO EDITOR */}
        {activeTab === "editor" && (
          <div className="space-y-6">
            {/* Top Workspace Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
              <div>
                <input
                  type="text"
                  value={scriptTitle}
                  onChange={(e) => setScriptTitle(e.target.value)}
                  placeholder="Project / Script Title..."
                  className="text-lg md:text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-400 focus:outline-none transition-colors"
                />
                <p className="text-xs text-neutral-400 pt-1">
                  Professional Text-to-Speech synthesis with delivery cues, breathing marks, and multi-speaker dialogue
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-neutral-900 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  AI Scriptwriter
                </button>

                <button
                  type="button"
                  onClick={handleGenerateVoiceover}
                  disabled={isGenerating || !scriptText.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md shadow-amber-500/10 active:scale-95 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGenerating ? "Synthesizing Audio..." : "Render Voiceover Take"}
                </button>
              </div>
            </div>

            {/* Quota Cooling Down Banner */}
            {quotaCooldown !== null && quotaCooldown > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 text-xs text-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <div>
                    <span className="font-semibold text-white">Gemini Free-Tier Rate Limit: </span>
                    <span>Cooling down quota. Ready in </span>
                    <strong className="font-mono text-amber-300 font-bold">{quotaCooldown}s</strong>.
                    <span className="text-neutral-400 ml-1">
                      (Studio Synthesizer is active and takes remain fully playable and exportable)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateVoiceover()}
                  className="px-2.5 py-1 text-[11px] font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors whitespace-nowrap"
                >
                  Retry Gemini
                </button>
              </div>
            )}

            {/* Generation Status Indicator */}
            {isGenerating && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-pulse">
                <Volume2 className="w-5 h-5 text-amber-400 animate-bounce" />
                <div className="text-xs">
                  <span className="font-semibold text-white">Rendering Speech: </span>
                  <span className="text-amber-300 font-mono">{generationStep}</span>
                </div>
              </div>
            )}

            {/* Waveform Player Section (Always accessible) */}
            <WaveformPlayer
              currentTake={currentTake}
              effects={effects}
              onExportMasterWav={handleExportMasterWav}
              isExporting={isExporting}
            />

            {/* Two-Column Studio Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Script Editor (7 Cols) */}
              <div className="lg:col-span-7 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
                <ScriptEditor
                  scriptText={scriptText}
                  onChangeScript={setScriptText}
                  onDirectScript={handleDirectScript}
                  isDirecting={isDirecting}
                  onLoadSample={handleLoadSample}
                />
              </div>

              {/* Right Column: Voice Persona & Delivery Settings (5 Cols) */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
                <VoiceSelector
                  voices={voices}
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                  customStylePrompt={customStylePrompt}
                  onCustomStylePromptChange={setCustomStylePrompt}
                  isDialogue={isDialogue}
                  onToggleDialogue={setIsDialogue}
                  dialogueSpeakers={dialogueSpeakers}
                  onChangeDialogueSpeakers={setDialogueSpeakers}
                  onPreviewVoiceSample={handlePreviewVoiceSample}
                  isPlayingPreview={isPlayingPreview}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI SCRIPTWRITER & PROMPTER */}
        {activeTab === "generator" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  AI Voiceover Scriptwriter
                </h2>
                <p className="text-xs text-neutral-400">
                  Generate high-converting, broadcast-timed scripts with natural director cues and vocal pacing
                </p>
              </div>

              <button
                onClick={() => setIsScriptModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
              >
                + Open Script Generator Prompt
              </button>
            </div>

            {/* Sample Inspiration Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE_SCRIPTS.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">
                      {s.category}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                    <p className="text-xs text-neutral-300 line-clamp-3 italic leading-relaxed">
                      "{s.script}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-neutral-400">
                      Voice: <strong className="text-neutral-200">{s.recommendedVoice}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleLoadSample(s);
                        setActiveTab("editor");
                      }}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                    >
                      Use in Studio →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RECORDING BOOTH (LIVE MIC) */}
        {activeTab === "booth" && (
          <div className="space-y-6">
            <RecordingBooth
              onAddRecordedTake={(newTake) => {
                setTakes((prev) => [newTake, ...prev]);
                loadTakeIntoPlayer(newTake);
                setNotification(`Recorded "${newTake.title}" take saved to reel.`);
              }}
              onSendTranscriptToScript={(transcript) => {
                setScriptText((prev) => (prev ? prev + "\n" + transcript : transcript));
                setActiveTab("editor");
                setNotification("Pasted voice transcript into Script Master!");
              }}
            />

            {/* Waveform Player to audition take */}
            <WaveformPlayer
              currentTake={currentTake}
              effects={effects}
              onExportMasterWav={handleExportMasterWav}
              isExporting={isExporting}
            />
          </div>
        )}

        {/* TAB 4: MASTERING FX */}
        {activeTab === "mastering" && (
          <div className="space-y-6">
            <WaveformPlayer
              currentTake={currentTake}
              effects={effects}
              onExportMasterWav={handleExportMasterWav}
              isExporting={isExporting}
            />

            <MasteringPanel effects={effects} onChangeEffects={setEffects} />
          </div>
        )}

        {/* TAB 5: TAKES REEL & ARCHIVE */}
        {activeTab === "takes" && (
          <div className="space-y-6">
            <WaveformPlayer
              currentTake={currentTake}
              effects={effects}
              onExportMasterWav={handleExportMasterWav}
              isExporting={isExporting}
            />

            <TakesHistory
              takes={takes}
              activeTakeId={currentTake?.id || null}
              onSelectTake={loadTakeIntoPlayer}
              onDeleteTake={(id) => {
                setTakes((prev) => prev.filter((t) => t.id !== id));
                if (currentTake?.id === id) {
                  setCurrentTake(null);
                }
              }}
              onToggleStar={(id) => {
                setTakes((prev) =>
                  prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
                );
              }}
              onDownloadTake={(take) => {
                if (take.audioBlob) {
                  const url = URL.createObjectURL(take.audioBlob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${take.title.replace(/\s+/g, "_")}.wav`;
                  a.click();
                  URL.revokeObjectURL(url);
                } else if (take.audioBase64) {
                  const buf = base64ToArrayBuffer(take.audioBase64);
                  const blob = new Blob([buf], { type: "audio/wav" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${take.title.replace(/\s+/g, "_")}.wav`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              onNewVoiceover={() => setActiveTab("editor")}
            />
          </div>
        )}
      </main>

      {/* Script Generator Modal */}
      <ScriptGeneratorModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        onApplyScript={(newScript, newTone) => {
          setScriptText(newScript);
          if (newTone) {
            setCustomStylePrompt(newTone);
          }
          setActiveTab("editor");
          setNotification("Generated script loaded into Studio Editor!");
        }}
      />

      {/* Director Notes Drawer */}
      <DirectorNotesDrawer
        isOpen={isDirectorOpen}
        onClose={() => setIsDirectorOpen(false)}
        result={directorResult}
        onApplyDirectedScript={(enhancedScript, recVoice) => {
          setScriptText(enhancedScript);
          if (recVoice && voices.some((v) => v.id === recVoice)) {
            setSelectedVoice(recVoice);
          }
          setNotification("Applied AI Director's script & vocal cues!");
        }}
      />
    </div>
  );
}
