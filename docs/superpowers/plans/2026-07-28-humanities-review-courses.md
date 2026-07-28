# Humanities Review Courses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four duplicated review drafts with independent, sourced B1–B2 psychology and philosophy English reading courses.

**Architecture:** Keep authored course material separate from the idempotent import command in `scripts/humanities-review-courses.ts`. The command builds stable paragraph and sentence identifiers, lesson mappings, annotations, and source records from four explicit course definitions, then replaces only the four review-course rows. The existing repository continues to own transactional persistence and the existing validator remains the release gate.

**Tech Stack:** TypeScript, Prisma/SQLite, Zod, Vitest, TSX scripts.

## Global Constraints

- Write four independent English articles, each 450–600 words in six paragraphs of four sentences.
- Keep every course at `ARTICLE_DRAFT`, with no publication date, no `READY` audio, and no passed QA record.
- Use eight segments in this fixed order: opening, article read, quick explanation, article read, deep explanation, article read, context connection, final wrap.
- `ARTICLE_READ` segments contain only mapped article sentence ids; teacher segments have Chinese scripts.
- Preserve real Fish Audio as an opt-in post-review operation; do not generate audio in this task.
- Cite at least two traceable sources per course in persisted `ArticleSource` rows and leave human fact/English/teaching/audio verification pending.

---

## File Structure

- Create: `scripts/humanities-review-courses.ts` — authored course definitions, source metadata, stable-id builder, and idempotent database import.
- Modify: `scripts/create-review-courses.ts` — delegate the existing package command to the real authored importer.
- Modify: `package.json` — add a dedicated `courses:seed-humanities` command.
- Modify: `tests/unit/review-courses.test.ts` — exercise uniqueness and course-shape invariants for the four definitions.
- Modify: `docs/handoff/ACCEPTANCE_EVIDENCE.md` — record source lineage, draft state, and commands needed for verification.

### Task 1: Define authored course data and persistence

**Files:**
- Create: `scripts/humanities-review-courses.ts`
- Modify: `scripts/create-review-courses.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ArticleRepository.createCourse(input: CourseImport): Promise<ArticleRecord>` and `prisma.articleSource.createMany`.
- Produces: `export const humanitiesReviewCourses: CourseImport[]` and `export const humanitiesSources: Record<string, SourceInput[]>`.

- [ ] **Step 1: Define the four course records before persistence**

```ts
export const humanitiesReviewCourses: CourseImport[] = [
  makeCourse("review-waiting", "Why Does Waiting Feel So Long?"),
  makeCourse("review-memory", "Why Is Memory Not a Recording?"),
  makeCourse("review-quiet", "What Do We Assume When Someone Is Quiet?"),
  makeCourse("review-solitude", "What Can Solitude Make Room For?"),
];
```

Each record has 24 distinct English sentences, six contiguous paragraphs, eight ordered lesson segments, Chinese teacher scripts, and annotations whose offsets are calculated from sentence text.

- [ ] **Step 2: Persist only the four review courses and their traceable sources**

```ts
for (const course of humanitiesReviewCourses) {
  await prisma.article.delete({ where: { id: course.article.id } }).catch(() => undefined);
  await repository.createCourse(course);
  await prisma.source.create({ data: source });
  await prisma.articleSource.create({ data: { articleId: course.article.id, sourceId: source.id, relation: "FACT_CHECK" } });
}
```

Use APA Dictionary entries for reconstructive memory, misinformation effect, and fundamental attribution error; peer-reviewed PMC papers for waiting and solitude; and Stanford Encyclopedia of Philosophy entries for other minds and Thoreau. Store each source URL, publisher, title, and access note. Do not create `ArticleQa` or `AudioAsset` rows.

- [ ] **Step 3: Expose both commands**

```json
{
  "courses:create-review-set": "tsx scripts/create-review-courses.ts",
  "courses:seed-humanities": "tsx scripts/humanities-review-courses.ts"
}
```

Make `create-review-courses.ts` import and invoke the same `main` function so existing workflows seed the real courses.

- [ ] **Step 4: Run the importer against the local database**

Run: `npm run courses:seed-humanities`

Expected: Four `ARTICLE_DRAFT` courses reported, each with source rows; no Fish Audio request occurs.

- [ ] **Step 5: Commit**

```bash
git add scripts/humanities-review-courses.ts scripts/create-review-courses.ts package.json
git commit -m "feat: add authored humanities review courses"
```

### Task 2: Lock content invariants with unit tests

**Files:**
- Modify: `tests/unit/review-courses.test.ts`
- Modify: `scripts/humanities-review-courses.ts`

**Interfaces:**
- Consumes: `humanitiesReviewCourses`, `validateCourse`, and `findDuplicateCourseBodies`.
- Produces: regression tests that prevent a return to cloned bodies or malformed lesson mappings.

- [ ] **Step 1: Write invariants for all four courses**

```ts
it("ships four independent six-paragraph draft courses", () => {
  expect(humanitiesReviewCourses).toHaveLength(4);
  expect(findDuplicateCourseBodies(humanitiesReviewCourses.map(toBody))).toEqual([]);
  for (const course of humanitiesReviewCourses) {
    expect(course.article.status).toBe("ARTICLE_DRAFT");
    expect(course.paragraphs).toHaveLength(6);
    expect(course.paragraphs.every((p) => p.sentences.length === 4)).toBe(true);
    expect(wordCount(course)).toBeGreaterThanOrEqual(450);
    expect(wordCount(course)).toBeLessThanOrEqual(600);
    expect(() => validateCourse(course)).not.toThrow();
  }
});
```

- [ ] **Step 2: Run the test after adding all course data**

Run: `npm test -- tests/unit/review-courses.test.ts`

Expected: PASS with unique IDs, valid annotation offsets, mapped reads, and teacher scripts.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/review-courses.test.ts scripts/humanities-review-courses.ts
git commit -m "test: verify humanities review course invariants"
```

### Task 3: Validate the seeded dataset and hand off manual review

**Files:**
- Modify: `docs/handoff/ACCEPTANCE_EVIDENCE.md`

**Interfaces:**
- Consumes: `npm run course:validate -- --all` and the local seeded database.
- Produces: a compact review checklist naming all four articles and marking factual, English, teaching, and audio audition as pending.

- [ ] **Step 1: Add the explicit review evidence record**

```markdown
| Course | Source traceability | Fact review | English review | Teaching review | Audio audition |
| --- | --- | --- | --- | --- | --- |
| review-waiting | stored ArticleSource rows | pending | pending | pending | not generated |
| review-memory | stored ArticleSource rows | pending | pending | pending | not generated |
| review-quiet | stored ArticleSource rows | pending | pending | pending | not generated |
| review-solitude | stored ArticleSource rows | pending | pending | pending | not generated |
```

- [ ] **Step 2: Run structural and application regression gates**

Run: `npm run course:validate -- --all && npm test && npm run lint && npm run build`

Expected: all four courses validate without duplicate-body errors; test, lint, and production build pass.

- [ ] **Step 3: Commit**

```bash
git add docs/handoff/ACCEPTANCE_EVIDENCE.md
git commit -m "docs: record humanities course review evidence"
```
