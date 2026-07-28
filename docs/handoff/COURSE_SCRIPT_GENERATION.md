# 讲稿生成流水线

XReader 不提供后台管理页面。讲稿生产由 Codex 直接阅读 Prompt、分析文章并创作，每次生成都会通过持久化函数写入 `CourseScriptGeneration` 独立版本，不覆盖已有课程或人工内容。

流水线阶段：

```text
全文理解
→ 篇章叙事规划
→ 逐句教学分析
→ Lesson Design Rationale
→ Language Learning Map
→ 双轨 Teaching Beat
→ Teacher Performance Plan
→ 全篇讲稿初稿
→ English Teaching Editor
→ Human Voice Editor
→ Final Critic 证据评分
→ 必要时整体修订
→ 确定性覆盖校验
```

产物保存于数据库：

- `articleUnderstanding`
- `narrativePlan`
- `sentenceAnalysis`
- `languageLearningMap`
- `lessonDesignRationale`
- `teachingBeatPlan`
- `teacherPerformancePlan`
- `fullScriptDraft`
- `englishTeachingEdit`
- `humanVoiceEdit`
- `finalQualityReview`
- `instructionalQualityReview`
- `qualityEvidence`
- `calibrationNotes`
- `repairHistory`
- `finalScript`

程序只负责保存版本、校验句子覆盖和记录结果；最终 `fullScriptText` 与每个 Beat 的 `scriptText` 必须来自 Codex 的完整输出，不能由字段模板拼接，也不在运行时调用外部 LLM。

当前实现入口：

- Codex 产物持久化：[src/lib/course-generation/codex-persistence.ts](../../src/lib/course-generation/codex-persistence.ts)
- 结构校验：[src/lib/course-generation/schemas.ts](../../src/lib/course-generation/schemas.ts)
- 阶段 Prompt：[src/lib/course-generation/prompts.ts](../../src/lib/course-generation/prompts.ts)
- 数据模型：[prisma/schema.prisma](../../prisma/schema.prisma) 的 `CourseScriptGeneration`

Codex 直接生成完成后调用持久化函数保存结果，再进行试听和审批。没有通过 `NEEDS_REVIEW` 的版本不得进入 TTS。最终讲稿必须同时提供文章理解和英语学习收益；语言讲解必须来自原文并回到文章主线，活人感必须来自教师取舍、预判、回扣和判断，而不是口头禅。
