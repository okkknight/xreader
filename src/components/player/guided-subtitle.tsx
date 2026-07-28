export function GuidedSubtitle({ text }: { text?: string }) {
  return <p className="guided-subtitle" aria-live="polite">{text || "选择一句开始你的阅读"}</p>;
}
