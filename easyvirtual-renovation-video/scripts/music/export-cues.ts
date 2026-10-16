// Exporte les repères temporels (scènes, transitions, temps forts) pour la composition musicale.
import fs from "node:fs";
import { cue, scene, SCENES, TOTAL_FRAMES } from "../../src/timeline";

const FPS = 30;
const s = (f: number) => +(f / FPS).toFixed(3);
const recap = scene("recap");
const outro = scene("outro");
const marque = scene("marque");
const out = {
  total: s(TOTAL_FRAMES),
  scenes: Object.fromEntries(SCENES.map((x) => [x.id, { start: s(x.from), end: s(x.from + x.dur) }])),
  cuts: SCENES.slice(1).map((x) => ({ id: x.id, t: s(x.from) })),
  hits: {
    brand: s(marque.from + cue(marque, "easyVirtual") - 8),
    oneScan: s(recap.from + recap.phrases[0].start),
    answers: s(recap.from + recap.phrases[1].start),
    outroLogo: s(outro.from + cue(outro, "easyVirtual.tours.") - 10),
  },
  words: SCENES.flatMap((x) => x.words.map((w) => [s(x.from + w.at + 2), s(x.from + w.endAt)])),
};
fs.writeFileSync("scripts/music/cues.json", JSON.stringify(out, null, 1));
console.log("cues.json", out.hits, out.total);
