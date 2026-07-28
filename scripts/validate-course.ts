import { createHash } from "node:crypto";
import path from "node:path";

import { prisma } from "@/lib/db/client";
import { validateAudioLineage } from "@/lib/audio/lineage";
import { validateCourse } from "@/lib/validation/course-schema";
import { findDuplicateCourseBodies } from "@/lib/validation/qa";
import { ArticleRepository } from "@/lib/db/article-repository";

async function main() {
  const slug = process.argv[process.argv.indexOf("--article") + 1]; const all = process.argv.includes("--all");
  if (!slug && !all) throw new Error("Usage: npm run course:validate -- --article <slug> | --all");
  const selected = all ? null : await prisma.article.findFirst({ where: { OR: [{ slug: slug! }, { id: slug! }] }, select: { id: true, slug: true } });
  if (!all && !selected) throw new Error(`Article not found: ${slug}`);
  const articles = all ? await prisma.article.findMany({ select: { id: true, slug: true } }) : [selected!]; const repository = new ArticleRepository(prisma); const root = path.resolve(process.env.AUDIO_STORAGE_DIR || "data/audio");
  for (const entry of articles) {
    const article = await repository.getById(entry.id); if (!article) throw new Error(`Missing ${entry.slug}`);
    validateCourse({ article: { id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh || undefined, topic: article.topic, difficulty: article.difficulty, status: article.status, publishedAt: article.publishedAt || undefined, scheduledAt: article.scheduledAt || undefined }, paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh || undefined })) })), lessonSegments: article.lessonSegments.map((segment) => ({ id: segment.id, order: segment.order, type: segment.type, voiceRole: segment.voiceRole, sentenceIds: Array.isArray(segment.sentenceIds) ? segment.sentenceIds.filter((id): id is string => typeof id === "string") : [], script: segment.script || undefined, primaryGoal: segment.primaryGoal || undefined })), annotations: [] });
    const sentences = new Map(article.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const)));
    const assets = await prisma.audioAsset.findMany({ where: { ownerType: "LESSON_SEGMENT", ownerId: { in: article.lessonSegments.map((segment) => segment.id) }, status: "READY" } });
    for (const asset of assets) { const segment = article.lessonSegments.find((item) => item.id === asset.ownerId)!; const text = segment.script || (Array.isArray(segment.sentenceIds) ? segment.sentenceIds.map((id) => sentences.get(String(id))).filter(Boolean).join(" ") : ""); await validateAudioLineage({ directory: path.join(root, path.dirname(asset.path)), textHash: createHash("sha256").update(text).digest("hex") }); }
    console.log(`${entry.slug}: valid`);
  }
  if (all) {
    const bodies = await prisma.article.findMany({ select: { id: true, bodyText: true } });
    const duplicates = findDuplicateCourseBodies(bodies);
    if (duplicates.length) throw new Error(`review courses must have independent bodies: ${duplicates.map((item) => `${item.id}=${item.matches}`).join(", ")}`);
  }
}
main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
