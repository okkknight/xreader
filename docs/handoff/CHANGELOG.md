# Handoff Changelog

本文件只记录交接包或项目状态的有意义变化，追加写入，不重复当前状态说明。

## 2026-07-28

- 建立首版 `PROJECT_CONTEXT.md`、`docs/handoff/README.md` 和本变更记录。
- 确认当前工作区是 AI Guided Reading 产品规格资料包，不是可运行代码仓库；Phase 0 项目初始化仍未执行。
- 固化 MVP 边界、内容状态机、稳定 ID/片段音频契约、人工 QA 发布门槛和 Phase 1 优先级。
- 确认第一版直接使用真实 Fish Audio，先本地开发，不生成完整原文长音频；暂定 God's Plan 的 `76fcd904aa4b4a47af107686abd68248` 为教师候选、HolyVoice 英语配置的 `7491491700cd43b1a551d5efb4dca9c7` 为原文朗读候选，试听后仍可替换 `reference_id`。
- 确认首版按片段/句子保存音频，默认单并发，复用 HolyVoice 的缓存、重试、manifest、timeline 和版本化输出思路；VPS 部署延期。
- 实现本地 Next.js/Prisma 应用、公共阅读器、后台编辑、QA/发布门槛和 Fish Audio 版本化音频流程。
- 完成教师与朗读者真实 Fish Audio 短试听：均为 `pcm_s16le`、44.1kHz、单声道，manifest/timeline hash 与时长一致。
- 生成 `seed-rain` 全部 8 个真实 LessonSegment 音频；本地课程血缘校验通过。
- 以四篇独立的人文心理课程替换重复草稿：等待的主观时间、重建性记忆、理解沉默与独处。每篇均有 24 个稳定句子、八个教学段、2–3 条 ArticleSource，保持 `ARTICLE_DRAFT` 且不生成音频。
- 最终统一审查通过：全量课程校验、21 个单测、4 个 Playwright E2E、ESLint 与 Next 生产构建均通过。发布仍等待四篇课程的人工事实、英文、教学与试听审核。
