# Source Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give an authenticated editor source CRUD with traceable fact notes for one article, without exposing editorial data publicly.

**Architecture:** `src/server/articles/source-service.ts` owns validation and Prisma transactions; App Router route handlers only apply authentication and convert requests. The existing `Source` and `ArticleSource` tables remain the sole persistence layer; `factNotes` stores `{ reliabilityNote?: string; keyFacts: string[] }`.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/SQLite, Zod, Vitest, Playwright, React.

## Global Constraints

- All admin mutations call `requireAdmin(request)` and `assertSameOrigin(request)`.
- Source data remains absent from `PublicArticle` and public APIs.
- Source deletion unlinks the current article first, deleting the source only if it has no other `ArticleSource` rows.

---

## File Structure

- Create: `src/server/articles/source-service.ts` — SourceDraft schema and persistence operations.
- Create: `src/app/api/admin/articles/[id]/sources/route.ts` — authenticated list/save handler.
- Create: `src/app/api/admin/articles/[id]/sources/[sourceId]/route.ts` — authenticated unlink handler.
- Replace: `src/components/admin/source-editor.tsx` — source form, cards and error state.
- Modify: `tests/integration/admin-auth.test.ts`, `tests/e2e/admin-editor.spec.ts`, `tests/integration/public-api.test.ts`.

### Task 1: Validate and persist article sources

**Files:**
- Create: `src/server/articles/source-service.ts`
- Modify: `tests/integration/admin-auth.test.ts`

**Interfaces:**
- Produces `listArticleSources(db, articleId)`, `saveArticleSource(db, articleId, input)`, `unlinkArticleSource(db, articleId, sourceId)`.
- `saveArticleSource` accepts `{ id?, title, publisher?, url, publishedAt?, accessedAt?, role, reliabilityNote?, keyFacts }` and returns the normalized saved draft.

- [ ] **Step 1: Write a failing persistence test**

```ts
const saved = await saveArticleSource(prisma, articleId, {
  title: "Memory source", url: "https://example.com/memory", role: "FACT_CHECK",
  reliabilityNote: "University research summary", keyFacts: ["Recall can be reconstructive."],
});
expect(await listArticleSources(prisma, articleId)).toEqual([
  expect.objectContaining({ id: saved.id, keyFacts: ["Recall can be reconstructive."] }),
]);
```

- [ ] **Step 2: Run the test and observe the missing-service failure**

Run: `npm test -- tests/integration/admin-auth.test.ts`

Expected: FAIL because the source persistence functions do not exist.

- [ ] **Step 3: Implement one service with Zod validation and a transaction**

```ts
await db.$transaction(async (transaction) => {
  const source = await transaction.source.upsert({ where: { id }, create: sourceData, update: sourceData });
  await transaction.articleSource.upsert({
    where: { articleId_sourceId: { articleId, sourceId: source.id } },
    create: { articleId, sourceId: source.id, role, factNotes },
    update: { role, factNotes },
  });
});
```

Validate absolute HTTP(S) URLs, non-empty title/role, ISO dates and trimmed non-empty facts.

- [ ] **Step 4: Add shared-source unlink coverage and rerun**

```ts
await unlinkArticleSource(prisma, firstArticleId, sharedSource.id);
expect(await prisma.source.findUnique({ where: { id: sharedSource.id } })).not.toBeNull();
await unlinkArticleSource(prisma, secondArticleId, sharedSource.id);
expect(await prisma.source.findUnique({ where: { id: sharedSource.id } })).toBeNull();
```

Run: `npm test -- tests/integration/admin-auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/articles/source-service.ts tests/integration/admin-auth.test.ts
git commit -m "feat: add article source persistence"
```

### Task 2: Expose protected routes and source editor

**Files:**
- Create: `src/app/api/admin/articles/[id]/sources/route.ts`
- Create: `src/app/api/admin/articles/[id]/sources/[sourceId]/route.ts`
- Modify: `src/components/admin/source-editor.tsx`
- Modify: `tests/e2e/admin-editor.spec.ts`

**Interfaces:**
- GET returns `SourceDraft[]`; POST returns the saved `SourceDraft`; DELETE returns `{ deleted: true }`.

- [ ] **Step 1: Write a failing admin browser flow**

```ts
await page.getByRole("button", { name: "来源" }).click();
await page.getByLabel("来源标题").fill("Memory source");
await page.getByLabel("来源 URL").fill("https://example.com/memory");
await page.getByRole("button", { name: "保存来源" }).click();
await expect(page.getByText("Memory source")).toBeVisible();
```

- [ ] **Step 2: Run it and observe the placeholder failure**

Run: `npm run test:e2e -- tests/e2e/admin-editor.spec.ts`

Expected: FAIL because the source tab has no form.

- [ ] **Step 3: Implement guarded handlers and form**

```ts
await requireAdmin(request);
assertSameOrigin(request);
return Response.json(await saveArticleSource(prisma, articleId, await request.json()));
```

Render labels `来源标题`, `来源 URL`, `发布日`, `可信度说明`, `关键事实`, and `来源角色`. Split facts by newline; reload cards after save/delete.

- [ ] **Step 4: Run focused route and browser checks**

Run: `npm run test:e2e -- tests/e2e/admin-editor.spec.ts && npm test -- tests/integration/admin-auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/articles/'[id]'/sources src/components/admin/source-editor.tsx tests/e2e/admin-editor.spec.ts
git commit -m "feat: manage sources from admin editor"
```

### Task 3: Verify public privacy and record evidence

**Files:**
- Modify: `tests/integration/public-api.test.ts`
- Modify: `docs/handoff/ACCEPTANCE_EVIDENCE.md`

- [ ] **Step 1: Assert public output excludes source data**

```ts
const body = JSON.stringify(await getPublicArticle(prisma, publishedSlug, now));
expect(body).not.toContain("Memory source");
expect(body).not.toContain("Recall can be reconstructive.");
```

- [ ] **Step 2: Run privacy regression**

Run: `npm test -- tests/integration/public-api.test.ts`

Expected: PASS.

- [ ] **Step 3: Run full gates and record outputs**

Run: `npm test && npm run test:e2e && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/integration/public-api.test.ts docs/handoff/ACCEPTANCE_EVIDENCE.md
git commit -m "test: verify private source management"
```
