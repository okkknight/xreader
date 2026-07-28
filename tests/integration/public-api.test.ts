import { mkdtemp, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { createMediaResponse } from "@/server/articles/media";
import { getPublicArticle, getTodayArticle } from "@/server/articles/public-query";

describe("public article boundaries", () => {
  it("keeps drafts private and exposes due published courses without internal job data", async () => {
    const draftId = randomUUID();
    const publishedId = randomUUID();
    await prisma.article.createMany({ data: [
      { id: draftId, slug: `draft-${draftId}`, titleEn: "Draft", titleZh: "草稿", topic: "test", difficulty: "B1", bodyText: "Draft", wordCount: 1, status: "ARTICLE_DRAFT" },
      { id: publishedId, slug: `published-${publishedId}`, titleEn: "Published", titleZh: "发布", topic: "test", difficulty: "B1", bodyText: "Published", wordCount: 1, status: "PUBLISHED", publishedAt: new Date("2026-07-28T12:00:00Z") },
    ] });
    const sourceId = randomUUID();
    await prisma.source.create({ data: { id: sourceId, title: "Private source", url: "https://example.com/private" } });
    await prisma.articleSource.create({ data: { articleId: publishedId, sourceId, role: "FACT_CHECK", factNotes: { keyFacts: ["Private fact"] } } });

    expect(await getPublicArticle(prisma, `draft-${draftId}`, new Date("2026-07-29T00:00:00Z"))).toBeNull();
    expect(await getTodayArticle(prisma, new Date("2026-07-29T00:00:00Z"))).toMatchObject({ slug: `published-${publishedId}` });
    const publicBody = JSON.stringify(await getPublicArticle(prisma, `published-${publishedId}`, new Date()));
    expect(publicBody).not.toContain("promptVer");
    expect(publicBody).not.toContain("Private source");
    expect(publicBody).not.toContain("Private fact");
  });

  it("serves a valid byte-range response for a ready approved asset", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "xreader-media-"));
    const file = path.join(root, "clip.wav");
    await writeFile(file, new Uint8Array([0, 1, 2, 3]));
    const asset = await prisma.audioAsset.create({ data: { ownerType: "LESSON_SEGMENT", ownerId: randomUUID(), provider: "fish-audio", voiceId: "voice", path: "clip.wav", format: "wav", durationMs: 1, textHash: "hash", status: "READY" } });
    const response = await createMediaResponse(prisma, asset.id, "bytes=1-2", root);
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 1-2/4");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2]));
  });

  it("exposes ready segment audio through the media endpoint instead of a storage path", async () => {
    const articleId = randomUUID(); const segmentId = randomUUID(); const assetId = randomUUID(); const slug = `audio-${articleId}`;
    await prisma.article.create({ data: { id: articleId, slug, titleEn: "Audio", titleZh: "音频", topic: "test", difficulty: "B1", bodyText: "Audio", wordCount: 1, status: "PUBLISHED", publishedAt: new Date("2026-07-28T12:00:00Z"), lessonSegments: { create: { id: segmentId, order: 1, type: "OPENING", voiceRole: "TEACHER", script: "Hello", sentenceIds: [], audioStatus: "READY", audioPath: "private/audio.wav" } } } });
    await prisma.audioAsset.create({ data: { id: assetId, ownerType: "LESSON_SEGMENT", ownerId: segmentId, provider: "fish-audio", voiceId: "voice", path: "private/audio.wav", format: "wav", durationMs: 1, textHash: "hash", status: "READY" } });

    const article = await getPublicArticle(prisma, slug, new Date("2026-07-29T00:00:00Z"));

    expect(article?.lessonSegments[0].audioPath).toBe(`/api/media/${assetId}`);
  });
});
