import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { DimLine, Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C } from "../theme";
import { Stage, TextBlock } from "../layout";

const S = scene("hook");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Façade d'un bâtiment public (mairie / école) tracée au trait */
type El = { d: string; w?: number; c?: string; fill?: string };
const FACADE: El[] = [
  { d: "M-260 600 L980 600", w: 4 }, // sol
  { d: "M60 600 L60 200 L700 200 L700 600", w: 5 }, // corps
  { d: "M40 200 L80 110 L680 110 L720 200 Z", w: 5 }, // mansarde
  { d: "M300 110 L380 46 L460 110", w: 5 }, // fronton
  { d: "M380 46 L380 -24", w: 4 }, // mât
  { d: "M380 -22 L446 -10 L380 4", w: 4, fill: C.orange, c: C.orange }, // drapeau
  { d: "M60 340 L700 340", w: 3 },
  { d: "M60 460 L700 460", w: 3 },
  // lucarnes
  { d: "M150 196 L150 140 L180 122 L210 140 L210 196", w: 4 },
  { d: "M550 196 L550 140 L580 122 L610 140 L610 196", w: 4 },
  // fenêtres étage 1
  ...[100, 210, 490, 600].map((x) => ({ d: `M${x} 320 L${x} 236 Q${x + 30} 220 ${x + 60} 236 L${x + 60} 320 Z`, w: 4 })),
  ...[100, 210, 490, 600].map((x) => ({ d: `M${x + 30} 228 L${x + 30} 320`, w: 2 })),
  // fenêtres étage 2
  ...[100, 210, 490, 600].map((x) => ({ d: `M${x} 440 L${x} 366 L${x + 60} 366 L${x + 60} 440 Z`, w: 4 })),
  // grande baie centrale + horloge
  { d: "M330 320 L330 236 Q380 206 430 236 L430 320 Z", w: 4 },
  { d: "M350 440 L350 366 L410 366 L410 440 Z", w: 4 },
  // rez-de-chaussée
  ...[100, 210, 490, 600].map((x) => ({ d: `M${x} 580 L${x} 492 L${x + 60} 492 L${x + 60} 580 Z`, w: 4 })),
  { d: "M335 600 L335 516 Q380 474 425 516 L425 600", w: 5 }, // porte
  { d: "M380 497 L380 600", w: 2 },
  { d: "M300 600 L300 588 L460 588 L460 600", w: 3 }, // marches
];

export const S01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const qCue = cue(S, "Mais");
  const mesures = cue(S, "mesures");

  // 1. la goutte orange tombe, rebondit, devient la mascotte
  const dropT = interpolate(frame, [0, 16], [0, 1], { ...clamp, easing: EASE_IN });
  const dropY = interpolate(dropT, [0, 1], [-700, 0]);
  const bounce = frame >= 16 && frame < 30 ? Math.sin(((frame - 16) / 14) * Math.PI) * -90 : 0;
  const morph = pop(frame, 28, 9, 160, 0.7);
  const squash = frame >= 14 && frame < 20 ? 1 - Math.abs(frame - 17) / 3 : interpolate(morph, [0, 0.6, 1], [0, -0.5, 0]);

  // regards
  const lookUp = prog(frame, qCue, qCue + 10);
  const look: [number, number] = [interpolate(lookUp, [0, 1], [0, 0.8]), interpolate(lookUp, [0, 1], [0.2, -1])];
  const mood = frame > mesures - 4 ? "wow" : "happy";

  // 2. façade tracée
  const drawStart = 34;

  // caméra : léger push-in continu + sortie
  const push = interpolate(frame, [0, S.dur], [1.06, 1], { ...clamp, easing: EASE_OUT });
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);

  const mascotX = 985;
  const groundY = 922;
  const MH = 380;

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={prog(frame, 20, 50) * 0.7} drift={0.25} />
      <AbsoluteFill style={{ scale: `${push}`, translate: `0 ${-exit * 40}px` }}>
        <Stage focus={{ x: 770, y: 120, w: 1130, h: 900 }} region={{ y: 700, h: 960 }}>
        {/* Façade */}
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0 }}
        >
          <g transform="translate(1010 232) scale(1.15)">
            {FACADE.map((el, i) => {
              const t = prog(frame, drawStart + i * 1.6, drawStart + i * 1.6 + 26, EASE_IN_OUT);
              return (
                <path
                  key={i}
                  d={el.d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - t}
                  stroke={el.c ?? C.ink}
                  strokeWidth={el.w ?? 4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  fill={el.fill ? el.fill : "none"}
                  fillOpacity={el.fill ? prog(frame, drawStart + 40, drawStart + 56) : 0}
                />
              );
            })}
            {/* horloge */}
            <circle
              cx={380}
              cy={86}
              r={20}
              stroke={C.orange}
              strokeWidth={5}
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - prog(frame, drawStart + 30, drawStart + 50)}
            />
            <line
              x1={380}
              y1={86}
              x2={380 + Math.sin(frame / 9) * 13}
              y2={86 - Math.cos(frame / 9) * 13}
              stroke={C.orange}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={prog(frame, drawStart + 44, drawStart + 50)}
            />
            {/* cotes inconnues */}
            <DimLine x1={60} y1={650} x2={700} y2={650} label="? m" from={cue(S, "connaît")} offset={36} fontSize={30} />
            <DimLine x1={760} y1={600} x2={760} y2={110} label="? m" from={cue(S, "vraiment")} offset={-48} fontSize={30} />
            <DimLine x1={100} y1={175} x2={160} y2={175} label="?" from={mesures - 2} offset={-30} dur={10} fontSize={22} />
            <DimLine x1={490} y1={470} x2={550} y2={470} label="?" from={mesures + 4} offset={-24} dur={10} fontSize={22} />
          </g>
        </svg>

        {/* Mascotte */}
        <div
          style={{
            position: "absolute",
            left: mascotX - MH * 0.4,
            top: groundY - MH + (frame < 16 ? dropY : bounce),
          }}
        >
          {morph < 0.02 ? (
            <div
              style={{
                marginLeft: MH * 0.4 - 34,
                marginTop: MH - 68,
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: C.orange,
                scale: `${1 + Math.max(0, squash) * 0.5} ${1 - Math.max(0, squash) * 0.4}`,
                transformOrigin: "center bottom",
              }}
            />
          ) : (
            <div style={{ scale: `${interpolate(morph, [0, 1], [0.25, 1])}`, transformOrigin: "center bottom" }}>
              <Mascot height={MH} mood={mood} look={look} squash={squash} />
            </div>
          )}
        </div>
        {/* anneau d'apparition */}
        <div
          style={{
            position: "absolute",
            left: mascotX - 150,
            top: groundY - MH - 20,
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: `6px solid ${C.orange}`,
            scale: `${interpolate(frame, [28, 46], [0.2, 1.6], clamp)}`,
            opacity: interpolate(frame, [28, 46], [0.9, 0], clamp),
          }}
        />
        {/* petits « ? » au-dessus de la mascotte */}
        {[0, 1, 2].map((k) => {
          const s = pop(frame, qCue + 4 + k * 6, 10, 180);
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: mascotX - 90 + k * 70,
                top: groundY - MH - 110 - (k % 2) * 36 - s * 20,
                fontFamily: "Jost",
                fontWeight: 900,
                fontSize: 54 + k * 6,
                color: k === 1 ? C.orange : C.ink,
                scale: `${s}`,
                rotate: `${(k - 1) * 14}deg`,
                opacity: s,
              }}
            >
              ?
            </div>
          );
        })}

        </Stage>
        {/* Phrase clé */}
        <TextBlock h={{ left: 130, top: 300, width: 800 }} v={{ top: 280 }}>
          <KeyPhrase phrase={S.phrases[0]} size={124} marker />
          <div
            style={{
              marginTop: 40,
              width: 120,
              height: 10,
              borderRadius: 5,
              background: C.orange,
              transformOrigin: "left",
              scale: `${prog(frame, S.phrases[0].end - 4, S.phrases[0].end + 14, EASE_IN_OUT)} 1`,
            }}
          />
        </TextBlock>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
