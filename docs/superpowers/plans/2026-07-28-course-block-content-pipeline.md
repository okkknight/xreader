# Course Block Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace XReader's legacy guided-course generation and storage with a five-stage Markdown-final workflow and an immutable Course Block build pipeline.

**Architecture:** Course authors work in `courses/<slug>/` and produce five Markdown drafts plus a locked `final/lecture.md`. A deterministic parser anchors the final lecture to the source article, a constrained Codex labeling step assigns roles without changing text, and the build produces a Course Block JSON document with block-level audio assets. XReader reads only the built document; legacy guided-course tables and generation artifacts are removed.

**Tech Stack:** TypeScript, Next.js, Prisma/SQLite, Zod, Vitest, existing Fish Audio and browser playback infrastructure.

## Global Constraints

- The fifth-stage Markdown output is the sole teaching source of truth.
- Parsers, importers, audio builders, and the reader adapter never rewrite teaching text.
- Course blocks may contain intro, title, sentence, bridge, recap, and outro content; not every block belongs to a sentence.
- Objective engineering checks replace fixed teaching quotas, depth fields, critic thresholds, and generated teaching metadata.
- Existing public article, reader mode, progress, and feedback behavior must remain usable after the data-model replacement.
- This request authorizes removal of old course data, old workflow files, old course tables, old import scripts, and old tests that only exercise them.

---

### Task 1: Establish the Course Block domain contract

**Files:**
- Create: `src/lib/course-blocks/types.ts`
- Create: `src/lib/course-blocks/schema.ts`
- Create: `tests/unit/course-block-schema.test.ts`

**Interfaces:**
- `CourseBlock`, `CourseSegment`, `CourseDocument`, `CourseAudioMapping`.
- `courseDocumentSchema` validates ordered blocks, sentence anchors, roles, source hashes, and audio mappings.

- [x] Write failing tests for all six block types, allowed segment roles, unknown sentence anchors, and ordered block IDs.
- [x] Run the focused test and confirm failure because the new module does not exist.
- [x] Implement the minimal Zod schemas and inferred TypeScript types.
- [x] Run the focused test and confirm it passes.

### Task 2: Implement deterministic Markdown/source parsing

**Files:**
- Create: `src/lib/course-blocks/source-parser.ts`
- Create: `src/lib/course-blocks/lecture-parser.ts`
- Create: `src/lib/course-blocks/roundtrip.ts`
- Create: `tests/unit/course-block-parser.test.ts`
- Create: `tests/fixtures/course-blocks/rain-source.md`
- Create: `tests/fixtures/course-blocks/rain-final-lecture.md`

**Interfaces:**
- `parseSourceArticle(markdown): SourceArticle`.
- `anchorFinalLecture(source, finalLecture): LectureAnchors`.
- `renderCourseDocument(document): string`.
- `assertRoundTrip(document, finalLecture): void`.

- [x] Write failing tests for title, Markdown emphasis, repeated original sentences, reordered sentences, missing sentences, and altered originals.
- [x] Run the focused test and confirm the expected failures.
- [x] Implement source sentence extraction and exact normalized anchoring.
- [x] Run the focused test and confirm it passes.

### Task 3: Build the constrained semantic labeling boundary

**Files:**
- Create: `src/lib/course-blocks/semantic-labels.ts`
- Create: `tests/unit/course-block-labels.test.ts`
- Modify: `src/lib/course-generation/prompts.ts`

**Interfaces:**
- `semanticLabelSchema` accepts only ranges, source text hashes, and block/segment roles.
- `applySemanticLabels(anchors, labels)` returns a Course Block document without changing any text.
- Add the five-stage prompt registry metadata; remove the Single Master Prompt from the default registry.

- [x] Write failing tests proving labels cannot add, delete, reorder, or rewrite source text.
- [x] Implement immutable range application and `needsReview` for uncertain/uncovered ranges.
- [x] Run the focused test and confirm it passes.

### Task 4: Replace Prisma course storage

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260728230000_replace_guided_course_with_course_documents/migration.sql`
- Create: `src/lib/db/course-document-repository.ts`
- Create: `tests/integration/course-document-repository.test.ts`
- Delete: `src/lib/course-generation/codex-persistence.ts`
- Delete: `src/lib/course-generation/single-master.ts`
- Delete: `src/lib/course-generation/single-master-prompt.ts`

**Interfaces:**
- Add `CourseDocument` with source/final Markdown hashes, built JSON, status, and `needsReview` report.
- Add `CourseBlockAudio` with block IDs, path, duration, status, and script hash.
- `CourseDocumentRepository.importBuiltCourse(document)` persists only validated built documents.

- [ ] Write failing integration tests for import, round-trip mismatch rejection, and block audio mapping.
- [x] Replace old guided-course/generation models with the new document/audio models and repository.
- [x] Implement repository persistence and run the focused integration tests.

### Task 5: Replace public query and reader playback with Course Blocks

**Files:**
- Modify: `src/types/public-article.ts`
- Modify: `src/server/articles/public-query.ts`
- Modify: `src/features/reader/queue.ts`
- Modify: `src/components/reader/article-reader.tsx`
- Modify: `src/components/reader/current-lesson-panel.tsx`
- Modify: `src/types/playback.ts`
- Create: `tests/unit/course-block-queue.test.ts`
- Modify: `tests/integration/public-api.test.ts`
- Modify: `tests/e2e/reader.spec.ts`

**Interfaces:**
- Public articles expose ordered `courseBlocks` and `courseAudio`, while source paragraphs/sentences remain available for the reading canvas.
- Guided playback queues block IDs and sentence anchors, including blocks without sentence anchors.

- [ ] Write failing queue tests for intro/title/sentence/bridge/recap/outro ordering and block-level audio.
- [x] Implement public projection and queue behavior without depth/guide fields.
- [x] Update the reader panel to render block text/segments and preserve mode switching, progress, auto-follow, and sentence selection.
- [ ] Run integration and E2E reader tests after a fresh database/course package exists.

### Task 6: Replace import/audio/validation scripts with filesystem course commands

**Files:**
- Create: `scripts/course-new.ts`
- Create: `scripts/course-build.ts`
- Create: `scripts/course-audio.ts`
- Create: `scripts/course-import.ts`
- Modify: `scripts/validate-course.ts`
- Modify: `scripts/generate-audio.ts`
- Modify: `package.json`
- Create: `courses/why-rain-has-a-smell/source/article.md`
- Create: `courses/why-rain-has-a-smell/prompts/README.md`
- Create: `courses/why-rain-has-a-smell/final/lecture.md`
- Create: `courses/why-rain-has-a-smell/build/.gitkeep`

**Interfaces:**
- `npm run course:new -- <slug>` creates the filesystem package.
- `npm run course:build -- <slug>` parses and validates `final/lecture.md` into `build/course.json` and `build/parse-report.json`.
- `npm run course:audio -- <slug>` generates block audio without modifying lecture text.
- `npm run course:import -- <slug>` imports the built document into Prisma.

- [ ] Add command tests for missing final lecture, parse failure, successful build, and import refusal on `needsReview`.
- [ ] Move the rain source/final lecture into the new course package without keeping the old seed-course generator.
- [x] Replace the old `db:seed`, `courses:seed-humanities`, and paragraph-guide audio assumptions.
- [ ] Run the complete filesystem-to-database pipeline on the rain sample.

### Task 7: Remove legacy course data, files, migrations, and tests

**Files:**
- Delete: `scripts/seed-course.ts`, `scripts/seed.ts`, `scripts/humanities-review-courses.ts`, `scripts/create-review-courses.ts`
- Delete: `src/lib/validation/course-schema.ts`, legacy QA modules, and legacy course-generation modules
- Delete: `ParagraphGuide`, `SentenceGuide`, `CourseScriptGeneration`, `ArticleQa` and related Prisma migrations
- Delete: tests that only assert legacy guides, generation jobs, depth quotas, or old admin/course workflows
- Delete: local `data/xreader.db`, `data/test.db`, and old course audio after verifying the new import pipeline

- [x] Search for every deleted symbol and remove remaining references.
- [x] Apply a clean database schema from scratch, including pre-creating the SQLite target file for this local Prisma runtime.
- [x] Verify no old workflow file or old course table remains in source/schema/migrations.

### Task 8: Documentation and end-to-end verification

**Files:**
- Modify: `PROJECT_CONTEXT.md`
- Replace: `docs/handoff/CODEX_WORKFLOW.md`
- Replace: `docs/handoff/COURSE_IMPORT.md`
- Replace: `docs/handoff/COURSE_SCRIPT_GENERATION.md`
- Modify: `docs/handoff/README.md`
- Create: `docs/COURSE_BLOCKS.md`

- [x] Document the five-stage filesystem workflow, parser invariants, build commands, audio boundaries, and manual review gate.
- [x] Run `npm test`, integration tests, typecheck, and `npm run build`; reader E2E remains pending a new Course Block fixture.
- [ ] Verify the public article API contains no legacy guide fields and the reader plays every course block in order.
- [ ] Review `git diff --check` and report any remaining unverified external audio/public deployment gate.
