import type { JSX } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { ArticleList } from "@/components/archive/article-list";
import { prisma } from "@/lib/db/client";
import { listPublicArticles } from "@/server/articles/public-query";

export const dynamic = "force-dynamic";

export default async function ArchivePage(): Promise<JSX.Element> {
  const articles = await listPublicArticles(prisma);
  return <AppShell><section className="archive-page" aria-labelledby="archive-heading"><div className="archive-intro"><p className="section-label">Archive</p><h1 id="archive-heading">往期阅读</h1><p>把读过的文章留在这里，随时回来继续。</p></div><ArticleList articles={articles} /></section></AppShell>;
}
