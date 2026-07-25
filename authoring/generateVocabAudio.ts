#!/usr/bin/env -S node --import tsx/esm
/**
 * authoring/generateVocabAudio.ts — Pre-render all TTS audio for a vocab lesson.
 *
 * Reads a lesson JSON from web/src/corpus/, walks every audio slot, calls
 * generateTTS once per slot (with a slot-appropriate temperature), writes each
 * .wav under web/public/audio/vocab/<lessonId>/, then writes the resolved
 * `audio` map back into the lesson JSON. The learning site auto-discovers the
 * new lesson + audio on the next reload (import.meta.glob over the corpus).
 *
 * Usage:
 *   npm run tts:vocab                              # default: lesson-ego-ego-alt.json
 *   npm run tts:vocab -- --lesson <path>           # explicit lesson JSON
 *   npm run tts:vocab -- --backend mock            # quick smoke test (no MLX)
 *   npm run tts:vocab -- --only word.0.pronunciation
 *
 * Audio slot keys (kept in sync with the VocabLesson video composition):
 *   hook.headline
 *   word.0.pronunciation | word.0.definition | word.0.etymology | word.0.sentence.0 | word.0.sentence.1
 *   word.1.*  (same five slots)
 *   word.2.*  (same five slots)
 *   twist.setup | twist.left | twist.right | twist.closing
 *   recap.reflection
 */
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTTS, TTSError, type TTSBackend } from "./lib/tts.ts";
import { VocabLessonSchema, type VocabLesson } from "../web/src/corpus-types/vocab.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Canonical content lives inside the web app (the deployable product):
//   lessons → web/src/corpus/lesson-*.json   audio → web/public/audio/vocab/...
const WEB_DIR = resolve(__dirname, "..", "web");
const CORPUS_DIR = resolve(WEB_DIR, "src", "corpus");
const WEB_PUBLIC = resolve(WEB_DIR, "public");
const DEFAULT_LESSON = resolve(CORPUS_DIR, "lesson-ego-ego-alt.json");

interface Slot {
  key: string;          // e.g. "word.0.pronunciation"
  text: string;         // text to synthesize
  temperature: number;  // per-slot expressiveness
  narrative?: boolean;  // narrative copy without target word or etymology — skipped by default to save TTS resources
}

/** Resource-saving rule: skip TTS for slots whose text doesn't carry word
 *  pronunciation or etymology content (e.g. titles, definitions, twist setup
 *  & closing aphorisms, recap reflection). These play silently in the video
 *  and have no "say it" button on the site. Override with --narrative. */
const NARRATIVE_SLOT_KEYS = new Set([
  "hook.headline",
  "twist.setup",
  "twist.closing",
  "recap.reflection",
]);

function isNarrativeSlot(key: string): boolean {
  if (NARRATIVE_SLOT_KEYS.has(key)) return true;
  // Per-word definitions describe what the word means but don't say it — narrative.
  if (/^word\.\d+\.definition$/.test(key)) return true;
  return false;
}

function buildSlots(lesson: VocabLesson): Slot[] {
  const slots: Slot[] = [];

  // Hook — emotional cadence
  slots.push({
    key: "hook.headline",
    text: `${lesson.hook.headline.en} ${lesson.hook.subtext.en}`,
    temperature: 0.6,
  });

  // Per-word slots
  lesson.words.forEach((w, i) => {
    slots.push({
      key: `word.${i}.pronunciation`,
      // Speak the word clearly, slowly, then once more — helps the listener catch it.
      text: `${w.word}. ${w.word}.`,
      temperature: 0.3,
    });
    slots.push({
      key: `word.${i}.definition`,
      text: w.definition.en,
      temperature: 0.4,
    });
    slots.push({
      key: `word.${i}.etymology`,
      text: `${w.etymology.en} ${
        w.etymology.relatives.length > 0
          ? `Cousins: ${w.etymology.relatives.map((r) => r.word).join(", ")}.`
          : ""
      }`.trim(),
      temperature: 0.4,
    });
    w.sentences.forEach((s, j) => {
      slots.push({ key: `word.${i}.sentence.${j}`, text: s.en, temperature: 0.4 });
    });
  });

  // Twist — slight gravity
  slots.push({ key: "twist.setup", text: lesson.twist.setup.en, temperature: 0.4 });
  slots.push({
    key: "twist.left",
    text: `${lesson.twist.leftLabel}: ${lesson.twist.leftLine.en}.`,
    temperature: 0.4,
  });
  slots.push({
    key: "twist.right",
    text: `${lesson.twist.rightLabel}: ${lesson.twist.rightLine.en}.`,
    temperature: 0.4,
  });
  slots.push({ key: "twist.closing", text: lesson.twist.closing.en, temperature: 0.4 });

  // Recap — reflective cadence
  slots.push({ key: "recap.reflection", text: lesson.recap.reflection.en, temperature: 0.6 });

  // Vocabulary expansion (word family) — pronunciation only, one slot per entry
  lesson.vocabularyExpansion.forEach((item, i) => {
    slots.push({
      key: `expansion.${i}.pronunciation`,
      text: `${item.word}. ${item.word}.`,
      temperature: 0.3,
    });
  });

  return slots;
}

function slotToPath(lessonId: string, slot: string): string {
  // Stored in the lesson JSON as "audio/vocab/<id>/<slot>.wav"; the site serves
  // it from web/public, so AudioButton loads it at URL "/audio/vocab/...".
  return `audio/vocab/${lessonId}/${slot}.wav`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      lesson: { type: "string", short: "l" },
      backend: { type: "string", short: "b" },
      only: { type: "string" },           // CSV of slot keys to (re)generate
      skipExisting: { type: "boolean" },  // skip slots whose audio path already exists in JSON
      narrative: { type: "boolean" },     // include narrative slots (hook, definitions, twist setup/closing, recap)
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.error(`
Usage: npm run tts:vocab -- [options]

Options:
  --lesson, -l       Path to lesson JSON (default: web/src/corpus/lesson-ego-ego-alt.json)
  --backend, -b      mlx (default) | mock | elevenlabs
  --only             CSV of slot keys to (re)generate (default: all)
  --skipExisting     Skip slots whose audio path is already populated
  --narrative        Include narrative slots (hook, definitions, twist setup/closing,
                     recap reflection). Skipped by default to save TTS resources —
                     these slots don't say the target word or teach etymology.
                     Pass when rendering a video that needs all narration.
  --help, -h         Show this help
`);
    process.exit(0);
  }

  const lessonPath = values.lesson ? resolve(values.lesson) : DEFAULT_LESSON;
  const backend = (values.backend as TTSBackend | undefined) ?? undefined;
  const only = values.only ? new Set(values.only.split(",").map((s) => s.trim())) : null;
  const includeNarrative = !!values.narrative;

  console.error(`📖 Loading lesson: ${lessonPath}`);
  const raw = JSON.parse(await readFile(lessonPath, "utf8"));
  const lesson = VocabLessonSchema.parse(raw);

  const slots = buildSlots(lesson);
  const audio = { ...(lesson.audio ?? {}) };

  const narrativeCount = slots.filter((s) => isNarrativeSlot(s.key)).length;
  console.error(`🎙  ${slots.length} audio slots total`);
  if (only) console.error(`   filtering to ${only.size} slot(s): ${[...only].join(", ")}`);
  if (backend) console.error(`   backend: ${backend}`);
  if (!includeNarrative && narrativeCount > 0) {
    console.error(`   ⏭  skipping ${narrativeCount} narrative slot(s) — pass --narrative to include`);
  }

  let done = 0;
  let skipped = 0;
  for (const slot of slots) {
    if (only && !only.has(slot.key)) {
      skipped++;
      continue;
    }
    // Narrative-slot skip: when --narrative is NOT set, skip slots that
    // don't say the word or teach etymology. (--only overrides this — if
    // the user explicitly listed a narrative slot, they want it.)
    if (!includeNarrative && !only && isNarrativeSlot(slot.key)) {
      console.error(`⏭  ${slot.key} — narrative (use --narrative to include)`);
      skipped++;
      continue;
    }
    if (values.skipExisting && audio[slot.key]) {
      console.error(`⏭  ${slot.key} — already exists (${audio[slot.key]})`);
      skipped++;
      continue;
    }

    const outRelPath = slotToPath(lesson.lessonId, slot.key);
    const outAbsPath = resolve(WEB_PUBLIC, outRelPath);
    await mkdir(dirname(outAbsPath), { recursive: true });

    console.error(`🔊 [${++done}/${slots.length - skipped}] ${slot.key} → ${outRelPath}`);
    console.error(`   text: ${slot.text.slice(0, 80)}${slot.text.length > 80 ? "…" : ""}`);

    try {
      const result = await generateTTS({
        text: slot.text,
        outPath: outAbsPath,
        backend,
        temperature: slot.temperature,
        verbose: false,
      });
      audio[slot.key] = outRelPath;
      console.error(`   ✅ ${(result.durationMs / 1000).toFixed(1)}s elapsed`);
    } catch (e) {
      if (e instanceof TTSError) {
        console.error(`   ❌ TTS failed (exit ${e.exitCode}): ${e.message.split("\n")[0]}`);
      } else {
        console.error("   ❌ Unexpected error:", e);
      }
      process.exit(1);
    }
  }

  // Write the updated lesson JSON with the audio map.
  const updated: VocabLesson = { ...lesson, audio };
  await writeFile(lessonPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.error(`\n💾 Updated lesson JSON: ${lessonPath}`);
  console.error(`   audio slots populated: ${Object.keys(audio).length}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
