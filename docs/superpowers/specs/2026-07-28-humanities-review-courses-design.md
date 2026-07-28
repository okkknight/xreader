# XReader 人文心理审核课程集设计

## 目标

将四篇重复正文的审核草稿替换为四篇独立、可追溯的 B1–B2 英语精读课程。课程保持 `ARTICLE_DRAFT`，不自动生成音频、不自动 QA 通过，也不发布。

## 课程范围

1. **Why Does Waiting Feel So Long?**：心理学。说明注意力、情绪和不确定性如何改变主观时间感；不把主观感受描述为固定脑部时钟。
2. **Why Is Memory Not a Recording?**：心理学。说明回忆具有重建性、会受后来信息影响；不将此延伸为“记忆都不可靠”。
3. **What Do We Assume When Someone Is Quiet?**：哲学与社会心理学。以归因偏差和理解他人为入口，区分行为、情境与人格判断。
4. **What Can Solitude Make Room For?**：哲学。讨论独处、注意力和反思，避免把独处浪漫化为对所有人都更好。

## 内容与来源

- 每篇 450–600 英文词，六个段落、每段四句，稳定 paragraph/sentence ID。
- 每篇至少两条可追溯来源：心理学优先学会/大学研究中心或同行评议综述；哲学优先大学哲学百科或原典可靠介绍。
- 来源、事实卡和人工核验说明保存为 ArticleSource/人工审核记录；本轮不把自动生成文本伪装成已完成来源审核。

## 教学结构

- 每篇使用八个 LessonSegment：开场、原文朗读、快速解释、原文朗读、深入解释、原文朗读、语境连接、收束。
- `ARTICLE_READ` 仅映射对应句子；教师段均有中文讲解稿。
- 初始音频状态为 `MISSING`，只有人工审核后才允许使用 Fish Audio 生成。

## 验收

- `course:validate -- --all` 不报告正文重复。
- 四篇的标题、正文、段落、句子 ID 与段落映射彼此独立。
- 状态均为 `ARTICLE_DRAFT`，不具有 publishedAt、READY 音频或 QA passed 记录。
- 人工审核表明确标记事实、英文、教学和后续试听仍待完成。
