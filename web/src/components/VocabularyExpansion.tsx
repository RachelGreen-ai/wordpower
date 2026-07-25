/**
 * VocabularyExpansion — the "Word Family" section.
 *
 * Groups the lesson's `vocabularyExpansion[]` items by their shared root, and
 * renders each as a small dictionary entry with definition + usage sentence.
 * The point: leverage etymology to teach a whole word family from one root,
 * matching the pedagogy of Word Power Made Easy.
 */
import type { VocabLesson, ExpansionWord } from "../corpus-types/vocab";
import { BilingualLine } from "./BilingualLine";
import { AudioButton } from "./AudioButton";

interface Props {
  expansion: VocabLesson["vocabularyExpansion"];
  /** Lesson words — used to find the matching tint color for each root. */
  words: VocabLesson["words"];
  /** Audio map — used to play per-word pronunciation. */
  audio: Record<string, string>;
}

interface IndexedItem {
  item: ExpansionWord;
  index: number; // global index in the original expansion array — drives audio slot lookup
}

export function VocabularyExpansion({ expansion, words, audio }: Props) {
  if (expansion.length === 0) return null;

  // Group by root, preserving global indices (the audio slot key uses the
  // original array index, not the per-root position).
  const grouped = new Map<string, IndexedItem[]>();
  for (const [i, item] of expansion.entries()) {
    if (!grouped.has(item.root)) grouped.set(item.root, []);
    grouped.get(item.root)!.push({ item, index: i });
  }

  // Look up the meaning of each root from the core words' etymology, so we can
  // label the group with both root + meaning (e.g. "ego — 'I' / 我").
  // Preserve FIRST-seen value per root — when two core words share a root
  // (e.g. egoist + egotist both have root "ego"), the first word's tint wins.
  const rootMeaning = new Map<string, string>();
  const rootMeaningZh = new Map<string, string | undefined>();
  const rootTint = new Map<string, string>();
  for (const w of words) {
    if (!rootMeaning.has(w.etymology.root)) {
      rootMeaning.set(w.etymology.root, w.etymology.meaning);
      rootMeaningZh.set(w.etymology.root, w.etymology.meaningZh);
      rootTint.set(w.etymology.root, `#${w.tint}`);
    }
  }
  // Fall back to entry-level metadata for auxiliary roots (e.g. iatros, soma)
  // that aren't represented in the core words. First entry to introduce an
  // auxiliary root provides its meaning + tint.
  for (const item of expansion) {
    if (!rootMeaning.has(item.root) && item.rootMeaning) {
      rootMeaning.set(item.root, item.rootMeaning);
      rootMeaningZh.set(item.root, item.rootMeaningZh);
      if (item.rootTint) rootTint.set(item.root, `#${item.rootTint}`);
    }
  }

  return (
    <section className="rounded-2xl bg-paper-warm border border-ink/10 p-6 md:p-10">
      <header className="mb-7 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Word Family · 词族扩展
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
          One root. A whole vocabulary.
        </h2>
        <div className="text-zh text-lg md:text-xl mt-2">
          一个词根，一整个词族。
        </div>
        <p className="mt-4 text-ink-muted leading-relaxed max-w-xl mx-auto">
          The same Latin roots that built the three core words have grown into
          dozens of others. Learn them as a family and your vocabulary multiplies.
          <br />
          <span className="text-sm">
            同样的拉丁词根，长出了几十个相关的单词。把它们当一家人记，词汇量就会成倍扩张。
          </span>
        </p>
      </header>

      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([root, items]) => {
          const tint = rootTint.get(root) ?? "var(--color-accent)";
          const meaning = rootMeaning.get(root);
          const meaningZh = rootMeaningZh.get(root);
          return (
            <div key={root}>
              {/* Root header */}
              <div className="flex items-baseline gap-3 mb-5 pb-2 border-b" style={{ borderColor: `${tint}55` }}>
                <span className="font-serif text-2xl md:text-3xl font-bold" style={{ color: tint }}>
                  {root}
                </span>
                {meaning && (
                  <span className="text-ink-muted">= "{meaning}"</span>
                )}
                {meaningZh && (
                  <span className="text-zh text-sm">/ {meaningZh}</span>
                )}
                <span className="ml-auto text-xs text-ink-soft">
                  {items.length} word{items.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Words in this root family */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(({ item, index }) => (
                  <ExpansionCard
                    key={item.word}
                    item={item}
                    tint={tint}
                    audioSrc={audio[`expansion.${index}.pronunciation`]}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExpansionCard({
  item,
  tint,
  audioSrc,
}: {
  item: ExpansionWord;
  tint: string;
  audioSrc: string | undefined;
}) {
  return (
    <article className="rounded-xl bg-white border border-ink/10 p-5 hover:shadow-sm transition-shadow">
      <header className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h3 className="font-serif text-xl font-bold" style={{ color: tint }}>
          {item.word}
        </h3>
        {item.partOfSpeech && (
          <span className="text-xs italic text-ink-soft">{item.partOfSpeech}</span>
        )}
        <span className="ml-auto text-zh text-sm">{item.zh}</span>
      </header>

      {/* Phonetic + audio button row */}
      {(item.phonetic || audioSrc) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {item.phonetic && (
            <span className="font-mono text-xs text-ink-muted">{item.phonetic}</span>
          )}
          <AudioButton src={audioSrc} label="say it" />
        </div>
      )}

      <div className="mb-3">
        <BilingualLine
          en={<span className="leading-snug">{item.gloss.en}</span>}
          zh={<span className="text-sm leading-snug">{item.gloss.zh}</span>}
        />
      </div>

      <div className="border-l-2 pl-3 py-1" style={{ borderColor: `${tint}66` }}>
        <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: tint }}>
          In use · 例句
        </div>
        <BilingualLine
          en={
            <span className="leading-snug">
              <HighlightedText text={item.usage.en} target={item.word} tint={tint} />
            </span>
          }
          zh={<span className="text-sm leading-snug">{item.usage.zh}</span>}
        />
      </div>
    </article>
  );
}

function HighlightedText({ text, target, tint }: { text: string; target: string; tint: string }) {
  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stem = escaped.split(" ");
  const pattern =
    stem.length === 1
      ? `\\b(${stem[0]}\\w*)\\b`
      : `\\b(${escaped}\\w*)\\b`;
  const re = new RegExp(pattern, "gi");
  // Filter out empty splits (regex can produce "" at the start/end) and
  // build elements with composite string keys for stable reconciliation.
  const parts = text.split(re).filter((p) => p.length > 0);
  const targetLower = target.toLowerCase();
  return (
    <>
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase().startsWith(targetLower);
        const key = `${i}-${part.slice(0, 12)}`;
        return isMatch ? (
          <strong key={key} style={{ color: tint, fontWeight: 700 }}>
            {part}
          </strong>
        ) : (
          <span key={key}>{part}</span>
        );
      })}
    </>
  );
}
