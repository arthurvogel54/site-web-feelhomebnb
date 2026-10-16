import React from "react";
import { Composition, Folder } from "remotion";
import { Main } from "./Main";
import { Spot, SPOT_NAMES, spotPlan } from "./spots";
import { SCENE_COMPONENTS } from "./scenes";
import { SCENES, TOTAL_FRAMES } from "./timeline";
import { FPS, H, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="EasyVirtualRenovation" component={Main} width={W} height={H} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Composition id="EasyVirtualRenovationReel" component={Main} width={1080} height={1920} fps={FPS} durationInFrames={TOTAL_FRAMES} />
    <Folder name="Spots">
      {SPOT_NAMES.map((n) => (
        <Composition key={n} id={`Spot-${n}`} component={Spot} defaultProps={{ name: n }} width={1080} height={1920} fps={FPS} durationInFrames={spotPlan(n).total} />
      ))}
    </Folder>
    <Folder name="Scenes-Reel">
      {SCENES.filter((s) => SCENE_COMPONENTS[s.id]).map((s) => (
        <Composition key={s.id} id={`reel-${s.id}`} component={SCENE_COMPONENTS[s.id]} width={1080} height={1920} fps={FPS} durationInFrames={s.dur} />
      ))}
    </Folder>
    <Folder name="Scenes">
      {SCENES.filter((s) => SCENE_COMPONENTS[s.id]).map((s) => (
        <Composition key={s.id} id={`scene-${s.id}`} component={SCENE_COMPONENTS[s.id]} width={W} height={H} fps={FPS} durationInFrames={s.dur} />
      ))}
    </Folder>
  </>
);
