/**
 * SCRIPT VOIX OFF — source unique de vérité.
 *
 * Syntaxe :
 *   [ ... ]        → phrase clé affichée à l'écran, mot à mot, synchronisée à la voix
 *   *mot*          → mot mis en valeur en orange
 *   {affiché|dit}  → texte affiché différent du texte prononcé (sert au calcul du rythme)
 *
 * Chaque segment = une scène. leadIn / tail = respiration (s) avant / après la voix.
 * Avec une voix enregistrée, ces respirations sont insérées entre les segments (la voix est découpée).
 */
export type SegmentDef = {
  id: string;
  section: string; // libellé de section façon plaquette (en haut à droite)
  leadIn: number;
  tail: number;
  text: string;
};

export const SCRIPT: SegmentDef[] = [
  {
    id: "hook",
    section: "",
    leadIn: 1.8,
    tail: 1.0,
    text: "[Chaque bâtiment a une *histoire*.] Mais qui en connaît vraiment les mesures ?",
  },
  {
    id: "constat",
    section: "Le constat",
    leadIn: 0.6,
    tail: 1.0,
    text: "Aujourd'hui, [*{6|six}* architectes sur {10|dix}] [relèvent encore *à* *la* *main*.] Télémètre, carnet, croquis… Et chaque cote oubliée, c'est [un *retour* *sur* *chantier*.]",
  },
  {
    id: "marque",
    section: "",
    leadIn: 0.6,
    tail: 1.2,
    text: "Avec {easyVirtual.tours|isi virtuel tours}, [le relevé de l'existant passe au *numérique*.]",
  },
  {
    id: "scan",
    section: "Le scan",
    leadIn: 0.6,
    tail: 1.4,
    text: "Notre caméra {360°|trois cent soixante degrés}, équipée d'un capteur LiDAR, scanne chaque pièce en tournant sur elle-même. Une maison de {100 m²|cent mètres carrés} ? [Environ *une heure*.]",
  },
  {
    id: "visite",
    section: "La visite virtuelle",
    leadIn: 0.6,
    tail: 1.0,
    text: "Vous obtenez une [*visite virtuelle* immersive.] Une cote oubliée ? Mesurez-la depuis votre bureau. [Plus aucun retour sur chantier.]",
  },
  {
    id: "livrables",
    section: "Architectes",
    leadIn: 0.6,
    tail: 1.3,
    text: "Notre bureau d'études en tire des livrables prêts à l'emploi : plans {2D|deux dé}, coupes, toiture, vue {3D|trois dé} isométrique… et maquette BIM.",
  },
  {
    id: "formats",
    section: "Architectes",
    leadIn: 0.4,
    tail: 1.3,
    text: "Livrés en {DWG|dé double vé gé}, {PDF|pé dé èf}, {IFC|i èf cé} ou {RVT|èr vé té}, ils s'ouvrent directement dans Revit, ArchiCAD, AutoCAD ou SketchUp. [Vous ne remodélisez plus.] [Vous *concevez*.]",
  },
  {
    id: "collectivites",
    section: "Collectivités",
    leadIn: 1.0,
    tail: 0.7,
    text: "Pour les collectivités, c'est [tout votre *patrimoine*] qui se révèle. Écoles, gymnases, salles communales : chaque bâtiment scanné alimente [votre *GEM*] et son [carnet de santé *numérique*.]",
  },
  {
    id: "carnet",
    section: "Collectivités",
    leadIn: 0.4,
    tail: 1.2,
    text: "Surfaces, état, interventions, travaux à prévoir : [tout est *centralisé*,] partagé avec vos services et consultable à distance. Et après les travaux, [l'avant-après est *documenté*.]",
  },
  {
    id: "recap",
    section: "",
    leadIn: 0.6,
    tail: 1.0,
    text: "Visite virtuelle, plans, maquette BIM, carnet de santé numérique. [Un seul scan.] [Toutes les *réponses*.]",
  },
  {
    id: "outro",
    section: "",
    leadIn: 0.6,
    tail: 3.0,
    text: "{easyVirtual.tours.|isi virtuel tours.} [Prenez *rendez-vous*,] on s'occupe du reste.",
  },
];
