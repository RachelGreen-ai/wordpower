/**
 * WordEntry — "fancy dictionary" view of a single VocabWord.
 * Shows pronunciation, definition, etymology, sentences, mnemonic, anecdote,
 * confusions, and quiz — with audio play buttons for every audible slot.
 */
import { useState } from "react";
import type { VocabWord } from "../corpus-types/vocab";
import { BilingualLine } from "./BilingualLine";
import { AudioButton } from "./AudioButton";

interface Props {
  word: VocabWord;
  slotPrefix: string; // e.g. "word.0"
  audio: Record<string, string>;
  tintHex: string;
}

export function WordEntry({ word, slotPrefix, audio, tintHex }: Props) {
  const accent = `#${tintHex}`;
  return (
    <article
      className="rounded-2xl bg-white shadow-sm border border-ink/5 overflow-hidden"
      style={{ borderTop: `4px solid ${accent}` }}
    >
      {/* Header — word, phonetic, Chinese, pronunciation audio */}
      <header className="px-8 pt-8 pb-6 border-b border-ink/5">
        <div className="flex items-baseline gap-5 flex-wrap">
          <h2 className="font-serif text-5xl md:text-6xl font-bold leading-none tracking-tight">
            {word.word}
          </h2>
          <span className="text-xl text-ink-muted font-mono">{word.phonetic}</span>
          <AudioButton
            src={audio[`${slotPrefix}.pronunciation`]}
            label="say it"
            size="md"
          />
        </div>
        <div className="mt-2 text-xl text-zh">{word.chinese}</div>
      </header>

      <div className="px-8 py-7 space-y-7">
        {/* Definition */}
        <Section label="Definition · 释义">
          <BilingualLine
            en={<span className="text-xl font-medium leading-snug">{word.definition.en}</span>}
            zh={<span className="text-base leading-snug">{word.definition.zh}</span>}
          />
          <AudioButton
            src={audio[`${slotPrefix}.definition`]}
            label="hear definition"
            className="mt-3"
          />
        </Section>

        {/* Mnemonic */}
        {word.mnemonic && (
          <Section label="Mnemonic · 助记">
            <div
              className="rounded-lg p-4 border"
              style={{ borderColor: `${accent}55`, background: `${accent}11` }}
            >
              <BilingualLine
                en={<span className="font-semibold">{word.mnemonic.en}</span>}
                zh={<span>{word.mnemonic.zh}</span>}
              />
            </div>
          </Section>
        )}

        {/* Etymology */}
        <Section label="Etymology · 词源">
          <div className="font-serif text-lg">
            <span className="font-bold" style={{ color: accent }}>
              {word.etymology.root}
            </span>
            <span className="text-ink-muted px-2">=</span>
            <span>"{word.etymology.meaning}"</span>
          </div>
          <div className="text-zh mt-1.5">{word.etymology.zh}</div>
          {word.etymology.relatives.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {word.etymology.relatives.map((r) => (
                <span
                  key={r.word}
                  className="inline-flex flex-col items-center rounded-md bg-paper-warm px-3 py-1.5"
                >
                  <span className="font-medium">{r.word}</span>
                  <span className="text-xs text-zh">{r.zh}</span>
                </span>
              ))}
            </div>
          )}
          <AudioButton
            src={audio[`${slotPrefix}.etymology`]}
            label="hear etymology"
            className="mt-3"
          />
        </Section>

        {/* Sentences */}
        <Section label="In a sentence · 例句">
          <div className="space-y-4">
            {word.sentences.map((s, i) => (
              <SentenceCard
                key={i}
                sentence={s}
                targetWord={word.word}
                audioSrc={audio[`${slotPrefix}.sentence.${i}`]}
              />
            ))}
          </div>
        </Section>

        {/* Anecdote */}
        {word.anecdote && (
          <Section label="A real-world story · 真实故事">
            <div
              className="rounded-lg p-5 border-l-4 italic"
              style={{ borderColor: accent, background: `${accent}08` }}
            >
              <BilingualLine
                en={<span className="text-lg leading-relaxed">{word.anecdote.en}</span>}
                zh={<span className="leading-relaxed">{word.anecdote.zh}</span>}
              />
            </div>
          </Section>
        )}

        {/* Quiz */}
        {word.quiz.length > 0 && (
          <Section label="Self-test · 自测">
            <div className="space-y-3">
              {word.quiz.map((q, i) => (
                <QuizItem key={i} item={q} />
              ))}
            </div>
          </Section>
        )}

        {/* Confusions */}
        {word.commonConfusions.length > 0 && (
          <Section label="Commonly confused with · 常被混淆">
            <div className="flex flex-wrap gap-2">
              {word.commonConfusions.map((w) => (
                <span
                  key={w}
                  className="inline-flex items-center rounded-full bg-paper-warm px-3 py-1 text-sm border border-ink/5"
                >
                  {w}
                </span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </article>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-[0.18em] text-ink-soft font-semibold mb-3">
        {label}
      </h3>
      {children}
    </section>
  );
}

function SentenceCard({
  sentence,
  targetWord,
  audioSrc,
}: {
  sentence: { context: string; en: string; zh: string };
  targetWord: string;
  audioSrc: string | undefined;
}) {
  return (
    <div className="border-l-2 border-accent/40 pl-5 py-1">
      <div className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-1.5">
        {sentence.context}
      </div>
      <div className="text-lg leading-snug">
        <HighlightedText text={sentence.en} target={targetWord} />
      </div>
      <div className="text-zh text-base mt-1.5 leading-snug">{sentence.zh}</div>
      <div className="mt-2">
        <AudioButton src={audioSrc} label="play" />
      </div>
    </div>
  );
}

function HighlightedText({ text, target }: { text: string; target: string }) {
  const stem = target.toLowerCase();
  const re = new RegExp(`\\b(${stem}\\w*)\\b`, "gi");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase().startsWith(stem) ? (
          <strong key={i} className="text-accent font-bold">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function QuizItem({ item }: { item: { question: { en: string; zh: string }; answer: { en: string; zh: string } } }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="rounded-lg border border-ink/10 overflow-hidden">
      <div className="p-4 bg-paper-warm">
        <div className="font-medium leading-snug">{item.question.en}</div>
        <div className="text-zh text-sm mt-1">{item.question.zh}</div>
      </div>
      <button
        onClick={() => setShown((v) => !v)}
        className="w-full text-left px-4 py-2 text-sm border-t border-ink/10 hover:bg-paper-warm transition-colors"
      >
        {shown ? "▾ Hide answer · 隐藏答案" : "▸ Show answer · 显示答案"}
      </button>
      {shown && (
        <div className="p-4 border-t border-ink/10 bg-accent/[0.06]">
          <div className="leading-snug">{item.answer.en}</div>
          <div className="text-zh text-sm mt-1">{item.answer.zh}</div>
        </div>
      )}
    </div>
  );
}
