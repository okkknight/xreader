import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

const optionalText = z.preprocess((value) => typeof value === "string" && !value.trim() ? undefined : value, z.string().trim().min(1).optional());
const dateInput = z.preprocess((value) => typeof value === "string" && !value.trim() ? undefined : value, z.string().trim().min(1).refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date").optional());

export const SourceDraftSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  publisher: optionalText,
  url: z.string().url().refine((value) => new URL(value).protocol === "https:" || new URL(value).protocol === "http:", "URL must use HTTP(S)"),
  publishedAt: dateInput,
  accessedAt: dateInput,
  role: z.string().trim().min(1),
  reliabilityNote: optionalText,
  keyFacts: z.array(z.string()).default([]),
});

export type SourceDraft = z.infer<typeof SourceDraftSchema>;
type SourceLink = Awaited<ReturnType<PrismaClient["articleSource"]["findMany"]>>[number] & { source: { id: string; title: string; publisher: string | null; url: string; publishedAt: Date | null; accessedAt: Date | null; notes: string | null } };

function normalize(input: SourceDraft) {
  const draft = SourceDraftSchema.parse(input);
  return { ...draft, keyFacts: draft.keyFacts.map((fact) => fact.trim()).filter(Boolean) };
}

function factNotes(input: ReturnType<typeof normalize>): Prisma.InputJsonValue {
  return { reliabilityNote: input.reliabilityNote, keyFacts: input.keyFacts };
}

function sourceData(input: ReturnType<typeof normalize>) {
  return { title: input.title, publisher: input.publisher, url: input.url, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, accessedAt: input.accessedAt ? new Date(input.accessedAt) : new Date(), notes: input.reliabilityNote };
}

function fromLink(link: SourceLink): SourceDraft {
  const notes = z.object({ reliabilityNote: z.string().optional(), keyFacts: z.array(z.string()).default([]) }).catch({ keyFacts: [] }).parse(link.factNotes);
  return { id: link.source.id, title: link.source.title, publisher: link.source.publisher || undefined, url: link.source.url, publishedAt: link.source.publishedAt?.toISOString(), accessedAt: link.source.accessedAt?.toISOString(), role: link.role, reliabilityNote: notes.reliabilityNote || link.source.notes || undefined, keyFacts: notes.keyFacts };
}

export async function listArticleSources(db: PrismaClient, articleId: string): Promise<SourceDraft[]> {
  const links = await db.articleSource.findMany({ where: { articleId }, include: { source: true }, orderBy: { sourceId: "asc" } });
  return links.map(fromLink);
}

export async function saveArticleSource(db: PrismaClient, articleId: string, input: SourceDraft): Promise<SourceDraft> {
  const draft = normalize(input);
  return db.$transaction(async (transaction) => {
    const source = draft.id ? await transaction.source.update({ where: { id: draft.id }, data: sourceData(draft) }) : await transaction.source.create({ data: sourceData(draft) });
    const link = await transaction.articleSource.upsert({
      where: { articleId_sourceId: { articleId, sourceId: source.id } },
      create: { articleId, sourceId: source.id, role: draft.role, factNotes: factNotes(draft) },
      update: { role: draft.role, factNotes: factNotes(draft) },
      include: { source: true },
    });
    return fromLink(link);
  });
}

export async function unlinkArticleSource(db: PrismaClient, articleId: string, sourceId: string) {
  return db.$transaction(async (transaction) => {
    await transaction.articleSource.delete({ where: { articleId_sourceId: { articleId, sourceId } } });
    const remaining = await transaction.articleSource.count({ where: { sourceId } });
    if (remaining === 0) await transaction.source.delete({ where: { id: sourceId } });
  });
}
