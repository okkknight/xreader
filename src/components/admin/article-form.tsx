"use client";

import { useState } from "react";
import type { CourseImport } from "@/types/article";

export function ArticleForm({ draft, onChange }: { draft: CourseImport; onChange: (draft: CourseImport) => void }) {
  const [saving, setSaving] = useState(false); const [notice, setNotice] = useState<string>();
  const change = (field: "titleEn" | "titleZh" | "dekZh" | "topic" | "difficulty", value: string) => onChange({ ...draft, article: { ...draft.article, [field]: value } });
  async function save() { setSaving(true); setNotice(undefined); const response = await fetch(`/api/admin/articles/${draft.article.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) }); setSaving(false); setNotice(response.ok ? "已保存" : (await response.json() as { error?: string }).error || "保存失败"); }
  return <div className="admin-panel"><h2>文章</h2><label>英文标题<input value={draft.article.titleEn} onChange={(event) => change("titleEn", event.target.value)} /></label><label>中文标题<input value={draft.article.titleZh} onChange={(event) => change("titleZh", event.target.value)} /></label><label>导语<textarea value={draft.article.dekZh || ""} onChange={(event) => change("dekZh", event.target.value)} /></label><label>主题<input value={draft.article.topic} onChange={(event) => change("topic", event.target.value)} /></label><label>难度<input value={draft.article.difficulty} onChange={(event) => change("difficulty", event.target.value)} /></label><button type="button" onClick={save} disabled={saving}>{saving ? "保存中…" : "保存草稿"}</button>{notice ? <p role="status">{notice}</p> : null}</div>;
}
