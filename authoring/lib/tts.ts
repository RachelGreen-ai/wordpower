/**
 * authoring/lib/tts.ts — Typed Node wrapper around the bundled TTS tool.
 *
 * Spawns authoring/tts/tts.py inside its venv, captures stderr for progress
 * lines, and returns the path written.
 *
 * The TTS tool is self-contained in authoring/tts/ (Python + mlx-audio; the
 * .venv is created locally by tts/setup.sh and is git-ignored). Resolution
 * order for TTS_DIR:
 *   1. process.env.TTS_DIR (explicit override — e.g. to reuse an existing venv)
 *   2. ../tts/ (the bundled tool, relative to this file at authoring/lib/)
 *
 * Usage:
 *   import { generateTTS } from "./lib/tts";
 *   const wav = await generateTTS({ text: "Hello", outPath: "audio/out.wav" });
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TTS_DIR = process.env.TTS_DIR ?? resolve(__dirname, "..", "tts");
const VENV_PY = resolve(TTS_DIR, ".venv", "bin", "python");
const TTS_SCRIPT = resolve(TTS_DIR, "tts.py");

export type TTSBackend = "mlx" | "mock" | "elevenlabs";
export type TTSLanguage = "en" | "zh" | "ko" | "de" | "es";

export interface TTSOptions {
  /** Text to synthesize. Required, must be non-empty. */
  text: string;
  /** Output path. Recommend .wav extension. Parent dir auto-created. */
  outPath: string;
  /** Backend override. Defaults to TTS_BACKEND env or "mlx". */
  backend?: TTSBackend;
  /** Voice label (e.g. "belinda") OR absolute path to a reference .wav for cloning. */
  voice?: string;
  /** Language code. Defaults to "en". */
  language?: TTSLanguage;
  /** Higgs model id override (HF or local path). */
  model?: string;
  /** Sampling temperature. 0.3 = stable, 0.7 = expressive. */
  temperature?: number;
  /** Stream progress lines to console.error. Defaults to true. */
  verbose?: boolean;
  /** Timeout in ms. Defaults to 5 minutes. */
  timeoutMs?: number;
}

export interface TTSResult {
  outPath: string;
  durationMs: number;
  backend: TTSBackend;
}

export class TTSError extends Error {
  constructor(message: string, public exitCode: number | null, public stderr: string) {
    super(message);
    this.name = "TTSError";
  }
}

/**
 * Generate a single audio file. Resolves with the absolute path written.
 * Rejects with TTSError if the Python process exits non-zero.
 */
export async function generateTTS(opts: TTSOptions): Promise<TTSResult> {
  if (!opts.text || !opts.text.trim()) {
    throw new TTSError("text is required and must be non-empty", null, "");
  }

  const outPath = resolve(opts.outPath);
  await mkdir(dirname(outPath), { recursive: true });

  // Pick the Python interpreter. Prefer the venv; fall back to system python3
  // if the venv doesn't exist yet (so error messages are helpful).
  const pythonBin = existsSync(VENV_PY) ? VENV_PY : "python3";
  if (pythonBin !== VENV_PY && opts.verbose !== false) {
    console.error(
      `[tts] venv not found at ${VENV_PY} — using system python3. Run authoring/tts/setup.sh.`
    );
  }

  const args: string[] = [
    TTS_SCRIPT,
    "--text", opts.text,
    "--out", outPath,
    "--backend", opts.backend ?? process.env.TTS_BACKEND ?? "mlx",
    "--lang", opts.language ?? (process.env.TTS_LANG as TTSLanguage) ?? "en",
  ];
  if (opts.voice) args.push("--voice", opts.voice);
  if (opts.model) args.push("--model", opts.model);
  if (opts.temperature !== undefined) args.push("--temperature", String(opts.temperature));

  const t0 = Date.now();
  const stderr = await runPython(pythonBin, args, opts);
  const durationMs = Date.now() - t0;

  return {
    outPath,
    durationMs,
    backend: (opts.backend ?? process.env.TTS_BACKEND ?? "mlx") as TTSBackend,
  };

  // ---- inner ----
  function runPython(bin: string, argv: string[], o: TTSOptions): Promise<string> {
    return new Promise((resolveP, rejectP) => {
      const verbose = o.verbose !== false;
      const timeoutMs = o.timeoutMs ?? 5 * 60 * 1000;

      const child = spawn(bin, argv, {
        cwd: TTS_DIR,
        env: { ...process.env },
      });

      let stderrBuf = "";
      child.stderr.on("data", (chunk: Buffer) => {
        const s = chunk.toString();
        stderrBuf += s;
        if (verbose) process.stderr.write(s);
      });

      // Suppress stdout — higgs_tts.py reserves stdout for future structured output.
      child.stdout.on("data", () => {});

      const timer = setTimeout(() => {
        child.kill("SIGTERM");
        rejectP(new TTSError(`TTS timed out after ${timeoutMs}ms`, null, stderrBuf));
      }, timeoutMs);

      child.on("error", (err) => {
        clearTimeout(timer);
        rejectP(new TTSError(`spawn failed: ${err.message}`, null, stderrBuf));
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolveP(stderrBuf);
        } else {
          rejectP(
            new TTSError(
              `TTS exited with code ${code}. stderr:\n${stderrBuf.trim()}`,
              code,
              stderrBuf
            )
          );
        }
      });
    });
  }
}

/**
 * Convenience: generate multiple TTS clips in series.
 * (We don't parallelize by default — Higgs Audio is memory-heavy and back-to-back
 *  single-process runs are usually faster than spawning two competing for unified memory.)
 */
export async function generateTTSBatch(
  items: TTSOptions[]
): Promise<TTSResult[]> {
  const results: TTSResult[] = [];
  for (const item of items) {
    results.push(await generateTTS(item));
  }
  return results;
}
