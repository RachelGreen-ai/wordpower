#!/usr/bin/env python3
"""
generate_wc2026_intro.py — Higgs Audio v2 demo using the model.generate()
streaming iterator directly (the CLI only emits the first chunk).

Writes to audio/wc2026/wc2026_intro_en_woman.wav
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = REPO_ROOT / "audio" / "wc2026"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT_PATH = OUT_DIR / "wc2026_intro_en_woman.wav"

REF_AUDIO = REPO_ROOT / "scripts" / "tts" / "voice_prompts" / "en_woman.wav"
REF_TEXT = (REPO_ROOT / "scripts" / "tts" / "voice_prompts" / "en_woman.txt").read_text().strip()

SCRIPT = (
    "In just sixteen days, the biggest World Cup ever kicks off. "
    "Forty-eight teams. One hundred and four matches. "
    "Three host countries: the United States, Canada, and Mexico. "
    "From the opener in Los Angeles to the final in New Jersey. "
    "Six and a half million tickets sold. The world is coming. June eleventh."
)

MODEL_ID = "mlx-community/higgs-audio-v2-3B-mlx-q8"


def main() -> int:
    import numpy as np
    import soundfile as sf
    import mlx.core as mx
    from mlx_audio.tts.utils import load

    print(f"→ script ({len(SCRIPT.split())} words)", file=sys.stderr)

    # Load + resample reference audio to 24kHz mono (what Higgs expects)
    ref_data, ref_sr = sf.read(str(REF_AUDIO), dtype="float32", always_2d=False)
    if ref_data.ndim > 1:
        ref_data = ref_data.mean(axis=1)  # mono
    if ref_sr != 24000:
        # Simple linear resample
        new_len = int(len(ref_data) * 24000 / ref_sr)
        idx = np.linspace(0, len(ref_data) - 1, new_len).astype(np.int64)
        ref_data = ref_data[idx]
    print(f"  reference audio: {len(ref_data)/24000:.2f}s @ 24kHz", file=sys.stderr)

    print(f"→ loading model {MODEL_ID}...", file=sys.stderr)
    t0 = time.time()
    model = load(MODEL_ID)
    print(f"  loaded in {time.time() - t0:.1f}s", file=sys.stderr)

    print(f"→ generating (streaming chunks)...", file=sys.stderr)
    t_gen = time.time()
    chunks: list[np.ndarray] = []
    sample_rate = 24000  # Higgs Audio default
    chunk_count = 0
    for result in model.generate(
        text=SCRIPT,
        ref_audio=ref_data,
        ref_text=REF_TEXT,
        temperature=0.3,
        max_tokens=1500,
        verbose=False,
    ):
        chunk_count += 1
        audio = getattr(result, "audio", None)
        sr = getattr(result, "sample_rate", None) or getattr(result, "sampling_rate", None)
        if sr:
            sample_rate = sr
        if audio is None:
            print(f"  chunk {chunk_count}: no audio attr; type={type(result)}", file=sys.stderr)
            continue
        if isinstance(audio, mx.array):
            audio = np.array(audio)
        elif not isinstance(audio, np.ndarray):
            audio = np.asarray(audio)
        audio = audio.squeeze()
        chunks.append(audio)
        print(f"  chunk {chunk_count}: {len(audio):,} samples ({len(audio)/sample_rate:.2f}s)", file=sys.stderr)
    print(f"  generation done in {time.time() - t_gen:.1f}s", file=sys.stderr)

    if not chunks:
        print("ERROR: no audio chunks produced", file=sys.stderr)
        return 1

    full = np.concatenate(chunks)
    duration = len(full) / sample_rate
    print(f"→ total audio: {duration:.2f}s @ {sample_rate} Hz", file=sys.stderr)

    # Save full version
    raw_path = OUT_DIR / "_raw_pre_trim.wav"
    sf.write(str(raw_path), full, int(sample_rate))

    # Trim trailing silence (anything quieter than -40 dB for >0.4s at the end)
    trimmed = _trim_trailing_silence(full, sample_rate, threshold_db=-40, min_silence_s=0.4)
    sf.write(str(OUT_PATH), trimmed, int(sample_rate))
    print(f"✅ wrote {OUT_PATH}", file=sys.stderr)
    print(f"   duration after trim: {len(trimmed)/sample_rate:.2f}s", file=sys.stderr)
    return 0


def _trim_trailing_silence(audio, sr, threshold_db=-40.0, min_silence_s=0.4):
    import numpy as np
    if audio.ndim > 1:
        audio = audio.squeeze()
    # RMS over 20ms windows
    window = max(1, int(0.02 * sr))
    rms = np.sqrt(np.convolve(audio.astype(np.float32) ** 2, np.ones(window) / window, mode="same"))
    threshold = 10 ** (threshold_db / 20.0)
    above = rms > threshold
    if not above.any():
        return audio
    # Last index of audible content
    last = int(np.where(above)[0][-1])
    # Keep up to 0.1s of trailing silence for natural fade
    end_idx = min(len(audio), last + int(0.1 * sr))
    return audio[:end_idx]


if __name__ == "__main__":
    sys.exit(main())
