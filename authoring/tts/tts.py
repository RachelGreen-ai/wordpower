#!/usr/bin/env python3
"""
higgs_tts.py — Unified TTS interface for the WC2026 Remotion pipeline.

Three backends:
  - mlx          mlx-audio (RECOMMENDED on Apple Silicon)
                   • Kokoro 82M with built-in expressive voices (default)
                   • Higgs Audio v2 3B with voice cloning (when TTS_MODEL points
                     at a Higgs model and TTS_VOICE is a path to a reference .wav)
  - mock         macOS `say` command (dev only; instant, low quality)
  - elevenlabs   ElevenLabs API (paid; fallback for non-Apple environments)

The mlx backend auto-routes to Kokoro or Higgs based on the model name. Defaults
target Kokoro af_heart, validated as warm/vibrant young female voice for promo
+ data-viz content (see scripts/tts/README.md).

CLI usage:
  python higgs_tts.py --text "Hello" --out output.wav                    # default: Kokoro af_heart
  python higgs_tts.py --text "Hello" --voice af_bella --out energetic.wav
  python higgs_tts.py --text "你好" --lang zh --out cn.wav                # Kokoro Chinese (zf_*)
  python higgs_tts.py --text "..." \\
    --model mlx-community/higgs-audio-v2-3B-mlx-q8 \\
    --voice ./scripts/tts/voice_prompts/en_woman.wav --out clone.wav    # Higgs voice clone
  python higgs_tts.py --text "Test" --backend mock --out mock.wav        # dev mock

By default applies pause compression as a post-process to keep durations tight.

Library usage:
  from higgs_tts import synthesize
  synthesize(text="Hello", out_path="out.wav")  # Kokoro af_heart by default
"""
from __future__ import annotations

import argparse
import os
import sys
import subprocess
import time
from pathlib import Path
from typing import Literal, Optional

try:
    from dotenv import load_dotenv

    # dotenv walks up from cwd looking for a .env. Each subproject (e.g.
    # worldcup-remotion, david_learn) owns its own .env. The tools/ dir itself
    # has no .env — config lives with the caller.
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# tools/tts/voice_prompts/ — bundled reference audio for Higgs voice cloning
VOICE_PROMPTS_DIR = Path(__file__).resolve().parent / "voice_prompts"

Backend = Literal["mlx", "mock", "elevenlabs"]
Language = Literal["en", "zh", "ko", "de", "es"]

DEFAULT_MODEL = os.environ.get("TTS_MODEL", "mlx-community/Kokoro-82M-bf16")
DEFAULT_VOICE = os.environ.get("TTS_VOICE", "af_heart")
DEFAULT_SPEED = float(os.environ.get("TTS_SPEED", "1.05"))
DEFAULT_TEMP = float(os.environ.get("TTS_TEMPERATURE", "0.7"))
DEFAULT_LANG = os.environ.get("TTS_LANG", "en")


# ---------------------------------------------------------------------------
# Backend: MLX (Kokoro or Higgs Audio v2, auto-routed by model id)
# ---------------------------------------------------------------------------

def _is_higgs_model(model: str) -> bool:
    return "higgs" in model.lower()


def _synthesize_mlx(
    text: str,
    out_path: Path,
    voice: str,
    lang: Language,
    model: str,
    temperature: float,
    speed: float,
) -> None:
    """Generate via mlx-audio. Routes to Kokoro or Higgs based on model id."""
    try:
        from mlx_audio.tts.generate import generate_audio
    except ImportError as e:
        print(
            "ERROR: mlx-audio is not installed. Run `scripts/tts/setup.sh` first.",
            file=sys.stderr,
        )
        print(f"Import detail: {e}", file=sys.stderr)
        sys.exit(2)

    kwargs = {
        "text": text,
        "model": model,
        "file_prefix": str(out_path.with_suffix("")),
        "temperature": temperature,
        "speed": speed,
        "verbose": False,
        "audio_format": "wav",
    }
    if lang and lang != "en":
        kwargs["lang_code"] = lang

    if _is_higgs_model(model):
        # Higgs: voice is a reference .wav path (or label like "en_woman" we map)
        if Path(voice).exists() and Path(voice).suffix.lower() in {".wav", ".mp3", ".flac"}:
            kwargs["ref_audio"] = str(Path(voice).resolve())
            # Try to find a matching transcript file next to the audio
            ref_txt = Path(voice).with_suffix(".txt")
            if ref_txt.exists():
                kwargs["ref_text"] = ref_txt.read_text().strip()
        else:
            # Best-effort: treat as label and look in voice_prompts/
            voice_dir = VOICE_PROMPTS_DIR
            candidate = voice_dir / f"{voice}.wav"
            if candidate.exists():
                kwargs["ref_audio"] = str(candidate)
                txt = voice_dir / f"{voice}.txt"
                if txt.exists():
                    kwargs["ref_text"] = txt.read_text().strip()
            else:
                print(
                    f"WARN: Higgs needs a reference .wav. '{voice}' not found in {voice_dir}. "
                    "Falling back to smart-voice mode.",
                    file=sys.stderr,
                )
    else:
        # Kokoro: voice is a label like af_heart, af_bella, bf_emma, zf_xiaobei, etc.
        kwargs["voice"] = voice

    t0 = time.time()
    generate_audio(**kwargs)
    dt = time.time() - t0

    # mlx-audio writes <file_prefix>_000.wav — rename to the requested path.
    candidates = sorted(out_path.parent.glob(f"{out_path.stem}*.wav"))
    if not candidates:
        raise RuntimeError(
            f"mlx-audio produced no .wav at {out_path.parent}/{out_path.stem}*"
        )
    primary = candidates[0]
    if primary != out_path:
        primary.replace(out_path)
    # Clean up any extra chunks (Kokoro can split long text)
    for extra in candidates[1:]:
        if extra.exists():
            extra.unlink()

    print(f"[mlx] generated in {dt:.2f}s → {out_path}", file=sys.stderr)


def _post_process_pause_compress(out_path: Path) -> None:
    """Compress long internal pauses + trim trailing silence via ffmpeg.

    Reduces Higgs's natural 1.4s pauses to 0.2s. No-op (well, idempotent re-encode)
    for Kokoro which has tight natural pacing.
    """
    if not _has_ffmpeg():
        return
    tmp = out_path.with_suffix(".tmp.wav")
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(out_path),
                "-af",
                "silenceremove=stop_periods=-1:stop_duration=0.3:stop_silence=0.2:stop_threshold=-40dB",
                str(tmp),
            ],
            check=True,
        )
        tmp.replace(out_path)
    except subprocess.CalledProcessError as e:
        print(f"WARN: ffmpeg pause-compression failed (non-fatal): {e}", file=sys.stderr)
        tmp.unlink(missing_ok=True)


def _has_ffmpeg() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False


# ---------------------------------------------------------------------------
# Backend: mock (macOS `say`)
# ---------------------------------------------------------------------------

def _synthesize_mock(text: str, out_path: Path, voice: str, lang: Language) -> None:
    voice_map = {
        "en": "Samantha", "zh": "Tingting", "ko": "Yuna",
        "de": "Anna", "es": "Mónica",
    }
    say_voice = voice if voice and voice not in {"belinda", "default", "af_heart", "af_bella"} else voice_map.get(lang, "Samantha")

    aiff_path = out_path.with_suffix(".aiff")
    try:
        subprocess.run(
            ["say", "-v", say_voice, "-o", str(aiff_path), text],
            check=True, capture_output=True,
        )
    except FileNotFoundError:
        print("ERROR: macOS `say` not found.", file=sys.stderr)
        sys.exit(2)
    except subprocess.CalledProcessError as e:
        print(f"ERROR: `say` failed: {e.stderr.decode()}", file=sys.stderr)
        sys.exit(1)

    if out_path.suffix.lower() == ".wav" and _has_ffmpeg():
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(aiff_path), "-ar", "44100", str(out_path)],
            check=True,
        )
        aiff_path.unlink(missing_ok=True)
    else:
        aiff_path.replace(out_path.with_suffix(".aiff"))
    print(f"[mock] wrote {out_path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Backend: ElevenLabs
# ---------------------------------------------------------------------------

def _synthesize_elevenlabs(text: str, out_path: Path, voice: str, lang: Language) -> None:
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    voice_id = voice or os.environ.get("ELEVENLABS_VOICE_ID")
    if not api_key:
        print("ERROR: ELEVENLABS_API_KEY not set.", file=sys.stderr)
        sys.exit(3)
    if not voice_id:
        print("ERROR: pass --voice <voice_id> or set ELEVENLABS_VOICE_ID.", file=sys.stderr)
        sys.exit(3)
    try:
        from elevenlabs.client import ElevenLabs
    except ImportError:
        print("ERROR: `pip install elevenlabs`", file=sys.stderr)
        sys.exit(2)
    client = ElevenLabs(api_key=api_key)
    audio = client.text_to_speech.convert(
        text=text, voice_id=voice_id,
        model_id="eleven_multilingual_v2",
        output_format="mp3_44100_128",
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "wb") as f:
        for chunk in audio:
            if chunk:
                f.write(chunk)
    print(f"[elevenlabs] wrote {out_path}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def synthesize(
    text: str,
    out_path: str | Path,
    *,
    backend: Backend = "mlx",
    voice: Optional[str] = None,
    lang: Language = "en",
    model: Optional[str] = None,
    temperature: Optional[float] = None,
    speed: Optional[float] = None,
    post_process: bool = True,
) -> Path:
    """Generate speech audio. Returns the path written."""
    if not text or not text.strip():
        raise ValueError("text is required")

    out_path = Path(out_path).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    voice = voice or DEFAULT_VOICE
    model = model or DEFAULT_MODEL
    temperature = DEFAULT_TEMP if temperature is None else temperature
    speed = DEFAULT_SPEED if speed is None else speed

    if backend == "mlx":
        _synthesize_mlx(text, out_path, voice, lang, model, temperature, speed)
    elif backend == "mock":
        _synthesize_mock(text, out_path, voice, lang)
    elif backend == "elevenlabs":
        _synthesize_elevenlabs(text, out_path, voice, lang)
    else:
        raise ValueError(f"unknown backend: {backend}")

    if post_process and out_path.suffix.lower() == ".wav":
        _post_process_pause_compress(out_path)

    return out_path


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Unified TTS for WC2026 pipeline (Kokoro default, Higgs optional).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--text", help="Text to synthesize. If omitted, reads stdin.")
    p.add_argument("--out", required=True, help="Output audio path (.wav recommended).")
    p.add_argument("--backend", choices=["mlx", "mock", "elevenlabs"],
                   default=os.environ.get("TTS_BACKEND", "mlx"))
    p.add_argument("--voice", default=DEFAULT_VOICE,
                   help="Kokoro label (af_heart, af_bella, ...) OR path to a .wav for Higgs cloning.")
    p.add_argument("--lang", choices=["en", "zh", "ko", "de", "es"], default=DEFAULT_LANG)
    p.add_argument("--model", default=DEFAULT_MODEL,
                   help="HF model id. Kokoro: mlx-community/Kokoro-82M-bf16. Higgs: mlx-community/higgs-audio-v2-3B-mlx-q8.")
    p.add_argument("--temperature", type=float, default=DEFAULT_TEMP)
    p.add_argument("--speed", type=float, default=DEFAULT_SPEED)
    p.add_argument("--no-post-process", action="store_true",
                   help="Skip ffmpeg pause-compression (default is on).")
    return p.parse_args()


def main() -> int:
    args = _parse_args()
    text = args.text if args.text else sys.stdin.read().strip()
    if not text:
        print("ERROR: no text (pass --text or pipe stdin).", file=sys.stderr)
        return 3
    try:
        synthesize(
            text=text, out_path=args.out,
            backend=args.backend, voice=args.voice, lang=args.lang,
            model=args.model, temperature=args.temperature, speed=args.speed,
            post_process=not args.no_post_process,
        )
    except KeyboardInterrupt:
        return 130
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
