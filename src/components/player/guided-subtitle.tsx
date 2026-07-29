import type { CourseSubtitleCue } from "@/lib/course-blocks/types";

export function GuidedSubtitle({ cue, paused = false }: { cue?: CourseSubtitleCue; paused?: boolean }) {
  if (!cue) return null;
  return <div className="guided-subtitle" aria-label="教学字幕" aria-live="polite" aria-atomic="true" data-paused={paused ? "true" : undefined}>
    <p key={cue.id} className="guided-subtitle-line" data-language={cue.language}>{cue.text}</p>
  </div>;
}
