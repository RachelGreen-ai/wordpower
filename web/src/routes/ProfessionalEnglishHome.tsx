import { Link } from "react-router-dom";
import {
  professionalEnglishLessons,
  professionalEnglishLessonsByTrack,
  type ProfessionalEnglishTrack,
} from "../lib/professionalEnglish";

const seriesArc = [
  {
    title: "Diagnose",
    zh: "诊断",
    body: "Turn vague AI complaints into evidence, layers, bottlenecks, and failure modes.",
    zhBody: "把模糊的 AI 抱怨转成证据、层次、瓶颈和失效模式。",
  },
  {
    title: "Design",
    zh: "设计",
    body: "Choose agentic patterns only after the workflow, tools, permissions, and handoffs are clear.",
    zhBody: "在工作流、工具、权限和交接清楚后，再选择 agentic patterns。",
  },
  {
    title: "Operate",
    zh: "运营",
    body: "Discuss eval, latency, cost, governance, and user trust as production responsibilities.",
    zhBody: "把评估、延迟、成本、治理和用户信任说成生产责任。",
  },
  {
    title: "Lead",
    zh: "领导",
    body: "Use language that is precise, calm, and accountable under ambiguity.",
    zhBody: "在不确定中使用精准、稳定、负责的语言。",
  },
];

const tracks: Array<{
  id: ProfessionalEnglishTrack;
  title: string;
  zh: string;
  body: string;
  zhBody: string;
}> = [
  {
    id: "customer-facing-ai",
    title: "Customer-facing AI",
    zh: "面向客户的 AI 专业英语",
    body: "FDE, consultant, and TAM-style language for diagnosing, designing, operating, and leading GenAI work.",
    zhBody: "训练 FDE、consultant、TAM 在 GenAI 项目中的诊断、设计、运营和领导力表达。",
  },
  {
    id: "celebrity-talks",
    title: "Celebrity Talks",
    zh: "名人访谈表达拆解",
    body: "Study interview flow, phrases, vocabulary, logic, and the conversational moves behind smart public answers.",
    zhBody: "拆访谈 flow、phrase、vocab、logic，以及聪明回答背后的对话动作。",
  },
  {
    id: "learning-career",
    title: "Learning & Career",
    zh: "AI 时代学习与职业表达",
    body: "Turn recent learning, job-search, and career videos into practical professional English drills.",
    zhBody: "把最新学习、求职和职业视频转成可练习的专业英语表达。",
  },
];

export function ProfessionalEnglishHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
      </nav>

      <header className="mb-10 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          Professional English · 专业英语人格
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          Calm ownership under ambiguity
        </h1>
        <div className="text-zh text-2xl mt-2">在不确定中稳定负责</div>
        <p className="mt-5 text-lg text-ink-muted leading-relaxed">
          A Word Power sub-column for GenAI customer conversations: technical
          judgment, problem solving, stakeholder alignment, and leadership
          language.
          <span className="text-zh ml-2">
            面向 GenAI 客户交流：技术判断、问题拆解、利益相关方对齐，以及稳定的领导力表达。
          </span>
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Series Arc · 系列主线
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          {seriesArc.map((item) => (
            <div key={item.title} className="rounded-xl border border-ink/10 bg-white p-5">
              <h3 className="font-serif text-2xl font-bold">{item.title}</h3>
              <div className="text-zh text-sm text-ink-muted mt-1">{item.zh}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {item.body}
                <span className="text-zh ml-1.5">{item.zhBody}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Sub-columns · 子栏目
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <a
              key={track.id}
              href={`#${track.id}`}
              className="block rounded-xl border border-accent/30 bg-paper-warm p-5 hover:border-accent hover:bg-accent/10 transition-colors"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold">
                {professionalEnglishLessonsByTrack[track.id].length} lessons
              </div>
              <h2 className="mt-2 font-serif text-3xl font-bold">{track.title}</h2>
              <div className="text-zh text-lg text-ink-muted mt-1">{track.zh}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {track.body}
                <span className="text-zh ml-1.5">{track.zhBody}</span>
              </p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Lessons · 课程 ({professionalEnglishLessons.length})
        </h2>
        <div className="space-y-10">
          {tracks.map((track) => (
            <div key={track.id} id={track.id} className="scroll-mt-6">
              <div className="flex items-baseline justify-between gap-3 mb-4 border-b border-ink/10 pb-2">
                <h3 className="font-serif text-3xl font-bold">{track.title}</h3>
                <span className="text-zh text-sm text-ink-muted">{track.zh}</span>
              </div>
              <div className="space-y-4">
                {professionalEnglishLessonsByTrack[track.id].map((lesson) => (
                  <Link
                    key={lesson.lessonId}
                    to={`/professional-english/${lesson.lessonId}`}
                    className="block rounded-xl border border-ink/10 bg-white px-6 py-5 hover:border-accent hover:shadow-sm transition-all"
                  >
                    <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
                      {lesson.audience}
                    </div>
                    <h4 className="font-serif text-2xl md:text-3xl font-bold leading-snug">
                      {lesson.title.en}
                    </h4>
                    <div className="text-zh text-lg mt-1">{lesson.title.zh}</div>
                    <p className="mt-3 text-ink-muted leading-relaxed">
                      {lesson.subtitle.en}
                      <span className="text-zh ml-2">{lesson.subtitle.zh}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lesson.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-ink-muted"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
