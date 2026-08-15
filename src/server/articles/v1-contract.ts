import { createHash } from "node:crypto";

import type { PublicArticle, PublicCourseBlock, PublicSentence } from "@/types/public-article";

type MediaV1 = { assetId: string; url: string; status: string; durationMs: number | null };

export type CatalogEntryV1 = {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  dekZh: string | null;
  topic: string;
  difficulty: string;
  publishedAt: string | null;
  coverUrl: string | null;
  contentVersion: string;
};

type SentenceV1 = Omit<PublicSentence, "audioPath" | "audioStatus"> & { audio: MediaV1 | null };
type CourseBlockV1 = Omit<PublicCourseBlock, "audioPath" | "audioStatus" | "audioDurationMs"> & { audio: MediaV1 | null };
export type ArticleDetailV1 = Omit<PublicArticle, "paragraphs" | "courseBlocks"> & {
  paragraphs: Array<{ id: string; text: string; sentences: SentenceV1[] }>;
  courseBlocks: CourseBlockV1[];
};

export type CatalogResponseV1 = { schemaVersion: 1; items: CatalogEntryV1[] };
export type ArticleResponseV1 = { schemaVersion: 1; contentVersion: string; article: ArticleDetailV1 };

function contentVersion(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function media(audioPath: string | null, status: string, durationMs: number | null): MediaV1 | null {
  const match = audioPath?.match(/^(.*)\/api\/media\/([^/]+)$/);
  return match ? { assetId: match[2], url: `${match[1]}/api/v1/media/${match[2]}`, status, durationMs } : null;
}

function coverUrl(slug: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  return slug === "why-rain-has-a-smell" ? `${basePath}/images/why-rain-has-a-smell-cover.png` : null;
}

export function toCatalogEntryV1(article: PublicArticle): CatalogEntryV1 {
  return {
    id: article.id,
    slug: article.slug,
    titleEn: article.titleEn,
    titleZh: article.titleZh,
    dekZh: article.dekZh,
    topic: article.topic,
    difficulty: article.difficulty,
    publishedAt: article.publishedAt ?? null,
    coverUrl: coverUrl(article.slug),
    contentVersion: contentVersion(article),
  };
}

export function toArticleResponseV1(article: PublicArticle): ArticleResponseV1 {
  const contentVersionValue = contentVersion(article);
  return {
    schemaVersion: 1,
    contentVersion: contentVersionValue,
    article: {
      id: article.id,
      slug: article.slug,
      titleEn: article.titleEn,
      titleZh: article.titleZh,
      dekZh: article.dekZh,
      topic: article.topic,
      difficulty: article.difficulty,
      paragraphs: article.paragraphs.map((paragraph) => ({
        id: paragraph.id,
        text: paragraph.text,
        sentences: paragraph.sentences.map(({ audioPath, audioStatus, ...sentence }) => ({ ...sentence, audio: media(audioPath, audioStatus, null) })),
      })),
      courseBlocks: article.courseBlocks.map(({ audioPath, audioStatus, audioDurationMs, ...block }) => ({ ...block, audio: media(audioPath, audioStatus, audioDurationMs) })),
    },
  };
}

export function toCatalogResponseV1(articles: PublicArticle[]): CatalogResponseV1 {
  return { schemaVersion: 1, items: articles.map(toCatalogEntryV1) };
}

export function jsonResponseV1(request: Request, value: CatalogResponseV1 | ArticleResponseV1) {
  const eTag = `"${createHash("sha256").update(JSON.stringify(value)).digest("hex")}"`;
  if (request.headers.get("if-none-match") === eTag) return new Response(null, { status: 304, headers: { ETag: eTag } });
  return Response.json(value, { headers: { "Cache-Control": "public, max-age=60", ETag: eTag } });
}
