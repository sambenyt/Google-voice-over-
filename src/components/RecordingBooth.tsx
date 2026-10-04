import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Sparkles, RefreshCw, AudioWaveform } from "lucide-react";
import { VoiceoverTake } from "../types";
import { studioAudio, extractWaveformPeaks } from "../utils/audioEngine";

interface RecordingBoothProps {
  onAddRecordedTake: (take: VoiceoverTake) => void;
  onSendTranscriptToScript: (text: string) => void;
}

export const RecordingBooth: React.FC<RecordingBoothProps> = ({
  onAddRecordedTake,
  onSendTranscriptToScript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [takeTitle, setTakeTitle] = useState("Vocal Mic Take 1");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscription(null);
    setRecordedBlob(null);
    setRecordedUrl(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      // Start VU meter and visualizer
      const pcmData = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(pcmData);

        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
        }
        const avg = sum / pcmData.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));

        // Draw live visualizer canvas
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = width / pcmData.length;
            for (let i = 0; i < pcmData.length; i++) {
              const val = pcmData[i] / 255;
              const barHeight = val * height;
              const x = i * barWidth;
              const y = (height - barHeight) / 2;

              ctx.fillStyle = val > 0.7 ? "#f59e0b" : "#eab308";
              ctx.fillRect(x, y, barWidth - 1, barHeight);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      animationFrameRef.current = requestAnimationFrame(updateMeter);

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);

        // Decode into AudioBuffer to get peaks and load into engine
        try {
          const buffer = await studioAudio.loadAudio(fullBlob);
          const peaks = extractWaveformPeaks(buffer);

          const newTake: VoiceoverTake = {
            id: `mic-${Date.now()}`,
            title: takeTitle,
            source: "mic",
            audioUrl: url,
            audioBlob: fullBlob,
            duration: buffer.duration,
            createdAt: Date.now(),
            voiceName: "Live Studio Mic",
            styleName: "Human Voice Artist",
            scriptText: "Live microphone recorded take",
            peaks,
          };

          onAddRecordedTake(newTake);
        } catch (err) {
          console.error("Failed to decode recorded audio buffer", err);
        }

        // Stop media stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);

      setIsRecording(true);
      setRecordDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 0.1);
      }, 100);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setErrorMessage(
        "Microphone access was denied or not supported in this browser environment. Please enable microphone permissions."
      );
    }
  };

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicVolume(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingCleanup();
    }
  };

  // Convert Blob to Base64 for Gemini transcription
  const handleTranscribeTake = async () => {
    if (!recordedBlob) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64data,
            mimeType: recordedBlob.type || "audio/webm",
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to transcribe audio.");
        }

        setTranscription(data.transcript);
      };
    } catch (err: any) {
      console.error("Transcription error:", err);
      setErrorMessage(err.message || "Failed to transcribe audio.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTimer = (dur: number) => {
    const mins = Math.floor(dur / 60);
    const secs = (dur % 60).toFixed(1);
    return `${mins}:${parseFloat(secs) < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Visual Studio Card Header with backdrop */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage: "url(/src/assets/images/studio_microphone_booth_1791142171099.jpg)",
          }}
        />
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <AudioWaveform className="w-4 h-4" />
            LIVE VOCAL BOOTH
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white font-display">
            Record Professional Voiceover Takes
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed">
            Record pristine live voiceovers directly through your condenser microphone.
            Apply real-time DSP mastering, compare against AI takes, and auto-transcribe spoken takes with Gemini.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-800/80 rounded-xl text-xs text-red-200">
          {errorMessage}
        </div>
      )}

      {/* Recording Control Console */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <label className="block text-xs text-neutral-400">Take Identifier / Label</label>
            <input
              type="text"
              value={takeTitle}
              onChange={(e) => setTakeTitle(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Recording Timer */}
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isRecording ? "bg-red-500 animate-ping" : "bg-neutral-700"
              }`}
            />
            <div className="font-mono text-2xl md:text-3xl font-bold text-white tabular-nums">
              {formatTimer(recordDuration)}
            </div>
          </div>

          {/* Record / Stop Button */}
          <div>
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current text-red-400" />
                Stop & Save Take
              </button>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="bg-neutral-950 rounded-xl p-4 border border-neutral-800 flex flex-col items-center justify-center min-h-[110px] space-y-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={60}
            className="w-full max-w-lg h-[60px]"
          />

          {/* Decibel VU meter bar */}
          <div className="w-full max-w-md flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-500">VU</span>
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                style={{ width: `${micVolume}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-neutral-400 w-8 text-right">
              {micVolume}%
            </span>
          </div>
        </div>

        {/* Post-recording actions: Transcribe */}
        {recordedUrl && (
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-neutral-300">
                <span className="font-semibold text-white">Recorded Take Ready: </span>
                <span className="text-amber-400 font-mono">
                  {formatTimer(recordDuration)} duration
                </span>
                <span className="text-neutral-500 ml-2">
                  (Automatically added to Waveform player and Takes reel)
                </span>
              </div>

              <button
                type="button"
                onClick={handleTranscribeTake}
                disabled={isTranscribing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-neutral-900 border border-amber-500/30 hover:bg-amber-500/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {isTranscribing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isTranscribing ? "Transcribing Voice..." : "Transcribe to Text with AI"}
              </button>
            </div>

            {/* Display Transcription */}
            {transcription && (
              <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2">
                <div className="text-xs font-semibold text-amber-400 font-mono">
                  SPEECH TRANSCRIPTION
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed italic">
                  "{transcription}"
                </p>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onSendTranscriptToScript(transcription)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Paste into Script Master →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
