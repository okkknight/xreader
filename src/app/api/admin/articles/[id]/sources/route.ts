import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/client";
import { listArticleSources, saveArticleSource } from "@/server/articles/source-service";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  return Response.json(await listArticleSources(prisma, id));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try { return Response.json(await saveArticleSource(prisma, id, await request.json())); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid source" }, { status: 400 }); }
}
