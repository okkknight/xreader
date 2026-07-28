# Course Structure Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an editor manually complete, exchange and save a course's sentence-to-segment structure through the existing CourseImport contract.

**Architecture:** Keep mutations pure in `src/features/admin/course-structure.ts`; components only render and dispatch those mutations. JSON import validates with the existing course schema before changing client state, while persistence remains the existing protected PUT route.

**Tech Stack:** React, TypeScript, Zod, Vitest, Playwright, Next.js.

## Global Constraints

- Preserve all stable paragraph, sentence, segment and annotation IDs during import/export.
- `ARTICLE_READ` requires mapped sentence IDs and uses `READER`; teacher segments require a non-empty script.
- A source/QA/audio record is not included in portable CourseImport JSON.
- Existing `validateCourse` is the final server-side save gate.

---

### Task 1: Pure course-structure mutations

**Files:**
- Create: `src/features/admin/course-structure.ts`
- Create: `tests/unit/course-structure.test.ts`

- [ ] **Step 1: Write failing mutation tests**

```ts
const added = addLessonSegment(seedCourse);
expect(added.lessonSegments.at(-1)).toMatchObject({ type: "QUICK_EXPLANATION", voiceRole: "TEACHER", order: 9 });
expect(removeLessonSegment(added, added.lessonSegments[0].id).lessonSegments.map((s) => s.order)).toEqual([1,2,3,4,5,6,7,8]);
expect(setSegmentType(added, added.lessonSegments[1].id, "ARTICLE_READ").lessonSegments[1]).toMatchObject({ voiceRole: "READER", script: undefined });
```

- [ ] **Step 2: Run the test and observe missing-module failure**

Run: `npm test -- tests/unit/course-structure.test.ts`

Expected: FAIL because course-structure mutations do not exist.

- [ ] **Step 3: Implement pure immutable helpers**

```ts
export function setSegmentType(course: CourseImport, id: string, type: SegmentType): CourseImport {
  return withSegments(course, (segment) => segment.id !== id ? segment : type === "ARTICLE_READ"
    ? { ...segment, type, voiceRole: "READER", script: undefined }
    : { ...segment, type, voiceRole: "TEACHER", script: segment.script || "请填写讲解稿。" });
}
```

- [ ] **Step 4: Run unit test**

Run: `npm test -- tests/unit/course-structure.test.ts`

Expected: PASS.

### Task 2: Segment and JSON editor controls

**Files:**
- Modify: `src/components/admin/segment-editor.tsx`
- Modify: `src/components/admin/article-form.tsx`
- Modify: `tests/e2e/admin-editor.spec.ts`

- [ ] **Step 1: Write failing browser flow**

```ts
await page.getByRole("button", { name: "教学设计" }).click();
await page.getByRole("button", { name: "新增片段" }).click();
await page.getByLabel("片段类型").last().selectOption("ARTICLE_READ");
await page.getByLabel("映射句子 seed-rain-p01-s01").last().check();
await page.getByRole("button", { name: "保存草稿" }).click();
await expect(page.getByRole("status")).toHaveText("已保存");
```

- [ ] **Step 2: Run browser flow and observe missing controls**

Run: `npm run test:e2e -- tests/e2e/admin-editor.spec.ts`

Expected: FAIL because existing segment cards are read-only for type/mapping and cannot be added.

- [ ] **Step 3: Render mutation controls and portable JSON actions**

```tsx
<button type="button" onClick={() => onChange(addLessonSegment(draft))}>新增片段</button>
<select aria-label="片段类型" value={segment.type} onChange={(event) => onChange(setSegmentType(draft, segment.id, event.target.value as SegmentType))} />
<input aria-label={`映射句子 ${sentence.id}`} type="checkbox" checked={segment.sentenceIds.includes(sentence.id)} />
```

Export with `Blob([JSON.stringify(draft, null, 2)])`; import with `File.text()`, `validateCourse(JSON.parse(text))`, then `onChange(parsed)`.

- [ ] **Step 4: Rerun focused browser flow and schema tests**

Run: `npm run test:e2e -- tests/e2e/admin-editor.spec.ts && npm test -- tests/unit/course-structure.test.ts tests/unit/course-schema.test.ts`

Expected: PASS.

### Task 3: Persist and verify a changed course

**Files:**
- Modify: `tests/integration/article-repository.test.ts`
- Modify: `docs/handoff/ACCEPTANCE_EVIDENCE.md`

- [ ] **Step 1: Add save/reload assertion**

```ts
const changed = setSegmentSentenceIds(addLessonSegment(seedCourse), newSegmentId, ["seed-rain-p01-s01"]);
await saveArticleDraft(prisma, changed);
expect((await repository.getById(changed.article.id))?.lessonSegments).toHaveLength(9);
```

- [ ] **Step 2: Run all gates and record evidence**

Run: `npm test && npm run test:e2e && npm run course:validate -- --all && npm run lint && npm run build`

Expected: all commands exit 0.
