#!/usr/bin/env -S node --import tsx/esm
/**
 * Generate learning narration + per-card clips for a Professional English lesson.
 *
 * Usage:
 *   npm run tts:professional -- --lesson ../web/src/professional-corpus/lesson-foo.json
 *   npm run tts:professional -- --all --skipExisting
 *   npm run tts:professional -- --lesson ../web/src/professional-corpus/lesson-foo.json --backend mock
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

interface LeadershipLine {
  intent: BilingualText;
  line: string;
  why: BilingualText;
}

interface ProfessionalLesson {
  lessonId: string;
  title: BilingualText;
  subtitle: BilingualText;
  principle: BilingualText;
  scenario: {
    customer: string;
    weakResponse: string;
    reliableResponse: string;
  };
  talkAnalysis?: {
    flow: BilingualText[];
    phraseBank: LeadershipLine[];
    vocabulary: Array<{
      word: string;
      meaning: BilingualText;
      use: BilingualText;
    }>;
    logicMoves: LeadershipLine[];
    conversationLessons: BilingualText[];
  };
  languageMove?: {
    title: BilingualText;
    anchor: {
      phrase: string;
      quote?: string;
    };
    concept: BilingualText;
    examples: LeadershipLine[];
  };
  lines: LeadershipLine[];
  drill: {
    prompt: BilingualText;
    steps: Array<{
      en: string;
      zh: string;
      focus: BilingualText;
    }>;
  };
  source?: {
    title: string;
    speaker?: string;
    channel?: string;
    note?: BilingualText;
  };
  tags: string[];
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
  return `audio/professional/${lessonId}/narration.wav`;
}

function clipPath(lessonId: string, key: string): string {
  return `audio/professional/${lessonId}/clips/${key.replaceAll(".", "_")}.wav`;
}

function sentenceList(label: string, items: string[]): string {
  if (items.length === 0) return "";
  return `${label}. ${items.join(" ")} `;
}

function buildNarration(lesson: ProfessionalLesson): string {
  const phraseLines = lesson.talkAnalysis?.phraseBank.map((item) => {
    return `${item.intent.en}. ${item.line}`;
  }) ?? [];
  const logicLines = lesson.talkAnalysis?.logicMoves.slice(0, 2).map((item) => {
    return `${item.intent.en}. ${item.line}`;
  }) ?? [];
  const leadershipLines = lesson.lines.map((item) => {
    return `${item.intent.en}. ${item.line}`;
  });
  const lessons = lesson.talkAnalysis?.conversationLessons.map((item) => item.en) ?? [];

  return [
    `Professional English lesson. ${lesson.title.en}`,
    lesson.subtitle.en,
    `Core principle. ${lesson.principle.en}`,
    `Scenario. ${lesson.scenario.customer}`,
    `A stronger response. ${lesson.scenario.reliableResponse}`,
    lesson.languageMove
      ? `Language move. ${lesson.languageMove.title.en}. Anchor phrase: ${lesson.languageMove.anchor.phrase}.`
      : "",
    sentenceList("Phrase bank", phraseLines),
    sentenceList("Logic moves", logicLines),
    sentenceList("Leadership lines", leadershipLines),
    sentenceList("Conversation lessons", lessons),
    "Practice by pausing after each line and saying it in your own voice.",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildClips(lesson: ProfessionalLesson): Clip[] {
  const clips: Clip[] = [];

  lesson.tags.forEach((tag, index) => {
    clips.push({ key: `tag.${index}`, text: tag });
  });

  if (lesson.source) {
    clips.push({
      key: "source",
      text: [
        "Source.",
        lesson.source.title,
        lesson.source.speaker ? `Speaker: ${lesson.source.speaker}.` : "",
        lesson.source.channel ? `Channel: ${lesson.source.channel}.` : "",
        lesson.source.note?.en ?? "",
      ].filter(Boolean).join(" "),
    });
  }

  clips.push(
    { key: "scenario.customer", text: `Customer says. ${lesson.scenario.customer}` },
    { key: "scenario.weakResponse", text: `Weak response. ${lesson.scenario.weakResponse}` },
    { key: "scenario.reliableResponse", text: `Reliable response. ${lesson.scenario.reliableResponse}` },
    { key: "principle", text: `Core principle. ${lesson.principle.en}` },
  );

  lesson.talkAnalysis?.flow.forEach((item, index) => {
    clips.push({ key: `talkAnalysis.flow.${index}`, text: `Flow step ${index + 1}. ${item.en}` });
  });
  lesson.talkAnalysis?.phraseBank.forEach((item, index) => {
    clips.push({
      key: `talkAnalysis.phraseBank.${index}`,
      text: `${item.intent.en}. ${item.line}. Why it works: ${item.why.en}`,
    });
  });
  lesson.talkAnalysis?.logicMoves.forEach((item, index) => {
    clips.push({
      key: `talkAnalysis.logicMoves.${index}`,
      text: `${item.intent.en}. ${item.line}. Why it works: ${item.why.en}`,
    });
  });
  lesson.talkAnalysis?.vocabulary.forEach((item, index) => {
    clips.push({
      key: `talkAnalysis.vocabulary.${index}`,
      text: `${item.word}. ${item.meaning.en} ${item.use.en}`,
    });
  });
  lesson.talkAnalysis?.conversationLessons.forEach((item, index) => {
    clips.push({ key: `talkAnalysis.conversationLessons.${index}`, text: item.en });
  });

  if (lesson.languageMove) {
    clips.push(
      {
        key: "languageMove.anchor",
        text: `Anchor phrase. ${lesson.languageMove.anchor.phrase}. ${lesson.languageMove.anchor.quote ?? ""}`,
      },
      {
        key: "languageMove.concept",
        text: `Language move. ${lesson.languageMove.title.en}. ${lesson.languageMove.concept.en}`,
      },
    );
    lesson.languageMove.examples.forEach((item, index) => {
      clips.push({
        key: `languageMove.examples.${index}`,
        text: `${item.intent.en}. ${item.line}. Why it works: ${item.why.en}`,
      });
    });
  }

  lesson.lines.forEach((item, index) => {
    clips.push({
      key: `lines.${index}`,
      text: `${item.intent.en}. ${item.line}. Why it works: ${item.why.en}`,
    });
  });

  clips.push({
    key: "drill.prompt",
    text: `Practice drill. ${lesson.drill.prompt.en}`,
  });
  lesson.drill.steps.forEach((item, index) => {
    clips.push({
      key: `drill.steps.${index}`,
      text: `${item.en}. Focus: ${item.focus.en}`,
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
Usage: npm run tts:professional -- --lesson <lesson-json> [--backend mlx|mock|elevenlabs] [--voice af_heart]
       npm run tts:professional -- --all --skipExisting
`);
    process.exit(values.help ? 0 : 1);
  }

  const lessonPaths = values.all
    ? (await readdir(resolve(WEB_DIR, "src", "professional-corpus")))
        .filter((file) => file.startsWith("lesson-") && file.endsWith(".json"))
        .sort()
        .map((file) => resolve(WEB_DIR, "src", "professional-corpus", file))
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
  const raw = JSON.parse(await readFile(lessonPath, "utf8")) as ProfessionalLesson;
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
