import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";

/**
 * Double format : 16:9 (1920×1080) et Reel Instagram 9:16 (1080×1920).
 * Les scènes sont dessinées dans un repère 1920×1080 ; en vertical :
 *   - les visuels passent dans <Stage> qui recadre/agrandit une zone (focus) dans une bande de l'écran ;
 *   - les textes passent dans <TextBlock> qui les remonte en haut, sur toute la largeur.
 * Zones de sécurité Reel : contenu important entre y ≈ 230 et y ≈ 1650.
 */
export const useV = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

export type Rect = { x: number; y: number; w: number; h: number };

/** visuels : en vertical, la zone `focus` (repère 1920×1080) est ajustée dans la bande `region` */
export const Stage: React.FC<{ focus: Rect; region: { y: number; h: number }; children: React.ReactNode; style?: React.CSSProperties }> = ({
  focus,
  region,
  children,
  style,
}) => {
  const v = useV();
  if (!v) return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
  const s = Math.min(1040 / focus.w, region.h / focus.h);
  const dx = (1080 - focus.w * s) / 2 - focus.x * s;
  const dy = region.y + (region.h - focus.h * s) / 2 - focus.y * s;
  return (
    <AbsoluteFill style={style}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${dx}px, ${dy}px) scale(${s})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** bloc de texte : position 16:9 (`h`) ou verticale (`v`, par défaut en haut, pleine largeur) */
export const TextBlock: React.FC<{
  h: { left: number; top: number; width: number };
  v?: { left?: number; top: number; width?: number };
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ h, v, children, style }) => {
  const isV = useV();
  const p = isV ? { left: v?.left ?? 70, top: v?.top ?? 260, width: v?.width ?? 940 } : h;
  return <div style={{ position: "absolute", ...p, ...style }}>{children}</div>;
};

/** choisit une valeur selon le format */
export const useHV = () => {
  const v = useV();
  return <T,>(h: T, vv: T) => (v ? vv : h);
};
