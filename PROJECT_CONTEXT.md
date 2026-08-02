# XReader 项目上下文

> 当前架构覆盖：本文早期资料包中的后台管理、运行时 LLM Provider、GenerationJob、LessonPlan 和程序拼接讲稿设计均已废止。当前以 [内容生成工作流重构 Prompt](docs/XReader_内容生成工作流重构Prompt.md) 和 [五阶段 Prompt 包 v2.2](docs/XReader_五阶段Prompt包_v2.2/README_使用说明.md) 为准：Codex 客户端负责理解 Prompt、创作和修订，XReader 只保存课程包导入结果和公开课程。

## 项目是什么

XReader 是一个“每天一篇”的 AI 英语精读产品：用户阅读 450–600 词的知识型英文短文，并在“讲解模式”和“阅读模式”之间切换。固定的 AI 英语老师按语义块带读，原文朗读、教师讲解、句子高亮和自动跟随共同组成约 10 分钟的学习体验。

目标用户是中国成年 B1–B2 英语学习者；产品验证重点是文章是否值得读、用户是否愿意听完讲解、以及是否期待下一篇，而不是背词或考试成绩。

## 项目不是什么

第一阶段不做：口语输出、练习题、背单词系统、积分/签到、自由聊天、实时新闻、任意文章上传、多老师/多人格、复杂账号系统和自动生成即发布。

## 当前状态

- 当前工作区是可运行的 Next.js + Prisma 应用，当前分支为 `main`；不是“尚未初始化的资料包”。
- 产品资料包仍保留作历史规格参考，但后台管理、运行时 LLM Provider、GenerationJob 和旧讲稿拼接设计不再是当前实现。
- 当前内容生产由 Codex 客户端完成；唯一事实源是 `courses/<slug>/final/lecture.md`，通过五阶段 Prompt 包 v2.2 完成创作，再由工程适配器生成 Course Block JSON 与音频映射。
- 当前课程生产规范见 [XReader_内容生成工作流重构Prompt.md](docs/XReader_内容生成工作流重构Prompt.md) 和 [五阶段 Prompt 包 v2.2](docs/XReader_五阶段Prompt包_v2.2/README_使用说明.md)。

## 2026-07-28 实现与音频证据

- 本项目已成为可运行的 Next.js + Prisma 本地应用；公共阅读器读取 Course Document 与 Course Block 音频映射。课程由 Codex 五阶段 Prompt v2.2 和文件系统课程包维护。
- 真实 Fish Audio 试听已完成：教师版本 `data/audio/auditions/audition/teacher/2026-07-28T04-32-54-400Z-5371e460/audio.wav`，朗读版本 `data/audio/auditions/audition/reader/2026-07-28T04-33-03-768Z-9d4b03e6/audio.wav`。
- 两条试听均经 `ffprobe` 验证为 `pcm_s16le`、`44100 Hz`、单声道；各自 manifest 的 `script_sha256` 与 timeline 时长一致。教师时长 5155ms，朗读时长 4876ms。
- 旧种子课程、旧课程数据库和旧音频链路已移除；当前课程必须从 `courses/<slug>/source`、`final`、`build` 和 `audio` 课程包导入。若运行命令或数据状态发生变化，必须以当前命令输出重新验证。

## 产品与状态流

公共端包含首页今日文章、往期归档、文章详情页和两种模式。讲解模式使用 Course Block 的连续带读音频和句子映射；阅读模式沿用正文句子展示，并根据可用 Course Block 音频播放。两种模式共享文章、句子映射和当前位置，但分别保存进度。

内容状态为：

`IDEA → SOURCED → ARTICLE_DRAFT → ARTICLE_EDITED → BUILT → QA_PASSED → SCHEDULED → PUBLISHED → ARCHIVED`

不能从 `BUILT` 直接发布。文章正文或终稿变化后，Course Block 构建和受影响音频必须重新导入检查后才能发布。

## 关键架构约束

- 段落、句子和讲解片段必须使用稳定 ID；高亮、字幕、音频和播放队列都依赖这些 ID。
- 讲解必须按 Course Block 保存，支持 intro/title/sentence/bridge/recap/outro 及其音频映射；终稿原文不由运行时重新拼接。
- 用户端不能直接调用 LLM 或 Fish Audio；Fish Audio 只在课程生产命令中使用，不属于用户端请求链路。
- Codex 生成步骤独立可重跑，最终讲稿保存在文件系统；数据库只保存导入后的 Course Document、解析报告和 Course Block 音频映射。AI 失败不能覆盖 `final/lecture.md`。
- Fish Audio 音频生产属于课程包构建流程，不属于用户端请求链路；用户端只读取已导入的 Course Block 音频。
- 首版声音候选：教师使用 God's Plan 已使用的 `reference_id=76fcd904aa4b4a47af107686abd68248`，原文朗读使用 HolyVoice 英语配置的 `reference_id=7491491700cd43b1a551d5efb4dca9c7`；两者先试听，后续只替换 `reference_id` 即可调模。
- Fish 先沿用 `s2.1-pro-free`、WAV、44.1kHz 单声道、缓存/重试/manifest/timeline 契约；免费账户首版按单并发运行。
- MVP 使用 `localStorage` 保存未登录用户的讲解/阅读位置和完成状态；不引入 Redis、微服务或复杂权限系统。
- 当前 MVP 优先公共端学习闭环；后台管理不做，新增课程由 Codex 维护课程包并使用 `course:check` / `course:import` 导入。
- 公共 API 只返回已发布内容，不暴露来源摘录、Prompt、编辑备注或未发布版本。

## 重要文件

- [XReader_内容生成工作流重构Prompt.md](docs/XReader_内容生成工作流重构Prompt.md)：当前唯一的内容生产总规范。
- [XReader_五阶段Prompt包_v2.2/README_使用说明.md](docs/XReader_五阶段Prompt包_v2.2/README_使用说明.md)：五阶段 Prompt v2.2 执行顺序和输出约束。
- [COURSE_BLOCK_OPERATIONS.md](docs/handoff/COURSE_BLOCK_OPERATIONS.md)：从课程包到导入、音频和发布验收的操作手册。
- [src/lib/course-blocks/](src/lib/course-blocks/)：Course Block schema、原文句子解析、终稿锚定和语义标签。
- [src/lib/db/course-document-repository.ts](src/lib/db/course-document-repository.ts)：只导入已通过解析检查的课程包。
- [scripts/check-course.ts](scripts/check-course.ts)：检查 source 与 final 的原文锚定。
- [scripts/import-course.ts](scripts/import-course.ts)：校验并规范化 build/course.json。

## 已验证事实与运行状态

- 以上资料包的“未实现、非 Git 仓库、Phase 0 未执行”描述属于最初交接时的历史事实，不代表当前 XReader 状态。
- 当前代码、迁移、脚本和本地数据库才是运行事实；当前交接入口见 `docs/handoff/`。
- 新版 Codex 课程生产 Prompt 的执行规范见 [XReader_内容生成工作流重构Prompt.md](docs/XReader_内容生成工作流重构Prompt.md)。

## 下一步

1. 为每篇新文章建立课程包，完成五阶段 Prompt 并写入 `final/lecture.md`。
2. 运行 `npm run course:check -- <slug>`，再生成并校验 `build/course.json` 与 Course Block 音频。
3. 导入数据库后验证公共端播放、阅读模式、自动跟随、进度恢复和发布流程。
4. 新课程继续沿用本工作流，不增加第二套课程生产入口。

## 未决决策与风险

- 当前代码已锁定 Next.js/Prisma、UI 和本地音频目录；音频仍采用 HolyVoice 兼容的 WAV、44.1kHz 单声道。
- 两个候选声音尚未在 XReader 课程文本上试听确认，不能视为最终角色。
- “完整原文音频”明确延期，首版用句子/语义块队列连续播放。
- 单机本地文件存储适合 MVP，但备份、并发、Range 播放和部署路径需要在实现/部署时单独验证。
- Fish Audio API Key 只放在本地 `.env`；两个候选 `reference_id` 已有来源，但仍需短样试听和确认。外部服务失败不能阻塞文章编辑。
- 自动跟随、模式切换和音频片段边界是最容易造成用户体验回归的交叉功能，后续改播放器或句子切分时必须回归验收。
- 内容质量依赖人工审阅；前 20–30 篇课程需要完整试听，不能把结构化生成通过视为发布通过。

## 后续代理工作规则

- 先读本文件和 `docs/handoff/README.md`，再按当前工作流和代码进入细节。
- 把“规格中建议”与“代码中已验证”分开陈述；没有运行证据时不要声称可运行。
- 实现时优先纵向切片，保持种子数据在没有 AI API 时仍可完整运行。
- 保留人工编辑权和版本 lineage；不要静默覆盖人工修改或直接发布 AI 结果。
- 变更句子 ID、片段映射、播放器状态或音频存储时，必须同时检查高亮、模式切换、进度恢复和发布校验。
