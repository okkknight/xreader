import { notFound } from "next/navigation";
import type { JSX } from "react";
import { ArticleReader } from "@/components/reader/article-reader";
import { AppShell } from "@/components/ui/app-shell";
import { prisma } from "@/lib/db/client";
import { getPublicArticle } from "@/server/articles/public-query";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }): Promise<JSX.Element> {
  const { slug } = await params;
  const article = await getPublicArticle(prisma, slug);
  if (!article) notFound();
  return <AppShell><ArticleReader article={article} /></AppShell>;
}
