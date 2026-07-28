import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/client";
import { evaluateArticleQa, requiredHumanChecks } from "@/server/qa/article-qa";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params; const body = await request.json() as { humanChecks?: Record<string, boolean> };
  const humanChecks = Object.fromEntries(requiredHumanChecks.map((key) => [key, body.humanChecks?.[key] === true])) as Record<(typeof requiredHumanChecks)[number], boolean>;
  try { return Response.json(await evaluateArticleQa(prisma, id, humanChecks)); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "QA failed" }, { status: 422 }); }
}
