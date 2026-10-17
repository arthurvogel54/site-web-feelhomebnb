import React from "react";
import { AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import "../theme";
import { EASE_IN, EASE_IN_OUT, EASE_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { Card, Check, Chip, Grid, KeyPhrase, Logo, Sticker, useEnter } from "../components/ui";
import { SpotTransitions } from "../spots";
import { C, F, FPS } from "../theme";
import { CameraRig, HouseModel, Lights, project } from "../three/House3D";
import { LX, LZ } from "../three/houseData";
import { cue } from "../timeline";
import { SIN } from "./timeline";
import { SINISTRE_VO } from "./vo";

/* Film « Assurances & gestion de sinistre » — 1080×1920, sans prix. */
const sc = SIN.scene;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = 1080;

const Top: React.FC<{ children: React.ReactNode; top?: number }> = ({ children, top = 270 }) => (
  <div style={{ position: "absolute", left: 70, top, width: 940 }}>{children}</div>
);

const exitStyle = (frame: number, dur: number) => {
  const e = prog(frame, dur - 12, dur, EASE_IN);
  return { opacity: 1 - e, translate: `0 ${-e * 30}px` };
};

/* ---------------- 1. La statistique ---------------- */
const Stat: React.FC = () => {
  const S = sc("stat");
  const f = useCurrentFrame();
  const cChute = cue(S, "chute");
  const v = interpolate(f, [cChute, cue(S, "68") + 6], [93, 68], { ...clamp, easing: EASE_IN_OUT });
  const arcIn = prog(f, 20, 60, EASE_OUT);
  const R = 330;
  const len = Math.PI * R;
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <Top>
          <KeyPhrase phrase={S.phrases[0]} size={84} color={C.greyText} />
          <div style={{ height: 14 }} />
          <KeyPhrase phrase={S.phrases[1]} size={112} />
        </Top>
        <svg width={W} height={600} style={{ position: "absolute", left: 0, top: 760 }} viewBox={`0 0 ${W} 600`}>
          <path d={`M ${540 - R} 420 A ${R} ${R} 0 0 1 ${540 + R} 420`} stroke={C.grey} strokeWidth={46} fill="none" strokeLinecap="round" />
          <path
            d={`M ${540 - R} 420 A ${R} ${R} 0 0 1 ${540 + R} 420`}
            stroke={v < 80 ? C.orange : C.ink}
            strokeWidth={46}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - (v / 100) * arcIn)}
          />
        </svg>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1000, textAlign: "center", fontFamily: F.title, fontWeight: 800, fontSize: 210, color: v < 80 ? C.orange : C.ink, opacity: arcIn, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(v)}
          <span style={{ fontSize: 110 }}>%</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1250, textAlign: "center", fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.greyText, opacity: arcIn }}>
          de satisfaction assuré
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1330, display: "flex", justifyContent: "center", ...useEnter(cue(S, "trois") - 4, 30).style }}>
          <Chip size={30}>
            <span style={{ color: C.orange, fontFamily: F.title, fontWeight: 800 }}>+ 3 mois</span> de traitement
          </Chip>
        </div>
        <div style={{ position: "absolute", left: 70, right: 70, top: 1590, fontFamily: F.body, fontSize: 18, color: "#9A9A9A", textAlign: "center", opacity: arcIn }}>
          Source : étude Deloitte × Guidewire, « Les Français face aux sinistres IARD », 2021
        </div>
        <div style={{ position: "absolute", right: 60, top: 1920 - 520 * pop(f, cChute + 6, 12, 120) }}>
          <Mascot height={330} mood="sad" look={[-0.8, -0.3]} seed={21} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 2. Un dossier fragmenté ---------------- */
const Polaroid: React.FC<{ variant: number }> = ({ variant }) => (
  <div style={{ width: 250, height: 290, background: "#fff", borderRadius: 14, padding: 14, boxShadow: "0 24px 40px -18px rgba(0,0,0,0.35)", border: `2px solid ${C.greyLine}` }}>
    <svg width={222} height={200} viewBox="0 0 222 200" style={{ background: "#EDE7DF", borderRadius: 8 }}>
      <polygon points="0,200 222,200 180,140 40,140" fill="#CDB89E" />
      <rect x={60 + variant * 20} y={40} width={70} height={60} fill="#C9D9E4" stroke={C.ink} strokeWidth={3} />
      <ellipse cx={120} cy={170} rx={70 - variant * 10} ry={14} fill="#7FA6C9" opacity={0.6} />
      <rect x={0} y={0} width={222} height={200} fill="#000" opacity={0.18 + variant * 0.08} />
    </svg>
    <div style={{ fontFamily: F.hand, fontSize: 30, color: C.ink, marginTop: 6, textAlign: "center" }}>{["salon ?", "cuisine…", "photo floue"][variant]}</div>
  </div>
);

const Fragments: React.FC = () => {
  const S = sc("fragments");
  const f = useCurrentFrame();
  const cFrag = cue(S, "fragmenté.");
  const shake = f > cFrag ? Math.sin(f * 1.7) * 6 * Math.max(0, 1 - (f - cFrag) / 30) : 0;
  const items = [
    { x: 80, y: 720, r: -9, at: cue(S, "Photos"), el: <Polaroid variant={0} /> },
    { x: 400, y: 660, r: 6, at: cue(S, "Photos") + 5, el: <Polaroid variant={1} /> },
    { x: 720, y: 760, r: -4, at: cue(S, "incomplètes,"), el: <Polaroid variant={2} /> },
    {
      x: 110,
      y: 1150,
      r: 4,
      at: cue(S, "appels,"),
      el: (
        <Chip size={34} bg={C.ink}>
          <span style={{ color: C.orange }}>●</span> Appel assuré · 12 min
        </Chip>
      ),
    },
    {
      x: 520,
      y: 1260,
      r: -5,
      at: cue(S, "appels,") + 6,
      el: (
        <Chip size={34} bg={C.white} color={C.ink} style={{ border: `2px solid ${C.greyLine}` }}>
          ✉ Mail n°7 — « photos ? »
        </Chip>
      ),
    },
    {
      x: 150,
      y: 1400,
      r: 3,
      at: cue(S, "déplacements"),
      el: (
        <Chip size={34} bg={C.orange}>
          Déplacement expert · 2 h de route
        </Chip>
      ),
    },
  ];
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <Top>
          <KeyPhrase phrase={S.phrases[0]} size={112} marker />
        </Top>
        {items.map((it, i) => {
          const s = pop(f, it.at - 3, 11, 170);
          const drift = Math.sin((f + i * 30) / 25) * 8;
          return (
            <div key={i} style={{ position: "absolute", left: it.x + shake * (i % 2 ? 1 : -1), top: it.y + drift, rotate: `${it.r + shake * 0.6}deg`, scale: `${s}`, opacity: s }}>
              {it.el}
            </div>
          );
        })}
        {/* fissures « fragmenté » */}
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          {["M80 1080 L300 1040 L360 1110 L560 1060", "M600 1180 L760 1120 L840 1200 L1000 1150"].map((d, i) => (
            <path key={i} d={d} stroke={C.orange} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray="14 12" pathLength={1} opacity={prog(f, cFrag, cFrag + 6)} />
          ))}
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 3. Révélation ---------------- */
const Marque: React.FC = () => {
  const S = sc("marque");
  const f = useCurrentFrame();
  const ph = S.phrases[0];
  const lift = prog(f, ph.start - 10, ph.start + 8, EASE_IN_OUT);
  const bear = pop(f, cue(S, "espace") - 6, 10, 120, 0.9);
  return (
    <AbsoluteFill style={{ background: C.orange, overflow: "hidden" }}>
      {[0, 1, 2, 3].map((k) => {
        const t = ((f + k * 30) % 120) / 120;
        return <div key={k} style={{ position: "absolute", left: 540 - 1100, top: 900 - 1100, width: 2200, height: 2200, borderRadius: "50%", border: "3px solid #fff", scale: `${0.1 + t * 0.9}`, opacity: (1 - t) * 0.22 }} />;
      })}
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(lift, [0, 1], [560, 360]), display: "flex", justifyContent: "center", scale: `${interpolate(lift, [0, 1], [1, 0.82])}` }}>
          <Logo size={112} animateFrom={cue(S, "easyVirtual.tours,") - 8} />
        </div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 640, display: "flex", justifyContent: "center" }}>
          <KeyPhrase phrase={ph} size={100} color={C.white} accent={C.ink} align="center" maxWidth={960} />
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 1040, display: "flex", justifyContent: "center", scale: `${pop(f, ph.start + 20, 9, 200)}` }}>
          <Sticker size={36} rotate={-3}>
            Assurances · Gestion de sinistre
          </Sticker>
        </div>
        <div style={{ position: "absolute", left: 80, top: 1920 - interpolate(bear, [0, 1], [0, 720]), rotate: `${interpolate(bear, [0, 1], [-20, -6])}deg` }}>
          <Mascot height={460} outline="#fff" scanning wave={prog(f, cue(S, "espace"), cue(S, "espace") + 10)} seed={22} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 4. Médias + mesures dans l'espace 3D ---------------- */
const CW = 1080;
const CH = 1050;
const CANVAS_TOP = 640;
const Medias: React.FC = () => {
  const S = sc("medias");
  const f = useCurrentFrame();
  const az = interpolate(f, [0, S.dur], [0.55, 0.95]);
  const el = 0.78;
  const dist = 26.5;
  const target: [number, number, number] = [0, 0.4, 0];
  const cam: [number, number, number] = [Math.cos(el) * Math.sin(az) * dist, Math.sin(el) * dist + 0.4, Math.cos(el) * Math.cos(az) * dist];
  const fov = 30;
  const P = (p: [number, number, number]) => project(p, cam, target, fov, CW, CH);
  const pins = [
    { p: [-3.4, 0.05, 1.6] as [number, number, number], label: "Note", sub: "Fuite sous l'évier", at: cue(S, "Notes,") },
    { p: [-4.6, 1.6, -LZ / 2 + 0.1] as [number, number, number], label: "Photo", sub: "Plafond taché", at: cue(S, "photos,") },
    { p: [3.0, 0.05, -2.0] as [number, number, number], label: "Devis", sub: "Plombier · PDF", at: cue(S, "devis") },
  ];
  const cMes = cue(S, "mesures");
  const a = P([-LX / 2 + 0.2, 0.05, 3.9]);
  const b = P([-0.2, 0.05, 3.9]);
  const t = prog(f, cMes, cMes + 22, EASE_IN_OUT);
  const stain = prog(f, 6, 30);
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <Top>
          <KeyPhrase phrase={S.phrases[0]} size={100} />
          <div style={{ height: 12 }} />
          <KeyPhrase phrase={S.phrases[1]} size={84} color={C.greyText} />
        </Top>
        <div style={{ position: "absolute", left: 0, top: CANVAS_TOP, width: CW, height: CH }}>
          <ThreeCanvas width={CW} height={CH} flat>
            <CameraRig pos={cam} target={target} fov={fov} />
            <Lights />
            <HouseModel opacity={1} wire={1} wireOpacity={0.6} lineWidth={1.4} slabColor="#D9C2A3" resolution={[CW, CH]} />
            {/* dégât des eaux */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.2, 0.02, 1.4]} scale={[stain, stain, stain]}>
              <circleGeometry args={[1.5, 40]} />
              <meshBasicMaterial color="#5E9BD6" transparent opacity={0.55} />
            </mesh>
          </ThreeCanvas>
          {/* points d'intérêt */}
          {pins.map((pin, i) => {
            const q = P(pin.p);
            const s = pop(f, pin.at - 2, 11, 180);
            return (
              <div key={i} style={{ position: "absolute", left: q.x, top: q.y, scale: `${s}`, transformOrigin: "left bottom" }}>
                <div style={{ position: "absolute", left: -18, top: -18, width: 36, height: 36, borderRadius: 18, background: C.orange, border: "5px solid #fff", boxShadow: `0 0 0 ${6 + Math.sin(f / 5 + i) * 4}px rgba(255,102,0,0.25)` }} />
                <div style={{ position: "absolute", left: 24, top: -110, background: C.white, borderRadius: 18, padding: "12px 20px", border: `2px solid ${C.greyLine}`, boxShadow: "0 20px 30px -16px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
                  <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 30, color: C.orange }}>{pin.label}</div>
                  <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 22, color: C.ink }}>{pin.sub}</div>
                </div>
              </div>
            );
          })}
          {/* mesure à distance */}
          <svg width={CW} height={CH} style={{ position: "absolute", inset: 0 }}>
            {t > 0 && (
              <>
                <line x1={a.x} y1={a.y} x2={a.x + (b.x - a.x) * t} y2={a.y + (b.y - a.y) * t} stroke={C.orange} strokeWidth={6} />
                <circle cx={a.x} cy={a.y} r={9} fill="#fff" stroke={C.orange} strokeWidth={4} />
                <circle cx={a.x + (b.x - a.x) * t} cy={a.y + (b.y - a.y) * t} r={9} fill="#fff" stroke={C.orange} strokeWidth={4} />
              </>
            )}
          </svg>
          {t > 0.95 && (
            <div style={{ position: "absolute", left: (a.x + b.x) / 2 - 90, top: (a.y + b.y) / 2 + 20, scale: `${pop(f, cMes + 20, 10, 200)}` }}>
              <Chip size={34} bg={C.orange}>
                <b>5,60 m</b>
              </Chip>
            </div>
          )}
        </div>
        <div style={{ position: "absolute", right: 40, top: 1920 - 470 * pop(f, cMes - 10, 12, 120) }}>
          <Mascot height={300} mood="focus" look={[-0.8, -0.2]} seed={23} flip />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 5. Partage entre intervenants ---------------- */
const MiniHouse: React.FC<{ hot: number }> = ({ hot }) => (
  <svg width={120} height={90} viewBox="0 0 120 90">
    <polygon points="10,40 60,8 110,40" fill={hot > 0.5 ? C.orange : C.ink} />
    <rect x={20} y={40} width={80} height={44} fill="#fff" stroke={C.ink} strokeWidth={4} />
    <rect x={50} y={56} width={20} height={28} fill={hot > 0.5 ? C.orange : C.greyLine} />
  </svg>
);
const Partage: React.FC = () => {
  const S = sc("partage");
  const f = useCurrentFrame();
  const roles = [
    { n: "Assureur", w: "assureur,", x: 70, y: 700 },
    { n: "Expert", w: "expert,", x: 590, y: 700 },
    { n: "Assuré", w: "assuré,", x: 70, y: 1330 },
    { n: "Prestataire", w: "prestataires", x: 590, y: 1330 },
  ];
  const hub = { x: 540, y: 1140 };
  const same = prog(f, cue(S, "même"), cue(S, "même") + 8);
  const link = pop(f, cue(S, "lien,") - 6, 11, 160);
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <Top>
          <KeyPhrase phrase={S.phrases[0]} size={76} color={C.greyText} />
          <div style={{ height: 10 }} />
          <KeyPhrase phrase={S.phrases[1]} size={120} marker />
        </Top>
        <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
          {roles.map((r, i) => {
            const t = prog(f, cue(S, r.w) - 4, cue(S, r.w) + 10, EASE_IN_OUT);
            const cx = r.x + 210;
            const cy = r.y + (r.y < 1000 ? 230 : 0);
            return <line key={i} x1={hub.x} y1={hub.y} x2={hub.x + (cx - hub.x) * t} y2={hub.y + (cy - hub.y) * t} stroke={C.orange} strokeWidth={5} strokeDasharray="12 10" />;
          })}
        </svg>
        {roles.map((r, i) => {
          const s = pop(f, cue(S, r.w) - 3, 12, 170);
          return (
            <div key={i} style={{ position: "absolute", left: r.x, top: r.y, scale: `${s}`, opacity: s }}>
              <Card style={{ width: 420, height: 230, padding: 26, display: "flex", alignItems: "center", gap: 22, border: `3px solid ${same > 0.5 ? C.orange : C.greyLine}` }}>
                <MiniHouse hot={same} />
                <div>
                  <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 42, color: C.ink }}>{r.n}</div>
                  <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 22, color: same > 0.5 ? C.orange : C.greyText }}>{same > 0.5 ? "Même visite 3D" : "Ouvre le lien"}</div>
                </div>
              </Card>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: 0, right: 0, top: hub.y - 50, display: "flex", justifyContent: "center", scale: `${link}` }}>
          <Chip size={34} bg={C.ink}>
            <svg width={40} height={40} viewBox="0 0 24 24">
              <path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1" stroke={C.orange} strokeWidth={2.6} fill="none" strokeLinecap="round" />
            </svg>
            visite.easyvirtual.tours/sinistre
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 6. Offre préventive ---------------- */
const Preventif: React.FC = () => {
  const S = sc("preventif");
  const f = useCurrentFrame();
  const card = useEnter(cue(S, "avant") - 6, 60);
  const stamp = pop(f, cue(S, "mémoire") - 2, 9, 200);
  return (
    <AbsoluteFill style={{ background: C.white }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={exitStyle(f, S.dur)}>
        <Top>
          <KeyPhrase phrase={S.phrases[0]} size={104} marker />
        </Top>
        <div style={{ position: "absolute", left: 90, top: 720, width: 900, ...card.style }}>
          <Card style={{ padding: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 20, letterSpacing: "0.18em", color: C.greyText, textTransform: "uppercase" }}>État de référence du logement</div>
              <Chip size={20} bg={C.green}>
                Archivé
              </Chip>
            </div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 52, color: C.ink, marginTop: 12 }}>Maison · 4 pièces</div>
            <div style={{ fontFamily: F.body, fontSize: 24, color: C.greyText }}>Visite virtuelle réalisée avant tout sinistre</div>
            <div style={{ marginTop: 28 }}>
              {["Toutes les pièces en 360°", "Équipements et finitions", "Mesures et surfaces"].map((t, i) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, opacity: prog(f, cue(S, "sinistre,") + i * 6, cue(S, "sinistre,") + 10 + i * 6) }}>
                  <Check size={38} progress={prog(f, cue(S, "sinistre,") + 3 + i * 6, cue(S, "sinistre,") + 13 + i * 6)} />
                  <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.ink }}>{t}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{ position: "absolute", right: -10, top: -50, rotate: "8deg", scale: `${stamp}` }}>
            <div style={{ border: `6px solid ${C.orange}`, color: C.orange, borderRadius: 18, padding: "10px 22px", fontFamily: F.title, fontWeight: 800, fontSize: 34, background: "#fff" }}>MÉMOIRE VISUELLE ✓</div>
          </div>
        </div>
        <div style={{ position: "absolute", right: 70, top: 1920 - 600 * pop(f, cue(S, "gardez") - 4, 12, 120) }}>
          <Mascot height={420} scanning mood="happy" look={[-0.5, -0.2]} seed={24} flip />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------- 7. Signature ---------------- */
const Outro: React.FC = () => {
  const S = sc("outro");
  const f = useCurrentFrame();
  const ph = S.phrases[0];
  const cta = pop(f, ph.end + 2, 12, 170);
  const click = ph.end + 34;
  const press = Math.max(0, 1 - Math.abs(f - click) / 4);
  const cur = prog(f, ph.end + 10, click, EASE_IN_OUT);
  const bear = pop(f, 20, 11, 120);
  return (
    <AbsoluteFill style={{ background: C.orange, overflow: "hidden" }}>
      {[0, 1, 2, 3, 4].map((k) => {
        const t = ((f + k * 30) % 150) / 150;
        return <div key={k} style={{ position: "absolute", left: 540 - 1200, top: 880 - 1200, width: 2400, height: 2400, borderRadius: "50%", border: "3px solid #fff", scale: `${0.08 + t * 0.92}`, opacity: (1 - t) * 0.2 }} />;
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 480, display: "flex", justifyContent: "center" }}>
        <Logo size={112} animateFrom={cue(S, "easyVirtual.tours.") - 10} />
      </div>
      <div style={{ position: "absolute", left: 40, right: 40, top: 780, display: "flex", justifyContent: "center" }}>
        <KeyPhrase phrase={ph} size={96} color={C.white} accent={C.ink} align="center" />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 1010, display: "flex", justifyContent: "center", scale: `${cta * (1 - press * 0.06)}` }}>
        <div style={{ background: C.white, color: C.ink, borderRadius: 999, padding: "24px 48px", fontFamily: F.title, fontWeight: 800, fontSize: 44, display: "flex", alignItems: "center", gap: 20, boxShadow: `0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 ${press * 24}px rgba(255,255,255,0.35)` }}>
          easyvirtual.tours
          <div style={{ width: 58, height: 58, borderRadius: 29, background: C.orange, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>→</div>
        </div>
      </div>
      {cta > 0.5 && (
        <div style={{ position: "absolute", left: interpolate(cur, [0, 1], [900, 770]), top: interpolate(cur, [0, 1], [1450, 1070]), scale: `${1 - press * 0.15}` }}>
          <svg width={52} height={62} viewBox="0 0 22 26">
            <path d="M2 2 L2 21 L7 16.5 L10.5 24 L14 22.5 L10.6 15.2 L17 15 Z" fill={C.ink} stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <div style={{ position: "absolute", left: 80, top: 1920 - interpolate(bear, [0, 1], [0, 760]), rotate: `${interpolate(bear, [0, 1], [-25, -4])}deg` }}>
        <Mascot height={460} mood={f > click ? "wink" : "happy"} outline="#fff" wave={prog(f, 30, 40)} seed={25} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Assemblage ---------------- */
const COMPONENTS: Record<string, React.FC> = { stat: Stat, fragments: Fragments, marque: Marque, medias: Medias, partage: Partage, preventif: Preventif, outro: Outro };
export const SINISTRE_SCENES = COMPONENTS;
const ORANGE = ["marque", "outro"];

const Header: React.FC = () => {
  const f = useCurrentFrame();
  const cur = SIN.scenes.find((s) => f >= s.from && f < s.from + s.dur);
  const hidden = !cur || ORANGE.includes(cur.id);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 150, display: "flex", justifyContent: "space-between", fontFamily: F.body, fontWeight: 700, fontSize: 17, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4A4A4A", borderBottom: `2px solid ${C.greyLine}`, paddingBottom: 16, opacity: hidden ? 0 : prog(f, 4, 18) }}>
      <span>easyVirtual.tours</span>
      <span style={{ color: C.orange }}>Assurances · Sinistres</span>
    </div>
  );
};

export const SINISTRE_TOTAL = SIN.total;

export const Sinistre: React.FC = () => {
  const speaking = new Uint8Array(SIN.total + 1);
  for (const s of SIN.scenes) for (const w of s.words) for (let k = Math.max(0, s.from + w.at - 4); k <= Math.min(SIN.total, s.from + w.endAt + 8); k++) speaking[k] = 1;
  const r = Math.round(FPS * 0.25);
  const vol = new Float32Array(SIN.total + 1).map((_, k) => {
    let n = 0;
    for (let j = -r; j <= r; j++) n += speaking[Math.min(SIN.total, Math.max(0, k + j))];
    const sp = n / (2 * r + 1);
    return SINISTRE_VO.audioFile ? 0.45 + (0.24 - 0.45) * sp : 0.75;
  });
  return (
    <AbsoluteFill style={{ background: C.white }}>
      {SIN.scenes.map((s) => {
        const Comp = COMPONENTS[s.id];
        return (
          <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.dur} premountFor={30}>
            <Comp />
          </Sequence>
        );
      })}
      <Header />
      <SpotTransitions cuts={SIN.scenes.slice(1).map((s) => ({ at: s.from, kind: ORANGE.includes(s.id) ? "iris" : "panel" }))} />
      <Audio src={staticFile("audio/sinistre-music.mp3")} volume={(fr) => vol[Math.min(SIN.total, Math.max(0, Math.round(fr)))]} />
      <Audio src={staticFile("audio/sinistre-sfx.mp3")} volume={0.55} />
      {SINISTRE_VO.audioFile &&
        SIN.clips.map((c) => (
          <Sequence key={c.id} from={Math.round(c.at * FPS)} layout="none">
            <Audio src={staticFile(SINISTRE_VO.audioFile!)} trimBefore={Math.round(c.from * FPS)} trimAfter={Math.round(c.to * FPS)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
