import Link from "next/link";
import type { PublicArticle } from "@/types/public-article";

export function TodayCard({ article }: { article: PublicArticle }) {
  return <article className="today-card"><p>今日阅读 · {article.topic}</p><h1>{article.titleEn}</h1><h2>{article.titleZh}</h2>{article.dekZh ? <p>{article.dekZh}</p> : null}<Link href={`/articles/${article.slug}`}>进入这一课</Link></article>;
}
