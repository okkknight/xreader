import { AppShell } from "@/components/ui/app-shell";
import { TodayArticleFeature } from "@/components/home/today-article-feature";
import { prisma } from "@/lib/db/client";
import { getTodayArticle } from "@/server/articles/public-query";
import type { CSSProperties, JSX } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const article = await getTodayArticle(prisma);
  const coverImage = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/why-rain-has-a-smell-cover.png`;
  return (
    <AppShell style={{ "--today-cover-image": `url("${coverImage}")` } as CSSProperties}>
      <section className="home-page" aria-label="今日阅读">{article ? <TodayArticleFeature article={article} /> : <p className="public-empty-state">还没有已发布的文章。</p>}</section>
    </AppShell>
  );
}
