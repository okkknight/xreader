import { prisma } from "@/lib/db/client";
import { getPublicArticle } from "@/server/articles/public-query";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublicArticle(prisma, slug);
  return Response.json(article, { status: article ? 200 : 404 });
}
