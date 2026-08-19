export interface BilingualText {
  en: string;
  zh: string;
}

export interface ParentingSource {
  title: string;
  organization: string;
  url: string;
  note?: BilingualText;
}

export interface ParentingPhrase {
  audience: BilingualText;
  line: string;
  why: BilingualText;
}

export interface ParentingVocab {
  term: string;
  meaning: BilingualText;
  use: BilingualText;
}

export interface ParentingLesson {
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
  vocabulary: ParentingVocab[];
  scripts: ParentingPhrase[];
  reflection: BilingualText[];
}

const lessonModules = import.meta.glob<{ default: ParentingLesson }>(
  "../parenting-corpus/lesson-*.json",
  { eager: true },
);

export const parentingLessons: ParentingLesson[] = Object.values(lessonModules)
  .map((mod) => mod.default)
  .sort((a, b) => a.lessonId.localeCompare(b.lessonId));

export const parentingLessonsById = new Map(
  parentingLessons.map((lesson) => [lesson.lessonId, lesson]),
);

export function getParentingLesson(id: string): ParentingLesson | undefined {
  return parentingLessonsById.get(id);
}
