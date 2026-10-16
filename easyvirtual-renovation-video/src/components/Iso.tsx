import React from "react";
import { C } from "../theme";

/** Projection isométrique : x vers la droite-bas, z vers la gauche-bas, y vers le haut. */
export type Iso = { ox: number; oy: number; s: number };
export const iso = (o: Iso, x: number, y: number, z: number) => ({
  x: o.ox + (x - z) * Math.cos(Math.PI / 6) * o.s,
  y: o.oy + (x + z) * Math.sin(Math.PI / 6) * o.s - y * o.s,
});
const pts = (o: Iso, p: [number, number, number][]) =>
  p
    .map(([x, y, z]) => {
      const q = iso(o, x, y, z);
      return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
    })
    .join(" ");

type FaceStyle = { top?: string; left?: string; right?: string; stroke?: string; sw?: number };

/** boîte isométrique (3 faces visibles) */
export const IsoBox: React.FC<{
  o: Iso;
  x: number;
  z: number;
  w: number; // selon x
  d: number; // selon z
  h: number;
  y0?: number;
  st?: FaceStyle;
}> = ({ o, x, z, w, d, h, y0 = 0, st = {} }) => {
  const { top = "#FFFFFF", left = "#F1F1F1", right = "#E2E2E2", stroke = C.ink, sw = 3 } = st;
  const y1 = y0 + h;
  return (
    <g strokeLinejoin="round" stroke={stroke} strokeWidth={sw}>
      {/* face +z (gauche) */}
      <polygon points={pts(o, [[x, y0, z + d], [x + w, y0, z + d], [x + w, y1, z + d], [x, y1, z + d]])} fill={left} />
      {/* face +x (droite) */}
      <polygon points={pts(o, [[x + w, y0, z], [x + w, y0, z + d], [x + w, y1, z + d], [x + w, y1, z]])} fill={right} />
      {/* dessus */}
      <polygon points={pts(o, [[x, y1, z], [x + w, y1, z], [x + w, y1, z + d], [x, y1, z + d]])} fill={top} />
    </g>
  );
};

/** fenêtres réparties sur la face +z ou +x */
export const IsoWindows: React.FC<{
  o: Iso;
  face: "z" | "x";
  x: number;
  z: number;
  w: number;
  d: number;
  rows: number[]; // hauteurs bas de fenêtre
  cols: number;
  ww?: number;
  wh?: number;
  fill?: string;
}> = ({ o, face, x, z, w, d, rows, cols, ww = 0.42, wh = 0.5, fill = "#CFE0EC" }) => {
  const res: React.ReactNode[] = [];
  const L = face === "z" ? w : d;
  for (const r of rows) {
    for (let i = 0; i < cols; i++) {
      const u = ((i + 0.5) / cols) * L - ww / 2;
      const quad: [number, number, number][] =
        face === "z"
          ? [
              [x + u, r, z + d],
              [x + u + ww, r, z + d],
              [x + u + ww, r + wh, z + d],
              [x + u, r + wh, z + d],
            ]
          : [
              [x + w, r, z + u],
              [x + w, r, z + u + ww],
              [x + w, r + wh, z + u + ww],
              [x + w, r + wh, z + u],
            ];
      res.push(<polygon key={`${r}-${i}`} points={pts(o, quad)} fill={fill} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />);
    }
  }
  return <g>{res}</g>;
};

/** toit à deux pans, faîtage selon x */
export const IsoGable: React.FC<{ o: Iso; x: number; z: number; w: number; d: number; y: number; r: number; fill?: string; side?: string }> = ({
  o,
  x,
  z,
  w,
  d,
  y,
  r,
  fill = C.orange,
  side = "#FFFFFF",
}) => {
  const zm = z + d / 2;
  return (
    <g stroke={C.ink} strokeWidth={3} strokeLinejoin="round">
      <polygon points={pts(o, [[x, y, z], [x + w, y, z], [x + w, y + r, zm], [x, y + r, zm]])} fill={fill} />
      <polygon points={pts(o, [[x, y, z + d], [x + w, y, z + d], [x + w, y + r, zm], [x, y + r, zm]])} fill={fill} />
      <polygon points={pts(o, [[x + w, y, z], [x + w, y, z + d], [x + w, y + r, zm]])} fill={side} />
    </g>
  );
};

export const IsoPoly: React.FC<{ o: Iso; p: [number, number, number][]; fill?: string; stroke?: string; sw?: number; opacity?: number }> = ({
  o,
  p,
  fill = "none",
  stroke = C.ink,
  sw = 3,
  opacity = 1,
}) => <polygon points={pts(o, p)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={opacity} />;
