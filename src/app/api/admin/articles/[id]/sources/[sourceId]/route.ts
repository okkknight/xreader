import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/client";
import { unlinkArticleSource } from "@/server/articles/source-service";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; sourceId: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
  const { id, sourceId } = await params;
  try { await unlinkArticleSource(prisma, id, sourceId); return Response.json({ deleted: true }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Source not found" }, { status: 404 }); }
}
