# XReader 课程生产工作流简化重构 Prompt

## 任务目标

当前 XReader 已经完成 Codex 生产课程、XReader 消费课程的边界拆分，但课程生产工作流被设计得过于复杂，并且复杂流程正在稳定地产出错误类型的讲稿。

当前结果的典型问题是：

- 没有自然的课程开场，直接从文章第一句开始；
- 像英文原句配中文解说，不像真人老师带读；
- 主要解释文章内容，没有真正教授英语；
- 逐句推进，节奏很赶；
- 每句话都被处理，但用户没有形成明确语言收获；
- Teaching Beat、Language Learning Map、Teacher Performance Plan 等中间产物看起来完整，最终可听讲稿却没有落实；
- 大量逐句字段反过来锚定了 Codex，让它按句子依次完成任务；
- 多轮 Editor 和 Critic 只在错误产品形态上继续润色。

请在当前已经实现的代码基础上，重构课程生产工作流。

这不是再次增加阶段、Schema、评分维度或 Prompt 文件。

本次重构方向是：

> 删除不必要的中间教学生产层，只保留一份高质量总 Prompt，由 Codex 直接根据完整文章创作一节真人英语带读课；程序只做确定性校验、持久化、音频生成、导入和播放。

---

# 一、保持产品边界不变

继续保持：

```text
Codex Client = 课程内容生产者
XReader = 课程保存、校验、播放和发布终端
```

不得改变：

- XReader 不在运行时调用 LLM；
- XReader 不提供 AI 内容生产后台；
- XReader 不运行讲稿生成；
- XReader 不自动修改课程内容；
- XReader 不自动发布未审阅课程；
- 阅读模式、讲解模式、音频、高亮、自动跟随、阅读进度和发布功能保持不变；
- Fish Audio 仍由 Codex 工作流调用；
- 最终课程仍通过现有 CourseImport、持久化和校验流程进入 XReader。

---

# 二、先审查现有实现

修改前，检查并列出：

- 当前唯一 `CODEX_WORKFLOW.md`；
- 当前所有课程生成 Prompt；
- `src/lib/course-generation/`；
- `codex-persistence.ts`；
- `CourseScriptGeneration`；
- `Language Learning Map`；
- `Teaching Beat Plan`；
- `Teacher Performance Plan`；
- `English Teaching Editor`；
- `Human Voice Editor`；
- `Final Critic`；
- `SentenceGuide`、`ParagraphGuide`；
- 课程 seed 或 CourseImport；
- Fish Audio 输入；
- 确定性覆盖校验；
- 当前最终讲稿具体由哪些文件、字段和步骤产生。

重点搜索下列模式：

```text
meanings
depths
focusScripts
paragraphGoals
primaryTeachingGoal
sentenceFunction
openingBridge
meaningScript
bridgeScript
deliveryPattern
```

检查是否存在以下错误：

1. 按句子位置自动生成 `sentenceFunction`；
2. 按 QUICK / NORMAL / DEEP 自动生成教学目标；
3. 先生成逐句讲解字段，再让 Codex 围绕字段写稿；
4. 讲稿按段落或句子分别生成；
5. Editor 和 Critic 主要读取中间规划，而不是只审查最终可听讲稿；
6. 规划中存在语言点，但最终讲稿没有真正教授；
7. 最终音频输入仍带有“英文一句、中文一句”的结构；
8. 课程是否因覆盖校验而被迫逐句停顿。

先输出审查报告，并标明：

- 保留；
- 降级为内部参考；
- 移出主生成路径；
- 删除；
- 暂时兼容。

不要先删除代码。

---

# 三、重新定义唯一生产流程

将当前复杂流程简化为：

```text
读取完整文章、课程目标、教师规范和编辑记忆
→ Codex 使用唯一总 Prompt 直接生成完整带读课
→ Codex 对完整讲稿进行一次自审和必要重写
→ 程序执行确定性校验
→ 人工阅读讲稿
→ Fish Audio
→ 人工完整试听
→ 导入 XReader
→ 发布
```

允许 Codex 在内部思考文章结构、语言价值和教学取舍。

但不再要求把这些思考全部持久化为独立生产阶段。

---

# 四、主生成路径只保留四类产物

建议主路径只保存：

```text
CourseScriptGeneration
├── sourceArticle
├── generationRequest
├── fullGuidedLesson
├── qualityReview
├── repairHistory
└── finalScript
```

其中：

## sourceArticle

保存完整文章、段落 ID 和句子 ID。

## generationRequest

保存使用的总 Prompt 版本、课程目标、受众、时长和教师风格。

## fullGuidedLesson

Codex 一次直接输出的完整课程，包括：

- 课程开场；
- 连续带读正文；
- 课程收束；
- 自由划分的教学片段；
- 原句覆盖映射；
- 最终实际教授的英语收获。

## qualityReview

只审查最终可听讲稿。

## repairHistory

记录 Codex 对完整讲稿或较大连续部分的重写。

## finalScript

进入 TTS 的唯一文本来源。

---

# 五、将以下产物移出主生成路径

以下内容如果现有代码仍依赖，可以暂时兼容保存，但不得继续作为生成最终讲稿的强制前置步骤：

- `sentenceAnalysis`
- `languageLearningMap`
- `teachingBeatPlan`
- `teacherPerformancePlan`
- `lessonDesignRationale`
- `englishTeachingEdit`
- `humanVoiceEdit`
- 多套 Critic 评分产物
- 每句 QUICK / NORMAL / DEEP
- 每句 `primaryTeachingGoal`
- 每句 `focusScript`
- 每段 `paragraphGoal`

处理方式：

1. 不要立即破坏旧课程；
2. 新课程默认走简化流程；
3. 旧 Schema 可通过 adapter 兼容；
4. 新总 Prompt 可在一次生成中自行做出这些判断；
5. 不要让这些字段成为最终讲稿的输入锚点；
6. 不要再为了填满 Schema 而生成无价值分析。

---

# 六、最终讲稿必须先自由创作，再做覆盖映射

正确顺序：

```text
Codex 阅读完整文章
→ 直接创作完整课程
→ 完成后标注各教学片段覆盖了哪些 sentenceId
→ 程序校验所有原句是否出现
```

禁止顺序：

```text
逐句生成 meaning
→ 逐句生成 focus
→ 按句子或段落拼接
→ 再润色
```

最终讲稿的表面结构不能由 sentenceId 决定。

允许：

- 连续读两到四句再统一解释；
- 一句话快速带过；
- 对真正值得学习的句子停下来；
- 解释后重听一句；
- 跨自然段形成一个教学动作；
- 根据文章自由控制节奏。

---

# 七、新版最小输出 Schema

不要再设计复杂教学规划 Schema。

建议总 Prompt 输出：

```ts
type FullGuidedLesson = {
  title: string;

  openingScript: string;

  sections: Array<{
    id: string;
    sourceSentenceIds: string[];
    scriptText: string;
  }>;

  closingScript: string;

  taughtEnglish: Array<{
    sourceSentenceIds: string[];
    target: string;
    learnerGain: string;
  }>;

  coverage: Array<{
    sentenceId: string;
    readExactly: boolean;
    meaningCovered: boolean;
    sectionId: string;
  }>;

  fullTtsScript: string;
};
```

注意：

- `sections` 只用于保存自然教学片段和音频切片；
- Codex 自由决定 section 数量和边界；
- 不要求一个 section 对应一个段落；
- 不要求固定教学模式；
- `scriptText` 是 Codex 完整写出的内容；
- 程序不得从 `taughtEnglish` 或 `coverage` 拼接口播；
- `fullTtsScript` 是唯一完整口播文本；
- 若程序连接 section，只能原样连接 Codex 已经完整创作的文本，不得插入模板语言。

---

# 八、重新定义质量审查

取消或降级复杂的多轮角色链。

新主路径只保留一次严格审查：

```text
Codex 重新阅读：
- 完整原文；
- 最终可听讲稿；
- 总 Prompt；
- 质量检查表。

如果不合格，直接重写完整讲稿或较大的连续部分。
```

只审查最终用户能听到的内容，不因中间 JSON 中存在语言点而判定合格。

必须检查：

## 1. 开场

- 是否有自然话题引入；
- 是否提出值得继续听的问题；
- 是否告诉用户今天能读懂什么；
- 是否让用户知道会学到什么英语；
- 是否避免空洞欢迎词。

## 2. 真人教师感

- 是否在与学习者说话，而不是写文章分析报告；
- 是否做出取舍；
- 是否明确什么只需听懂、什么值得掌握；
- 是否预判真实困惑；
- 是否有目的地重听原句；
- 是否回扣前面学过的内容；
- 是否避免靠口头禅制造自然。

## 3. 英语教学

- 最终讲稿是否实际教授英语；
- 是否解释英语怎样组织意思；
- 是否包含词组、句型、结构、语气、指代或阅读方式中的真实学习价值；
- 是否只是把英文翻译成中文；
- 用户听完是否能明确说出学到了什么；
- 语言教学是否来自当前文章。

## 4. 节奏

- 是否仍然英文一句、中文一句；
- 是否连续处理所有句子；
- 是否敢于合并简单内容；
- 是否在重点处充分停留；
- 是否讲完重点后重新听；
- 是否整体过于赶进度；
- 是否有自然的快慢、停顿和回扣。

## 5. 收束

- 是否回答开场问题；
- 是否总结文章而不重复全文；
- 是否清楚回顾少量真正学到的英语；
- 是否像一节课结束，而不是文章突然读完。

---

# 九、确定性校验只负责硬错误

程序只检查：

- sentenceId 是否有效；
- 原文是否按顺序出现；
- 每句是否至少读到一次；
- 每句基本含义是否被覆盖；
- 是否篡改原句；
- 音频文件是否存在；
- 时间映射是否合法；
- Schema 是否有效。

程序不得：

- 生成中文解释；
- 生成教师反应；
- 自动补语言点；
- 自动补开场；
- 自动补过渡；
- 根据 depth 调整讲稿；
- 将多个字段拼接为口播；
- 因为每句必须覆盖而要求每句独立解释。

---

# 十、课程开场成为硬性要求

新课程必须有一段独立开场，但不规定固定文案。

开场必须完成：

1. 从真实体验、问题、反差或观察进入话题；
2. 建立文章要回答的核心问题；
3. 简要告诉用户这篇文章为什么值得读；
4. 提示本课可能学到的英语方向；
5. 自然进入原文。

开场不是：

- 大家好，欢迎来到今天的课程；
- 今天我们要学习一篇文章；
- 这篇文章非常有意思；
- 长篇背景科普；
- 提前把全文答案讲完。

---

# 十一、英语教学成为硬性可听结果

所有质量检查必须以 `fullTtsScript` 为准。

以下内容只有实际出现在最终讲稿里，才算已经教授：

- 词组；
- 搭配；
- 句型；
- 语法；
- 文章结构；
- 阅读技巧；
- 作者语气；
- 指代或省略；
- 听力注意点。

如果它只存在于：

- `Language Learning Map`；
- `focusScripts`；
- `Teacher Performance Plan`；
- `qualityReview`；

但没有出现在 `fullTtsScript`，则一律不计入学习成果。

---

# 十二、当前雨味课程作为强制回归样例

使用当前课程：

```text
Why Does Rain Have a Smell?
```

保持英文原文不变。

用新总 Prompt 重新生成。

旧稿存在以下问题，必须在回归报告中逐项对比：

- 第一秒直接进入第一句，没有课程引子；
- 大部分结构为英文一句、中文解释一句；
- 主要解释雨味机制，没有系统教授英语；
- `focusScripts` 中的语言点没有充分进入可听稿；
- 节奏平均且赶；
- 很少明确告诉用户什么值得学、什么不用记；
- 没有充分的解释后重听；
- 结尾主要总结内容，没有回顾英语收获；
- 代码根据句子位置自动生成 `sentenceFunction`；
- 代码根据 depth 自动生成 `primaryTeachingGoal`。

新稿验收必须包含：

1. 有自然开场；
2. 至少让用户获得清晰可描述的英语学习成果；
3. 不再逐句翻译；
4. 简单内容成组处理；
5. 重点处明显放慢；
6. 至少有一次有目的的原句重听；
7. 有真实教师取舍；
8. 有课程式结尾；
9. 完整试听后确认不赶。

不要修改英文文章来绕过问题。

---

# 十三、Fish Audio 和切片

音频单位使用 Codex 自由生成的自然 `section`。

不要：

- 一句一条音频；
- 英文一句和中文解释分别生成；
- 按自然段强制切片。

每个 section 应是一个完整教学动作，通常可以包含：

- 话题引导；
- 多句原文；
- 中文理解；
- 一个英语学习重点；
- 重听；
- 自然过渡。

但不要求所有 section 都包含这些部分。

TTS 前必须完整阅读 `fullTtsScript`，确保片段连接自然。

---

# 十四、迁移策略

按以下顺序实施：

## Phase 1：审查

输出当前复杂链路和最终讲稿之间的真实依赖图。

## Phase 2：接入总 Prompt

在不删除旧链路的情况下，为新课程增加 `SINGLE_MASTER_PROMPT` 生成模式。

## Phase 3：最小 Schema

实现 `FullGuidedLesson`，适配现有存储与播放器。

## Phase 4：回归样例

用雨味文章生成新稿、校验、生成音频并试听。

## Phase 5：对比通过

人工确认新稿明显优于旧稿后，将新模式设为默认。

## Phase 6：降级旧链路

将旧复杂流程标记为 legacy，不再用于新课程。

## Phase 7：清理

确认旧课程兼容后，删除无引用代码和重复 Prompt。

---

# 十五、不可违反的约束

- 不要增加新的生成阶段；
- 不要创建新的复杂 Agent 链；
- 不要创建第二套教学规划体系；
- 不要用更多 Schema 代替对齐；
- 不要修改英文文章来掩盖讲稿问题；
- 不要让逐句覆盖决定讲稿表面结构；
- 不要让中间规划代替最终可听效果；
- 不要让程序参与讲稿写作；
- 不要破坏旧课程播放；
- 不要修改 XReader 用户端；
- 不要恢复运行时 LLM；
- 不要自动发布；
- 不要在没有完整试听雨味课程前宣布完成。

最终目标：

> Codex 直接写出一节真人英语老师主持的文章带读课。它有自然开场，带用户逐步读懂文章，在真正值得学习的地方停下来教授英语，并通过取舍、预判、重听和回扣形成真人教师感。

而不是：

> 先生产大量教学 JSON，再稳定地把文章逐句解释成中文。
