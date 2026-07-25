#!/usr/bin/env bash
# scripts/tts/setup.sh — One-shot setup for Higgs Audio TTS on Apple Silicon.
#
# What it does:
#   1. Creates a Python 3.10+ venv at scripts/tts/.venv
#   2. Installs mlx-audio + dependencies
#   3. (Optional) Pre-warms a quick model download check
#
# Re-run safe. Idempotent. Doesn't touch global Python.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "→ Working directory: $HERE"

# --- 1. Pick a Python interpreter -------------------------------------------
# mlx-audio works with Python 3.10–3.12. Prefer 3.11 if available.
PY_CMD=""
for candidate in python3.11 python3.12 python3.10 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PY_CMD="$candidate"
    PY_VER=$("$candidate" --version 2>&1 | awk '{print $2}')
    echo "→ Using $candidate ($PY_VER)"
    break
  fi
done
if [[ -z "$PY_CMD" ]]; then
  echo "ERROR: no python3 found. Install Python 3.10+ via Homebrew: brew install python@3.11" >&2
  exit 1
fi

# --- 2. Create venv ----------------------------------------------------------
if [[ ! -d ".venv" ]]; then
  echo "→ Creating venv at scripts/tts/.venv"
  "$PY_CMD" -m venv .venv
fi

# shellcheck source=/dev/null
source .venv/bin/activate

# --- 3. Install deps ---------------------------------------------------------
echo "→ Upgrading pip"
pip install --quiet --upgrade pip

echo "→ Installing requirements (this can take a few minutes the first time)"
pip install --quiet -r requirements.txt

# --- 4. Verify imports -------------------------------------------------------
echo "→ Verifying imports"
python - <<'PY'
import sys
try:
    import mlx, mlx_audio, soundfile, numpy
    print(f"  mlx       : {mlx.__version__ if hasattr(mlx, '__version__') else 'ok'}")
    print(f"  mlx_audio : {getattr(mlx_audio, '__version__', 'ok')}")
    print(f"  soundfile : {soundfile.__version__}")
    print(f"  numpy     : {numpy.__version__}")
except ImportError as e:
    print(f"FAIL: {e}", file=sys.stderr); sys.exit(1)
PY

echo ""
echo "✅ TTS environment ready."
echo ""
echo "Next steps:"
echo "  1. Run the smoke test:   bash scripts/tts/test_tts.sh"
echo "  2. Or generate manually:"
echo "     source scripts/tts/.venv/bin/activate"
echo "     python scripts/tts/higgs_tts.py --text 'Hello' --out audio/hello.wav"
echo ""
echo "Note: First run with --backend mlx downloads model weights (~6 GB for bf16, ~2 GB for 4-bit)"
echo "      to ~/.cache/huggingface/. Subsequent runs are fast (cached)."
