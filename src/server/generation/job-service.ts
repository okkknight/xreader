import { createHash } from "node:crypto";

import type { GenerationJob, Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

import type { LLMProvider, PipelineStep } from "@/lib/ai/provider";
import { prompts } from "@/lib/ai/prompts";

const articleDraftSchema = z.object({
  titleEn: z.string().min(1),
  titleZh: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  bodyText: z.string().min(1),
});

const outputValidators: Partial<Record<PipelineStep, z.ZodType>> = { ARTICLE_WRITER: articleDraftSchema };

export type RunJobOptions = { prompt?: string; promptVer?: string; model?: string; input?: unknown };

function stableHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export class JobService {
  constructor(private readonly db: PrismaClient, private readonly provider: LLMProvider) {}

  async run(articleId: string, step: PipelineStep, options: RunJobOptions = {}): Promise<GenerationJob> {
    const definition = prompts[step];
    const prompt = options.prompt ?? definition.text;
    const input = options.input ?? { articleId };
    const persistedInput = { input, prompt, prompt_sha256: stableHash(prompt) };
    const job = await this.db.generationJob.create({ data: {
      articleId, type: step, status: "RUNNING", inputHash: stableHash(persistedInput),
      promptVer: options.promptVer ?? definition.version, model: options.model, input: persistedInput, attempts: 1, startedAt: new Date(),
    } });

    try {
      const output = await this.provider.generateStructured<unknown>({ step, prompt, model: options.model, input });
      const validator = outputValidators[step] ?? z.object({}).passthrough();
      const parsed = validator.parse(output);
      return await this.db.generationJob.update({ where: { id: job.id }, data: { status: "SUCCEEDED", output: parsed as Prisma.InputJsonValue, finishedAt: new Date() } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.db.generationJob.update({ where: { id: job.id }, data: { status: "FAILED", error: message.slice(0, 2000), finishedAt: new Date() } });
      throw error;
    }
  }

  async promote(articleId: string, step: PipelineStep, jobId: string): Promise<void> {
    const job = await this.db.generationJob.findFirstOrThrow({ where: { id: jobId, articleId, type: step, status: "SUCCEEDED" } });
    if (step !== "ARTICLE_WRITER") throw new Error(`Promotion is not implemented for ${step}`);
    const output = articleDraftSchema.parse(job.output);
    const wordCount = output.bodyText.trim().split(/\s+/).filter(Boolean).length;

    await this.db.$transaction(async (transaction) => {
      await transaction.article.update({ where: { id: articleId }, data: {
        titleEn: output.titleEn, titleZh: output.titleZh, topic: output.topic, difficulty: output.difficulty,
        bodyText: output.bodyText, wordCount, status: "ARTICLE_DRAFT",
      } });
      const segments = await transaction.lessonSegment.findMany({ where: { articleId }, select: { id: true } });
      if (segments.length > 0) {
        const ids = segments.map((segment) => segment.id);
        await transaction.lessonSegment.updateMany({ where: { id: { in: ids } }, data: { audioStatus: "STALE" } });
        await transaction.audioAsset.updateMany({ where: { ownerId: { in: ids }, status: "READY" }, data: { status: "STALE" } });
      }
    });
  }
}
