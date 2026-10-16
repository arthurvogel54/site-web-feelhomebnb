import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, lerp, pop, prog } from "../anim";
import { BEAR, Mascot } from "../components/Mascot";
import { useV } from "../layout";
import { Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { HeartDoc } from "./S08Collectivites";

const S = scene("recap");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Icon360 = () => (
  <svg width={120} height={120} viewBox="0 0 60 60">
    <ellipse cx={30} cy={32} rx={26} ry={10} fill="none" stroke={C.ink} strokeWidth={3.5} />
    <path d="M50 26 L56 32 L48 36" fill="none" stroke={C.orange} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
    <text x={30} y={24} textAnchor="middle" fontFamily="Jost" fontWeight={800} fontSize={16} fill={C.orange}>360°</text>
  </svg>
);
const IconPlan = () => (
  <svg width={120} height={120} viewBox="0 0 60 60">
    <rect x={6} y={8} width={48} height={40} fill="none" stroke={C.ink} strokeWidth={3.5} />
    <path d="M30 8 V30 M30 30 H54 M18 48 V36" stroke={C.ink} strokeWidth={3} />
    <path d="M6 54 H54" stroke={C.orange} strokeWidth={3} />
    <path d="M6 51 V57 M54 51 V57" stroke={C.orange} strokeWidth={3} />
  </svg>
);
const IconBIM = () => (
  <svg width={120} height={120} viewBox="0 0 60 60">
    <path d="M30 6 L52 18 L52 42 L30 54 L8 42 L8 18 Z" fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M8 18 L30 30 L52 18 M30 30 V54" stroke={C.ink} strokeWidth={3} fill="none" />
    <path d="M30 6 L52 18 L30 30 L8 18 Z" fill={C.orange} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </svg>
);

export const S10Recap: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    { t: "Visite virtuelle", icon: <Icon360 />, at: cue(S, "Visite") },
    { t: "Plans 2D & 3D", icon: <IconPlan />, at: cue(S, "plans,") },
    { t: "Maquette BIM", icon: <IconBIM />, at: cue(S, "maquette") },
    { t: "Carnet de santé numérique", icon: <HeartDoc size={120} />, at: cue(S, "carnet") },
  ];
  const [p0, p1] = S.phrases;
  const gather = prog(frame, p0.start - 18, p0.start + 2, EASE_IN);
  const mascot = pop(frame, p0.start - 6, 10, 150);
  const exit = prog(frame, S.dur - 10, S.dur, EASE_IN);
  const v = useV();
  const cx = v ? 540 : 960;
  const flash = interpolate(frame, [p0.start - 4, p0.start - 1, p0.start + 12], [0, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit }}>
        {cards.map((c, i) => {
          const s = pop(frame, c.at - 4, 12, 160);
          const cw = v ? 420 : 360;
          const ch = v ? 430 : 400;
          const x0 = v ? 90 + (i % 2) * 480 : 150 + i * 420;
          const y0 = v ? 290 + Math.floor(i / 2) * 470 : 330;
          const x = lerp(x0, cx - cw / 2, gather);
          const y = lerp(y0, v ? 620 : 360, gather);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: cw,
                height: ch,
                borderRadius: 34,
                background: C.white,
                border: `3px solid ${i === 3 ? C.orange : C.greyLine}`,
                boxShadow: "0 40px 60px -30px rgba(0,0,0,0.25)",
                padding: 34,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                scale: `${s * (1 - gather * 0.85)}`,
                rotate: `${gather * (i - 1.5) * 20}deg`,
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp) * (1 - prog(frame, p0.start - 4, p0.start + 2)),
                translate: `0 ${interpolate(s, [0, 1], [60, 0])}px`,
              }}
            >
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 54, color: C.orange }}>{String(i + 1).padStart(2, "0")}</div>
              <div>{c.icon}</div>
              <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: 38, lineHeight: 1.05, color: C.ink }}>{c.t}</div>
            </div>
          );
        })}

        {/* flash d'absorption */}
        <div style={{ position: "absolute", left: cx - 400, top: (v ? 820 : 520) - 400, width: 800, height: 800, borderRadius: "50%", background: C.orange, opacity: flash * 0.25, scale: `${1 - flash * 0.6}` }} />
        {[0, 1, 2].map((k) => {
          const t = prog(frame, p0.start + k * 8, p0.start + 40 + k * 8);
          return (
            <div key={k} style={{ position: "absolute", left: cx - 300, top: (v ? 800 : 330) - 300, width: 600, height: 600, borderRadius: "50%", border: `4px solid ${C.orange}`, scale: `${0.3 + t}`, opacity: t > 0 ? (1 - t) * 0.6 : 0 }} />
          );
        })}

        {/* mascotte */}
        <div style={{ position: "absolute", left: cx - ((v ? 480 : 360) * BEAR.ratio) / 2, top: v ? 560 : 150, scale: `${mascot}`, transformOrigin: "center bottom" }}>
          <Mascot height={v ? 480 : 360} mood="happy" scanning look={[0, 0.2]} seed={10} />
        </div>

        <div style={{ position: "absolute", left: 40, right: 40, top: v ? 1150 : 600, display: "flex", justifyContent: "center" }}>
          <KeyPhrase phrase={p0} size={v ? 104 : 120} align="center" />
        </div>
        <div style={{ position: "absolute", left: 40, right: 40, top: v ? 1290 : 750, display: "flex", justifyContent: "center" }}>
          <KeyPhrase phrase={p1} size={v ? 92 : 120} align="center" marker />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

