/**
 * src/types/vocab.ts — Shape of a bilingual vocabulary lesson.
 *
 * Mirrors the pattern in src/types/match.ts: Zod schemas at the boundary
 * so JSON drift fails fast at composition registration.
 *
 * DUAL PURPOSE: each lesson JSON powers (a) a Remotion video AND (b) a
 * future "fancy dictionary + efficient textbook" website. Fields are
 * grouped so that the video composition can ignore the website-only
 * extras (mnemonic, commonConfusions, quiz, anecdote, bookRef, tags).
 *
 * Authoring philosophy: per-word sentences stay simple; depth concentrates
 * in `twist` and `recap`. See CORPUS.md for the full authoring guide.
 */
import { z } from "zod";

export const BilingualSchema = z.object({
  en: z.string(),
  zh: z.string(),
});
export type Bilingual = z.infer<typeof BilingualSchema>;

export const SentenceSchema = z.object({
  context: z.enum(["workplace", "parenting", "friends", "social"]),
  en: z.string(),
  zh: z.string(),
});
export type Sentence = z.infer<typeof SentenceSchema>;

export const EtymologySchema = z.object({
  root: z.string(), // e.g. "ego"
  meaning: z.string(), // bare meaning in English, e.g. "I"
  meaningZh: z.string().optional(), // bare meaning in Chinese, e.g. "我"
  en: z.string(), // full bite, English
  zh: z.string(), // full bite, Chinese
  relatives: z
    .array(z.object({ word: z.string(), zh: z.string() }))
    .default([]),
});
export type Etymology = z.infer<typeof EtymologySchema>;

/**
 * Quiz item — one self-test question with bilingual prompt + answer.
 * Used by a future website's quiz/flashcard UI. Not rendered in video.
 */
export const QuizItemSchema = z.object({
  question: BilingualSchema,
  answer: BilingualSchema,
});
export type QuizItem = z.infer<typeof QuizItemSchema>;

export const VocabWordSchema = z.object({
  word: z.string(),
  phonetic: z.string(), // "EE'-go-ist"
  chinese: z.string(), // "利己主义者"
  definition: BilingualSchema,
  etymology: EtymologySchema,
  sentences: z.array(SentenceSchema).min(1).max(3),
  silhouette: z.enum(["stuck", "performing", "walking"]),
  /** One Chinese word that captures the archetype — used in the recap grid. */
  archetypeZh: z.string(), // "纠结" / "浮夸" / "通透"
  /** Hex without #. Used as a subtle valence tint behind the word reveal. */
  tint: z.string().regex(/^[0-9a-fA-F]{6}$/),

  // ---------------------------------------------------------------------
  // Corpus extras (website / textbook use; ignored by current video composition)
  // ---------------------------------------------------------------------

  /** One-line memory device. E.g. "Ego-T = Talks (the show outside)." */
  mnemonic: BilingualSchema.optional(),
  /** Words this is commonly confused with (lookup IDs are the lowercase `word`). */
  commonConfusions: z.array(z.string()).default([]),
  /** Self-test prompts for spaced-repetition / quiz UI on the future site. */
  quiz: z.array(QuizItemSchema).default([]),
  /** A short cultural / news / story tag that gives the word an emotional anchor. */
  anecdote: BilingualSchema.optional(),
});
export type VocabWord = z.infer<typeof VocabWordSchema>;

export const TwistSchema = z.object({
  setup: BilingualSchema, // "Both want too much from themselves."
  leftLabel: z.string(), // "Egoist"
  leftLine: BilingualSchema, // "hoards options"
  leftMnemonic: BilingualSchema, // "Ego-I = Inside · 行动上的执着"
  rightLabel: z.string(), // "Egotist"
  rightLine: BilingualSchema, // "hoards attention"
  rightMnemonic: BilingualSchema, // "Ego-T = Talks · 嘴上的表演"
  closing: BilingualSchema, // "Different symptoms. Same disease: 离不开自己。"
});
export type Twist = z.infer<typeof TwistSchema>;

export const HookSchema = z.object({
  headline: BilingualSchema, // "Three words. Three kinds of people."
  subtext: BilingualSchema, // "Which one are you living with?"
});
export type Hook = z.infer<typeof HookSchema>;

export const RecapSchema = z.object({
  reflection: BilingualSchema, // "You can't choose who you were..."
});
export type Recap = z.infer<typeof RecapSchema>;

/**
 * Per-slot TTS audio paths, populated by src/cli/generateVocabAudio.ts.
 * Keys are slot identifiers used by the composition (e.g. "hook.headline",
 * "word.egoist.pronunciation", "word.egoist.sentence.0").
 */
export const VocabAudioMapSchema = z.record(z.string(), z.string());
export type VocabAudioMap = z.infer<typeof VocabAudioMapSchema>;

/**
 * ExpansionWord — a vocabulary item that shares an etymological root with the
 * lesson's core words, but isn't itself one of the three featured words.
 * Powers the "Word Family · 词族扩展" section on the website — the place
 * where readers extend a single Latin root into many real, usable words.
 */
export const ExpansionWordSchema = z.object({
  word: z.string(),
  zh: z.string(),
  /** Shared root — should match one of the core words' etymology.root,
   *  OR introduce an auxiliary root not used by the core three (e.g. `iatros`,
   *  `soma`, `logos`). Auxiliary roots should provide `rootMeaning` and
   *  `rootMeaningZh` on the first entry that uses them, so the Word Family
   *  section can label the root group correctly. */
  root: z.string(),
  /** Part-of-speech tag, free-form. E.g. "n.", "adj.", "v.", "adv." */
  partOfSpeech: z.string().optional(),
  /** WPME-style phonetic respelling. E.g. "EE'-go" or "awl-tur-KAY'-shun". */
  phonetic: z.string().optional(),
  /** One-sentence bilingual definition. */
  gloss: BilingualSchema,
  /** One natural usage sentence, bilingual. */
  usage: BilingualSchema,
  /** Optional: bare-meaning of `root` in English (e.g. "healer"). Used only
   *  when this root is NOT one of the core words' etymology.root — set on
   *  the first expansion entry that introduces an auxiliary root. */
  rootMeaning: z.string().optional(),
  /** Optional: bare-meaning of `root` in Chinese (e.g. "医者"). */
  rootMeaningZh: z.string().optional(),
  /** Optional: hex without `#`, used as the auxiliary root's group color. */
  rootTint: z.string().regex(/^[0-9a-fA-F]{6}$/).optional(),
});
export type ExpansionWord = z.infer<typeof ExpansionWordSchema>;

/**
 * Pointer back to the source material (Word Power Made Easy or future books).
 * Used by a future website to render "From: Chapter 3 · Personality Types"
 * style references and to group lessons by chapter/theme.
 */
export const BookReferenceSchema = z.object({
  book: z.string(), // "Word Power Made Easy"
  author: z.string().optional(),
  edition: z.string().optional(),
  chapter: z.union([z.number(), z.string()]).optional(),
  session: z.union([z.number(), z.string()]).optional(),
  pages: z.tuple([z.number(), z.number()]).optional(),
  /** Human-readable theme name. E.g. "Personality Types". */
  theme: z.string().optional(),
  /** Sub-theme inside the chapter. E.g. "Self vs Others". */
  subtheme: z.string().optional(),
});
export type BookReference = z.infer<typeof BookReferenceSchema>;

export const VocabLessonSchema = z.object({
  lessonId: z.string(),
  hook: HookSchema,
  words: z.array(VocabWordSchema).length(3),
  twist: TwistSchema,
  recap: RecapSchema,
  audio: VocabAudioMapSchema.optional(),

  // ---------------------------------------------------------------------
  // Corpus metadata (website / textbook use; ignored by current video composition)
  // ---------------------------------------------------------------------

  /** Pointer back to the source book — chapter, session, page range, theme. */
  bookRef: BookReferenceSchema.optional(),
  /** Free-form tags for search / cross-linking on a future website. */
  tags: z.array(z.string()).default([]),
  /**
   * Words built on the same Latin/Greek roots as the core three — used to
   * fully leverage the etymology (per WPME's pedagogy of root-driven learning).
   * Renders as the "Word Family" section at the end of the lesson page.
   */
  vocabularyExpansion: z.array(ExpansionWordSchema).default([]),
});
export type VocabLesson = z.infer<typeof VocabLessonSchema>;
