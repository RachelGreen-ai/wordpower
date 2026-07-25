import { Link, useParams } from "react-router-dom";
import { getLesson } from "../lib/lessons";
import { BilingualLine } from "../components/BilingualLine";
import { AudioButton } from "../components/AudioButton";
import { WordEntry } from "../components/WordEntry";
import { TwistCompare } from "../components/TwistCompare";
import { VocabularyExpansion } from "../components/VocabularyExpansion";

export function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const lesson = id ? getLesson(id) : undefined;

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <Link to="/" className="text-accent hover:underline">
          ← Back
        </Link>
        <h1 className="mt-6 font-serif text-3xl">Lesson not found</h1>
        <p className="text-ink-muted mt-2">No lesson with id "{id}".</p>
      </div>
    );
  }

  const audio = lesson.audio ?? {};

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      {/* Top nav */}
      <nav className="mb-6">
        <Link to="/" className="text-sm text-ink-muted hover:text-accent">
          ← All lessons
        </Link>
      </nav>

      {/* Lesson header */}
      <header className="mb-10">
        {lesson.bookRef && (
          <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
            {lesson.bookRef.book}
            {lesson.bookRef.chapter && ` · Ch ${lesson.bookRef.chapter}`}
            {lesson.bookRef.session && ` · Session ${lesson.bookRef.session}`}
            {lesson.bookRef.theme && ` · ${lesson.bookRef.theme}`}
          </div>
        )}
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          {lesson.hook.headline.en}
        </h1>
        <div className="text-zh text-xl md:text-2xl mt-3">{lesson.hook.headline.zh}</div>
        <div className="mt-4 text-lg text-ink-muted italic">
          {lesson.hook.subtext.en}
          <span className="text-zh ml-3 not-italic">/ {lesson.hook.subtext.zh}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <AudioButton src={audio["hook.headline"]} label="hear the hook" />
          {lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lesson.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full bg-paper-warm border border-ink/10 px-2.5 py-0.5 text-xs text-ink-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Word 1 */}
      <div className="mb-8">
        <WordEntry word={lesson.words[0]} slotPrefix="word.0" audio={audio} tintHex={lesson.words[0].tint} />
      </div>

      {/* Twist between word 1 and word 2 */}
      <div className="mb-8">
        <TwistCompare twist={lesson.twist} word1={lesson.words[0]} word2={lesson.words[1]} audio={audio} />
      </div>

      {/* Word 2 */}
      <div className="mb-8">
        <WordEntry word={lesson.words[1]} slotPrefix="word.1" audio={audio} tintHex={lesson.words[1].tint} />
      </div>

      {/* Word 3 */}
      <div className="mb-8">
        <WordEntry word={lesson.words[2]} slotPrefix="word.2" audio={audio} tintHex={lesson.words[2].tint} />
      </div>

      {/* Recap */}
      <section className="rounded-2xl bg-ink text-paper p-10 text-center my-8">
        <div className="text-xs uppercase tracking-[0.2em] text-paper-warm/60 font-semibold mb-5">
          Recap · 总结
        </div>
        <div className="flex justify-center gap-6 md:gap-10 mb-8">
          {lesson.words.map((w) => (
            <div key={w.word} className="flex flex-col items-center">
              <div
                className="font-serif text-xl md:text-2xl font-bold"
                style={{ color: `#${w.tint}` }}
              >
                {w.word}
              </div>
              <div className="text-sm md:text-base text-paper-warm/55 mt-1">
                {w.chinese}
              </div>
              <div
                className="mt-2.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border"
                style={{ color: `#${w.tint}`, borderColor: `#${w.tint}55`, background: `#${w.tint}11` }}
                title="archetype label · 性格关键词"
              >
                {w.archetypeZh}
              </div>
            </div>
          ))}
        </div>
        <BilingualLine
          en={
            <span className="font-serif text-xl md:text-2xl font-bold leading-snug" style={{ color: "var(--color-accent-soft)" }}>
              {lesson.recap.reflection.en}
            </span>
          }
          zh={<span className="text-base md:text-lg text-paper-warm/80">{lesson.recap.reflection.zh}</span>}
          align="center"
        />
        <div className="mt-5 flex justify-center">
          <AudioButton src={audio["recap.reflection"]} label="hear the reflection" />
        </div>
      </section>

      {/* Word family — etymology-driven vocabulary expansion */}
      {lesson.vocabularyExpansion.length > 0 && (
        <div className="mb-8">
          <VocabularyExpansion
            expansion={lesson.vocabularyExpansion}
            words={lesson.words}
            audio={audio}
          />
        </div>
      )}

      {/* Source footer */}
      {lesson.bookRef?.pages && (
        <footer className="text-center text-sm text-ink-soft pt-6">
          From <em>{lesson.bookRef.book}</em>
          {lesson.bookRef.author && ` by ${lesson.bookRef.author}`}
          {lesson.bookRef.pages && ` · pp. ${lesson.bookRef.pages[0]}–${lesson.bookRef.pages[1]}`}
        </footer>
      )}
    </div>
  );
}
