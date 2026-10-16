import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { Check, Grid, KeyPhrase } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";

const S = scene("formats");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FILES = [
  { ext: "DWG", sub: "Plans & coupes", bg: C.ink, fg: C.white },
  { ext: "PDF", sub: "Prêt à imprimer", bg: C.white, fg: C.ink },
  { ext: "IFC", sub: "Maquette ouverte", bg: C.orange, fg: C.white },
  { ext: "RVT", sub: "Revit natif", bg: C.ink, fg: C.orange },
];
const SOFT = ["Revit", "ArchiCAD", "AutoCAD", "SketchUp"];
// liaisons fichier → logiciel (index FILES → index SOFT)
const LINKS: [number, number][] = [
  [3, 0],
  [2, 0],
  [2, 1],
  [0, 2],
  [0, 3],
];

const FX = (i: number) => 330 + i * 420; // centres des fichiers
const SX = (i: number) => 330 + i * 420; // centres des logiciels
const FY = 250;
const SY = 760;

const Doc: React.FC<{ ext: string; sub: string; bg: string; fg: string }> = ({ ext, sub, bg, fg }) => (
  <div style={{ position: "relative", width: 230, height: 290 }}>
    <svg width={230} height={290} viewBox="0 0 230 290" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 30px 30px rgba(0,0,0,0.18))" }}>
      <path d="M24 4 H160 L226 70 V262 Q226 286 202 286 H24 Q4 286 4 262 V28 Q4 4 24 4 Z" fill={bg} stroke={bg === C.white ? C.ink : bg} strokeWidth={4} />
      <path d="M160 4 V50 Q160 70 180 70 H226" fill={bg === C.white ? C.grey : "rgba(255,255,255,0.18)"} stroke={bg === C.white ? C.ink : "none"} strokeWidth={4} />
    </svg>
    <div style={{ position: "absolute", left: 0, right: 0, top: 104, textAlign: "center", fontFamily: F.title, fontWeight: 800, fontSize: 70, color: fg, letterSpacing: "-0.01em" }}>{ext}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 196, textAlign: "center", fontFamily: F.body, fontWeight: 600, fontSize: 20, color: fg === C.orange ? "#fff" : fg, opacity: 0.85 }}>{sub}</div>
  </div>
);

export const S07Formats: React.FC = () => {
  const frame = useCurrentFrame();
  const fileCues = [cue(S, "DWG"), cue(S, "PDF"), cue(S, "IFC"), cue(S, "RVT")];
  const softCues = [cue(S, "Revit"), cue(S, "ArchiCAD"), cue(S, "AutoCAD"), cue(S, "SketchUp")];
  const cOpen = cue(S, "s'ouvrent");
  const p1 = S.phrases[0];
  const p2 = S.phrases[1];
  const partOut = prog(frame, p1.start - 16, p1.start, EASE_IN);
  const p2t = prog(frame, p2.start - 6, p2.start + 10, EASE_IN_OUT);
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);
  const lift = prog(frame, cOpen - 4, cOpen + 14, EASE_IN_OUT);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit }}>
        {/* ---------- partie A : formats → logiciels ---------- */}
        <AbsoluteFill style={{ translate: `0 ${-partOut * 140}px`, opacity: 1 - partOut }}>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {LINKS.map(([f, s], i) => {
              const t = prog(frame, softCues[s] - 6 + (i % 2) * 3, softCues[s] + 10 + (i % 2) * 3, EASE_IN_OUT);
              const x1 = FX(f);
              const y1 = FY + 300 - lift * 20;
              const x2 = SX(s);
              const y2 = SY - 6;
              return (
                <path
                  key={i}
                  d={`M${x1} ${y1} C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2}`}
                  stroke={C.orange}
                  strokeWidth={5}
                  fill="none"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - t}
                />
              );
            })}
          </svg>
          {FILES.map((f, i) => {
            const s = pop(frame, fileCues[i] - 4, 11, 170, 0.8);
            const float = Math.sin((frame + i * 20) / 22) * 6;
            return (
              <div
                key={f.ext}
                style={{
                  position: "absolute",
                  left: FX(i) - 115,
                  top: FY + float - lift * 20,
                  scale: `${s * (1 - lift * 0.08)}`,
                  rotate: `${interpolate(s, [0, 1], [-18 + i * 9, (i - 1.5) * 2.5])}deg`,
                  opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                  transformOrigin: "center bottom",
                }}
              >
                <Doc {...f} />
              </div>
            );
          })}
          {SOFT.map((name, i) => {
            const s = pop(frame, softCues[i] - 2, 12, 180);
            return (
              <div
                key={name}
                style={{
                  position: "absolute",
                  left: SX(i) - 170,
                  top: SY,
                  width: 340,
                  display: "flex",
                  justifyContent: "center",
                  scale: `${s}`,
                  opacity: s,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: C.ink,
                    color: C.white,
                    borderRadius: 999,
                    padding: "20px 34px",
                    fontFamily: F.body,
                    fontWeight: 700,
                    fontSize: 40,
                    boxShadow: "0 24px 40px -20px rgba(0,0,0,0.4)",
                  }}
                >
                  {name}
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={30} color="#fff" progress={prog(frame, softCues[i] + 4, softCues[i] + 14)} />
                  </div>
                </div>
              </div>
            );
          })}
          {/* légende */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 930,
              textAlign: "center",
              fontFamily: F.body,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.2em",
              color: C.greyText,
              textTransform: "uppercase",
              opacity: prog(frame, softCues[0], softCues[0] + 12),
            }}
          >
            Directement dans vos logiciels
          </div>
        </AbsoluteFill>

        {/* ---------- partie B : phrases clés ---------- */}
        {/* croquis d'architecte qui se dessine en fond */}
        <svg width={1920} height={1080} viewBox="0 -40 1920 1080" style={{ position: "absolute", inset: 0, opacity: 0.9 }}>
          {[
            "M560 900 C 760 900 820 800 1000 800 S 1200 900 1360 840 S 1600 760 1760 800",
            "M560 960 L1780 960",
            "M1380 920 L1380 640 L1560 520 L1740 640 L1740 920",
            "M1430 920 L1430 780 L1500 780 L1500 920",
            "M1590 720 L1680 720 L1680 800 L1590 800 Z",
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={i === 0 ? C.orange : "#CFCFCF"}
              strokeWidth={i === 0 ? 5 : 3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - prog(frame, p2.start - 4 + i * 5, p2.start + 40 + i * 5, EASE_IN_OUT)}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: interpolate(p2t, [0, 1], [400, 270]),
            display: "flex",
            justifyContent: "center",
            scale: `${interpolate(p2t, [0, 1], [1, 0.72])}`,
            opacity: interpolate(p2t, [0, 1], [1, 0.45]),
          }}
        >
          <KeyPhrase phrase={p1} size={128} align="center" strike={{ word: "remodélisez", at: p1.end - 2 }} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 410, display: "flex", justifyContent: "center" }}>
          <KeyPhrase phrase={p2} size={196} align="center" />
        </div>
        {/* mascotte */}
        <div style={{ position: "absolute", left: 180, top: 1080 - 420 * pop(frame, p2.start + 6, 11, 130) }}>
          <Mascot height={400} mood="wink" thumbsUp={prog(frame, p2.start + 14, p2.start + 24)} look={[0.5, -0.2]} seed={7} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
