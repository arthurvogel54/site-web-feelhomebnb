import { SegmentDef } from "../script";

/**
 * SCRIPT VOIX OFF — Assurances & gestion de sinistre (9:16, ≈ 40 s).
 * Même syntaxe que src/script.ts : [phrase affichée], *mot orange*, {affiché|prononcé}.
 * Aucun prix.
 */
export const SINISTRE_SCRIPT: SegmentDef[] = [
  {
    id: "stat",
    section: "",
    leadIn: 0.6,
    tail: 0.7,
    text: "Quand un sinistre dépasse [trois mois,] la satisfaction de l'assuré [chute de *{93|quatre-vingt-treize}* à *{68 %|soixante-huit pour cent}*.]",
  },
  {
    id: "fragments",
    section: "",
    leadIn: 0.4,
    tail: 0.7,
    text: "Photos incomplètes, appels, déplacements d'experts… [le dossier reste *fragmenté*.]",
  },
  {
    id: "marque",
    section: "",
    leadIn: 0.4,
    tail: 0.7,
    text: "Avec {easyVirtual.tours,|isi virtuel tours,} [le lieu sinistré devient *un* *espace* *3D*,] consultable à distance.",
  },
  {
    id: "medias",
    section: "",
    leadIn: 0.4,
    tail: 0.8,
    text: "Notes, photos, devis : [chaque dommage *dans* *son* *contexte*.] Et les mesures se prennent [*à* *distance*.]",
  },
  {
    id: "partage",
    section: "",
    leadIn: 0.4,
    tail: 0.8,
    text: "Un simple lien, et [assureur, expert, assuré, prestataires] voient [*le* *même* *espace*.]",
  },
  {
    id: "preventif",
    section: "",
    leadIn: 0.4,
    tail: 0.8,
    text: "Et avant même le sinistre, [gardez *une* *mémoire* *visuelle*] du logement.",
  },
  {
    id: "outro",
    section: "",
    leadIn: 0.5,
    tail: 2.6,
    text: "{easyVirtual.tours.|isi virtuel tours.} [Des dossiers *plus* *clairs*,] traités plus vite. Parlons-en.",
  },
];
