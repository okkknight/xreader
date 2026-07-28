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
      <section className="home-page" aria-labelledby="today-heading"><div className="home-intro"><p className="section-label">Today</p><h1 id="today-heading">把英文读进一段安静的时间里。</h1><p>每天一篇值得读的英文短文，先听懂，再把语言放回真实语境。</p></div>{article ? <TodayArticleFeature article={article} /> : <p className="public-empty-state">还没有已发布的文章。</p>}</section>
    </AppShell>
  );
}
