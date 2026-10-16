import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE_IN, EASE_IN_OUT, EASE_OUT } from "../anim";
import { scene } from "../timeline";
import { C } from "../theme";

/**
 * Transitions plein cadre posées à cheval sur les coupes (comme des calques
 * d'ajustement dans After Effects).
 */
type Kind = "panel" | "iris" | "panelDown";
const CUTS: { to: string; kind: Kind; x?: number; y?: number }[] = [
  { to: "constat", kind: "panel" },
  { to: "marque", kind: "iris", x: 0.5, y: 0.55 },
  { to: "scan", kind: "panelDown" },
  { to: "visite", kind: "panel" },
  { to: "livrables", kind: "panel" },
  { to: "collectivites", kind: "panel" },
  { to: "recap", kind: "panel" },
  { to: "outro", kind: "iris", x: 0.5, y: 0.45 },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Transitions: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <>
      {CUTS.map((c) => {
        const b = scene(c.to).from;
        const d = frame - b;
        if (d < -16 || d > 18) return null;
        if (c.kind === "iris") {
          const r = interpolate(d, [-14, 0], [0, 2.4 * Math.max(width, height)], { ...clamp, easing: EASE_IN });
          return (
            <AbsoluteFill key={c.to} style={{ pointerEvents: "none" }}>
              {d < 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: c.x! * width - r / 2,
                    top: c.y! * height - r / 2,
                    width: r,
                    height: r,
                    borderRadius: "50%",
                    background: C.orange,
                  }}
                />
              )}
            </AbsoluteFill>
          );
        }
        // double volet (noir puis orange) qui balaie l'écran
        const dir = c.kind === "panelDown" ? -1 : 1;
        const yB = d < 0
          ? interpolate(d, [-13, -3], [100, 0], { ...clamp, easing: EASE_IN })
          : interpolate(d, [3, 15], [0, -100], { ...clamp, easing: EASE_IN_OUT });
        const yO = d < 0
          ? interpolate(d, [-10, 0], [100, 0], { ...clamp, easing: EASE_IN })
          : interpolate(d, [0, 11], [0, -100], { ...clamp, easing: EASE_OUT });
        return (
          <AbsoluteFill key={c.to} style={{ pointerEvents: "none", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: C.ink, translate: `0 ${yB * dir}%` }} />
            <div style={{ position: "absolute", inset: 0, background: C.orange, translate: `0 ${yO * dir}%` }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};
