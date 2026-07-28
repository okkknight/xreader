# XReader User Surface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 XReader 用户端首页、归档页和文章阅读页，使其成为安静、清晰、可连续听读的编辑阅读空间。

**Architecture:** 保留现有 Next.js App Router、Prisma public query、playback reducer、AudioController、播放队列和 localStorage 进度协议。把 `ArticleReader` 拆成页面编排、文章画布、课程路线和播放器 dock；把全局样式拆成 tokens、shell、home、archive、reader、player 五组。

**Tech Stack:** Next.js 16 App Router、React 19、TypeScript、Prisma SQLite、Vitest、Playwright / Codex in-app Browser。

## Global Constraints

- 只修改用户端 `/`、`/archive`、`/articles/[slug]`。
- 不修改 Fish Audio 接入、reference_id、课程内容、讲解脚本或音频资产。
- 保留 `playbackReducer`、`AudioController`、`buildGuidedQueue`、`buildReadingQueue` 和现有进度存储。
- 正文是文章页视觉中心；不使用播放栏上方的悬浮字幕框。
- 桌面端正文不被课程路线或播放器遮挡；移动端无横向溢出。
- 只显示真实后端字段和真实进度；缺失的时长、翻译和进度不使用伪造值。
- 用户已明确不使用子代理；执行采用当前会话内的 executing-plans 流程，不在每个 task 后单独 review。

## File Map

Create:

- `src/components/ui/site-header.tsx` — 用户端品牌与主导航。
- `src/components/home/today-article-feature.tsx` — 首页今日文章主区域。
- `src/components/archive/article-list.tsx` — 归档列表及列表项。
- `src/components/reader/reader-header.tsx` — 文章头部、模式切换和阅读工具。
- `src/components/reader/article-canvas.tsx` — 正文段落、句子高亮、翻译和标注。
- `src/components/reader/lesson-outline.tsx` — 桌面课程路线和当前段详情。
- `src/components/player/reader-player-dock.tsx` — 用户端播放 dock。
- `src/styles/tokens.css` — 颜色、字体、间距和基础视觉 tokens。
- `src/styles/shell.css` — header、主容器和全局响应式 shell。
- `src/styles/home.css` — 首页布局。
- `src/styles/archive.css` — 归档布局。
- `src/styles/reader.css` — 文章页正文、路线和移动端结构。
- `src/styles/player.css` — 播放 dock 控件和移动端 dock。

Modify:

- `src/app/globals.css` — 改为仅导入拆分后的公共样式。
- `src/components/ui/app-shell.tsx` — 使用新的 `SiteHeader`。
- `src/app/page.tsx` — 使用新的首页 feature 组件和真实进度视图模型。
- `src/app/archive/page.tsx` — 使用新的 archive list。
- `src/components/reader/article-reader.tsx` — 只保留播放状态编排和区域组件组装。
- `src/components/reader/mode-switch.tsx` — 统一模式切换的可访问状态样式。
- `src/components/reader/annotation-popover.tsx` — 保持标注行为，适配新的正文 canvas。
- `src/components/player/player-bar.tsx` — 或替换为 `ReaderPlayerDock`，保留现有 props 与播放回调契约。
- `src/types/public-article.ts` — 仅在视图模型需要时补充派生字段，不改变 API 原始字段语义。
- `tests/unit/app-shell.test.tsx` — 更新用户端 header 结构断言。
- `tests/unit/reader-components.test.tsx` — 新增正文、路线、模式和播放器的渲染/交互断言。
- `tests/integration/public-pages.test.tsx` — 新增首页、归档和文章页的公开数据渲染断言。
- `tests/e2e/reader-flow.spec.ts` — 更新用户端三页视觉与核心播放流程验收。

Delete only when no imports remain:

- `src/components/reader/today-card.tsx` — 旧首页/归档共享卡片。
- `src/components/player/guided-subtitle.tsx` — 已移除的播放栏上方悬浮字幕组件；当前 worktree 已删除，后续只需清理残余引用。

---

### Task 1: 建立样式 tokens 与用户端 Shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/shell.css`
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/app-shell.tsx`
- Create: `src/components/ui/site-header.tsx`
- Test: `tests/unit/app-shell.test.tsx`

**Interfaces:**
- `SiteHeader` 接收 `{ active?: "today" | "archive" }`，输出品牌链接和两个公开导航链接。
- `AppShell` 保持现有 children 接口。

- [ ] 在 `app-shell.test.tsx` 增加 `/` 与 `/archive` 下品牌、Today、Archive 链接存在且唯一的断言。
- [ ] 运行 `npm test -- tests/unit/app-shell.test.tsx`，确认新断言先因结构未实现而失败或暴露当前选择器差异。
- [ ] 将 header markup 从 `AppShell` 拆入 `SiteHeader`，保留可访问 nav 和 active 状态。
- [ ] 把 `globals.css` 的 tokens、shell、nav 基础规则拆入对应 CSS 文件，并通过 `@import` 进入 `globals.css`。
- [ ] 设定 `--ink`、`--green`、`--muted`、`--line`、`--paper` 和 4/8/12/20/32/48/72 间距变量，保持白色/极浅纸张背景和深墨绿色播放器边界。
- [ ] 运行 `npm test -- tests/unit/app-shell.test.tsx` 与 `npm run lint -- --no-cache`，确认 Shell 通过。

### Task 2: 重构首页今日文章区域

**Files:**
- Create: `src/components/home/today-article-feature.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/styles/home.css`
- Modify: `src/types/public-article.ts` only if an existing public view field is missing
- Test: `tests/unit/home-page.test.tsx`

**Interfaces:**
- `TodayArticleFeature` 接收 `{ article: PublicArticle }`，不直接读取 Prisma。
- 首页仍由 server component 调用 `getTodayArticle(prisma)`；进度展示使用 client-side `ProgressLabel` 或现有 progress helper，不把数据库访问放入组件。

- [ ] 写首页断言：文章标题、中文标题、主入口“开始讲解”、次入口“先读文章”都来自真实 article 数据。
- [ ] 写空状态断言：无 article 时不出现内容生产工作流措辞。
- [ ] 实现开放式两列 desktop 结构，移动端变为单列；不使用旧 `TodayCard` 的重复卡片样式。
- [ ] 为主按钮生成 `/articles/${article.slug}?mode=guided`，为次按钮生成 `/articles/${article.slug}?mode=reading`；如果当前路由没有 query 支持，则在 `ArticleReader` 读取并应用该初始模式。
- [ ] 在 `home.css` 设置标题最大宽度、文章区细线、按钮层级和移动端断点。
- [ ] 运行首页单测、lint，并用 Browser 检查首屏能看到文章与两个入口。

### Task 3: 重构归档列表

**Files:**
- Create: `src/components/archive/article-list.tsx`
- Modify: `src/app/archive/page.tsx`
- Modify: `src/styles/archive.css`
- Test: `tests/unit/archive-page.test.tsx`

**Interfaces:**
- `ArticleList` 接收 `{ articles: PublicArticle[] }`，按输入顺序展示，不自行查询数据库。
- `ArticleListItem` 使用 article slug 作为稳定链接，并从现有 progress store 派生状态。

- [ ] 写归档断言：多篇文章显示为列表项，不能出现首页主卡片的唯一布局；无文章显示公开空状态。
- [ ] 实现桌面两列开放列表、移动单列列表，每项显示主题、难度、标题、导语和真实完成状态。
- [ ] 不显示没有后端依据的精确百分比或虚构日期；发布日期缺失时隐藏日期而不是填充默认值。
- [ ] 运行归档单测和 lint，确认链接全部指向 `/articles/[slug]`。

### Task 4: 拆分文章头部和正文画布

**Files:**
- Create: `src/components/reader/reader-header.tsx`
- Create: `src/components/reader/article-canvas.tsx`
- Modify: `src/components/reader/article-reader.tsx`
- Modify: `src/components/reader/article-body.tsx` or replace imports with `ArticleCanvas`
- Modify: `src/components/reader/mode-switch.tsx`
- Modify: `src/styles/reader.css`
- Test: `tests/unit/reader-components.test.tsx`

**Interfaces:**
- `ReaderHeader` 接收 `{ article: PublicArticle; mode; onModeChange; onToggleTranslations; translations }`。
- `ArticleCanvas` 接收 `{ paragraphs; activeSentenceId; onSentenceSelect; translations }`，内部只负责正文渲染，不拥有播放队列。
- 句子按钮继续使用稳定 `data-sentence-id`，标注继续使用现有 `AnnotationPopover`。

- [ ] 为 `ArticleCanvas` 写断言：24 句全部渲染、active sentence 使用 `data-active="true"`、翻译开关不改句子顺序。
- [ ] 为 `ReaderHeader` 写断言：标题、中文标题、导语和模式切换可见，模式切换按钮有 selected 状态。
- [ ] 将 `ArticleReader` 中的 header/body markup 拆出，保留 `chooseSentence` 作为唯一句子播放入口。
- [ ] 将文章工具移到 header 或正文工具行，删除重复的旧标题、工具和悬浮字幕引用。
- [ ] 在 desktop 版式中让正文保持主宽度和阅读线长；移动端保证句子按钮有可触控高度并无横向溢出。
- [ ] 运行 reader 单测、现有播放相关测试和 lint。

### Task 5: 实现课程路线与当前讲解详情

**Files:**
- Create: `src/components/reader/lesson-outline.tsx`
- Modify: `src/components/reader/article-reader.tsx`
- Modify: `src/styles/reader.css`
- Test: `tests/unit/lesson-outline.test.tsx`

**Interfaces:**
- `LessonOutline` 接收 `{ segments: PublicArticle["lessonSegments"]; activeItemId?: string; activeQueueIndex: number; queueLength: number; onSelect: (sentenceId: string) => void }`。
- 当前段详情由 `activeItemId` 对应 segment 的 `script` 派生，组件不生成新的讲解文案。

- [ ] 写路线断言：按 segment.order 渲染；当前段有 selected/current 状态；长 script 默认不在每个列表项中重复展开。
- [ ] 写路线点击断言：点击 item 调用第一句 sentence ID，不直接触碰 AudioController。
- [ ] 实现 desktop sticky 路线，显示段类型的友好中文标签、序号和完成/当前状态。
- [ ] 实现当前段详情只展开一个段落，切换段落时旧详情收起；REPLAY 使用现有 sentenceIds，不新增映射协议。
- [ ] 实现移动端课程路线入口和内联/抽屉状态，保证展开内容不覆盖正文阅读区域。
- [ ] 将 `ArticleReader` 的队列派生状态传入路线，保持播放 reducer 为单一状态源。
- [ ] 运行路线单测、lint，并检查桌面与移动截图。

### Task 6: 重构底部播放器 dock

**Files:**
- Create: `src/components/player/reader-player-dock.tsx`
- Modify: `src/components/player/player-bar.tsx` or replace it with the new dock
- Modify: `src/components/reader/article-reader.tsx`
- Modify: `src/styles/player.css`
- Delete: `src/components/player/guided-subtitle.tsx` if still present
- Test: `tests/unit/player-bar.test.tsx`

**Interfaces:**
- 保持现有回调契约：`playing`, `rate`, `completed`, `position`, `subtitle`, `onPlayPause`, `onPrevious`, `onNext`, `onRate`。
- 新 dock 不渲染固定在播放器上方的 subtitle element；`subtitle` 只在 dock 内一行显示。

- [ ] 写播放器断言：播放/暂停、上一段、下一段、速度选择器都调用对应 callback；完成状态显示完成文案。
- [ ] 写播放器断言：DOM 中没有 `guided-subtitle` 或额外悬浮字幕节点。
- [ ] 实现 compact dock：控制区、当前段标签/位置、单行当前字幕、速度选择；保持按钮可访问名称。
- [ ] 设置 desktop dock 的正文底部安全空间和 mobile dock 的两行布局，避免覆盖正文最后段。
- [ ] 保留真实播放状态，不添加假 progress bar、假时长或未接线的 seek 控件。
- [ ] 运行播放器单测和 lint。

### Task 7: 接通页面状态、query 初始模式和错误状态

**Files:**
- Modify: `src/components/reader/article-reader.tsx`
- Modify: `src/app/articles/[slug]/page.tsx`
- Modify: `src/features/reader/playback-reducer.ts` only if query initialization needs a typed action
- Modify: `src/styles/reader.css`
- Test: `tests/unit/article-reader-state.test.ts`
- Test: `tests/e2e/reader-flow.spec.ts`

**Interfaces:**
- 文章页从 query `mode=guided|reading` 得到可选初始模式；无 query 时保持默认 guided 或现有恢复逻辑。
- `ArticleReader` 继续通过 queue、controller、progress store 驱动全部播放状态。

- [ ] 写状态测试：从首页 guided/reading 入口进入后模式正确；localStorage 已有进度时恢复对应模式位置。
- [ ] 写状态测试：模式切换、正文句子点击、路线点击和播放器 next/previous 使用同一 queue state。
- [ ] 实现用户手动滚动暂停自动跟随、恢复按钮回到当前句子的视觉路径。
- [ ] 实现 audio 缺失/播放异常时停止状态并显示可理解的用户提示，不保留播放中假状态。
- [ ] 更新 E2E：首页入口 -> 文章页、模式切换、点击一句、播放器暂停/继续、下一段、移动端路线展开。
- [ ] 运行目标 E2E 和现有全部测试。

### Task 8: 统一样式、响应式校准与收尾清理

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/shell.css`
- Modify: `src/styles/home.css`
- Modify: `src/styles/archive.css`
- Modify: `src/styles/reader.css`
- Modify: `src/styles/player.css`
- Modify: `src/app/globals.css`
- Delete: unused old public-only components after `rg` confirms no imports
- Test: Browser/IAB visual QA, `npm run lint`, `npm test`, `npm run course:validate -- --article seed-rain`

- [ ] 检查 desktop 首屏：首页、归档、文章页均无横向溢出、遮挡或大块空白。
- [ ] 检查 mobile viewport：header、标题、正文、课程路线展开和底部播放器均可见且可操作。
- [ ] 检查文章播放时当前句子、路线 current 状态和 dock 状态同步；确认无悬浮重复字幕。
- [ ] 通过 Browser 读取页面 title、DOM snapshot、console warn/error 和截图；截图只保存到临时目录，不写入仓库。
- [ ] 删除残余 `guided-subtitle`、旧卡片和未使用样式引用。
- [ ] 运行 `npm run lint -- --no-cache`、`npm test`、`DATABASE_URL=file:../data/xreader.db npm run course:validate -- --article seed-rain`。
- [ ] 使用 `git diff --check` 检查空白错误，确认只包含本次用户端重构和必要测试更新。

## Verification Commands

```bash
npm run lint -- --no-cache
npm test
DATABASE_URL=file:../data/xreader.db npm run course:validate -- --article seed-rain
```

Browser flow:

1. 打开 `http://localhost:3000/`，确认今日文章和两个入口。
2. 点击“开始讲解”，确认文章页进入 guided 模式、正文和路线出现。
3. 点击正文句子，确认播放器和高亮同步。
4. 点击下一段、暂停/继续和倍速，确认按钮状态更新。
5. 切换阅读模式，确认队列和正文仍可用。
6. 手动滚动后确认自动跟随暂停，点击“回到当前讲解”恢复。
7. 在移动 viewport 重复文章页路线展开和播放器操作。
