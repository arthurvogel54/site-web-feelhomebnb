import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BACK_OUT, EASE_IN, EASE_IN_OUT, EASE_OUT, pop, prog } from "../anim";
import { Phrase } from "../timeline";
import { C, F } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ */
/* Phrase clé — apparition mot à mot synchronisée à la voix off        */
/* ------------------------------------------------------------------ */
export const KeyPhrase: React.FC<{
  phrase: Phrase;
  size: number;
  color?: string;
  accent?: string;
  align?: "left" | "center" | "right";
  maxWidth?: number;
  exitAt?: number; // frame de sortie
  weight?: number;
  lineHeight?: number;
  marker?: boolean; // surlignage orange sous les mots accentués
  strike?: { word: string; at: number }; // rature animée d'un mot
  style?: React.CSSProperties;
}> = ({
  phrase,
  size,
  color = C.ink,
  accent = C.orange,
  align = "left",
  maxWidth,
  exitAt,
  weight = 800,
  lineHeight = 1.02,
  marker = false,
  strike,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: F.title,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing: "-0.02em",
        color,
        textAlign: align,
        maxWidth,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        columnGap: size * 0.26,
        ...style,
      }}
    >
      {phrase.words.map((w, i) => {
        const s = pop(frame, w.at, 14, 170, 0.7);
        const out = exitAt !== undefined ? prog(frame, exitAt + i * 1.5, exitAt + i * 1.5 + 12, EASE_IN) : 0;
        const y = interpolate(s, [0, 1], [105, 0]) - out * 105;
        const mk = marker && w.accent ? prog(frame, w.at + 6, w.at + 20, EASE_IN_OUT) : 0;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: size * 0.12,
              marginBottom: -size * 0.12,
              paddingTop: size * 0.04,
              position: "relative",
            }}
          >
            {marker && w.accent && (
              <span
                style={{
                  position: "absolute",
                  left: -size * 0.06,
                  right: -size * 0.06,
                  bottom: size * 0.16,
                  height: size * 0.26,
                  background: C.orange,
                  opacity: 0.22 * (1 - out),
                  transformOrigin: "left center",
                  scale: `${mk} 1`,
                  borderRadius: 6,
                }}
              />
            )}
            <span
              style={{
                display: "inline-block",
                translate: `0 ${y}%`,
                rotate: `${interpolate(s, [0, 1], [6, 0])}deg`,
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                color: w.accent ? accent : color,
                transformOrigin: "left bottom",
                position: "relative",
              }}
            >
              {w.text}
            </span>
            {strike && w.text.startsWith(strike.word) && (
              <span
                style={{
                  position: "absolute",
                  left: -size * 0.04,
                  right: -size * 0.04,
                  top: "52%",
                  height: size * 0.09,
                  borderRadius: size * 0.05,
                  background: C.orange,
                  transformOrigin: "left center",
                  scale: `${prog(frame, strike.at, strike.at + 12, EASE_IN_OUT)} 1`,
                  rotate: "-3deg",
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Logo — fichier officiel easyVirtual.tours (blanc, fond transparent)  */
/* public/logo/ : wordmark + tagline séparés pour l'animation           */
/* ------------------------------------------------------------------ */
const LOGO_W = 1360;
const WORDMARK_H = 152;
const TAGLINE_H = 116;

export const Logo: React.FC<{
  size: number; // échelle : largeur du logo ≈ size × 8,4 px
  tagline?: boolean;
  animateFrom?: number;
}> = ({ size, tagline = true, animateFrom }) => {
  const frame = useCurrentFrame();
  const w = size * 8.4;
  const k = w / LOGO_W;
  const anim = animateFrom !== undefined;
  const s = anim ? pop(frame, animateFrom, 12, 140, 0.8) : 1;
  const wipe = anim ? prog(frame, animateFrom, animateFrom + 16, EASE_OUT) : 1;
  const tag = anim ? prog(frame, animateFrom + 14, animateFrom + 30) : 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: w }}>
      <Img
        src={staticFile("logo/logo-wordmark.png")}
        style={{
          width: w,
          height: WORDMARK_H * k,
          clipPath: `inset(-10% ${(1 - wipe) * 100}% -10% 0)`,
          scale: `${interpolate(s, [0, 1], [0.86, 1])}`,
          translate: `0 ${interpolate(s, [0, 1], [size * 0.25, 0])}px`,
        }}
      />
      {tagline && (
        <Img
          src={staticFile("logo/logo-tagline.png")}
          style={{
            width: w,
            height: TAGLINE_H * k,
            opacity: tag,
            translate: `0 ${(1 - tag) * size * 0.15}px`,
          }}
        />
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Pastilles                                                           */
/* ------------------------------------------------------------------ */
export const Tag: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  bg = C.orange,
  color = C.white,
  size = 22,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.5,
      background: bg,
      color,
      fontFamily: F.body,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      padding: `${size * 0.55}px ${size * 1.05}px`,
      borderRadius: 999,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Chip: React.FC<{ children: React.ReactNode; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  bg = C.ink,
  color = C.white,
  size = 30,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      background: bg,
      color,
      fontFamily: F.body,
      fontWeight: 600,
      fontSize: size,
      padding: `${size * 0.42}px ${size * 0.85}px`,
      borderRadius: 999,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** Sticker blanc incliné à contour noir — « Spoiler… ça marche. » */
export const Sticker: React.FC<{ children: React.ReactNode; size?: number; rotate?: number; style?: React.CSSProperties }> = ({
  children,
  size = 40,
  rotate = -4,
  style,
}) => (
  <div
    style={{
      display: "inline-block",
      background: C.white,
      color: C.ink,
      border: `${Math.max(3, size * 0.08)}px solid ${C.ink}`,
      borderRadius: 999,
      padding: `${size * 0.3}px ${size * 0.75}px`,
      fontFamily: F.title,
      fontWeight: 800,
      fontSize: size,
      rotate: `${rotate}deg`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Cotation — ligne de cote qui se trace, avec étiquette               */
/* ------------------------------------------------------------------ */
export const DimLine: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  from: number;
  color?: string;
  dur?: number;
  offset?: number; // décalage perpendiculaire de l'étiquette
  fontSize?: number;
  strokeWidth?: number;
}> = ({ x1, y1, x2, y2, label, from, color = C.orange, dur = 18, offset = -22, fontSize = 26, strokeWidth = 3 }) => {
  const frame = useCurrentFrame();
  const t = prog(frame, from, from + dur, EASE_IN_OUT);
  const lab = pop(frame, from + dur * 0.6, 12, 180);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const nx = -Math.sin(ang);
  const ny = Math.cos(ang);
  const mx = (x1 + x2) / 2 + nx * offset;
  const my = (y1 + y2) / 2 + ny * offset;
  const tick = 12;
  const deg = (ang * 180) / Math.PI;
  const readable = deg > 90 || deg < -90 ? deg + 180 : deg;
  return (
    <g opacity={t > 0 ? 1 : 0}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={len}
        strokeDashoffset={len * (1 - t)}
      />
      {[
        [x1, y1],
        [x2, y2],
      ].map(([x, y], i) => (
        <line
          key={i}
          x1={x + nx * tick}
          y1={y + ny * tick}
          x2={x - nx * tick}
          y2={y - ny * tick}
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={i === 0 ? Math.min(1, t * 5) : t > 0.95 ? 1 : 0}
        />
      ))}
      <g transform={`translate(${mx} ${my}) rotate(${readable}) scale(${lab})`}>
        <rect x={-fontSize * label.length * 0.33 - 10} y={-fontSize * 0.75} width={fontSize * label.length * 0.66 + 20} height={fontSize * 1.5} rx={fontSize * 0.75} fill={color} />
        <text textAnchor="middle" y={fontSize * 0.36} fontFamily={F.body} fontWeight={700} fontSize={fontSize} fill="#fff">
          {label}
        </text>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ */
/* Fond technique — grille très légère                                 */
/* ------------------------------------------------------------------ */
export const Grid: React.FC<{ opacity?: number; step?: number; color?: string; drift?: number }> = ({
  opacity = 1,
  step = 60,
  color = "#EEEEEE",
  drift = 0,
}) => {
  const frame = useCurrentFrame();
  const o = (frame * drift) % step;
  return (
    <div
      style={{
        position: "absolute",
        inset: -step,
        opacity,
        backgroundImage: `linear-gradient(${color} 1.5px, transparent 1.5px), linear-gradient(90deg, ${color} 1.5px, transparent 1.5px)`,
        backgroundSize: `${step}px ${step}px`,
        translate: `${o}px ${o}px`,
      }}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Carte blanche arrondie (style plaquette)                            */
/* ------------------------------------------------------------------ */
export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  variant?: "white" | "grey" | "black" | "orange" | "outline";
}> = ({ children, style, variant = "white" }) => {
  const v = {
    white: { background: C.white, border: `2px solid ${C.greyLine}`, color: C.ink },
    grey: { background: C.grey, border: "2px solid transparent", color: C.ink },
    black: { background: C.black, border: "2px solid transparent", color: C.white },
    orange: { background: C.orange, border: "2px solid transparent", color: C.white },
    outline: { background: C.white, border: `3px solid ${C.orange}`, color: C.ink },
  }[variant];
  return (
    <div style={{ borderRadius: 32, padding: 36, boxShadow: "0 30px 60px -30px rgba(0,0,0,0.18)", ...v, ...style }}>{children}</div>
  );
};

/** entrée standard : glisse + fondu + léger scale (ressort) */
export const useEnter = (from: number, distance = 60, damping = 15) => {
  const frame = useCurrentFrame();
  const s = pop(frame, from, damping, 150, 0.8);
  return {
    s,
    style: {
      opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
      translate: `0 ${interpolate(s, [0, 1], [distance, 0])}px`,
    } as React.CSSProperties,
  };
};

export const Check: React.FC<{ size?: number; color?: string; progress?: number }> = ({ size = 36, color = C.orange, progress = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path
      d="M4 12.5 L9.5 18 L20 6.5"
      stroke={color}
      strokeWidth={3.2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={26}
      strokeDashoffset={26 * (1 - progress)}
    />
  </svg>
);

export { BACK_OUT, EASE_OUT };
