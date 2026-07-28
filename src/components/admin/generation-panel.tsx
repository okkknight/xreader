"use client";

import { useState } from "react";

const steps = ["FACT_CARD", "ARTICLE_WRITER", "ARTICLE_EDITOR", "SENTENCE_SPLITTER", "ARTICLE_ANALYZER", "TEACHING_DIRECTOR", "SCRIPT_WRITER", "SCRIPT_EDITOR", "QA_REVIEW"] as const;

export function GenerationPanel({ articleId }: { articleId: string }) {
  const [notice, setNotice] = useState<string>();
  async function run(step: (typeof steps)[number]) { const response = await fetch(`/api/admin/articles/${articleId}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step }) }); const data = await response.json() as { id?: string; status?: string; inputHash?: string; error?: string }; setNotice(response.ok ? `${step}: ${data.status} · ${data.inputHash?.slice(0, 12)}` : data.error || "生成失败"); }
  return <div className="admin-panel"><h2>生成</h2><p>每次操作只运行一个步骤；结果保存为可审阅 job，不会自动覆盖文章。</p>{steps.map((step) => <button key={step} type="button" onClick={() => run(step)}>{step}</button>)}{notice ? <p role="status">{notice}</p> : null}</div>;
}
