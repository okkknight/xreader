import type { JSX } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { TodayCard } from "@/components/reader/today-card";
import { prisma } from "@/lib/db/client";
import { listPublicArticles } from "@/server/articles/public-query";

export const dynamic = "force-dynamic";

export default async function ArchivePage(): Promise<JSX.Element> {
  const articles = await listPublicArticles(prisma);
  return <AppShell><section className="archive" aria-labelledby="archive-heading"><p className="section-label">Archive</p><h1 id="archive-heading">往期阅读</h1><div className="archive-list">{articles.map((article) => <TodayCard key={article.id} article={article} />)}</div></section></AppShell>;
}
