# XReader 当前交接入口

课程生产唯一规范是：

- [内容生成工作流重构 Prompt](../XReader_内容生成工作流重构Prompt.md)
- [五阶段 Prompt 包 v2.2](../XReader_五阶段Prompt包_v2.2/README_使用说明.md)

工程实现入口：

- [iOS 原生迁移规格](../IOS_MIGRATION_SPEC.md)：已确认的 Web 体验等价、远程内容发布和 App Store 迁移边界。
- [iOS 内容 API v1](../api/xreader-content-v1.md)：远程发布课程的只读 App 合同。
- [新课程操作手册](COURSE_BLOCK_OPERATIONS.md)：从五阶段 Prompt 到检查、音频、导入和发布验收。
- `src/lib/course-blocks/`：Course Block 合同、原文解析、终稿锚定和标签转换。
- `src/lib/db/course-document-repository.ts`：导入已构建课程包。
- `scripts/check-course.ts`：检查 `source/article.md` 与 `final/lecture.md`。
- `scripts/import-course.ts`：校验并规范化 `build/course.json`。

旧课程数据、旧 Prompt 流程、旧段落讲解表和旧 migration 不再属于当前系统。
