import { describe, expect, it } from "vitest";

import { createAdminSession, requireAdmin } from "@/lib/auth/admin-session";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { reorderSegments } from "@/features/admin/segment-editor";

describe("admin session guard", () => {
  const env = { ADMIN_PASSWORD: "correct horse battery staple", ADMIN_SESSION_SECRET: "test-secret", NODE_ENV: "test" };

  it("rejects anonymous requests and accepts a signed httpOnly-session value", async () => {
    await expect(requireAdmin(new Request("http://localhost/api/admin/articles"), env)).rejects.toThrow("Unauthorized");
    const session = await createAdminSession(env);
    const request = new Request("http://localhost/api/admin/articles", { headers: { cookie: `xreader_admin=${session.value}` } });
    await expect(requireAdmin(request, env)).resolves.toMatchObject({ role: "admin" });
    expect(session.options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
  });

  it("reorders all segments atomically with contiguous positions", async () => {
    const id = randomUUID();
    await prisma.article.create({ data: { id, slug: `admin-${id}`, titleEn: "Title", titleZh: "标题", topic: "test", difficulty: "B1", bodyText: "body", wordCount: 1, lessonSegments: { create: [
      { id: `${id}-one`, order: 1, type: "OPENING", voiceRole: "TEACHER", sentenceIds: [], script: "one" },
      { id: `${id}-two`, order: 2, type: "FINAL_WRAP", voiceRole: "TEACHER", sentenceIds: [], script: "two" },
    ] } } });
    await expect(reorderSegments(prisma, id, [`${id}-two`, `${id}-one`])).resolves.toMatchObject([{ id: `${id}-two`, order: 1 }, { id: `${id}-one`, order: 2 }]);
  });
});
