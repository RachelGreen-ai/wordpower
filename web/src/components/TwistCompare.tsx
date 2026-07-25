/**
 * TwistCompare — renders the lesson's twist scene as a permanent compare card.
 * Side-by-side: word 1 vs word 2, with mnemonics and the closing pivot line.
 */
import type { VocabLesson, VocabWord } from "../corpus-types/vocab";
import { BilingualLine } from "./BilingualLine";
import { AudioButton } from "./AudioButton";

interface Props {
  twist: VocabLesson["twist"];
  word1: VocabWord;
  word2: VocabWord;
  audio: Record<string, string>;
}

export function TwistCompare({ twist, word1, word2, audio }: Props) {
  return (
    <section className="rounded-2xl border border-ink/10 bg-paper-warm p-8">
      <div className="text-xs uppercase tracking-[0.2em] text-ink-soft font-semibold mb-3 text-center">
        The Twist · 转折
      </div>
      <BilingualLine
        en={<span className="font-serif text-2xl font-semibold">{twist.setup.en}</span>}
        zh={<span className="text-base">{twist.setup.zh}</span>}
        align="center"
      />
      <div className="mt-3 flex justify-center">
        <AudioButton src={audio["twist.setup"]} label="hear" />
      </div>

      <div className="mt-7 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-stretch">
        <ColumnCard
          label={twist.leftLabel}
          word={word1}
          line={twist.leftLine}
          mnemonic={twist.leftMnemonic}
          tint={`#${word1.tint}`}
          audioSrc={audio["twist.left"]}
        />
        <div className="hidden md:flex items-center justify-center text-ink-soft font-serif text-2xl">vs</div>
        <ColumnCard
          label={twist.rightLabel}
          word={word2}
          line={twist.rightLine}
          mnemonic={twist.rightMnemonic}
          tint={`#${word2.tint}`}
          audioSrc={audio["twist.right"]}
        />
      </div>

      <div className="mt-8 pt-6 border-t border-ink/10 text-center">
        <BilingualLine
          en={
            <span className="font-serif text-xl font-bold" style={{ color: "var(--color-accent)" }}>
              {twist.closing.en}
            </span>
          }
          zh={<span className="text-base">{twist.closing.zh}</span>}
          align="center"
        />
        <div className="mt-3 flex justify-center">
          <AudioButton src={audio["twist.closing"]} label="hear the pivot" />
        </div>
      </div>
    </section>
  );
}

function ColumnCard({
  label,
  word,
  line,
  mnemonic,
  tint,
  audioSrc,
}: {
  label: string;
  word: VocabWord;
  line: { en: string; zh: string };
  mnemonic: { en: string; zh: string };
  tint: string;
  audioSrc: string | undefined;
}) {
  return (
    <div
      className="rounded-xl bg-white p-5 border-2 flex flex-col"
      style={{ borderColor: `${tint}66` }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="font-serif text-2xl font-bold" style={{ color: tint }}>
            {label}
          </div>
          <div className="text-zh text-sm">{word.chinese}</div>
        </div>
        <AudioButton src={audioSrc} label="hear" />
      </div>
      <div className="flex-1">
        <BilingualLine
          en={<span className="text-lg font-semibold">{line.en}</span>}
          zh={<span className="text-sm">{line.zh}</span>}
        />
        <div className="mt-4 pt-4 border-t border-ink/5">
          <BilingualLine
            en={<span className="text-sm font-medium" style={{ color: tint }}>{mnemonic.en}</span>}
            zh={<span className="text-xs">{mnemonic.zh}</span>}
          />
        </div>
      </div>
    </div>
  );
}
