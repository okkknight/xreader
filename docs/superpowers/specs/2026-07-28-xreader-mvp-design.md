# XReader 完整 MVP 设计

## 目标

交付一个本地可运行的“每天一篇”AI 英语精读应用：用户可在讲解和阅读模式间切换，听到真实 Fish Audio、看到正确高亮并保存进度；编辑者可以生产、审阅、试听、发布和撤回一篇完整课程。

## 范围与边界

包含：公共阅读器、归档、无账号本地进度、后台内容编辑、真实 Fish Audio、结构化 AI 内容管线、QA/发布、匿名反馈与本地事件记录。

不包含：账号/跨设备同步、用户上传、练习和考试、社交、复杂权限、Redis、消息队列、微服务、VPS 部署。后台使用单一服务端密码保护。

## 架构

采用 Next.js App Router 单体、TypeScript、SQLite、Prisma 和本地持久化音频目录。浏览器只调用公共 API 或受保护的后台 Action；数据库、LLM 与 Fish API Key 永远不进入客户端。

```text
Browser
  -> App Router pages and client controllers
  -> route handlers / server actions
  -> domain services
       -> Prisma SQLite
       -> Fish Audio adapter
       -> LLM adapter
       -> local audio storage
```

应用按责任拆分，禁止以单个页面文件承担业务规则、播放器、数据库访问和生成逻辑。

```text
src/
  app/                 routes, route handlers, page composition only
  components/
    reader/            article rendering, mode switch, annotations
    player/            controls, progress and seek UI
    admin/             editor panels and publish controls
  features/
    reader/            playback reducer, queue mapping, auto-follow, progress
    admin/             form state and editor-specific commands
  server/
    articles/          article query/mutation use cases
    audio/             audio generation, invalidation and asset lookup
    generation/        pipeline jobs and provider orchestration
    publishing/        QA gate, scheduling, public visibility
  lib/
    db/                Prisma client and repositories
    audio/             Fish client, cache, storage, manifest/timeline helpers
    ai/                provider interface and prompt loading
    validation/        schemas and course QA rules
    auth/              admin session/password guard
  types/               shared DTOs and domain types only
```

Each module has one owner: UI components render supplied state and emit events; feature controllers coordinate browser state; server use cases enforce business rules; repositories persist data; adapters call external services. No component imports Prisma or an API key.

## Content and version model

`Article` owns ordered `Paragraph` records, which own ordered `Sentence` records with stable IDs. `LessonSegment` has an order, type, script, voice role and a list of sentence IDs. `Annotation` attaches a word/phrase range to one sentence. `AudioAsset` is versioned and owned by either a sentence or a lesson segment.

The state machine is mandatory:

`IDEA → SOURCED → ARTICLE_DRAFT → ARTICLE_EDITED → ANALYZED → DIRECTED → SCRIPTED → AUDIO_READY → QA_PASSED → SCHEDULED → PUBLISHED → ARCHIVED`

Publishing is rejected before `QA_PASSED`. Editing article text invalidates analysis, lesson plan, affected segments and their audio. Audio with a mismatched text hash is `STALE` and cannot be served as current.

`GenerationJob` stores type, state, input hash, prompt/model version, attempt count, result/error and timestamps. Every pipeline step is independently runnable, schema-validated and preserves prior successful output if a newer run fails. Human edits are never silently overwritten.

## Playback design

Two queues are derived from one article:

- Guided queue: ordered `LessonSegment` items. `ARTICLE_READ` uses reader audio and sentence highlights; explanations use teacher audio while retaining their sentence range.
- Reading queue: sentence audio assets. It supports single-sentence play and continuous queue playback without a separately generated long MP3.

The client playback reducer is the sole source of UI playback state: mode, current segment/sentence, time, rate, playing state, auto-follow and manual-scroll suppression. Queue conversion and article-to-segment lookup are pure functions with unit tests. Audio element lifecycle lives in a dedicated controller, not in page components.

Progress is stored per article in `localStorage` for guided and reading positions. Mode switches map the current sentence to the nearest covering guided segment. Auto-follow scrolls only when the active target leaves the safe viewport; manual scrolling suspends it until the user presses “回到当前讲解”.

## Fish Audio

The server-side `TTSProvider` interface isolates Fish:

```ts
type SynthesisInput = {
  text: string;
  referenceId: string;
  idempotencyKey: string;
  prosody?: { speed?: number; volume?: number };
};

type SynthesisResult = {
  bytes: Uint8Array;
  providerRequestId?: string;
};
```

Initial provider settings: `s2.1-pro-free`, WAV, 44.1 kHz mono, retryable status handling, timeouts and one concurrent request. The initial teacher candidate is `76fcd904aa4b4a47af107686abd68248`; the initial reader candidate is `7491491700cd43b1a551d5efb4dca9c7`. Both are configuration values, not hard-coded in UI or domain code.

Generation produces versioned directories under `data/audio/<article-id>/<owner-id>/<version-id>/`, segment WAVs where appropriate, a merged owner WAV, `manifest.json` and `timeline.json`. Cache keys include text, reference ID, model, format and synthesis parameters. Raw audio is normalized after assembly using `loudnorm=I=-16:TP=-1.5:LRA=11`. Every new audition uses a new version directory; the old version remains available for comparison. XReader imports the final path, duration, hash and manifest lineage into `AudioAsset`.

## Public and admin flows

Public routes: `/`, `/archive`, `/articles/[slug]`. Public APIs expose only published/scheduled-visible article data, current ready audio URLs, annotations and anonymous feedback. They never expose sources, prompts, editorial notes or drafts.

Admin routes: `/admin`, article editor, source/analysis/directing/script panels, audio panel, QA panel and publish panel. The backend validates the admin session on every mutation. The UI supports article/source CRUD, stable sentence editing, segment ordering and mapping, JSON import/export, per-asset regenerate, preview, QA, publish, schedule and withdraw.

## AI content production

The LLM adapter exposes structured generation and text generation. Prompt templates are versioned resources rather than inline page strings. The pipeline is:

`sources → fact card → original article → English edit → sentence split → analysis → lesson plan → script → script edit → QA`

Each output is parsed through a Zod schema before persistence. A source record carries URL, publisher, access time, role and fact notes. The editor must explicitly promote a pipeline result into the editable article/plan/script; generation never auto-publishes.

## QA and publication

Automated checks cover: sentence references, continuous segment order, required scripts, `ARTICLE_READ` mappings, missing/stale audio, segment counts, deep explanation/expression ranges, total guided duration, prompt/lineage availability and unsafe asset paths. The admin records human fact, English, pedagogy, audio and mobile-preview acknowledgements. `publishArticle` is the only code path that changes a course to public visibility.

## Testing and verification

- Unit: queue mapping, playback reducer, progress mapping, stable ID validation, state transitions, audio cache/hash invalidation, QA rules, provider retry classification and publish gate.
- Integration: Prisma repositories, import/export validation, generation jobs, protected admin mutations and audio asset serving.
- E2E: today/empty state, guided playback/highlight/mode switch, reading sentence playback/annotation/progress restore, admin article/segment editing, regeneration failure preservation, QA refusal and publish/withdraw visibility.
- Runtime: a real short Fish sample for both initial voices, `ffprobe` metadata, manifest/timeline lineage, desktop and mobile browser checks, and audio HTTP Range support.

## Acceptance definition

The project is complete only when an editor can turn sourced material into an editable course, generate and audition its real audio, clear QA, publish it, and a public user can complete the same course in both modes with correct highlight, progress and audio behavior. At least five human-reviewed courses must be seedable or producible through this path before release readiness is claimed.
