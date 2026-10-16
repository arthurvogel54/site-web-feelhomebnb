import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { C } from "../theme";
import { BEAR } from "../components/Mascot";
import { Box, getBoxes, getCloud, LX, LZ, ROOF, STATIONS, WALL_H } from "./houseData";

/* ------------------------------------------------------------------ */
/* Caméra pilotée par la frame                                          */
/* ------------------------------------------------------------------ */
export const CameraRig: React.FC<{ pos: [number, number, number]; target: [number, number, number]; fov?: number; up?: [number, number, number] }> = ({
  pos,
  target,
  fov = 32,
  up = [0, 1, 0],
}) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...pos);
  cam.up.set(...up);
  cam.fov = fov;
  cam.near = 0.1;
  cam.far = 200;
  cam.lookAt(...target);
  cam.updateProjectionMatrix();
  return null;
};

/** active le clipping local une fois */
export const EnableClipping: React.FC = () => {
  const { gl } = useThree();
  gl.localClippingEnabled = true;
  return null;
};

/* ------------------------------------------------------------------ */
/* Nuage de points LiDAR — révélation par station de scan              */
/* ------------------------------------------------------------------ */
const NS = STATIONS.length;
const cloudVert = /* glsl */ `
  attribute float aRoom;
  attribute float aShade;
  uniform vec3 uSt[${NS}];
  uniform float uR[${NS}];
  uniform float uRoom[${NS}];
  uniform float uAll;
  uniform float uSize;
  uniform float uExplode;
  varying float vFresh;
  varying float vShade;
  varying float vVis;
  void main() {
    float vis = uAll;
    float fresh = 0.0;
    for (int i = 0; i < ${NS}; i++) {
      if (abs(aRoom - uRoom[i]) < 0.5 && uR[i] > 0.0) {
        float d = distance(position, uSt[i]);
        float edge = uR[i] - d;
        if (edge > 0.0) {
          vis = 1.0;
          fresh = max(fresh, 1.0 - smoothstep(0.0, 1.6, edge));
        }
      }
    }
    vVis = vis;
    vFresh = fresh;
    vShade = aShade;
    vec3 p = position;
    p.y += uExplode * (p.y < 0.05 ? -1.0 : 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 + fresh * 1.2) * (10.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const cloudFrag = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uBase;
  uniform vec3 uHot;
  varying float vFresh;
  varying float vShade;
  varying float vVis;
  void main() {
    if (vVis < 0.5) discard;
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 base = mix(uBase, vec3(0.72), vShade);
    vec3 col = mix(base, uHot, vFresh);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

export const PointCloud: React.FC<{
  radii: number[]; // rayon de révélation par station
  all?: number; // 1 = tout visible
  opacity?: number;
  size?: number;
  hot?: string;
}> = ({ radii, all = 0, opacity = 1, size = 1.6, hot = C.orange }) => {
  const cloud = getCloud();
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.pos, 3));
    g.setAttribute("aRoom", new THREE.BufferAttribute(cloud.room, 1));
    g.setAttribute("aShade", new THREE.BufferAttribute(cloud.shade, 1));
    return g;
  }, [cloud]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cloudVert,
        fragmentShader: cloudFrag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uSt: { value: STATIONS.map((s) => new THREE.Vector3(...s.p)) },
          uR: { value: STATIONS.map(() => 0) },
          uRoom: { value: STATIONS.map((s) => s.room) },
          uAll: { value: 0 },
          uSize: { value: 1.6 },
          uOpacity: { value: 1 },
          uExplode: { value: 0 },
          uBase: { value: new THREE.Color("#1E1E1E") },
          uHot: { value: new THREE.Color(C.orange) },
        },
      }),
    [],
  );
  mat.uniforms.uR.value = radii;
  mat.uniforms.uAll.value = all;
  mat.uniforms.uOpacity.value = opacity;
  mat.uniforms.uSize.value = size;
  (mat.uniforms.uHot.value as THREE.Color).set(hot);
  if (opacity <= 0.001) return null;
  return <points geometry={geom} material={mat} />;
};

/* ------------------------------------------------------------------ */
/* Maquette solide (BIM)                                               */
/* ------------------------------------------------------------------ */
const KIND_COLOR: Record<Box["kind"], string> = {
  wall: "#FFFFFF",
  slab: "#D6D6D6",
  furniture: "#EDEDED",
  glass: "#BFD8EA",
  door: "#2A2A2A",
};

type ModelProps = {
  opacity?: number; // maquette solide
  wire?: number; // 0..1 tracé du filaire
  wireOpacity?: number;
  roof?: number; // 0..1 apparition toiture
  roofLift?: number; // éclaté : toiture qui s'élève (m)
  slabDrop?: number; // éclaté : dalle qui descend (m)
  furniture?: number; // opacité mobilier
  cutX?: number | null; // plan de coupe (garde x < cutX)
  wallTint?: string;
  lineColor?: string;
  lineWidth?: number;
  resolution: [number, number];
  roofColor?: string;
  hideUpper?: number; // 0..1 abaisse les murs (vue en plan)
  slabColor?: string;
  furnitureColor?: string;
};

const roofPlanes = () => {
  // deux pans : boîtes fines inclinées
  const { half, rise, slope, ang, length, y } = ROOF;
  return [1, -1].map((side) => ({
    pos: [0, y + rise / 2, (side * half) / 2] as [number, number, number],
    rot: [side * ang, 0, 0] as [number, number, number],
    size: [length, 0.18, slope] as [number, number, number],
  }));
};

const boxEdges = (b: Box) => {
  const [cx, cy, cz] = b.c;
  const [sx, sy, sz] = b.s.map((v) => v / 2);
  const p = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, -1, 1],
    [-1, -1, 1],
    [-1, 1, -1],
    [1, 1, -1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map(([x, y, z]) => [cx + x * sx, cy + y * sy, cz + z * sz]);
  const e = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  return e.flatMap(([a, b2]) => [...p[a], ...p[b2]]);
};

export const HouseModel: React.FC<ModelProps> = ({
  opacity = 1,
  wire = 0,
  wireOpacity = 1,
  roof = 0,
  roofLift = 0,
  slabDrop = 0,
  furniture = 1,
  cutX = null,
  lineColor = C.ink,
  lineWidth = 1.6,
  resolution,
  roofColor = C.orange,
  hideUpper = 0,
  slabColor = KIND_COLOR.slab,
  furnitureColor = KIND_COLOR.furniture,
}) => {
  const boxes = getBoxes();
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 100), []);
  clip.constant = cutX === null ? 100 : cutX;
  const clips = useMemo(() => [clip], [clip]);

  // filaire (murs + dalle + mobilier), trié par hauteur pour un tracé "qui monte"
  const { lineObj, lineMat, segCount } = useMemo(() => {
    const segs: number[][] = [];
    for (const b of boxes) {
      if (b.kind === "glass") continue;
      const e = boxEdges(b);
      for (let i = 0; i < e.length; i += 6) segs.push(e.slice(i, i + 6));
    }
    segs.sort((a, b) => Math.min(a[1], a[4]) - Math.min(b[1], b[4]) || a[0] - b[0]);
    const g = new LineSegmentsGeometry();
    g.setPositions(segs.flat());
    const m = new LineMaterial({ color: new THREE.Color(C.ink), linewidth: 1.6, transparent: true, clippingPlanes: [clip] });
    const o = new LineSegments2(g, m);
    o.frustumCulled = false;
    return { lineObj: o, lineMat: m, segCount: segs.length };
  }, [boxes, clip]);
  lineMat.color.set(lineColor);
  lineMat.linewidth = lineWidth;
  lineMat.opacity = wireOpacity;
  lineMat.resolution.set(resolution[0], resolution[1]);
  (lineObj.geometry as LineSegmentsGeometry).instanceCount = Math.floor(segCount * Math.min(1, wire));

  const mats = useMemo(() => {
    const m: Record<string, THREE.MeshStandardMaterial> = {};
    (Object.keys(KIND_COLOR) as Box["kind"][]).forEach((k) => {
      m[k] = new THREE.MeshStandardMaterial({
        color: KIND_COLOR[k],
        roughness: 0.85,
        metalness: 0,
        transparent: true,
        clippingPlanes: clips,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
    });
    m.wall.side = THREE.DoubleSide;
    m.roof = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.7, transparent: true, clippingPlanes: clips });
    return m;
  }, [clips, roofColor]);
  mats.slab.color.set(slabColor);
  mats.furniture.color.set(furnitureColor);
  mats.wall.opacity = opacity;
  mats.slab.opacity = opacity;
  mats.door.opacity = opacity;
  mats.glass.opacity = opacity * 0.55;
  mats.furniture.opacity = opacity * furniture;
  mats.roof.opacity = roof;
  for (const k of Object.keys(mats)) mats[k].depthWrite = mats[k].opacity > 0.98 || k === "glass" ? mats[k].opacity > 0.98 : false;

  const wallScaleY = 1 - hideUpper * 0.55;

  return (
    <group>
      {opacity > 0.001 &&
        boxes.map((b, i) => {
          if (b.kind === "furniture" && furniture <= 0.001) return null;
          const isSlab = b.kind === "slab";
          const scaled = b.kind === "wall" || b.kind === "glass" || b.kind === "door";
          return (
            <mesh
              key={i}
              position={[b.c[0], isSlab ? b.c[1] - slabDrop : scaled ? b.c[1] * wallScaleY : b.c[1], b.c[2]]}
              scale={[1, scaled ? wallScaleY : 1, 1]}
              material={mats[b.kind]}
            >
              <boxGeometry args={b.s} />
            </mesh>
          );
        })}
      {wire > 0 && wireOpacity > 0.001 && <primitive object={lineObj} scale={[1, wallScaleY, 1]} />}
      {roof > 0.001 &&
        roofPlanes().map((r, i) => (
          <mesh key={i} position={[r.pos[0], r.pos[1] + roofLift + (1 - roof) * 1.5, r.pos[2]]} rotation={r.rot} material={mats.roof}>
            <boxGeometry args={r.size} />
          </mesh>
        ))}
      {/* pignons */}
      {roof > 0.001 &&
        [1, -1].map((side) => (
          <mesh key={side} position={[(side * LX) / 2, WALL_H + roofLift + (1 - roof) * 1.5, 0]} rotation={[0, side > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={mats.wall}>
            <shapeGeometry
              args={[
                new THREE.Shape([new THREE.Vector2(-LZ / 2, 0), new THREE.Vector2(LZ / 2, 0), new THREE.Vector2(0, ROOF.rise * (LZ / 2) / ROOF.half)]),
              ]}
            />
          </mesh>
        ))}
    </group>
  );
};

/* ------------------------------------------------------------------ */
/* La mascotte en 3D — l'ours et sa caméra, en panneau face caméra      */
/* ------------------------------------------------------------------ */
/** à appeler HORS du <ThreeCanvas> : la texture est prête avant le premier rendu GL */
export const useBearTexture = () => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [handle] = useState(() => delayRender("texture ours"));
  useEffect(() => {
    new THREE.TextureLoader().load(
      staticFile(BEAR.src),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        setTex(t);
        continueRender(handle);
      },
      undefined,
      () => continueRender(handle),
    );
  }, [handle]);
  return tex;
};

export const BEAR_H = 1.75; // m — l'objectif tombe à ≈ 1,37 m, hauteur réelle d'un scanner sur trépied

export const ScannerBot: React.FC<{
  position: [number, number, number];
  faceY: number; // orientation vers la caméra
  spin: number; // rotation sur lui-même (rad) — simulée par un retournement
  scanning: number;
  scale?: number;
  hop?: number;
  tex: THREE.Texture | null;
}> = ({ position, faceY, spin, scanning, scale = 1, hop = 0, tex }) => {
  const w = BEAR_H * BEAR.ratio;
  const turn = Math.cos(spin);
  const sx = Math.abs(turn) < 0.05 ? 0.05 * Math.sign(turn || 1) : turn;
  const lensX = (BEAR.lens.x - 0.5) * w * sx;
  const lensY = BEAR_H * (1 - BEAR.lens.y);
  if (!tex) return null;
  return (
    <group position={[position[0], hop, position[2]]} rotation={[0, faceY, 0]} scale={scale}>
      <mesh position={[0, BEAR_H / 2, 0]} scale={[sx, 1, 1]}>
        <planeGeometry args={[w, BEAR_H]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* ombre */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01 - hop, 0]}>
        <circleGeometry args={[w * 0.4, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.09} depthWrite={false} />
      </mesh>
      {/* lueur de l'objectif pendant le scan */}
      {scanning > 0 && (
        <mesh position={[lensX, lensY, 0.02]}>
          <circleGeometry args={[0.07 + Math.sin(spin * 6) * 0.01, 24]} />
          <meshBasicMaterial color="#FFB27A" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

/** nappe laser qui tourne autour du scanner */
export const LaserFan: React.FC<{ position: [number, number, number]; angle: number; opacity: number; reach?: number }> = ({
  position,
  angle,
  opacity,
  reach = 4,
}) => {
  if (opacity <= 0.001) return null;
  return (
    <group position={[position[0], 1.37, position[2]]} rotation={[0, angle, 0]}>
      <mesh position={[reach / 2, 0, 0]}>
        <planeGeometry args={[reach, 2.6]} />
        <meshBasicMaterial color={C.orange} transparent opacity={opacity * 0.16} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[reach / 2, 0, 0]}>
        <boxGeometry args={[reach, 0.012, 0.012]} />
        <meshBasicMaterial color={C.orange} transparent opacity={opacity * 0.9} />
      </mesh>
    </group>
  );
};

/** plan de coupe visible */
export const CutPlane: React.FC<{ x: number; opacity: number }> = ({ x, opacity }) => {
  if (opacity <= 0.001) return null;
  return (
    <group position={[x, WALL_H / 2 + 0.6, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[LZ + 2, WALL_H + 3.2]} />
        <meshBasicMaterial color={C.orange} transparent opacity={opacity * 0.14} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** sol d'ambiance */
export const Ground: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.31, 0]}>
    <circleGeometry args={[14, 64]} />
    <meshBasicMaterial color="#F4F4F4" transparent opacity={opacity} />
  </mesh>
);

export const Lights: React.FC = () => (
  <>
    <ambientLight intensity={1.1} />
    <hemisphereLight args={["#ffffff", "#d9d9d9", 0.6]} />
    <directionalLight position={[8, 14, 10]} intensity={1.6} />
    <directionalLight position={[-10, 6, -6]} intensity={0.5} />
  </>
);

export const HOUSE = { LX, LZ, WALL_H };

/** projection 3D → 2D (pixels) avec les mêmes paramètres que CameraRig */
export const project = (
  p: [number, number, number],
  camPos: [number, number, number],
  target: [number, number, number],
  fov: number,
  w: number,
  h: number,
) => {
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 200);
  cam.position.set(...camPos);
  cam.lookAt(...target);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
};
