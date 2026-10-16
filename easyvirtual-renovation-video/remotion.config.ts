/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setChromiumOpenGlRenderer("angle");
// Navigateur headless local (l'environnement de build n'a pas accès au téléchargement Remotion).
// Sur une autre machine, supprimer cette ligne : Remotion téléchargera son propre navigateur.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setConcurrency(4);
Config.setJpegQuality(95);
