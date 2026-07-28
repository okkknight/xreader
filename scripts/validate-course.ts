import { createHash } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { validateAudioLineage } from "@/lib/audio/lineage";
import { validateCourse } from "@/lib/validation/course-schema";
import { evaluateQa, findDuplicateCourseBodies } from "@/lib/validation/qa";
import { ArticleRepository } from "@/lib/db/article-repository";

async function main() {
  const slug = process.argv[process.argv.indexOf("--article") + 1]; const all = process.argv.includes("--all");
  if (!slug && !all) throw new Error("Usage: npm run course:validate -- --article <slug> | --all");
  const selected = all ? null : await prisma.article.findFirst({ where: { OR: [{ slug: slug! }, { id: slug! }] }, select: { id: true, slug: true } });
  if (!all && !selected) throw new Error(`Article not found: ${slug}`);
  const articles = all ? await prisma.article.findMany({ select: { id: true, slug: true } }) : [selected!]; const repository = new ArticleRepository(prisma); const root = path.resolve(process.env.AUDIO_STORAGE_DIR || "data/audio");
  for (const entry of articles) {
    const article = await repository.getById(entry.id); if (!article) throw new Error(`Missing ${entry.slug}`);
    const course = { article: { id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh || undefined, topic: article.topic, difficulty: article.difficulty, status: article.status, publishedAt: article.publishedAt || undefined, scheduledAt: article.scheduledAt || undefined }, paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh || undefined })) })), paragraphGuides: article.paragraphGuides.map((guide) => ({ id: guide.id, paragraphId: guide.paragraphId, order: guide.order, paragraphGoal: guide.paragraphGoal, openingBridge: guide.openingBridge || undefined, paragraphWrap: guide.paragraphWrap || undefined, nextParagraphBridge: guide.nextParagraphBridge || undefined, scriptText: guide.scriptText, audioPath: guide.audioPath || undefined, audioDurationMs: guide.audioDurationMs || undefined, audioStatus: guide.audioStatus, textHash: guide.textHash || undefined, sentenceGuides: guide.sentenceGuides.map((sentence) => ({ id: sentence.id, paragraphId: sentence.paragraphId, sentenceId: sentence.sentenceId, order: sentence.order, depth: sentence.depth, originalReadText: sentence.originalReadText, meaningZh: sentence.meaningZh, sentenceFunction: sentence.sentenceFunction, primaryTeachingGoal: sentence.primaryTeachingGoal, focusScript: sentence.focusScript || undefined, bridgeScript: sentence.bridgeScript || undefined, likelyMisunderstanding: sentence.likelyMisunderstanding || undefined, expressionTarget: sentence.expressionTarget || undefined, replayAfterExplanation: sentence.replayAfterExplanation, estimatedStartMs: sentence.estimatedStartMs || undefined, estimatedEndMs: sentence.estimatedEndMs || undefined })) })), annotations: [] };
    validateCourse(course);
    const qa = evaluateQa({ course, audioStatuses: article.paragraphGuides.map((guide) => guide.audioStatus) });
    if (qa.blockingIssues.length) throw new Error(`${entry.slug}: ${qa.blockingIssues.join(", ")}`);
    const assets = await prisma.audioAsset.findMany({ where: { ownerType: "PARAGRAPH_GUIDE", ownerId: { in: article.paragraphGuides.map((guide) => guide.id) }, status: "READY" } });
    for (const asset of assets) { const guide = article.paragraphGuides.find((item) => item.id === asset.ownerId)!; await validateAudioLineage({ directory: path.join(root, path.dirname(asset.path)), textHash: createHash("sha256").update(guide.scriptText).digest("hex") }); }
    const currentAudioCount = article.paragraphGuides.filter((guide) => guide.audioStatus === "READY" && guide.audioPath && assets.some((asset) => asset.ownerId === guide.id && asset.path === guide.audioPath)).length;
    console.log(`${entry.slug}: valid coverage, ${currentAudioCount}/${article.paragraphGuides.length} guide audio`);
  }
  if (all) { const bodies = await prisma.article.findMany({ select: { id: true, bodyText: true } }); const duplicates = findDuplicateCourseBodies(bodies); if (duplicates.length) throw new Error(`review courses must have independent bodies: ${duplicates.map((item) => `${item.id}=${item.matches}`).join(", ")}`); }
}
main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
