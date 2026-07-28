"use client";

import type { CourseImport } from "@/types/article";

export function SegmentEditor({ draft, onChange }: { draft: CourseImport; onChange: (draft: CourseImport) => void }) {
  const move = (index: number, delta: number) => { const target = index + delta; if (target < 0 || target >= draft.lessonSegments.length) return; const lessonSegments = [...draft.lessonSegments]; [lessonSegments[index], lessonSegments[target]] = [lessonSegments[target], lessonSegments[index]]; lessonSegments.forEach((segment, order) => { segment.order = order + 1; }); onChange({ ...draft, lessonSegments }); };
  return <div className="admin-panel"><h2>教学设计</h2>{draft.lessonSegments.map((segment, index) => <article key={segment.id}><strong>{segment.order}. {segment.type}</strong><p>{segment.sentenceIds.join(", ") || "无句子映射"}</p><textarea value={segment.script || ""} placeholder="教师讲解稿" onChange={(event) => { const lessonSegments = structuredClone(draft.lessonSegments); lessonSegments[index].script = event.target.value || undefined; onChange({ ...draft, lessonSegments }); }} /><button type="button" onClick={() => move(index, -1)}>上移</button><button type="button" onClick={() => move(index, 1)}>下移</button></article>)}</div>;
}
