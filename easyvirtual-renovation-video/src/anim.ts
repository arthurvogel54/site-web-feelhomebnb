import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./theme";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo out
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const BACK_OUT = Easing.bezier(0.34, 1.56, 0.64, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entre f0 et f1 avec easing */
export const prog = (frame: number, f0: number, f1: number, easing = EASE_OUT) =>
  interpolate(frame, [f0, f1], [0, 1], { ...clamp, easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** ressort démarrant à `from` */
export const pop = (frame: number, from: number, damping = 12, stiffness = 140, mass = 0.8) =>
  spring({ frame: frame - from, fps: FPS, config: { damping, stiffness, mass } });

export const sec = (s: number) => Math.round(s * FPS);

/** entrée + sortie : 0 → 1 → 0 */
export const inOut = (frame: number, a: number, b: number, c: number, d: number) =>
  interpolate(frame, [a, b, c, d], [0, 1, 1, 0], { ...clamp, easing: EASE_IN_OUT });

/** pseudo-aléatoire déterministe */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
