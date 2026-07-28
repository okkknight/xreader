import type { GenerationJob, PrismaClient } from "@prisma/client";

import type { LLMProvider, PipelineStep } from "@/lib/ai/provider";
import { prompts } from "@/lib/ai/prompts";
import { JobService } from "./job-service";

export class GenerationPipeline {
  private readonly jobs: JobService;

  constructor(private readonly db: PrismaClient, provider: LLMProvider) {
    this.jobs = new JobService(db, provider);
  }

  async runPipelineStep(articleId: string, step: PipelineStep): Promise<GenerationJob> {
    const article = await this.db.article.findUniqueOrThrow({ where: { id: articleId } });
    const prompt = prompts[step];
    return this.jobs.run(articleId, step, { prompt: prompt.text, promptVer: prompt.version, input: { article } });
  }

  async promotePipelineOutput(articleId: string, step: PipelineStep, jobId: string): Promise<void> {
    await this.jobs.promote(articleId, step, jobId);
  }
}
