import { Link, useParams } from "react-router-dom";
import { AudioButton } from "../components/AudioButton";
import { getParentingLesson } from "../lib/parenting";

export function ParentingLessonPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = id ? getParentingLesson(id) : undefined;

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <Link to="/parenting" className="text-accent hover:underline">
          ← Raising With Regard
        </Link>
        <h1 className="mt-6 font-serif text-3xl">Lesson not found</h1>
        <p className="text-ink-muted mt-2">No parenting lesson with id "{id}".</p>
      </div>
    );
  }

  const clipSrc = (key: string) => lesson.audio?.clips?.[key];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <nav className="mb-6">
        <Link to="/parenting" className="text-sm text-ink-muted hover:text-accent">
          ← Raising With Regard
        </Link>
      </nav>

      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          {lesson.series.en} · {lesson.series.zh}
        </div>
        {lesson.audio?.narration && (
          <div className="mb-5">
            <AudioButton
              src={lesson.audio.narration}
              label="play lesson"
              size="md"
            />
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

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-4">
          Parenting Moment · 养育场景
        </div>
        <QuoteBlock
          label="Context"
          text={lesson.moment.context}
          audioSrc={clipSrc("moment.context")}
        />
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <ResponseBlock
            title="Avoid saying"
            tone="weak"
            text={lesson.moment.avoid}
            audioSrc={clipSrc("moment.avoid")}
          />
          <ResponseBlock
            title="Say with regard"
            tone="reliable"
            text={lesson.moment.better}
            audioSrc={clipSrc("moment.better")}
          />
        </div>
      </section>

      <section className="my-8 rounded-xl bg-ink text-paper p-8 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-paper-warm/60 font-semibold mb-3">
          Core Principle · 核心原则
        </div>
        <div className="mb-4">
          <AudioButton src={clipSrc("principle")} label="principle" size="md" />
        </div>
        <div className="font-serif text-2xl md:text-3xl font-bold text-accent-soft">
          {lesson.principle.en}
        </div>
        <div className="text-zh text-lg mt-2 text-paper-warm/80">
          {lesson.principle.zh}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Frames · 思考框架
        </div>
        <div className="space-y-2">
          {lesson.frames.map((frame, index) => (
            <div key={frame.en} className="flex gap-3 rounded-lg bg-paper p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2">
                  <AudioButton src={clipSrc(`frames.${index}`)} label="frame" />
                </div>
                <div className="text-sm leading-relaxed text-ink-muted">
                  {frame.en}
                  <span className="text-zh ml-1.5">{frame.zh}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-5">
          <h2 className="font-serif text-3xl font-bold">Phrase Bank</h2>
          <div className="text-zh text-lg text-ink-muted mt-1">不同对象，不同说法</div>
        </div>
        <div className="space-y-4">
          {lesson.phraseBank.map((item, index) => (
            <PhraseCard
              key={item.line}
              item={item}
              audioSrc={clipSrc(`phraseBank.${index}`)}
              audioLabel="phrase"
            />
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-ink/10 bg-white p-6">
        <h2 className="font-serif text-3xl font-bold">Vocabulary With Regard</h2>
        <div className="text-zh text-lg text-ink-muted mt-1">有分寸的养育词汇</div>
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

      <section className="mb-8">
        <div className="mb-5">
          <h2 className="font-serif text-3xl font-bold">Scripts</h2>
          <div className="text-zh text-lg text-ink-muted mt-1">可以直接练习的句子</div>
        </div>
        <div className="space-y-4">
          {lesson.scripts.map((item, index) => (
            <PhraseCard
              key={item.line}
              item={item}
              audioSrc={clipSrc(`scripts.${index}`)}
              audioLabel="script"
            />
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-accent/30 bg-paper-warm p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Reflection · 复盘
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
          Sources · 来源
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
                  <span className="text-ink-muted"> · {source.organization}</span>
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

function QuoteBlock({
  label,
  text,
  audioSrc,
}: {
  label: string;
  text: string;
  audioSrc?: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold">
          {label}
        </div>
        <AudioButton src={audioSrc} label="context" />
      </div>
      <p className="mt-2 font-serif text-xl leading-relaxed">{text}</p>
    </div>
  );
}

function ResponseBlock({
  title,
  text,
  tone,
  audioSrc,
}: {
  title: string;
  text: string;
  tone: "weak" | "reliable";
  audioSrc?: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        tone === "weak"
          ? "border-ink/10 bg-paper"
          : "border-accent/30 bg-accent/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.16em] text-ink-soft font-semibold">
          {title}
        </div>
        <AudioButton src={audioSrc} label="box" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}

function PhraseCard({
  item,
  audioSrc,
  audioLabel,
}: {
  item: {
    audience: { en: string; zh: string };
    line: string;
    why: { en: string; zh: string };
  };
  audioSrc?: string;
  audioLabel: string;
}) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-lg leading-snug">{item.audience.en}</div>
          <div className="text-zh text-sm text-ink-muted mt-1">{item.audience.zh}</div>
        </div>
        <AudioButton src={audioSrc} label={audioLabel} />
      </div>
      <p className="mt-4 font-serif text-xl leading-relaxed text-ink">
        “{item.line}”
      </p>
      <div className="mt-4 border-t border-ink/10 pt-3 text-sm text-ink-muted leading-relaxed">
        <span className="font-semibold text-ink">Why it works: </span>
        {item.why.en}
        <span className="text-zh ml-2">{item.why.zh}</span>
      </div>
    </article>
  );
}
