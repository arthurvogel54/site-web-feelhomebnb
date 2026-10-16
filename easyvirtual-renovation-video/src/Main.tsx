import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import "./theme";
import { Chrome } from "./components/Chrome";
import { Transitions } from "./components/Transitions";
import { SCENE_COMPONENTS } from "./scenes";
import { AUDIO_CLIPS, SCENES, TOTAL_FRAMES } from "./timeline";
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

// Volume de la musique précalculé image par image : baisse sous la voix (ducking), lissée sur ~0,25 s
const MUSIC_VOLUME = (() => {
  const speaking = new Uint8Array(TOTAL_FRAMES + 1);
  for (const s of SCENES)
    for (const w of s.words)
      for (let f = Math.max(0, s.from + w.at - 4); f <= Math.min(TOTAL_FRAMES, s.from + w.endAt + 8); f++) speaking[f] = 1;
  const r = Math.round(FPS * 0.25);
  const vol = new Float32Array(TOTAL_FRAMES + 1);
  for (let f = 0; f <= TOTAL_FRAMES; f++) {
    let n = 0;
    for (let k = -r; k <= r; k++) n += speaking[Math.min(TOTAL_FRAMES, Math.max(0, f + k))];
    const speak = n / (2 * r + 1);
    vol[f] = MIX.musicBetweenWords + (MIX.musicUnderVoice - MIX.musicBetweenWords) * speak;
  }
  return vol;
})();
const musicVolume = (f: number) => (VO.audioFile ? MUSIC_VOLUME[Math.min(TOTAL_FRAMES, Math.max(0, Math.round(f)))] : MIX.music);

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
    {VO.audioFile &&
      (AUDIO_CLIPS.length ? (
        AUDIO_CLIPS.map((c) => (
          <Sequence key={c.id} from={Math.round(c.at * FPS)} name={`voix · ${c.id}`} layout="none">
            <Audio
              src={staticFile(VO.audioFile!)}
              trimBefore={Math.round(c.from * FPS)}
              trimAfter={Math.round(c.to * FPS)}
              volume={MIX.voice}
            />
          </Sequence>
        ))
      ) : (
        <Sequence from={Math.round(VO.offset * FPS)} name="voix off" layout="none">
          <Audio src={staticFile(VO.audioFile)} volume={MIX.voice} />
        </Sequence>
      ))}
  </AbsoluteFill>
);
