import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EASE_IN, EASE_IN_OUT, pop, prog } from "../anim";
import { Mascot } from "../components/Mascot";
import { Check, Chip, Grid, KeyPhrase, Tag, useEnter } from "../components/ui";
import { cue, scene } from "../timeline";
import { C, F } from "../theme";
import { HeartDoc } from "./S08Collectivites";

const S = scene("carnet");
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Tile: React.FC<{ title: string; at: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, at, children, style }) => {
  const e = useEnter(at - 4, 40, 14);
  return (
    <div style={{ background: C.white, border: `2px solid ${C.greyLine}`, borderRadius: 26, padding: 26, ...e.style, ...style }}>
      <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 17, letterSpacing: "0.18em", textTransform: "uppercase", color: C.greyText, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
};

/** salle de classe — avant / après */
const Classroom: React.FC<{ after: boolean }> = ({ after }) => {
  const wall = after ? "#FFFFFF" : "#D9D4CC";
  const floor = after ? "#D8AE82" : "#9C958B";
  const ink = C.ink;
  return (
    <svg width={1000} height={600} viewBox="0 0 1000 600">
      <rect width={1000} height={600} fill={wall} />
      {/* plafond / sol en perspective */}
      <polygon points="0,0 1000,0 840,90 160,90" fill={after ? "#F6F6F6" : "#C9C3BA"} />
      <polygon points="0,600 1000,600 840,470 160,470" fill={floor} />
      <polygon points="0,0 160,90 160,470 0,600" fill={after ? "#F1F1F1" : "#CFC9C0"} />
      <polygon points="1000,0 840,90 840,470 1000,600" fill={after ? "#ECECEC" : "#C6C0B6"} />
      <g stroke={ink} strokeWidth={3} fill="none">
        <polyline points="0,0 160,90 840,90 1000,0" />
        <polyline points="0,600 160,470 840,470 1000,600" />
        <line x1={160} y1={90} x2={160} y2={470} />
        <line x1={840} y1={90} x2={840} y2={470} />
      </g>
      {/* fenêtres */}
      {(after ? [220, 520] : [250, 560]).map((x, i) => (
        <g key={i}>
          <rect x={x} y={after ? 130 : 150} width={after ? 260 : 190} height={after ? 230 : 170} fill={after ? "#CFE6F5" : "#A9B4BA"} stroke={after ? C.orange : ink} strokeWidth={after ? 10 : 6} />
          <line x1={x + (after ? 130 : 95)} y1={after ? 130 : 150} x2={x + (after ? 130 : 95)} y2={after ? 360 : 320} stroke={after ? C.orange : ink} strokeWidth={after ? 6 : 5} />
        </g>
      ))}
      {/* éclairage */}
      {after
        ? [300, 500, 700].map((x) => <rect key={x} x={x - 60} y={40} width={120} height={18} rx={9} fill="#fff" stroke={ink} strokeWidth={3} />)
        : [360, 640].map((x) => (
            <g key={x}>
              <line x1={x} y1={20} x2={x} y2={56} stroke={ink} strokeWidth={3} />
              <circle cx={x} cy={64} r={12} fill="#E9E1B5" stroke={ink} strokeWidth={3} />
            </g>
          ))}
      {/* radiateur / pompe à chaleur */}
      {after ? (
        <rect x={860} y={300} width={110} height={70} rx={14} fill="#fff" stroke={ink} strokeWidth={3} transform="skewY(14) translate(0 -230)" />
      ) : (
        <g transform="translate(300 380)">
          <rect width={170} height={70} fill="#8A847A" stroke={ink} strokeWidth={3} />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1={14 + i * 20} y1={8} x2={14 + i * 20} y2={62} stroke={ink} strokeWidth={3} />
          ))}
        </g>
      )}
      {/* fissures / taches */}
      {!after && (
        <g stroke={ink} strokeWidth={3} fill="none">
          <path d="M700 110 L690 150 L705 180 L692 220" />
          <path d="M180 300 L200 330 L190 360" />
          <ellipse cx={600} cy={70} rx={60} ry={14} fill="#B8AE9E" stroke="none" />
        </g>
      )}
      {/* bureaux */}
      {[250, 450, 650].map((x, i) => (
        <g key={i}>
          <polygon points={`${x - 70},520 ${x + 70},520 ${x + 60},490 ${x - 60},490`} fill={after ? "#fff" : "#B0A898"} stroke={ink} strokeWidth={3} />
          <line x1={x - 62} y1={520} x2={x - 62} y2={565} stroke={ink} strokeWidth={4} />
          <line x1={x + 62} y1={520} x2={x + 62} y2={565} stroke={ink} strokeWidth={4} />
        </g>
      ))}
      {after && <rect x={180} y={190} width={18} height={140} rx={6} fill={C.orange} />}
    </svg>
  );
};

export const S09Carnet: React.FC = () => {
  const frame = useCurrentFrame();
  const cSurf = cue(S, "Surfaces");
  const cEtat = cue(S, "état");
  const cInter = cue(S, "interventions");
  const cTrav = cue(S, "travaux");
  const cPart = cue(S, "partagé");
  const cServ = cue(S, "services");
  const cDist = cue(S, "consultable");
  const cApres = cue(S, "après") - 7; // « Et après les travaux »
  const [p0, p1] = S.phrases;

  const toBA = prog(frame, cApres - 6, cApres + 16, EASE_IN_OUT);
  const exit = prog(frame, S.dur - 12, S.dur, EASE_IN);
  const dash = pop(frame, 0, 16, 110);
  const surf = Math.round(interpolate(frame, [cSurf, cSurf + 24], [0, 1240], { ...clamp, easing: EASE_IN_OUT }));

  // slider avant/après
  const baIn = pop(frame, cApres + 4, 15, 120);
  const slider = interpolate(frame, [cApres + 14, p1.start, p1.start + 30, S.dur], [0.92, 0.5, 0.12, 0.42], { ...clamp, easing: EASE_IN_OUT });

  const etat = [
    { n: "Toiture", v: 0.82, c: C.green, l: "Bon" },
    { n: "Menuiseries", v: 0.5, c: C.orange, l: "À surveiller" },
    { n: "Chauffage", v: 0.24, c: C.ink, l: "À remplacer" },
    { n: "Accessibilité", v: 0.74, c: C.green, l: "Conforme" },
  ];

  return (
    <AbsoluteFill style={{ background: C.white, overflow: "hidden" }}>
      <Grid opacity={0.5} />
      <AbsoluteFill style={{ opacity: 1 - exit }}>
        {/* ---------------- tableau de bord ---------------- */}
        <div
          style={{
            position: "absolute",
            left: 760,
            top: 160,
            width: 1040,
            height: 800,
            background: C.grey,
            borderRadius: 36,
            padding: 28,
            boxShadow: "0 60px 120px -50px rgba(0,0,0,0.35)",
            scale: `${interpolate(dash, [0, 1], [0.9, 1]) * (1 - toBA * 0.1)}`,
            opacity: interpolate(dash, [0, 0.3], [0, 1], clamp) * (1 - toBA),
            translate: `${interpolate(dash, [0, 1], [120, 0]) - toBA * 200}px 0`,
          }}
        >
          {/* en-tête */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 22 }}>
            <div style={{ width: 74, height: 74, borderRadius: 20, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeartDoc size={52} color={C.orange} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 38, color: C.ink, lineHeight: 1.05 }}>Groupe scolaire J.-Ferry</div>
              <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 20, color: C.greyText, marginTop: 4 }}>Carnet de santé numérique du bâtiment</div>
            </div>
            <Tag size={18}>GEM</Tag>
            <Chip size={20} bg={C.white} color={C.ink} style={{ border: `2px solid ${C.greyLine}` }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: C.green }} /> À jour
            </Chip>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 18 }}>
            <Tile title="Surfaces" at={cSurf}>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 76, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {surf.toLocaleString("fr-FR")} <span style={{ fontSize: 40, color: C.orange }}>m²</span>
              </div>
              <div style={{ fontFamily: F.body, fontSize: 21, color: C.greyText, marginTop: 10 }}>2 niveaux · 14 locaux · plans DWG</div>
            </Tile>
            <Tile title="État du bâti" at={cEtat}>
              {etat.map((e, i) => {
                const t = prog(frame, cEtat + 4 + i * 4, cEtat + 22 + i * 4, EASE_IN_OUT);
                return (
                  <div key={e.n} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 9 }}>
                    <div style={{ width: 160, fontFamily: F.body, fontWeight: 600, fontSize: 20, color: C.ink }}>{e.n}</div>
                    <div style={{ flex: 1, height: 12, borderRadius: 6, background: C.grey }}>
                      <div style={{ width: `${e.v * t * 100}%`, height: "100%", borderRadius: 6, background: e.c }} />
                    </div>
                    <div style={{ width: 130, fontFamily: F.body, fontWeight: 600, fontSize: 17, color: e.c === C.ink ? C.ink : e.c, opacity: t }}>{e.l}</div>
                  </div>
                );
              })}
            </Tile>
            <Tile title="Interventions" at={cInter}>
              {[
                ["2019", "Réfection de la toiture"],
                ["2023", "Remplacement chaudière"],
                ["2025", "Mise en accessibilité"],
              ].map(([y, t], i) => (
                <div key={y} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, opacity: prog(frame, cInter + 4 + i * 5, cInter + 12 + i * 5) }}>
                  <Check size={28} color={C.green} progress={prog(frame, cInter + 6 + i * 5, cInter + 16 + i * 5)} />
                  <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 24, color: C.ink, width: 66 }}>{y}</div>
                  <div style={{ fontFamily: F.body, fontSize: 20, color: C.ink }}>{t}</div>
                </div>
              ))}
            </Tile>
            <Tile title="Travaux à prévoir" at={cTrav} style={{ border: `3px solid ${C.orange}` }}>
              {[
                ["2027", "Isolation des combles", "Planifié"],
                ["2028", "Menuiseries extérieures", "À chiffrer"],
              ].map(([y, t, st], i) => (
                <div key={y} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, opacity: prog(frame, cTrav + 6 + i * 6, cTrav + 14 + i * 6) }}>
                  <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 24, color: C.orange, width: 66 }}>{y}</div>
                  <div style={{ fontFamily: F.body, fontSize: 20, color: C.ink, flex: 1 }}>{t}</div>
                  <Chip size={16} bg={i === 0 ? C.orange : C.ink}>
                    {st}
                  </Chip>
                </div>
              ))}
            </Tile>
          </div>
          {/* partage */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20, ...useEnter(cPart - 4, 30).style }}>
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 17, letterSpacing: "0.18em", color: C.greyText, textTransform: "uppercase", marginRight: 6 }}>Partagé avec</div>
            {["Services techniques", "Élus", "Entreprises"].map((n, i) => {
              const s = pop(frame, cServ - 6 + i * 5, 12, 180);
              return (
                <div key={n} style={{ scale: `${s}`, opacity: s }}>
                  <Chip size={22} bg={C.ink}>
                    <span style={{ width: 30, height: 30, borderRadius: 15, background: [C.orange, "#fff", C.yellow][i], color: C.ink, fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {["ST", "É", "E"][i]}
                    </span>
                    {n}
                  </Chip>
                </div>
              );
            })}
          </div>
        </div>

        {/* téléphone : consultable à distance */}
        {(() => {
          const s = pop(frame, cDist - 6, 13, 140);
          return (
            <div
              style={{
                position: "absolute",
                left: 1672,
                top: 590,
                width: 230,
                height: 440,
                borderRadius: 40,
                background: C.ink,
                padding: 12,
                scale: `${s}`,
                rotate: `${interpolate(s, [0, 1], [20, 6])}deg`,
                opacity: s * (1 - toBA),
                boxShadow: "0 40px 70px -20px rgba(0,0,0,0.45)",
              }}
            >
              <div style={{ width: "100%", height: "100%", borderRadius: 30, background: C.white, padding: 16, overflow: "hidden" }}>
                <div style={{ width: 60, height: 8, borderRadius: 4, background: C.greyLine, margin: "0 auto 16px" }} />
                <HeartDoc size={48} />
                <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: 22, color: C.ink, marginTop: 8, lineHeight: 1.1 }}>Groupe scolaire</div>
                {[0.8, 0.5, 0.25].map((v, i) => (
                  <div key={i} style={{ height: 10, borderRadius: 5, background: C.grey, marginTop: 14 }}>
                    <div style={{ width: `${v * 100}%`, height: "100%", borderRadius: 5, background: [C.green, C.orange, C.ink][i] }} />
                  </div>
                ))}
                <div style={{ marginTop: 26, background: C.orange, color: "#fff", fontFamily: F.body, fontWeight: 700, fontSize: 18, padding: "10px 0", borderRadius: 14, textAlign: "center" }}>Ouvrir la visite</div>
                <div style={{ marginTop: 10, background: C.grey, color: C.ink, fontFamily: F.body, fontWeight: 700, fontSize: 18, padding: "10px 0", borderRadius: 14, textAlign: "center" }}>Plans · DWG</div>
              </div>
            </div>
          );
        })()}

        {/* ---------------- avant / après ---------------- */}
        <div
          style={{
            position: "absolute",
            left: 790,
            top: 210,
            width: 1000,
            height: 600,
            borderRadius: 32,
            overflow: "hidden",
            boxShadow: "0 60px 120px -50px rgba(0,0,0,0.4)",
            scale: `${interpolate(baIn, [0, 1], [0.8, 1])}`,
            opacity: interpolate(baIn, [0, 0.3], [0, 1], clamp),
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <Classroom after />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - slider) * 100}% 0 0)` }}>
            <Classroom after={false} />
          </div>
          <div style={{ position: "absolute", left: `${slider * 100}%`, top: 0, bottom: 0, width: 6, marginLeft: -3, background: "#fff", boxShadow: "0 0 20px rgba(0,0,0,0.3)" }}>
            <div style={{ position: "absolute", top: "50%", left: -30, width: 66, height: 66, marginTop: -33, borderRadius: 33, background: C.orange, border: "5px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: F.title, fontWeight: 800, fontSize: 30 }}>
              ⟷
            </div>
          </div>
          <div style={{ position: "absolute", left: 24, top: 24, opacity: slider > 0.18 ? 1 : 0 }}>
            <Tag bg={C.ink}>Avant</Tag>
          </div>
          <div style={{ position: "absolute", right: 24, top: 24, opacity: slider < 0.85 ? 1 : 0 }}>
            <Tag>Après</Tag>
          </div>
        </div>
        {/* légende sous l'avant/après */}
        <div style={{ position: "absolute", left: 790, top: 840, width: 1000, display: "flex", gap: 14, opacity: prog(frame, p1.start, p1.start + 14) }}>
          <Chip size={22} bg={C.white} color={C.ink} style={{ border: `2px solid ${C.greyLine}` }}>
            Visite avant travaux · 2026
          </Chip>
          <Chip size={22} bg={C.orange}>Visite après travaux · 2027</Chip>
        </div>
        {/* mascotte */}
        <div style={{ position: "absolute", left: 1640, top: 1080 - 300 * pop(frame, p1.start + 20, 12, 130) }}>
          <Mascot height={300} mood="wow" look={[-0.8, -0.6]} seed={9} />
        </div>

        {/* ---------------- textes ---------------- */}
        <div style={{ position: "absolute", left: 130, top: 330, width: 580, opacity: 1 - toBA, translate: `${-toBA * 40}px 0` }}>
          <KeyPhrase phrase={p0} size={112} />
        </div>
        <div style={{ position: "absolute", left: 130, top: 330, width: 600 }}>
          <KeyPhrase phrase={p1} size={100} marker />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
