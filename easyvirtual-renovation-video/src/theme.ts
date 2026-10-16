import { continueRender, delayRender, staticFile } from "remotion";

// Charte easyVirtual.tours (plaquette réseau) : orange #FF6600, blanc, noir.
export const C = {
  orange: "#FF6600",
  orangeDeep: "#E85A00",
  orangeSoft: "#FFE8D9",
  black: "#1A1A1A",
  ink: "#111111",
  white: "#FFFFFF",
  grey: "#F3F3F3",
  greyLine: "#E4E4E4",
  greyText: "#6B6B6B",
  green: "#22A06B",
  yellow: "#F8C51C",
};

export const F = {
  title: "Jost, sans-serif", // titrage façon Futura de la plaquette
  body: "Inter, sans-serif",
  logo: "FrauncesSoft, Georgia, serif", // wordmark proche du logo easy
  hand: "Caveat, cursive",
};

const fonts: [string, string, string][] = [
  ["Jost", "fonts/Jost.woff2", "100 900"],
  ["Inter", "fonts/Inter.woff2", "100 900"],
  ["FrauncesSoft", "fonts/Fraunces-Soft-900.woff2", "900"],
  ["Caveat", "fonts/Caveat.woff2", "600"],
];

if (typeof document !== "undefined") {
  const handle = delayRender("fonts");
  Promise.all(
    fonts.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, { weight });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Courbes "After Effects" : easy ease marqué, overshoot, etc.
export { Easing } from "remotion";
