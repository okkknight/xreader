"use client";

type Props = { mode: "GUIDED" | "READING"; onChange: (mode: "GUIDED" | "READING") => void };

export function ModeSwitch({ mode, onChange }: Props) {
  return <div className="mode-switch" aria-label="阅读模式">
    <button className={mode === "GUIDED" ? "is-selected" : ""} type="button" onClick={() => onChange("GUIDED")}>开始讲解</button>
    <button className={mode === "READING" ? "is-selected" : ""} type="button" onClick={() => onChange("READING")}>阅读模式</button>
  </div>;
}
