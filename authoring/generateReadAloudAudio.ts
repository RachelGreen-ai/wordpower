#!/usr/bin/env -S node --import tsx/esm
/**
 * Generate learning narration + per-card clips for a read-aloud lesson.
 *
 * Usage:
 *   npm run tts:read-aloud -- --lesson ../web/src/read-aloud-corpus/lesson-attention-quiet-morning.json
 *   npm run tts:read-aloud -- --all --skipExisting
 */
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { generateTTS, type TTSBackend } from "./lib/tts.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, "..", "web");
const WEB_PUBLIC = resolve(WEB_DIR, "public");
const DEFAULT_VOICE = "af_heart";
const execFileAsync = promisify(execFile);

interface BilingualText {
  en: string;
  zh: string;
}

interface ReadAloudSource {
  title: string;
  author?: string;
  organization: string;
  url: string;
  note?: BilingualText;
}

interface ReadAloudSection {
  title: BilingualText;
  text: string;
  coaching: BilingualText;
}

interface ReadAloudLesson {
  lessonId: string;
  series: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  level: string;
  duration: string;
  tags: string[];
  sources: ReadAloudSource[];
  warmup: BilingualText;
  passage: {
    title: BilingualText;
    intro: BilingualText;
    sections: ReadAloudSection[];
  };
  vocabulary: Array<{
    term: string;
    meaning: BilingualText;
    use: BilingualText;
  }>;
  pronunciationFocus: BilingualText[];
  shadowingDrill: {
    prompt: BilingualText;
    steps: BilingualText[];
  };
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
  return `audio/read-aloud/${lessonId}/narration.mp3`;
}

function clipPath(lessonId: string, key: string): string {
  return `audio/read-aloud/${lessonId}/clips/${key.replaceAll(".", "_")}.mp3`;
}

function sentenceList(label: string, items: string[]): string {
  if (items.length === 0) return "";
  return `${label}. ${items.join(" ")} `;
}

function buildNarration(lesson: ReadAloudLesson): string {
  return [
    `Beautiful English read-aloud lesson. ${lesson.title.en}`,
    lesson.subtitle.en,
    `Warm-up. ${lesson.warmup.en}`,
    `Passage. ${lesson.passage.title.en}. ${lesson.passage.intro.en}`,
    ...lesson.passage.sections.flatMap((section) => [
      section.title.en,
      section.text,
      `Coaching. ${section.coaching.en}`,
    ]),
    sentenceList(
      "Vocabulary for voice",
      lesson.vocabulary.map((item) => `${item.term}. ${item.meaning.en} ${item.use.en}`),
    ),
    sentenceList("Pronunciation focus", lesson.pronunciationFocus.map((item) => item.en)),
    `Shadowing drill. ${lesson.shadowingDrill.prompt.en}`,
    sentenceList("Steps", lesson.shadowingDrill.steps.map((item) => item.en)),
    sentenceList("Reflection", lesson.reflection.map((item) => item.en)),
    "Practice by pausing after each section, then repeating one sentence in your own voice.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildClips(lesson: ReadAloudLesson): Clip[] {
  const clips: Clip[] = [];

  lesson.tags.forEach((tag, index) => {
    clips.push({ key: `tag.${index}`, text: tag });
  });

  clips.push(
    { key: "warmup", text: `Warm-up. ${lesson.warmup.en}` },
    { key: "passage.intro", text: `${lesson.passage.title.en}. ${lesson.passage.intro.en}` },
  );

  lesson.passage.sections.forEach((section, index) => {
    clips.push({
      key: `passage.sections.${index}`,
      text: `${section.title.en}. ${section.text}`,
    });
    clips.push({
      key: `passage.sections.${index}.coaching`,
      text: `Coaching. ${section.coaching.en}`,
    });
  });

  lesson.vocabulary.forEach((item, index) => {
    clips.push({
      key: `vocabulary.${index}`,
      text: `${item.term}. ${item.meaning.en} ${item.use.en}`,
    });
  });

  lesson.pronunciationFocus.forEach((item, index) => {
    clips.push({ key: `pronunciationFocus.${index}`, text: item.en });
  });

  clips.push({
    key: "shadowingDrill.prompt",
    text: `Shadowing drill. ${lesson.shadowingDrill.prompt.en}`,
  });

  lesson.shadowingDrill.steps.forEach((item, index) => {
    clips.push({ key: `shadowingDrill.steps.${index}`, text: `Step ${index + 1}. ${item.en}` });
  });

  lesson.reflection.forEach((item, index) => {
    clips.push({ key: `reflection.${index}`, text: item.en });
  });

  lesson.sources.forEach((source, index) => {
    clips.push({
      key: `sources.${index}`,
      text: [
        "Source inspiration.",
        source.title,
        source.author ?? "",
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
Usage: npm run tts:read-aloud -- --lesson <lesson-json> [--backend mlx|mock|elevenlabs] [--voice af_heart]
       npm run tts:read-aloud -- --all --skipExisting
`);
    process.exit(values.help ? 0 : 1);
  }

  const lessonPaths = values.all
    ? (await readdir(resolve(WEB_DIR, "src", "read-aloud-corpus")))
        .filter((file) => file.startsWith("lesson-") && file.endsWith(".json"))
        .sort()
        .map((file) => resolve(WEB_DIR, "src", "read-aloud-corpus", file))
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
  const raw = JSON.parse(await readFile(lessonPath, "utf8")) as ReadAloudLesson;
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
    await generateCompressedTTS({
      text,
      outPath: outAbsPath,
      backend: options.backend,
      voice: options.voice ?? DEFAULT_VOICE,
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
    await generateCompressedTTS({
      text: clip.text,
      outPath: abs,
      backend: options.backend,
      voice: options.voice ?? DEFAULT_VOICE,
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

async function generateCompressedTTS({
  text,
  outPath,
  backend,
  voice,
  temperature,
  timeoutMs,
}: {
  text: string;
  outPath: string;
  backend?: TTSBackend;
  voice: string;
  temperature: number;
  timeoutMs: number;
}) {
  const tempWavPath = outPath.replace(/\.mp3$/, ".tmp.wav");
  await generateTTS({
    text,
    outPath: tempWavPath,
    backend,
    voice,
    language: "en",
    temperature,
    timeoutMs,
  });
  await execFileAsync("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    tempWavPath,
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "80k",
    outPath,
  ]);
  await rm(tempWavPath, { force: true });
  console.error(`Compressed mp3 → ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
