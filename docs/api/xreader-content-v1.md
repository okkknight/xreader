# XReader Content API v1

`/api/v1` is the read-only contract for the native iOS App. It coexists with the existing Web routes; browser UI must not be migrated to it as part of this API addition.

## Visibility

Every endpoint exposes only articles whose state is `PUBLISHED` with `publishedAt <= now`, or `SCHEDULED` with `scheduledAt <= now`. It never returns course source Markdown, final lecture Markdown, Prompt data, editor notes, Fish configuration, SQLite paths, or unpublished records.

## Endpoints

### `GET /api/v1/catalog`

Returns a versioned catalog:

```json
{
  "schemaVersion": 1,
  "items": [{
    "id": "article-why-rain-has-a-smell",
    "slug": "why-rain-has-a-smell",
    "titleEn": "Why Does Rain Have a Smell?",
    "titleZh": "为什么雨会有气味？",
    "dekZh": "从干燥的土地到第一滴雨，空气里发生了什么。",
    "topic": "Nature & Science",
    "difficulty": "B1-B2",
    "publishedAt": "2026-08-06T00:00:00.000Z",
    "coverUrl": "/images/why-rain-has-a-smell-cover.png",
    "contentVersion": "sha256"
  }]
}
```

`coverUrl` is nullable until each course package carries an approved cover. iOS must show its local visual fallback when it is null, and must not invent an inaccessible remote URL.

### `GET /api/v1/articles/{slug}`

Returns the article, paragraphs, stable source sentence IDs, Course Blocks, cue timelines, subtitles, and media descriptors. Each ready media descriptor has:

```json
{
  "assetId": "database-asset-id",
  "url": "/api/v1/media/database-asset-id",
  "status": "READY",
  "durationMs": 3200
}
```

Missing media is `null`; clients must display an unavailable playback state rather than a playing state.

### `GET /api/v1/media/{assetId}`

Streams a READY media asset. `Range: bytes=0-1023` returns `206`, a correct `Content-Range`, `Accept-Ranges: bytes`, and the MP3 content type. The API resolves asset IDs server-side and never accepts a filesystem path.

## Versioning and cache

- `schemaVersion` is currently `1`. A client must reject an unsupported major version while preserving its last valid cached course.
- `contentVersion` is SHA-256 over the public course payload and changes when any public course field changes.
- Catalog and detail responses carry an ETag. Clients send `If-None-Match`; a `304` response leaves the current local cache untouched.
- Unknown fields are optional-extension data. iOS must ignore them, but it must not guess semantics for a newer `schemaVersion`.

## Contract invariants

- `sentence.id`, `CourseBlock.sentenceId`, `CourseBlock.sentenceIds`, `segments[].sourceSentenceIds` and cue `sentenceId` use the same public source ID.
- `id` is the immutable public article identifier; clients use it for local progress and must not substitute a list position or slug.
- Guided playback must preserve the ordered union of all sentence ownership fields in a multi-sentence Block.
- A private course publishing workflow, not this API, decides which course becomes visible.
