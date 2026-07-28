import { describe, expect, it } from "vitest";

import { assertSameOrigin, createAdminSession, requireAdmin } from "@/lib/auth/admin-session";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { reorderSegments } from "@/features/admin/segment-editor";
import { listArticleSources, saveArticleSource, unlinkArticleSource } from "@/server/articles/source-service";

describe("admin session guard", () => {
  const env = { ADMIN_PASSWORD: "correct horse battery staple", ADMIN_SESSION_SECRET: "test-secret", NODE_ENV: "test" };

  it("rejects anonymous requests and accepts a signed httpOnly-session value", async () => {
    await expect(requireAdmin(new Request("http://localhost/api/admin/articles"), env)).rejects.toThrow("Unauthorized");
    const session = await createAdminSession(env);
    const request = new Request("http://localhost/api/admin/articles", { headers: { cookie: `xreader_admin=${session.value}` } });
    await expect(requireAdmin(request, env)).resolves.toMatchObject({ role: "admin" });
    expect(session.options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
  });

  it("accepts same-port loopback aliases outside production but rejects real cross-origin writes", () => {
    expect(() => assertSameOrigin(new Request("http://localhost:3201/api/admin/articles", { headers: { origin: "http://127.0.0.1:3201" } }))).not.toThrow();
    expect(() => assertSameOrigin(new Request("http://localhost:3201/api/admin/articles", { headers: { origin: "https://example.com" } }))).toThrow("Invalid request origin");
  });

  it("reorders all segments atomically with contiguous positions", async () => {
    const id = randomUUID();
    await prisma.article.create({ data: { id, slug: `admin-${id}`, titleEn: "Title", titleZh: "标题", topic: "test", difficulty: "B1", bodyText: "body", wordCount: 1, lessonSegments: { create: [
      { id: `${id}-one`, order: 1, type: "OPENING", voiceRole: "TEACHER", sentenceIds: [], script: "one" },
      { id: `${id}-two`, order: 2, type: "FINAL_WRAP", voiceRole: "TEACHER", sentenceIds: [], script: "two" },
    ] } } });
    await expect(reorderSegments(prisma, id, [`${id}-two`, `${id}-one`])).resolves.toMatchObject([{ id: `${id}-two`, order: 1 }, { id: `${id}-one`, order: 2 }]);
  });

  it("persists source-backed facts and only deletes a source after its final article unlink", async () => {
    const firstArticleId = randomUUID(); const secondArticleId = randomUUID();
    await prisma.article.createMany({ data: [
      { id: firstArticleId, slug: `source-one-${firstArticleId}`, titleEn: "One", titleZh: "一", topic: "test", difficulty: "B1", bodyText: "One", wordCount: 1 },
      { id: secondArticleId, slug: `source-two-${secondArticleId}`, titleEn: "Two", titleZh: "二", topic: "test", difficulty: "B1", bodyText: "Two", wordCount: 1 },
    ] });
    const saved = await saveArticleSource(prisma, firstArticleId, { title: "Memory source", url: "https://example.com/memory", role: "FACT_CHECK", reliabilityNote: "University research summary", keyFacts: ["Recall can be reconstructive."] });
    await saveArticleSource(prisma, secondArticleId, { ...saved, keyFacts: ["Recall can be reconstructive."] });

    await expect(listArticleSources(prisma, firstArticleId)).resolves.toEqual([expect.objectContaining({ id: saved.id, role: "FACT_CHECK", reliabilityNote: "University research summary", keyFacts: ["Recall can be reconstructive."] })]);
    await unlinkArticleSource(prisma, firstArticleId, saved.id);
    await expect(prisma.source.findUnique({ where: { id: saved.id } })).resolves.not.toBeNull();
    await unlinkArticleSource(prisma, secondArticleId, saved.id);
    await expect(prisma.source.findUnique({ where: { id: saved.id } })).resolves.toBeNull();
  });
});
