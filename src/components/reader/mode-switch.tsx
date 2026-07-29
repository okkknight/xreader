"use client";

type Props = { mode: "GUIDED" | "READING"; onChange: (mode: "GUIDED" | "READING") => void; className?: string };

export function ModeSwitch({ mode, onChange, className }: Props) {
  const selectMode = (nextMode: "GUIDED" | "READING") => {
    if (nextMode !== mode) onChange(nextMode);
  };

  return <div className={`mode-switch${className ? ` ${className}` : ""}`} aria-label="阅读模式">
    <button className={mode === "GUIDED" ? "is-selected" : ""} type="button" aria-pressed={mode === "GUIDED"} onClick={() => selectMode("GUIDED")}>讲解</button>
    <button className={mode === "READING" ? "is-selected" : ""} type="button" aria-pressed={mode === "READING"} onClick={() => selectMode("READING")}>阅读</button>
  </div>;
}
