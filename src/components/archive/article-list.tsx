"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { PublicArticle } from "@/types/public-article";
import { createProgressStore } from "@/features/reader/progress";

function ArticleListItem({ article }: { article: PublicArticle }) {
  const status = useSyncExternalStore(() => () => undefined, () => {
    const progress = createProgressStore(window.localStorage).load(article.id);
    return progress?.completed ? "已完成" : progress?.guidedSegmentId || progress?.readingSentenceId ? "继续阅读" : "未开始";
  }, () => "未开始");
  return <Link className="archive-item" href={`/articles/${article.slug}`}>
    <div className="archive-item-meta"><span>{article.topic}</span><span>{article.difficulty}</span><span>{status}</span></div>
    <h2>{article.titleEn}</h2>
    <p className="archive-item-title-zh">{article.titleZh}</p>
    {article.dekZh ? <p className="archive-item-dek">{article.dekZh}</p> : null}
    <span className="archive-item-action">进入阅读 <span aria-hidden="true">→</span></span>
  </Link>;
}

export function ArticleList({ articles }: { articles: PublicArticle[] }) {
  if (!articles.length) return <p className="public-empty-state">还没有已发布的文章。</p>;
  return <div className="archive-list">{articles.map((article) => <ArticleListItem key={article.id} article={article} />)}</div>;
}
