# 课程导入边界

XReader 不提供后台管理、内容编辑器、登录后台或后台 API。

课程只能由 Codex 客户端驱动的工作流导入，代码只负责保存 Codex 已完成的课程数据：

1. 在 `scripts/seed-course.ts` 定义或更新 `CourseImport`。
2. 使用 `npm run db:migrate` 更新本地数据库结构。
3. 使用 `npm run db:seed` 导入课程，并保留已生成且仍匹配的音频资产。
4. 由 Codex/维护者按需触发 `npm run audio:generate -- --article <slug> --mode guided` 生成段落连续带读音频；这不是用户端运行时能力。
5. 由 Codex/维护者按需触发 `npm run audio:generate -- --article <slug> --mode reading` 生成逐句原文朗读音频。
6. 使用 `npm run course:validate -- --article <slug>` 做导入和音频完整性校验。

任何课程内容、讲解稿、句子映射和音频生产记录都应由 Codex 工作流维护，再提交到脚本或数据管线中；不通过运行时页面编辑。当前正式的 Codex 中间产物版本保存在 `CourseScriptGeneration`，公开播放数据仍来自导入后的 `ParagraphGuide`/`SentenceGuide`。
