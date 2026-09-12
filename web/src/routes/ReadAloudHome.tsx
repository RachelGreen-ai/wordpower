import { Link } from "react-router-dom";
import { readAloudLessons } from "../lib/readAloud";

const pillars = [
  {
    title: "Listen",
    zh: "听见节奏",
    body: "Use natural narration to catch pauses, stress, and sentence music before you speak.",
    zhBody: "先听停顿、重音和句子的音乐感，再开口。",
  },
  {
    title: "Shadow",
    zh: "影子跟读",
    body: "Repeat short units with the same intention, not just the same pronunciation.",
    zhBody: "跟读短段落时，模仿的不只是发音，还有意图。",
  },
  {
    title: "Borrow",
    zh: "借用表达",
    body: "Collect vocabulary and phrases that make your English more textured and calm.",
    zhBody: "积累让英文更有质感、更稳定的词和短语。",
  },
  {
    title: "Speak",
    zh: "说成自己",
    body: "Turn beautiful prose into your own oral English, reflection, and conversational presence.",
    zhBody: "把美文转成自己的口语、思考和表达气质。",
  },
];

export function ReadAloudHome() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
      </nav>

      <header className="mb-10 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          Beautiful English Read-Aloud · 美文跟读
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          Read slowly, speak clearly, and borrow rhythm from beautiful English.
        </h1>
        <div className="text-zh text-2xl mt-3">
          用有思想的短文练口语、词汇和英文人格。
        </div>
        <p className="mt-5 text-lg text-ink-muted leading-relaxed">
          A new oral English column built around three-to-five-minute passages:
          public-domain inspiration, original read-aloud scripts, TTS narration,
          vocabulary, pronunciation focus, and shadowing drills.
          <span className="text-zh ml-2">
            每课一篇 3-5 分钟可跟读短文，配完整朗读、逐段音频、词汇、发音点和影子练习。
          </span>
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-5">
          Practice Arc · 跟读路径
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
          Read-Aloud Lessons · 跟读课程 ({readAloudLessons.length})
        </h2>
        <div className="space-y-4">
          {readAloudLessons.map((lesson) => (
            <Link
              key={lesson.lessonId}
              to={`/read-aloud/${lesson.lessonId}`}
              className="block rounded-xl border border-ink/10 bg-white px-6 py-5 hover:border-accent hover:shadow-sm transition-all"
            >
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-soft font-semibold mb-2">
                {lesson.level} · {lesson.duration}
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
