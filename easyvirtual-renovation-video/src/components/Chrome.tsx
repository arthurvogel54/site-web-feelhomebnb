import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, prog } from "../anim";
import { SCENES } from "../timeline";
import { C, F } from "../theme";

/** En-tête façon plaquette : marque à gauche, section à droite, filet. */
export const Chrome: React.FC = () => {
  const frame = useCurrentFrame();
  const i = SCENES.findIndex((s) => frame >= s.from && frame < s.from + s.dur);
  if (i < 0) return null;
  const s = SCENES[i];
  if (!s.section) return null;
  const local = frame - s.from;
  const prevSame = i > 0 && SCENES[i - 1].section === s.section;
  const nextSame = i < SCENES.length - 1 && SCENES[i + 1].section === s.section;
  const inT = prevSame ? 1 : prog(local, 4, 22);
  const outT = nextSame ? 0 : prog(local, s.dur - 10, s.dur, EASE_IN_OUT);
  const vis = inT * (1 - outT);
  const sectionIndex = [...new Set(SCENES.filter((x) => x.section).map((x) => x.section))].indexOf(s.section) + 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 64,
        height: 40,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: F.body,
        fontWeight: 700,
        fontSize: 19,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#4A4A4A",
        opacity: vis,
      }}
    >
      <div style={{ translate: `${interpolate(vis, [0, 1], [-20, 0])}px 0` }}>easyVirtual.tours — Rénovation · BIM · Plans</div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", translate: `${interpolate(vis, [0, 1], [20, 0])}px 0` }}>
        <span style={{ color: C.orange }}>{String(sectionIndex).padStart(2, "0")}</span>
        <span>{s.section}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -18,
          height: 2,
          background: C.greyLine,
          transformOrigin: "left",
          scale: `${vis} 1`,
        }}
      />
    </div>
  );
};
