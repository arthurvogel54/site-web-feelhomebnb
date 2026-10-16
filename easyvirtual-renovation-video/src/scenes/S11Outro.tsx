import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { KeyPhrase, Logo } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { useV } from "../layout";

const S = scene("outro");

export const S11Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const cLogo = cue(S, "easyVirtual.tours.");
  const ph = S.phrases[0];
  const cta = pop(frame, ph.end + 2, 12, 170);
  const click = ph.end + 34;
  const press = Math.max(0, 1 - Math.abs(frame - click) / 4);
  const cursorT = prog(frame, ph.end + 10, click, EASE_IN_OUT);
  const mascotIn = pop(frame, cLogo + 14, 11, 120);
  const fadeOut = prog(frame, S.dur - 20, S.dur);
  const v = useV();

  return (
    <AbsoluteFill style={{ background: C.orange, overflow: "hidden" }}>
      {/* anneaux de scan */}
      {[0, 1, 2, 3, 4].map((k) => {
        const t = ((frame + k * 30) % 150) / 150;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: (v ? 540 : 960) - 1200,
              top: (v ? 880 : 470) - 1200,
              width: 2400,
              height: 2400,
              borderRadius: "50%",
              border: "3px solid #fff",
              scale: `${0.08 + t * 0.92}`,
              opacity: (1 - t) * 0.2,
            }}
          />
        );
      })}

      <div style={{ position: "absolute", left: 0, right: 0, top: v ? 480 : 250, display: "flex", justifyContent: "center" }}>
        <Logo size={v ? 112 : 164} animateFrom={cLogo - 10} />
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: v ? 780 : 560, display: "flex", justifyContent: "center" }}>
        <KeyPhrase phrase={ph} size={v ? 88 : 104} color={C.white} accent={C.ink} align="center" />
      </div>
      {/* CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, top: v ? 1000 : 740, display: "flex", justifyContent: "center", scale: `${cta * (1 - press * 0.06)}` }}>
        <div
          style={{
            background: C.white,
            color: C.ink,
            borderRadius: 999,
            padding: "26px 54px",
            fontFamily: F.title,
            fontWeight: 800,
            fontSize: v ? 44 : 50,
            display: "flex",
            alignItems: "center",
            gap: 22,
            boxShadow: `0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 ${press * 24}px rgba(255,255,255,0.35)`,
          }}
        >
          easyvirtual.tours
          <div style={{ width: 64, height: 64, borderRadius: 32, background: C.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>→</div>
        </div>
      </div>
      {/* curseur */}
      {cta > 0.5 && (
        <div
          style={{
            position: "absolute",
            left: v ? interpolate(cursorT, [0, 1], [900, 770]) : interpolate(cursorT, [0, 1], [1500, 1130]),
            top: v ? interpolate(cursorT, [0, 1], [1450, 1060]) : interpolate(cursorT, [0, 1], [1040, 800]),
            scale: `${1 - press * 0.15}`,
            opacity: 1 - fadeOut,
          }}
        >
          <svg width={52} height={62} viewBox="0 0 22 26">
            <path d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.6 15.2 L17 15 Z" fill={C.ink} stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {/* mascotte */}
      <div
        style={{
          position: "absolute",
          left: v ? 80 : 150,
          top: v ? 1920 - interpolate(mascotIn, [0, 1], [0, 760]) : 1080 - interpolate(mascotIn, [0, 1], [0, 470]),
          rotate: `${interpolate(mascotIn, [0, 1], [-25, -4])}deg`,
        }}
      >
        <Mascot height={440} mood={frame > click ? "wink" : "happy"} outline="#fff" wave={prog(frame, cLogo + 24, cLogo + 34) * (1 - prog(frame, click + 20, click + 30))} look={[0.7, -0.3]} seed={11} />
      </div>
    </AbsoluteFill>
  );
};
