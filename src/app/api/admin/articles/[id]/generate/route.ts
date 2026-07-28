import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { getAiConfig } from "@/lib/ai/config";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-compatible-provider";
import type { PipelineStep } from "@/lib/ai/provider";
import { prisma } from "@/lib/db/client";
import { GenerationPipeline } from "@/server/generation/pipeline";

const steps = new Set<PipelineStep>(["FACT_CARD", "ARTICLE_WRITER", "ARTICLE_EDITOR", "SENTENCE_SPLITTER", "ARTICLE_ANALYZER", "TEACHING_DIRECTOR", "SCRIPT_WRITER", "SCRIPT_EDITOR", "QA_REVIEW"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params; const body = await request.json() as { step?: PipelineStep };
  if (!body.step || !steps.has(body.step)) return Response.json({ error: "Unknown generation step" }, { status: 400 });
  try { const config = getAiConfig(); const pipeline = new GenerationPipeline(prisma, new OpenAICompatibleProvider(config)); return Response.json(await pipeline.runPipelineStep(id, body.step)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 422 }); }
}
