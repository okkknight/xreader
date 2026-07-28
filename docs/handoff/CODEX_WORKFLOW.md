# XReader 当前唯一课程生产工作流

本文件是 XReader 唯一的课程生产规范。Codex 每次制作新课程前必须读取本文件、[INSTRUCTIONAL_QUALITY_STANDARD.md](INSTRUCTIONAL_QUALITY_STANDARD.md) 及其中列出的教师资产；不得创建平行工作流。

## 课程最高目标

XReader 讲解课程不是中文知识播客，也不是逐句翻译器。

文章内容是英语学习的上下文。Codex 必须同时完成两件事：

1. 带领学习者理解作者在说什么；
2. 引导学习者注意作者是怎样用英语完成这些表达的。

每个语言讲解都必须从原文中自然发生，并在完成后回到文章主线。活人感不来自口头禅，而来自教师真实的取舍、预判、回扣、比较和判断。

## 产品边界

```text
Codex = 课程内容生产者
XReader = 课程保存、校验、播放和发布终端
```

必须保持：

- XReader 不调用外部 LLM；
- XReader 不生成讲稿；
- XReader 不在运行时修改课程内容；
- XReader 不提供 AI 内容生产后台；
- 最终课程通过现有持久化、`CourseImport`、Fish Audio、校验和发布流程进入 XReader；
- 最终讲稿不得由程序拼接；
- 未审阅课程不得自动公开；
- 不修改播放器、阅读模式、高亮、自动跟随、进度保存和发布机制。

## 唯一生产流程

```text
读取工作流、教师协议、优秀样例、失败样例和编辑记忆
→ 全文理解
→ Narrative Plan
→ 逐句教学分析
→ Lesson Design Rationale
→ Language Learning Map
→ 双轨 Teaching Beat 设计
→ Teacher Performance Plan
→ 完整连续讲稿初稿
→ English Teaching Editor
→ Human Voice Editor
→ Final Critic
→ 必要时整体修订
→ 确定性覆盖校验
→ 保存 CourseScriptGeneration
→ 写入 CourseImport
→ 导入 XReader
→ 生成并绑定 Fish Audio
→ 课程校验
→ 人工试听
→ 发布
```

## 阶段一：读取教学资产

### 输入

- `INSTRUCTIONAL_QUALITY_STANDARD.md`；
- 当前英文文章及资料；
- `docs/handoff/teacher/TEACHER_VOICE.md`；
- `docs/handoff/teacher/LANGUAGE_TEACHING_PRINCIPLES.md`；
- `docs/handoff/teacher/EDITORIAL_MEMORY.md`；
- `docs/handoff/examples/gold/` 中的优秀样例；
- `docs/handoff/examples/anti-patterns/` 中的失败样例；
- 当前课程规格和用户水平：B1–B2 中国成年学习者。

### 要求

先读取这些资产，再分析文章。若编辑记忆与临时写作直觉冲突，以编辑记忆和本工作流为准。

### 禁止

- 不恢复旧资料包；
- 不创建第二份教师协议或 Prompt 规范；
- 不把“自然”简化为增加口语词。

## 阶段二：全文理解

### 目标

同时建立内容理解线和英语学习线。

### 必须识别

内容层：核心问题、核心答案、主旨、段落功能、因果、转折、证据、例子、限制和作者语气。

英语表达层：作者如何提出问题、转折、限定结论、避免重复、进入例子，以及哪些句子的英文组织方式值得注意。

### 输出

`articleUnderstanding`。这一阶段不写最终讲稿，也不最终选择语言点。

## 阶段三：Narrative Plan

### 目标

设计文章认知推进，同时标出自然出现的英语学习机会。

每个 Article Stage 必须包含：

```ts
{
  id: string;
  sentenceIds: string[];
  contentProgress: {
    listenerQuestionBefore: string;
    listenerUnderstandingAfter: string;
    unresolvedQuestionAfter?: string;
  };
  languageOpportunity: {
    possibleLearningPointIds: string[];
    languageFunction: string;
  };
  energy: "LIGHT" | "MEDIUM" | "HEAVY";
}
```

### 硬性要求

- 全文围绕一个核心问题推进；
- 每个阶段改变用户对文章的理解；
- 英语学习机会随文章发展自然出现；
- 不先讲完内容，再统一讲语言；
- 不让连续多个阶段完全没有英语学习收益。

### 输出

`narrativePlan`。

## 阶段四：逐句教学分析

### 目标

覆盖每一句原文，作为备课材料和完整性校验，而不是生成逐句口播稿。

每句话记录：

```ts
{
  sentenceId: string;
  originalText: string;
  meaningZh: string;
  contentFunction: string;
  relationshipToPrevious: string;
  relationshipToNext: string;
  contentDepth: "QUICK" | "NORMAL" | "DEEP";
  languageCandidates: Array<{
    category: "PHRASE" | "COLLOCATION" | "SENTENCE_PATTERN" | "DISCOURSE" | "REFERENCE" | "TONE" | "ELLIPSIS" | "RHYTHM";
    target: string;
    value: "LOW" | "MEDIUM" | "HIGH";
    reason: string;
  }>;
  likelyLearnerConfusion?: string;
}
```

### 禁止

逐句分析不得生成单句讲稿、固定过渡语、独立音频文本或可被程序拼接的口播字段。

### 输出

`sentenceAnalysis`。

## 阶段五：Lesson Design Rationale

这是当前文章的教学决策说明，不是讲稿模板，也不是新的平行生产流程。Codex 在完整讲稿前必须产出它，供讲稿、编辑和 Critic 共同读取。

必须回答：

1. 目标用户理解本文的主要障碍是什么？
2. 最有价值的英语学习机会是什么？
3. 哪些内容看似复杂但不值得展开？
4. 哪些句子应成组处理，为什么？
5. 哪个位置最应该放慢，为什么？
6. 哪些位置应该快速通过，为什么？
7. 哪些语言点讲多了会破坏节奏？
8. 本篇最需要体现什么教师判断？
9. 用户结束后应获得什么内容理解？
10. 用户结束后应获得什么语言理解？
11. 本篇为什么不应照搬 Gold 样例？
12. 本篇最主要的认知负担风险是什么？

### 输出

`lessonDesignRationale`。程序不得将其中内容拼进最终讲稿。

## 阶段六：Language Learning Map

### 目标

从完整文章中选择真正值得迁移的英语学习时刻。数量不设配额；过少、全为孤立单词或异常过多只产生质量警告，不自动补足。

优先选择：可迁移词组和搭配、可组织表达的句型、篇章连接、容易直译错的表达、指代/省略、语气和英文节奏。

降低优先级：只在当前主题使用的术语、可直接猜出的普通词、低频且无迁移价值的表达，以及仅仅因为“高级”而选择的词。

每个语言点必须回答：这个表达在当前文章中完成了什么任务？

```ts
{
  id: string;
  sentenceIds: string[];
  category: "PHRASE" | "COLLOCATION" | "SENTENCE_PATTERN" | "DISCOURSE" | "REFERENCE" | "TONE" | "ELLIPSIS" | "RHYTHM";
  target: string;
  meaningInContext: string;
  functionInArticle: string;
  whyWorthLearning: string;
  transferValue: string;
  likelyLearnerProblem: string;
  teachingDepth: "LIGHT" | "MEDIUM" | "DEEP";
  contrastOrClarification?: string;
  exampleEn?: string;
  callbackSentenceIds?: string[];
}
```

### 禁止

- 不见词就讲；
- 不每句话讲语言点；
- 不把课程改成词汇语法课；
- 不给每个语言点添加多个冗长例句；
- 不让语言教学打断文章推进。

### 输出

`languageLearningMap`。

## 阶段七：双轨 Teaching Beat

每个 Beat 同时考虑内容目标和语言目标：

```ts
{
  id: string;
  sentenceIds: string[];
  contentGoal: string;
  languageGoal?: {
    learningPointIds: string[];
    learnerShouldNotice: string;
    learnerShouldUnderstand: string;
  };
  teacherMove: "CONTENT_FLOW" | "CONTENT_LANGUAGE_BLEND" | "LANGUAGE_SPOTLIGHT" | "CONTRAST_AND_REPLAY" | "FAST_PASSAGE";
  rhetoricalFunction: string;
  deliveryPattern: string;
  spotlightSentenceIds: string[];
  listenerUnderstandingAfter: string;
  energy: "LIGHT" | "MEDIUM" | "HEAVY";
}
```

### 设计原则

- 有些 Beat 只负责快速推进内容；
- 有些 Beat 负责内容和语言融合；
- 少数 Beat 可以形成语言聚焦；
- 语言点必须从当前原文自然发生，讲完后回到文章；
- 不为每个 Beat 强制加入语言点；
- 不连续多个 Beat 只讲内容，也不连续多个 Beat 都停下来讲语言；
- 不把语言讲解统一放在每段结尾；
- 不机械按段落或句子切分。

### 输出

`teachingBeatPlan`。

## 阶段八：Teacher Performance Plan

### 目标

把活人感变成可执行的教师动作。数量不设配额，也不是每个 Beat 一个；只安排文章真正需要的判断。

```ts
{
  moves: Array<{
    id: string;
    type: "MAKE_A_CHOICE" | "ANTICIPATE_CONFUSION" | "CALL_BACK" | "COMPARE_EXPRESSIONS" | "NOTICE_TONE" | "REPLAY_WITH_PURPOSE" | "LIGHT_REACTION" | "SKIP_EXPLICITLY";
    beatId: string;
    sentenceIds: string[];
    purpose: string;
    mustAvoid: string;
  }>;
}
```

教师动作包括：明确取舍、预判困惑、回扣前文、比较表达、注意语气、带目的重读、少量真实反应、明确放过低价值内容。

### 禁止

- 不用口头禅代替判断；
- 不增加无价值闲聊；
- 不虚构教师经历；
- 不不断称赞用户；
- 不每个语言点都说“非常地道”；
- 不让每段使用相同反应。

### 输出

`teacherPerformancePlan`。

## 阶段九：完整讲稿初稿

Codex 必须读取：原文、全部分析和计划、三份教师资产、优秀样例、失败样例及目标时长，一次从全文角度创作完整讲稿。

讲稿必须同时保持：内容推进、英语学习收益、教学节奏和同一位老师的连续存在感。

语言讲解遵循：

```text
理解原句
→ 注意英文如何表达
→ 解释为什么这样说
→ 回到文章继续推进
```

逐句覆盖是后台要求，不是讲稿的表面结构。相关句子可以连续朗读后统一解释；简单句自然融入；只有核心句、重要表达、关键转折和真实易错点才停下来展开。

### 禁止

- 不写成中文知识播客；
- 不写成脱离文章的词汇语法课；
- 不每句话单独生成；
- 不每个 Beat 独立生成后由程序拼接；
- 不使用固定模板组成最终讲稿；
- 不添加文章外事实、练习、任务或虚构经历。

### 输出

`fullScriptDraft`。

## 阶段十：English Teaching Editor

先由英语教学编辑重写完整初稿，直接输出完整修订稿，而不是只给意见。

检查：用户具体学到了什么英语；是否主要复述中文内容；语言点是否可迁移；是否包含词组、句型、篇章、语气、指代等不同层次；是否解释英文为何这样表达；语言点是否来自原文；讲完后是否回到文章；是否连续两个以上阶段没有英语收益；语言讲解是否压过文章主线；例句是否过多。

### 输出

`englishTeachingEdit`，并更新完整讲稿。

## 阶段十一：Human Voice Editor

在英语教学编辑后，直接重写完整受影响部分，检查：

- 老师是否有真实取舍和预判；
- 是否记得前文并自然回扣；
- 是否对原文语言作出少量真实判断；
- 重读原句是否有明确目的；
- 是否明确放过低价值内容；
- 是否像同一位老师从头讲到尾；
- 是否像播音稿或说明书；
- 是否过度使用“我们来看”“接下来”“这里很有意思”；
- 是否为了活泼加入废话或虚构经历。

活人感不是更多口语词，而是老师在阅读现场做出真实判断。

### 输出

`humanVoiceEdit`。

## 阶段十二：Final Critic

Final Critic 在两轮编辑后执行，按 [INSTRUCTIONAL_QUALITY_STANDARD.md](INSTRUCTIONAL_QUALITY_STANDARD.md) 评分 1–5。每项分数必须附具体正面证据和失败证据，包含 stage/beat/sentence 定位、必要时的原文摘录、原因和修改要求；不得只写“整体自然”或“教学价值良好”。

```ts
{
  blocking: boolean;
  scores: {
    factualFidelity: number;
    sentenceCoverage: number;
    contentUnderstanding: number;
    articleNarrative: number;
    languageLearningValue: number;
    transferValue: number;
    languagePointSelection: number;
    articleLanguageIntegration: number;
    teacherPresence: number;
    humanNaturalness: number;
    rhythmVariation: number;
    spokenNaturalness: number;
    nonTemplateQuality: number;
  };
  issues: Array<{
    severity: "BLOCKER" | "MAJOR" | "MINOR";
    beatIds?: string[];
    sentenceIds?: string[];
    problem: string;
    requiredAction: string;
  }>;
}
```

通过门槛是标准中规定的 8 个核心维度均 `>= 4`，并且没有事实错误、原句篡改、漏句、严重语言点误解、虚构经历或程序拼接路径。至少标记为 MAJOR 的情况：全篇主要讲文章内容、用户无法说出英语学习收益、语言点全是词义、连续阶段没有英语收益、语言讲解后没有回到文章、教师没有取舍/预判/回扣、活人感只来自口头禅、每个 Beat 结构相同或稿件像播音稿。

BLOCKER 包括：错误解释原文、改写原句、遗漏正文、语言点错误、虚构经历或严重模板拼接。

### 输出

`finalQualityReview`、`instructionalQualityReview`、`qualityEvidence`。低于门槛时进入局部、Stage 级或全文返工；程序不得自动插入过渡语或语言点。

## 阶段十三：整体修订与确定性校验

涉及内容线、英语学习线、活人感、节奏、语言点分布或教师人格的问题，必须重新读取全文和全部规划，重写整个受影响 Stage，必要时重写全文。只有单一表达错误、重复、过长或映射问题才允许局部修改。

程序只负责：sentence ID 覆盖、原句原样出现、顺序、Beat 引用、Schema、音频和时间映射。程序不得判断或生成语言教学、教师反应、过渡语、例句或活人感，也不得将 `meaningZh + languagePoint + transition` 拼成口播稿。

## 产物保存

保存入口仍是 `src/lib/course-generation/codex-persistence.ts`，只保存 Codex 已生成的结果，不调用模型、不改写讲稿。

`CourseScriptGeneration` 保存：

- `articleUnderstanding`
- `narrativePlan`
- `sentenceAnalysis`
- `languageLearningMap`
- `teachingBeatPlan`
- `teacherPerformancePlan`
- `lessonDesignRationale`
- `fullScriptDraft`
- `englishTeachingEdit`
- `humanVoiceEdit`
- `finalQualityReview`
- `instructionalQualityReview`
- `qualityEvidence`
- `calibrationNotes`
- `repairHistory`
- `finalScript`

新版本默认状态为 `NEEDS_REVIEW`，不得自动覆盖公开课程或自动进入 TTS。

## 导入、音频和发布

审阅通过后：

1. 将最终课程内容写入 `scripts/seed-course.ts` 的 `CourseImport`。
2. 运行 `npm run db:migrate` 和 `npm run db:seed`。
3. 运行 `npm run audio:generate -- --article <slug> --mode guided`。
4. 运行 `npm run audio:generate -- --article <slug> --mode reading`。
5. 运行 `npm run course:validate -- --article <slug>`。
6. 按下方检查表人工试听讲解模式和阅读模式。
7. 审阅和试听通过后才将课程设为公开状态。

## 人工试听检查表

### 英语教学

- 用户具体学到了哪些表达？
- 是否有词组、句型、篇章和语气的变化？
- 是否只是在听中文内容解释？
- 语言讲解是否来自原文并自然回到文章？
- 是否存在低价值词汇或过多例句？

### 活人感

- 老师有没有明确取舍、预判和回扣？
- 有没有带目的重读原句？
- 有没有明确放过不值得讲的地方？
- 是否像真人老师而不是配音稿？
- 是否通过废话假装自然？
- 是否像同一个人从头讲到尾？

### 整体

- 内容理解线和英语学习线是否同时存在？
- 是否有一条长期消失？
- 重点是否形成高峰？
- 文章是否完整向前推进？
- 用户是否既理解文章，也感觉学到了一些可迁移的英文？

## 当前代码边界

- 教师资产：`docs/handoff/teacher/`、`docs/handoff/examples/`；
- 内容生产：`src/lib/course-generation/`、本文件；
- 课程导入和校验：`scripts/seed-course.ts`、`src/lib/db/article-repository.ts`、`src/lib/validation/course-schema.ts`、`scripts/validate-course.ts`；
- 用户端消费：`src/components/reader/`、`src/features/reader/`、`src/server/articles/public-query.ts`。

## 禁止事项

- 不新增后台管理页面或内容编辑器；
- 不恢复 LLM Provider、GenerationJob 或运行时生成 API；
- 不引入第二套 Prompt、第二套工作流或第二套课程数据源；
- 不由程序拼接讲稿；
- 不让未审阅的生成版本进入公开课程；
- 不改变用户端讲解、阅读、高亮、自动跟随、进度保存和发布流程。
