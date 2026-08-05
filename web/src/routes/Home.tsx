import { Link } from "react-router-dom";
import { lessons } from "../lib/lessons";

export function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
      <header className="mb-12 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          Bilingual vocabulary atlas · 双语词汇地图
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight">
          Word Power, Reread
        </h1>
        <div className="text-zh text-2xl mt-3">逐词重读，深度学习</div>
        <p className="mt-6 text-lg text-ink-muted max-w-xl mx-auto leading-relaxed">
          Three words per lesson. One hidden through-line. English first, with
          Mandarin side notes — built to teach pronunciation, usage, and the
          subtle distinctions that make vocabulary actually stick.
        </p>

        <nav className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/method"
            className="inline-flex items-baseline gap-2 rounded-full border-2 border-accent/40 bg-paper-warm px-5 py-2 text-sm font-semibold hover:border-accent hover:bg-accent/10 transition-colors"
          >
            <span>📜 The Method</span>
            <span className="text-zh text-xs text-ink-muted">学习方法</span>
          </Link>
          <Link
            to="/test"
            className="inline-flex items-baseline gap-2 rounded-full border-2 border-accent/40 bg-paper-warm px-5 py-2 text-sm font-semibold hover:border-accent hover:bg-accent/10 transition-colors"
          >
            <span>🎯 Take a Test</span>
            <span className="text-zh text-xs text-ink-muted">来做练习</span>
          </Link>
          <Link
            to="/professional-english"
            className="inline-flex items-baseline gap-2 rounded-full border-2 border-accent/40 bg-paper-warm px-5 py-2 text-sm font-semibold hover:border-accent hover:bg-accent/10 transition-colors"
          >
            <span>Professional English</span>
            <span className="text-zh text-xs text-ink-muted">专业英语人格</span>
          </Link>
        </nav>
      </header>

      <section className="mb-12 rounded-xl border border-accent/30 bg-paper-warm px-6 py-5">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
          New Sub-column · 新子专栏
        </div>
        <Link to="/professional-english" className="block group">
          <h2 className="font-serif text-3xl font-bold leading-snug group-hover:text-accent transition-colors">
            Calm ownership under ambiguity
          </h2>
          <div className="text-zh text-lg mt-1">在不确定中稳定负责</div>
          <p className="mt-3 text-ink-muted leading-relaxed max-w-2xl">
            Customer-facing GenAI English for FDEs, AI consultants, and TAMs:
            leadership lines for diagnosing problems, aligning stakeholders,
            and creating trust before the answer is obvious.
          </p>
        </Link>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Lessons · 课程 ({lessons.length})
        </h2>
        <div className="space-y-4">
          {lessons.map((l) => (
            <Link
              key={l.lessonId}
              to={`/lesson/${l.lessonId}`}
              className="block rounded-xl border border-ink/10 bg-white px-6 py-5 hover:border-accent hover:shadow-sm transition-all"
            >
              {l.bookRef && (
                <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
                  {l.bookRef.book}
                  {l.bookRef.chapter && ` · Ch ${l.bookRef.chapter}`}
                  {l.bookRef.theme && ` · ${l.bookRef.theme}`}
                </div>
              )}
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-snug">
                {l.hook.headline.en}
              </h3>
              <div className="text-zh text-lg mt-1">{l.hook.headline.zh}</div>
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {l.words.map((w) => (
                  <span
                    key={w.word}
                    className="inline-flex items-baseline gap-1.5 rounded-full px-3 py-1 text-sm border"
                    style={{
                      borderColor: `#${w.tint}66`,
                      background: `#${w.tint}11`,
                      color: `#${w.tint}`,
                    }}
                  >
                    <span className="font-semibold">{w.word}</span>
                    <span className="text-xs text-zh">{w.chinese}</span>
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
        {lessons.length === 0 && (
          <p className="text-ink-muted italic">No lessons yet. Add a lesson JSON to <code>src/data/</code>.</p>
        )}
      </section>

      <footer className="mt-16 text-center text-sm text-ink-soft">
        Corpus authored from Norman Lewis's <em>Word Power Made Easy</em>.
        See <code>CORPUS.md</code> in the repo for the authoring guide.
      </footer>
    </div>
  );
}
