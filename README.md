# Scorpion Studio Review App

Front-end for reviewing course blocks (images, audio, scripts, quizzes) in Vite + React + TS.

## Implementation Plan (current state)

- Asset roots (source of truth)
  - Hour 1 Draft: DRAFT CONTENT/h1/Hour 1 - Sanitation/block_003 (manifest.json, quiz.json)
  - Hour 3 Draft example: DRAFT CONTENT/h3/Hour 3/3.028 (manifest, scripts, prompts)
  - Hour 4 Draft example: DRAFT CONTENT/h4/Hour 4/4.016 (manifest, quiz, scripts)
  - Generated media: SIGMA/v3/block_001, block_002, block_004 (slides/audio)

- Served assets (what the app loads)
  - Images: public/assets/images/block_XXX/*.png
  - Audio: public/assets/audio/block_XXX/audio.wav
  - Manifests: public/assets/manifests/block_XXX.json (ordered atoms)

- Loader behavior
  - BlockDetail reads `/assets/manifests/block_{id}.json` and renders atoms in manifest order.
  - Atom ordering is defined explicitly by the `atoms` array in each manifest (no folder scanning).

- Next steps (when more blocks are added)
  - Drop new slides/audio into `public/assets/images/block_XXX` and `public/assets/audio/block_XXX`.
  - Add a manifest JSON in `public/assets/manifests/block_XXX.json` with ordered atoms referencing those paths.
  - Keep using filename conventions (slide_a.png, slide_b.png, …) for clarity, but ordering is governed by the manifest.
