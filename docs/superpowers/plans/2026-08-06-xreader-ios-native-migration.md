# XReader Native iOS Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an iOS 17+ SwiftUI XReader app that preserves the current Web product’s functionality, UI, and interaction semantics while consuming remotely published, read-only courses without an admin publishing system.

**Architecture:** Keep `xreader` as the course-authoring, SQLite, public Web, and VPS deployment repository. Add a separate `xreader-ios` repository that consumes a versioned `/api/v1` catalog/detail/media contract and stores downloaded courses locally. The iOS app owns native rendering, progress, offline storage, and AVFoundation playback; it never reads SQLite, filesystem audio paths, or server secrets.

**Tech Stack:** Existing TypeScript/Next.js/Prisma/SQLite/Vitest Web stack; new Swift 6, SwiftUI, Swift Package Manager, AVFoundation, XCTest/XCUITest iOS stack.

## Global Constraints

- Minimum deployment target is iOS 17; use Swift 6 and SwiftUI, not WKWebView.
- Preserve every current Web user feature, UI hierarchy, Chinese copy, and interaction semantic unless a separate product decision changes it.
- The Web repository remains independently deployable. iOS code, build artifacts, simulator data, signing files, and secrets must never be synchronized to the Web VPS.
- The App uses only published/scheduled-and-due content exposed by `/api/v1`; no Prompt, source notes, private path, AI credential, or unpublished record may enter an API response.
- Course IDs, slugs, block IDs, sentence IDs, audio IDs, cue offsets, and MP3 duration are immutable cross-platform contract fields.
- Guided playback must merge and deduplicate `segments[].sourceSentenceIds`, `sentenceIds`, and legacy `sentenceId`; it must not lose a sentence in a multi-sentence block.
- Release content through a private checked command; do not implement a CMS, a public publishing endpoint, an App publishing control, user upload, or automatic generation-to-publication.
- Keep first release anonymous: local progress only, no login, subscription, social, runtime LLM, or Fish Audio calls from iOS.
- Each implementation task is committed only after the user authorizes commits; until then, retain the task checkpoint as an uncommitted, reviewable diff.

---

## File Structure

### Existing `xreader` repository

| Path | Responsibility after this plan |
| --- | --- |
| `src/server/articles/public-query.ts` | Existing public projection; becomes the single adapter used by old and v1 routes |
| `src/app/api/v1/catalog/route.ts` | New stable catalog endpoint |
| `src/app/api/v1/articles/[slug]/route.ts` | New stable course-detail endpoint |
| `src/app/api/v1/media/[assetId]/route.ts` | New stable Range-compatible media endpoint |
| `src/server/articles/v1-contract.ts` | Versioned DTO mapping and response validators; never exposes Prisma records directly |
| `src/lib/release/publish-course.ts` | Pure release-plan builder for one checked course package |
| `scripts/publish-course.ts` | Private CLI that stages, verifies, then installs a single course release |
| `tests/fixtures/course-blocks/multi-sentence-course.json` | A real multi-sentence Course Block fixture used by Web and exported for iOS tests |
| `tests/integration/v1-public-api.test.ts` | Contract, visibility, and media tests |

### New `xreader-ios` repository

| Path | Responsibility |
| --- | --- |
| `XReader.xcodeproj` | App target, iOS 17 deployment, bundle/version/signing configuration |
| `Packages/XReaderCore` | Sendable models, schema decoding, stable identity and queue mapping |
| `Packages/XReaderNetworking` | `/api/v1` client and error mapping |
| `Packages/XReaderContent` | Catalog/detail cache, downloads, checksum and disk-budget policy |
| `Packages/XReaderProgress` | Device-local position and completion persistence |
| `Packages/XReaderAudio` | AVFoundation playback state machine, cues, remote commands, interruption handling |
| `Packages/XReaderDesignSystem` | Current Web tokens expressed as adaptive SwiftUI styles |
| `Packages/XReaderFeatures` | Today, Archive, Reader, Download and Settings screens |
| `XReaderApp/PrivacyInfo.xcprivacy` | App privacy manifest |
| `XReaderAppTests` / `XReaderUITests` | Contract fixtures, playback state, screen parity and device interaction coverage |

## Task 1: Freeze the Web behavior and multi-sentence contract baseline

**Files:**
- Create: `tests/fixtures/course-blocks/multi-sentence-course.json`
- Create: `tests/fixtures/public-articles/multi-sentence-article.json`
- Modify: `tests/unit/queue.test.ts`
- Modify: `tests/unit/highlight-cues.test.ts`
- Create: `tests/e2e/reader-multi-sentence.spec.ts`
- Create: `docs/ios-parity/WEB_BASELINE.md`
- Create: `docs/ios-parity/screenshots/.gitkeep`

**Interfaces:**
- `buildGuidedQueue(blocks)` returns items whose `sentenceIds` include every source sentence referenced by a block.
- `activeSentenceIdAtTime(cues, timeMs, fallbackSentenceId)` selects the active sentence for the cue time.
- The multi-sentence fixture contains one READY MP3 block with `sentenceIds: ["p01-s01", "p01-s02"]`, cues for both sentences, and a public article containing those IDs.

- [ ] **Step 1: Write focused failing queue and cue tests.**

```ts
it("keeps every source sentence for a multi-sentence guided block", () => {
  const queue = buildGuidedQueue(multiSentenceBlocks);
  expect(queue).toEqual([expect.objectContaining({
    id: "block-bridge-01",
    sentenceIds: ["p01-s01", "p01-s02"],
  })]);
});

it("moves the active sentence when a later cue belongs to the second source sentence", () => {
  expect(activeSentenceIdAtTime(multiSentenceCues, 3_100, "p01-s01")).toBe("p01-s02");
});
```

- [ ] **Step 2: Run the focused tests and confirm the fixture or contract is missing.**

Run: `npm test -- tests/unit/queue.test.ts tests/unit/highlight-cues.test.ts`

Expected: FAIL until the new fixture imports and expected queue data exist.

- [ ] **Step 3: Add the deterministic fixture and only the test helpers necessary to load it.**

```json
{
  "id": "block-bridge-01",
  "type": "bridge",
  "sentenceIds": ["p01-s01", "p01-s02"],
  "segments": [{ "sourceSentenceIds": ["p01-s01", "p01-s02"] }],
  "audioStatus": "READY",
  "audioPath": "/api/media/multi-sentence-audio",
  "highlightCues": []
}
```

- [ ] **Step 4: Add the browser test for the full chain.**

```ts
test("a multi-sentence block highlights its second source sentence during playback", async ({ page }) => {
  await page.goto("/articles/multi-sentence-fixture");
  await page.getByRole("button", { name: "播放" }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("xreader-test-second-cue")));
  await expect(page.locator('[data-sentence-id="p01-s02"]')).toHaveAttribute("data-active", "true");
});
```

- [ ] **Step 5: Capture the current Web parity baseline.**

Document exact routes, viewport sizes, initial/loading/offline/playing/completed states, and screenshots in `docs/ios-parity/WEB_BASELINE.md`. Include Today, Archive, Reader Guided, Reader Reading, auto-follow paused, and multi-sentence highlight.

- [ ] **Step 6: Verify the baseline.**

Run: `npm test -- tests/unit/queue.test.ts tests/unit/highlight-cues.test.ts`

Run: `npm run test:e2e -- tests/e2e/reader-multi-sentence.spec.ts`

Expected: all focused tests pass and screenshots are reproducible from fixtures without modifying `data/xreader.db`.

- [ ] **Step 7: Create the review checkpoint.**

Run: `git diff --check`

If authorized: `git add tests docs/ios-parity && git commit -m "test: add iOS parity course fixture"`

## Task 2: Define and test the versioned public content contract

**Files:**
- Create: `src/server/articles/v1-contract.ts`
- Create: `src/app/api/v1/catalog/route.ts`
- Create: `src/app/api/v1/articles/[slug]/route.ts`
- Create: `src/app/api/v1/media/[assetId]/route.ts`
- Create: `tests/integration/v1-public-api.test.ts`
- Create: `docs/api/xreader-content-v1.md`

**Interfaces:**
- `toCatalogEntry(article: PublicArticle): CatalogEntryV1` returns `schemaVersion`, `contentVersion`, `slug`, titles, cover, topic, difficulty and availability date.
- `toArticleDetail(article: PublicArticle): ArticleDetailV1` returns source paragraphs, Course Blocks, cues and media IDs without filesystem paths.
- `GET /api/v1/catalog`, `GET /api/v1/articles/:slug`, `GET /api/v1/media/:assetId` return JSON/MP3 with `Cache-Control` and an `ETag` derived from content data.

- [ ] **Step 1: Write failing integration tests for visibility and contract shape.**

```ts
it("returns only published courses from the v1 catalog", async () => {
  const response = await GET_catalog();
  expect(response.status).toBe(200);
  expect((await response.json()).items).toEqual([
    expect.objectContaining({ slug: "why-rain-has-a-smell", schemaVersion: 1 }),
  ]);
});

it("does not expose a local CourseBlockAudio path", async () => {
  const response = await GET_article("why-rain-has-a-smell");
  expect(JSON.stringify(await response.json())).not.toContain("data/audio/");
});
```

- [ ] **Step 2: Run the focused integration test.**

Run: `npm run test:integration -- tests/integration/v1-public-api.test.ts`

Expected: FAIL because `/api/v1` handlers and DTOs do not exist.

- [ ] **Step 3: Implement explicit DTOs rather than serializing Prisma objects.**

```ts
export type CatalogEntryV1 = {
  schemaVersion: 1;
  contentVersion: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  coverUrl: string | null;
  publishedAt: string | null;
};

export function toArticleDetail(article: PublicArticle): ArticleDetailV1 {
  return { schemaVersion: 1, contentVersion: contentVersion(article), article: mapArticle(article) };
}
```

- [ ] **Step 4: Implement v1 routes through the existing public visibility query.**

```ts
export async function GET() {
  const articles = await listPublicArticles(prisma);
  return Response.json({ schemaVersion: 1, items: articles.map(toCatalogEntry) });
}
```

The media route must delegate to the existing secure media resolver and retain byte-range behavior; it must not construct a disk path from a request parameter.

- [ ] **Step 5: Publish a contract document with complete JSON examples.**

`docs/api/xreader-content-v1.md` must include required/optional fields, unknown-field policy, main-version rejection, ETag refresh rules, `Range` sample request, and 404 behavior for unpublished content.

- [ ] **Step 6: Verify.**

Run: `npm run test:integration -- tests/integration/v1-public-api.test.ts`

Run: `npm test -- tests/unit`

Run: `NEXT_PUBLIC_BASE_PATH=/xreader DATABASE_URL=file:../data/xreader.db npm run build`

Expected: all pass; v1 output contains no private paths or unpublished articles.

- [ ] **Step 7: Create the review checkpoint.**

Run: `git diff --check`

If authorized: `git add src tests docs/api && git commit -m "feat: add versioned content API"`

## Task 3: Add a private, checked course publication command

**Files:**
- Create: `src/lib/release/publish-course.ts`
- Create: `scripts/publish-course.ts`
- Modify: `package.json`
- Create: `tests/integration/publish-course.test.ts`
- Modify: `docs/XREADER_VPS_RUNBOOK.md`
- Modify: `docs/handoff/COURSE_BLOCK_OPERATIONS.md`

**Interfaces:**
- `buildCourseReleasePlan({ slug, databasePath, audioRoot }): Promise<CourseReleasePlan>` validates a course, returns referenced READY relative MP3 paths, and refuses non-public course state.
- `assertReleasePlan(plan): Promise<void>` verifies every listed file exists under `audioRoot` and has an `.mp3` suffix.
- `npm run course:publish -- <slug>` is a private command that requires an explicit `--host` value or reads a local-only deploy configuration ignored by Git.

- [ ] **Step 1: Write failing release-plan tests.**

```ts
it("includes only READY MP3 assets referenced by the imported course", async () => {
  const plan = await buildCourseReleasePlan(fixtureInput);
  expect(plan.audioPaths).toEqual([
    "why-rain-has-a-smell/label-001/2026-08-02T15-47-01-114Z-c4c4114c/audio.mp3",
  ]);
});

it("refuses a course whose article is not published or due", async () => {
  await expect(buildCourseReleasePlan(draftFixtureInput)).rejects.toThrow("not publicly visible");
});
```

- [ ] **Step 2: Run the focused integration test.**

Run: `npm run test:integration -- tests/integration/publish-course.test.ts`

Expected: FAIL because the release planner is absent.

- [ ] **Step 3: Implement the pure release plan.**

```ts
export type CourseReleasePlan = {
  slug: string;
  databasePath: string;
  audioPaths: string[];
  verificationUrls: string[];
};

export async function buildCourseReleasePlan(input: ReleaseInput): Promise<CourseReleasePlan> {
  // Query only CourseBlockAudio rows with status READY for the visible article.
}
```

Use `path.relative` plus a prefix check to refuse traversal outside `data/audio`; sort and deduplicate audio paths before returning them.

- [ ] **Step 4: Implement the command as staged deployment, not an API.**

The script must: run `course:check`; create a temporary database copy; import the package there; construct and verify the release plan; rsync only plan files to a remote staging directory; atomically install the database and files; restart `xreader.service`; and curl the v1 catalog/detail/media endpoints. The command must stop before remote mutation unless all local checks pass.

- [ ] **Step 5: Add the package command and operational documentation.**

```json
"course:publish": "tsx scripts/publish-course.ts --"
```

Document the exact required local configuration, rollback directory, production checks, and the prohibition on synchronizing an entire `data/audio` tree.

- [ ] **Step 6: Verify a no-network dry run and a staging release.**

Run: `npm run course:publish -- why-rain-has-a-smell --dry-run`

Expected: prints a plan with one database and only READY MP3 files; makes no remote change.

Run the staging command against a non-production host only after user approval. Expected: catalog/detail return 200 and a `Range: bytes=0-1023` media request returns 206.

- [ ] **Step 7: Create the review checkpoint.**

Run: `git diff --check`

If authorized: `git add src/lib/release scripts tests docs package.json && git commit -m "feat: add checked course publication"`

## Task 4: Initialize the isolated iOS workspace and core contract package

**Files in new `xreader-ios` repository:**
- Create: `XReader.xcodeproj`
- Create: `Package.swift`
- Create: `Packages/XReaderCore/Package.swift`
- Create: `Packages/XReaderCore/Sources/XReaderCore/CourseModels.swift`
- Create: `Packages/XReaderCore/Sources/XReaderCore/GuidedQueue.swift`
- Create: `Packages/XReaderCore/Tests/XReaderCoreTests/CourseDecodingTests.swift`
- Create: `Packages/XReaderCore/Tests/XReaderCoreTests/GuidedQueueTests.swift`
- Create: `Fixtures/multi-sentence-article.json`
- Create: `.gitignore`

**Interfaces:**
- `public struct ArticleDetail: Codable, Sendable, Equatable, Identifiable`
- `public struct PlaybackItem: Sendable, Equatable, Identifiable { public let id: String; public let sentenceIDs: [String]; public let audio: AudioAsset }`
- `public func buildGuidedQueue(from blocks: [CourseBlock]) -> [PlaybackItem]`

- [ ] **Step 1: Create the iOS repository outside the Web repository.**

Run from `/Users/linpeiwen/knightspace`: `mkdir xreader-ios && cd xreader-ios && git init -b main`

Add `.gitignore` entries for `.DS_Store`, `.build/`, `.derivedData/`, `xcuserdata/`, `*.xcuserstate`, `*.mobileprovision`, and local `.env` files. Do not copy Web `node_modules`, `.next`, `data`, or any secret.

- [ ] **Step 2: Write failing fixture-decoding and multi-sentence queue tests.**

```swift
func testDecodesVersionOneCourseFixture() throws {
    let article = try Fixture.load(ArticleDetail.self, named: "multi-sentence-article")
    XCTAssertEqual(article.schemaVersion, 1)
    XCTAssertEqual(article.article.slug, "multi-sentence-fixture")
}

func testGuidedQueueRetainsBothSourceSentenceIDs() {
    let queue = buildGuidedQueue(from: Fixture.multiSentence.blocks)
    XCTAssertEqual(queue[0].sentenceIDs, ["p01-s01", "p01-s02"])
}
```

- [ ] **Step 3: Run the core tests and confirm they fail before models exist.**

Run: `swift test --package-path Packages/XReaderCore`

Expected: FAIL because the package, model types, and fixture loader do not exist.

- [ ] **Step 4: Implement models as explicit Codable DTOs.**

```swift
public struct PlaybackItem: Sendable, Equatable, Identifiable {
    public let id: String
    public let sentenceIDs: [String]
    public let audio: AudioAsset
}

public func buildGuidedQueue(from blocks: [CourseBlock]) -> [PlaybackItem] {
    blocks.compactMap { block in
        guard block.audio.status == .ready, let asset = block.audio.asset else { return nil }
        let ids = orderedUnique(block.segments.flatMap(\.sourceSentenceIDs)
          + block.sentenceIDs + (block.sentenceID.map { [$0] } ?? []))
        return PlaybackItem(id: block.id, sentenceIDs: ids, audio: asset)
    }
}

private func orderedUnique(_ values: [String]) -> [String] {
    var seen = Set<String>()
    return values.filter { seen.insert($0).inserted }
}
```

`orderedUnique` is required because a sorted set would destroy source reading order.

- [ ] **Step 5: Add schema-version rejection.**

```swift
public enum ContentDecodeError: Error, Equatable { case unsupportedSchemaVersion(Int) }

public func requireSchemaVersion(_ value: Int) throws {
    guard value == 1 else { throw ContentDecodeError.unsupportedSchemaVersion(value) }
}
```

- [ ] **Step 6: Verify and create the review checkpoint.**

Run: `swift test --package-path Packages/XReaderCore`

Run: `git diff --check`

If authorized: `git add . && git commit -m "feat: add XReader iOS core contract"`

## Task 5: Implement networking, local content cache, and remote course refresh

**Files in `xreader-ios`:**
- Create: `Packages/XReaderNetworking/Package.swift`
- Create: `Packages/XReaderNetworking/Sources/XReaderNetworking/ContentAPIClient.swift`
- Create: `Packages/XReaderNetworking/Sources/XReaderNetworking/HTTPClient.swift`
- Create: `Packages/XReaderNetworking/Tests/XReaderNetworkingTests/ContentAPIClientTests.swift`
- Create: `Packages/XReaderContent/Package.swift`
- Create: `Packages/XReaderContent/Sources/XReaderContent/CourseStore.swift`
- Create: `Packages/XReaderContent/Sources/XReaderContent/FileCourseCache.swift`
- Create: `Packages/XReaderContent/Tests/XReaderContentTests/FileCourseCacheTests.swift`

**Interfaces:**
- `protocol ContentAPIClient: Sendable { func catalog() async throws -> Catalog; func article(slug: String) async throws -> ArticleDetail }`
- `protocol CourseStore: Sendable { func cachedArticle(slug: String) async throws -> ArticleDetail?; func save(_ article: ArticleDetail) async throws }`
- `func refreshCatalog() async throws -> CatalogRefreshResult`

- [ ] **Step 1: Write failing URLProtocol-backed network tests.**

```swift
func testCatalogUsesVersionedEndpointAndDecodesETag() async throws {
    let client = makeClient(response: .catalogFixture, headers: ["ETag": "catalog-v1"])
    let catalog = try await client.catalog()
    XCTAssertEqual(catalog.items.first?.slug, "why-rain-has-a-smell")
}

func testUnsupportedSchemaFailsWithoutReplacingCachedCourse() async throws {
    let store = try makeStoreWithCachedFixture()
    await XCTAssertThrowsErrorAsync(try await store.save(unsupportedVersionFixture))
    XCTAssertEqual(try await store.cachedArticle(slug: "why-rain-has-a-smell")?.schemaVersion, 1)
}
```

- [ ] **Step 2: Run focused package tests.**

Run: `swift test --package-path Packages/XReaderNetworking`

Run: `swift test --package-path Packages/XReaderContent`

Expected: FAIL because no client or cache exists.

- [ ] **Step 3: Implement a URLSession client with explicit errors.**

```swift
public enum ContentAPIError: Error, Equatable {
    case invalidResponse
    case httpStatus(Int)
    case unsupportedSchemaVersion(Int)
    case malformedPayload
}
```

Use `URLSession.data(for:)`, require 200, decode with `JSONDecoder`, and call `requireSchemaVersion`. Do not make a network request from a SwiftUI `body`.

- [ ] **Step 4: Implement atomic local JSON cache writes.**

Write the new course JSON to `slug.json.partial`, fsync/close it, then replace `slug.json`. Store ETag and content version in a separate metadata file. A failed decode, download, or replace must leave the last complete cached version readable.

- [ ] **Step 5: Add catalog refresh behavior.**

On app foreground and explicit user refresh, request the catalog with `If-None-Match`; use a 304 response without touching cache. For changed courses, defer detail download until opening or downloading that course.

- [ ] **Step 6: Verify and checkpoint.**

Run: `swift test --package-path Packages/XReaderNetworking`

Run: `swift test --package-path Packages/XReaderContent`

If authorized: `git add Packages && git commit -m "feat: add remote content cache"`

## Task 6: Implement native audio playback and progress state machine

**Files in `xreader-ios`:**
- Create: `Packages/XReaderAudio/Package.swift`
- Create: `Packages/XReaderAudio/Sources/XReaderAudio/AudioPlaybackCoordinator.swift`
- Create: `Packages/XReaderAudio/Sources/XReaderAudio/PlaybackState.swift`
- Create: `Packages/XReaderAudio/Sources/XReaderAudio/NowPlayingController.swift`
- Create: `Packages/XReaderAudio/Tests/XReaderAudioTests/AudioPlaybackCoordinatorTests.swift`
- Create: `Packages/XReaderProgress/Package.swift`
- Create: `Packages/XReaderProgress/Sources/XReaderProgress/ProgressStore.swift`
- Create: `Packages/XReaderProgress/Tests/XReaderProgressTests/ProgressStoreTests.swift`

**Interfaces:**
- `@MainActor @Observable public final class AudioPlaybackCoordinator`
- `public struct PlaybackState: Equatable, Sendable { var mode: ReaderMode; var activeItemID: String?; var activeSentenceID: String?; var isPlaying: Bool; var rate: Double; var isCompleted: Bool; var isAutoFollowEnabled: Bool }`
- `protocol ProgressStore: Sendable { func load(articleID: String) async -> ArticleProgress?; func save(articleID: String, progress: ArticleProgress) async }`

- [ ] **Step 1: Write failing pure state-machine tests before AVFoundation integration.**

```swift
func testModeChangeMapsCurrentSentenceAndRetainsPlaying() {
    var state = PlaybackState.fixture(mode: .guided, activeSentenceID: "p01-s02", isPlaying: true)
    state.changeMode(.reading, queues: Fixture.queues)
    XCTAssertEqual(state.activeItemID, "p01-s02")
    XCTAssertTrue(state.isPlaying)
}

func testSecondCueChangesActiveSentenceInSameBlock() {
    var state = PlaybackState.fixture(activeSentenceID: "p01-s01")
    state.applyCue(Fixture.secondSentenceCue)
    XCTAssertEqual(state.activeSentenceID, "p01-s02")
}
```

- [ ] **Step 2: Run state and progress tests.**

Run: `swift test --package-path Packages/XReaderAudio`

Run: `swift test --package-path Packages/XReaderProgress`

Expected: FAIL before the state and progress packages exist.

- [ ] **Step 3: Implement deterministic state transitions.**

The reducer/coordinator must have commands `play(itemID:)`, `pause()`, `previous()`, `next()`, `changeMode(to:)`, `applyPlaybackTime(milliseconds:)`, `selectSentence(_:)`, `userScrolledAway()`, and `restoreAutoFollow()`. Increment a playback generation before every new item; ignore time/end callbacks whose generation no longer matches.

- [ ] **Step 4: Add AVFoundation integration behind the state reducer.**

Configure `.playback` only immediately before starting playback. Register remote commands for play, pause, previous, next, and change rate. On interruption: set UI to paused; resume only when the system reports that resumption is appropriate and the user had been playing. On route loss: pause and keep the item/position.

- [ ] **Step 5: Implement device-local progress.**

Persist `{ articleID, guidedBlockID, readingSentenceID, lastMode, completed, updatedAt }`. Save at item change, mode change, completion, and app background. Use `UserDefaults` for metadata; do not persist raw audio paths.

- [ ] **Step 6: Verify.**

Run: `swift test --package-path Packages/XReaderAudio`

Run: `swift test --package-path Packages/XReaderProgress`

Run on Simulator: start guided playback, switch mode while playing, force a second cue, background the app, return, then verify state and position.

- [ ] **Step 7: Create the review checkpoint.**

If authorized: `git add Packages && git commit -m "feat: add native playback state machine"`

## Task 7: Add verified offline audio downloads

**Files in `xreader-ios`:**
- Modify: `Packages/XReaderContent/Sources/XReaderContent/FileCourseCache.swift`
- Create: `Packages/XReaderContent/Sources/XReaderContent/CourseDownloadManager.swift`
- Create: `Packages/XReaderContent/Tests/XReaderContentTests/CourseDownloadManagerTests.swift`
- Modify: `Packages/XReaderAudio/Sources/XReaderAudio/AudioPlaybackCoordinator.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Downloads/DownloadStateView.swift`

**Interfaces:**
- `func download(article: ArticleDetail) async throws -> DownloadedCourse`
- `func localURL(for audio: AudioAsset) async -> URL?`
- `enum DownloadState: Equatable { case notDownloaded; case downloading(completed: Int, total: Int); case available; case failed(message: String) }`

- [ ] **Step 1: Write failing atomic-download tests.**

```swift
func testFailedDownloadDoesNotMarkCourseAvailable() async throws {
    let manager = makeManager(failingAtAsset: "audio-002")
    await XCTAssertThrowsErrorAsync(try await manager.download(Fixture.article))
    XCTAssertEqual(await manager.state(for: Fixture.article.slug), .failed(message: "audio-002"))
    XCTAssertNil(await manager.localURL(for: Fixture.audio002))
}
```

- [ ] **Step 2: Run the focused cache test.**

Run: `swift test --package-path Packages/XReaderContent`

Expected: FAIL because no download manager exists.

- [ ] **Step 3: Implement complete-course staging.**

Download JSON and every READY MP3 to a versioned staging directory. Validate expected content length when supplied, move each completed file into staging atomically, then rename staging to the version directory only after every asset succeeds. Preserve the prior completed version on any error.

- [ ] **Step 4: Teach the audio coordinator to prefer local URLs.**

```swift
let source = await courseStore.localURL(for: item.audio)
    ?? item.audio.remoteURL
player.replaceCurrentItem(with: AVPlayerItem(url: source))
```

If neither source is available, transition to a visible `.failed` playback state rather than showing a playing control.

- [ ] **Step 5: Build the native download state view without expanding product scope.**

Show download, percentage while active, available, retry after failure, and remove downloaded copy. Do not add account, cloud sync, recommendation, or content-management controls.

- [ ] **Step 6: Verify and checkpoint.**

Run: `swift test --package-path Packages/XReaderContent`

On a device: download one article, enable airplane mode, open it, play through it, then remove it and confirm only that article’s content is deleted.

If authorized: `git add Packages && git commit -m "feat: add offline course downloads"`

## Task 8: Build the SwiftUI design system and screen parity shell

**Files in `xreader-ios`:**
- Create: `Packages/XReaderDesignSystem/Package.swift`
- Create: `Packages/XReaderDesignSystem/Sources/XReaderDesignSystem/XReaderTheme.swift`
- Create: `Packages/XReaderDesignSystem/Sources/XReaderDesignSystem/ReaderControls.swift`
- Create: `Packages/XReaderFeatures/Package.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/AppShell/AppRouter.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Today/TodayView.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Archive/ArchiveView.swift`
- Create: `Packages/XReaderFeatures/Tests/XReaderFeaturesTests/TodayViewTests.swift`
- Create: `Packages/XReaderFeatures/Tests/XReaderFeaturesTests/ArchiveViewTests.swift`

**Interfaces:**
- `struct XReaderTheme` defines paper, ink, green, muted and line colors plus the 4/8/12/20/32/48/72 spacing scale.
- `enum AppRoute: Hashable { case today; case archive; case article(slug: String, mode: ReaderMode) }`
- `TodayView` and `ArchiveView` consume immutable view data plus closures; they do not issue HTTP calls directly.

- [ ] **Step 1: Write failing view-model and accessibility tests.**

```swift
func testTodayStartGuidedRoutesToGuidedArticle() {
    let route = TodayAction.startGuided.route(for: Fixture.catalogEntry)
    XCTAssertEqual(route, .article(slug: "why-rain-has-a-smell", mode: .guided))
}

func testArchiveEmptyStateUsesPublicCopy() {
    XCTAssertEqual(ArchiveViewModel(items: []).emptyMessage, "还没有已发布的文章。")
}
```

- [ ] **Step 2: Run focused feature tests.**

Run: `swift test --package-path Packages/XReaderFeatures`

Expected: FAIL before the package and view models exist.

- [ ] **Step 3: Encode the current Web visual tokens as semantic SwiftUI values.**

```swift
public enum XReaderTheme {
    public static let paper = Color("Paper", bundle: .module)
    public static let ink = Color("Ink", bundle: .module)
    public static let accent = Color("Green", bundle: .module)
    public static let spacing: [CGFloat] = [4, 8, 12, 20, 32, 48, 72]
}
```

Use Dynamic Type-compatible fonts and semantic colors. Do not hard-code screenshots as absolute-positioned views.

- [ ] **Step 4: Implement Today and Archive using fixture-driven view models.**

Preserve: cover dominance, English/Chinese title hierarchy, “开始讲解”, “先读文章”, “继续讲解”, archive ordering, article cover/title hierarchy and the current empty-state copy. Add VoiceOver labels for every actionable card/button.

- [ ] **Step 5: Add previews and screenshot tests.**

Create previews for normal, completed, empty, large Dynamic Type, and offline cached states. Store deterministic screenshot test references in the iOS repository, not the Web app.

- [ ] **Step 6: Verify and checkpoint.**

Run: `swift test --package-path Packages/XReaderFeatures`

Run: `xcodebuild -project XReader.xcodeproj -scheme XReader -destination 'platform=iOS Simulator,name=iPhone 16' build`

If authorized: `git add Packages XReader.xcodeproj && git commit -m "feat: add native catalog screens"`

## Task 9: Implement Reader visual and interaction parity

**Files in `xreader-ios`:**
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Reader/ReaderView.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Reader/ArticleCanvasView.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Reader/ReaderHeaderView.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Reader/PlayerDockView.swift`
- Create: `Packages/XReaderFeatures/Sources/XReaderFeatures/Reader/AutoFollowController.swift`
- Create: `Packages/XReaderFeatures/Tests/XReaderFeaturesTests/ReaderViewModelTests.swift`
- Create: `XReaderUITests/ReaderFlowTests.swift`

**Interfaces:**
- `@MainActor @Observable final class ReaderViewModel` owns `PlaybackState`, article data and user-visible errors.
- `func selectSentence(_ id: String)` delegates to the audio coordinator.
- `func applyVisibleSentenceIDs(_ ids: Set<String>)` controls automatic scrolling only; it does not alter playback.

- [ ] **Step 1: Write failing Reader view-model tests.**

```swift
func testSelectingSecondSentencePlaysTheOwningGuidedBlock() {
    let model = ReaderViewModel.fixture(article: .multiSentence)
    model.selectSentence("p01-s02")
    XCTAssertEqual(model.playback.activeItemID, "block-bridge-01")
    XCTAssertEqual(model.playback.activeSentenceID, "p01-s02")
}

func testManualScrollDisablesFollowWithoutPausingPlayback() {
    var state = PlaybackState.fixture(isPlaying: true, isAutoFollowEnabled: true)
    state.userScrolledAway()
    XCTAssertTrue(state.isPlaying)
    XCTAssertFalse(state.isAutoFollowEnabled)
}
```

- [ ] **Step 2: Run the focused Reader tests.**

Run: `swift test --package-path Packages/XReaderFeatures`

Expected: FAIL before `ReaderViewModel` and UI features exist.

- [ ] **Step 3: Implement the Reader header and text canvas.**

Render all paragraphs and stable sentence IDs. Apply active and seen source-range highlights using cue offsets. Make a sentence an accessible button that invokes `selectSentence`; reveal Chinese translation only when it exists. Keep the current title hierarchy, tone, and low-decoration reading layout.

- [ ] **Step 4: Implement the Player Dock against the shared playback coordinator.**

Include the existing mode switch, previous/play-next controls, 0.75×/1×/1.25× rate selector, current `n / total` progress, subtitle area, completed replay state, disabled previous/next controls, and “跟随” control only after auto-follow has been paused.

- [ ] **Step 5: Implement auto-follow without gesture races.**

Observe the active sentence ID and scroll it into a comfortable viewport only while `isAutoFollowEnabled` is true. Treat a user drag/scroll away from the active sentence as `userScrolledAway()`; do not pause audio. The explicit “跟随” action calls `restoreAutoFollow()` then scrolls to the active sentence.

- [ ] **Step 6: Add XCUITest flow coverage.**

```swift
func testGuidedReadingModeSwitchAndResumeFollow() {
    app.launchArguments = ["-useFixture", "multi-sentence"]
    app.buttons["开始讲解"].tap()
    app.buttons["播放"].tap()
    app.buttons["阅读模式"].tap()
    app.swipeUp()
    XCTAssertTrue(app.buttons["跟随"].exists)
    app.buttons["跟随"].tap()
}
```

- [ ] **Step 7: Verify visual/behavioral parity and checkpoint.**

Run: `swift test --package-path Packages/XReaderFeatures`

Run: `xcodebuild test -project XReader.xcodeproj -scheme XReader -destination 'platform=iOS Simulator,name=iPhone 16'`

Compare iOS screenshots against every state listed in `docs/ios-parity/WEB_BASELINE.md`.

If authorized: `git add Packages XReaderUITests && git commit -m "feat: add native reader parity"`

## Task 10: Add App Store readiness, continuous verification, and TestFlight gate

**Files in `xreader-ios`:**
- Create: `XReaderApp/PrivacyInfo.xcprivacy`
- Create: `docs/APP_STORE_PREP.md`
- Create: `docs/TESTFLIGHT_ACCEPTANCE.md`
- Create: `scripts/verify_ios.sh`
- Modify: `README.md`
- Modify: `.github/workflows/ios.yml` if GitHub Actions is used by this repository

**Interfaces:**
- `scripts/verify_ios.sh` exits non-zero when any Swift package test, Simulator build, privacy manifest validation, or UI test fails.
- `docs/APP_STORE_PREP.md` is the sole checklist for app metadata, privacy, demo content, build version, screenshots and submission status.

- [ ] **Step 1: Write a failing verification script test by deliberately omitting the privacy manifest.**

```sh
mv XReaderApp/PrivacyInfo.xcprivacy /tmp/PrivacyInfo.xcprivacy
scripts/verify_ios.sh
test $? -ne 0
mv /tmp/PrivacyInfo.xcprivacy XReaderApp/PrivacyInfo.xcprivacy
```

- [ ] **Step 2: Add the minimal privacy manifest and inventory all SDKs.**

The initial App has no advertising, tracking, analytics, account, microphone, camera, location, or runtime AI SDK. Before adding any dependency, record its privacy manifest/signature requirements and update both the manifest and App Store Connect privacy answers.

- [ ] **Step 3: Implement the verification script.**

```sh
#!/usr/bin/env bash
set -euo pipefail
test -f XReaderApp/PrivacyInfo.xcprivacy
swift test --package-path Packages/XReaderCore
swift test --package-path Packages/XReaderNetworking
swift test --package-path Packages/XReaderContent
swift test --package-path Packages/XReaderAudio
swift test --package-path Packages/XReaderProgress
swift test --package-path Packages/XReaderFeatures
xcodebuild test -project XReader.xcodeproj -scheme XReader -destination 'platform=iOS Simulator,name=iPhone 16'
```

- [ ] **Step 4: Write the TestFlight acceptance protocol.**

`docs/TESTFLIGHT_ACCEPTANCE.md` must require: fresh remote course refresh, existing cached course, full offline playback, lock-screen/earphone controls, interruption, multi-sentence highlight, all Reader control states, accessibility sweep, crash check and a product-page review. Record result, device, iOS version, build number and evidence URL for every test build.

- [ ] **Step 5: Prepare review materials without submitting.**

Document bundle ID, semantic version/build version, app icon, support URL, required privacy policy URL, App Review demo content, copyright/content rights, screenshots and final reviewer notes. Do not claim submission or upload a release build in this task.

- [ ] **Step 6: Verify and checkpoint.**

Run: `scripts/verify_ios.sh`

Expected: all unit, UI and build checks pass on the declared simulator.

If authorized: `git add XReaderApp docs scripts README.md && git commit -m "docs: prepare XReader App Store release"`

## Final Integration Gate

- [ ] Web: `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run course:check -- why-rain-has-a-smell`, and `NEXT_PUBLIC_BASE_PATH=/xreader DATABASE_URL=file:../data/xreader.db npm run build` all pass.
- [ ] Web staging: `/api/v1/catalog` and a published `/api/v1/articles/<slug>` return 200; a `Range: bytes=0-1023` request to `/api/v1/media/<assetId>` returns 206.
- [ ] iOS: `scripts/verify_ios.sh` passes and the simulator screenshot matrix matches the Web baseline.
- [ ] Device: online, offline, lock screen, headphones, audio interruption, download retry and multi-sentence cue flow pass on at least one supported iPhone.
- [ ] TestFlight: the acceptance document has a completed result for the exact candidate build.
- [ ] App Store: privacy policy, privacy manifest, App Privacy declarations, metadata, screenshots and review notes are checked against the actual App Store Connect UI; only then can a user authorize submission.
