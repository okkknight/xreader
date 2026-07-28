import { prisma } from "@/lib/db/client";
import { getTodayArticle } from "@/server/articles/public-query";

export async function GET() {
  const article = await getTodayArticle(prisma);
  return Response.json(article, { status: article ? 200 : 404 });
}
