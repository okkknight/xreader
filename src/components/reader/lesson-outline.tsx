"use client";

import { useState } from "react";
import type { PublicSegment } from "@/types/public-article";

const labels: Record<string, string> = { OPENING: "开场", ORIENTATION: "路线", ARTICLE_READ: "原文朗读", QUICK_EXPLANATION: "快速讲解", NORMAL_EXPLANATION: "讲解", DEEP_EXPLANATION: "深度讲解", EXPRESSION_NOTE: "表达观察", CONTEXT_CONNECTION: "逻辑连接", REPLAY: "重听", SECTION_SUMMARY: "小结", FINAL_WRAP: "最后回收" };

type Props = { segments: PublicSegment[]; activeSentenceId?: string; onSelect: (sentenceId: string) => void };

export function LessonOutline({ segments, activeSentenceId, onSelect }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSegment = segments.find((segment) => activeSentenceId && segment.sentenceIds.includes(activeSentenceId));
  const content = <div className="lesson-outline-list">{segments.map((segment) => {
    const current = Boolean(activeSentenceId && segment.sentenceIds.includes(activeSentenceId));
    return <div className={`lesson-outline-item${current ? " is-current" : ""}`} key={segment.id}>
      <button type="button" onClick={() => segment.sentenceIds[0] && onSelect(segment.sentenceIds[0])} aria-current={current ? "step" : undefined}><span className="lesson-outline-order">{String(segment.order).padStart(2, "0")}</span><span><strong>{labels[segment.type] || segment.type}</strong><small>{segment.type.replaceAll("_", " ")}</small></span></button>
    </div>;
  })}</div>;
  return <aside className={`lesson-outline${mobileOpen ? " is-open" : ""}`} aria-label="课程路线">
    <button className="lesson-outline-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen}><span>课程路线</span><span>{mobileOpen ? "收起" : "展开"}</span></button>
    <div className="lesson-outline-desktop"><div className="lesson-outline-heading"><span>课程路线</span><span>{segments.length} 段</span></div>{content}{activeSegment?.script ? <div className="lesson-detail"><span>当前讲解</span><p>{activeSegment.script}</p></div> : null}</div>
    <div className="lesson-outline-mobile">{content}{activeSegment?.script ? <div className="lesson-detail"><span>当前讲解</span><p>{activeSegment.script}</p></div> : null}</div>
  </aside>;
}
