#!/usr/bin/env bash
# scripts/tts/test_tts.sh — Smoke test the TTS pipeline.
#
# Tries mock backend first (instant, no model download), then prompts for
# whether to also test the MLX backend (downloads ~2-6 GB on first run).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
cd "$REPO_ROOT"

VENV="$HERE/.venv"
if [[ ! -d "$VENV" ]]; then
  echo "ERROR: venv not found. Run: bash scripts/tts/setup.sh" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$VENV/bin/activate"

mkdir -p audio/samples

echo "=== 1/3: mock backend (macOS \`say\`) ==="
python scripts/tts/higgs_tts.py \
  --text "Argentina won 2 to 1, but Morocco had higher expected goals." \
  --backend mock \
  --out audio/samples/test_mock.wav
ls -lh audio/samples/test_mock.* 2>/dev/null || echo "  no output found"

echo ""
echo "=== 2/3: mock Chinese (validates zh path) ==="
python scripts/tts/higgs_tts.py \
  --text "阿根廷赢了二比一，但摩洛哥的预期进球更高。" \
  --backend mock --lang zh \
  --out audio/samples/test_mock_zh.wav
ls -lh audio/samples/test_mock_zh.* 2>/dev/null || echo "  no output found"

echo ""
echo "=== 3/3: mlx backend (Higgs Audio v2) ==="
read -r -p "Run MLX test? Downloads ~2-6 GB on first run. [y/N] " yn
case "$yn" in
  [Yy]*)
    python scripts/tts/higgs_tts.py \
      --text "Welcome to the World Cup 2026 data pipeline." \
      --backend mlx \
      --out audio/samples/test_mlx.wav
    ls -lh audio/samples/test_mlx.* 2>/dev/null
    ;;
  *) echo "  skipped." ;;
esac

echo ""
echo "✅ Smoke test done. Play the files with: afplay audio/samples/test_mock.wav"
