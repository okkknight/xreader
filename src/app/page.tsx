import { AppShell } from "@/components/ui/app-shell";
import { TodayCard } from "@/components/reader/today-card";
import { prisma } from "@/lib/db/client";
import { getTodayArticle } from "@/server/articles/public-query";
import type { JSX } from "react";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const article = await getTodayArticle(prisma);
  return (
    <AppShell>
      <section className="today" aria-labelledby="today-heading"><p className="section-label">Today</p><h1 id="today-heading">把英文读进一段安静的时间里。</h1>{article ? <TodayCard article={article} /> : <p>还没有到期的课程，先在后台准备第一篇。</p>}</section>
    </AppShell>
  );
}
