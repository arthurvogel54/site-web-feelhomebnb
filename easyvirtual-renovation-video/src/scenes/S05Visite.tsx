import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EASE_IN, EASE_IN_OUT, lerp, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { Chip, Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { CameraRig, HouseModel, project } from "../three/House3D";
import { LX, LZ } from "../three/houseData";

const S = scene("visite");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const WIN = { x: 650, y: 214, w: 1170, h: 690 };
const BAR = 54;
const VW = WIN.w;
const VH = WIN.h - BAR;
const FOV = 62;

// fenêtre mesurée : façade avant, 1re fenêtre (1,80 m)
const zWall = -LZ / 2 + 0.1 + 0.01;
const A: [number, number, number] = [0.7 - LX / 2, 1.5, zWall];
const B: [number, number, number] = [2.5 - LX / 2, 1.5, zWall];

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <div style={{ position: "absolute", left: x, top: y, scale: `${1 - press * 0.15}`, transformOrigin: "top left" }}>
    <svg width={44} height={52} viewBox="0 0 22 26">
      <path d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.6 15.2 L17 15 Z" fill="#fff" stroke={C.ink} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  </div>
);

export const S05Visite: React.FC = () => {
  const frame = useCurrentFrame();
  const cOubliee = cue(S, "cote");
  const cMesurez = cue(S, "Mesurez-la");
  const cBureau = cue(S, "bureau.");
  const p1 = S.phrases[0];
  const p2 = S.phrases[1];

  // entrée de la fenêtre
  const winIn = pop(frame, 0, 16, 110, 1);
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);

  // caméra : on regarde la pièce puis on se cale face à la fenêtre à mesurer
  const yaw = interpolate(frame, [0, cOubliee, cOubliee + 26], [0.9, 0.35, 0.18], { ...clamp, easing: EASE_IN_OUT });
  const camPos: [number, number, number] = [-2.6, 1.5, 1.2 + interpolate(frame, [0, S.dur], [0.6, 0], clamp)];
  const look: [number, number, number] = [camPos[0] - Math.sin(yaw) * 5, 1.25, camPos[2] - Math.cos(yaw) * 5];

  const pa = project(A, camPos, look, FOV, VW, VH);
  const pb = project(B, camPos, look, FOV, VW, VH);

  // outil de mesure
  const tA = cMesurez - 10; // clic point A
  const drag = prog(frame, tA + 6, cBureau - 2, EASE_IN_OUT);
  const done = frame >= cBureau - 2;
  const cursorStart = { x: VW * 0.75, y: VH * 0.85 };
  const toA = prog(frame, cOubliee + 6, tA, EASE_IN_OUT);
  const cur =
    frame < tA
      ? { x: lerp(cursorStart.x, pa.x, toA), y: lerp(cursorStart.y, pa.y, toA) }
      : { x: lerp(pa.x, pb.x, drag), y: lerp(pa.y, pb.y, drag) };
  const pressA = Math.max(0, 1 - Math.abs(frame - tA) / 4);
  const pressB = Math.max(0, 1 - Math.abs(frame - (cBureau - 2)) / 4);
  const measuring = frame >= tA;
  const value = 1.8 * drag;
  const lab = pop(frame, cBureau - 2, 10, 200);
  const tool = frame >= cOubliee + 4;

  const swap = prog(frame, p2.start - 14, p2.start - 2, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit, translate: `0 ${-exit * 30}px` }}>
        {/* mascotte qui jette un œil */}
        {(() => {
          const s = pop(frame, cOubliee - 4, 12, 120);
          return (
            <div style={{ position: "absolute", left: WIN.x + WIN.w - 180 + s * 80, top: WIN.y + WIN.h - 300, rotate: `${s * 14}deg` }}>
              <Mascot height={262} mood={done ? "wow" : "focus"} look={[-0.9, -0.4]} seed={5} />
            </div>
          );
        })()}

        {/* ---------- fenêtre d'application ---------- */}
        <div
          style={{
            position: "absolute",
            left: WIN.x,
            top: WIN.y,
            width: WIN.w,
            height: WIN.h,
            borderRadius: 26,
            overflow: "hidden",
            background: "#EDEBE7",
            boxShadow: "0 60px 120px -40px rgba(0,0,0,0.35), 0 0 0 2px #E2E2E2",
            scale: `${interpolate(winIn, [0, 1], [0.85, 1])}`,
            opacity: interpolate(winIn, [0, 0.3], [0, 1], clamp),
            translate: `0 ${interpolate(winIn, [0, 1], [80, 0])}px`,
          }}
        >
          {/* barre */}
          <div style={{ height: BAR, background: C.white, display: "flex", alignItems: "center", padding: "0 22px", gap: 10, borderBottom: `2px solid ${C.greyLine}` }}>
            {[C.orange, "#D0D0D0", "#D0D0D0"].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
            ))}
            <div style={{ marginLeft: 24, flex: 1, height: 32, borderRadius: 16, background: C.grey, display: "flex", alignItems: "center", padding: "0 18px", fontFamily: F.body, fontSize: 17, color: C.greyText }}>
              <span style={{ color: C.ink, fontWeight: 600 }}>visite.easyvirtual.tours</span>&nbsp;/ maison-100m2 / sejour
            </div>
          </div>
          {/* vue 3D */}
          <div style={{ position: "relative", width: VW, height: VH }}>
            <ThreeCanvas width={VW} height={VH} flat style={{ position: "absolute", inset: 0 }}>
              <CameraRig pos={camPos} target={look} fov={FOV} />
              <ambientLight intensity={1.15} />
              <hemisphereLight args={["#fffaf0", "#cbb79a", 0.7]} />
              <directionalLight position={[-6, 8, 6]} intensity={1.0} />
              <pointLight position={[-3, 2.4, -2]} intensity={6} distance={9} color="#fff4e0" />
              <HouseModel opacity={1} wire={1} wireOpacity={0.25} lineWidth={1} slabColor="#C99E73" furnitureColor="#7A7470" resolution={[VW, VH]} />
              {/* plafond */}
              <mesh position={[0, 2.61, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[LX, LZ]} />
                <meshStandardMaterial color="#F7F5F1" side={2} />
              </mesh>
              {/* lumière du jour dans les vitrages */}
              <mesh position={[(A[0] + B[0]) / 2, 1.52, -LZ / 2 + 0.05]}>
                <planeGeometry args={[1.8, 1.25]} />
                <meshBasicMaterial color="#DDEBF5" />
              </mesh>
              {/* hotspots de déplacement */}
              {[
                [-4.2, 0.02, -1.6],
                [-1.8, 0.02, -2.6],
                [-4.0, 0.02, 2.4],
              ].map((p, i) => (
                <mesh key={i} position={p as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.2, 0.28, 40]} />
                  <meshBasicMaterial color="#ffffff" transparent opacity={(0.7 + Math.sin(frame / 6 + i) * 0.2) * (tool ? 0.4 : 1)} />
                </mesh>
              ))}
            </ThreeCanvas>

            {/* --- calque mesure --- */}
            <svg width={VW} height={VH} style={{ position: "absolute", inset: 0 }}>
              {measuring && (
                <>
                  <line x1={pa.x} y1={pa.y} x2={lerp(pa.x, pb.x, drag)} y2={lerp(pa.y, pb.y, drag)} stroke={C.orange} strokeWidth={5} />
                  <circle cx={pa.x} cy={pa.y} r={9} fill="#fff" stroke={C.orange} strokeWidth={4} />
                  <circle cx={lerp(pa.x, pb.x, drag)} cy={lerp(pa.y, pb.y, drag)} r={9} fill="#fff" stroke={C.orange} strokeWidth={4} />
                  {pressA > 0 && <circle cx={pa.x} cy={pa.y} r={10 + (1 - pressA) * 30} fill="none" stroke={C.orange} strokeWidth={3} opacity={pressA} />}
                </>
              )}
            </svg>
            {measuring && (
              <div
                style={{
                  position: "absolute",
                  left: (pa.x + lerp(pa.x, pb.x, drag)) / 2 - 100,
                  top: (pa.y + pb.y) / 2 - 86,
                  width: 200,
                  display: "flex",
                  justifyContent: "center",
                  scale: `${done ? 0.8 + lab * 0.2 : 1}`,
                }}
              >
                <div
                  style={{
                    background: done ? C.orange : C.ink,
                    color: "#fff",
                    fontFamily: F.title,
                    fontWeight: 800,
                    fontSize: done ? 40 : 32,
                    padding: "8px 22px",
                    borderRadius: 999,
                    fontVariantNumeric: "tabular-nums",
                    boxShadow: done ? `0 0 0 ${pressB * 18}px rgba(255,102,0,0.25)` : "none",
                  }}
                >
                  {value.toFixed(2).replace(".", ",")} m
                </div>
              </div>
            )}

            {/* mini-plan */}
            <div style={{ position: "absolute", right: 22, top: 22, width: 220, height: 160, borderRadius: 16, background: "rgba(255,255,255,0.92)", padding: 14 }}>
              <svg viewBox="0 0 120 85" width={192} height={132}>
                <rect x={2} y={2} width={116} height={81} fill="none" stroke={C.ink} strokeWidth={2.5} />
                <path d="M60 2 L60 83 M60 45 L118 45 M90 45 L90 83" stroke={C.ink} strokeWidth={2} />
                <g transform={`translate(${(camPos[0] + 6) * 10} ${(camPos[2] + 4.25) * 10}) rotate(${(-yaw * 180) / Math.PI})`}>
                  <path d="M0 0 L-14 -26 L14 -26 Z" fill={C.orange} opacity={0.35} />
                  <circle r={5} fill={C.orange} />
                </g>
              </svg>
            </div>
            {/* barre d'outils */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 22, display: "flex", justifyContent: "center", gap: 12 }}>
              {["Visite 360°", "Plan", "Vue 3D", "Mesure"].map((t, i) => {
                const active = i === 3 ? tool : i === 0 && !tool;
                return (
                  <Chip key={t} size={22} bg={active ? C.orange : "rgba(255,255,255,0.94)"} color={active ? "#fff" : C.ink}>
                    {i === 3 && <span style={{ fontFamily: F.title, fontWeight: 800 }}>⟷</span>}
                    {t}
                  </Chip>
                );
              })}
            </div>
            {tool && frame < S.dur && <Cursor x={cur.x} y={cur.y} press={Math.max(pressA, pressB)} />}
          </div>
        </div>

        {/* ---------- textes ---------- */}
        <div style={{ position: "absolute", left: 130, top: 300, width: 500, opacity: 1 - swap, translate: `${-swap * 40}px 0` }}>
          <KeyPhrase phrase={p1} size={100} />
        </div>
        <div style={{ position: "absolute", left: 130, top: 300, width: 500 }}>
          {(() => {
            const s = pop(frame, p2.start - 8, 11, 170);
            return (
              <div style={{ width: 120, height: 120, borderRadius: 60, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", scale: `${s}`, marginBottom: 30 }}>
                <svg width={78} height={78} viewBox="0 0 48 48">
                  <rect x={8} y={18} width={32} height={14} rx={5} fill="#fff" />
                  <path d="M14 18 L18 11 L30 11 L34 18" fill="#fff" />
                  <circle cx={15} cy={33} r={4} fill={C.ink} />
                  <circle cx={33} cy={33} r={4} fill={C.ink} />
                  <line x1={6} y1={42} x2={42} y2={6} stroke={C.ink} strokeWidth={4.5} strokeLinecap="round" />
                </svg>
              </div>
            );
          })()}
          <KeyPhrase phrase={p2} size={92} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
