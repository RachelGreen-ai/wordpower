/**
 * src/lib/roots.ts — inverted index of every etymology root across the corpus.
 *
 * For each unique root (primary or auxiliary), we collect every word that uses
 * it: the three core words from each lesson, the lesson's own etymology.relatives,
 * and every vocabularyExpansion entry. The Method page uses this to let users
 * click a root and see its whole family across all 37 lessons.
 */
import { lessons } from "./lessons";
import type { VocabWord, ExpansionWord } from "../corpus-types/vocab";

export interface RootOccurrence {
  /** The word that uses this root (e.g. "anthropologist", "philanthropist"). */
  word: string;
  /** Bilingual gloss when available. */
  zh?: string;
  /** The lesson this word lives in. */
  lessonId: string;
  /** What kind of slot — used to render badges. */
  kind: "core" | "etymology-relative" | "expansion";
}

/** Coarse language origin used to group the atlas. */
export type RootLanguage = "greek" | "latin" | "germanic" | "eponym" | "compound" | "other";

export interface RootEntry {
  /** The Latin / Greek root key (e.g. "anthropos", "vorare"). */
  root: string;
  /** Plain-language meaning (e.g. "human being"). */
  meaning?: string;
  /** Chinese gloss for the meaning. */
  meaningZh?: string;
  /** Hex tint (no leading #) — used for color chips. */
  tint?: string;
  /** Every word in the corpus that uses this root. */
  occurrences: RootOccurrence[];
  /** Lessons in which this root appears as the PRIMARY root of a core word. */
  primaryLessonIds: string[];
  /** Coarse language family — inferred from the etymology prose. */
  language: RootLanguage;
}

/**
 * Sniff the language of origin from one of the etymology blurbs. The author
 * almost always says "From Greek X" or "From Latin Y" up front, so this is
 * accurate without a hand-curated table.
 */
function detectLanguage(root: string, hints: string[]): RootLanguage {
  // Compound roots (e.g. "kakos + phone", "magnus + animus") have a plus sign.
  if (root.includes("+")) return "compound";
  // Proper-noun eponyms tend to have a capital in the root itself.
  if (/^[A-Z]/.test(root) && !/^(Old|Greek|Latin)/.test(root)) return "eponym";

  const text = hints.join(" ").toLowerCase();
  // Eponym signal: the etymology says "named after" or "from <Name>".
  if (text.includes("named after") || text.includes("eponym")) return "eponym";
  // Greek before Latin so words that mention both pick the dominant one.
  if (text.includes("greek")) return "greek";
  if (text.includes("latin")) return "latin";
  if (text.includes("germanic") || text.includes("old english") || text.includes("anglo-saxon"))
    return "germanic";
  if (text.includes("old french") || text.includes("french") || text.includes("italian"))
    return "latin"; // Romance descendants of Latin
  return "other";
}

export const LANGUAGE_LABELS: Record<RootLanguage, { en: string; zh: string }> = {
  greek: { en: "Greek", zh: "希腊" },
  latin: { en: "Latin", zh: "拉丁" },
  germanic: { en: "Germanic", zh: "日耳曼" },
  eponym: { en: "Eponym", zh: "人名" },
  compound: { en: "Compound", zh: "复合" },
  other: { en: "Other", zh: "其他" },
};

function normalizeRoot(raw: string): string {
  // Roots like "pheme" / "kakos + phone" / "magnus + animus" are kept as-is;
  // we trim and lowercase for consistent grouping but otherwise preserve the
  // original spelling the author chose.
  return raw.trim().toLowerCase();
}

const map = new Map<string, RootEntry>();
/** Accumulate etymology prose per root so we can sniff language once at the end. */
const hintsByKey = new Map<string, string[]>();

function getEntry(rootRaw: string): RootEntry {
  const key = normalizeRoot(rootRaw);
  let entry = map.get(key);
  if (!entry) {
    entry = {
      root: rootRaw.trim(),
      occurrences: [],
      primaryLessonIds: [],
      language: "other",
    };
    map.set(key, entry);
    hintsByKey.set(key, []);
  }
  return entry;
}

function addHint(rootRaw: string, hint: string | undefined) {
  if (!hint) return;
  const key = normalizeRoot(rootRaw);
  hintsByKey.get(key)?.push(hint);
}

for (const lesson of lessons) {
  for (const w of lesson.words as VocabWord[]) {
    const e = getEntry(w.etymology.root);
    if (!e.meaning) e.meaning = w.etymology.meaning;
    if (!e.meaningZh) e.meaningZh = w.etymology.meaningZh;
    if (!e.tint) e.tint = w.tint;
    if (!e.primaryLessonIds.includes(lesson.lessonId))
      e.primaryLessonIds.push(lesson.lessonId);
    addHint(w.etymology.root, w.etymology.en);
    addHint(w.etymology.root, w.etymology.meaning);
    e.occurrences.push({
      word: w.word,
      zh: w.chinese,
      lessonId: lesson.lessonId,
      kind: "core",
    });
    for (const rel of w.etymology.relatives ?? []) {
      e.occurrences.push({
        word: rel.word,
        zh: rel.zh,
        lessonId: lesson.lessonId,
        kind: "etymology-relative",
      });
    }
  }
  for (const ex of (lesson.vocabularyExpansion ?? []) as ExpansionWord[]) {
    const e = getEntry(ex.root);
    // Auxiliary roots carry their own metadata on the expansion entry.
    if (!e.meaning && ex.rootMeaning) e.meaning = ex.rootMeaning;
    if (!e.meaningZh && ex.rootMeaningZh) e.meaningZh = ex.rootMeaningZh;
    if (!e.tint && ex.rootTint) e.tint = ex.rootTint;
    addHint(ex.root, ex.rootMeaning);
    addHint(ex.root, ex.gloss.en);
    e.occurrences.push({
      word: ex.word,
      zh: ex.zh,
      lessonId: lesson.lessonId,
      kind: "expansion",
    });
  }
}

// Detect language once we've accumulated all hints.
for (const entry of map.values()) {
  const key = normalizeRoot(entry.root);
  entry.language = detectLanguage(entry.root, hintsByKey.get(key) ?? []);
}

// Sort: roots with more occurrences first.
export const roots: RootEntry[] = Array.from(map.values()).sort(
  (a, b) => b.occurrences.length - a.occurrences.length,
);

/** Roots grouped by language family — for the atlas tabs. */
export const rootsByLanguage: Record<RootLanguage, RootEntry[]> = {
  greek: [],
  latin: [],
  germanic: [],
  eponym: [],
  compound: [],
  other: [],
};
for (const r of roots) rootsByLanguage[r.language].push(r);

export const rootsByKey = new Map(roots.map((r) => [normalizeRoot(r.root), r]));

export function getRoot(key: string): RootEntry | undefined {
  return rootsByKey.get(normalizeRoot(key));
}
