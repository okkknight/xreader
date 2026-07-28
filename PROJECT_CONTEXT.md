# XReader 项目上下文

## 项目是什么

XReader 是一个“每天一篇”的 AI 英语精读产品：用户阅读 450–600 词的知识型英文短文，并在“讲解模式”和“阅读模式”之间切换。固定的 AI 英语老师按语义块带读，原文朗读、教师讲解、句子高亮和自动跟随共同组成约 10 分钟的学习体验。

目标用户是中国成年 B1–B2 英语学习者；产品验证重点是文章是否值得读、用户是否愿意听完讲解、以及是否期待下一篇，而不是背词或考试成绩。

## 项目不是什么

第一阶段不做：口语输出、练习题、背单词系统、积分/签到、自由聊天、实时新闻、任意文章上传、多老师/多人格、复杂账号系统和自动生成即发布。

## 当前状态

- 当前工作区是产品资料包，不是 Git 仓库；未发现 `package.json`、`src/`、`prisma/`、`scripts/` 或音频数据目录。
- 已有 13 份中文规格、流程、架构、数据/API、Prompt、QA、实施计划和示例课程文档。
- 推荐实现栈：Next.js App Router + TypeScript、SQLite + Prisma、Fish Audio、OpenAI-compatible Provider Adapter、单机 Node.js。
- 当前最新实现任务：Phase 0 项目初始化；执行状态：`未执行`。
- 已确认第一版直接接入真实 Fish Audio，先本地开发；音频按讲解片段/句子保存，不生成完整原文长音频，VPS 部署后置。
- 当前交接任务：理解并固化资料包的项目上下文；执行状态：`验收通过`（交接文件已生成；应用本身尚未实现或运行验收）。

## 产品与状态流

公共端包含首页今日文章、往期归档、文章详情页和两种模式。讲解模式使用 `LessonSegment` 队列交替播放原文与教师音频；阅读模式使用句子音频队列，允许连续播放或点击句子播放。两种模式共享文章、句子映射和当前位置，但分别保存进度。

内容状态为：

`IDEA → SOURCED → ARTICLE_DRAFT → ARTICLE_EDITED → ANALYZED → DIRECTED → SCRIPTED → AUDIO_READY → QA_PASSED → SCHEDULED → PUBLISHED → ARCHIVED`

不能从 `SCRIPTED` 直接发布。文章正文变化后，分析、教学计划和受影响音频必须标记可能过期/`STALE`，重新检查后才能发布。

## 关键架构约束

- 段落、句子和讲解片段必须使用稳定 ID；高亮、字幕、音频和播放队列都依赖这些 ID。
- 讲解必须按片段保存，支持人工编辑、排序、删除、局部重生成；不能只保存一段长稿或长音频。
- 前端不能直接调用 LLM 或 Fish Audio；API Key 只在服务端。
- 生成步骤独立可重跑，保存输入/输出、Prompt 版本、模型和输入哈希；AI 失败不能覆盖旧结果。
- Fish Audio 先通过 HolyVoice 的 Python/CLI 生成能力接入，不把 HolyVoice Web 服务作为 XReader 的运行时依赖；XReader 的 `GenerationJob` 负责任务状态，`AudioAsset` 负责课程内绑定。
- 首版声音候选：教师使用 God's Plan 已使用的 `reference_id=76fcd904aa4b4a47af107686abd68248`，原文朗读使用 HolyVoice 英语配置的 `reference_id=7491491700cd43b1a551d5efb4dca9c7`；两者先试听，后续只替换 `reference_id` 即可调模。
- Fish 先沿用 `s2.1-pro-free`、WAV、44.1kHz 单声道、缓存/重试/manifest/timeline 契约；免费账户首版按单并发运行。
- MVP 使用 `localStorage` 保存未登录用户的讲解/阅读位置和完成状态；不引入 Redis、微服务或复杂权限系统。
- 公共 API 只返回已发布内容，不暴露来源摘录、Prompt、编辑备注或未发布版本。

## 重要文件

- [00_CODEX_START_HERE.md](ai_guided_reading_product_pack/00_CODEX_START_HERE.md)：入口、范围、阅读顺序和 Codex 执行原则。
- [01_PRODUCT_SPEC.md](ai_guided_reading_product_pack/01_PRODUCT_SPEC.md)：产品定义、目标用户、内容边界和 MVP。
- [02_UX_AND_USER_FLOW.md](ai_guided_reading_product_pack/02_UX_AND_USER_FLOW.md)：页面、模式、播放器、自动滚动与后台体验。
- [03_CONTENT_PRODUCTION_PIPELINE.md](ai_guided_reading_product_pack/03_CONTENT_PRODUCTION_PIPELINE.md)：从选题、来源、事实卡到发布的内容流程。
- [05_GUIDED_READING_SCRIPT_PROTOCOL.md](ai_guided_reading_product_pack/05_GUIDED_READING_SCRIPT_PROTOCOL.md)：片段类型、讲解结构、时长与听觉写作规则。
- [06_TECHNICAL_ARCHITECTURE.md](ai_guided_reading_product_pack/06_TECHNICAL_ARCHITECTURE.md)：推荐技术栈、目录、播放器、Provider 和运行边界。
- [07_DATA_MODEL_AND_API.md](ai_guided_reading_product_pack/07_DATA_MODEL_AND_API.md)：核心实体、枚举、API、版本和导入校验契约。
- [09_EDITORIAL_QA.md](ai_guided_reading_product_pack/09_EDITORIAL_QA.md)：事实、英文、教学、音频、页面和发布门槛。
- [10_IMPLEMENTATION_PLAN.md](ai_guided_reading_product_pack/10_IMPLEMENTATION_PLAN.md)：Phase 0–6 纵向实施顺序与完成定义。
- [11_ACCEPTANCE_TESTS.md](ai_guided_reading_product_pack/11_ACCEPTANCE_TESTS.md)：功能、内容、音频、发布和移动端验收清单。
- [12_SAMPLE_COURSE_BLUEPRINT.md](ai_guided_reading_product_pack/12_SAMPLE_COURSE_BLUEPRINT.md)：示例课程结构与带读片段示意。

## 已验证事实与运行状态

- 已验证：工作区只有 `ai_guided_reading_product_pack/` 资料包及其 `manifest.json`。
- 已验证：资料包创建日期为 `2026-07-28`；主范围是 `Daily AI-guided English reading MVP`。
- 已验证：当前目录不是 Git 仓库（`git status` 返回 not a git repository）。
- 未验证：没有应用构建、启动、数据库迁移、种子数据、E2E、Fish Audio 或公开运行地址可验证。
- 文档中的 `npm install`、`npm run db:migrate`、`npm run dev` 等只是未来实现建议命令，不代表当前可执行状态。

## 下一步

1. 初始化 Next.js + TypeScript、SQLite + Prisma、环境变量模板、测试入口和本地音频目录。
2. 先做 Phase 1 公共阅读器纵向切片：一篇 6 段、20–30 句、8–12 片段的种子课程，并保留 `AudioAsset`/`GenerationJob` 边界。
3. 用两个候选英语声音各生成短样试听；确认教师/朗读角色后，生成种子课程片段音频，不生成完整长音频。
4. 以 `11_ACCEPTANCE_TESTS.md` 验收双模式、高亮、音频映射、自动跟随、刷新恢复、移动端和反馈，再做后台编辑。

## 未决决策与风险

- 目前没有实际代码，因此 Next.js/Prisma 版本、UI 方案和本地音频目录仍待初始化时锁定；音频格式暂定为 HolyVoice 兼容的 WAV、44.1kHz 单声道。
- 两个候选声音尚未在 XReader 课程文本上试听确认，不能视为最终角色。
- “完整原文音频”明确延期，首版用句子/语义块队列连续播放。
- 单机本地文件存储适合 MVP，但备份、并发、Range 播放和部署路径需要在实现/部署时单独验证。
- Fish Audio API Key 只放在本地 `.env`；两个候选 `reference_id` 已有来源，但仍需短样试听和确认。外部服务失败不能阻塞文章编辑。
- 自动跟随、模式切换和音频片段边界是最容易造成用户体验回归的交叉功能，后续改播放器或句子切分时必须回归验收。
- 内容质量依赖人工审阅；前 20–30 篇课程需要完整试听，不能把结构化生成通过视为发布通过。

## 后续代理工作规则

- 先读本文件和 `ai_guided_reading_product_pack/00_CODEX_START_HERE.md`，再按文档阅读顺序进入细节。
- 把“规格中建议”与“代码中已验证”分开陈述；没有运行证据时不要声称可运行。
- 实现时优先纵向切片，保持种子数据在没有 AI API 时仍可完整运行。
- 保留人工编辑权和版本 lineage；不要静默覆盖人工修改或直接发布 AI 结果。
- 变更句子 ID、片段映射、播放器状态或音频存储时，必须同时检查高亮、模式切换、进度恢复和发布校验。
