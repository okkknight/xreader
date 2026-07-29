"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { PublicArticle } from "@/types/public-article";
import { createProgressStore } from "@/features/reader/progress";

export function TodayArticleFeature({ article }: { article: PublicArticle }) {
  const status = useSyncExternalStore(() => () => undefined, () => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    return progress?.completed ? "已完成" : progress?.guidedBlockId || progress?.readingSentenceId ? "继续上次进度" : "未开始";
  }, () => "未开始");
  return <article className="today-feature">
    <Image className="today-feature-image" src="/images/why-rain-has-a-smell-cover.png" alt="雨落在干燥土地与植物上的艺术插图" fill priority sizes="(max-width: 700px) 100vw, min(100vw - 3rem, 72rem)" />
    <div className="today-feature-content">
      <h1>{article.titleEn}</h1>
      <p className="today-feature-title-zh">{article.titleZh}</p>
      <div className="today-actions">
        <Link className="today-action-primary" href={`/articles/${article.slug}`}>{status === "继续上次进度" ? "继续讲解" : "开始讲解"}</Link>
        <Link className="today-action-secondary" href={`/articles/${article.slug}?mode=reading`}>先读文章</Link>
      </div>
    </div>
  </article>;
}
