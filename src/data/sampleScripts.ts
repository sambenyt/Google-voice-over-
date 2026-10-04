export interface SampleScript {
  id: string;
  category: string;
  title: string;
  recommendedVoice: string;
  recommendedStyle: string;
  script: string;
  notes: string;
  isDialogue?: boolean;
  dialogueSpeakers?: Array<{ name: string; voice: string; style: string }>;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: "commercial-tech",
    category: "Commercial",
    title: "Aura X1 - The Next Generation Smartphone",
    recommendedVoice: "Puck",
    recommendedStyle: "High-energy, charismatic, enthusiastic commercial voice",
    notes: "Punchy delivery. Punch the brand name with crisp consonants. Smile through the line.",
    script: `What if your phone didn't just capture moments, but amplified them? <breath> 
Introducing Aura X-One. [pause: 0.5s]
Engineered with neural optics and a titanium chassis that feels weightless in your palm.
Blazing fast. [pause: 0.3s] Uncompromisingly secure.
Aura X-One. [pause: 0.5s] Experience the future today.`,
  },
  {
    id: "documentary-ocean",
    category: "Documentary",
    title: "Depths of the Midnight Sea",
    recommendedVoice: "Charon",
    recommendedStyle: "Deep baritone, cinematic documentary narrator with awe and gravity",
    notes: "Slow, measured cadence (~115 WPM). Let the silence between sentences breathe.",
    script: `Seven miles beneath the ocean's crest, sunlight is merely an ancient memory. <breath> 
In the Mariana Trench, the pressure is staggering. [pause: 0.8s]
Crushing enough to shatter steel.
Yet here, in absolute midnight... <breath> life doesn't merely endure. [pause: 0.6s]
It radiates with its own quiet constellation of bioluminescent wonder.`,
  },
  {
    id: "meditation-sleep",
    category: "Mindfulness",
    title: "Evening Forest Sanctuary",
    recommendedVoice: "Zephyr",
    recommendedStyle: "Soft, tranquil, gentle whisper-tempo meditation guide",
    notes: "Subtle vocal texture, soft vocal cords, slow paced breaths between thoughts.",
    script: `Welcome to tonight's unwind. <breath>
Gently close your eyes, and allow the tension in your shoulders to release. [pause: 0.8s]
Imagine a quiet pine forest after a gentle summer rain. <breath>
Inhale stillness... [pause: 1.2s] and exhale everything that no longer serves you. [pause: 1.0s]
You are safe here. You can rest now.`,
  },
  {
    id: "dialogue-podcast",
    category: "Podcast Dialogue",
    title: "The Founders Room - Ep. 42",
    recommendedVoice: "Puck",
    recommendedStyle: "Conversational podcast banter",
    isDialogue: true,
    dialogueSpeakers: [
      { name: "Alex", voice: "Puck", style: "Enthusiastic podcast host" },
      { name: "Jordan", voice: "Kore", style: "Thoughtful articulate tech founder" },
    ],
    notes: "Dual-speaker dialogue. Natural overlapping reactions and vocal bursts.",
    script: `Alex: Welcome back to The Founders Room! <breath> Today we are joined by Jordan Vance.
Jordan: Thanks for having me, Alex. |yeah| It is great to be in the studio.
Alex: So, rumor has it you scrapped your entire v1 roadmap three days before launch? <laugh>
Jordan: We did! <breath> Everyone thought we were out of our minds, but it saved the company.
Alex: That takes serious grit. |mhm| Tell us what made you pull the trigger.`,
  },
  {
    id: "game-trailer",
    category: "Game Trailer",
    title: "Chronicles of Aethelgard: The Broken Throne",
    recommendedVoice: "Fenrir",
    recommendedStyle: "Epic cinematic movie trailer with raw grit and passion",
    notes: "Dramatic theatrical tension. Emphasize prophecy terms and rise in urgency.",
    script: `When the eclipse swallowed the three suns, the kings fled their marble halls. <breath>
Now, the shadow encroaches upon the valley of embers. [pause: 0.7s]
Swords will shatter. Oaths will be tested. <breath>
Will you claim the broken throne... [pause: 0.6s] or drown in the ash of the forgotten?`,
  },
  {
    id: "elearning-cloud",
    category: "E-Learning",
    title: "Understanding Microservices & Event Streams",
    recommendedVoice: "Kore",
    recommendedStyle: "Clear, warm, articulate instructor with approachable clarity",
    notes: "Even pedagogical cadence. Crisp articulation for technical terms.",
    script: `In traditional monolithic architectures, every component shares a single database and runtime. <breath>
Event-driven microservices change this paradigm. [pause: 0.5s]
Instead of synchronous blocking requests, services publish discrete messages to an event bus.
This guarantees fault tolerance, independent scaling, and zero single points of failure.`,
  },
];
