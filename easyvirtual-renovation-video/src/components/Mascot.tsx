import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";

/**
 * LA MASCOTTE — l'ours easyVirtual.tours et sa caméra 360° sur trépied.
 * Illustration : public/mascotte/ours.png (fond transparent, recadrée au plus juste).
 *
 * L'image étant fixe, le personnage s'anime par le mouvement (respiration,
 * rebonds, inclinaisons, entrées) et par des effets autour de la caméra (scan).
 */
export type Mood = "happy" | "wow" | "sad" | "wink" | "focus";

export const BEAR = {
  src: "mascotte/ours.png",
  ratio: 774 / 1434, // largeur / hauteur
  lens: { x: 0.363, y: 0.214 }, // position de l'objectif dans l'image (0..1)
};

type Props = {
  height: number;
  mood?: Mood;
  look?: [number, number]; // -1..1 : penche légèrement vers la direction regardée
  wave?: number; // 0..1 : se dandine (salut joyeux)
  waveLeft?: number;
  scanning?: boolean; // ondes de scan depuis l'objectif
  spin?: number; // tours : se retourne (retournement horizontal)
  squash?: number; // >0 écrasé, <0 étiré
  legs?: boolean; // conservé pour compatibilité
  seed?: number;
  thumbsUp?: number; // 0..1 : petit saut de contentement
  outline?: string; // contour (ex. blanc sur fond orange)
  flip?: boolean; // miroir horizontal
  style?: React.CSSProperties;
};

export const Mascot: React.FC<Props> = ({
  height,
  mood = "happy",
  look = [0, 0],
  wave = 0,
  waveLeft = 0,
  scanning = false,
  spin = 0,
  squash = 0,
  seed = 0,
  thumbsUp = 0,
  outline,
  flip = false,
  style,
}) => {
  const f = useCurrentFrame() + seed * 37;
  const width = height * BEAR.ratio;

  // respiration + léger balancement
  const breathe = Math.sin(f / 16) * 0.012;
  const sway = Math.sin(f / 37) * 1.1;
  const wiggle = Math.max(wave, waveLeft) * Math.sin(f / 3.4) * 6;
  const moodRot = { happy: 0, wow: 0, sad: -4, wink: 4, focus: 3 }[mood];
  const moodScale = mood === "wow" ? 1 + Math.max(0, Math.sin(f / 5)) * 0.025 : 1;
  const hop = thumbsUp > 0 ? Math.sin(Math.min(1, thumbsUp) * Math.PI) * height * 0.08 : 0;

  const sy = (1 - squash * 0.16 + breathe) * moodScale;
  const sx = (1 + squash * 0.12 - breathe * 0.5) * moodScale;
  const turn = Math.cos(spin * Math.PI * 2);
  const mirror = (flip ? -1 : 1) * (Math.abs(turn) < 0.04 ? 0.04 * Math.sign(turn || 1) : turn);

  const o = outline ? Math.max(3, height * 0.012) : 0;
  const outlineFilter = outline
    ? [
        [o, 0],
        [-o, 0],
        [0, o],
        [0, -o],
        [o * 0.7, o * 0.7],
        [-o * 0.7, o * 0.7],
        [o * 0.7, -o * 0.7],
        [-o * 0.7, -o * 0.7],
      ]
        .map(([x, y]) => `drop-shadow(${x.toFixed(1)}px ${y.toFixed(1)}px 0 ${outline})`)
        .join(" ")
    : "";
  const moodFilter = mood === "sad" ? " saturate(0.75) brightness(0.97)" : "";

  const lensX = (flip ? 1 - BEAR.lens.x : BEAR.lens.x) * width;
  const lensY = BEAR.lens.y * height;

  return (
    <div style={{ position: "relative", width, height, ...style }}>
      {/* ombre au sol */}
      <div
        style={{
          position: "absolute",
          left: width * 0.05,
          right: width * 0.05,
          bottom: -height * 0.012,
          height: height * 0.04,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.13)",
          filter: `blur(${height * 0.01}px)`,
          scale: `${1 + squash * 0.15 - hop / height} 1`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 100%",
          translate: `0 ${-hop}px`,
          rotate: `${sway + wiggle + moodRot + look[0] * 3}deg`,
          scale: `${sx * mirror} ${sy}`,
        }}
      >
        <Img src={staticFile(BEAR.src)} style={{ width, height, filter: (outlineFilter + moodFilter).trim() || undefined }} />
        {/* ondes de scan depuis l'objectif */}
        {scanning &&
          [0, 1, 2].map((k) => {
            const t = ((f + k * 12) % 36) / 36;
            const r = height * (0.04 + t * 0.32);
            return (
              <div
                key={k}
                style={{
                  position: "absolute",
                  left: lensX - r,
                  top: lensY - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  border: `${Math.max(2, height * 0.008)}px solid ${outline ? "#fff" : C.orange}`,
                  opacity: (1 - t) * 0.8,
                }}
              />
            );
          })}
        {scanning && (
          <div
            style={{
              position: "absolute",
              left: lensX - height * 0.03,
              top: lensY - height * 0.03,
              width: height * 0.06,
              height: height * 0.06,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,210,170,0.95), rgba(255,102,0,0))",
              opacity: 0.6 + 0.4 * Math.sin(f / 2.5),
            }}
          />
        )}
        {/* clin d'œil : petite étincelle */}
        {mood === "wink" && (
          <svg
            width={height * 0.12}
            height={height * 0.12}
            viewBox="-10 -10 20 20"
            style={{ position: "absolute", left: width * 0.86, top: height * 0.04, rotate: `${f * 3}deg` }}
          >
            <path d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z" fill={outline ? "#fff" : C.orange} />
          </svg>
        )}
      </div>
    </div>
  );
};
