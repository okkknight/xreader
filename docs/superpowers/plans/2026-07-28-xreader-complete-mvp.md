# XReader Complete MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete local XReader MVP: public guided/reading experience, protected editor, real Fish Audio, structured production pipeline, QA and publishing.

**Architecture:** Next.js App Router composes route-level UI only. Focused feature modules own browser playback and editor state; server use cases own business rules; Prisma repositories own persistence; Fish/LLM adapters are isolated from domain code. Audio assets are versioned local files linked to sentence or lesson-segment records.

**Tech Stack:** Next.js App Router, TypeScript, React, Prisma, SQLite, Zod, Vitest, Playwright, Fish Audio HTTP API, FFmpeg/ffprobe.

## Global Constraints

- Keep page components free of Prisma, API keys, queue derivation and audio-element lifecycle logic.
- Keep stable paragraph, sentence and lesson-segment IDs; never use text as an identifier.
- Use `s2.1-pro-free`, WAV, 44.1kHz mono, one concurrent Fish request, retryable HTTP handling and a hash-addressed cache.
- Teacher default: `76fcd904aa4b4a47af107686abd68248`; reader default: `7491491700cd43b1a551d5efb4dca9c7`; all voice choices stay in server configuration.
- Generate new audio into a new version directory; never overwrite an approved version.
- Only `QA_PASSED` articles may be published; public queries must never expose drafts, prompts, source notes or editorial notes.
- Preserve human edits when AI generation fails or reruns.
- Current workspace has no Git repository. Run the listed verification commands after each task; create source-control commits only after the user initializes Git.

---

## File Structure

```text
src/
  app/{page,archive,articles/[slug],admin,api}/
  components/{reader,player,admin,ui}/
  features/reader/{playback-reducer,queue,progress,auto-follow,audio-controller}.ts
  features/admin/{article-draft,segment-editor}.ts
  lib/{db,audio,ai,validation,auth}/
  server/{articles,audio,generation,publishing}/
  types/{article,playback,api}.ts
prisma/schema.prisma
scripts/{seed,validate-course,generate-audio}.ts
data/{audio,audio-cache,exports,backups}/
tests/{unit,integration,e2e}/
```

### Task 1: Initialize a tested application shell

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `.gitignore`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/ui/app-shell.tsx`
- Create: `tests/unit/app-shell.test.tsx`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Produces `AppShell({ children }: { children: ReactNode }): JSX.Element`.
- Produces scripts: `dev`, `build`, `lint`, `test`, `test:e2e`, `db:migrate`, `db:seed`, `course:validate`, `audio:generate`.

- [ ] **Step 1: Write the initial shell test**

```tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/ui/app-shell";

it("renders product identity and supplied children", () => {
  render(<AppShell><p>content</p></AppShell>);
  expect(screen.getByRole("banner")).toHaveTextContent("XReader");
  expect(screen.getByText("content")).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- tests/unit/app-shell.test.tsx`

Expected: failure because the application and `AppShell` do not exist.

- [ ] **Step 3: Create the Next.js project files and minimal AppShell**

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  return <div><header aria-label="XReader">XReader</header><main>{children}</main></div>;
}
```

Add a root page containing a labelled loading-free Today section, configure `@/*` imports, CSS reset/tokens, Vitest jsdom setup and a Playwright base URL.

- [ ] **Step 4: Verify shell and browser load**

Run: `npm run lint && npm run test -- tests/unit/app-shell.test.tsx && npm run build`

Then run `npm run dev` and execute `npm run test:e2e -- tests/e2e/home.spec.ts`; assert the title, product header and main landmark.

### Task 2: Model persisted course content and create deterministic seed data

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db/client.ts`, `src/lib/db/article-repository.ts`, `src/types/article.ts`
- Create: `scripts/seed.ts`, `scripts/seed-course.ts`, `tests/integration/article-repository.test.ts`
- Modify: `package.json`, `.env.example`

**Interfaces:**
- Produces `ArticleRepository.getBySlug(slug): Promise<ArticleRecord | null>`.
- Produces `ArticleRepository.createCourse(input: CourseImport): Promise<ArticleRecord>`.
- `CourseImport` contains article metadata, ordered paragraphs/sentences, lesson segments and annotations.

- [ ] **Step 1: Write repository tests before schema implementation**

```ts
it("persists stable sentence IDs and ordered segments", async () => {
  const article = await repository.createCourse(seedCourse);
  const loaded = await repository.getBySlug(article.slug);
  expect(loaded?.paragraphs[0].sentences[0].id).toBe("seed-rain-p01-s01");
  expect(loaded?.lessonSegments.map((segment) => segment.order)).toEqual([1, 2, 3]);
});
```

- [ ] **Step 2: Run the test against an empty temporary SQLite database**

Run: `DATABASE_URL=file:./data/test.db npm run test -- tests/integration/article-repository.test.ts`

Expected: failure because Prisma schema and repository do not exist.

- [ ] **Step 3: Implement schema, repository and one complete seed course**

Define Article, Paragraph, Sentence, Source, ArticleSource, ArticleAnalysis, LessonPlan, LessonSegment, Annotation, AudioAsset, GenerationJob and ArticleFeedback. Include enums from the approved design. Enforce unique `(articleId, order)` and `(paragraphId, order)` constraints. Seed a 6-paragraph, 20+ sentence course with 8+ segments and explicit stable IDs.

- [ ] **Step 4: Verify migration, seed and repository behavior**

Run: `npm run db:migrate && npm run db:seed && npm run test -- tests/integration/article-repository.test.ts`

Expected: migration and seed succeed; the test verifies sentence and segment ordering.

### Task 3: Implement domain validation, state transitions, import/export and QA rules

**Files:**
- Create: `src/lib/validation/course-schema.ts`, `src/lib/validation/qa.ts`, `src/server/publishing/article-state.ts`, `src/server/articles/course-transfer.ts`
- Create: `tests/unit/course-schema.test.ts`, `tests/unit/qa.test.ts`, `tests/unit/article-state.test.ts`

**Interfaces:**
- Produces `validateCourse(input): ValidatedCourse` or a Zod error.
- Produces `evaluateQa(course): QaResult` with `blockingIssues` and `warnings`.
- Produces `transitionArticle(current, next): ArticleStatus` or a domain error.

- [ ] **Step 1: Write failing invariant tests**

```ts
expect(() => validateCourse({ ...course, lessonSegments: [{ type: "ARTICLE_READ", sentenceIds: [] }] })).toThrow();
expect(evaluateQa(courseWithStaleAudio).blockingIssues).toContain("STALE_AUDIO");
expect(() => transitionArticle("SCRIPTED", "PUBLISHED")).toThrow("QA_PASSED");
```

- [ ] **Step 2: Run the focused tests**

Run: `npm run test -- tests/unit/course-schema.test.ts tests/unit/qa.test.ts tests/unit/article-state.test.ts`

Expected: failure because validation and transition functions do not exist.

- [ ] **Step 3: Implement schemas and pure domain rules**

Validate unique IDs, contiguous segment order, existing sentence references, nonempty `ARTICLE_READ`, scripts on teacher segments, safe relative audio paths and JSON export/import compatibility. Implement the full article state machine and QA ranges for pauses, deep explanations, expressions, duration, source/lineage and ready audio.

- [ ] **Step 4: Verify all domain invariants**

Run: `npm run test -- tests/unit/course-schema.test.ts tests/unit/qa.test.ts tests/unit/article-state.test.ts`

Expected: passing tests for invalid imports, stale assets and blocked publishing.

### Task 4: Build the Fish Audio adapter, cache, storage and version lineage

**Files:**
- Create: `src/lib/audio/types.ts`, `src/lib/audio/fish-provider.ts`, `src/lib/audio/cache.ts`, `src/lib/audio/storage.ts`, `src/lib/audio/manifest.ts`, `src/server/audio/generate-asset.ts`
- Create: `tests/unit/fish-provider.test.ts`, `tests/unit/audio-cache.test.ts`, `tests/integration/generate-asset.test.ts`
- Modify: `.env.example`, `package.json`

**Interfaces:**
- `TTSProvider.synthesize(input: SynthesisInput): Promise<SynthesisResult>`.
- `generateAudioAsset(input: GenerateAssetInput): Promise<AudioAssetRecord>`.
- `invalidateAssetsForText(ownerId, previousHash, nextHash): Promise<number>`.

- [ ] **Step 1: Write provider and storage tests**

```ts
it("retries a 429 then returns audio bytes", async () => {
  const provider = new FishProvider({ fetch: mockedFetch });
  await expect(provider.synthesize(input)).resolves.toEqual(expect.objectContaining({ bytes: expect.any(Uint8Array) }));
  expect(mockedFetch).toHaveBeenCalledTimes(2);
});

it("writes a new version without replacing the previous manifest", async () => {
  const first = await storage.writeVersion(owner, wav, metadata);
  const second = await storage.writeVersion(owner, wav, metadata);
  expect(second.versionId).not.toBe(first.versionId);
});
```

- [ ] **Step 2: Run tests to verify failures**

Run: `npm run test -- tests/unit/fish-provider.test.ts tests/unit/audio-cache.test.ts tests/integration/generate-asset.test.ts`

Expected: failure because provider, cache and version storage are absent.

- [ ] **Step 3: Implement Fish and local audio services**

Use `FISH_AUDIO_API_KEY`, `FISH_AUDIO_MODEL`, `FISH_TEACHER_REFERENCE_ID`, `FISH_READER_REFERENCE_ID` and `AUDIO_STORAGE_DIR`. Send one request at a time; retry only 429/500/502/503/504 and network/timeout errors. Include model/reference/text/prosody in SHA-256 cache keys. Persist WAV under the version directory, create manifest/timeline, run FFmpeg normalization and ffprobe duration extraction, then upsert an `AudioAsset` with `READY` state.

- [ ] **Step 4: Verify mocked failures and real-tool prerequisites**

Run: `npm run test -- tests/unit/fish-provider.test.ts tests/unit/audio-cache.test.ts tests/integration/generate-asset.test.ts && ffmpeg -version && ffprobe -version`

Expected: retry, cache and non-overwrite checks pass; FFmpeg tooling is available before real calls.

### Task 5: Implement provider-neutral AI generation and durable pipeline jobs

**Files:**
- Create: `src/lib/ai/provider.ts`, `src/lib/ai/openai-compatible-provider.ts`, `src/lib/ai/prompts/*.ts`, `src/server/generation/job-service.ts`, `src/server/generation/pipeline.ts`
- Create: `tests/unit/job-service.test.ts`, `tests/unit/pipeline.test.ts`

**Interfaces:**
- `LLMProvider.generateStructured<T>(request): Promise<T>`.
- `runPipelineStep(articleId, step: PipelineStep): Promise<GenerationJobRecord>`.
- `promotePipelineOutput(articleId, step, jobId): Promise<void>`.

- [ ] **Step 1: Write failing job preservation tests**

```ts
it("keeps the prior promoted article when a replacement generation fails", async () => {
  await jobs.promote(article.id, "ARTICLE_WRITER", successfulJob.id);
  await expect(jobs.run(article.id, "ARTICLE_WRITER")).rejects.toThrow("provider down");
  expect((await repository.getById(article.id))?.bodyText).toBe(successfulJob.output.article.bodyText);
});
```

- [ ] **Step 2: Run the pipeline tests**

Run: `npm run test -- tests/unit/job-service.test.ts tests/unit/pipeline.test.ts`

Expected: failure because jobs and provider interfaces are absent.

- [ ] **Step 3: Implement the pipeline in explicit steps**

Define `FACT_CARD`, `ARTICLE_WRITER`, `ARTICLE_EDITOR`, `SENTENCE_SPLITTER`, `ARTICLE_ANALYZER`, `TEACHING_DIRECTOR`, `SCRIPT_WRITER`, `SCRIPT_EDITOR` and `QA_REVIEW`. Version each prompt; store hash, model, input, parsed output, attempts and errors. Validate every structured output with the course schemas. Promotion is explicit and marks downstream records/audio stale when text changes.

- [ ] **Step 4: Verify failed/retried/promoted paths**

Run: `npm run test -- tests/unit/job-service.test.ts tests/unit/pipeline.test.ts`

Expected: all pipeline behavior is deterministic under fake providers.

### Task 6: Build public article queries, media delivery, feedback and publishing visibility

**Files:**
- Create: `src/server/articles/public-query.ts`, `src/server/publishing/publish-service.ts`, `src/app/api/articles/today/route.ts`, `src/app/api/articles/[slug]/route.ts`, `src/app/api/articles/[id]/feedback/route.ts`, `src/app/api/media/[assetId]/route.ts`
- Create: `tests/integration/public-api.test.ts`, `tests/integration/publish-service.test.ts`

**Interfaces:**
- `getTodayArticle(now): Promise<PublicArticle | null>`.
- `getPublicArticle(slug, now): Promise<PublicArticle | null>`.
- `publishArticle(articleId, at): Promise<void>` and `withdrawArticle(articleId): Promise<void>`.

- [ ] **Step 1: Write public-boundary tests**

```ts
expect((await getPublicArticle("draft-course", now))).toBeNull();
expect(await getTodayArticle(now)).toMatchObject({ slug: "published-course" });
expect(JSON.stringify(await getPublicArticle("published-course", now))).not.toContain("promptVer");
```

- [ ] **Step 2: Run tests before implementation**

Run: `npm run test -- tests/integration/public-api.test.ts tests/integration/publish-service.test.ts`

Expected: failure because public query and publishing services are absent.

- [ ] **Step 3: Implement visibility, feedback and Range media response**

Select only visible `PUBLISHED` and due `SCHEDULED` content. Refuse publishing with QA blocks or missing current audio. Deliver media only from approved `AudioAsset` paths and support byte ranges with `206`, `Content-Range` and `Accept-Ranges`. Store anonymous feedback with a generated client session ID.

- [ ] **Step 4: Verify visibility and media protocol**

Run: `npm run test -- tests/integration/public-api.test.ts tests/integration/publish-service.test.ts`

Expected: drafts stay private, withdrawing hides content and a byte-range response is valid.

### Task 7: Implement playback and progress as isolated reader features

**Files:**
- Create: `src/features/reader/queue.ts`, `src/features/reader/playback-reducer.ts`, `src/features/reader/progress.ts`, `src/features/reader/audio-controller.ts`, `src/features/reader/auto-follow.ts`, `src/types/playback.ts`
- Create: `tests/unit/queue.test.ts`, `tests/unit/playback-reducer.test.ts`, `tests/unit/progress.test.ts`, `tests/unit/auto-follow.test.ts`

**Interfaces:**
- `buildGuidedQueue(article): PlaybackItem[]`; `buildReadingQueue(article): PlaybackItem[]`.
- `playbackReducer(state, action): PlaybackState`.
- `mapSentenceToGuidedSegment(sentenceId, segments): string | undefined`.
- `createProgressStore(storage): ProgressStore`.

- [ ] **Step 1: Write queue/reducer tests**

```ts
expect(mapSentenceToGuidedSegment("seed-rain-p02-s01", segments)).toBe("seed-rain-seg-03");
expect(playbackReducer(initial, { type: "USER_SCROLLED_AWAY" }).autoFollow).toBe(false);
expect(progress.load(articleId)?.readingSentenceId).toBe("seed-rain-p01-s02");
```

- [ ] **Step 2: Run focused reader tests**

Run: `npm run test -- tests/unit/queue.test.ts tests/unit/playback-reducer.test.ts tests/unit/progress.test.ts tests/unit/auto-follow.test.ts`

Expected: failure because reader feature modules are absent.

- [ ] **Step 3: Implement pure state and browser adapters**

Derive all queue items from stable IDs and ready assets. Keep guided and reading times separately. Make the audio controller own one `HTMLAudioElement`, queue advancement, seek and rate; expose events to the reducer. Make auto-follow calculate a 30–40% safe viewport band and restore only on explicit user action.

- [ ] **Step 4: Verify mapped playback behavior**

Run: `npm run test -- tests/unit/queue.test.ts tests/unit/playback-reducer.test.ts tests/unit/progress.test.ts tests/unit/auto-follow.test.ts`

Expected: tests prove mode mapping, manual-scroll suppression and durable progress.

### Task 8: Compose responsive public reader routes and real interactions

**Files:**
- Create: `src/app/archive/page.tsx`, `src/app/articles/[slug]/page.tsx`, `src/components/reader/{today-card,article-reader,article-body,annotation-popover,mode-switch}.tsx`, `src/components/player/{player-bar,guided-subtitle}.tsx`
- Modify: `src/app/page.tsx`, `src/app/globals.css`
- Create: `tests/e2e/reader.spec.ts`, `tests/e2e/reader-mobile.spec.ts`

**Interfaces:**
- `ArticleReader({ article }: { article: PublicArticle }): JSX.Element` consumes reader feature hooks only.
- `PlayerBar({ state, dispatch, controller }): JSX.Element` has labelled play/pause, seek and speed controls.

- [ ] **Step 1: Write browser behavior tests**

```ts
await page.goto("/articles/seed-rain");
await page.getByRole("button", { name: "开始讲解" }).click();
await expect(page.locator("[data-sentence-id='seed-rain-p01-s01']")).toHaveAttribute("data-active", "true");
await page.getByRole("button", { name: "阅读模式" }).click();
await expect(page.getByRole("button", { name: "回到当前讲解" })).toBeHidden();
```

- [ ] **Step 2: Run E2E to verify failure**

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts tests/e2e/reader-mobile.spec.ts`

Expected: failure because public reader pages/components are absent.

- [ ] **Step 3: Implement accessible public UI**

Add Today, archive, article metadata, guided/reading switching, sentence buttons, temporary Chinese/annotation popovers, fixed bottom player, subtitles, end-state feedback and mobile-safe spacing. Use semantic landmarks, keyboard playback, readable labels and reduced-motion styling. Do not default-render translations.

- [ ] **Step 4: Verify desktop and mobile reader workflow**

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts tests/e2e/reader-mobile.spec.ts && npm run build`

Expected: E2E proves mode switch, active highlight, progress restore and mobile controls without obscuring text.

### Task 9: Implement protected admin auth and modular course editing

**Files:**
- Create: `src/lib/auth/admin-session.ts`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/app/admin/articles/[id]/page.tsx`
- Create: `src/components/admin/{article-form,source-editor,sentence-editor,segment-editor,editor-tabs}.tsx`, `src/features/admin/{article-draft,segment-editor}.ts`
- Create: `src/app/api/admin/articles/route.ts`, `src/app/api/admin/articles/[id]/route.ts`, `tests/integration/admin-auth.test.ts`, `tests/e2e/admin-editor.spec.ts`

**Interfaces:**
- `requireAdmin(request): Promise<AdminSession>`.
- `saveArticleDraft(input: ArticleDraftInput): Promise<ArticleRecord>`.
- `reorderSegments(articleId, orderedIds): Promise<LessonSegmentRecord[]>`.

- [ ] **Step 1: Write authorization/editor tests**

```ts
await expect(requestAsAnonymous("POST", "/api/admin/articles")).resolves.toMatchObject({ status: 401 });
expect(await reorderSegments(article.id, ["seg-2", "seg-1"])).toMatchObject([{ order: 1, id: "seg-2" }]);
```

- [ ] **Step 2: Run failing admin tests**

Run: `npm run test -- tests/integration/admin-auth.test.ts && npm run test:e2e -- tests/e2e/admin-editor.spec.ts`

Expected: failure because protected routes and editor modules are absent.

- [ ] **Step 3: Implement session guard and five-panel editor**

Read `ADMIN_PASSWORD` only server-side, issue an httpOnly session cookie, and validate every mutation. Build Article, Analysis, Teaching Design, Script and Audio/Publish panels with focused components. Support source CRUD, sentence editing that preserves IDs where possible, explicit remapping when IDs change, segment add/delete/reorder/mapping and JSON import/export.

- [ ] **Step 4: Verify protection and editing**

Run: `npm run test -- tests/integration/admin-auth.test.ts && npm run test:e2e -- tests/e2e/admin-editor.spec.ts`

Expected: anonymous mutation is rejected; an authorized editor can edit/reorder and preview a course.

### Task 10: Connect admin generation, audio, QA, scheduling and withdrawal panels

**Files:**
- Create: `src/app/api/admin/articles/[id]/generate/route.ts`, `src/app/api/admin/articles/[id]/audio/route.ts`, `src/app/api/admin/articles/[id]/qa/route.ts`, `src/app/api/admin/articles/[id]/publish/route.ts`
- Create: `src/components/admin/{generation-panel,audio-panel,qa-panel,publish-panel}.tsx`
- Create: `tests/integration/admin-workflow.test.ts`, `tests/e2e/admin-publish.spec.ts`

**Interfaces:**
- `runPipelineStep(articleId, step)` from Task 5.
- `generateAudioAsset(input)` from Task 4.
- `evaluateQa(course)` from Task 3.
- `publishArticle(articleId, at)` and `withdrawArticle(articleId)` from Task 6.

- [ ] **Step 1: Write failing workflow tests**

```ts
expect((await requestAdminPublish(article.id)).status).toBe(422);
await markHumanChecks(article.id, allChecks);
await createReadyAssets(article.id);
await expect(requestAdminPublish(article.id)).resolves.toMatchObject({ status: 200 });
```

- [ ] **Step 2: Run the workflow tests**

Run: `npm run test -- tests/integration/admin-workflow.test.ts && npm run test:e2e -- tests/e2e/admin-publish.spec.ts`

Expected: failure because generation/audio/QA/publish endpoints and UI are absent.

- [ ] **Step 3: Implement controlled production and release UI**

Expose one pipeline step per explicit admin command; show job status/input hash/errors without exposing keys. Generate one asset or all stale assets, keep previous ready audio after failures, display manifest metadata and audition controls. Render automated QA plus required human checks. Permit schedule, publish and withdraw only through the publish service.

- [ ] **Step 4: Verify blocked and successful release paths**

Run: `npm run test -- tests/integration/admin-workflow.test.ts && npm run test:e2e -- tests/e2e/admin-publish.spec.ts`

Expected: QA blocks publication until all required state is ready; withdraw removes public visibility.

### Task 11: Produce real Fish samples, verify audio lineage and promote seed courses

**Files:**
- Create: `scripts/generate-audio.ts`, `scripts/validate-course.ts`, `scripts/audition-voices.ts`
- Modify: `scripts/seed.ts`, `PROJECT_CONTEXT.md`
- Create: `tests/integration/audio-lineage.test.ts`

**Interfaces:**
- `npm run audio:generate -- --article <slug> --owner <id>`.
- `npm run audio:audition -- --text <path>`.
- `npm run course:validate -- --article <slug>`.

- [ ] **Step 1: Write lineage validation test**

```ts
it("rejects an asset whose manifest script hash differs from its owner text hash", async () => {
  await expect(validateAudioLineage(assetWithWrongHash)).rejects.toThrow("script_sha256");
});
```

- [ ] **Step 2: Run test before implementing validation script**

Run: `npm run test -- tests/integration/audio-lineage.test.ts`

Expected: failure because lineage validation and CLI commands are absent.

- [ ] **Step 3: Implement CLI verification and execute two short auditions**

Generate distinct short English samples for teacher and reader roles using the configured references. Check `ffprobe` codec/sample rate/channels, manifest/timeline hash binding, file existence and audio status. Record the chosen candidate and parameters in `PROJECT_CONTEXT.md`; retain both audition versions.

- [ ] **Step 4: Generate real seed-course audio and verify it**

Run: `npm run audio:audition -- --text scripts/voice-audition.txt && npm run audio:generate -- --article seed-rain && npm run course:validate -- --article seed-rain && npm run test -- tests/integration/audio-lineage.test.ts`

Expected: real WAVs, valid manifests/timelines, ready database assets and no stale-lineage violations.

### Task 12: Run the full acceptance suite and create five reviewable courses

**Files:**
- Create: `scripts/create-review-courses.ts`, `tests/e2e/acceptance.spec.ts`, `docs/handoff/ACCEPTANCE_EVIDENCE.md`
- Modify: `PROJECT_CONTEXT.md`, `docs/handoff/CHANGELOG.md`

**Interfaces:**
- `npm run courses:create-review-set` creates five independently reviewable draft courses from structured imports.
- `npm run test:e2e -- tests/e2e/acceptance.spec.ts` exercises public and admin critical flows.

- [ ] **Step 1: Write end-to-end acceptance tests**

```ts
test("editor publishes a QA-passed course and public user completes both modes", async ({ page }) => {
  await adminPublishSeedCourse(page);
  await page.goto("/");
  await page.getByRole("link", { name: /seed rain/i }).click();
  await completeGuidedAndReadingFlows(page);
  await expect(page.getByText("今天的讲解到这里")).toBeVisible();
});
```

- [ ] **Step 2: Run acceptance test to verify gaps**

Run: `npm run test:e2e -- tests/e2e/acceptance.spec.ts`

Expected: initial failures identify any unfinished cross-module contract.

- [ ] **Step 3: Repair only failures that violate the approved design and seed five courses**

Use structured imports to create five courses, then manually review source facts, English, teaching choices, generated audio and mobile preview for each. Keep review notes in `docs/handoff/ACCEPTANCE_EVIDENCE.md`; do not mark a course QA-passed solely from automated checks.

- [ ] **Step 4: Run release-level verification**

Run: `npm run lint && npm run test && npm run build && npm run test:e2e && npm run course:validate -- --all`

Start the production server, verify `/`, `/archive`, one published article, admin authorization, feedback, desktop/mobile layouts and an audio `Range: bytes=0-999` response. Record exact command outputs, test counts and real-audio sample identifiers in `docs/handoff/ACCEPTANCE_EVIDENCE.md`.

## Plan self-review

- Spec coverage: Tasks 1–2 establish runtime/data; Tasks 3 and 6 enforce content and publication contracts; Tasks 4–5 cover Fish/LLM adapters; Tasks 7–8 cover the public reader; Tasks 9–10 cover admin; Tasks 11–12 cover real audio and complete acceptance.
- Placeholder scan: no deferred implementation language is used; every task names files, interfaces, tests and verification commands.
- Type consistency: `ArticleRepository`, `TTSProvider`, `LLMProvider`, `GenerationJob`, `AudioAsset`, `evaluateQa`, `publishArticle` and `PlaybackState` retain the same names through dependent tasks.
