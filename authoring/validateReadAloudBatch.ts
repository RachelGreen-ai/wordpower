#!/usr/bin/env -S node --import tsx/esm
/**
 * Quality gate for Beautiful English Read-Aloud lessons.
 *
 * Checks:
 * - JSON shape and duplicate IDs
 * - source attribution exists
 * - passage has speakable length and section coaching
 * - every UI audio slot has an mp3 file
 * - full narration is normally 3-5 minutes
 *
 * Usage:
 *   npm run validate:read-aloud
 *   npm run validate:read-aloud -- --lesson ../web/src/read-aloud-corpus/lesson-x.json
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_DIR = resolve(__dirname, "..", "web");
const WEB_PUBLIC = resolve(WEB_DIR, "public");
const READ_ALOUD_DIR = resolve(WEB_DIR, "src", "read-aloud-corpus");

interface BilingualText {
  en: string;
  zh: string;
}

interface ReadAloudLesson {
  lessonId: string;
  series: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  level: string;
  duration: string;
  tags: string[];
  sources: Array<{
    title: string;
    author?: string;
    organization: string;
    url: string;
    note?: BilingualText;
  }>;
  warmup: BilingualText;
  passage: {
    title: BilingualText;
    intro: BilingualText;
    sections: Array<{
      title: BilingualText;
      text: string;
      coaching: BilingualText;
    }>;
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

interface ValidationIssue {
  severity: "error" | "warning";
  lessonId: string;
  message: string;
}

function isBilingual(value: unknown): value is BilingualText {
  const maybe = value as BilingualText;
  return Boolean(
    maybe &&
      typeof maybe.en === "string" &&
      maybe.en.trim() &&
      typeof maybe.zh === "string" &&
      maybe.zh.trim(),
  );
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clipKeys(lesson: ReadAloudLesson): string[] {
  const keys: string[] = [];
  lesson.tags.forEach((_, index) => keys.push(`tag.${index}`));
  keys.push("warmup", "passage.intro");
  lesson.passage.sections.forEach((_, index) => {
    keys.push(`passage.sections.${index}`);
    keys.push(`passage.sections.${index}.coaching`);
  });
  lesson.vocabulary.forEach((_, index) => keys.push(`vocabulary.${index}`));
  lesson.pronunciationFocus.forEach((_, index) => keys.push(`pronunciationFocus.${index}`));
  keys.push("shadowingDrill.prompt");
  lesson.shadowingDrill.steps.forEach((_, index) => keys.push(`shadowingDrill.steps.${index}`));
  lesson.reflection.forEach((_, index) => keys.push(`reflection.${index}`));
  lesson.sources.forEach((_, index) => keys.push(`sources.${index}`));
  return keys;
}

async function audioDurationSeconds(relPath: string): Promise<number | null> {
  const absPath = resolve(WEB_PUBLIC, relPath);
  if (!existsSync(absPath)) return null;
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nk=1:nw=1",
    absPath,
  ]);
  const value = Number.parseFloat(stdout.trim());
  return Number.isFinite(value) ? value : null;
}

async function validateLesson(filePath: string, seenIds: Set<string>): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const raw = JSON.parse(await readFile(filePath, "utf8")) as ReadAloudLesson;
  const lessonId = raw.lessonId || filePath;
  const add = (severity: ValidationIssue["severity"], message: string) => {
    issues.push({ severity, lessonId, message });
  };

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw.lessonId)) {
    add("error", "lessonId must be kebab-case and non-empty.");
  }
  if (seenIds.has(raw.lessonId)) add("error", "duplicate lessonId.");
  seenIds.add(raw.lessonId);

  for (const [label, value] of [
    ["series", raw.series],
    ["title", raw.title],
    ["subtitle", raw.subtitle],
    ["warmup", raw.warmup],
    ["passage.title", raw.passage?.title],
    ["passage.intro", raw.passage?.intro],
    ["shadowingDrill.prompt", raw.shadowingDrill?.prompt],
  ] as const) {
    if (!isBilingual(value)) add("error", `${label} must include English and Chinese text.`);
  }

  if (!Array.isArray(raw.tags) || raw.tags.length < 3) {
    add("warning", "use at least three tags for discovery and variety.");
  }
  if (!Array.isArray(raw.sources) || raw.sources.length < 1) {
    add("error", "at least one source or inspiration note is required.");
  } else {
    raw.sources.forEach((source, index) => {
      if (!source.title || !source.organization || !source.url) {
        add("error", `sources.${index} needs title, organization, and url.`);
      }
      if (source.note && !isBilingual(source.note)) {
        add("warning", `sources.${index}.note should be bilingual.`);
      }
    });
  }

  const sections = raw.passage?.sections ?? [];
  if (!Array.isArray(sections) || sections.length < 3) {
    add("error", "passage should have at least three sections.");
  }
  const passageWords = sections.reduce((total, section) => total + wordCount(section.text ?? ""), 0);
  if (passageWords < 300 || passageWords > 950) {
    add("warning", `passage has ${passageWords} words; target a speakable 300-950 words.`);
  }
  sections.forEach((section, index) => {
    if (!isBilingual(section.title)) add("error", `passage.sections.${index}.title must be bilingual.`);
    if (!section.text || wordCount(section.text) < 60) {
      add("warning", `passage.sections.${index}.text is short; deepen the paragraph if needed.`);
    }
    if (!isBilingual(section.coaching)) {
      add("error", `passage.sections.${index}.coaching must be bilingual.`);
    }
  });

  if (!Array.isArray(raw.vocabulary) || raw.vocabulary.length < 5) {
    add("warning", "vocabulary should include at least five useful speaking terms.");
  }
  raw.vocabulary?.forEach((item, index) => {
    if (!item.term || !isBilingual(item.meaning) || !isBilingual(item.use)) {
      add("error", `vocabulary.${index} needs term, bilingual meaning, and bilingual use.`);
    }
  });

  if (!Array.isArray(raw.pronunciationFocus) || raw.pronunciationFocus.length < 2) {
    add("warning", "include at least two pronunciation focus items.");
  }
  raw.pronunciationFocus?.forEach((item, index) => {
    if (!isBilingual(item)) add("error", `pronunciationFocus.${index} must be bilingual.`);
  });

  if (!Array.isArray(raw.shadowingDrill?.steps) || raw.shadowingDrill.steps.length < 3) {
    add("warning", "shadowingDrill should include at least three steps.");
  }
  raw.shadowingDrill?.steps?.forEach((item, index) => {
    if (!isBilingual(item)) add("error", `shadowingDrill.steps.${index} must be bilingual.`);
  });

  if (!Array.isArray(raw.reflection) || raw.reflection.length < 2) {
    add("warning", "include at least two reflection prompts.");
  }
  raw.reflection?.forEach((item, index) => {
    if (!isBilingual(item)) add("error", `reflection.${index} must be bilingual.`);
  });

  if (!raw.audio?.narration) {
    add("error", "audio.narration is required before publishing.");
  } else {
    const narrationAbs = resolve(WEB_PUBLIC, raw.audio.narration);
    if (!existsSync(narrationAbs)) {
      add("error", `missing narration audio: ${raw.audio.narration}`);
    } else {
      const info = await stat(narrationAbs);
      if (info.size < 100_000) add("error", `narration audio is suspiciously small: ${info.size} bytes.`);
      const duration = await audioDurationSeconds(raw.audio.narration);
      if (duration === null) {
        add("error", "could not read narration duration with ffprobe.");
      } else if (duration < 180 || duration > 330) {
        add("warning", `narration is ${Math.round(duration)}s; target 180-300s.`);
      }
    }
  }

  const clips = raw.audio?.clips ?? {};
  for (const key of clipKeys(raw)) {
    const rel = clips[key];
    if (!rel) {
      add("error", `missing audio clip mapping for ${key}.`);
      continue;
    }
    if (!rel.endsWith(".mp3")) add("warning", `${key} should use compressed .mp3 audio.`);
    const abs = resolve(WEB_PUBLIC, rel);
    if (!existsSync(abs)) {
      add("error", `missing audio file for ${key}: ${rel}`);
      continue;
    }
    const info = await stat(abs);
    if (info.size < 5_000) add("error", `${key} audio is suspiciously small: ${info.size} bytes.`);
  }

  return issues;
}

async function main() {
  const { values } = parseArgs({
    options: {
      lesson: { type: "string", short: "l" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: false,
  });

  if (values.help) {
    console.log(`
Usage: npm run validate:read-aloud
       npm run validate:read-aloud -- --lesson ../web/src/read-aloud-corpus/lesson-x.json
`);
    return;
  }

  const lessonPaths = values.lesson
    ? [resolve(values.lesson)]
    : (await readdir(READ_ALOUD_DIR))
        .filter((file) => file.startsWith("lesson-") && file.endsWith(".json"))
        .sort()
        .map((file) => resolve(READ_ALOUD_DIR, file));

  const seenIds = new Set<string>();
  const allIssues = (
    await Promise.all(lessonPaths.map((lessonPath) => validateLesson(lessonPath, seenIds)))
  ).flat();

  const errors = allIssues.filter((issue) => issue.severity === "error");
  const warnings = allIssues.filter((issue) => issue.severity === "warning");

  for (const issue of allIssues) {
    const marker = issue.severity === "error" ? "ERROR" : "WARN";
    console.log(`[${marker}] ${issue.lessonId}: ${issue.message}`);
  }

  console.log(
    `Validated ${lessonPaths.length} read-aloud lesson(s): ${errors.length} error(s), ${warnings.length} warning(s).`,
  );

  if (errors.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
