"use client";

import { useState } from "react";
import type { CourseImport } from "@/types/article";
import { ArticleForm } from "./article-form";
import { SentenceEditor } from "./sentence-editor";
import { SegmentEditor } from "./segment-editor";
import { SourceEditor } from "./source-editor";
import { QaPanel } from "./qa-panel";
import { PublishPanel } from "./publish-panel";
import { GenerationPanel } from "./generation-panel";
import { AudioPanel } from "./audio-panel";

const tabs = ["文章", "句子", "教学设计", "来源", "生成", "音频", "QA/发布"] as const;
type Tab = (typeof tabs)[number];

export function EditorTabs({ initialDraft, audioSegments }: { initialDraft: CourseImport; audioSegments: Array<{ id: string; order: number; audioStatus: string; audioPath?: string | null }> }) {
  const [tab, setTab] = useState<Tab>("文章");
  const [draft, setDraft] = useState(initialDraft);
  return <section className="admin-editor"><nav aria-label="编辑面板">{tabs.map((item) => <button key={item} type="button" className={tab === item ? "is-active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>{tab === "文章" ? <ArticleForm draft={draft} onChange={setDraft} /> : null}{tab === "句子" ? <SentenceEditor draft={draft} onChange={setDraft} /> : null}{tab === "教学设计" ? <SegmentEditor draft={draft} onChange={setDraft} /> : null}{tab === "来源" ? <SourceEditor articleId={draft.article.id} /> : null}{tab === "生成" ? <GenerationPanel articleId={draft.article.id} /> : null}{tab === "音频" ? <AudioPanel articleId={draft.article.id} segments={audioSegments} /> : null}{tab === "QA/发布" ? <><QaPanel articleId={draft.article.id} /><PublishPanel articleId={draft.article.id} /></> : null}</section>;
}
