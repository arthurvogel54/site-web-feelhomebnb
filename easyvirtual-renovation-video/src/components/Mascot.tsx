import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";

/**
 * LA MASCOTTE — petite caméra 360° orange dont les deux objectifs sont les yeux.
 * Tout est piloté par la frame (rendu image par image, aucun CSS animation).
 *
 * ⚠️ Si vous disposez du fichier officiel de la mascotte easyVirtual.tours,
 * c'est ce seul fichier à remplacer : toutes les scènes utilisent <Mascot />.
 */
export type Mood = "happy" | "wow" | "sad" | "wink" | "focus";

type Props = {
  height: number;
  mood?: Mood;
  look?: [number, number]; // -1..1
  wave?: number; // 0..1 intensité du coucou (bras droit)
  waveLeft?: number;
  scanning?: boolean;
  spin?: number; // angle en tours (1 = 360°) — la caméra tourne sur elle-même
  squash?: number; // 0 = neutre, >0 écrasé, <0 étiré
  legs?: boolean;
  seed?: number; // décale les clignements
  thumbsUp?: number; // 0..1 bras gauche levé
  outline?: string; // contour (ex. blanc sur fond orange)
  style?: React.CSSProperties;
};

const EYE_L = { x: 96, y: 128 };
const EYE_R = { x: 144, y: 128 };

export const Mascot: React.FC<Props> = ({
  height,
  mood = "happy",
  look = [0, 0],
  wave = 0,
  waveLeft = 0,
  scanning = false,
  spin = 0,
  squash = 0,
  legs = true,
  seed = 0,
  thumbsUp = 0,
  outline,
  style,
}) => {
  const f = useCurrentFrame() + seed * 37;

  // Clignement : toutes les ~3,4 s, double clignement une fois sur trois
  const period = 102;
  const p = f % period;
  const cycle = Math.floor(f / period);
  const blinkAt = (x: number) => Math.max(0, 1 - Math.abs(p - x) / 3);
  const blink = Math.max(blinkAt(4), cycle % 3 === 1 ? blinkAt(12) : 0);
  const eyeScaleY = mood === "focus" ? 0.55 : 1 - blink * 0.92;

  // respiration
  const breathe = Math.sin(f / 14) * 0.012;
  const sy = 1 - squash * 0.18 + breathe;
  const sx = 1 + squash * 0.14 - breathe * 0.6;

  // rotation 360 : on simule la 3D par un scaleX et un décalage du visage
  const ang = spin * Math.PI * 2;
  const faceShift = Math.sin(ang) * 46;
  const faceVis = Math.cos(ang); // <0 : dos
  const bodyScaleX = 0.86 + 0.14 * Math.abs(Math.cos(ang));

  const lx = look[0] * 6;
  const ly = look[1] * 5;

  const waveRot = wave > 0 ? -110 * wave + Math.sin(f / 3.2) * 22 * wave : 0;
  const waveLRot = waveLeft > 0 ? 110 * waveLeft - Math.sin(f / 3.2) * 22 * waveLeft : 0;
  const thumbRot = thumbsUp * 125;

  const scanPulse = scanning ? 0.5 + 0.5 * Math.sin(f / 2.5) : 0;

  const eye = (cx: number, cy: number, isRight: boolean) => {
    const winkClosed = mood === "wink" && isRight;
    if (winkClosed) {
      return (
        <path
          d={`M${cx - 16} ${cy + 2} Q${cx} ${cy - 12} ${cx + 16} ${cy + 2}`}
          stroke={C.ink}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
        />
      );
    }
    const r = mood === "wow" ? 21 : 19;
    return (
      <g transform={`translate(${cx} ${cy}) scale(1 ${eyeScaleY})`}>
        {/* bague d'objectif */}
        <circle r={r + 4} fill="#2B2B2B" />
        <circle r={r} fill={C.ink} />
        {/* reflets de lentille */}
        <circle cx={lx} cy={ly} r={r * 0.62} fill="#1F2633" />
        <circle cx={lx} cy={ly} r={r * 0.36} fill="#0A0A0A" />
        <circle cx={lx - 6} cy={ly - 7} r={5.6} fill="#fff" />
        <circle cx={lx + 6} cy={ly + 6} r={2.4} fill="#fff" opacity={0.9} />
      </g>
    );
  };

  const mouth = () => {
    switch (mood) {
      case "wow":
        return <ellipse cx={120} cy={162} rx={8} ry={10} fill={C.ink} />;
      case "sad":
        return <path d="M108 166 Q120 156 132 166" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />;
      case "focus":
        return <path d="M111 162 L129 162" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />;
      default:
        return (
          <path d="M105 156 Q120 172 135 156 Q120 164 105 156 Z" fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        );
    }
  };

  const brows = () => {
    if (mood === "sad")
      return (
        <>
          <path d="M80 98 L106 92" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <path d="M160 98 L134 92" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    if (mood === "wow")
      return (
        <>
          <path d="M82 90 Q95 82 108 89" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
          <path d="M132 89 Q145 82 158 90" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      );
    if (mood === "focus")
      return (
        <>
          <path d="M82 102 L108 106" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <path d="M158 102 L132 106" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        </>
      );
    return null;
  };

  const vbH = legs ? 330 : 270;
  const width = (height * 240) / vbH;
  const uid = `m${seed}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 240 ${vbH}`} style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={`${uid}body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A3D" />
          <stop offset="0.45" stopColor={C.orange} />
          <stop offset="1" stopColor="#E35400" />
        </linearGradient>
        <linearGradient id={`${uid}face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1F1F1" />
        </linearGradient>
        <radialGradient id={`${uid}glow`}>
          <stop offset="0" stopColor="#FFB27A" />
          <stop offset="1" stopColor={C.orange} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${uid}clip`}>
          <rect x={40} y={44} width={160} height={190} rx={72} />
        </clipPath>
      </defs>

      {/* ombre portée */}
      <ellipse cx={120} cy={vbH - 14} rx={78 * (1 + squash * 0.2)} ry={10} fill="#000" opacity={0.1} />

      {/* trépied */}
      {legs && (
        <g stroke={C.ink} strokeLinecap="round">
          <line x1={120} y1={236} x2={62} y2={vbH - 18} strokeWidth={8} />
          <line x1={120} y1={236} x2={178} y2={vbH - 18} strokeWidth={8} />
          <line x1={120} y1={236} x2={120} y2={vbH - 12} strokeWidth={8} />
          <rect x={104} y={226} width={32} height={20} rx={6} fill={C.ink} strokeWidth={0} />
        </g>
      )}

      <g transform={`translate(120 ${legs ? 236 : 236}) scale(${sx * bodyScaleX} ${sy}) translate(-120 -236)`}>
        {/* bras */}
        <g transform={`rotate(${-waveLRot - thumbRot} 46 156)`}>
          <rect x={18} y={146} width={40} height={22} rx={11} fill="#E35400" />
          {thumbsUp > 0.5 && <rect x={16} y={132} width={14} height={22} rx={7} fill="#E35400" />}
        </g>
        <g transform={`rotate(${-waveRot} 194 156)`}>
          <rect x={182} y={146} width={40} height={22} rx={11} fill="#E35400" />
        </g>

        {/* antenne LiDAR */}
        <line x1={120} y1={48} x2={120} y2={22} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        {scanning && <circle cx={120} cy={16} r={26 + scanPulse * 10} fill={`url(#${uid}glow)`} opacity={0.9} />}
        <circle cx={120} cy={16} r={10} fill={C.ink} />
        <circle cx={120} cy={16} r={4.5} fill={scanning ? "#FFD2B0" : C.orange} />

        {/* corps */}
        {outline && <rect x={32} y={36} width={176} height={206} rx={80} fill={outline} />}
        <rect x={40} y={44} width={160} height={190} rx={72} fill={`url(#${uid}body)`} />
        <g clipPath={`url(#${uid}clip)`}>
          {/* reflet spéculaire */}
          <ellipse cx={78 + faceShift * 0.3} cy={78} rx={26} ry={14} fill="#fff" opacity={0.22} transform="rotate(-30 78 78)" />
          {/* bande ventrale */}
          <rect x={40} y={196} width={160} height={8} fill="#000" opacity={0.08} />
          {/* face (masquée de dos) */}
          {faceVis > -0.15 && (
            <g transform={`translate(${faceShift} 0)`} opacity={Math.min(1, (faceVis + 0.15) * 3)}>
              <rect x={62} y={84} width={116} height={100} rx={42} fill={`url(#${uid}face)`} />
              <ellipse cx={80} cy={158} rx={9} ry={6} fill={C.orange} opacity={0.28} />
              <ellipse cx={160} cy={158} rx={9} ry={6} fill={C.orange} opacity={0.28} />
              {brows()}
              {eye(EYE_L.x, EYE_L.y, false)}
              {eye(EYE_R.x, EYE_R.y, true)}
              {mouth()}
            </g>
          )}
          {/* dos : grille du capteur */}
          {faceVis < 0.2 && (
            <g transform={`translate(${-faceShift} 0)`} opacity={Math.min(1, (0.2 - faceVis) * 3)}>
              <rect x={86} y={100} width={68} height={68} rx={20} fill="#000" opacity={0.18} />
              <circle cx={120} cy={134} r={16} fill={C.ink} />
              <circle cx={120} cy={134} r={7} fill="#2C3445" />
            </g>
          )}
        </g>
        {/* petit badge "360" sur le ventre */}
        <text
          x={120 + faceShift * 0.6}
          y={220}
          textAnchor="middle"
          fontFamily="Jost"
          fontWeight={800}
          fontSize={18}
          fill="#fff"
          opacity={Math.max(0, faceVis) * 0.95}
        >
          360°
        </text>
      </g>
    </svg>
  );
};
