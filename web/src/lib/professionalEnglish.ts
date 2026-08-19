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

export type ProfessionalEnglishTrack =
  | "customer-facing-ai"
  | "celebrity-talks"
  | "learning-career"
  | "agentic-future";

export interface TalkSource {
  type: "YouTube" | "Podcast" | "Interview" | "Talk";
  title: string;
  speaker?: string;
  host?: string;
  channel?: string;
  url: string;
  timestamp?: string;
  note?: BilingualText;
}

export interface TalkAnalysis {
  flow: BilingualText[];
  phraseBank: LeadershipLine[];
  vocabulary: Array<{
    word: string;
    meaning: BilingualText;
    use: BilingualText;
  }>;
  logicMoves: LeadershipLine[];
  conversationLessons: BilingualText[];
}

export interface ProfessionalEnglishLesson {
  lessonId: string;
  track?: ProfessionalEnglishTrack;
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
  source?: TalkSource;
  talkAnalysis?: TalkAnalysis;
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
  .sort((a, b) => {
    const ta = a.track ?? "customer-facing-ai";
    const tb = b.track ?? "customer-facing-ai";
    if (ta !== tb) return ta.localeCompare(tb);
    return a.lessonId.localeCompare(b.lessonId);
  });

export const professionalEnglishLessonsByTrack = {
  "customer-facing-ai": professionalEnglishLessons.filter(
    (lesson) => (lesson.track ?? "customer-facing-ai") === "customer-facing-ai",
  ),
  "celebrity-talks": professionalEnglishLessons.filter(
    (lesson) => lesson.track === "celebrity-talks",
  ),
  "learning-career": professionalEnglishLessons.filter(
    (lesson) => lesson.track === "learning-career",
  ),
  "agentic-future": professionalEnglishLessons.filter(
    (lesson) => lesson.track === "agentic-future",
  ),
} satisfies Record<ProfessionalEnglishTrack, ProfessionalEnglishLesson[]>;

export const professionalEnglishLessonsById = new Map(
  professionalEnglishLessons.map((lesson) => [lesson.lessonId, lesson]),
);

export function getProfessionalEnglishLesson(
  id: string,
): ProfessionalEnglishLesson | undefined {
  return professionalEnglishLessonsById.get(id);
}
