import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  roots,
  rootsByLanguage,
  LANGUAGE_LABELS,
  type RootEntry,
  type RootLanguage,
} from "../lib/roots";
import { lessons } from "../lib/lessons";

type Tab = "all" | RootLanguage;
type Sort = "frequency" | "alpha";

const TAB_ORDER: Tab[] = ["all", "greek", "latin", "germanic", "eponym", "compound", "other"];

function rootsForTab(tab: Tab): RootEntry[] {
  return tab === "all" ? roots : rootsByLanguage[tab];
}

/** Letter shown as a section header when sorting A–Z. */
function firstLetter(root: string): string {
  const ch = root.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

interface Tier {
  label: string;
  zh: string;
  test: (n: number) => boolean;
}
const TIERS: Tier[] = [
  { label: "Workhorse roots · 5+ words", zh: "高频词根 · 5个或以上", test: (n) => n >= 5 },
  { label: "Common roots · 2–4 words", zh: "常见词根 · 2-4个", test: (n) => n >= 2 && n < 5 },
  { label: "Single appearance", zh: "仅出现一次", test: (n) => n === 1 },
];

export function MethodPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("frequency");
  const [active, setActive] = useState<RootEntry | null>(null);

  const tabbed = useMemo(() => rootsForTab(tab), [tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabbed;
    return tabbed.filter(
      (r) =>
        r.root.toLowerCase().includes(q) ||
        r.meaning?.toLowerCase().includes(q) ||
        r.meaningZh?.includes(q),
    );
  }, [query, tabbed]);

  /** Frequency-mode grouping. */
  const tiered = useMemo(() => {
    if (sort !== "frequency") return [];
    return TIERS.map((t) => ({
      ...t,
      entries: filtered.filter((r) => t.test(r.occurrences.length)),
    })).filter((t) => t.entries.length > 0);
  }, [filtered, sort]);

  /** A–Z grouping — entries sorted by root letter, headed by capital letters. */
  const alphabetized = useMemo(() => {
    if (sort !== "alpha") return [];
    const sorted = [...filtered].sort((a, b) =>
      a.root.toLowerCase().localeCompare(b.root.toLowerCase()),
    );
    const groups = new Map<string, RootEntry[]>();
    for (const r of sorted) {
      const letter = firstLetter(r.root);
      const arr = groups.get(letter) ?? [];
      arr.push(r);
      groups.set(letter, arr);
    }
    return Array.from(groups.entries()).map(([letter, entries]) => ({ letter, entries }));
  }, [filtered, sort]);

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = {
      all: roots.length,
      greek: rootsByLanguage.greek.length,
      latin: rootsByLanguage.latin.length,
      germanic: rootsByLanguage.germanic.length,
      eponym: rootsByLanguage.eponym.length,
      compound: rootsByLanguage.compound.length,
      other: rootsByLanguage.other.length,
    };
    return counts;
  }, []);

  const totalWords = roots.reduce((s, r) => s + r.occurrences.length, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-8 text-sm">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
      </nav>

      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          The Method · 学习方法
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          Learn roots, not lists.
        </h1>
        <div className="text-zh text-2xl mt-2">学词根，不背词表。</div>
      </header>

      <section className="prose-like space-y-6 text-lg text-ink leading-relaxed max-w-3xl mb-12">
        <p>
          Norman Lewis built <em>Word Power Made Easy</em> around one observation: most
          English words ride on a small set of Latin and Greek roots. Learn the roots,
          and you've quietly learned dozens of words at once — including ones you've
          never seen before.
        </p>
        <p className="text-zh text-base text-ink-muted">
          诺曼·路易斯写《Word Power Made Easy》时，看到一个事实：大多数英语词都建在少数几个拉丁、希腊词根之上。学懂词根，你就一次学会了几十个词
          — 包括那些你还没见过的。
        </p>

        <p>
          So instead of memorizing isolated words, every lesson here orbits a small
          theme — three words that share an idea, paired with the roots they grew from.
          The word family at the bottom of each lesson then surfaces every other word
          in the corpus that uses the same root.
        </p>

        <p>Three things to do, in order:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong>Read the hook + the three words.</strong> Don't worry about
            memorizing — just notice the through-line.
          </li>
          <li>
            <strong>Look at the etymology.</strong> Each root is a small picture —
            a tail wagging, a body falling, a star turning. Hold the picture.
          </li>
          <li>
            <strong>Skim the Word Family.</strong> You'll meet the root in disguise,
            five or ten more times. Each time, the disguise gets thinner.
          </li>
        </ol>

        <p className="pt-2 text-ink-muted italic">
          When the disguise stops working, you've learned the root. From then on, every
          new word with that root is half-learned the moment you see it.
        </p>
      </section>

      <section className="mb-12 max-w-3xl">
        <h2 className="font-serif text-3xl font-bold">
          Quick Answers
          <span className="text-zh text-xl ml-3 font-normal text-ink-muted">
            常见问题
          </span>
        </h2>
        <div className="mt-5 space-y-5 text-lg text-ink leading-relaxed">
          <div>
            <h3 className="font-semibold text-xl">
              How does root-based vocabulary learning work?
            </h3>
            <p className="mt-2 text-ink-muted">
              Root-based vocabulary learning teaches Latin and Greek roots first,
              then connects each root to many related words so unfamiliar
              vocabulary becomes easier to decode.
              <span className="text-zh ml-2">
                先学词根，再把同根词连起来；陌生词会变得更容易拆解。
              </span>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-xl">
              Who is Word Power, Reread for?
            </h3>
            <p className="mt-2 text-ink-muted">
              It is for English learners, especially Mandarin readers, who want
              etymology, pronunciation, examples, and active recall instead of
              isolated word lists.
              <span className="text-zh ml-2">
                适合想用词源、发音、例句和主动回忆来学词的人，尤其适合中文读者。
              </span>
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
          <h2 className="font-serif text-3xl font-bold">
            The Root Atlas
            <span className="text-zh text-xl ml-3 font-normal text-ink-muted">
              词根地图
            </span>
          </h2>
          <div className="text-sm text-ink-soft">
            {roots.length} roots · {totalWords} occurrences across {lessons.length} lessons
          </div>
        </div>

        <p className="text-sm text-ink-muted mb-5">
          Group by language family. Sort by frequency tier or A–Z. Click any root to expand its full word family.
          <span className="text-zh ml-2">按语言来源分组。按出现频率或字母序排序。点击任一词根查看完整词族。</span>
        </p>

        {/* Sort toggle */}
        <div className="mb-3 inline-flex rounded-lg border border-ink/15 bg-white p-0.5">
          <button
            onClick={() => {
              setSort("frequency");
              setActive(null);
            }}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === "frequency"
                ? "bg-accent text-paper-warm"
                : "text-ink hover:bg-ink/5"
            }`}
          >
            By frequency
            <span
              className={`text-zh text-xs ml-1.5 ${
                sort === "frequency" ? "text-paper-warm/80" : "text-ink-soft"
              }`}
            >
              频率
            </span>
          </button>
          <button
            onClick={() => {
              setSort("alpha");
              setActive(null);
            }}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === "alpha"
                ? "bg-accent text-paper-warm"
                : "text-ink hover:bg-ink/5"
            }`}
          >
            A–Z
            <span
              className={`text-zh text-xs ml-1.5 ${
                sort === "alpha" ? "text-paper-warm/80" : "text-ink-soft"
              }`}
            >
              字母序
            </span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="sticky top-0 z-10 -mx-2 mb-5 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80 py-2">
          <div className="flex flex-wrap gap-2 px-2">
            {TAB_ORDER.map((t) => {
              const count = tabCounts[t];
              if (count === 0 && t !== "all") return null;
              const isActive = tab === t;
              const label = t === "all" ? "All · 全部" : LANGUAGE_LABELS[t].en;
              const zh = t === "all" ? "" : LANGUAGE_LABELS[t].zh;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setActive(null);
                  }}
                  className={`inline-flex items-baseline gap-1.5 rounded-full border-2 px-3.5 py-1 text-sm transition-colors ${
                    isActive
                      ? "border-accent bg-accent text-paper-warm font-semibold"
                      : "border-ink/15 bg-white text-ink hover:border-accent"
                  }`}
                >
                  <span>{label}</span>
                  {zh && (
                    <span
                      className={`text-zh text-xs ${isActive ? "text-paper-warm/80" : "text-ink-soft"}`}
                    >
                      {zh}
                    </span>
                  )}
                  <span
                    className={`text-xs ${isActive ? "text-paper-warm/70" : "text-ink-soft"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a root or its meaning — 'cadere', 'fall', '落'…"
            className="w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>

        {filtered.length === 0 && (
          <p className="text-ink-muted italic">
            No roots match "{query}" in this tab. Try the All tab, or a different term.
          </p>
        )}

        {sort === "frequency" &&
          tiered.map((tier) => (
            <div key={tier.label} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3 border-b border-ink/10 pb-2">
                <h3 className="font-serif text-lg font-bold text-ink">{tier.label}</h3>
                <span className="text-zh text-sm text-ink-muted">{tier.zh}</span>
                <span className="text-xs text-ink-soft ml-auto">{tier.entries.length}</span>
              </div>
              <RootGrid entries={tier.entries} active={active} setActive={setActive} />
            </div>
          ))}

        {sort === "alpha" &&
          alphabetized.map((group) => (
            <div key={group.letter} className="mb-8">
              <div className="flex items-baseline gap-3 mb-3 border-b border-ink/10 pb-2">
                <h3 className="font-serif text-2xl font-bold text-accent">{group.letter}</h3>
                <span className="text-xs text-ink-soft ml-auto">{group.entries.length}</span>
              </div>
              <RootGrid entries={group.entries} active={active} setActive={setActive} />
            </div>
          ))}

        {active && <RootDetail root={active} onClose={() => setActive(null)} />}
      </section>
    </div>
  );
}

function RootGrid({
  entries,
  active,
  setActive,
}: {
  entries: RootEntry[];
  active: RootEntry | null;
  setActive: (r: RootEntry) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
      {entries.map((r) => (
        <button
          key={r.root}
          onClick={() => setActive(r)}
          className={`text-left rounded-lg border px-4 py-2.5 transition-colors hover:border-accent ${
            active?.root === r.root
              ? "border-accent bg-accent/5"
              : "border-ink/10 bg-white"
          }`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span
                className="font-serif text-lg font-bold"
                style={r.tint ? { color: `#${r.tint}` } : undefined}
              >
                {r.root}
              </span>
              {r.meaning && (
                <span className="ml-2 text-ink-muted text-sm">— {r.meaning}</span>
              )}
              {r.meaningZh && (
                <span className="ml-2 text-zh text-xs text-ink-soft">{r.meaningZh}</span>
              )}
            </div>
            <span className="text-xs text-ink-soft shrink-0 tabular-nums">
              {r.occurrences.length}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function RootDetail({ root, onClose }: { root: RootEntry; onClose: () => void }) {
  const byLesson = new Map<string, typeof root.occurrences>();
  for (const occ of root.occurrences) {
    const arr = byLesson.get(occ.lessonId) ?? [];
    arr.push(occ);
    byLesson.set(occ.lessonId, arr);
  }

  return (
    <div
      className="rounded-xl border-2 bg-paper-warm p-6 sticky bottom-4 shadow-lg"
      style={{ borderColor: root.tint ? `#${root.tint}66` : undefined }}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold">
            <span>Root family</span>
            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] normal-case tracking-normal">
              {LANGUAGE_LABELS[root.language].en} · {LANGUAGE_LABELS[root.language].zh}
            </span>
          </div>
          <h3
            className="font-serif text-3xl font-bold mt-1"
            style={root.tint ? { color: `#${root.tint}` } : undefined}
          >
            {root.root}
          </h3>
          {root.meaning && (
            <div className="text-lg text-ink mt-1">
              {root.meaning}
              {root.meaningZh && (
                <span className="text-zh ml-3 text-ink-muted">{root.meaningZh}</span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-ink-soft hover:text-ink text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-3 max-h-[40vh] overflow-y-auto">
        {Array.from(byLesson.entries()).map(([lessonId, occs]) => (
          <div key={lessonId} className="border-t border-ink/10 pt-3">
            <Link
              to={`/lesson/${lessonId}`}
              className="text-sm font-semibold text-accent hover:underline"
            >
              {lessonId} →
            </Link>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {occs.map((o, i) => (
                <span
                  key={`${o.word}-${i}`}
                  className={`inline-flex items-baseline gap-1.5 rounded-full px-2.5 py-0.5 text-sm border ${
                    o.kind === "core"
                      ? "border-accent/50 bg-accent/10 font-semibold"
                      : "border-ink/15 bg-white"
                  }`}
                  title={
                    o.kind === "core"
                      ? "core word in lesson"
                      : o.kind === "etymology-relative"
                        ? "etymology cousin"
                        : "word family expansion"
                  }
                >
                  <span>{o.word}</span>
                  {o.zh && <span className="text-xs text-ink-soft">{o.zh}</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
