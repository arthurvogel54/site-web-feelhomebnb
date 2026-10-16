/**
 * Recale la vidéo sur la voix off réelle, au mot près.
 *
 *   npx remotion add @remotion/install-whisper-cpp   (une seule fois)
 *   node scripts/sync-voiceover.mjs public/voiceover.wav
 *
 * 1. convertit l'audio en WAV 16 kHz (ffmpeg requis)
 * 2. transcrit en français avec Whisper (horodatage par mot)
 * 3. écrit src/vo-timings.ts → la timeline, les scènes et l'affichage mot à mot
 *    se recalent automatiquement, et l'audio est ajouté à la composition.
 *
 * Le fichier audio doit se trouver dans /public.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { downloadWhisperModel, installWhisperCpp, toCaptions, transcribe } from "@remotion/install-whisper-cpp";

const input = process.argv[2];
if (!input || !fs.existsSync(input)) {
  console.error("Usage : node scripts/sync-voiceover.mjs public/voiceover.wav");
  process.exit(1);
}
const rel = path.relative("public", input);
if (rel.startsWith("..")) {
  console.error("Le fichier audio doit être placé dans le dossier public/");
  process.exit(1);
}

const whisperPath = path.resolve(".whisper");
const model = "medium";
await installWhisperCpp({ to: whisperPath, version: "1.5.5" });
await downloadWhisperModel({ model, folder: whisperPath });

const wav16 = path.resolve(".whisper/vo-16k.wav");
execSync(`ffmpeg -y -i "${input}" -ar 16000 -ac 1 "${wav16}"`, { stdio: "inherit" });

const out = await transcribe({ inputPath: wav16, whisperPath, whisperCppVersion: "1.5.5", model, language: "fr", tokenLevelTimestamps: true });
const { captions } = toCaptions({ whisperCppOutput: out });
// Whisper découpe en jetons : un jeton sans espace initial prolonge le mot précédent
const words = [];
for (const c of captions) {
  if (!c.text.trim()) continue;
  if (words.length === 0 || /^\s/.test(c.text)) {
    words.push({ text: c.text.trim(), startMs: Math.round(c.startMs), endMs: Math.round(c.endMs) });
  } else {
    const last = words[words.length - 1];
    last.text += c.text.trim();
    last.endMs = Math.round(c.endMs);
  }
}

const file = `/**
 * Généré par scripts/sync-voiceover.mjs — ${new Date().toISOString()}
 * Source : ${rel}
 */
export type RealWord = { text: string; startMs: number; endMs: number };
export type RealSegment = { id: string; start: number; end: number };

export const VO: {
  audioFile: string | null;
  words: RealWord[] | null;
  segments: RealSegment[] | null;
} = {
  audioFile: ${JSON.stringify(rel.split(path.sep).join("/"))},
  words: ${JSON.stringify(words, null, 2)},
  segments: null,
};
`;
fs.writeFileSync("src/vo-timings.ts", file);
console.log(`✓ ${words.length} mots synchronisés → src/vo-timings.ts`);
console.log("Vérifiez dans le Studio (npm run dev) puis rendez : npm run render");
