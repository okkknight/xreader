"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicArticle } from "@/types/public-article";

const ARCHIVE_COVER_IMAGES: Record<string, string> = {
  "why-rain-has-a-smell": "/images/why-rain-has-a-smell-cover.png",
};

function ArticleListItem({ article }: { article: PublicArticle }) {
  return <Link className="archive-item" href={`/articles/${article.slug}`}>
    <div className="archive-item-media"><Image src={ARCHIVE_COVER_IMAGES[article.slug] ?? "/images/why-rain-has-a-smell-cover.png"} alt={`${article.titleEn} 课程封面`} fill sizes="(max-width: 700px) calc(100vw - 2rem), 23rem" /></div>
    <div className="archive-item-content">
      <h2>{article.titleEn}</h2>
      <p className="archive-item-title-zh">{article.titleZh}</p>
      <span className="archive-item-action">进入阅读 <span aria-hidden="true">→</span></span>
    </div>
  </Link>;
}

export function ArticleList({ articles }: { articles: PublicArticle[] }) {
  if (!articles.length) return <p className="public-empty-state">还没有已发布的文章。</p>;
  return <div className="archive-list">{articles.map((article) => <ArticleListItem key={article.id} article={article} />)}</div>;
}
