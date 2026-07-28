"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { PublicArticle } from "@/types/public-article";
import { createProgressStore } from "@/features/reader/progress";

export function TodayArticleFeature({ article }: { article: PublicArticle }) {
  const status = useSyncExternalStore(() => () => undefined, () => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    return progress?.completed ? "已完成" : progress?.guidedParagraphId || progress?.readingSentenceId ? "继续上次进度" : "未开始";
  }, () => "未开始");
  return <article className="today-feature">
    <div className="today-feature-meta"><span>{article.topic}</span><span>{article.difficulty}</span><span>{article.paragraphGuides.length} 段连续带读</span></div>
    <h2>{article.titleEn}</h2>
    <p className="today-feature-title-zh">{article.titleZh}</p>
    {article.dekZh ? <p className="today-feature-dek">{article.dekZh}</p> : null}
    <p className="today-progress" aria-live="polite">{status}</p>
    <div className="today-actions">
      <Link className="button-primary" href={`/articles/${article.slug}?mode=guided`}>{status === "继续上次进度" ? "继续讲解" : "开始讲解"}</Link>
      <Link className="button-secondary" href={`/articles/${article.slug}?mode=reading`}>先读文章</Link>
    </div>
  </article>;
}
