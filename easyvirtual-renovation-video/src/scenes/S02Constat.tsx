import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { Card, Chip, Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { Stage, TextBlock, useV } from "../layout";

const S = scene("constat");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Person: React.FC<{ fill: string; size: number }> = ({ fill, size }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 40 56">
    <circle cx={20} cy={12} r={10} fill={fill} />
    <path d="M2 56 L2 38 Q2 25 20 25 Q38 25 38 38 L38 56 Z" fill={fill} />
  </svg>
);

/** Plan griffonné à la main dans le carnet */
const SKETCH = [
  "M40 40 L42 300 L318 296 L314 38 Z",
  "M40 170 L180 172 L182 300",
  "M182 172 L182 120",
  "M200 40 L198 120",
  "M250 296 L252 230 L316 228",
];

export const S02Constat: React.FC = () => {
  const frame = useCurrentFrame();
  const v = useV();
  const c6 = cue(S, "6");
  const cReleve = cue(S, "relèvent");
  const cTele = cue(S, "Télémètre");
  const cCarnet = cue(S, "carnet");
  const cCroquis = cue(S, "croquis");
  const cChaque = cue(S, "chaque");
  const cRetour = cue(S, "retour");

  const exitLeft = cChaque - 4;
  const toRoad = prog(frame, cChaque - 6, cChaque + 14, EASE_IN_OUT);
  const exitAll = prog(frame, S.dur - 10, S.dur, EASE_IN);

  // route : cabinet → chantier, aller-retour
  const P0 = { x: 120, y: 420 };
  const P1 = { x: 380, y: 60 };
  const P2 = { x: 660, y: 330 };
  const bez = (t: number) => ({
    x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t ** 2 * P2.x,
    y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t ** 2 * P2.y,
  });
  const tripStart = cChaque + 10;
  const tripLen = 34;
  const tf = Math.max(0, frame - tripStart);
  const leg = Math.floor(tf / tripLen);
  const lt = (tf % tripLen) / tripLen;
  const eased = EASE_IN_OUT(lt);
  const tCar = leg % 2 === 0 ? eased : 1 - eased;
  const car = bez(tCar);
  const carNext = bez(Math.min(1, Math.max(0, tCar + (leg % 2 === 0 ? 0.02 : -0.02))));
  const carAng = (Math.atan2(carNext.y - car.y, carNext.x - car.x) * 180) / Math.PI;
  const trips = 1 + Math.floor(tf / (tripLen * 2));

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden", translate: `0 ${-exitAll * 30}px`, opacity: 1 - exitAll * 0.3 }}>
      <Grid opacity={0.6} drift={0.2} />

      {/* ---------------- Colonne gauche ---------------- */}
      <TextBlock h={{ left: 130, top: 250, width: 820 }} v={{ top: 250 }}>
        <KeyPhrase phrase={S.phrases[0]} size={v ? 92 : 112} exitAt={exitLeft} />
        <KeyPhrase phrase={S.phrases[1]} size={v ? 92 : 112} exitAt={exitLeft + 3} marker />
        {/* pictogrammes */}
        <div style={{ display: "flex", gap: 22, marginTop: 64 }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const s = pop(frame, 8 + i * 2.2, 12, 170);
            const on = prog(frame, c6 + i * 3, c6 + i * 3 + 6);
            const out = prog(frame, exitLeft + i, exitLeft + i + 10, EASE_IN);
            const filled = i < 6;
            return (
              <div
                key={i}
                style={{
                  scale: `${s * (1 + (filled ? Math.sin(on * Math.PI) * 0.18 : 0))}`,
                  translate: `0 ${out * -80}px`,
                  opacity: 1 - out,
                  transformOrigin: "center bottom",
                }}
              >
                <Person size={52} fill={filled && on > 0.5 ? C.orange : "#D9D9D9"} />
              </div>
            );
          })}
        </div>
      </TextBlock>
      {/* phrase 3 */}
      <TextBlock h={{ left: 130, top: 330, width: 760 }} v={{ top: 300 }}>
        <div
          style={{
            fontFamily: F.title,
            fontWeight: 700,
            fontSize: 54,
            color: C.greyText,
            marginBottom: 18,
            opacity: prog(frame, cChaque, cChaque + 12),
            translate: `0 ${(1 - prog(frame, cChaque, cChaque + 16)) * 30}px`,
          }}
        >
          Une cote oubliée ?
        </div>
        <KeyPhrase phrase={S.phrases[2]} size={124} />
      </TextBlock>

      <Stage focus={{ x: 980, y: 170, w: 900, h: 850 }} region={{ y: 880, h: 760 }}>
      {/* ---------------- Scène de droite : carnet + télémètre ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 1010,
          top: 210,
          width: 780,
          height: 720,
          opacity: 1 - toRoad,
          scale: `${1 - toRoad * 0.08}`,
          translate: `${toRoad * -60}px 0`,
        }}
      >
        {/* carnet */}
        {(() => {
          const s = pop(frame, cReleve - 6, 14, 120);
          const bump = cCarnet <= frame ? Math.sin(Math.min(1, (frame - cCarnet) / 8) * Math.PI) * 0.04 : 0;
          return (
            <div
              style={{
                position: "absolute",
                left: 60,
                top: 40,
                width: 520,
                height: 600,
                rotate: `${interpolate(s, [0, 1], [-14, -4])}deg`,
                scale: `${s + bump}`,
                opacity: s,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#FFFDF6",
                  borderRadius: 18,
                  border: `3px solid ${C.ink}`,
                  boxShadow: "0 40px 70px -30px rgba(0,0,0,0.3)",
                  backgroundImage: "repeating-linear-gradient(#FFFDF6 0 34px, #E7EDF5 34px 36px)",
                }}
              />
              {/* spirale */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{ position: "absolute", left: 30 + i * 40, top: -16, width: 14, height: 34, borderRadius: 7, border: `4px solid ${C.ink}`, background: "#fff" }}
                />
              ))}
              <svg style={{ position: "absolute", left: 80, top: 90 }} width={360} height={340} viewBox="0 0 360 340">
                {SKETCH.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - prog(frame, cCroquis - 30 + i * 6, cCroquis - 6 + i * 6, EASE_IN_OUT)}
                    stroke="#3B4A6B"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
              {[
                { t: "3,85", x: 190, y: 64, at: cCarnet - 4, r: -3 },
                { t: "4,1 ?", x: 20, y: 250, at: cCarnet + 4, r: -82 },
                { t: "2,7…", x: 300, y: 300, at: cCroquis, r: 2 },
                { t: "??", x: 330, y: 470, at: cCroquis + 8, r: -6 },
              ].map((n, i) => {
                const s2 = pop(frame, n.at, 12, 200);
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: n.x,
                      top: n.y,
                      fontFamily: F.hand,
                      fontWeight: 600,
                      fontSize: 52,
                      color: i === 3 ? C.orange : "#3B4A6B",
                      rotate: `${n.r}deg`,
                      scale: `${s2}`,
                      opacity: s2,
                    }}
                  >
                    {n.t}
                  </div>
                );
              })}
              {/* crayon */}
              {(() => {
                const pt = prog(frame, cCroquis - 30, cCroquis + 20, EASE_IN_OUT);
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: 120 + Math.sin(pt * 9) * 120 + pt * 160,
                      top: 160 + Math.cos(pt * 7) * 80 + pt * 120,
                      width: 26,
                      height: 220,
                      rotate: "32deg",
                      transformOrigin: "bottom center",
                      translate: "0 -220px",
                      opacity: prog(frame, cCroquis - 34, cCroquis - 26) * (1 - prog(frame, cCroquis + 24, cCroquis + 32)),
                    }}
                  >
                    <div style={{ width: 26, height: 30, background: C.orangeSoft, borderRadius: "6px 6px 0 0", border: `3px solid ${C.ink}` }} />
                    <div style={{ width: 26, height: 160, background: C.yellow, border: `3px solid ${C.ink}`, borderTop: "none" }} />
                    <div style={{ width: 0, height: 0, marginLeft: 0, borderLeft: "13px solid transparent", borderRight: "13px solid transparent", borderTop: `30px solid ${C.ink}` }} />
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* télémètre laser */}
        {(() => {
          const s = pop(frame, cTele - 4, 13, 150);
          const val = interpolate(frame, [cTele + 4, cTele + 22], [0, 4.27], clamp);
          return (
            <div style={{ position: "absolute", left: 470, top: 360, scale: `${s}`, rotate: `${interpolate(s, [0, 1], [30, 12])}deg`, opacity: s }}>
              <div
                style={{
                  position: "absolute",
                  left: -560,
                  top: 70,
                  width: 560,
                  height: 4,
                  background: `linear-gradient(90deg, rgba(255,40,0,0), #FF2A00)`,
                  transformOrigin: "right",
                  scale: `${prog(frame, cTele + 2, cTele + 10)} 1`,
                  boxShadow: "0 0 12px #FF2A00",
                }}
              />
              <div style={{ width: 170, height: 300, background: C.ink, borderRadius: 30, padding: 18, boxShadow: "0 40px 60px -20px rgba(0,0,0,0.4)" }}>
                <div style={{ height: 110, borderRadius: 14, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.body, fontWeight: 700, fontSize: 38, color: C.white }}>
                  {val.toFixed(2).replace(".", ",")}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 22, justifyContent: "center" }}>
                  {[0, 1, 2].map((k) => (
                    <div key={k} style={{ width: 30, height: 30, borderRadius: 15, background: "#3A3A3A" }} />
                  ))}
                </div>
                <div style={{ marginTop: 18, height: 70, borderRadius: 35, background: "#2B2B2B" }} />
              </div>
            </div>
          );
        })()}
      </div>

      {/* ---------------- Scène de droite : aller-retours chantier ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 220,
          width: 800,
          height: 700,
          opacity: toRoad,
          scale: `${0.92 + toRoad * 0.08}`,
          translate: `${(1 - toRoad) * 80}px 0`,
        }}
      >
        <Card variant="grey" style={{ position: "absolute", inset: 0, padding: 0, overflow: "hidden" }}>
          <svg width={800} height={700} viewBox="0 0 800 700" style={{ position: "absolute", left: 0, top: 80 }}>
            <path
              d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
              stroke="#CFCFCF"
              strokeWidth={34}
              fill="none"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - prog(frame, cChaque, cChaque + 18, EASE_IN_OUT)}
            />
            <path
              d={`M${P0.x} ${P0.y} Q${P1.x} ${P1.y} ${P2.x} ${P2.y}`}
              stroke="#fff"
              strokeWidth={4}
              strokeDasharray="18 18"
              fill="none"
              opacity={prog(frame, cChaque + 10, cChaque + 20)}
            />
            {/* voiture */}
            <g transform={`translate(${car.x} ${car.y}) rotate(${carAng})`} opacity={frame >= tripStart - 4 ? 1 : 0}>
              <rect x={-34} y={-18} width={68} height={36} rx={12} fill={C.orange} />
              <rect x={-4} y={-14} width={24} height={28} rx={6} fill="#fff" opacity={0.85} />
              <circle cx={-20} cy={-20} r={7} fill={C.ink} />
              <circle cx={20} cy={-20} r={7} fill={C.ink} />
              <circle cx={-20} cy={20} r={7} fill={C.ink} />
              <circle cx={20} cy={20} r={7} fill={C.ink} />
            </g>
          </svg>
          {/* épingles */}
          {[
            { p: P0, label: "Cabinet", at: cChaque + 4 },
            { p: P2, label: "Chantier", at: cChaque + 10 },
          ].map((pin, i) => {
            const s = pop(frame, pin.at, 11, 180);
            return (
              <div key={i} style={{ position: "absolute", left: pin.p.x - 90, top: pin.p.y + 80 - 150, width: 180, display: "flex", flexDirection: "column", alignItems: "center", scale: `${s}`, transformOrigin: "center bottom" }}>
                <Chip size={26} bg={i ? C.orange : C.ink}>{pin.label}</Chip>
                <div style={{ width: 6, height: 50, background: i ? C.orange : C.ink }} />
                <div style={{ width: 22, height: 22, borderRadius: 11, background: i ? C.orange : C.ink, marginTop: -6 }} />
              </div>
            );
          })}
          {/* compteur */}
          <div style={{ position: "absolute", left: 40, top: 36, display: "flex", gap: 16, opacity: prog(frame, cRetour - 6, cRetour + 6) }}>
            <Chip size={30} bg={C.white} color={C.ink} style={{ border: `2px solid ${C.greyLine}` }}>
              ≈ 1 h de route
            </Chip>
            <Chip size={30} bg={C.ink}>
              Aller-retour <span style={{ color: C.orange, fontFamily: F.title, fontWeight: 800 }}>×{Math.max(1, trips)}</span>
            </Chip>
          </div>
        </Card>
        {/* mascotte dépitée */}
        <div style={{ position: "absolute", right: -30, bottom: -40, scale: `${pop(frame, cChaque + 16, 12, 140)}`, transformOrigin: "bottom center" }}>
          <Mascot height={260} mood="sad" look={[-0.8, 0.3]} seed={2} />
        </div>
      </div>
      </Stage>
    </AbsoluteFill>
  );
};

