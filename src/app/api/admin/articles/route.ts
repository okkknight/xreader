import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/client";

export async function GET(request: Request) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const articles = await prisma.article.findMany({ select: { id: true, slug: true, titleEn: true, titleZh: true, status: true, updatedAt: true }, orderBy: { updatedAt: "desc" } });
  return Response.json(articles);
}
