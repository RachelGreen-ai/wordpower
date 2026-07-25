# Authoring a new lesson

The learning site auto-discovers lessons: drop a valid `lesson-*.json` into
`web/src/corpus/` and generate its audio into `web/public/audio/vocab/<lessonId>/`,
and the site shows it on the next reload (`import.meta.glob` over the corpus).

There are two steps: **(1) write the lesson JSON**, **(2) generate its audio**.

## 1. Write the lesson JSON

Create `web/src/corpus/lesson-<slug>.json`. The shape is validated by the Zod
schema at [`web/src/corpus-types/vocab.ts`](../web/src/corpus-types/vocab.ts) —
read it for the exact fields. Easiest is to copy an existing lesson (e.g.
`lesson-intro-extro-ambi.json`) and edit the content.

Each lesson centers on 3 words sharing a hidden through-line, with etymology,
bilingual (EN + 简体中文) example sentences, and a "twist" compare section.

> The `wpme-lesson-builder` Claude skill can draft this JSON for you, but it is
> optional — a hand-written JSON that satisfies the schema works identically.

## 2. Generate the audio

Audio is synthesized locally with **mlx-audio** (Kokoro 82M by default).

> ⚠️ **Apple Silicon only.** `mlx` runs on M-series Macs. On other platforms the
> `mlx` backend won't install; use `--backend mock` (silent placeholders) or the
> paid `elevenlabs` backend instead.

### First-time setup (once per machine)

```bash
cd authoring
npm install            # tsx + zod
npm run setup          # creates authoring/tts/.venv, installs mlx-audio + deps (~1.3 GB)
```

Models (Kokoro / optional Higgs) download to `~/.cache/huggingface` on first run.

### Generate

```bash
cd authoring
# Smoke test — no model needed, writes silent placeholders:
npm run tts:vocab -- --lesson ../web/src/corpus/lesson-<slug>.json --backend mock

# Real audio (Apple Silicon):
npm run tts:vocab -- --lesson ../web/src/corpus/lesson-<slug>.json

# Regenerate a single slot:
npm run tts:vocab -- --lesson ../web/src/corpus/lesson-<slug>.json --only word.0.pronunciation
```

This writes `.wav` files under `web/public/audio/vocab/<lessonId>/` and updates
the lesson JSON's `audio` map. Then `cd ../web && npm run dev` to hear it.

## Reusing an existing venv

To point at a venv elsewhere (e.g. skip a fresh install during testing):

```bash
TTS_DIR=/path/to/existing/tts npm run tts:vocab -- --lesson ...
```
