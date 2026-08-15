import { prisma } from "@/lib/db/client";
import { listPublicArticles } from "@/server/articles/public-query";
import { jsonResponseV1, toCatalogResponseV1 } from "@/server/articles/v1-contract";

export async function GET(request: Request) {
  return jsonResponseV1(request, toCatalogResponseV1(await listPublicArticles(prisma)));
}
