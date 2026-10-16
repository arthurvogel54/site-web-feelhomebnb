import React from "react";
import { Composition, Folder } from "remotion";
import { Main } from "./Main";
import { SCENE_COMPONENTS } from "./scenes";
import { SCENES, TOTAL_FRAMES } from "./timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EasyVirtualRenovation" component={Main} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Folder name="Scenes">
      {SCENES.filter((s) => SCENE_COMPONENTS[s.id]).map((s) => (
        <Composition key={s.id} id={`scene-${s.id}`} component={SCENE_COMPONENTS[s.id]} width={W} height={H} fps={FPS} durationInFrames={s.dur} />
      ))}
    </Folder>
  </>
);
