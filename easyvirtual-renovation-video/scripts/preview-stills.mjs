// Aperçus rapides : node scripts/preview-stills.mjs <compositionId> <frame...> [--out dir] [--scale 0.5]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const out = outIdx >= 0 ? args.splice(outIdx, 2)[1] : "out/stills";
const scIdx = args.indexOf("--scale");
const scale = scIdx >= 0 ? Number(args.splice(scIdx, 2)[1]) : 0.5;
const [id, ...frames] = args;
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions: { gl: "angle" } });
for (const f of frames) {
  const output = path.join(out, `${id}-${f}.png`);
  await renderStill({ composition, serveUrl, output, frame: Number(f), scale, browserExecutable, chromiumOptions: { gl: "angle" } });
  console.log(output);
}
