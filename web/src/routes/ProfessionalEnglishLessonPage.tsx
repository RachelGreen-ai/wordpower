import { Link, useParams } from "react-router-dom";
import { getProfessionalEnglishLesson } from "../lib/professionalEnglish";

export function ProfessionalEnglishLessonPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = id ? getProfessionalEnglishLesson(id) : undefined;

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <Link to="/professional-english" className="text-accent hover:underline">
          ← Professional English
        </Link>
        <h1 className="mt-6 font-serif text-3xl">Lesson not found</h1>
        <p className="text-ink-muted mt-2">No professional English lesson with id "{id}".</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <nav className="mb-6">
        <Link
          to="/professional-english"
          className="text-sm text-ink-muted hover:text-accent"
        >
          ← Professional English
        </Link>
      </nav>

      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          {lesson.series.en} · {lesson.series.zh}
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          {lesson.title.en}
        </h1>
        <div className="text-zh text-xl md:text-2xl mt-3">{lesson.title.zh}</div>
        <p className="mt-4 text-lg text-ink-muted leading-relaxed">
          {lesson.subtitle.en}
          <span className="text-zh ml-2">{lesson.subtitle.zh}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lesson.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex rounded-full border border-ink/10 bg-paper-warm px-2.5 py-0.5 text-xs text-ink-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-4">
          Customer Moment · 客户场景
        </div>
        <QuoteBlock label="Customer says" text={lesson.scenario.customer} />
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <ResponseBlock title="Weak response" tone="weak" text={lesson.scenario.weakResponse} />
          <ResponseBlock
            title="Reliable response"
            tone="reliable"
            text={lesson.scenario.reliableResponse}
          />
        </div>
      </section>

      <section className="my-8 rounded-xl bg-ink text-paper p-8 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-paper-warm/60 font-semibold mb-3">
          Core Principle · 核心原则
        </div>
        <div className="font-serif text-2xl md:text-3xl font-bold text-accent-soft">
          {lesson.principle.en}
        </div>
        <div className="text-zh text-lg mt-2 text-paper-warm/80">
          {lesson.principle.zh}
        </div>
      </section>

      {lesson.languageMove && (
        <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
            Language Move · 表达动作
          </div>
          <h2 className="font-serif text-3xl font-bold leading-snug">
            {lesson.languageMove.title.en}
          </h2>
          <div className="text-zh text-lg text-ink-muted mt-1">
            {lesson.languageMove.title.zh}
          </div>
          <div className="mt-5 rounded-lg border border-accent/30 bg-accent/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold">
              Anchor phrase
            </div>
            <div className="mt-2 font-serif text-3xl font-bold text-accent">
              {lesson.languageMove.anchor.phrase}
            </div>
            {lesson.languageMove.anchor.quote && (
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                “{lesson.languageMove.anchor.quote}”
              </p>
            )}
          </div>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            {lesson.languageMove.concept.en}
            <span className="text-zh ml-2">{lesson.languageMove.concept.zh}</span>
          </p>
          <div className="mt-5 space-y-3">
            {lesson.languageMove.examples.map((item) => (
              <div key={item.line} className="rounded-lg border border-ink/10 bg-paper p-4">
                <div className="font-semibold">{item.intent.en}</div>
                <div className="text-zh text-sm text-ink-muted mt-1">
                  {item.intent.zh}
                </div>
                <p className="mt-3 font-serif text-xl leading-relaxed">
                  “{item.line}”
                </p>
                <div className="mt-3 text-sm text-ink-muted leading-relaxed">
                  <span className="font-semibold text-ink">Why it works: </span>
                  {item.why.en}
                  <span className="text-zh ml-2">{item.why.zh}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <div className="mb-5">
          <h2 className="font-serif text-3xl font-bold">Leadership Lines</h2>
          <div className="text-zh text-lg text-ink-muted mt-1">领导力句型积累</div>
        </div>
        <div className="space-y-4">
          {lesson.lines.map((item, index) => (
            <article
              key={item.line}
              className="rounded-xl border border-ink/10 bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg leading-snug">
                    {item.intent.en}
                  </h3>
                  <div className="text-zh text-sm text-ink-muted mt-1">
                    {item.intent.zh}
                  </div>
                  <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
                    “{item.line}”
                  </p>
                  <div className="mt-4 border-t border-ink/10 pt-3 text-sm text-ink-muted leading-relaxed">
                    <span className="font-semibold text-ink">Why it works: </span>
                    {item.why.en}
                    <span className="text-zh ml-2">{item.why.zh}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-accent/30 bg-paper-warm p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Practice Drill · 复述训练
        </div>
        <h2 className="font-serif text-2xl font-bold">{lesson.drill.prompt.en}</h2>
        <div className="text-zh text-ink-muted mt-1">{lesson.drill.prompt.zh}</div>
        <div className="mt-5 grid md:grid-cols-3 gap-3">
          {lesson.drill.steps.map((step) => (
            <div key={step.en} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="font-semibold leading-snug">{step.en}</div>
              <div className="text-zh text-sm text-ink-muted mt-2">{step.zh}</div>
              <div className="mt-4 border-t border-ink/10 pt-3">
                <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold">
                  Focus
                </div>
                <div className="mt-1 text-sm text-ink-muted leading-relaxed">
                  {step.focus.en}
                  <span className="text-zh ml-1.5">{step.focus.zh}</span>
                </div>
              </div>
              {step.futureLesson && (
                <FutureLessonLink
                  lessonId={step.futureLesson.lessonId}
                  title={step.futureLesson.title}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FutureLessonLink({
  lessonId,
  title,
}: {
  lessonId: string;
  title: { en: string; zh: string };
}) {
  const available = getProfessionalEnglishLesson(lessonId);

  if (available) {
    return (
      <Link
        to={`/professional-english/${lessonId}`}
        className="mt-4 block rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/15"
      >
        Future lesson is live: {title.en}
        <span className="text-zh ml-1.5">{title.zh}</span>
      </Link>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-ink/10 bg-paper px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.16em] text-ink-soft font-semibold">
        Planned future lesson
      </div>
      <div className="mt-1 text-sm font-semibold leading-snug">
        {title.en}
        <span className="text-zh ml-1.5 text-ink-muted">{title.zh}</span>
      </div>
    </div>
  );
}

function QuoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold mb-2">
        {label}
      </div>
      <p className="border-l-4 border-accent/50 pl-4 text-lg leading-relaxed text-ink-muted">
        “{text}”
      </p>
    </div>
  );
}

function ResponseBlock({
  title,
  tone,
  text,
}: {
  title: string;
  tone: "weak" | "reliable";
  text: string;
}) {
  const toneClass =
    tone === "reliable"
      ? "border-accent/50 bg-accent/10"
      : "border-ink/10 bg-paper";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold">
        {title}
      </div>
      <p className="mt-3 leading-relaxed text-ink">{text}</p>
    </div>
  );
}
