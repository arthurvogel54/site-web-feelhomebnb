# easyVirtual.tours — Rénovation · vidéo de lancement

Motion design 100 % code (Remotion + Three.js), rendu image par image comme un export After Effects.
1920 × 1080 · 30 i/s · ≈ 1 min 51 (débit de voix estimé).

**Cibles** : architectes (prise de cotes automatisée, plans 2D, coupes, toiture, vue 3D, maquette BIM IFC/RVT)
et collectivités (patrimoine bâti, GEM, carnet de santé numérique, avant/après travaux).

## Démarrer

```bash
npm install
npm run dev        # Remotion Studio : prévisualisation, timeline, scènes séparées
npm run render     # → out/easyvirtual-renovation.mp4
npm run script     # régénère SCRIPT-VOIX-OFF.md (minutage à jour)
```

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/script.ts` | **Le script voix off** (source unique). `[ … ]` = phrase affichée mot à mot, `*mot*` = mot orange, `{affiché\|prononcé}` |
| `src/timeline.ts` | Calcule le minutage de chaque mot et de chaque scène (débit estimé ou voix réelle) |
| `src/vo-timings.ts` | Timings de la voix réelle (vide tant que la voix n'est pas enregistrée) |
| `src/scenes/S01…S11` | Les 11 scènes, chacune visible seule dans le Studio (dossier *Scenes*) |
| `src/three/` | Maison 3D procédurale : nuage de points LiDAR, filaire, BIM, coupe, éclaté |
| `src/components/Mascot.tsx` | La mascotte : l'ours et sa caméra (`public/mascotte/ours.png`), animé par le mouvement |
| `scripts/music/compose.py` | Musique originale + bruitages synthétisés, calés sur la timeline |
| `src/components/Transitions.tsx` | Volets noir/orange et iris entre les scènes |
| `public/fonts/` | Jost (titrage façon Futura de la plaquette), Inter, Fraunces Soft (logo), Caveat |

## Brancher la voix off

Toutes les animations sont accrochées aux **mots** du script, pas à des secondes fixes : quand la voix
arrive, la vidéo entière se recale dessus.

**Option A — automatique, au mot près (recommandé)**

```bash
cp ma-voix.wav public/voiceover.wav
npx remotion add @remotion/install-whisper-cpp   # une seule fois
npm run sync -- public/voiceover.wav             # transcription Whisper → src/vo-timings.ts
npm run render
```

**Option B — manuelle** : dans `src/vo-timings.ts`, renseigner `audioFile: "voiceover.wav"` et, pour
chaque segment (`hook`, `constat`, …), le début et la fin de la voix en secondes dans `segments`.

Si le texte enregistré diffère du script, modifier `src/script.ts` en conséquence (l'alignement tolère
quelques mots ajoutés ou manquants).

## Mascotte

L'ours est l'image `public/mascotte/ours.png` (PNG détouré). Pour changer d'illustration, remplacer ce
fichier (et ajuster `BEAR.ratio` / `BEAR.lens` dans `src/components/Mascot.tsx` si le cadrage change).
En 3D (scène Scan), il est affiché en panneau face caméra (`ScannerBot`, `src/three/House3D.tsx`).

## Musique

```bash
npx tsx scripts/music/export-cues.ts   # repères de la timeline
python3 scripts/music/compose.py       # → public/audio/music.mp3 + sfx.mp3 (numpy, scipy, ffmpeg)
```

À relancer après la synchro de la voix off pour recaler les temps forts. Les volumes (et la baisse
automatique de la musique sous la voix) se règlent dans `MIX`, `src/Main.tsx`.

## À valider avant diffusion

- **« 6 architectes sur 10 relèvent encore à la main »** : chiffre issu du terrain (≈ 40 rendez-vous
  d'un franchisé, cf. cas Arthur × Jean-Claude). À confirmer ou reformuler pour une diffusion publique.
- **GEM** : affiché tel quel ; vérifier l'intitulé exact attendu par les collectivités.
- Données d'exemple (Groupe scolaire J.-Ferry, 1 240 m², interventions…) : **fictives**, pour l'illustration.
- « ≈ 1 h pour 100 m² » : repris de la plaquette (1 h à 1 h 30 par maison de 100 m²).

## Rendu dans un environnement sans accès Internet

`REMOTION_BROWSER=/chemin/vers/chrome-headless-shell npm run render`
(sinon Remotion télécharge son propre navigateur).
