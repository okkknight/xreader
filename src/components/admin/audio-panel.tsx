"use client";

import { useState } from "react";

export function AudioPanel({ articleId, segments }: { articleId: string; segments: Array<{ id: string; order: number; audioStatus: string; audioPath?: string | null }> }) {
  const [notice, setNotice] = useState<string>();
  async function generate(segmentId: string) { const response = await fetch(`/api/admin/articles/${articleId}/audio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ segmentId }) }); const data = await response.json() as { path?: string; error?: string }; setNotice(response.ok ? `已生成：${data.path}` : data.error || "音频生成失败"); }
  return <div className="admin-panel"><h2>音频</h2><p>每次仅重新生成一个段；旧 READY 版本保留在版本化目录中。</p>{segments.map((segment) => <article key={segment.id}><strong>{segment.order}. {segment.id}</strong><small>{segment.audioStatus}{segment.audioPath ? ` · ${segment.audioPath}` : ""}</small><button type="button" onClick={() => generate(segment.id)}>生成/重生成</button></article>)}{notice ? <p role="status">{notice}</p> : null}</div>;
}
