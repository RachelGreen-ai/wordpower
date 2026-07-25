import type { ReactNode } from "react";

interface Props {
  en: ReactNode;
  zh: ReactNode;
  enClass?: string;
  zhClass?: string;
  align?: "left" | "center";
}

export function BilingualLine({ en, zh, enClass = "", zhClass = "", align = "left" }: Props) {
  const alignClass = align === "center" ? "text-center" : "text-left";
  return (
    <div className={alignClass}>
      <div className={`text-ink ${enClass}`}>{en}</div>
      <div className={`text-zh mt-1.5 ${zhClass}`}>{zh}</div>
    </div>
  );
}
