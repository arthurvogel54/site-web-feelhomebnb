import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EASE_IN, EASE_IN_OUT, pop, prog } from "../anim";
import { Check, Grid, Tag, useEnter } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { CameraRig, CutPlane, EnableClipping, HouseModel, Lights, PointCloud, project } from "../three/House3D";
import { LX, LZ, ROOF, STATIONS, WALL_H } from "../three/houseData";

const S = scene("livrables");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const CW = 1340;
const CH = 1080;
const CX = 580; // position du canvas

/** interpolation multi-clés avec easing */
const keys = (frame: number, ks: [number, number][]) => {
  // garantit des clés strictement croissantes même si la voix accélère
  const xs: number[] = [];
  for (const [x] of ks) xs.push(xs.length ? Math.max(x, xs[xs.length - 1] + 1) : x);
  return interpolate(frame, xs, ks.map((k) => k[1]), { ...clamp, easing: EASE_IN_OUT });
};

export const S06Livrables: React.FC = () => {
  const frame = useCurrentFrame();
  const cBureau = cue(S, "bureau");
  const cPlans = cue(S, "plans");
  const cCoupes = cue(S, "coupes");
  const cToit = cue(S, "toiture");
  const cVue = cue(S, "vue");
  const cMaq = cue(S, "maquette");

  // ---- caméra (coordonnées sphériques autour de la maison) ----
  const az = keys(frame, [
    [0, -0.95],
    [cPlans - 4, -0.55],
    [cPlans + 22, 0],
    [cCoupes + 2, 0],
    [cCoupes + 24, 0.55],
    [cVue - 2, 0.62],
    [cVue + 26, Math.PI / 4],
    [S.dur, Math.PI / 4 + 0.22],
  ]);
  const elev = keys(frame, [
    [0, 0.5],
    [cPlans - 4, 0.62],
    [cPlans + 22, 1.5],
    [cCoupes + 2, 1.5],
    [cCoupes + 24, 0.42],
    [cVue - 2, 0.45],
    [cVue + 26, 0.6155],
  ]);
  const dist = keys(frame, [
    [0, 21],
    [cPlans + 22, 28],
    [cCoupes + 24, 20],
    [cVue - 2, 21],
    [cVue + 26, 62],
    [cMaq, 64],
    [cMaq + 24, 74],
  ]);
  const fov = keys(frame, [
    [0, 32],
    [cPlans + 22, 30],
    [cCoupes + 24, 32],
    [cVue - 2, 32],
    [cVue + 26, 15.5],
  ]);
  const tY = keys(frame, [
    [0, 0.6],
    [cMaq, 1.0],
    [cMaq + 24, 2.2],
  ]);
  const target: [number, number, number] = [0, tY, 0];
  const camPos: [number, number, number] = [
    Math.cos(elev) * Math.sin(az) * dist,
    Math.sin(elev) * dist + tY,
    Math.cos(elev) * Math.cos(az) * dist,
  ];

  // ---- états de la maquette ----
  const pointsOp = 1 - prog(frame, cBureau + 40, cPlans - 6);
  const wire = prog(frame, cBureau + 10, Math.min(cBureau + 80, cPlans - 10), EASE_IN_OUT);
  const solid = prog(frame, cPlans - 8, cPlans + 10);
  const hideUpper = keys(frame, [
    [cPlans - 4, 0],
    [cPlans + 14, 1],
    [cCoupes - 2, 1],
    [cCoupes + 14, 0],
  ]);
  const cut = keys(frame, [
    [cCoupes, LX / 2 + 1],
    [cCoupes + 14, 0.8],
    [cToit + 8, 0.8],
    [cToit + 24, LX / 2 + 1],
  ]);
  const cutOp = prog(frame, cCoupes, cCoupes + 8) * (1 - prog(frame, cToit + 10, cToit + 24));
  const roof = prog(frame, cToit, cToit + 18, EASE_IN_OUT);
  const explode = prog(frame, cMaq - 4, cMaq + 22, EASE_IN_OUT);
  const furniture = 1 - prog(frame, cVue, cVue + 16);
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);

  const proj = (p: [number, number, number]) => project(p, camPos, target, fov, CW, CH);

  // ---- liste des livrables (synchronisée sur la voix) ----
  const items = [
    { n: "01", t: "Plans 2D", sub: "DWG · PDF", at: cPlans },
    { n: "02", t: "Coupes", sub: "DWG · PDF", at: cCoupes },
    { n: "03", t: "Toiture", sub: "plan de toiture", at: cToit },
    { n: "04", t: "Vue 3D isométrique", sub: "", at: cVue },
    { n: "05", t: "Maquette BIM", sub: "IFC · RVT · LOD 200", at: cMaq },
  ];
  const tag = useEnter(cBureau - 6, 30);

  // ---- annotations projetées ----
  const planVis = prog(frame, cPlans + 16, cPlans + 24) * (1 - prog(frame, cCoupes - 2, cCoupes + 6));
  const c00 = proj([-LX / 2, 0, LZ / 2 + 0.9]);
  const c10 = proj([LX / 2, 0, LZ / 2 + 0.9]);
  const s00 = proj([LX / 2 + 0.9, 0, LZ / 2]);
  const s01 = proj([LX / 2 + 0.9, 0, -LZ / 2]);
  const rooms = [
    { name: "Séjour", a: "51 m²", p: [-3, 0, 0] as [number, number, number] },
    { name: "Chambre 1", a: "27 m²", p: [3, 0, -2.1] as [number, number, number] },
    { name: "Ch. 2", a: "12 m²", p: [1.5, 0, 2.2] as [number, number, number] },
    { name: "SdE", a: "12 m²", p: [4.5, 0, 2.2] as [number, number, number] },
  ];
  const bimVis = prog(frame, cMaq + 14, cMaq + 26);
  const bimTags = [
    { t: "IfcRoof", p: [-1, WALL_H + ROOF.rise * 0.6 + explode * 3.6, -1.5] as [number, number, number], d: 0 },
    { t: "IfcWall", p: [LX / 2, 1.8, 2.5] as [number, number, number], d: 4 },
    { t: "IfcWindow", p: [4.4, 1.5, LZ / 2] as [number, number, number], d: 8 },
    { t: "IfcSlab", p: [-LX / 2 + 1, -0.15 - explode * 1.4, LZ / 2] as [number, number, number], d: 12 },
  ];
  const cutLabel = proj([cut, WALL_H + 1.6, -LZ / 2 - 0.4]);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit, translate: `0 ${-exit * 30}px` }}>
        <div style={{ position: "absolute", left: CX, top: 0, width: CW, height: CH }}>
          <ThreeCanvas width={CW} height={CH} flat style={{ position: "absolute", inset: 0 }}>
            <EnableClipping />
            <CameraRig pos={camPos} target={target} fov={fov} up={[0, 1, 0]} />
            <Lights />
            <PointCloud radii={STATIONS.map(() => 0)} all={1} opacity={pointsOp} size={1.5} />
            <HouseModel
              opacity={solid}
              wire={wire}
              wireOpacity={interpolate(solid, [0, 1], [0.9, 0.85])}
              lineWidth={interpolate(frame, [cVue, cVue + 26], [1.6, 1.3], clamp)}
              roof={roof}
              roofLift={explode * 3.6}
              slabDrop={explode * 1.4}
              furniture={furniture}
              cutX={cutOp > 0.001 ? cut : null}
              hideUpper={hideUpper}
              resolution={[CW, CH]}
            />
            <CutPlane x={cut} opacity={cutOp} />
          </ThreeCanvas>

          {/* cotation du plan */}
          <svg width={CW} height={CH} style={{ position: "absolute", inset: 0, opacity: planVis }}>
            {[
              [c00, c10, "12,00 m"],
              [s00, s01, "8,50 m"],
            ].map(([a, b, l], i) => {
              const A = a as { x: number; y: number };
              const B = b as { x: number; y: number };
              const t = prog(frame, cPlans + 18 + i * 6, cPlans + 34 + i * 6, EASE_IN_OUT);
              const mx = (A.x + B.x) / 2;
              const my = (A.y + B.y) / 2;
              const vertical = Math.abs(B.y - A.y) > Math.abs(B.x - A.x);
              return (
                <g key={i}>
                  <line x1={A.x} y1={A.y} x2={A.x + (B.x - A.x) * t} y2={A.y + (B.y - A.y) * t} stroke={C.orange} strokeWidth={4} />
                  <circle cx={A.x} cy={A.y} r={6} fill={C.orange} />
                  {t > 0.98 && <circle cx={B.x} cy={B.y} r={6} fill={C.orange} />}
                  <g transform={`translate(${mx + (vertical ? 70 : 0)} ${my + (vertical ? 0 : 40)}) scale(${pop(frame, cPlans + 30 + i * 6, 12, 200)})`}>
                    <rect x={-72} y={-24} width={144} height={48} rx={24} fill={C.orange} />
                    <text textAnchor="middle" y={10} fontFamily={F.body} fontWeight={700} fontSize={26} fill="#fff">
                      {l as string}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
          {rooms.map((r, i) => {
            const p = proj(r.p);
            const s = pop(frame, cPlans + 22 + i * 3, 12, 190);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: p.x - 100,
                  top: p.y - 30,
                  width: 200,
                  textAlign: "center",
                  fontFamily: F.body,
                  scale: `${s}`,
                  opacity: planVis,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 24, color: C.ink }}>{r.name}</div>
                <div style={{ fontWeight: 600, fontSize: 20, color: C.orange }}>{r.a}</div>
              </div>
            );
          })}
          {/* étiquette de coupe */}
          <div style={{ position: "absolute", left: cutLabel.x - 80, top: cutLabel.y - 30, opacity: cutOp, scale: `${pop(frame, cCoupes + 10, 12, 180)}` }}>
            <div style={{ background: C.orange, color: "#fff", fontFamily: F.title, fontWeight: 800, fontSize: 28, padding: "8px 20px", borderRadius: 999 }}>Coupe A-A</div>
          </div>
          {/* étiquettes BIM */}
          {bimTags.map((b, i) => {
            const p = proj(b.p);
            const s = pop(frame, cMaq + 14 + b.d, 12, 200);
            return (
              <div key={i} style={{ position: "absolute", left: p.x, top: p.y, opacity: bimVis, scale: `${s}`, transformOrigin: "left center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 0, translate: "-10px -50%" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 10, background: C.orange, border: "4px solid #fff", boxShadow: "0 0 0 2px " + C.orange }} />
                  <div style={{ width: 40, height: 3, background: C.ink }} />
                  <div style={{ background: C.ink, color: "#fff", fontFamily: F.body, fontWeight: 600, fontSize: 24, padding: "8px 18px", borderRadius: 999 }}>{b.t}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------- colonne gauche ---------- */}
        <div style={{ position: "absolute", left: 130, top: 200, width: 600 }}>
          <div style={tag.style}>
            <Tag>Bureau d&apos;études</Tag>
          </div>
          <div style={{ marginTop: 44, display: "flex", flexDirection: "column", gap: 16 }}>
            {items.map((it, i) => {
              const appear = pop(frame, cBureau + 6 + i * 4, 15, 150);
              const on = prog(frame, it.at, it.at + 8);
              const active = frame >= it.at && (i === items.length - 1 || frame < items[i + 1].at);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 26,
                    padding: "18px 26px",
                    borderRadius: 24,
                    background: active ? C.white : "transparent",
                    border: `3px solid ${active ? C.orange : "transparent"}`,
                    boxShadow: active ? "0 24px 40px -24px rgba(0,0,0,0.25)" : "none",
                    opacity: interpolate(appear, [0, 0.4], [0, 1], clamp),
                    translate: `${interpolate(appear, [0, 1], [-40, 0])}px 0`,
                  }}
                >
                  <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 46, color: on > 0.5 ? C.orange : "#C9C9C9", width: 70 }}>{it.n}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: 44, lineHeight: 1.05, color: on > 0.5 ? C.ink : "#BDBDBD" }}>{it.t}</div>
                    {it.sub && (
                      <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 21, letterSpacing: "0.08em", color: C.greyText, marginTop: 4, opacity: on }}>{it.sub}</div>
                    )}
                  </div>
                  <Check size={40} progress={prog(frame, it.at + 2, it.at + 12)} />
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
