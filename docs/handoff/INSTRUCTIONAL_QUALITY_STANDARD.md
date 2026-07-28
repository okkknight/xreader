# XReader Instructional Quality Standard

本文件是 XReader 课程的最高教学质量合同。它不规定固定授课模板，而是规定一节合格课程必须达到的结果、证据和返工门槛。

`CODEX_WORKFLOW.md` 的全文理解、Lesson Design、完整讲稿、English Teaching Editor、Human Voice Editor 和 Final Critic 阶段都必须读取并遵守本标准。

## 固定原则，不固定结构

固定的是教学原则、质量门槛、审查证据和返工条件；不固定的是讲解顺序、Beat 数量、句子分组、语言点数量、教师动作数量、开场方式、重读次数和 delivery pattern 组合。

Gold/Anti-pattern 样例用于解释判断依据，不得被模仿成结构模板。

## 九个质量维度

### 1. 双重学习结果

课程必须同时让学习者理解文章的核心问题、推进、因果、转折、例证、限制和答案，并注意可迁移的英文表达方式。Critic 必须说明用户完成后能说出的内容收获和英语收获，不能只评价“内容清楚”或“语言自然”。

### 2. 教学必要性

每一个明显展开的讲解都必须能回答：用户如果没有听到这段，会错过什么？合理理由是避免误解、看见关键关系、整合句子、获得高迁移表达、理解语气，或看见英语如何完成因果、限定、对比和指代。不合理理由是“这个词也可以讲”“为了满足数量”或“Schema 有字段”。

### 3. 语言点选择质量

按理解影响、迁移价值、学习者易错和文章相关性选择语言点，不按数量或难度标签选择。低频术语、可直接猜出的普通词和只有“高级”外观的表达不应占用讲解空间。

语言点数量只作为异常信号：全篇没有语言收益、全部是孤立单词或数量异常多时，交给 Codex 和人工判断，不能自动补足。

### 4. 内容与语言融合

语言讲解必须从当前原文发生，解释语境中的含义和表达任务，完成后回到文章主线。不允许先讲完整篇内容再统一补语言，也不允许把课程切成独立语法课。标准不规定固定四步话术，只检查融合结果。

### 5. 深度匹配

讲解深度由“理解障碍 × 文章重要性 × 迁移价值”共同决定。QUICK/NORMAL/DEEP、句子长度、生词数量和语法复杂度只能作为提示，不能机械决定讲解长度。每个停顿、成组解释、单独聚焦和重读都要有全文层面的理由。

### 6. 认知负担控制

一个 Beat 只能有一个主要学习负担：观点、转折、例子整合、复杂句、一个表达、语气或指代。不得在同一 Beat 堆入多个语言点、背景知识、作者态度、例句和总结。发现过载时优先删除，不为“丰富”继续添加。

### 7. 教师判断可见

活人感必须来自具体判断：取舍、预判、回扣、比较、语气观察、有目的重读和明确放过低价值内容。不得用“我们来看”“接下来”“这里很有意思”、闲聊、夸张鼓励或虚构经历伪造活人感。教师动作数量只作为异常信号，不设配额。

### 8. 篇章节奏

密度服从文章的思想结构。重点应得到更多空间，次要内容应敢于快速通过；节奏变化必须有教学理由。不得要求每个 Beat 使用不同模式、每段总结、每个 Stage 相同构成或相邻 Beat 不同结构。

### 9. 听觉自然度

讲稿必须适合只听不看和 Fish Audio 连续口播：中文不拖长，中英文切换自然，不依赖视觉结构，不重复同一意思，不频繁重新开场，没有字段连接痕迹，也像同一个老师讲完整篇。听觉自然度不等于增加口语词。

## 证据评分

Final Critic 对以下维度按 1–5 评分：

```text
contentUnderstanding
languageLearningValue
contentLanguageIntegration
instructionalNecessity
languagePointSelection
depthMatching
cognitiveLoadControl
teacherJudgment
articleRhythm
spokenNaturalness
nonTemplateQuality
```

每个分数必须附具体证据：

```ts
{
  dimension: string;
  score: number;
  positiveEvidence: Array<{ stageId?: string; beatId?: string; sentenceIds?: string[]; excerpt?: string; reason: string }>;
  failureEvidence: Array<{ stageId?: string; beatId?: string; sentenceIds?: string[]; excerpt?: string; reason: string; requiredChange: string }>;
}
```

不得只输出“整体自然”“教学价值良好”或“活人感较强”。

## 通过门槛

默认门槛为以下维度均 `>= 4`：`contentUnderstanding`、`languageLearningValue`、`contentLanguageIntegration`、`instructionalNecessity`、`cognitiveLoadControl`、`teacherJudgment`、`articleRhythm`、`spokenNaturalness`。

同时必须满足：无事实错误、无原句篡改、无正文漏句、无严重语言点误解、无虚构教师经历、无程序拼接路径。

## 返工规则

- 局部返工：单一表达错误、一个 Beat 过长、一处重复或衔接问题；
- Stage 级返工：一个阶段只讲内容、语言点过密、Beat 失衡或学习结果不清；
- 全文返工：全文变成知识播客或词汇课、活人感只靠口头禅、节奏单一、内容线与语言线长期分离、教师人格漂移或明显模板化。

程序不得插入过渡语或语言点修补评分；Codex 必须重新读取全文和规划，重写受影响 Stage 或全文。

## 异常检测，不是生成配额

以下只产生警告，不自动补足：全篇没有语言收益、语言点全是单词、连续 Stage 没有语言收益、没有可见教师判断、Beat 表面结构重复、密度长期不变、语言点异常多疑似过载。

## 校准记录

Gold 样例说明必要性、快速通过、教师判断和听觉自然的证据；Anti-pattern 样例说明内容复述、逐句翻译、见词就讲、语言分离、假装活泼、平均节奏和模板结构为何不合格。人工试听结论必须写入 `calibrationNotes` 和 `EDITORIAL_MEMORY.md`，包含问题、原因、修改、对应标准和未来规避方式。
