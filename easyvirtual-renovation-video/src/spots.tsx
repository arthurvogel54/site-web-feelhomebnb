import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import "./theme";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, prog } from "./anim";
import { SCENE_COMPONENTS } from "./scenes";
import { AUDIO_CLIPS } from "./timeline";
import { SPOTS, spotPlan } from "./spotPlan";
import { C, F, FPS } from "./theme";
import { VO } from "./vo-timings";

/**
 * SPOTS 30-40 s (TikTok / Instagram / LinkedIn) montés à partir des scènes du film,
 * de la voix off et d'un habillage musical recomposé (scripts/music/compose.py).
 *
 * Chaque plan = une scène jouée entre deux frames (relatives à la scène). Le minutage interne
 * des scènes est inchangé : la voix reste synchronisée, seules les respirations sont raccourcies.
 */
const MIX = { underVoice: 0.24, between: 0.45, sfx: 0.55, voice: 1 };

const SpotTransitions: React.FC<{ cuts: { at: number; kind: "panel" | "iris" }[] }> = ({ cuts }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  return (
    <>
      {cuts.map((c, i) => {
        const d = frame - c.at;
        if (d < -16 || d > 18) return null;
        if (c.kind === "iris") {
          const r = interpolate(d, [-14, 0], [0, 2.4 * Math.max(width, height)], { ...clamp, easing: EASE_IN });
          return d < 0 ? (
            <AbsoluteFill key={i}>
              <div style={{ position: "absolute", left: width / 2 - r / 2, top: height * 0.5 - r / 2, width: r, height: r, borderRadius: "50%", background: C.orange }} />
            </AbsoluteFill>
          ) : null;
        }
        const yB = d < 0 ? interpolate(d, [-13, -3], [100, 0], { ...clamp, easing: EASE_IN }) : interpolate(d, [3, 15], [0, -100], { ...clamp, easing: EASE_IN_OUT });
        const yO = d < 0 ? interpolate(d, [-10, 0], [100, 0], { ...clamp, easing: EASE_IN }) : interpolate(d, [0, 11], [0, -100], { ...clamp, easing: EASE_OUT });
        return (
          <AbsoluteFill key={i} style={{ overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: C.ink, translate: `0 ${yB}%` }} />
            <div style={{ position: "absolute", inset: 0, background: C.orange, translate: `0 ${yO}%` }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

/** bandeau discret : marque + cible */
const SpotHeader: React.FC<{ label: string; hideRanges: [number, number][] }> = ({ label, hideRanges }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = height > width;
  const hidden = hideRanges.some(([a, b]) => frame >= a - 6 && frame < b + 2);
  const vis = prog(frame, 6, 20) * (hidden ? 0 : 1);
  return (
    <div
      style={{
        position: "absolute",
        left: v ? 70 : 120,
        right: v ? 70 : 120,
        top: v ? 150 : 64,
        display: "flex",
        justifyContent: "space-between",
        fontFamily: F.body,
        fontWeight: 700,
        fontSize: v ? 17 : 19,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "#4A4A4A",
        opacity: vis,
        borderBottom: `2px solid ${C.greyLine}`,
        paddingBottom: 16,
      }}
    >
      <span>easyVirtual.tours</span>
      <span style={{ color: C.orange }}>{label}</span>
    </div>
  );
};

export const Spot: React.FC<{ name: string }> = ({ name }) => {
  const { shots, total } = spotPlan(name);
  const spot = SPOTS[name];

  // ducking de la musique sous la voix
  const speaking = new Uint8Array(total + 1);
  for (const s of shots)
    for (const w of s.sc.words) {
      if (w.at < s.from || w.endAt > s.to) continue;
      for (let f = Math.max(0, s.at + w.at - s.from - 4); f <= Math.min(total, s.at + w.endAt - s.from + 8); f++) speaking[f] = 1;
    }
  const r = Math.round(FPS * 0.25);
  const vol = (f: number) => {
    let n = 0;
    for (let k = -r; k <= r; k++) n += speaking[Math.min(total, Math.max(0, Math.round(f) + k))];
    return MIX.between + (MIX.underVoice - MIX.between) * (n / (2 * r + 1));
  };
  const volTable = new Float32Array(total + 1).map((_, f) => vol(f));

  const orange = shots.filter((s) => s.id === "marque" || s.id === "outro").map((s) => [s.at, s.at + s.dur] as [number, number]);

  return (
    <AbsoluteFill style={{ background: C.white }}>
      {shots.map((s, i) => {
        const Comp = SCENE_COMPONENTS[s.id];
        const clip = AUDIO_CLIPS.find((c) => c.id === s.id);
        return (
          <Sequence key={i} name={`${s.id} ${s.from}→${s.to}`} from={s.at} durationInFrames={s.dur} premountFor={30}>
            <Sequence from={-s.from} layout="absolute-fill">
              <Comp />
              {VO.audioFile && clip && (
                <Sequence from={Math.round(clip.at * FPS) - s.sc.from} layout="none">
                  <Audio src={staticFile(VO.audioFile)} trimBefore={Math.round(clip.from * FPS)} trimAfter={Math.round(clip.to * FPS)} volume={MIX.voice} />
                </Sequence>
              )}
            </Sequence>
          </Sequence>
        );
      })}
      <SpotHeader label={spot.label} hideRanges={orange} />
      <SpotTransitions cuts={shots.slice(1).map((s) => ({ at: s.at, kind: s.cut ?? "panel" }))} />
      <Audio src={staticFile(`audio/${spot.music}-music.mp3`)} volume={(f) => volTable[Math.min(total, Math.max(0, Math.round(f)))]} />
      <Audio src={staticFile(`audio/${spot.music}-sfx.mp3`)} volume={MIX.sfx} />
    </AbsoluteFill>
  );
};

export const SPOT_NAMES = Object.keys(SPOTS);
export { spotPlan };
