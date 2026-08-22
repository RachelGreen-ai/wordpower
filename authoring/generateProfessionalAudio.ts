#!/usr/bin/env -S node --import tsx/esm
/**
 * Generate a single learning narration for a Professional English lesson.
 *
 * Usage:
 *   npm run tts:professional -- --lesson ../web/src/professional-corpus/lesson-foo.json
 *   npm run tts:professional -- --lesson ../web/src/professional-corpus/lesson-foo.json --backend mock
 */
import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
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
    phraseBank: LeadershipLine[];
    logicMoves: LeadershipLine[];
    conversationLessons: BilingualText[];
  };
  languageMove?: {
    title: BilingualText;
    anchor: {
      phrase: string;
      quote?: string;
    };
  };
  lines: LeadershipLine[];
  audio?: {
    narration?: string;
  };
}

function narrationPath(lessonId: string): string {
  return `audio/professional/${lessonId}/narration.wav`;
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

async function main() {
  const { values } = parseArgs({
    options: {
      lesson: { type: "string", short: "l" },
      backend: { type: "string", short: "b" },
      voice: { type: "string", short: "v" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help || !values.lesson) {
    console.error(`
Usage: npm run tts:professional -- --lesson <lesson-json> [--backend mlx|mock|elevenlabs] [--voice af_heart]
`);
    process.exit(values.help ? 0 : 1);
  }

  const lessonPath = resolve(values.lesson);
  const raw = JSON.parse(await readFile(lessonPath, "utf8")) as ProfessionalLesson;
  const text = buildNarration(raw);
  const outRelPath = narrationPath(raw.lessonId);
  const outAbsPath = resolve(WEB_PUBLIC, outRelPath);
  await mkdir(dirname(outAbsPath), { recursive: true });

  console.error(`Loading lesson: ${lessonPath}`);
  console.error(`Generating narration: ${outRelPath}`);
  console.error(`Text length: ${text.length} chars`);

  await generateTTS({
    text,
    outPath: outAbsPath,
    backend: (values.backend as TTSBackend | undefined) ?? undefined,
    voice: values.voice ?? DEFAULT_VOICE,
    language: "en",
    temperature: 0.45,
    timeoutMs: 10 * 60 * 1000,
  });

  const nextLesson = {
    ...raw,
    audio: {
      ...(raw.audio ?? {}),
      narration: outRelPath,
    },
  };
  await writeFile(lessonPath, `${JSON.stringify(nextLesson, null, 2)}\n`, "utf8");
  console.error(`Updated lesson audio.narration: ${outRelPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
