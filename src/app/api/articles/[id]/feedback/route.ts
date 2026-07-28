import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db/client";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { difficulty?: string; density?: string; worthReading?: boolean; sessionId?: string };
  const article = await prisma.article.findFirst({ where: { id, status: "PUBLISHED", publishedAt: { lte: new Date() } }, select: { id: true } });
  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  const feedback = await prisma.articleFeedback.create({ data: {
    articleId: id, sessionId: body.sessionId?.slice(0, 200) || randomUUID(), difficulty: body.difficulty?.slice(0, 100),
    density: body.density?.slice(0, 100), worthReading: typeof body.worthReading === "boolean" ? body.worthReading : null,
  } });
  return Response.json({ id: feedback.id }, { status: 201 });
}
