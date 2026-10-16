import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import "./theme";
import { Chrome } from "./components/Chrome";
import { Transitions } from "./components/Transitions";
import { SCENE_COMPONENTS } from "./scenes";
import { SCENES } from "./timeline";
import { C } from "./theme";
import { VO } from "./vo-timings";

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
    {VO.audioFile && <Audio src={staticFile(VO.audioFile)} />}
  </AbsoluteFill>
);
