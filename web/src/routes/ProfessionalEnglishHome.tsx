import { Link } from "react-router-dom";
import { professionalEnglishLessons } from "../lib/professionalEnglish";

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

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Lessons · 课程 ({professionalEnglishLessons.length})
        </h2>
        <div className="space-y-4">
          {professionalEnglishLessons.map((lesson) => (
            <Link
              key={lesson.lessonId}
              to={`/professional-english/${lesson.lessonId}`}
              className="block rounded-xl border border-ink/10 bg-white px-6 py-5 hover:border-accent hover:shadow-sm transition-all"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
                {lesson.audience}
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-snug">
                {lesson.title.en}
              </h3>
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
      </section>
    </div>
  );
}
