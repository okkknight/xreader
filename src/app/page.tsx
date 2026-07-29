import { AppShell } from "@/components/ui/app-shell";
import { TodayArticleFeature } from "@/components/home/today-article-feature";
import { prisma } from "@/lib/db/client";
import { getTodayArticle } from "@/server/articles/public-query";
import type { JSX } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const article = await getTodayArticle(prisma);
  return (
    <AppShell>
      <section className="home-page" aria-label="今日阅读">{article ? <TodayArticleFeature article={article} /> : <p className="public-empty-state">还没有已发布的文章。</p>}</section>
    </AppShell>
  );
}
