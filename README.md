# Word Power Made Easy — bilingual vocabulary site

A self-hosted, bilingual (English + 简体中文) vocabulary-learning website inspired
by Norman Lewis's *Word Power Made Easy*. Each lesson teaches 3 words sharing a
hidden through-line, with pronunciation audio, etymology, word-family expansion,
and bilingual example sentences.

This repo is **self-contained**: it holds the site, all lesson content, all
audio, and the tooling to author new lessons. It has no dependency on any other
project.

## Layout

```
wordpower-made-easy/
├── web/                     The learning site — Vite + React + TypeScript + Tailwind
│   ├── src/routes/          Home · LessonPage · MethodPage · TestPage
│   ├── src/components/      AudioButton · WordEntry · BilingualLine · TwistCompare · VocabularyExpansion
│   ├── src/corpus/          ← canonical lessons: lesson-*.json  (single source of truth)
│   ├── src/corpus-types/    ← vocab.ts — the Zod schema shared by site + authoring
│   └── public/audio/vocab/  ← canonical pronunciation audio (.wav per slot)
│
└── authoring/               Tooling to add new lessons (dev-only; not deployed)
    ├── generateVocabAudio.ts   read a lesson JSON → synthesize audio → write into web/
    ├── lib/tts.ts              Node → Python bridge
    ├── tts/                    Python mlx-audio TTS (setup.sh builds a local .venv)
    └── AUTHORING.md            how to write a lesson + generate its audio
```

**Data flow (single source of truth):** the `authoring/` tool writes lessons and
audio directly into `web/`, and the site auto-discovers them via
`import.meta.glob`. There is exactly one copy of each lesson and its audio.

## Study (run the site)

```bash
cd web
npm install
npm run dev        # open the printed localhost URL
npm run build      # production build → web/dist
```

Works on any platform — it's a static web app.

## Author a new lesson

Write a `lesson-*.json` and generate its audio. Audio synthesis uses `mlx-audio`
and is **Apple Silicon only** (a `mock` backend exists for other platforms).
See [`authoring/AUTHORING.md`](authoring/AUTHORING.md).

```bash
cd authoring
npm install
npm run setup      # one-time: build the Python venv (~1.3 GB), Apple Silicon
npm run tts:vocab -- --lesson ../web/src/corpus/lesson-<slug>.json
```

## Notes

- **Content copyright.** Lessons are derived from a copyrighted book. Keep any
  published copy of this repository **private**.
- **Heavy bits stay out of git.** `node_modules/`, the Python `.venv/`, and model
  weights are git-ignored and rebuilt locally; the repo itself stays lean apart
  from the committed audio.
