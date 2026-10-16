import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { KeyPhrase, Logo, Sticker } from "../components/ui";
import { cue, scene } from "../timeline";
import { C } from "../theme";
import { useV } from "../layout";

const S = scene("marque");

export const S03Marque: React.FC = () => {
  const frame = useCurrentFrame();
  const cLogo = cue(S, "easyVirtual");
  const ph = S.phrases[0];
  const lift = prog(frame, ph.start - 10, ph.start + 8, EASE_IN_OUT);
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);
  const mascotIn = pop(frame, cue(S, "numérique") - 8, 10, 120, 0.9);
  const v = useV();
  const cy = v ? 960 : 540;
  const cx = v ? 540 : 960;

  return (
    <AbsoluteFill style={{ background: C.orange, overflow: "hidden" }}>
      {/* anneaux de scan */}
      {[0, 1, 2, 3, 4].map((k) => {
        const t = ((frame + k * 24) % 120) / 120;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: cx - 1100,
              top: cy - 1100,
              width: 2200,
              height: 2200,
              borderRadius: "50%",
              border: "3px solid #fff",
              scale: `${0.1 + t * 0.9}`,
              opacity: (1 - t) * 0.22,
            }}
          />
        );
      })}

      <AbsoluteFill style={{ scale: `${1 + exit * 0.08}`, opacity: 1 - exit }}>
        {/* logo */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: v ? interpolate(lift, [0, 1], [560, 360]) : interpolate(lift, [0, 1], [400, 190]),
            display: "flex",
            justifyContent: "center",
            scale: `${interpolate(lift, [0, 1], [1, v ? 0.82 : 0.62])}`,
          }}
        >
          <Logo size={v ? 112 : 150} animateFrom={cLogo - 8} />
        </div>

        {/* phrase clé */}
        <div style={{ position: "absolute", left: v ? 60 : 160, right: v ? 60 : 160, top: v ? 640 : 480, display: "flex", justifyContent: "center" }}>
          <KeyPhrase phrase={ph} size={v ? 100 : 112} color={C.white} accent={C.ink} align="center" maxWidth={v ? 960 : 1500} />
        </div>

        {/* sticker */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: v ? 1040 : 790,
            display: "flex",
            justifyContent: "center",
            scale: `${pop(frame, Math.min(ph.end - 6, ph.start + 24), 9, 200)}`,
          }}
        >
          <Sticker size={v ? 34 : 44} rotate={-3}>
            Rénovation · Plans 2D &amp; 3D · BIM
          </Sticker>
        </div>

        {/* mascotte */}
        <div
          style={{
            position: "absolute",
            left: v ? 80 : 120,
            top: v ? 1920 - interpolate(mascotIn, [0, 1], [0, 720]) : 1080 - interpolate(mascotIn, [0, 1], [0, 420]),
            rotate: `${interpolate(mascotIn, [0, 1], [-20, -6])}deg`,
          }}
        >
          <Mascot height={v ? 460 : 420} mood="happy" outline="#fff" wave={prog(frame, cue(S, "numérique"), cue(S, "numérique") + 10)} look={[0.6, -0.4]} seed={3} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
