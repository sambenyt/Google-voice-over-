import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI server-side with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-memory audio cache to prevent consuming rate limits on identical requests
const audioCache = new Map<string, { audioBase64: string; mimeType: string; voice: string; style: string }>();

// Predefined Voice Profiles supported by Gemini 3.8 TTS
const VOICES = [
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

// Endpoint: Get available voices
app.get("/api/voices", (req, res) => {
  res.json({
    voices: VOICES,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Generate Voice Over (Single Speaker or Dual Speaker Dialogue)
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voice = "Kore",
      style = "Clear, professional voiceover artist",
      modelType = "gemini-3.8-flash-lite-tts", // or gemini-3.8-flash-tts
      isDialogue = false,
      dialogueSpeakers = [],
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text prompt is required." });
    }

    // Check in-memory cache first to avoid consuming quota
    const cacheKey = `${isDialogue ? "dial" : "sing"}_${voice}_${style}_${text.trim().substring(0, 300)}`;
    if (audioCache.has(cacheKey)) {
      const cached = audioCache.get(cacheKey)!;
      return res.json({
        success: true,
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        voice: cached.voice,
        style: cached.style,
        fromCache: true,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please verify your environment secrets.",
        isFallbackEligible: true,
      });
    }

    if (isDialogue && Array.isArray(dialogueSpeakers) && dialogueSpeakers.length === 2) {
      // Dual-Speaker Screenplay / Dialogue mode
      // Model MUST be gemini-3.8-flash-tts for multiSpeakerVoiceConfig
      const speaker1 = dialogueSpeakers[0];
      const speaker2 = dialogueSpeakers[1];

      // Parse lines into dialogue parts
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const dialogueParts: Array<{ text: string; speechMetadata: { speaker: string; style: string } }> = [];

      for (const line of lines) {
        let assignedSpeaker = speaker1.name;
        let content = line;

        if (line.toLowerCase().startsWith(speaker2.name.toLowerCase() + ":")) {
          assignedSpeaker = speaker2.name;
          content = line.substring(speaker2.name.length + 1).trim();
        } else if (line.toLowerCase().startsWith(speaker1.name.toLowerCase() + ":")) {
          assignedSpeaker = speaker1.name;
          content = line.substring(speaker1.name.length + 1).trim();
        }

        const currentStyle =
          assignedSpeaker === speaker2.name ? speaker2.style || "Articulate dialogue speaker" : speaker1.style || "Expressive host speaker";

        dialogueParts.push({
          text: `${assignedSpeaker}: ${content}`,
          speechMetadata: {
            speaker: assignedSpeaker,
            style: currentStyle,
          },
        });
      }

      if (dialogueParts.length === 0) {
        dialogueParts.push({
          text: `${speaker1.name}: ${text}`,
          speechMetadata: { speaker: speaker1.name, style: speaker1.style || "Engaging host" },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: dialogueParts,
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker1.voice || "Puck" },
                  },
                },
                {
                  speaker: speaker2.name,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: speaker2.voice || "Kore" },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio payload returned from Gemini TTS model.");
      }

      // Store in cache
      audioCache.set(cacheKey, {
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        voice: `${speaker1.name} & ${speaker2.name}`,
        style: "Dual-Speaker Multi-track",
      });

      return res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        voice: `${speaker1.name} (${speaker1.voice}) & ${speaker2.name} (${speaker2.voice})`,
        style: "Dual-Speaker Multi-track",
        model: "gemini-3.8-flash-tts",
      });
    }

    // Standard Single-Speaker TTS with Model Fallback
    let selectedModel = modelType === "gemini-3.8-flash-tts" ? "gemini-3.8-flash-tts" : "gemini-3.8-flash-lite-tts";
    let response;

    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: style || "Clear, professional voiceover artist",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
    } catch (primaryErr: any) {
      const isQuota =
        primaryErr?.status === 429 ||
        primaryErr?.code === 429 ||
        primaryErr?.message?.includes("429") ||
        primaryErr?.message?.includes("RESOURCE_EXHAUSTED") ||
        primaryErr?.message?.includes("quota");

      // If lite model hit quota, try the standard flash TTS model before failing
      if (isQuota && selectedModel === "gemini-3.8-flash-lite-tts") {
        selectedModel = "gemini-3.8-flash-tts";
        response = await ai.models.generateContent({
          model: selectedModel,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: text.trim(),
                  speechMetadata: {
                    style: style || "Clear, professional voiceover artist",
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
      } else {
        throw primaryErr;
      }
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio payload returned from Gemini TTS model.");
    }

    // Store in cache
    audioCache.set(cacheKey, {
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      voice,
      style,
    });

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      voice,
      style,
      model: selectedModel,
    });
  } catch (error: any) {
    console.error("Error in /api/tts/generate:", error);

    const isQuotaExhausted =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("429") ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("quota") ||
      error?.message?.includes("Quota exceeded");

    let retrySeconds = 20;
    const match =
      error?.message?.match(/retry in ([0-9.]+)s/i) ||
      error?.message?.match(/retryDelay":"([0-9]+)s/i);
    if (match && match[1]) {
      retrySeconds = Math.ceil(parseFloat(match[1]));
    }

    if (isQuotaExhausted) {
      return res.status(429).json({
        success: false,
        isQuotaExhausted: true,
        retryDelay: retrySeconds,
        error: `Gemini TTS free tier limit reached (3 requests/min). Please retry in ~${retrySeconds}s, or continue with local Studio Synthesizer.`,
      });
    }

    return res.status(500).json({
      error: error?.message || "Failed to generate speech. Please try again or switch to preview voice.",
      details: error?.toString(),
    });
  }
});

// Endpoint: AI Script Generator
app.post("/api/script/generate", async (req, res) => {
  try {
    const {
      topic,
      category = "Commercial",
      targetDuration = 30, // seconds
      tone = "Confident, persuasive and punchy",
      targetAudience = "Tech enthusiasts and decision makers",
      brandName = "",
      includeDirectorCues = true,
    } = req.body;

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Topic or brief is required." });
    }

    const estimatedWords = Math.round((targetDuration / 60) * 140); // 140 WPM broadcast baseline

    const systemInstruction = `You are an elite, award-winning voiceover scriptwriter and broadcast director. 
Your goal is to write a ready-to-record voiceover script for professional talent or AI speech synthesis.
Format rules:
1. Deliver clean spoken copy targeted at ~${estimatedWords} words (approx. ${targetDuration} seconds read time).
2. If includeDirectorCues is true, strategically sprinkle natural performance cues:
   - Breathing points: <breath>
   - Tactical pauses: [pause: 0.5s] or [pause: 1s]
   - Vocal emphasis: [emphasis: word] or CAPITALIZATION for stress
   - Vocal bursts where natural: <laugh>, <sigh>, <gasp>
   - Conversational fillers where natural: |mhm|, |yeah|
3. Keep the flow rhythmic, compelling, and free of meta filler or disclaimer fluff.
4. Output JSON with fields:
   - title: concise title of the script
   - scriptText: the complete spoken script with cues
   - directorNotes: brief tactical direction advice for the voice talent (inflection, posture, pacing)
   - estimatedSeconds: calculated duration in seconds
   - wordCount: number of spoken words`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Create a ${category} voiceover script about: "${topic}".
Brand / Product: ${brandName || "N/A"}
Desired Tone: ${tone}
Target Audience: ${targetAudience}
Target Length: ~${targetDuration} seconds (~${estimatedWords} words).
Include Director Cues: ${includeDirectorCues ? "Yes" : "No"}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/script/generate:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate voiceover script.",
    });
  }
});

// Endpoint: AI Script Director (Enhance existing script with director cues & pacing)
app.post("/api/script/direct", async (req, res) => {
  try {
    const { scriptText, targetTone = "Natural and engaging" } = req.body;

    if (!scriptText || typeof scriptText !== "string") {
      return res.status(400).json({ error: "Script text is required." });
    }

    const systemInstruction = `You are a legendary voiceover director. Take the user's raw voiceover script and elevate it into a broadcast-ready performance master:
1. Insert vocal cues: <breath> at natural breathing boundaries, [pause: 0.5s] or [pause: 1s] at dramatic hinges, and [emphasis: word] on key operative words.
2. Provide pronunciation keys for any proper nouns, technical acronyms, or ambiguous words.
3. Suggest the optimal voice persona and mood setting.
4. Return JSON:
   - directedScript: formatted script with cues
   - pronunciationGuide: array of { word, phonetic, tip }
   - cadenceAdvice: concise advice on pacing, pitch, and mic distance
   - recommendedVoice: suggested voice among Kore, Puck, Charon, Fenrir, Zephyr`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Script to direct:\n\n${scriptText}\n\nDesired Tone: ${targetTone}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Error in /api/script/direct:", error);
    return res.status(500).json({
      error: error?.message || "Failed to direct script.",
    });
  }
});

// Endpoint: Audio Transcription (for recorded microphone takes)
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 payload is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "GEMINI_API_KEY is not configured." });
    }

    // Clean base64 string
    const cleanData = audioBase64.replace(/^data:audio\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType.split(";")[0],
              data: cleanData,
            },
          },
          {
            text: "Transcribe this recorded voiceover take verbatim, with punctuation and natural capitalization. Provide only the clean transcript.",
          },
        ],
      },
    });

    return res.json({
      success: true,
      transcript: response.text?.trim() || "",
    });
  } catch (error: any) {
    console.error("Error in /api/transcribe:", error);
    return res.status(500).json({
      error: error?.message || "Failed to transcribe audio recording.",
    });
  }
});

// Vite middleware in dev or static files in production
const isProd = process.env.NODE_ENV === "production";

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoxStudio voice over server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
