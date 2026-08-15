import { prisma } from "@/lib/db/client";
import { getPublicArticle } from "@/server/articles/public-query";
import { jsonResponseV1, toArticleResponseV1 } from "@/server/articles/v1-contract";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublicArticle(prisma, slug);
  return article ? jsonResponseV1(request, toArticleResponseV1(article)) : Response.json({ error: "Not found" }, { status: 404 });
}
