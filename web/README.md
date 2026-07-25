# web — Word Power Made Easy learning site

Vite + React + TypeScript + Tailwind single-page app. See the
[repo README](../README.md) for the full picture and the
[authoring guide](../authoring/AUTHORING.md) for adding lessons.

```bash
npm install
npm run dev        # dev server with HMR
npm run build      # production build → dist/
npm run preview    # preview the production build
npm run lint
```

## How content is loaded

- **Lessons** live in `src/corpus/lesson-*.json` and are auto-discovered at build
  time via `import.meta.glob` (`src/lib/lessons.ts`), validated against the Zod
  schema in `src/corpus-types/vocab.ts`. Drop in a new `lesson-*.json` and it
  appears — no registration needed.
- **Audio** lives in `public/audio/vocab/<lessonId>/<slot>.wav` and is loaded by
  `AudioButton` at the URL `/audio/vocab/...`.

New lessons and audio are produced by the `authoring/` tool, which writes
directly into this app's `src/corpus/` and `public/audio/`.
