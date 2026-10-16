import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, lerp, pop, prog } from "../anim";
import { iso, Iso, IsoBox, IsoGable, IsoPoly, IsoWindows } from "../components/Iso";
import { Mascot } from "../components/Mascot";
import { Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";

const S = scene("collectivites");
const O: Iso = { ox: 1265, oy: 370, s: 63 };

type Bld = { id: string; name: string; x: number; z: number; w: number; d: number; h: number; roof: number };
const TREES: [number, number][] = [
  [-1.0, -1.0],
  [9.3, 2.6],
  [3.9, 7.8],
  [9.4, 7.6],
  [-1.1, 2.6],
];

const BLD: Bld[] = [
  { id: "mairie", name: "Mairie", x: 0, z: 0, w: 4, d: 3, h: 2.6, roof: 1.0 },
  { id: "gym", name: "Gymnase", x: -0.6, z: 4.6, w: 4.4, d: 2.8, h: 2.1, roof: 0.6 },
  { id: "ecole", name: "École", x: 5.4, z: -0.4, w: 3.6, d: 2.4, h: 2.0, roof: 0.2 },
  { id: "salle", name: "Salle communale", x: 5.6, z: 4.0, w: 3, d: 2.4, h: 1.6, roof: 0.9 },
];

export const HeartDoc: React.FC<{ size: number; color?: string }> = ({ size, color = C.orange }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <rect x={6} y={4} width={36} height={40} rx={8} fill="#fff" stroke={C.ink} strokeWidth={3} />
    <path d="M12 26 L19 26 L22 18 L27 34 L30 26 L36 26" stroke={color} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 12 L30 12" stroke={C.ink} strokeWidth={3} strokeLinecap="round" />
  </svg>
);

const Tree: React.FC<{ x: number; z: number; t: number }> = ({ x, z, t }) => {
  const b = iso(O, x, 0, z);
  const top = iso(O, x, 1.1 * t, z);
  return (
    <g opacity={t > 0.01 ? 1 : 0}>
      <line x1={b.x} y1={b.y} x2={top.x} y2={top.y} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={top.x} cy={top.y - 10 * t} r={22 * t} fill="#DCDCDC" stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

export const S08Collectivites: React.FC = () => {
  const frame = useCurrentFrame();
  const cColl = cue(S, "collectivités");
  const cPat = cue(S, "patrimoine");
  const cuesB = [cPat + 2, cue(S, "gymnases"), cue(S, "Écoles"), cue(S, "salles")];
  const cScan = cue(S, "chaque");
  const cAlim = cue(S, "alimente");
  const cGem = cue(S, "GEM");
  const cCarnet = cue(S, "carnet");
  const [p0, p1, p2] = S.phrases;
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);
  const swap = prog(frame, p1.start - 16, p1.start - 4, EASE_IN_OUT);

  const ground = prog(frame, cColl - 10, cColl + 14, EASE_IN_OUT);
  // l'ordre de scan suit l'ordre d'apparition à l'écran
  const scanOrder = [0, 2, 1, 3];
  const scanAt = (i: number) => cScan + scanOrder.indexOf(i) * 11;

  // mascotte qui saute de toit en toit
  const hopPts = scanOrder.map((i) => {
    const b = BLD[i];
    return iso(O, b.x + b.w / 2, b.h + b.roof, b.z + b.d / 2);
  });
  const hopStart = cScan - 12;
  const hk = Math.max(0, Math.min(hopPts.length - 1, Math.floor((frame - hopStart) / 11)));
  const ht = prog(frame, hopStart + hk * 11, hopStart + hk * 11 + 11, EASE_IN_OUT);
  const from = hk === 0 ? { x: hopPts[0].x - 260, y: hopPts[0].y + 260 } : hopPts[hk - 1];
  const to = hopPts[hk];
  const mPos = { x: lerp(from.x, to.x, ht), y: lerp(from.y, to.y, ht) - Math.sin(ht * Math.PI) * 90 };
  const mascotVis = prog(frame, hopStart - 4, hopStart + 2) * (1 - prog(frame, cGem + 30, cGem + 40));

  const hub = { x: 1660, y: 165 };
  const hubS = pop(frame, cGem - 4, 11, 160);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit, scale: `${1 + exit * 0.06}` }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {/* sol + voirie */}
          <g opacity={ground} transform={`translate(0 ${(1 - ground) * 40})`}>
            <IsoPoly o={O} p={[[-1.6, 0, -1.6], [9.9, 0, -1.6], [9.9, 0, 8.3], [-1.6, 0, 8.3]]} fill="#F4F4F4" stroke="#E2E2E2" />
            <IsoPoly o={O} p={[[-1.6, 0, 3.3], [9.9, 0, 3.3], [9.9, 0, 4.1], [-1.6, 0, 4.1]]} fill="#E6E6E6" stroke="none" />
            <IsoPoly o={O} p={[[4.5, 0, -1.6], [5.2, 0, -1.6], [5.2, 0, 8.3], [4.5, 0, 8.3]]} fill="#E6E6E6" stroke="none" />
          </g>
          {TREES.filter(([x, z]) => x + z < 9).map(([x, z], i) => (
            <Tree key={i} x={x} z={z} t={pop(frame, cColl + 6 + i * 4, 12, 160)} />
          ))}
          {/* GEM : liaisons de données */}
          {BLD.map((b, i) => {
            const top = iso(O, b.x + b.w / 2, b.h + b.roof + 0.2, b.z + b.d / 2);
            const t = prog(frame, cAlim + i * 4, cAlim + 18 + i * 4, EASE_IN_OUT);
            const flow = ((frame - cAlim) / 26 + i * 0.25) % 1;
            return (
              <g key={b.id} opacity={t > 0 ? 1 : 0}>
                <line x1={top.x} y1={top.y} x2={lerp(top.x, hub.x, t)} y2={lerp(top.y, hub.y, t)} stroke={C.orange} strokeWidth={3} strokeDasharray="10 10" />
                {t >= 1 && <circle cx={lerp(top.x, hub.x, flow)} cy={lerp(top.y, hub.y, flow)} r={8} fill={C.orange} />}
              </g>
            );
          })}

          {/* bâtiments */}
          {BLD.map((b, i) => {
            const rise = pop(frame, cuesB[i] - 4, 11, 120, 0.9);
            if (rise < 0.005) return null;
            const anchor = iso(O, b.x + b.w / 2, 0, b.z + b.d / 2);
            const scanned = prog(frame, scanAt(i), scanAt(i) + 10);
            const topCol = scanned > 0.5 ? C.orangeSoft : "#FFFFFF";
            const ringT = prog(frame, scanAt(i), scanAt(i) + 22);
            const c = iso(O, b.x + b.w / 2, 0, b.z + b.d / 2);
            return (
              <g key={b.id}>
                {ringT > 0 && ringT < 1 && (
                  <ellipse cx={c.x} cy={c.y} rx={60 + ringT * 220} ry={(60 + ringT * 220) * 0.58} fill="none" stroke={C.orange} strokeWidth={5} opacity={1 - ringT} />
                )}
                <g transform={`translate(${anchor.x} ${anchor.y}) scale(1 ${rise}) translate(${-anchor.x} ${-anchor.y})`}>
                  <IsoBox o={O} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} st={{ top: topCol, left: "#FFFFFF", right: "#ECECEC" }} />
                  {b.id === "mairie" && (
                    <>
                      <IsoWindows o={O} face="z" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.35, 1.45]} cols={5} />
                      <IsoWindows o={O} face="x" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.35, 1.45]} cols={3} />
                      <IsoGable o={O} x={b.x} z={b.z} w={b.w} d={b.d} y={b.h} r={b.roof} fill="#2E2E2E" side={topCol} />
                      <IsoBox o={O} x={1.5} z={2.9} w={1} d={0.4} h={3.1} st={{ top: topCol }} />
                      {(() => {
                        const k = iso(O, 2, 2.75, 3.3);
                        const f0 = iso(O, 2, 3.1, 3.1);
                        const f1 = iso(O, 2, 4.3, 3.1);
                        return (
                          <>
                            <circle cx={k.x} cy={k.y} r={13} fill="#fff" stroke={C.orange} strokeWidth={4} />
                            <line x1={f0.x} y1={f0.y} x2={f1.x} y2={f1.y} stroke={C.ink} strokeWidth={4} />
                            <path d={`M${f1.x} ${f1.y} l40 10 l-40 12 z`} fill={C.orange} />
                          </>
                        );
                      })()}
                    </>
                  )}
                  {b.id === "ecole" && (
                    <>
                      <IsoWindows o={O} face="z" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.35, 1.2]} cols={4} />
                      <IsoWindows o={O} face="x" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.35, 1.2]} cols={2} />
                      <IsoBox o={O} x={b.x} z={b.z} w={b.w} d={b.d} h={0.2} y0={b.h} st={{ top: C.orange, left: C.orange, right: C.orangeDeep }} />
                    </>
                  )}
                  {b.id === "gym" && (
                    <>
                      <IsoWindows o={O} face="z" x={b.x} z={b.z} w={b.w} d={b.d} rows={[1.3]} cols={6} ww={0.4} wh={0.4} />
                      {[0.2, 0.5, 0.8].map((u, k) => {
                        const xx = b.x + b.w * u;
                        const arc = Array.from({ length: 9 }).map((_, j) => {
                          const t = j / 8;
                          return iso(O, xx, b.h + Math.sin(t * Math.PI) * b.roof, b.z + t * b.d);
                        });
                        return <polyline key={k} points={arc.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={C.ink} strokeWidth={3} />;
                      })}
                      {(() => {
                        const arc = Array.from({ length: 13 }).map((_, j) => {
                          const t = j / 12;
                          return iso(O, b.x + b.w, b.h + Math.sin(t * Math.PI) * b.roof, b.z + t * b.d);
                        });
                        return <polygon points={arc.map((p) => `${p.x},${p.y}`).join(" ")} fill="#ECECEC" stroke={C.ink} strokeWidth={3} />;
                      })()}
                    </>
                  )}
                  {b.id === "salle" && (
                    <>
                      <IsoWindows o={O} face="z" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.4]} cols={3} />
                      <IsoWindows o={O} face="x" x={b.x} z={b.z} w={b.w} d={b.d} rows={[0.4]} cols={2} />
                      <IsoGable o={O} x={b.x} z={b.z} w={b.w} d={b.d} y={b.h} r={b.roof} fill={C.orange} side={topCol} />
                    </>
                  )}
                </g>
              </g>
            );
          })}
          {TREES.filter(([x, z]) => x + z >= 9).map(([x, z], i) => (
            <Tree key={i} x={x} z={z} t={pop(frame, cColl + 14 + i * 4, 12, 160)} />
          ))}
        </svg>

        {/* étiquettes + carnets */}
        {BLD.map((b, i) => {
          const p = iso(O, b.x + b.w / 2, b.h + b.roof + 1.1, b.z + b.d / 2);
          const s = pop(frame, cuesB[i] + 6, 12, 170);
          const cs = pop(frame, cCarnet + i * 5, 11, 190);
          return (
            <div key={b.id} style={{ position: "absolute", left: p.x, top: p.y, translate: "-50% -100%", display: "flex", alignItems: "center", gap: 10, scale: `${s}`, transformOrigin: "center bottom" }}>
              <div style={{ background: C.ink, color: "#fff", fontFamily: F.body, fontWeight: 700, fontSize: 24, padding: "8px 18px", borderRadius: 999, whiteSpace: "nowrap" }}>{b.name}</div>
              <div style={{ scale: `${cs}`, width: cs > 0.01 ? 50 : 0 }}>
                <HeartDoc size={50} />
              </div>
            </div>
          );
        })}

        {/* mascotte */}
        {mascotVis > 0.01 && (
          <div style={{ position: "absolute", left: mPos.x - 46, top: mPos.y - 166, opacity: mascotVis }}>
            <Mascot height={170} mood="happy" scanning={ht > 0.9 || frame > hopStart + 44} look={[0, 0.3]} seed={8} squash={ht > 0.95 ? Math.sin((frame % 11) / 11 * Math.PI) * 0.4 : 0} />
          </div>
        )}

        {/* hub GEM */}
        <div style={{ position: "absolute", left: hub.x - 90, top: hub.y - 90, width: 180, height: 180, scale: `${hubS}` }}>
          <div
            style={{
              position: "absolute",
              inset: -16,
              borderRadius: "50%",
              border: `3px solid ${C.orange}`,
              opacity: 0.4,
              scale: `${1 + ((frame % 40) / 40) * 0.25}`,
            }}
          />
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 90,
              background: C.orange,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 30px 50px -20px rgba(255,102,0,0.6)",
            }}
          >
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 64, lineHeight: 1 }}>GEM</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "flex-end", height: 34 }}>
              {[0.5, 0.8, 0.4, 1, 0.7].map((v, k) => (
                <div key={k} style={{ width: 10, height: 34 * v * prog(frame, cGem + k * 2, cGem + 12 + k * 2), background: "#fff", borderRadius: 3 }} />
              ))}
            </div>
          </div>
        </div>

        {/* textes */}
        <div style={{ position: "absolute", left: 130, top: 300, width: 640, opacity: 1 - swap, translate: `${-swap * 40}px 0` }}>
          <KeyPhrase phrase={p0} size={112} marker />
        </div>
        <div style={{ position: "absolute", left: 130, top: 290, width: 680 }}>
          <KeyPhrase phrase={p1} size={112} />
          <div style={{ height: 20 }} />
          <KeyPhrase phrase={p2} size={84} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

