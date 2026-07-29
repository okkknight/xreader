# XReader 当前交接入口

课程生产唯一规范是：

- [内容生成工作流重构 Prompt](../XReader_内容生成工作流重构Prompt.md)
- [五阶段逐句带读 Prompt 包](../XReader_五阶段逐句带读Prompt包/README_使用说明.md)

工程实现入口：

- [新课程操作手册](COURSE_BLOCK_OPERATIONS.md)：从五阶段 Prompt 到检查、音频、导入和发布验收。
- `src/lib/course-blocks/`：Course Block 合同、原文解析、终稿锚定和标签转换。
- `src/lib/db/course-document-repository.ts`：导入已构建课程包。
- `scripts/check-course.ts`：检查 `source/article.md` 与 `final/lecture.md`。
- `scripts/import-course.ts`：校验并规范化 `build/course.json`。

旧课程数据、旧 Prompt 流程、旧段落讲解表和旧 migration 不再属于当前系统。
