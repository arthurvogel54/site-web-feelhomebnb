import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, lerp, pop, prog } from "../anim";
import { Card, Chip, Grid, KeyPhrase, useEnter } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { CameraRig, HouseModel, LaserFan, Lights, PointCloud, ScannerBot, useBearTexture } from "../three/House3D";
import { getCloud, STATIONS } from "../three/houseData";

const S = scene("scan");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** planning du scan : chaque station tourne ~42 frames puis saute à la suivante */
const START = 14;
const SCAN = 40;
const MOVE = 12;
export const stationTimes = STATIONS.map((_, i) => START + i * (SCAN + MOVE));

export const S04Scan: React.FC = () => {
  const frame = useCurrentFrame();
  const bearTex = useBearTexture();
  const W = 1920;
  const H = 1080;

  // caméra : gros plan sur la mascotte → plan large en orbite
  const pull = prog(frame, 6, 120, EASE_IN_OUT);
  const orbit = interpolate(frame, [0, S.dur], [-0.55, 0.35]);
  const dist = lerp(5, 17, pull);
  const height = lerp(2.4, 12.5, pull);
  const tgt: [number, number, number] = [lerp(STATIONS[0].p[0], 1.6, pull), lerp(1.1, -0.5, pull), lerp(STATIONS[0].p[2], 0.4, pull)];
  const camPos: [number, number, number] = [tgt[0] + Math.sin(orbit) * dist, height, tgt[2] + Math.cos(orbit) * dist];

  // position du scanner
  let botPos: [number, number, number] = STATIONS[0].p;
  let hop = 0;
  let rotY = 0;
  let scanning = 0;
  stationTimes.forEach((t0, i) => {
    if (frame >= t0) {
      botPos = STATIONS[i].p;
      const local = frame - t0;
      rotY = i * Math.PI * 2 + prog(frame, t0, t0 + SCAN, EASE_IN_OUT) * Math.PI * 2; // multiples de 360° : finit face caméra
      scanning = local < SCAN ? 1 : 0;
      if (local >= SCAN && i < STATIONS.length - 1) {
        const m = prog(frame, t0 + SCAN, t0 + SCAN + MOVE, EASE_IN_OUT);
        const a = STATIONS[i].p;
        const b = STATIONS[i + 1].p;
        botPos = [lerp(a[0], b[0], m), 0, lerp(a[2], b[2], m)];
        hop = Math.sin(m * Math.PI) * 0.6;
      }
    }
  });
  const radii = stationTimes.map((t0) => interpolate(frame, [t0, t0 + SCAN], [0, 9], { ...clamp, easing: EASE_OUT }));
  const lastDone = stationTimes[stationTimes.length - 1] + SCAN;
  const allRevealed = prog(frame, lastDone + 10, lastDone + 30);
  const scanDone = frame > lastDone;

  // progression (≈ nombre de points)
  const total = getCloud().count;
  const progress = Math.min(1, radii.reduce((a, r) => a + Math.min(1, r / 7), 0) / STATIONS.length);
  const pts = Math.round(progress * total * 18.4); // l'échelle réelle d'un scan : plusieurs millions de points
  const stationsDone = stationTimes.filter((t0) => frame > t0 + SCAN).length;
  const rooms = Math.max(0, stationsDone - 1); // les 2 premières stations couvrent le séjour

  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);

  const chip1 = useEnter(cue(S, "caméra"), 30);
  const chip2 = useEnter(cue(S, "LiDAR"), 30);
  const chip3 = useEnter(cue(S, "maison"), 30);
  const panel = useEnter(cue(S, "scanne") - 6, 40);
  const ph = S.phrases[0];

  // chrono : 00:00 → 01:00
  const clockT = prog(frame, ph.start - 20, ph.start + 18, EASE_IN_OUT);
  const minutes = Math.round(clockT * 60);

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit, scale: `${1 + exit * 0.04}` }}>
        {bearTex && <ThreeCanvas width={W} height={H} flat style={{ position: "absolute", inset: 0 }}>
          <CameraRig pos={camPos} target={tgt} fov={34} />
          <Lights />
          <HouseModel opacity={0} wire={1} wireOpacity={0.14 * pull * (1 - allRevealed * 0.5)} lineWidth={1.2} furniture={0} resolution={[W, H]} />
          <PointCloud radii={radii} all={allRevealed} size={1.7} />
          {!scanDone && <LaserFan position={botPos} angle={rotY - Math.PI / 2} opacity={scanning} reach={4.5} />}
          <ScannerBot position={botPos} faceY={Math.atan2(camPos[0] - botPos[0], camPos[2] - botPos[2])} spin={rotY} tex={bearTex} scanning={scanning} hop={hop} scale={lerp(1, 1.25, pull)} />
        </ThreeCanvas>}

        {/* puces techniques */}
        <div style={{ position: "absolute", left: 130, top: 160, display: "flex", gap: 16 }}>
          <div style={chip1.style}>
            <Chip size={30} bg={C.orange}>
              <span style={{ fontFamily: F.title, fontWeight: 800 }}>360°</span> Caméra immersive
            </Chip>
          </div>
          <div style={chip2.style}>
            <Chip size={30}>
              <span style={{ width: 14, height: 14, borderRadius: 7, background: C.orange, boxShadow: `0 0 0 ${4 + Math.sin(frame / 3) * 3}px rgba(255,102,0,0.3)` }} />
              Capteur LiDAR
            </Chip>
          </div>
          <div style={chip3.style}>
            <Chip size={30} bg={C.white} color={C.ink} style={{ border: `2px solid ${C.greyLine}` }}>
              Maison · <b>100 m²</b>
            </Chip>
          </div>
        </div>

        {/* panneau de progression */}
        <div style={{ position: "absolute", right: 120, top: 160, width: 400, ...panel.style }}>
          <Card style={{ padding: 30 }}>
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 17, letterSpacing: "0.18em", color: C.greyText, textTransform: "uppercase" }}>Points capturés</div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 60, color: C.ink, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
              {pts.toLocaleString("fr-FR")}
            </div>
            <div style={{ height: 10, borderRadius: 5, background: C.grey, marginTop: 14, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress * 100}%`, background: C.orange, borderRadius: 5 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontFamily: F.body, fontSize: 24, color: C.ink }}>
              <span>Pièces scannées</span>
              <b style={{ fontFamily: F.title, fontSize: 30 }}>
                <span style={{ color: C.orange }}>{rooms}</span> / 4
              </b>
            </div>
          </Card>
        </div>

        {/* phrase clé + chrono */}
        <div style={{ position: "absolute", left: 130, bottom: 120, display: "flex", alignItems: "center", gap: 40 }}>
          {(() => {
            const s = pop(frame, ph.start - 22, 13, 160);
            return (
              <div style={{ width: 150, height: 150, borderRadius: 75, background: C.orange, position: "relative", scale: `${s}`, boxShadow: "0 30px 50px -20px rgba(255,102,0,0.6)" }}>
                <svg width={150} height={150} viewBox="0 0 150 150" style={{ position: "absolute", inset: 0 }}>
                  <circle cx={75} cy={75} r={54} stroke="#fff" strokeOpacity={0.35} strokeWidth={10} fill="none" />
                  <circle
                    cx={75}
                    cy={75}
                    r={54}
                    stroke="#fff"
                    strokeWidth={10}
                    fill="none"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - clockT}
                    transform="rotate(-90 75 75)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, fontSize: minutes === 60 ? 46 : 40, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                  {minutes === 60 ? "1 h" : `${minutes}'`}
                </div>
              </div>
            );
          })()}
          <KeyPhrase phrase={ph} size={120} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

