import { Link, useParams } from "react-router-dom";
import { AudioButton } from "../components/AudioButton";
import { getReadAloudLesson } from "../lib/readAloud";

export function ReadAloudLessonPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = id ? getReadAloudLesson(id) : undefined;

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <Link to="/read-aloud" className="text-accent hover:underline">
          ← Beautiful English Read-Aloud
        </Link>
        <h1 className="mt-6 font-serif text-3xl">Lesson not found</h1>
        <p className="text-ink-muted mt-2">No read-aloud lesson with id "{id}".</p>
      </div>
    );
  }

  const clipSrc = (key: string) => lesson.audio?.clips?.[key];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <nav className="mb-6">
        <Link to="/read-aloud" className="text-sm text-ink-muted hover:text-accent">
          ← Beautiful English Read-Aloud
        </Link>
      </nav>

      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          {lesson.series.en} · {lesson.series.zh}
        </div>
        {lesson.audio?.narration && (
          <div className="mb-5">
            <AudioButton src={lesson.audio.narration} label="play full reading" size="md" />
          </div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          {lesson.title.en}
        </h1>
        <div className="text-zh text-xl md:text-2xl mt-3">{lesson.title.zh}</div>
        <p className="mt-4 text-lg text-ink-muted leading-relaxed">
          {lesson.subtitle.en}
          <span className="text-zh ml-2">{lesson.subtitle.zh}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {lesson.tags.map((tag, index) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper-warm px-2.5 py-0.5 text-xs text-ink-muted"
            >
              #{tag}
              <AudioButton src={clipSrc(`tag.${index}`)} label="tag" />
            </span>
          ))}
        </div>
      </header>

      <section className="mb-8 rounded-xl border border-accent/30 bg-paper-warm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold">
              Warm-Up · 开口前
            </div>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">
              {lesson.warmup.en}
              <span className="text-zh ml-2">{lesson.warmup.zh}</span>
            </p>
          </div>
          <AudioButton src={clipSrc("warmup")} label="warm-up" size="md" />
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-5">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
            Passage · 跟读美文
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold">
            {lesson.passage.title.en}
          </h2>
          <div className="text-zh text-lg text-ink-muted mt-1">
            {lesson.passage.title.zh}
          </div>
          <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-ink/10 bg-white p-5">
            <AudioButton src={clipSrc("passage.intro")} label="intro" />
            <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
              {lesson.passage.intro.en}
              <span className="text-zh ml-1.5">{lesson.passage.intro.zh}</span>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {lesson.passage.sections.map((section, index) => (
            <article
              key={section.title.en}
              className="rounded-xl border border-ink/10 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
                <div>
                  <h3 className="font-serif text-2xl font-bold">{section.title.en}</h3>
                  <div className="text-zh text-sm text-ink-muted mt-1">
                    {section.title.zh}
                  </div>
                </div>
                <AudioButton src={clipSrc(`passage.sections.${index}`)} label="read" />
              </div>
              <p className="mt-5 font-serif text-xl leading-loose text-ink">
                {section.text}
              </p>
              <div className="mt-5 rounded-lg bg-paper p-4 text-sm leading-relaxed text-ink-muted">
                <div className="mb-2">
                  <AudioButton
                    src={clipSrc(`passage.sections.${index}.coaching`)}
                    label="coach"
                  />
                </div>
                <span className="font-semibold text-ink">Coaching: </span>
                {section.coaching.en}
                <span className="text-zh ml-1.5">{section.coaching.zh}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <h2 className="font-serif text-3xl font-bold">Vocabulary for Voice</h2>
        <div className="text-zh text-lg text-ink-muted mt-1">让口语更有质感的词</div>
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {lesson.vocabulary.map((item, index) => (
            <div key={item.term} className="rounded-lg border border-ink/10 bg-paper p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-serif text-2xl font-bold text-accent">
                  {item.term}
                </div>
                <AudioButton src={clipSrc(`vocabulary.${index}`)} label="vocab" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {item.meaning.en}
                <span className="text-zh ml-1.5">{item.meaning.zh}</span>
              </p>
              <p className="mt-3 border-t border-ink/10 pt-3 text-sm leading-relaxed text-ink">
                {item.use.en}
                <span className="text-zh ml-1.5 text-ink-muted">{item.use.zh}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl bg-ink text-paper p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-paper-warm/60 font-semibold mb-4">
          Pronunciation Focus · 发音重点
        </div>
        <div className="space-y-3">
          {lesson.pronunciationFocus.map((item, index) => (
            <div key={item.en} className="flex flex-wrap items-start gap-3">
              <AudioButton src={clipSrc(`pronunciationFocus.${index}`)} label="focus" />
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-paper-warm/80">
                {item.en}
                <span className="text-zh ml-1.5">{item.zh}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-accent/30 bg-paper-warm p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Shadowing Drill · 影子跟读
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <AudioButton src={clipSrc("shadowingDrill.prompt")} label="prompt" />
          <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
            {lesson.shadowingDrill.prompt.en}
            <span className="text-zh ml-1.5">{lesson.shadowingDrill.prompt.zh}</span>
          </p>
        </div>
        <div className="mt-5 space-y-3">
          {lesson.shadowingDrill.steps.map((step, index) => (
            <div key={step.en} className="flex gap-3 rounded-lg bg-white p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <AudioButton src={clipSrc(`shadowingDrill.steps.${index}`)} label="step" />
                </div>
                <p className="text-sm leading-relaxed text-ink-muted">
                  {step.en}
                  <span className="text-zh ml-1.5">{step.zh}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Reflection · 复述成自己
        </div>
        <div className="space-y-2">
          {lesson.reflection.map((item, index) => (
            <div key={item.en} className="flex flex-wrap items-start gap-2">
              <AudioButton src={clipSrc(`reflection.${index}`)} label="reflect" />
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-muted">
                {item.en}
                <span className="text-zh ml-1.5">{item.zh}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-ink/10 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Sources · 灵感来源
        </div>
        <div className="space-y-3">
          {lesson.sources.map((source, index) => (
            <div key={source.url} className="text-sm leading-relaxed">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-accent hover:underline"
                  >
                    {source.title}
                  </a>
                  <span className="text-ink-muted">
                    {" "}
                    · {source.author ? `${source.author} · ` : ""}
                    {source.organization}
                  </span>
                </div>
                <AudioButton src={clipSrc(`sources.${index}`)} label="source" />
              </div>
              {source.note && (
                <p className="mt-1 text-ink-muted">
                  {source.note.en}
                  <span className="text-zh ml-1.5">{source.note.zh}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
