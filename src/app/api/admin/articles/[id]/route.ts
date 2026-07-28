import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { ArticleRepository } from "@/lib/db/article-repository";
import { prisma } from "@/lib/db/client";
import { saveArticleDraft } from "@/features/admin/article-draft";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const article = await new ArticleRepository(prisma).getById(id);
  return article ? Response.json(article) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  try {
    const draft = await request.json();
    if (draft?.article?.id !== id) return Response.json({ error: "Article ID does not match route" }, { status: 400 });
    return Response.json(await saveArticleDraft(prisma, draft));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid draft" }, { status: 400 }); }
}
