// Repères musicaux du film « sinistre » → scripts/music/cues-sinistre.json
import fs from "node:fs";
import { cue } from "../../src/timeline";
import { SIN } from "../../src/sinistre/timeline";

const s = (f: number) => +(f / 30).toFixed(3);
const at = (id: string) => SIN.scene(id).from;
const partage = SIN.scene("partage");
fs.writeFileSync(
  "scripts/music/cues-sinistre.json",
  JSON.stringify({
    total: s(SIN.total),
    scenes: { constat: { start: s(at("fragments")) }, marque: { start: s(at("marque")) }, collectivites: { start: 9999 }, outro: { start: s(at("outro")) } },
    cuts: SIN.scenes.slice(1).map((x) => ({ id: x.id === "marque" || x.id === "outro" ? x.id : "c", t: s(x.from) })),
    hits: { oneScan: s(partage.from + cue(partage, "même")) },
  }),
);
