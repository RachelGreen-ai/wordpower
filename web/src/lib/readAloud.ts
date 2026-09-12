export interface BilingualText {
  en: string;
  zh: string;
}

export interface ReadAloudSource {
  title: string;
  author?: string;
  organization: string;
  url: string;
  note?: BilingualText;
}

export interface ReadAloudSection {
  title: BilingualText;
  text: string;
  coaching: BilingualText;
}

export interface ReadAloudVocabulary {
  term: string;
  meaning: BilingualText;
  use: BilingualText;
}

export interface ReadAloudLessonAudio {
  narration?: string;
  clips?: Record<string, string>;
}

export interface ReadAloudLesson {
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
  vocabulary: ReadAloudVocabulary[];
  pronunciationFocus: BilingualText[];
  shadowingDrill: {
    prompt: BilingualText;
    steps: BilingualText[];
  };
  reflection: BilingualText[];
  audio?: ReadAloudLessonAudio;
}

const lessonModules = import.meta.glob<{ default: ReadAloudLesson }>(
  "../read-aloud-corpus/lesson-*.json",
  { eager: true },
);

export const readAloudLessons: ReadAloudLesson[] = Object.values(lessonModules)
  .map((mod) => mod.default)
  .sort((a, b) => a.lessonId.localeCompare(b.lessonId));

export const readAloudLessonsById = new Map(
  readAloudLessons.map((lesson) => [lesson.lessonId, lesson]),
);

export function getReadAloudLesson(id: string): ReadAloudLesson | undefined {
  return readAloudLessonsById.get(id);
}
