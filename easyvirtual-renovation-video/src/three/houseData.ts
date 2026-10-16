/**
 * Maison de ~100 m² (12 × 8,5 m) générée procéduralement :
 * murs avec ouvertures, mobilier, toiture à deux pans.
 * Repère : x = longueur, z = profondeur, y = hauteur. Centrée sur l'origine.
 */
export type Box = { c: [number, number, number]; s: [number, number, number]; kind: "wall" | "slab" | "furniture" | "glass" | "door" };
type Opening = { at: number; w: number; y0: number; y1: number; type: "window" | "door" };
type Wall = { a: [number, number]; b: [number, number]; open: Opening[] };

export const LX = 12;
export const LZ = 8.5;
export const WALL_H = 2.6;
export const T = 0.2;
const OX = LX / 2;
const OZ = LZ / 2;

const win = (at: number, w = 1.2): Opening => ({ at, w, y0: 0.9, y1: 2.15, type: "window" });
const door = (at: number, w = 0.9): Opening => ({ at, w, y0: 0, y1: 2.1, type: "door" });

const WALLS: Wall[] = [
  // extérieurs
  { a: [0, 0], b: [LX, 0], open: [win(1.6, 1.8), win(4.4), door(7.2, 1.0), win(10.4)] },
  { a: [LX, 0], b: [LX, LZ], open: [win(2.2), win(6.6, 0.8)] },
  { a: [LX, LZ], b: [0, LZ], open: [win(1.6, 0.8), win(4.5), win(8.5, 2.4)] },
  { a: [0, LZ], b: [0, 0], open: [win(2.5, 1.6), win(6.2)] },
  // intérieurs
  { a: [6, 0], b: [6, LZ], open: [door(5.2)] },
  { a: [6, 4.5], b: [LX, 4.5], open: [door(1.6), door(4.6, 0.8)] },
  { a: [9, 4.5], b: [9, LZ], open: [] },
];

export const ROOMS = [
  { name: "Séjour / cuisine", x0: 0, z0: 0, x1: 6, z1: LZ },
  { name: "Chambre 1", x0: 6, z0: 0, x1: LX, z1: 4.5 },
  { name: "Chambre 2", x0: 6, z0: 4.5, x1: 9, z1: LZ },
  { name: "Salle d'eau", x0: 9, z0: 4.5, x1: LX, z1: LZ },
];

/** stations de scan (dans l'ordre de passage) et pièce associée */
export const STATIONS: { p: [number, number, number]; room: number }[] = [
  { p: [2.8 - OX, 1.3, 2.4 - OZ], room: 0 },
  { p: [3.2 - OX, 1.3, 6.4 - OZ], room: 0 },
  { p: [9 - OX, 1.3, 2.3 - OZ], room: 1 },
  { p: [7.5 - OX, 1.3, 6.5 - OZ], room: 2 },
  { p: [10.5 - OX, 1.3, 6.5 - OZ], room: 3 },
];

const FURNITURE: [number, number, number, number, number, number][] = [
  // x, z, y0, sx, sz, sy (coordonnées plan, avant centrage)
  [1.2, 2.2, 0, 0.9, 2.6, 0.8], // canapé
  [2.2, 0.9, 0, 1.8, 0.9, 0.8], // retour canapé
  [2.7, 2.6, 0, 1.0, 0.6, 0.42], // table basse
  [3.4, 6.2, 0, 1.8, 0.9, 0.75], // table à manger
  [0.35, 6.6, 0, 0.6, 3.0, 0.9], // plan de travail
  [1.6, 8.15, 0, 2.4, 0.6, 0.9], // plan de travail retour
  [5.0, 7.6, 0, 1.2, 0.6, 2.0], // armoire cuisine
  [9.5, 2.6, 0, 1.6, 2.0, 0.55], // lit 1
  [11.7, 1.5, 0, 0.55, 1.8, 2.1], // armoire chambre 1
  [7.5, 7.0, 0, 1.4, 1.9, 0.5], // lit 2
  [8.6, 4.95, 0, 0.6, 0.5, 0.75], // bureau
  [11.0, 7.75, 0, 1.7, 0.75, 0.55], // douche / baignoire
  [9.5, 5.2, 0, 0.9, 0.5, 0.85], // vasque
];

const len = (w: Wall) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);

/** boîtes solides (BIM) */
export const buildBoxes = (): Box[] => {
  const boxes: Box[] = [];
  for (const w of WALLS) {
    const L = len(w);
    const dx = (w.b[0] - w.a[0]) / L;
    const dz = (w.b[1] - w.a[1]) / L;
    const horizontal = Math.abs(dx) > 0.5;
    const pushSeg = (s0: number, s1: number, y0: number, y1: number, kind: Box["kind"] = "wall", thick = T) => {
      if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return;
      if (kind === "wall") {
        if (s0 <= 0.001) s0 -= T / 2; // recouvrement aux angles
        if (s1 >= L - 0.001) s1 += T / 2;
      }
      const mid = (s0 + s1) / 2;
      const cx = w.a[0] + dx * mid - OX;
      const cz = w.a[1] + dz * mid - OZ;
      const lenS = s1 - s0;
      boxes.push({
        c: [cx, (y0 + y1) / 2, cz],
        s: horizontal ? [lenS, y1 - y0, thick] : [thick, y1 - y0, lenS],
        kind,
      });
    };
    const ops = [...w.open].sort((a, b) => a.at - b.at);
    let cur = 0;
    for (const o of ops) {
      const s0 = o.at - o.w / 2;
      const s1 = o.at + o.w / 2;
      pushSeg(cur, s0, 0, WALL_H);
      if (o.y0 > 0) pushSeg(s0, s1, 0, o.y0);
      pushSeg(s0, s1, o.y1, WALL_H);
      pushSeg(s0, s1, o.y0, o.y1, o.type === "window" ? "glass" : "door", o.type === "window" ? 0.04 : 0.05);
      cur = s1;
    }
    pushSeg(cur, L, 0, WALL_H);
  }
  // dalle
  boxes.push({ c: [0, -0.15, 0], s: [LX + 0.4, 0.3, LZ + 0.4], kind: "slab" });
  for (const [x, z, y0, sx, sz, sy] of FURNITURE) {
    boxes.push({ c: [x - OX, y0 + sy / 2, z - OZ], s: [sx, sy, sz], kind: "furniture" });
  }
  return boxes;
};

/** toiture à deux pans, faîtage selon x */
export const ROOF = (() => {
  const over = 0.5;
  const rise = 2.0;
  const half = LZ / 2 + over;
  const slope = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  return { over, rise, half, slope, ang, length: LX + over * 2, y: WALL_H };
})();

// ------------------------------------------------------------------
// Nuage de points
// ------------------------------------------------------------------
const mulberry = (a: number) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const roomAt = (x: number, z: number) => {
  const px = x + OX;
  const pz = z + OZ;
  return ROOMS.findIndex((r) => px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1);
};

export type Cloud = { pos: Float32Array; room: Float32Array; shade: Float32Array; count: number };

export const buildCloud = (density = 420): Cloud => {
  const rnd = mulberry(7);
  const pos: number[] = [];
  const room: number[] = [];
  const shade: number[] = [];
  const add = (x: number, y: number, z: number, r: number, s: number) => {
    if (r < 0) return;
    pos.push(x, y, z);
    room.push(r);
    shade.push(s);
  };
  const boxes = buildBoxes();
  for (const b of boxes) {
    if (b.kind === "glass") continue;
    const [cx, cy, cz] = b.c;
    const [sx, sy, sz] = b.s;
    // 6 faces (sauf dessous)
    const faces: { n: [number, number, number]; u: number; v: number }[] = [
      { n: [1, 0, 0], u: sz, v: sy },
      { n: [-1, 0, 0], u: sz, v: sy },
      { n: [0, 0, 1], u: sx, v: sy },
      { n: [0, 0, -1], u: sx, v: sy },
      { n: [0, 1, 0], u: sx, v: sz },
    ];
    for (const f of faces) {
      if (b.kind === "slab" && f.n[1] !== 1) continue;
      const d = b.kind === "slab" ? density * 0.7 : b.kind === "furniture" ? density * 1.2 : density;
      // échantillonnage stratifié (grille légèrement bruitée) : rendu "scan" plus net
      const step = 1 / Math.sqrt(d);
      const nu = Math.max(1, Math.round(f.u / step));
      const nv = Math.max(1, Math.round(f.v / step));
      for (let iu = 0; iu < nu; iu++) {
        for (let iv = 0; iv < nv; iv++) {
        const a = (iu + 0.5 + (rnd() - 0.5) * 0.5) / nu - 0.5;
        const c = (iv + 0.5 + (rnd() - 0.5) * 0.5) / nv - 0.5;
        let x = cx;
        let y = cy;
        let z = cz;
        if (f.n[0] !== 0) {
          x += (f.n[0] * sx) / 2;
          z += a * sz;
          y += c * sy;
        } else if (f.n[2] !== 0) {
          z += (f.n[2] * sz) / 2;
          x += a * sx;
          y += c * sy;
        } else {
          y += sy / 2;
          x += a * sx;
          z += c * sz;
        }
        // pièce à laquelle appartient la face (côté normal, sinon côté opposé)
        let r = roomAt(x + f.n[0] * 0.12, z + f.n[2] * 0.12);
        if (r < 0) r = roomAt(x - f.n[0] * 0.3, z - f.n[2] * 0.3);
        if (r < 0) r = roomAt(x, z);
        const s = b.kind === "slab" ? 0.55 : b.kind === "furniture" ? 0.25 : f.n[1] === 1 ? 0.1 : 0.4 + 0.25 * Math.abs(f.n[0]);
        add(x, y, z, r, s + (rnd() - 0.5) * 0.12);
        }
      }
    }
  }
  return { pos: new Float32Array(pos), room: new Float32Array(room), shade: new Float32Array(shade), count: room.length };
};

let _cloud: Cloud | null = null;
export const getCloud = () => (_cloud ??= buildCloud());
let _boxes: Box[] | null = null;
export const getBoxes = () => (_boxes ??= buildBoxes());
