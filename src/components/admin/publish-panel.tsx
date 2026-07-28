"use client";

import { useState } from "react";

export function PublishPanel({ articleId }: { articleId: string }) {
  const [notice, setNotice] = useState<string>();
  async function perform(action: "publish" | "withdraw") { const response = await fetch(`/api/admin/articles/${articleId}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); const data = await response.json() as { error?: string }; setNotice(response.ok ? (action === "publish" ? "已发布" : "已撤回") : data.error || "操作失败"); }
  return <div className="admin-panel"><h2>发布</h2><p>发布前必须通过 QA，且所有课件段音频为最新 READY 状态。</p><button type="button" onClick={() => perform("publish")}>立即发布</button><button type="button" onClick={() => perform("withdraw")}>撤回课程</button>{notice ? <p role="status">{notice}</p> : null}</div>;
}
