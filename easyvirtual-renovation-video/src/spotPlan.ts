/**
 * Montage des SPOTS 30-40 s (TikTok / Instagram / LinkedIn) : plans tirés des scènes du film.
 * Chaque plan = une scène jouée entre deux frames (relatives à la scène). Le minutage interne
 * des scènes est inchangé : la voix reste synchronisée, seules les respirations sont raccourcies.
 * (fichier sans dépendance navigateur : utilisable aussi par les scripts Node)
 */
import { scene } from "./timeline";
import { FPS } from "./theme";

export type Shot = { id: string; from?: number; to?: number; cut?: "panel" | "iris" };

const LEAD = 8; // frames conservées avant le premier mot d'un plan
const TAIL = 10; // frames conservées après le dernier mot

export const resolve = (s: Shot) => {
  const sc = scene(s.id);
  const first = sc.words[0].at;
  const last = sc.words[sc.words.length - 1].endAt;
  const from = s.from ?? Math.max(0, first - LEAD);
  const to = Math.min(sc.dur, s.to ?? last + TAIL);
  return { ...s, sc, from, to, dur: to - from };
};

const constat = scene("constat");
const recap = scene("recap");

export const SPOTS: Record<string, { label: string; shots: Shot[]; music: string }> = {
  architectes: {
    label: "Architectes",
    music: "spot-architectes",
    shots: [
      // « Aujourd'hui, 6 architectes sur 10 relèvent encore à la main. »
      { id: "constat", from: 10, to: constat.phrases[1].end + 6 }, // « Télémètre » commence juste après : coupe serrée
      { id: "marque", cut: "iris" },
      { id: "visite" },
      { id: "livrables" },
      { id: "formats", to: scene("formats").phrases[1].end + 24 },
      { id: "outro", to: Math.min(scene("outro").dur, scene("outro").words[scene("outro").words.length - 1].endAt + 40), cut: "iris" },
    ],
  },
  collectivites: {
    label: "Collectivités",
    music: "spot-collectivites",
    shots: [
      { id: "hook", from: 26 }, // démarre à l'atterrissage de l'ours : pas de seconde vide
      { id: "marque", cut: "iris" },
      { id: "collectivites" },
      { id: "carnet" },
      // « Un seul scan. Toutes les réponses. »
      { id: "recap", from: recap.phrases[0].start - 4, to: recap.phrases[1].end + 18 }, // « …numérique » finit juste avant
      { id: "outro", to: Math.min(scene("outro").dur, scene("outro").words[scene("outro").words.length - 1].endAt + 40), cut: "iris" },
    ],
  },
};

export const spotPlan = (name: string) => {
  let t = 0;
  const shots = SPOTS[name].shots.map((s) => {
    const r = resolve(s);
    const at = t;
    t += r.dur;
    return { ...r, at };
  });
  return { shots, total: t };
};

/** repères pour la composition musicale (secondes) */
export const spotCues = (name: string) => {
  const { shots, total } = spotPlan(name);
  const startOf = (id: string) => shots.find((s) => s.id === id)?.at ?? 0;
  const brand = startOf("marque");
  const outro = startOf("outro");
  // temps fort final : « Vous concevez » (archi) / « Un seul scan » (collectivités)
  const finale =
    name === "architectes"
      ? (() => {
          const s = shots.find((x) => x.id === "formats")!;
          return s.at + s.sc.phrases[1].start - s.from;
        })()
      : (() => {
          const s = shots.find((x) => x.id === "recap")!;
          return s.at + s.sc.phrases[0].start - s.from;
        })();
  const sec = (f: number) => +(f / FPS).toFixed(3);
  return {
    total: sec(total),
    scenes: {
      constat: { start: 0 },
      marque: { start: sec(brand) },
      collectivites: { start: 9999 },
      outro: { start: sec(outro) },
    },
    cuts: shots.slice(1).map((s) => ({ id: s.cut === "iris" ? (s.id === "marque" ? "marque" : "outro") : s.id, t: sec(s.at) })),
    hits: { oneScan: sec(finale) },
    words: shots.flatMap((s) => s.sc.words.filter((w) => w.at >= s.from && w.endAt <= s.to).map((w) => [sec(s.at + w.at - s.from + 2), sec(s.at + w.endAt - s.from)])),
  };
};

