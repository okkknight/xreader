import type { PublicSegment } from "@/types/public-article";

const labels: Record<string, string> = { OPENING: "开场", ORIENTATION: "路线", ARTICLE_READ: "原文朗读", QUICK_EXPLANATION: "快速讲解", NORMAL_EXPLANATION: "讲解", DEEP_EXPLANATION: "深度讲解", EXPRESSION_NOTE: "表达观察", CONTEXT_CONNECTION: "逻辑连接", REPLAY: "重听", SECTION_SUMMARY: "小结", FINAL_WRAP: "最后回收" };

export function CurrentLessonPanel({ segments, activeSentenceId }: { segments: PublicSegment[]; activeSentenceId?: string }) {
  const activeSegment = segments.find((segment) => activeSentenceId && segment.sentenceIds.includes(activeSentenceId));
  return <aside className="current-lesson-panel" aria-label="当前讲解">
    <div className="current-lesson-meta"><span>当前讲解</span>{activeSegment ? <span>{labels[activeSegment.type] || activeSegment.type}</span> : null}</div>
    {activeSegment?.script ? <p>{activeSegment.script}</p> : <p className="current-lesson-placeholder">{activeSegment ? "正在播放原文。" : "选择一句开始听读。"}</p>}
  </aside>;
}
