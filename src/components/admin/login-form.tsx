"use client";

import { useState } from "react";

export function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(undefined);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (!response.ok) { setError("密码不正确，或后台尚未配置。"); return; }
    window.location.assign("/admin");
  }
  return <form className="admin-login" onSubmit={submit}><h1>XReader 后台</h1><p>使用本地后台密码进入内容工作台。</p><label>密码<input type="password" value={password} autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} /></label>{error ? <p role="alert">{error}</p> : null}<button type="submit">进入后台</button></form>;
}
