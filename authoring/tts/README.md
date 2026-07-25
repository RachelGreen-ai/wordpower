# TTS — Kokoro (default) + Higgs Audio v2 (voice cloning)

Native Apple Silicon TTS for the WC2026 pipeline via [`mlx-audio`](https://github.com/Blaizzy/mlx-audio). Two models routed through one wrapper:

- **[Kokoro 82M](https://huggingface.co/hexgrad/Kokoro-82M)** *(default)* — small (~165 MB), fast, ships with **pre-trained expressive voices** like `af_heart` (warm) and `af_bella` (vibrant). No reference audio needed. **This is what you use for 99% of content.**
- **[Higgs Audio v2 3B](https://github.com/boson-ai/higgs-audio)** *(opt-in)* — large (~3 GB), supports **zero-shot voice cloning** from a reference clip. Use when you need a *specific* voice (your own, a brand voice, a specific tonal style). EN/ZH/KO/DE/ES.

## Quick start

```bash
bash scripts/tts/setup.sh         # one-shot venv + deps (~2 min)
bash scripts/tts/test_tts.sh      # smoke test
```

Defaults: Kokoro `af_heart` voice, English, `speed=1.05`, automatic pause compression.

## Voice catalog (tested against WC2026 content)

### Kokoro female voices (American English)

| Voice | Vibe | Quality grade | Use case |
|-------|------|--------------|----------|
| **`af_heart`** ❤️ | warm, emotional | A | **Production default** — works for promo AND data-viz tone |
| **`af_bella`** 🔥 | vibrant, energetic | A- | High-hype reels, knockout-round drama |
| `af_nicole` 🎧 | professional, breathy | B- | ❌ tested — sounds whispery, avoid for our use case |
| `af_sarah` | standard | C+ | Untested |

### Kokoro female voices (British English)

| Voice | Vibe | Quality | Use case |
|-------|------|---------|----------|
| `bf_emma` | professional narrator | B- | Try for "documentary-style" personalized country videos |
| `bf_isabella` | standard | C | Untested |

### Kokoro male voices

For Persona B (Ronaldo engine) emotion register, options include `am_michael` (C+), `am_fenrir` (C+), `am_puck` (C+). All untested — generate samples to compare.

### Kokoro Chinese (Mandarin)

Voice ids prefix `zf_*` (female) and `zm_*` (male). Examples: `zf_xiaobei`, `zf_xiaoni`, `zm_yunjian`. Native pronunciation via `misaki[zh]`.

### Higgs Audio (voice cloning)

Ships with 3 sample reference voices in `voice_prompts/`:

| Reference | Tone | Use case |
|-----------|------|----------|
| `en_woman.wav` | calm, narrator | ❌ tested — too sleepy for promo |
| `en_man.wav` | standard | untested |
| `en_man_deep.wav` | deep, authoritative | untested |

**Higgs voice cloning shines when you provide your OWN reference** — 5–15 seconds of clean speech in the energy/tone you want to clone. Save as `voice_prompts/<name>.wav` with a matching `<name>.txt` transcript.

## CLI usage

```bash
# Activate the venv
source scripts/tts/.venv/bin/activate

# Default: Kokoro af_heart, English
python scripts/tts/higgs_tts.py \
  --text "Argentina won 2-1 but Morocco had higher xG." \
  --out audio/output.wav

# Vibrant promo voice
python scripts/tts/higgs_tts.py \
  --text "Sixteen days until kickoff!" \
  --voice af_bella \
  --out audio/promo.wav

# Chinese (Persona C — 小红书 / 海外华人)
python scripts/tts/higgs_tts.py \
  --text "梅西在第八十八分钟绝杀法国。" \
  --voice zf_xiaobei --lang zh \
  --out audio/messi_zh.wav

# Higgs voice cloning (advanced)
python scripts/tts/higgs_tts.py \
  --text "This is my cloned voice." \
  --model mlx-community/higgs-audio-v2-3B-mlx-q8 \
  --voice ./scripts/tts/voice_prompts/en_woman.wav \
  --out audio/cloned.wav

# Skip pause compression (raw output)
python scripts/tts/higgs_tts.py \
  --text "..." --no-post-process --out raw.wav

# Dev mock (instant, no model)
python scripts/tts/higgs_tts.py \
  --text "Quick test" --backend mock --out test.wav
```

## Library usage (from Remotion build)

```python
from scripts.tts.higgs_tts import synthesize

# Default: Kokoro af_heart
synthesize(text="Hello", out_path="audio/intro.wav")

# Explicit voice
synthesize(text="Get hyped!", out_path="audio/hype.wav", voice="af_bella")

# Higgs cloning
synthesize(
    text="...",
    out_path="audio/cloned.wav",
    model="mlx-community/higgs-audio-v2-3B-mlx-q8",
    voice="./scripts/tts/voice_prompts/myvoice.wav",
)
```

## Node usage (from Remotion pipeline)

See [`../../src/lib/tts.ts`](../../src/lib/tts.ts) — typed wrapper that spawns the Python script.

```ts
import { generateTTS } from "../../src/lib/tts";

await generateTTS({
  text: "Argentina vs Morocco — the data behind the upset.",
  outPath: "audio/intro.wav",
  voice: "af_heart",   // default
  language: "en",
});
```

Or `npm run tts -- --text "..." --out audio/x.wav`.

## Configuration

Defaults come from environment (`.env.example`):

| Env var | Default | Description |
|---------|---------|-------------|
| `TTS_BACKEND` | `mlx` | `mlx` / `mock` / `elevenlabs` |
| `TTS_MODEL` | `mlx-community/Kokoro-82M-bf16` | HF model id |
| `TTS_VOICE` | `af_heart` | Kokoro label OR Higgs reference .wav path |
| `TTS_LANG` | `en` | `en` / `zh` / `ko` / `de` / `es` |
| `TTS_SPEED` | `1.05` | Speed multiplier (1.0 = normal) |
| `TTS_TEMPERATURE` | `0.7` | Higgs only — Kokoro is deterministic |

## Production tips (lessons learned)

1. **Higgs Audio has high sampling variance at temperature ≥0.5.** Some generations early-terminate after 1–5 seconds. If you must use Higgs, generate 2-3 takes per script and pick the best. **Kokoro is deterministic — same input always produces same output.**

2. **Higgs has long natural pauses** (~1.4s between segments). The wrapper applies `silenceremove=stop_periods=-1:stop_duration=0.3:stop_silence=0.2` automatically as a post-process. To disable, pass `--no-post-process`.

3. **Reference audio energy is what gets cloned, not just timbre.** A calm narrator reference (like the bundled `en_woman.wav`) will produce calm narration of *any* text. For energetic delivery via Higgs, you need an energetic reference clip.

4. **Kokoro voices stay in their lane.** `af_nicole` always sounds breathy/whispery regardless of text. Choose voice based on the *target vibe*, not the *content*.

5. **For Chinese (Persona C), install `misaki[zh]`** — `setup.sh` now does this by default. Native phonemization via `jieba` for Mandarin tone accuracy.

6. **Punctuation drives Kokoro prosody.** Use `!` for exclaim, short sentences for punch. Long commas make the model slow down. Avoid run-on sentences.

7. **Model files cache to `~/.cache/huggingface/`.** First Kokoro run downloads ~165 MB. First Higgs run downloads ~3 GB. Reuse afterward.

## Performance benchmarks (M4 Max 48 GB)

| Model | Generation speed | First-run download |
|-------|------------------|---------------------|
| Kokoro 82M bf16 | **~10× realtime** (10 sec script → ~1 sec render) | ~165 MB |
| Higgs Audio v2 q8 | ~1× realtime | ~3 GB |

A 25-second video voiceover renders in 2-3 seconds with Kokoro on M4 Max. Higgs takes ~25-30 seconds. For tournament-scale pipelines (100+ videos/day), Kokoro is the right tool.

## Troubleshooting

**`ImportError: No module named 'misaki'`**
→ Run `bash scripts/tts/setup.sh` (now includes `misaki[en,zh]`). Or `pip install 'misaki[en,zh]'` in the venv.

**Audio starts mid-word / cuts off early (Higgs)**
→ Sampling variance. Re-run with `--temperature 0.3` for stability, or generate multiple takes.

**Audio sounds robotic / glitched (Kokoro)**
→ Try a different voice. `af_heart` and `af_bella` are A-grade; lower-grade voices have more artifacts.

**Chinese output sounds wrong (tones)**
→ Confirm `misaki[zh]` is installed (`pip show misaki | grep Required`). Use `zf_*` voices, not `af_*`.

**Generation hangs at first run**
→ Downloading model weights from HuggingFace. Check `~/.cache/huggingface/hub/` for partial files. Set `HF_TOKEN` env var if rate-limited.

## References

- mlx-audio: <https://github.com/Blaizzy/mlx-audio>
- Kokoro 82M model card: <https://huggingface.co/hexgrad/Kokoro-82M>
- Kokoro MLX (bf16): <https://huggingface.co/mlx-community/Kokoro-82M-bf16>
- Higgs Audio v2 (official): <https://github.com/boson-ai/higgs-audio>
- Higgs Audio v2 MLX (q8): <https://huggingface.co/mlx-community/higgs-audio-v2-3B-mlx-q8>
