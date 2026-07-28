"use client";

import { useState } from "react";

export function QaPanel({ articleId }: { articleId: string }) {
  const [checks, setChecks] = useState({ content: false, mapping: false, audio: false }); const [result, setResult] = useState<string>();
  async function run() { const response = await fetch(`/api/admin/articles/${articleId}/qa`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ humanChecks: checks }) }); const data = await response.json() as { passed?: boolean; result?: { blockingIssues?: string[]; warnings?: string[] }; error?: string }; setResult(response.ok ? `${data.passed ? "QA 通过" : "QA 未通过"} ${data.result?.blockingIssues?.join("、") || ""} ${data.result?.warnings?.join("、") || ""}` : data.error || "QA 失败"); }
  return <div className="admin-panel"><h2>QA</h2><p>自动检查音频状态与句子映射；以下三项必须由人工确认。</p>{([['content', '内容准确'], ['mapping', '句子映射'], ['audio', '音频试听']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={checks[key]} onChange={(event) => setChecks({ ...checks, [key]: event.target.checked })} />{label}</label>)}<button type="button" onClick={run}>运行 QA</button>{result ? <p role="status">{result}</p> : null}</div>;
}
