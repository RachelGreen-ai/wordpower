/**
 * src/lib/lessons.ts — load + validate every lesson JSON from the corpus.
 *
 * The corpus lives in the parent Remotion project at ../src/data/lesson-*.json.
 * site/src/corpus is a symlink to that directory, so Vite can glob-import the
 * JSON files at build/dev time. The Zod schema (also in the parent project,
 * symlinked as site/src/corpus-types) ensures the shape is valid.
 */
import { VocabLessonSchema, type VocabLesson } from "../corpus-types/vocab";

const lessonModules = import.meta.glob<{ default: unknown }>(
  "../corpus/lesson-*.json",
  { eager: true },
);

export const lessons: VocabLesson[] = Object.entries(lessonModules)
  .map(([path, mod]) => {
    try {
      return VocabLessonSchema.parse(mod.default);
    } catch (e) {
      console.error(`Failed to parse ${path}:`, e);
      throw e;
    }
  })
  // Sort in book order: by chapter, then by session within chapter, then by
  // lessonId as a stable tiebreaker. Lessons without bookRef sink to the end.
  .sort((a, b) => {
    // chapter/session are number|string in the schema — coerce for comparison.
    const ca = Number(a.bookRef?.chapter ?? Number.POSITIVE_INFINITY);
    const cb = Number(b.bookRef?.chapter ?? Number.POSITIVE_INFINITY);
    if (ca !== cb) return ca - cb;
    const sa = Number(a.bookRef?.session ?? Number.POSITIVE_INFINITY);
    const sb = Number(b.bookRef?.session ?? Number.POSITIVE_INFINITY);
    if (sa !== sb) return sa - sb;
    return a.lessonId.localeCompare(b.lessonId);
  });

export const lessonsById: Map<string, VocabLesson> = new Map(
  lessons.map((l) => [l.lessonId, l]),
);

export function getLesson(id: string): VocabLesson | undefined {
  return lessonsById.get(id);
}

/** Flat index of every word across all lessons — for search and word-lookup pages. */
export interface WordIndexEntry {
  lessonId: string;
  wordIndex: number; // position within the lesson
  word: string;
  chinese: string;
  phonetic: string;
}

export const wordIndex: WordIndexEntry[] = lessons.flatMap((l) =>
  l.words.map((w, i) => ({
    lessonId: l.lessonId,
    wordIndex: i,
    word: w.word,
    chinese: w.chinese,
    phonetic: w.phonetic,
  })),
);
