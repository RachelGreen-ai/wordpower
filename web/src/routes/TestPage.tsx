import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { lessons } from "../lib/lessons";
import type { VocabLesson, VocabWord } from "../corpus-types/vocab";

type Mode = "root" | "twin" | "audio";

interface FlatWord {
  word: string;
  chinese: string;
  phonetic: string;
  definition: { en: string; zh: string };
  etymology: {
    root: string;
    meaning: string;
    meaningZh?: string;
    en: string;
    zh: string;
  };
  commonConfusions: string[];
  audio?: string;
  lessonId: string;
}

function flatten(): FlatWord[] {
  return lessons.flatMap((l: VocabLesson) =>
    l.words.map((w: VocabWord, i: number) => ({
      word: w.word,
      chinese: w.chinese,
      phonetic: w.phonetic,
      definition: w.definition,
      etymology: w.etymology,
      commonConfusions: w.commonConfusions ?? [],
      audio: l.audio?.[`word.${i}.pronunciation`],
      lessonId: l.lessonId,
    })),
  );
}

function pickRandom<T>(arr: T[], n: number, exclude?: T[]): T[] {
  const ex = new Set(exclude ?? []);
  const pool = arr.filter((x) => !ex.has(x));
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

interface Score {
  attempted: number;
  correct: number;
  streak: number;
  bestStreak: number;
}

const SCORE_KEY_PREFIX = "wpme-test-score-";

function loadScore(mode: Mode): Score {
  try {
    const raw = localStorage.getItem(SCORE_KEY_PREFIX + mode);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { attempted: 0, correct: 0, streak: 0, bestStreak: 0 };
}

function saveScore(mode: Mode, score: Score) {
  try {
    localStorage.setItem(SCORE_KEY_PREFIX + mode, JSON.stringify(score));
  } catch {}
}

export function TestPage() {
  const [mode, setMode] = useState<Mode | null>(null);
  const words = useMemo(() => flatten(), []);

  if (!mode) return <ModeChooser onPick={setMode} />;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-6 text-sm flex items-center gap-4">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
        <button
          onClick={() => setMode(null)}
          className="text-ink-soft hover:text-accent"
        >
          ← Change mode
        </button>
      </nav>

      {mode === "root" && <RootMode words={words} />}
      {mode === "twin" && <TwinMode words={words} />}
      {mode === "audio" && <AudioMode words={words} />}
    </div>
  );
}

function ModeChooser({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12">
      <nav className="mb-6 text-sm">
        <Link to="/" className="text-ink-soft hover:text-accent">
          ← Home
        </Link>
      </nav>

      <header className="mb-10">
        <div className="text-xs uppercase tracking-[0.25em] text-ink-soft font-semibold mb-3">
          Vocabulary Tests · 词汇练习
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
          Active recall, three ways.
        </h1>
        <div className="text-zh text-2xl mt-2">主动回忆，三种方式。</div>
        <p className="mt-6 text-lg text-ink-muted leading-relaxed">
          Reading a word is not knowing it. These three tests ask you to produce it
          — from a root, from a definition, from a sound. Your score is kept locally.
        </p>
      </header>

      <div className="space-y-4">
        <ModeCard
          title="Match the root"
          zh="对上词根"
          desc="Read an etymology blurb. Pick the word it built."
          descZh="读一段词源解释。选出它造出的那个词。"
          onClick={() => onPick("root")}
        />
        <ModeCard
          title="Distinguish the twins"
          zh="分辨近义词"
          desc="Read a definition. Pick the right word from a confusable set."
          descZh="读一段定义。从容易混淆的几个词里选对那一个。"
          onClick={() => onPick("twin")}
        />
        <ModeCard
          title="Hear it, name it"
          zh="听音辨词"
          desc="Listen to a Kokoro pronunciation. Type the word."
          descZh="听一段 Kokoro 朗读。把这个词敲出来。"
          onClick={() => onPick("audio")}
        />
      </div>
    </div>
  );
}

function ModeCard({
  title,
  zh,
  desc,
  descZh,
  onClick,
}: {
  title: string;
  zh: string;
  desc: string;
  descZh: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-ink/10 bg-white px-6 py-5 hover:border-accent hover:shadow-sm transition-all"
    >
      <h3 className="font-serif text-2xl font-bold">
        {title}
        <span className="text-zh text-lg ml-3 font-normal text-ink-muted">{zh}</span>
      </h3>
      <p className="mt-2 text-ink">{desc}</p>
      <p className="text-zh text-ink-muted text-base">{descZh}</p>
    </button>
  );
}

function ScoreBar({ score }: { score: Score }) {
  const pct = score.attempted > 0 ? Math.round((100 * score.correct) / score.attempted) : 0;
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-ink/10 bg-paper-warm px-4 py-2.5 text-sm">
      <div>
        <span className="font-semibold">{score.correct}</span>
        <span className="text-ink-soft"> / {score.attempted}</span>
        {score.attempted > 0 && (
          <span className="text-ink-muted ml-2">({pct}%)</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-ink-muted">
          🔥 streak <span className="font-semibold text-ink">{score.streak}</span>
        </span>
        <span className="text-ink-muted">
          best <span className="font-semibold text-ink">{score.bestStreak}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Mode 1: Match the root ───────────────────────────────────────────────────

function RootMode({ words }: { words: FlatWord[] }) {
  const [score, setScore] = useState<Score>(() => loadScore("root"));
  const [seed, setSeed] = useState(0);

  const q = useMemo(() => {
    const target = words[Math.floor(Math.random() * words.length)];
    const distractors = pickRandom(
      words.filter((w) => w.etymology.root !== target.etymology.root),
      3,
    );
    const options = [...distractors, target]
      .map((w) => w.word)
      .sort(() => Math.random() - 0.5);
    return { target, options };
  }, [seed, words]);

  const [picked, setPicked] = useState<string | null>(null);

  function answer(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.target.word;
    const next: Score = {
      attempted: score.attempted + 1,
      correct: score.correct + (correct ? 1 : 0),
      streak: correct ? score.streak + 1 : 0,
      bestStreak: Math.max(score.bestStreak, correct ? score.streak + 1 : 0),
    };
    setScore(next);
    saveScore("root", next);
  }

  function next() {
    setPicked(null);
    setSeed((s) => s + 1);
  }

  const correct = picked === q.target.word;

  return (
    <div>
      <header className="mb-4">
        <h2 className="font-serif text-3xl font-bold">Match the root</h2>
        <div className="text-zh text-lg text-ink-muted">对上词根</div>
      </header>
      <ScoreBar score={score} />

      <div className="rounded-xl border border-ink/10 bg-white p-6 mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Etymology
        </div>
        <p className="text-lg leading-relaxed">{q.target.etymology.en}</p>
        <p className="text-zh text-base text-ink-muted mt-2">
          {q.target.etymology.zh}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {q.options.map((opt) => {
          const isRight = opt === q.target.word;
          const isPicked = opt === picked;
          let cls = "border-ink/15 bg-white hover:border-accent";
          if (picked) {
            if (isRight) cls = "border-green-600 bg-green-50 text-green-900";
            else if (isPicked) cls = "border-red-500 bg-red-50 text-red-900";
            else cls = "border-ink/10 bg-paper-warm text-ink-muted";
          }
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              disabled={!!picked}
              className={`rounded-lg border-2 px-5 py-3 text-left transition-all ${cls}`}
            >
              <span className="font-serif text-xl font-semibold">{opt}</span>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="rounded-xl border border-accent/30 bg-paper-warm p-5">
          <div className={`font-semibold mb-2 ${correct ? "text-green-700" : "text-red-700"}`}>
            {correct ? "✓ Correct" : `✗ The answer was “${q.target.word}”`}
          </div>
          <div className="text-base">
            <strong>{q.target.word}</strong>{" "}
            <span className="text-ink-muted">{q.target.chinese}</span>
          </div>
          <div className="text-sm text-ink-muted mt-1">{q.target.definition.en}</div>
          <Link
            to={`/lesson/${q.target.lessonId}`}
            className="inline-block mt-3 text-sm text-accent hover:underline"
          >
            Open the lesson →
          </Link>
          <div className="mt-4">
            <button
              onClick={next}
              className="rounded-lg bg-ink text-paper-warm px-5 py-2 font-semibold hover:bg-ink/80"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mode 2: Distinguish the twins ────────────────────────────────────────────

function TwinMode({ words }: { words: FlatWord[] }) {
  const [score, setScore] = useState<Score>(() => loadScore("twin"));
  const [seed, setSeed] = useState(0);

  // Pull words that have commonConfusions populated.
  const pool = useMemo(
    () => words.filter((w) => w.commonConfusions.length > 0),
    [words],
  );

  const q = useMemo(() => {
    const target = pool[Math.floor(Math.random() * pool.length)];
    // Build option set: target word + up to 3 of its confusions.
    // Confusions are often common-English words not in our corpus, which is fine —
    // they're the precise distractors the lesson said are most easily mixed up.
    const distractors = target.commonConfusions.slice(0, 3);
    const options = [target.word, ...distractors].sort(() => Math.random() - 0.5);
    return { target, options };
  }, [seed, pool]);

  const [picked, setPicked] = useState<string | null>(null);

  function answer(opt: string) {
    if (picked) return;
    setPicked(opt);
    const correct = opt === q.target.word;
    const next: Score = {
      attempted: score.attempted + 1,
      correct: score.correct + (correct ? 1 : 0),
      streak: correct ? score.streak + 1 : 0,
      bestStreak: Math.max(score.bestStreak, correct ? score.streak + 1 : 0),
    };
    setScore(next);
    saveScore("twin", next);
  }

  function next() {
    setPicked(null);
    setSeed((s) => s + 1);
  }

  const correct = picked === q.target.word;

  return (
    <div>
      <header className="mb-4">
        <h2 className="font-serif text-3xl font-bold">Distinguish the twins</h2>
        <div className="text-zh text-lg text-ink-muted">分辨近义词</div>
      </header>
      <ScoreBar score={score} />

      <div className="rounded-xl border border-ink/10 bg-white p-6 mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3">
          Definition
        </div>
        <p className="text-lg leading-relaxed">{q.target.definition.en}</p>
        <p className="text-zh text-base text-ink-muted mt-2">{q.target.definition.zh}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {q.options.map((opt) => {
          const isRight = opt === q.target.word;
          const isPicked = opt === picked;
          let cls = "border-ink/15 bg-white hover:border-accent";
          if (picked) {
            if (isRight) cls = "border-green-600 bg-green-50 text-green-900";
            else if (isPicked) cls = "border-red-500 bg-red-50 text-red-900";
            else cls = "border-ink/10 bg-paper-warm text-ink-muted";
          }
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              disabled={!!picked}
              className={`rounded-lg border-2 px-5 py-3 text-left transition-all ${cls}`}
            >
              <span className="font-serif text-xl font-semibold capitalize">{opt}</span>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="rounded-xl border border-accent/30 bg-paper-warm p-5">
          <div className={`font-semibold mb-2 ${correct ? "text-green-700" : "text-red-700"}`}>
            {correct ? "✓ Correct" : `✗ The answer was “${q.target.word}”`}
          </div>
          <div className="text-base">
            <strong>{q.target.word}</strong>{" "}
            <span className="text-ink-muted">{q.target.chinese}</span>
            <span className="ml-2 text-sm text-ink-soft">{q.target.phonetic}</span>
          </div>
          <Link
            to={`/lesson/${q.target.lessonId}`}
            className="inline-block mt-3 text-sm text-accent hover:underline"
          >
            Open the lesson →
          </Link>
          <div className="mt-4">
            <button
              onClick={next}
              className="rounded-lg bg-ink text-paper-warm px-5 py-2 font-semibold hover:bg-ink/80"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mode 3: Hear it, name it ────────────────────────────────────────────────

function AudioMode({ words }: { words: FlatWord[] }) {
  const [score, setScore] = useState<Score>(() => loadScore("audio"));
  const [seed, setSeed] = useState(0);

  const pool = useMemo(() => words.filter((w) => !!w.audio), [words]);

  const q = useMemo(() => {
    const target = pool[Math.floor(Math.random() * pool.length)];
    return { target };
  }, [seed, pool]);

  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setTyped("");
    setSubmitted(false);
    inputRef.current?.focus();
    // Autoplay the audio when a new question loads.
    setTimeout(() => audioRef.current?.play().catch(() => {}), 150);
  }, [seed]);

  function check() {
    if (submitted) return;
    const correct = typed.trim().toLowerCase() === q.target.word.toLowerCase();
    const next: Score = {
      attempted: score.attempted + 1,
      correct: score.correct + (correct ? 1 : 0),
      streak: correct ? score.streak + 1 : 0,
      bestStreak: Math.max(score.bestStreak, correct ? score.streak + 1 : 0),
    };
    setScore(next);
    saveScore("audio", next);
    setSubmitted(true);
  }

  function next() {
    setSeed((s) => s + 1);
  }

  function play() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  const correct = submitted && typed.trim().toLowerCase() === q.target.word.toLowerCase();
  const audioUrl = q.target.audio ? `/${q.target.audio}` : undefined;

  return (
    <div>
      <header className="mb-4">
        <h2 className="font-serif text-3xl font-bold">Hear it, name it</h2>
        <div className="text-zh text-lg text-ink-muted">听音辨词</div>
      </header>
      <ScoreBar score={score} />

      <div className="rounded-xl border border-ink/10 bg-white p-8 mb-4 text-center">
        <button
          onClick={play}
          className="rounded-full bg-accent text-paper-warm px-8 py-4 text-2xl font-semibold hover:opacity-90 active:scale-95 transition-all"
        >
          ▶ Play
        </button>
        <p className="text-sm text-ink-muted mt-3">Click as many times as you need.</p>
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!submitted) check();
          else next();
        }}
        className="mb-4"
      >
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={submitted}
          placeholder="Type the word…"
          className={`w-full rounded-lg border-2 px-5 py-3 text-xl focus:outline-none ${
            submitted
              ? correct
                ? "border-green-600 bg-green-50"
                : "border-red-500 bg-red-50"
              : "border-ink/20 bg-white focus:border-accent"
          }`}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="mt-3 rounded-lg bg-ink text-paper-warm px-5 py-2 font-semibold hover:bg-ink/80"
        >
          {submitted ? "Next →" : "Check"}
        </button>
      </form>

      {submitted && (
        <div className="rounded-xl border border-accent/30 bg-paper-warm p-5">
          <div className={`font-semibold mb-2 ${correct ? "text-green-700" : "text-red-700"}`}>
            {correct ? "✓ Correct" : `✗ The word was “${q.target.word}”`}
          </div>
          <div className="text-base">
            <strong>{q.target.word}</strong>{" "}
            <span className="text-ink-muted">{q.target.chinese}</span>
            <span className="ml-2 text-sm text-ink-soft">{q.target.phonetic}</span>
          </div>
          <div className="text-sm text-ink-muted mt-1">{q.target.definition.en}</div>
          <Link
            to={`/lesson/${q.target.lessonId}`}
            className="inline-block mt-3 text-sm text-accent hover:underline"
          >
            Open the lesson →
          </Link>
        </div>
      )}
    </div>
  );
}
