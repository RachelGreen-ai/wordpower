import { useRef, useState } from "react";

interface Props {
  src: string | undefined;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * A small play button for a single audio file. Resolves the wav URL via the
 * site's public/audio symlink. Falls back to a disabled state if `src` is missing.
 */
export function AudioButton({ src, label = "play", className = "", size = "sm" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  if (!src) {
    return (
      <button
        className={`inline-flex items-center gap-1 rounded-full border border-dashed border-ink-soft/40 px-2 py-0.5 text-xs text-ink-soft cursor-not-allowed ${className}`}
        disabled
        title="audio not generated"
      >
        ♪ —
      </button>
    );
  }

  const url = `/${src}`; // src is like "audio/vocab/<id>/<slot>.wav" — served from site/public via symlink
  const sizeClasses =
    size === "md"
      ? "h-9 px-3 text-sm gap-2"
      : "h-7 px-2.5 text-xs gap-1.5";

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      // Stop any other playing audios first
      document.querySelectorAll("audio").forEach((a) => {
        if (a !== el) a.pause();
      });
      el.currentTime = 0;
      void el.play();
    } else {
      el.pause();
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        className={`inline-flex items-center rounded-full border border-accent/40 bg-paper-warm text-ink hover:bg-accent/20 hover:border-accent transition-colors ${sizeClasses} ${className}`}
        title={playing ? "Pause" : "Play"}
      >
        <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
        <span>{label}</span>
      </button>
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </>
  );
}
