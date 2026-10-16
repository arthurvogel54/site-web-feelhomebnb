import React from "react";
import { S01Hook } from "./S01Hook";
import { S02Constat } from "./S02Constat";
import { S03Marque } from "./S03Marque";
import { S04Scan } from "./S04Scan";
import { S05Visite } from "./S05Visite";
import { S06Livrables } from "./S06Livrables";
import { S07Formats } from "./S07Formats";
import { S08Collectivites } from "./S08Collectivites";
import { S09Carnet } from "./S09Carnet";
import { S10Recap } from "./S10Recap";
import { S11Outro } from "./S11Outro";

export const SCENE_COMPONENTS: Record<string, React.FC> = {
  hook: S01Hook,
  constat: S02Constat,
  marque: S03Marque,
  scan: S04Scan,
  visite: S05Visite,
  livrables: S06Livrables,
  formats: S07Formats,
  collectivites: S08Collectivites,
  carnet: S09Carnet,
  recap: S10Recap,
  outro: S11Outro,
};
