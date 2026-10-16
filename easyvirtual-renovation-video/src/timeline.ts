import { SCRIPT, SegmentDef } from "./script";
import { FPS } from "./theme";
import { RealWord, VO } from "./vo-timings";

export type Word = {
  display: string;
  spoken: string;
  accent: boolean;
  phrase: number | null; // index de phrase clé dans le segment
  start: number; // secondes, temps absolu de la vidéo
  end: number;
};

export type PhraseWord = { text: string; accent: boolean; at: number }; // at = frame relative à la scène
export type Phrase = { words: PhraseWord[]; start: number; end: number };

export type Scene = {
  id: string;
  section: string;
  index: number;
  from: number; // frame absolue
  dur: number; // frames
  words: (Word & { at: number; endAt: number })[]; // at = frame relative
  phrases: Phrase[];
};

// ---------- 1. Parsing du script ----------
const parse = (seg: SegmentDef) => {
  const words: Omit<Word, "start" | "end">[] = [];
  let phrase: number | null = null;
  let phraseCount = 0;
  // remplace {a|b} par un token unique pour ne pas casser sur les espaces
  const alts: [string, string][] = [];
  const text = seg.text.replace(/\{([^|}]*)\|([^}]*)\}/g, (_m, a, b) => {
    alts.push([a, b]);
    return `§${alts.length - 1}§`;
  });
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let t = raw;
    let opens = false;
    let closes = false;
    if (t.startsWith("[")) {
      opens = true;
      t = t.slice(1);
    }
    if (t.endsWith("]")) {
      closes = true;
      t = t.slice(0, -1);
    } else if (/\][.,!?…:]$/.test(t)) {
      closes = true;
      t = t.replace("]", "");
    }
    if (opens) phrase = phraseCount++;
    let accent = false;
    if (t.includes("*")) {
      accent = true;
      t = t.replace(/\*/g, "");
    }
    let display = t;
    let spoken = t;
    const m = t.match(/§(\d+)§/);
    if (m) {
      const [a, b] = alts[Number(m[1])];
      display = t.replace(m[0], a);
      spoken = t.replace(m[0], b);
    }
    words.push({ display, spoken, accent, phrase });
    if (closes) phrase = null;
  }
  return words;
};

// ---------- 2. Estimation du débit ----------
const SPECIAL: Record<string, number> = { lidar: 2, bim: 1, gem: 1, revit: 2, archicad: 3, autocad: 3, sketchup: 2 };
const syllables = (w: string) => {
  const clean = w.toLowerCase().replace(/[^a-zàâäéèêëîïôöûùüÿœæ'-]/g, "");
  if (SPECIAL[clean] !== undefined) return SPECIAL[clean];
  return w
    .toLowerCase()
    .split(/[\s'-]+/)
    .filter(Boolean)
    .reduce((acc, part) => {
      const p = part.replace(/[^a-zàâäéèêëîïôöûùüÿœæ]/g, "");
      if (!p) return acc;
      let n = (p.match(/[aeiouyàâäéèêëîïôöûùüÿœæ]+/g) || []).length;
      if (n > 1 && /(e|es|ent)$/.test(p) && !/(é|ée|ées)$/.test(p)) n -= 1; // e muet
      return acc + Math.max(1, n);
    }, 0);
};
const SYL = 0.185; // s par syllabe — voix posée, institutionnelle
const pauseAfter = (w: string) =>
  /[.?!]$/.test(w) ? 0.5 : /…$/.test(w) ? 0.45 : /:$/.test(w) ? 0.35 : /[,;]$/.test(w) ? 0.25 : 0.02;

// ---------- 3. Alignement avec une transcription réelle ----------
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

/**
 * Aligne les mots du script sur la transcription réelle (alignement global de
 * séquences, type Needleman-Wunsch) : robuste aux mots manquants, ajoutés,
 * découpés ("easy" "Virtual" "tours") ou à la ponctuation isolée.
 */
export const alignWords = (script: { spoken: string; display: string }[], real: RealWord[]) => {
  const sv = script.map((w) => [norm(w.display), norm(w.spoken)] as const);
  const rv = real.map((w) => norm(w.text));
  const n = sv.length;
  const m = rv.length;
  const sim = (i: number, j: number) => {
    const [d, sp] = sv[i];
    const r = rv[j];
    if (!d || !r) return -0.2;
    if (r === d || r === sp) return 3;
    if (d.startsWith(r) || r.startsWith(d) || sp.startsWith(r)) return 1.5;
    return -1;
  };
  const GAP_S = (i: number) => (sv[i][0] ? -0.6 : -0.05); // mot du script non prononcé (ponctuation : quasi gratuit)
  const GAP_R = (j: number) => (rv[j] ? -0.4 : -0.05);
  const score: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const move: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    score[i][0] = score[i - 1][0] + GAP_S(i - 1);
    move[i][0] = 1;
  }
  for (let j = 1; j <= m; j++) {
    score[0][j] = score[0][j - 1] + GAP_R(j - 1);
    move[0][j] = 2;
  }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = score[i - 1][j - 1] + sim(i - 1, j - 1);
      const up = score[i - 1][j] + GAP_S(i - 1);
      const left = score[i][j - 1] + GAP_R(j - 1);
      if (diag >= up && diag >= left) {
        score[i][j] = diag;
        move[i][j] = 0;
      } else if (up >= left) {
        score[i][j] = up;
        move[i][j] = 1;
      } else {
        score[i][j] = left;
        move[i][j] = 2;
      }
    }
  }
  const match: (number | null)[] = new Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const mv = i === 0 ? 2 : j === 0 ? 1 : move[i][j];
    if (mv === 0) {
      if (sim(i - 1, j - 1) > 0) match[i - 1] = j - 1;
      i--;
      j--;
    } else if (mv === 1) i--;
    else j--;
  }
  // temps : mots appariés → transcription ; sinon interpolation entre voisins appariés
  const out: { start: number; end: number }[] = new Array(n);
  for (let k = 0; k < n; k++) {
    const mk = match[k];
    if (mk !== null) out[k] = { start: real[mk].startMs / 1000, end: real[mk].endMs / 1000 };
  }
  for (let k = 0; k < n; k++) {
    if (out[k]) continue;
    let a = k - 1;
    while (a >= 0 && !out[a]) a--;
    let b = k + 1;
    while (b < n && !out[b]) b++;
    const t0 = a >= 0 ? out[a].end : b < n ? out[b].start - 0.3 : 0;
    const t1 = b < n ? out[b].start : t0 + 0.3;
    const span = b - a - 1 || 1;
    const pos = k - a;
    const st = t0 + ((t1 - t0) * (pos - 1)) / span;
    out[k] = { start: st, end: Math.max(st + 0.05, t0 + ((t1 - t0) * pos) / span) };
  }
  // les mots qui suivent un mot non apparié restent dans l'ordre
  for (let k = 1; k < n; k++) if (out[k].start < out[k - 1].start) out[k] = { ...out[k], start: out[k - 1].start };
  return out;
};

// ---------- 4. Construction de la timeline ----------
const build = () => {
  const parsed = SCRIPT.map(parse);
  const est = parsed.map((ws) => {
    let t = 0;
    return ws.map((w) => {
      const d = 0.04 + syllables(w.spoken) * SYL;
      const r = { start: t, end: t + d };
      t += d + pauseAfter(w.display);
      return r;
    });
  });

  // temps absolus (s) de chaque mot
  let abs: { start: number; end: number }[][];
  if (VO.words && VO.words.length) {
    const flat = alignWords(parsed.flat(), VO.words);
    let c = 0;
    abs = parsed.map((ws) => ws.map(() => flat[c++]));
  } else if (VO.segments && VO.segments.length) {
    abs = est.map((ws, i) => {
      const s = VO.segments!.find((x) => x.id === SCRIPT[i].id);
      const total = ws[ws.length - 1].end;
      const scale = s ? (s.end - s.start) / total : 1;
      const base = s ? s.start : 0;
      return ws.map((w) => ({ start: base + w.start * scale, end: base + w.end * scale }));
    });
  } else {
    let t = 0;
    abs = est.map((ws, i) => {
      t += SCRIPT[i].leadIn;
      const res = ws.map((w) => ({ start: t + w.start, end: t + w.end }));
      t += ws[ws.length - 1].end + SCRIPT[i].tail;
      return res;
    });
  }

  // frontières de scènes
  const bounds: number[] = [0];
  for (let i = 1; i < SCRIPT.length; i++) {
    const prevEnd = abs[i - 1][abs[i - 1].length - 1].end;
    const nextStart = abs[i][0].start;
    const gap = Math.max(0, nextStart - prevEnd);
    bounds.push(nextStart - Math.min(SCRIPT[i].leadIn, gap * 0.7));
  }
  const last = abs[abs.length - 1];
  bounds.push(last[last.length - 1].end + SCRIPT[SCRIPT.length - 1].tail);

  const ANTICIPATION = 2; // frames : le mot apparaît très légèrement avant d'être entendu
  const scenes: Scene[] = SCRIPT.map((seg, i) => {
    const from = Math.round(bounds[i] * FPS);
    const to = Math.round(bounds[i + 1] * FPS);
    const words = parsed[i].map((w, k) => ({
      ...w,
      ...abs[i][k],
      at: Math.round(abs[i][k].start * FPS) - from - ANTICIPATION,
      endAt: Math.round(abs[i][k].end * FPS) - from,
    }));
    const phrases: Phrase[] = [];
    for (const w of words) {
      if (w.phrase === null) continue;
      if (!phrases[w.phrase]) phrases[w.phrase] = { words: [], start: w.at, end: w.endAt };
      phrases[w.phrase].words.push({ text: w.display, accent: w.accent, at: w.at });
      phrases[w.phrase].end = w.endAt;
    }
    return { id: seg.id, section: seg.section, index: i, from, dur: to - from, words, phrases };
  });
  return scenes;
};

export const SCENES = build();
export const TOTAL_FRAMES = SCENES[SCENES.length - 1].from + SCENES[SCENES.length - 1].dur;

export const scene = (id: string) => {
  const s = SCENES.find((x) => x.id === id);
  if (!s) throw new Error(`scene ${id} introuvable`);
  return s;
};

/** frame relative (dans la scène) à laquelle le mot `text` est prononcé (n-ième occurrence) */
export const cue = (s: Scene, text: string, occurrence = 0) => {
  const n = norm(text);
  const exact = s.words.filter((w) => norm(w.display) === n);
  const hits = exact.length ? exact : s.words.filter((w) => norm(w.display).startsWith(n));
  const w = hits[occurrence] ?? hits[0];
  if (!w) throw new Error(`cue "${text}" introuvable dans ${s.id}`);
  return w.at;
};
