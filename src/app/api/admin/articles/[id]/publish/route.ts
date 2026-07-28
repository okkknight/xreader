import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/client";
import { publishArticle, withdrawArticle } from "@/server/publishing/publish-service";
import { assertPublishReady } from "@/server/qa/article-qa";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params; const body = await request.json() as { action?: "publish" | "withdraw" };
  try {
    if (body.action === "withdraw") await withdrawArticle(prisma, id);
    else { await assertPublishReady(prisma, id); await publishArticle(prisma, id, new Date()); }
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Publishing failed" }, { status: 422 }); }
}
