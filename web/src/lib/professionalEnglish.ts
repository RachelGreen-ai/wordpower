export interface BilingualText {
  en: string;
  zh: string;
}

export interface LeadershipLine {
  intent: BilingualText;
  line: string;
  why: BilingualText;
}

export interface LanguageMove {
  title: BilingualText;
  anchor: {
    phrase: string;
    quote?: string;
  };
  concept: BilingualText;
  examples: LeadershipLine[];
}

export interface DrillStep {
  en: string;
  zh: string;
  focus: BilingualText;
  futureLesson?: {
    lessonId: string;
    title: BilingualText;
  };
}

export interface ProfessionalEnglishLesson {
  lessonId: string;
  series: BilingualText;
  title: BilingualText;
  subtitle: BilingualText;
  audience: string;
  tags: string[];
  scenario: {
    customer: string;
    weakResponse: string;
    reliableResponse: string;
  };
  principle: BilingualText;
  languageMove?: LanguageMove;
  lines: LeadershipLine[];
  drill: {
    prompt: BilingualText;
    steps: DrillStep[];
  };
}

const lessonModules = import.meta.glob<{ default: ProfessionalEnglishLesson }>(
  "../professional-corpus/lesson-*.json",
  { eager: true },
);

export const professionalEnglishLessons: ProfessionalEnglishLesson[] = Object.values(
  lessonModules,
)
  .map((mod) => mod.default)
  .sort((a, b) => a.lessonId.localeCompare(b.lessonId));

export const professionalEnglishLessonsById = new Map(
  professionalEnglishLessons.map((lesson) => [lesson.lessonId, lesson]),
);

export function getProfessionalEnglishLesson(
  id: string,
): ProfessionalEnglishLesson | undefined {
  return professionalEnglishLessonsById.get(id);
}
