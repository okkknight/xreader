import { notFound } from "next/navigation";
import Link from "next/link";
import { EditorTabs } from "@/components/admin/editor-tabs";
import { ArticleRepository } from "@/lib/db/article-repository";
import { prisma } from "@/lib/db/client";
import type { CourseImport } from "@/types/article";

export default async function AdminArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const article = await new ArticleRepository(prisma).getById(id); if (!article) notFound();
  const draft: CourseImport = { article: { id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh || undefined, topic: article.topic, difficulty: article.difficulty, status: article.status, publishedAt: article.publishedAt || undefined, scheduledAt: article.scheduledAt || undefined }, paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh || undefined })) })), lessonSegments: article.lessonSegments.map((segment) => ({ id: segment.id, order: segment.order, type: segment.type, voiceRole: segment.voiceRole, sentenceIds: Array.isArray(segment.sentenceIds) ? segment.sentenceIds.filter((value): value is string => typeof value === "string") : [], script: segment.script || undefined, primaryGoal: segment.primaryGoal || undefined })), annotations: article.paragraphs.flatMap((paragraph) => paragraph.sentences.flatMap((sentence) => sentence.annotations.map((annotation) => ({ id: annotation.id, sentenceId: annotation.sentenceId, startOffset: annotation.startOffset, endOffset: annotation.endOffset, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh || undefined, exampleEn: annotation.exampleEn || undefined })))) };
  return <main className="admin-home"><Link href="/admin">← 课程列表</Link><h1>{article.titleEn}</h1><EditorTabs initialDraft={draft} /></main>;
}
