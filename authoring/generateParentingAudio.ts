#!/usr/bin/env -S node --import tsx/esm
/**
 * Generate learning narration + per-card clips for a Parenting lesson.
 *
 * Usage:
 *   npm run tts:parenting -- --lesson ../web/src/parenting-corpus/lesson-parenting-01-shy-with-dignity.json
 *   npm run tts:parenting -- --all --skipExisting
 */
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateTTS, type TTSBackend } from "./lib/tts.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, "..", "web");
const WEB_PUBLIC = resolve(WEB_DIR, "public");
const DEFAULT_VOICE = "af_heart";

interface BilingualText {
  en: string;
  zh: string;
}

interface ParentingSource {
  title: string;
  organization: string;
  url: string;
  note?: BilingualText;
}

interface ParentingPhrase {
  audience: BilingualText;
  line: string;
  why: BilingualText;
}

interface ParentingLesson {
  lessonId: string;
  series: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  audience: string;
  tags: string[];
  sources: ParentingSource[];
  moment: {
    context: string;
    avoid: string;
    better: string;
  };
  principle: BilingualText;
  frames: BilingualText[];
  phraseBank: ParentingPhrase[];
  vocabulary: Array<{
    term: string;
    meaning: BilingualText;
    use: BilingualText;
  }>;
  scripts: ParentingPhrase[];
  reflection: BilingualText[];
  audio?: {
    narration?: string;
    clips?: Record<string, string>;
  };
}

interface Clip {
  key: string;
  text: string;
}

function narrationPath(lessonId: string): string {
  return `audio/parenting/${lessonId}/narration.wav`;
}

function clipPath(lessonId: string, key: string): string {
  return `audio/parenting/${lessonId}/clips/${key.replaceAll(".", "_")}.wav`;
}

function sentenceList(label: string, items: string[]): string {
  if (items.length === 0) return "";
  return `${label}. ${items.join(" ")} `;
}

function buildNarration(lesson: ParentingLesson): string {
  return [
    `Parenting English lesson. ${lesson.title.en}`,
    lesson.subtitle.en,
    `Core principle. ${lesson.principle.en}`,
    `Parenting moment. ${lesson.moment.context}`,
    `Avoid saying. ${lesson.moment.avoid}`,
    `Say with regard. ${lesson.moment.better}`,
    sentenceList("Frames", lesson.frames.map((item) => item.en)),
    sentenceList(
      "Phrase bank",
      lesson.phraseBank.map((item) => `${item.audience.en}. ${item.line}`),
    ),
    sentenceList(
      "Vocabulary",
      lesson.vocabulary.map((item) => `${item.term}. ${item.meaning.en}`),
    ),
    sentenceList(
      "Scripts",
      lesson.scripts.map((item) => `${item.audience.en}. ${item.line}`),
    ),
    sentenceList("Reflection", lesson.reflection.map((item) => item.en)),
    "Practice by pausing after each line and saying it in your own voice.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildClips(lesson: ParentingLesson): Clip[] {
  const clips: Clip[] = [];

  lesson.tags.forEach((tag, index) => {
    clips.push({ key: `tag.${index}`, text: tag });
  });

  clips.push(
    { key: "moment.context", text: `Context. ${lesson.moment.context}` },
    { key: "moment.avoid", text: `Avoid saying. ${lesson.moment.avoid}` },
    { key: "moment.better", text: `Say with regard. ${lesson.moment.better}` },
    { key: "principle", text: `Core principle. ${lesson.principle.en}` },
  );

  lesson.frames.forEach((item, index) => {
    clips.push({ key: `frames.${index}`, text: `Frame ${index + 1}. ${item.en}` });
  });
  lesson.phraseBank.forEach((item, index) => {
    clips.push({
      key: `phraseBank.${index}`,
      text: `${item.audience.en}. ${item.line}. Why it works: ${item.why.en}`,
    });
  });
  lesson.vocabulary.forEach((item, index) => {
    clips.push({
      key: `vocabulary.${index}`,
      text: `${item.term}. ${item.meaning.en} ${item.use.en}`,
    });
  });
  lesson.scripts.forEach((item, index) => {
    clips.push({
      key: `scripts.${index}`,
      text: `${item.audience.en}. ${item.line}. Why it works: ${item.why.en}`,
    });
  });
  lesson.reflection.forEach((item, index) => {
    clips.push({ key: `reflection.${index}`, text: item.en });
  });
  lesson.sources.forEach((source, index) => {
    clips.push({
      key: `sources.${index}`,
      text: [
        "Source.",
        source.title,
        source.organization,
        source.note?.en ?? "",
      ].filter(Boolean).join(" "),
    });
  });

  return clips.filter((clip) => clip.text.trim().length > 0);
}

async function main() {
  const { values } = parseArgs({
    options: {
      lesson: { type: "string", short: "l" },
      all: { type: "boolean", short: "a" },
      backend: { type: "string", short: "b" },
      voice: { type: "string", short: "v" },
      skipExisting: { type: "boolean" },
      only: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help || (!values.lesson && !values.all)) {
    console.error(`
Usage: npm run tts:parenting -- --lesson <lesson-json> [--backend mlx|mock|elevenlabs] [--voice af_heart]
       npm run tts:parenting -- --all --skipExisting
`);
    process.exit(values.help ? 0 : 1);
  }

  const lessonPaths = values.all
    ? (await readdir(resolve(WEB_DIR, "src", "parenting-corpus")))
        .filter((file) => file.startsWith("lesson-") && file.endsWith(".json"))
        .sort()
        .map((file) => resolve(WEB_DIR, "src", "parenting-corpus", file))
    : [resolve(values.lesson!)];

  for (const lessonPath of lessonPaths) {
    await generateLessonAudio(lessonPath, {
      backend: values.backend as TTSBackend | undefined,
      voice: values.voice,
      skipExisting: values.skipExisting ?? false,
      only: values.only,
    });
  }
}

async function generateLessonAudio(
  lessonPath: string,
  options: {
    backend?: TTSBackend;
    voice?: string;
    skipExisting: boolean;
    only?: string;
  },
) {
  const raw = JSON.parse(await readFile(lessonPath, "utf8")) as ParentingLesson;
  const text = buildNarration(raw);
  const outRelPath = narrationPath(raw.lessonId);
  const outAbsPath = resolve(WEB_PUBLIC, outRelPath);
  const existingClips = raw.audio?.clips ?? {};
  const only = options.only
    ? new Set(options.only.split(",").map((item) => item.trim()).filter(Boolean))
    : null;
  await mkdir(dirname(outAbsPath), { recursive: true });

  console.error(`Loading lesson: ${lessonPath}`);
  console.error(`Generating narration: ${outRelPath}`);
  console.error(`Text length: ${text.length} chars`);

  if (!only && (!options.skipExisting || !existsSync(outAbsPath))) {
    await generateTTS({
      text,
      outPath: outAbsPath,
      backend: options.backend,
      voice: options.voice ?? DEFAULT_VOICE,
      language: "en",
      temperature: 0.45,
      timeoutMs: 30 * 60 * 1000,
    });
  } else if (!only) {
    console.error(`Skipping existing narration: ${outRelPath}`);
  }

  const nextClips = { ...existingClips };
  const clips = buildClips(raw);
  console.error(`Generating ${clips.length} clip(s)`);

  for (const clip of clips) {
    if (only && !only.has(clip.key)) continue;

    const rel = clipPath(raw.lessonId, clip.key);
    const abs = resolve(WEB_PUBLIC, rel);
    if (options.skipExisting && existsSync(abs)) {
      nextClips[clip.key] = rel;
      console.error(`Skipping existing clip: ${clip.key}`);
      continue;
    }

    console.error(`Clip ${clip.key}: ${clip.text.slice(0, 90)}${clip.text.length > 90 ? "..." : ""}`);
    await generateTTS({
      text: clip.text,
      outPath: abs,
      backend: options.backend,
      voice: options.voice ?? DEFAULT_VOICE,
      language: "en",
      temperature: 0.35,
      timeoutMs: 5 * 60 * 1000,
    });
    nextClips[clip.key] = rel;
  }

  const nextLesson = {
    ...raw,
    audio: {
      ...(raw.audio ?? {}),
      narration: outRelPath,
      clips: nextClips,
    },
  };
  await writeFile(lessonPath, `${JSON.stringify(nextLesson, null, 2)}\n`, "utf8");
  console.error(`Updated lesson audio.narration: ${outRelPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
