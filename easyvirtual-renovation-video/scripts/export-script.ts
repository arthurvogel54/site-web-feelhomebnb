// Génère SCRIPT-VOIX-OFF.md à partir de src/script.ts et de la timeline calculée.
// Usage : npx tsx scripts/export-script.ts
import fs from "node:fs";
import { SCRIPT } from "../src/script";
import { SCENES, TOTAL_FRAMES } from "../src/timeline";

const FPS = 30;
const tc = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
};
const LABEL: Record<string, string> = { hook: "Accroche", marque: "Révélation de la marque", recap: "Récapitulatif", outro: "Signature" };
const NOTES: Record<string, string> = {
  hook: "Posé, chaleureux. Laisser respirer après « histoire ». Question sincère, pas dramatique.",
  constat: "Constat factuel, léger sourire dans la voix sur « croquis… ». Appuyer « retour sur chantier ».",
  marque: "Montée d'énergie : c'est la révélation de la marque. « numérique » bien détaché.",
  scan: "Ton pédagogique et assuré. Petit temps avant « Environ une heure. » (effet de chute).",
  visite: "Complice. « Mesurez-la depuis votre bureau » comme une évidence. « Plus aucun retour sur chantier. » ferme.",
  livrables: "Énumération rythmée, une respiration courte entre chaque livrable.",
  formats: "Sigles épelés lettre à lettre (D-W-G, P-D-F, I-F-C, R-V-T). Fin en deux temps : « Vous ne remodélisez plus. » … « Vous concevez. »",
  collectivites: "Changement d'interlocuteur : ton plus institutionnel, rassurant. Prononcer « GEM » comme vous le prononcez en interne.",
  carnet: "Fluide, concret. Sourire sur « l'avant-après est documenté ».",
  recap: "Récapitulatif rapide puis signature lente : « Un seul scan. » (temps) « Toutes les réponses. »",
  outro: "Signature de marque, souriante, sans emphase excessive.",
};

let md = `# easyVirtual.tours — Rénovation · Script voix off

Durée totale (débit estimé) : **${tc(TOTAL_FRAMES / FPS)}** · 1920×1080 · 30 i/s

**Légende** — les passages en **gras** sont affichés à l'écran, mot à mot, au moment exact où ils sont prononcés.
Les mots <u>soulignés</u> sont mis en valeur en orange.

> Le minutage ci-dessous est celui de la vidéo actuelle (débit estimé ≈ 5 syllabes/s, voix posée).
> Une fois la voix enregistrée, la vidéo se recale automatiquement dessus (voir README).

---
`;
SCENES.forEach((s, i) => {
  const seg = SCRIPT[i];
  const start = (s.from + s.words[0].at + 2) / FPS;
  const end = (s.from + s.words[s.words.length - 1].endAt) / FPS;
  // phrases affichées en gras, mots orange soulignés
  const parts: string[] = [];
  let k = 0;
  while (k < s.words.length) {
    const w = s.words[k];
    if (w.phrase === null) {
      parts.push(w.display);
      k++;
      continue;
    }
    const group: string[] = [];
    while (k < s.words.length && s.words[k].phrase === w.phrase) {
      const x = s.words[k];
      group.push(x.accent ? `<u>${x.display}</u>` : x.display);
      k++;
    }
    parts.push(`**${group.join(" ")}**`);
  }
  const text = parts.join(" ");
  const onScreen = s.phrases.map((p) => p.words.map((x) => x.text).join(" ")).join("  /  ");
  md += `
## ${String(i + 1).padStart(2, "0")} · ${seg.section || LABEL[seg.id]} — \`${tc(s.from / FPS)}\`

**Voix :** \`${tc(start)} → ${tc(end)}\`

> ${text}

${onScreen ? `_À l'écran :_ ${onScreen}\n` : "_À l'écran :_ (listes et étiquettes animées, synchronisées sur les mots)\n"}
_Intention :_ ${NOTES[s.id] ?? ""}
`;
});
fs.writeFileSync("SCRIPT-VOIX-OFF.md", md);
console.log("SCRIPT-VOIX-OFF.md écrit");
