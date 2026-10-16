/**
 * Timings réels de la voix off. Laisser `null` tant que la voix n'est pas enregistrée :
 * la vidéo est alors calée sur un débit estimé (≈ 5 syllabes/s, voix posée).
 *
 * Quand la voix off arrive :
 *   - Option A (mot à mot, recommandé) : `npm run sync -- public/voiceover.wav`
 *     → remplit automatiquement `words` via Whisper.
 *   - Option B (manuel) : renseigner `segments` (début / fin de chaque segment, en secondes,
 *     mesurés dans le fichier audio) — les mots sont répartis à l'intérieur.
 */
export type RealWord = { text: string; startMs: number; endMs: number };
export type RealSegment = { id: string; start: number; end: number };

export const VO: {
  audioFile: string | null; // fichier dans /public, ex. "voiceover.wav"
  words: RealWord[] | null;
  segments: RealSegment[] | null;
} = {
  audioFile: null,
  words: null,
  segments: null,
};
