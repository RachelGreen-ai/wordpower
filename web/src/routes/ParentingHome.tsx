import { Link } from "react-router-dom";
import { parentingLessons } from "../lib/parenting";

const pillars = [
  {
    title: "Observe",
    zh: "观察",
    body: "Notice patterns without rushing into labels, fear, or family shame.",
    zhBody: "看见模式，但不急着贴标签、恐惧或自责。",
  },
  {
    title: "Protect",
    zh: "保护",
    body: "Speak about children in ways that preserve dignity and a positive identity.",
    zhBody: "谈论孩子时，保护他的尊严和正面形象。",
  },
  {
    title: "Collaborate",
    zh: "协作",
    body: "Work with teachers, caregivers, and other parents with clarity and warmth.",
    zhBody: "和老师、照顾者、其他家长清楚而温和地合作。",
  },
  {
    title: "Cultivate",
    zh: "培养",
    body: "Choose activities, schools, and routines around vitality, health, and confidence.",
    zhBody: "围绕生命力、健康和自信来选择活动、学校和日常。",
  },
];

export function ParentingHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
      </nav>

      <header className="mb-10 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          Raising With Regard · 有看见的养育
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          Parenting English for dignity, vitality, and real conversations.
        </h1>
        <div className="text-zh text-2xl mt-3">
          和孩子、老师、朋友谈养育，但不伤害孩子的光。
        </div>
        <p className="mt-5 text-lg text-ink-muted leading-relaxed">
          A bilingual column for Bay Area parents who want better words for
          childhood: shy temperaments, language growth, teacher conversations,
          school choices, activities, and a parenting philosophy that protects a
          child's self-respect.
          <span className="text-zh ml-2">
            面向 Bay Area 家长：练习如何谈孩子、谈学校、谈兴趣培养、谈教育理念，同时保护孩子的自尊和生命力。
          </span>
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          The Parenting Voice · 养育人格
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          {pillars.map((item) => (
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
          Lessons · 课程 ({parentingLessons.length})
        </h2>
        <div className="space-y-4">
          {parentingLessons.map((lesson) => (
            <Link
              key={lesson.lessonId}
              to={`/parenting/${lesson.lessonId}`}
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
