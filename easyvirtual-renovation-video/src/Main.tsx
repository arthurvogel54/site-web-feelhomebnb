import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import "./theme";
import { Chrome } from "./components/Chrome";
import { Transitions } from "./components/Transitions";
import { SCENE_COMPONENTS } from "./scenes";
import { SCENES } from "./timeline";
import { FPS } from "./theme";
import { C } from "./theme";
import { VO } from "./vo-timings";

// Niveaux de mixage (0..1)
export const MIX = {
  music: 0.75, // musique seule (pas encore de voix off)
  musicUnderVoice: 0.22, // musique quand la voix parle (ducking automatique)
  musicBetweenWords: 0.4, // musique pendant les respirations de la voix
  sfx: 0.55,
  voice: 1,
};

// intervalles (en frames) où la voix parle, pour baisser la musique dessous
const VOICE_SPANS = SCENES.flatMap((s) => s.words.map((w) => [s.from + w.at, s.from + w.endAt] as const));
const isSpeaking = (f: number) => VOICE_SPANS.some(([a, b]) => f >= a - 4 && f <= b + 8);
const ATTACK = Math.round(FPS * 0.25);

const musicVolume = (f: number) => {
  if (!VO.audioFile) return MIX.music;
  // lissage : moyenne glissante de l'état "parle" sur ~0,25 s
  let n = 0;
  for (let k = -ATTACK; k <= ATTACK; k++) n += isSpeaking(f + k) ? 1 : 0;
  const speak = n / (2 * ATTACK + 1);
  return MIX.musicBetweenWords + (MIX.musicUnderVoice - MIX.musicBetweenWords) * speak;
};

export const Main: React.FC = () => (
  <AbsoluteFill style={{ background: C.white }}>
    {SCENES.map((s) => {
      const Comp = SCENE_COMPONENTS[s.id];
      return (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.dur} premountFor={30}>
          {Comp ? <Comp /> : <AbsoluteFill style={{ background: "#eee", fontSize: 80, justifyContent: "center", alignItems: "center" }}>{s.id}</AbsoluteFill>}
        </Sequence>
      );
    })}
    <Chrome />
    <Transitions />
    <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} />
    <Audio src={staticFile("audio/sfx.mp3")} volume={MIX.sfx} />
    {VO.audioFile && <Audio src={staticFile(VO.audioFile)} volume={MIX.voice} />}
  </AbsoluteFill>
);
