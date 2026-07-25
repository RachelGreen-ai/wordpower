/**
 * src/compositions/VocabLesson.tsx — Bilingual vocabulary lesson video.
 *
 * Structure (92s @ 30fps = 2760 frames — tightened for short-form share):
 *   Hook      0-6s     Three silhouettes + headline
 *   Word 1    6-28s    Word 1: reveal → definition → etymology → 2 sentences
 *   Twist     28-37s   Word 1 vs Word 2 side-by-side
 *   Word 2    37-59s   Word 2
 *   Word 3    59-81s   Word 3
 *   Recap     81-92s   Three silhouettes + closing reflection
 *
 * Slot budgets (per word, sums to 22s): reveal 2 · def 5 · ety 6 · s1 4 · s2 5.
 * Every slot was tuned so the Kokoro narration ends within ~0.3s of the cut —
 * no dead tail, no audio clipping. If a lesson's narration overflows, tighten
 * the source text rather than growing the slot.
 *
 * Audio: per-slot .wav files referenced via `lesson.audio[slot]`, populated
 * by src/cli/generateVocabAudio.ts. Each Sequence layers its own <Audio>.
 *
 * Design notes:
 *   - English primary (large), Simplified Chinese secondary (muted, ~58% size)
 *   - PingFang SC in the font stack for clean Chinese rendering on macOS
 *   - Target vocab word highlighted in `captionYellow` inside each sentence
 *   - No film grain, no flashy effects — reflective tone, cuts are quick
 */
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { VocabLesson, VocabWord, Bilingual, Sentence as SentenceData } from "../../web/src/corpus-types/vocab";

// ============================================================================
// Constants
// ============================================================================

export const FPS = 30;
export const TOTAL_FRAMES = 92 * FPS; // 2760 — tightened from 111s for short-form share pacing

const SCENE_FRAMES = {
  hook: 6 * FPS, // ~5.5s of headline+subtext narration, tight tail
  word: 22 * FPS, // 2 reveal + 5 def + 6 ety + 4 s1 + 5 s2 — each cut just after Kokoro finishes
  twist: 9 * FPS, // 2 setup + 2 left + 2 right + 3 closing
  recap: 11 * FPS, // 3s intro (silhouettes) + 8s reflection audio, ends on last word
} as const;

const SCENE_STARTS = {
  hook: 0,
  word1: SCENE_FRAMES.hook,
  twist: SCENE_FRAMES.hook + SCENE_FRAMES.word,
  word2: SCENE_FRAMES.hook + SCENE_FRAMES.word + SCENE_FRAMES.twist,
  word3: SCENE_FRAMES.hook + 2 * SCENE_FRAMES.word + SCENE_FRAMES.twist,
  recap: SCENE_FRAMES.hook + 3 * SCENE_FRAMES.word + SCENE_FRAMES.twist,
} as const;

const PALETTE = {
  bg: "#0a0e1a",
  bgGradient1: "#0a0e1a",
  bgGradient2: "#181d2e",
  text: "#ffffff",
  textMuted: "#a8b0c4",
  highlight: "#FFEB3B",
  zhAccent: "#ffd166",
} as const;

const FONT = `"SF Pro Display", "PingFang SC", "Helvetica Neue", Inter, Arial, sans-serif`;

const SPRING_PUNCH = { damping: 7, stiffness: 200 } as const;
const SPRING_SOFT = { damping: 12, stiffness: 100 } as const;

// ============================================================================
// Main composition
// ============================================================================

export interface VocabLessonProps {
  lesson: VocabLesson;
}

export const VocabLessonComposition: React.FC<VocabLessonProps> = ({ lesson }) => {
  const audio = lesson.audio ?? {};

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${PALETTE.bgGradient1} 0%, ${PALETTE.bgGradient2} 100%)`,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* HOOK */}
      <Sequence from={SCENE_STARTS.hook} durationInFrames={SCENE_FRAMES.hook}>
        <Hook hook={lesson.hook} words={lesson.words} audioMap={audio} />
      </Sequence>

      {/* WORD 1 — Egoist */}
      <Sequence from={SCENE_STARTS.word1} durationInFrames={SCENE_FRAMES.word}>
        <WordSegment word={lesson.words[0]} slotPrefix="word.0" audioMap={audio} />
      </Sequence>

      {/* TWIST */}
      <Sequence from={SCENE_STARTS.twist} durationInFrames={SCENE_FRAMES.twist}>
        <TwistScene twist={lesson.twist} audioMap={audio} />
      </Sequence>

      {/* WORD 2 — Egotist */}
      <Sequence from={SCENE_STARTS.word2} durationInFrames={SCENE_FRAMES.word}>
        <WordSegment word={lesson.words[1]} slotPrefix="word.1" audioMap={audio} />
      </Sequence>

      {/* WORD 3 — Altruist */}
      <Sequence from={SCENE_STARTS.word3} durationInFrames={SCENE_FRAMES.word}>
        <WordSegment word={lesson.words[2]} slotPrefix="word.2" audioMap={audio} />
      </Sequence>

      {/* RECAP */}
      <Sequence from={SCENE_STARTS.recap} durationInFrames={SCENE_FRAMES.recap}>
        <Recap words={lesson.words} reflection={lesson.recap.reflection} audioMap={audio} />
      </Sequence>

      {/* Subtle vignette sits on top of everything */}
      <Vignette />
    </AbsoluteFill>
  );
};

// ============================================================================
// HOOK
// ============================================================================

const Hook: React.FC<{
  hook: VocabLesson["hook"];
  words: VocabWord[];
  audioMap: Record<string, string>;
}> = ({ hook, words, audioMap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Three silhouettes punch in one by one
  const sil1 = spring({ frame: frame - fps * 0.3, fps, config: SPRING_PUNCH });
  const sil2 = spring({ frame: frame - fps * 0.7, fps, config: SPRING_PUNCH });
  const sil3 = spring({ frame: frame - fps * 1.1, fps, config: SPRING_PUNCH });

  // Headline + subtext fade in to match the narration cadence:
  // headline narration spans ~0–3.5s; subtext narration spans ~3.5–6s
  const headlineOpacity = interpolate(frame, [fps * 0.6, fps * 1.1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtextOpacity = interpolate(frame, [fps * 3.4, fps * 3.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px" }}>
      {audioMap["hook.headline"] && <Audio src={staticFile(audioMap["hook.headline"])} />}

      {/* Silhouettes row */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 80,
        }}
      >
        <Silhouette pose={words[0].silhouette} tint={words[0].tint} scale={sil1} />
        <Silhouette pose={words[1].silhouette} tint={words[1].tint} scale={sil2} />
        <Silhouette pose={words[2].silhouette} tint={words[2].tint} scale={sil3} />
      </div>

      {/* Headline + subtext */}
      <div
        style={{
          position: "absolute",
          bottom: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <BilingualLine
          bilingual={hook.headline}
          enSize={84}
          zhSize={48}
          enWeight={900}
          opacity={headlineOpacity}
          maxWidth={960}
        />
        <div style={{ marginTop: 50, opacity: subtextOpacity }}>
          <BilingualLine
            bilingual={hook.subtext}
            enSize={56}
            zhSize={36}
            enWeight={500}
            enColor={PALETTE.zhAccent}
            zhColor={PALETTE.textMuted}
            maxWidth={900}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// WORD SEGMENT
// ============================================================================

const WordSegment: React.FC<{
  word: VocabWord;
  slotPrefix: string;
  audioMap: Record<string, string>;
}> = ({ word, slotPrefix, audioMap }) => {
  const { fps } = useVideoConfig();

  // Internal sub-sequence timings (in frames, relative to segment start)
  // Reveal 0-3s | Definition 3-8s | Etymology 8-15s (7s) | Sentence 1 15-20s | Sentence 2 20-26s
  const T = {
    reveal: { from: 0, dur: 2 * fps },
    def: { from: 2 * fps, dur: 5 * fps },
    ety: { from: 7 * fps, dur: 6 * fps },
    s1: { from: 13 * fps, dur: 4 * fps },
    s2: { from: 17 * fps, dur: 5 * fps },
  } as const;

  return (
    <AbsoluteFill>
      <Sequence from={T.reveal.from} durationInFrames={T.reveal.dur}>
        <WordReveal word={word} audioPath={audioMap[`${slotPrefix}.pronunciation`]} />
      </Sequence>

      <Sequence from={T.def.from} durationInFrames={T.def.dur}>
        <CenteredBilingual
          bilingual={word.definition}
          enSize={64}
          zhSize={40}
          enWeight={700}
          maxWidth={960}
          audioPath={audioMap[`${slotPrefix}.definition`]}
        />
      </Sequence>

      <Sequence from={T.ety.from} durationInFrames={T.ety.dur}>
        <EtymologyBite word={word} audioPath={audioMap[`${slotPrefix}.etymology`]} />
      </Sequence>

      <Sequence from={T.s1.from} durationInFrames={T.s1.dur}>
        <SentenceScene
          sentence={word.sentences[0]}
          targetWord={word.word}
          contextLabel={word.sentences[0].context}
          audioPath={audioMap[`${slotPrefix}.sentence.0`]}
          sceneDuration={T.s1.dur}
        />
      </Sequence>

      <Sequence from={T.s2.from} durationInFrames={T.s2.dur}>
        <SentenceScene
          sentence={word.sentences[1]}
          targetWord={word.word}
          contextLabel={word.sentences[1].context}
          audioPath={audioMap[`${slotPrefix}.sentence.1`]}
          sceneDuration={T.s2.dur}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

const WordReveal: React.FC<{ word: VocabWord; audioPath?: string }> = ({ word, audioPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordPunch = spring({ frame, fps, config: SPRING_PUNCH });
  const phoneticOpacity = interpolate(frame, [fps * 0.4, fps * 0.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chineseOpacity = interpolate(frame, [fps * 1.0, fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle valence tint as a soft radial glow behind the word
  const tint = `#${word.tint}`;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      {audioPath && <Audio src={staticFile(audioPath)} />}

      {/* Tint glow */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${tint}33 0%, ${tint}00 60%)`,
          filter: "blur(40px)",
          opacity: wordPunch * 0.8,
        }}
      />

      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          color: PALETTE.text,
          letterSpacing: -4,
          transform: `scale(${0.7 + wordPunch * 0.3})`,
          opacity: wordPunch,
          textShadow: `0 0 60px ${tint}aa, 0 4px 30px rgba(0,0,0,0.7)`,
        }}
      >
        {word.word}
      </div>

      <div
        style={{
          marginTop: 30,
          fontSize: 60,
          fontWeight: 500,
          color: PALETTE.textMuted,
          letterSpacing: 4,
          opacity: phoneticOpacity,
        }}
      >
        {word.phonetic}
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 64,
          fontWeight: 700,
          color: PALETTE.zhAccent,
          opacity: chineseOpacity,
        }}
      >
        {word.chinese}
      </div>
    </AbsoluteFill>
  );
};

const EtymologyBite: React.FC<{ word: VocabWord; audioPath?: string }> = ({ word, audioPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px" }}>
      {audioPath && <Audio src={staticFile(audioPath)} />}

      <div
        style={{
          opacity,
          padding: "20px 40px",
          border: `2px solid ${PALETTE.zhAccent}66`,
          borderRadius: 16,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        <div style={{ fontSize: 32, letterSpacing: 8, color: PALETTE.zhAccent, marginBottom: 16 }}>
          ETYMOLOGY · 词源
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: PALETTE.text, lineHeight: 1.3 }}>
          <span style={{ color: PALETTE.highlight }}>{word.etymology.root}</span>
          <span style={{ color: PALETTE.textMuted, fontSize: 40 }}> = </span>
          <span>"{word.etymology.meaning}"</span>
        </div>
        <div style={{ fontSize: 38, color: PALETTE.textMuted, marginTop: 18 }}>
          {word.etymology.zh}
        </div>
        {word.etymology.relatives.length > 0 && (
          <div
            style={{
              marginTop: 28,
              display: "flex",
              justifyContent: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            {word.etymology.relatives.map((r) => (
              <div key={r.word} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: PALETTE.text }}>{r.word}</div>
                <div style={{ fontSize: 26, color: PALETTE.textMuted, marginTop: 4 }}>{r.zh}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const SentenceScene: React.FC<{
  sentence: SentenceData;
  targetWord: string;
  contextLabel: string;
  audioPath?: string;
  sceneDuration: number; // frames — used to compute fade-out
}> = ({ sentence, targetWord, contextLabel, audioPath, sceneDuration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fade in at start, fade out in the last ~0.6s so the cut to next scene breathes.
  const fadeOutStart = sceneDuration - Math.floor(fps * 0.6);
  const fadeOutEnd = sceneDuration;

  const enOpacityIn = interpolate(frame, [0, fps * 0.4], [0, 1], { extrapolateRight: "clamp" });
  const enOpacityOut = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const enOpacity = Math.min(enOpacityIn, enOpacityOut);

  const zhOpacityIn = interpolate(frame, [fps * 0.5, fps * 0.9], [0, 1], { extrapolateRight: "clamp" });
  const zhOpacity = Math.min(zhOpacityIn, enOpacityOut);

  const labelOpacityIn = interpolate(frame, [0, fps * 0.3], [0, 1], { extrapolateRight: "clamp" });
  const labelOpacity = Math.min(labelOpacityIn, enOpacityOut);

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center", padding: "0 70px", flexDirection: "column" }}
    >
      {audioPath && <Audio src={staticFile(audioPath)} />}

      <div
        style={{
          position: "absolute",
          top: 240,
          opacity: labelOpacity,
          fontSize: 30,
          letterSpacing: 10,
          color: PALETTE.zhAccent,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {contextLabel}
      </div>

      <div style={{ maxWidth: 960, textAlign: "center" }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: PALETTE.text,
            lineHeight: 1.32,
            opacity: enOpacity,
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          }}
        >
          <HighlightedSentence text={sentence.en} target={targetWord} />
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            fontWeight: 500,
            color: PALETTE.textMuted,
            lineHeight: 1.4,
            opacity: zhOpacity,
          }}
        >
          {sentence.zh}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Splits a sentence, finds the target word (case-insensitive, allow plural/adjective forms),
 *  and renders it highlighted with a slight scale pop on first render. */
const HighlightedSentence: React.FC<{ text: string; target: string }> = ({ text, target }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - fps * 0.4, fps, config: SPRING_PUNCH });

  // Match the target stem (e.g. "egoist" matches "egoist" and "egoists").
  // Case-insensitive, word boundary.
  const stem = target.toLowerCase();
  const re = new RegExp(`\\b(${stem}\\w*)\\b`, "gi");
  const parts = text.split(re);

  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase().startsWith(stem)) {
          return (
            <span
              key={i}
              style={{
                color: PALETTE.highlight,
                fontWeight: 900,
                display: "inline-block",
                transform: `scale(${0.9 + pop * 0.15})`,
                textShadow: `0 0 24px ${PALETTE.highlight}88`,
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

// ============================================================================
// TWIST SCENE
// ============================================================================

const TwistScene: React.FC<{
  twist: VocabLesson["twist"];
  audioMap: Record<string, string>;
}> = ({ twist, audioMap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 12s scene. Audio cues: setup 0-2.5s, left 2.5-5s, right 5-7.5s, closing 7.5-12s.
  const setupOpacity = interpolate(frame, [0, fps * 0.6], [0, 1], { extrapolateRight: "clamp" });
  const leftPunch = spring({ frame: frame - fps * 2, fps, config: SPRING_PUNCH });
  const rightPunch = spring({ frame: frame - fps * 4, fps, config: SPRING_PUNCH });
  const closingOpacity = interpolate(frame, [fps * 6, fps * 6.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ padding: "0 60px" }}>
      {audioMap["twist.setup"] && (
        <Sequence durationInFrames={fps * 2} layout="none">
          <Audio src={staticFile(audioMap["twist.setup"])} />
        </Sequence>
      )}
      {audioMap["twist.left"] && (
        <Sequence from={fps * 2} durationInFrames={fps * 2} layout="none">
          <Audio src={staticFile(audioMap["twist.left"])} />
        </Sequence>
      )}
      {audioMap["twist.right"] && (
        <Sequence from={fps * 4} durationInFrames={fps * 2} layout="none">
          <Audio src={staticFile(audioMap["twist.right"])} />
        </Sequence>
      )}
      {audioMap["twist.closing"] && (
        <Sequence from={fps * 6} durationInFrames={fps * 3} layout="none">
          <Audio src={staticFile(audioMap["twist.closing"])} />
        </Sequence>
      )}

      {/* Setup line, top */}
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: setupOpacity,
        }}
      >
        <BilingualLine
          bilingual={twist.setup}
          enSize={58}
          zhSize={38}
          enWeight={800}
          maxWidth={960}
        />
      </div>

      {/* Two columns */}
      <div
        style={{
          position: "absolute",
          top: 600,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
          padding: "0 40px",
        }}
      >
        <TwistColumn
          label={twist.leftLabel}
          line={twist.leftLine}
          mnemonic={twist.leftMnemonic}
          tint="#e8a76a"
          opacity={leftPunch}
          scale={0.85 + leftPunch * 0.15}
        />
        <div style={{ paddingTop: 80, fontSize: 60, color: PALETTE.textMuted, opacity: Math.min(leftPunch, rightPunch) }}>
          vs
        </div>
        <TwistColumn
          label={twist.rightLabel}
          line={twist.rightLine}
          mnemonic={twist.rightMnemonic}
          tint="#e06464"
          opacity={rightPunch}
          scale={0.85 + rightPunch * 0.15}
        />
      </div>

      {/* Closing line — the pivot */}
      <div
        style={{
          position: "absolute",
          bottom: 240,
          left: 60,
          right: 60,
          textAlign: "center",
          opacity: closingOpacity,
        }}
      >
        <BilingualLine
          bilingual={twist.closing}
          enSize={56}
          zhSize={40}
          enWeight={800}
          enColor={PALETTE.highlight}
          maxWidth={960}
        />
      </div>
    </AbsoluteFill>
  );
};

const TwistColumn: React.FC<{
  label: string;
  line: Bilingual;
  mnemonic: Bilingual;
  tint: string;
  opacity: number;
  scale: number;
}> = ({ label, line, mnemonic, tint, opacity, scale }) => (
  <div
    style={{
      flex: 1,
      maxWidth: 420,
      padding: "30px 24px",
      borderRadius: 18,
      background: `${tint}22`,
      border: `2px solid ${tint}66`,
      opacity,
      transform: `scale(${scale})`,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 44, fontWeight: 900, color: tint, marginBottom: 12 }}>{label}</div>
    <div style={{ fontSize: 38, fontWeight: 700, color: PALETTE.text, lineHeight: 1.3 }}>
      {line.en}
    </div>
    <div style={{ fontSize: 28, color: PALETTE.textMuted, marginTop: 6 }}>{line.zh}</div>
    <div
      style={{
        marginTop: 22,
        paddingTop: 16,
        borderTop: `1px solid ${tint}44`,
        fontSize: 26,
        color: PALETTE.textMuted,
        lineHeight: 1.4,
      }}
    >
      <div style={{ color: tint, fontWeight: 700 }}>{mnemonic.en}</div>
      <div style={{ marginTop: 4 }}>{mnemonic.zh}</div>
    </div>
  </div>
);

// ============================================================================
// RECAP
// ============================================================================

const Recap: React.FC<{
  words: VocabWord[];
  reflection: Bilingual;
  audioMap: Record<string, string>;
}> = ({ words, reflection, audioMap }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sil1 = spring({ frame: frame - fps * 0.2, fps, config: SPRING_PUNCH });
  const sil2 = spring({ frame: frame - fps * 0.5, fps, config: SPRING_PUNCH });
  const sil3 = spring({ frame: frame - fps * 0.8, fps, config: SPRING_PUNCH });

  const reflectionOpacity = interpolate(frame, [fps * 3.0, fps * 4.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 280 }}>
      {audioMap["recap.reflection"] && (
        <Sequence from={Math.floor(fps * 3.0)} durationInFrames={fps * 8} layout="none">
          <Audio src={staticFile(audioMap["recap.reflection"])} />
        </Sequence>
      )}

      {/* Three columns with silhouette + word + archetype */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 60,
        }}
      >
        {words.map((w, i) => {
          const s = [sil1, sil2, sil3][i];
          return (
            <div key={w.word} style={{ textAlign: "center", opacity: s }}>
              <Silhouette pose={w.silhouette} tint={w.tint} scale={s} size={260} />
              <div
                style={{
                  marginTop: 24,
                  fontSize: 44,
                  fontWeight: 900,
                  color: PALETTE.text,
                  letterSpacing: -1,
                }}
              >
                {w.word}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 38,
                  fontWeight: 700,
                  color: `#${w.tint}`,
                }}
              >
                {w.archetypeZh}
              </div>
            </div>
          );
        })}
      </div>

      {/* Closing reflection */}
      <div
        style={{
          marginTop: 100,
          padding: "0 60px",
          textAlign: "center",
          opacity: reflectionOpacity,
        }}
      >
        <BilingualLine
          bilingual={reflection}
          enSize={56}
          zhSize={38}
          enWeight={700}
          enColor={PALETTE.highlight}
          maxWidth={960}
        />
      </div>
    </AbsoluteFill>
  );
};

// ============================================================================
// Shared components
// ============================================================================

const BilingualLine: React.FC<{
  bilingual: Bilingual;
  enSize: number;
  zhSize: number;
  enWeight?: number;
  enColor?: string;
  zhColor?: string;
  maxWidth?: number;
  opacity?: number;
}> = ({
  bilingual,
  enSize,
  zhSize,
  enWeight = 700,
  enColor = PALETTE.text,
  zhColor = PALETTE.textMuted,
  maxWidth = 960,
  opacity = 1,
}) => (
  <div style={{ opacity, maxWidth, margin: "0 auto", textAlign: "center" }}>
    <div
      style={{
        fontSize: enSize,
        fontWeight: enWeight,
        color: enColor,
        lineHeight: 1.25,
        letterSpacing: -1,
      }}
    >
      {bilingual.en}
    </div>
    <div
      style={{
        marginTop: 18,
        fontSize: zhSize,
        fontWeight: 500,
        color: zhColor,
        lineHeight: 1.4,
      }}
    >
      {bilingual.zh}
    </div>
  </div>
);

const CenteredBilingual: React.FC<{
  bilingual: Bilingual;
  enSize: number;
  zhSize: number;
  enWeight?: number;
  maxWidth?: number;
  audioPath?: string;
}> = ({ bilingual, enSize, zhSize, enWeight, maxWidth, audioPath }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 70px" }}>
      {audioPath && <Audio src={staticFile(audioPath)} />}
      <BilingualLine
        bilingual={bilingual}
        enSize={enSize}
        zhSize={zhSize}
        enWeight={enWeight}
        maxWidth={maxWidth}
        opacity={opacity}
      />
    </AbsoluteFill>
  );
};

// ============================================================================
// Silhouette — inline SVG pictograms
// ============================================================================

const Silhouette: React.FC<{
  pose: "stuck" | "performing" | "walking";
  tint: string;
  scale?: number;
  size?: number;
}> = ({ pose, tint, scale = 1, size = 320 }) => {
  const color = `#${tint}`;
  return (
    <svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 100 160"
      style={{ transform: `scale(${0.7 + scale * 0.3})`, opacity: scale, filter: `drop-shadow(0 8px 20px ${color}66)` }}
    >
      {pose === "stuck" && <StuckPose color={color} />}
      {pose === "performing" && <PerformingPose color={color} />}
      {pose === "walking" && <WalkingPose color={color} />}
    </svg>
  );
};

const StuckPose: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* Two diverging doors / arrows on either side */}
    <rect x="6" y="50" width="14" height="60" fill={`${color}44`} rx="2" />
    <rect x="80" y="50" width="14" height="60" fill={`${color}44`} rx="2" />
    {/* Question-mark hover above head */}
    <text x="50" y="22" fontSize="22" fontWeight="900" textAnchor="middle" fill={color}>
      ?
    </text>
    {/* Head */}
    <circle cx="50" cy="44" r="11" fill={color} />
    {/* Body — slightly turned to suggest hesitation */}
    <path
      d="M50 56 Q44 70 42 86 L40 130 L46 130 L50 96 L54 130 L60 130 L58 86 Q56 70 50 56 Z"
      fill={color}
    />
    {/* Two short arrows pointing inward toward the figure */}
    <path d="M22 80 L36 80 L33 76 M36 80 L33 84" stroke={color} strokeWidth="2" fill="none" />
    <path d="M78 80 L64 80 L67 76 M64 80 L67 84" stroke={color} strokeWidth="2" fill="none" />
  </g>
);

const PerformingPose: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* Spotlight cone from top */}
    <path d="M50 0 L20 50 L80 50 Z" fill={`${color}22`} />
    <path d="M50 0 L28 40 L72 40 Z" fill={`${color}44`} />
    {/* Head */}
    <circle cx="50" cy="50" r="11" fill={color} />
    {/* Body with arms raised */}
    <path
      d="M50 62 L40 76 L26 70 L24 74 L40 84 L46 80 L46 130 L52 130 L52 80 L58 84 L74 74 L72 70 L58 76 L50 62 Z"
      fill={color}
    />
    {/* Megaphone bursts around head */}
    <circle cx="22" cy="40" r="2" fill={color} />
    <circle cx="78" cy="40" r="2" fill={color} />
    <circle cx="30" cy="28" r="1.5" fill={color} />
    <circle cx="70" cy="28" r="1.5" fill={color} />
  </g>
);

const WalkingPose: React.FC<{ color: string }> = ({ color }) => (
  <g>
    {/* Horizon path */}
    <line x1="0" y1="140" x2="100" y2="140" stroke={`${color}66`} strokeWidth="2" strokeDasharray="3 3" />
    {/* Arrow forward */}
    <path d="M70 134 L86 134 L82 130 M86 134 L82 138" stroke={color} strokeWidth="2" fill="none" />
    {/* Head */}
    <circle cx="46" cy="44" r="11" fill={color} />
    {/* Body striding forward */}
    <path
      d="M46 56 L38 70 L42 90 L36 122 L42 122 L48 96 L52 122 L60 122 L56 88 L54 70 L46 56 Z"
      fill={color}
    />
    {/* Slight forward lean — front arm */}
    <path d="M52 70 L64 80 L62 84 L48 76 Z" fill={color} />
  </g>
);

// ============================================================================
// Vignette overlay
// ============================================================================

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)",
      pointerEvents: "none",
    }}
  />
);
