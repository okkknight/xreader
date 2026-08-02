# XReader 内容生成工作流重构 Prompt

你现在要重构当前 XReader 项目的整套课程内容生成与导入工作流。

请先完整检查现有代码库、课程数据结构、生成脚本、Prompt、校验器、导入流程、音频生成流程和阅读器消费方式，再开始修改。

不要在没有理解现状的情况下直接新增一套平行系统。

本次重构的目标不是修补旧流程，而是用新的内容生产范式替换旧流程：

> 以“五阶段逐句带读 Prompt 包”生成的最终讲稿作为唯一教学终稿，再由 Codex 和少量确定性程序把终稿解析、校验、转换并导入 XReader。

---

# 一、核心产品原则

## 1. 最终讲稿是唯一教学真相源

新的内容生产流程如下：

```text
英文原文
→ 第一阶段：完整逐句带读初稿
→ 第二阶段：教学节奏导演
→ 第三阶段：学习者理解路径与课程编排
→ 第四阶段：真人口播与去 AI 化编辑
→ 第五阶段：Seven 教师人格与真教学终审
→ final-lecture.md
```

第五阶段输出的完整 Markdown 讲稿，就是课程教学内容的最终版本。

从这一刻开始：

- 不再重新生成教学内容；
- 不再重新选择语言点；
- 不再重新决定句子讲解深度；
- 不再通过多个结构字段拼装讲稿；
- 不再由程序补写开场、过渡、总结或共情；
- 不再由后续 AI 自动“优化”讲稿；
- 不再从 JSON 反向生成课程正文。

所有工程产物都必须从 `final-lecture.md` 派生。

---

## 2. 内容生产与工程适配彻底分层

### 内容生产层

负责：

- 文章如何讲；
- 每句话教什么；
- 哪些地方讲快或讲慢；
- 怎样保持真人感；
- 怎样加入开场、结尾和教师温度。

这些事情全部由五阶段 Prompt 完成。

### 工程适配层

只负责：

- 识别终稿结构；
- 精确定位英文原句；
- 切分教学块；
- 标记内容角色；
- 转换为 XReader 可消费的数据结构；
- 生成音频；
- 建立音频与内容块之间的关联；
- 进行客观工程校验；
- 导入、预览和发布。

工程适配层不得拥有课程编辑权。

最重要的限制：

> 解析器、导入器、音频构建器和 XReader 适配程序不得改写终稿中的任何教学文字。

遇到旧数据结构无法表达的内容时，应修改数据结构，而不是修改讲稿。

---

# 二、先审查并拆除旧内容工作流

请在代码库中定位并审查所有与旧课程生成工作流有关的内容，包括但不限于：

- Prompt 文件；
- 文章理解模块；
- Narrative Plan；
- 逐句分析；
- Teaching Beat；
- Language Learning Map；
- Teacher Performance Plan；
- QUICK / NORMAL / DEEP 或其他讲解深度逻辑；
- sentenceFunction；
- primaryTeachingGoal；
- guidedScripts；
- meanings；
- depths；
- focusScripts；
- paragraphGoals；
- Critic；
- 编辑器链；
- 自动修订链；
- 语言点覆盖校验；
- 固定比例或固定数量校验；
- 讲稿拼接器；
- 自动补标题、段落总结和结尾的程序；
- 根据字段重新合成讲稿的逻辑；
- 旧课程导入器；
- 旧音频切分方式；
- 只为旧工作流服务的数据库字段和类型。

对每一项做出明确处理：

- 删除；
- 替换；
- 迁移；
- 标记废弃；
- 暂时保留兼容层。

不要为了“以后可能有用”而保留大量无效抽象。

优先让系统变简单。

但不要盲目删除仍被现有阅读器、历史课程或数据库迁移依赖的代码。需要兼容时，提供最薄的兼容层，并明确标注废弃路径。

---

# 三、建立新的课程生产目录约定

建议采用类似结构；可根据项目现有目录做合理调整，但职责必须保持清晰：

```text
courses/
  <course-slug>/
    source/
      article.md

    prompts/
      01-complete-guided-reading.md
      02-teaching-rhythm.md
      03-spoken-edit.md
      04-opening-ending.md
      05-teacher-warmth.md

    drafts/
      stage-01.md
      stage-02.md
      stage-03.md
      stage-04.md
      stage-05.md

    final/
      lecture.md

    build/
      course.json
      parse-report.json
      validation-report.json
      audio-manifest.json

    audio/
      block-001.mp3
      block-002.mp3
      ...

    package/
      course.zip
```

原则：

- `source/article.md` 是英文原文真相源；
- `final/lecture.md` 是教学讲稿真相源；
- `drafts/` 仅用于追踪五阶段中间结果；
- `build/` 全部是可重新生成的派生产物；
- XReader 不直接消费五阶段中间稿；
- 最终课程包只需要终稿、结构化课程数据和资源文件。

不要把生成过程塞进数据库。

课程生产应优先在文件系统和 Codex 工作流中完成，最终成品再导入 XReader。

---

# 四、设计新的 Course Block 数据模型

不要继续把讲稿硬塞回旧的 `guidedScripts / meanings / depths / focusScripts` 结构。

请设计一个以“有序教学块”为核心的数据模型。

推荐方向：

```ts
type CourseBlock =
  | IntroBlock
  | TitleBlock
  | SentenceBlock
  | BridgeBlock
  | RecapBlock
  | OutroBlock;
```

可以根据当前项目语言和架构调整命名，但必须能自然表达以下内容。

---

## 1. IntroBlock

用于：

- 标题前的生活引子；
- 场景进入；
- 阅读前的轻微问题或悬念。

示例：

```json
{
  "id": "block-001",
  "type": "intro",
  "segments": [
    {
      "language": "zh",
      "role": "teaching",
      "text": "有时候，雨还没有真正落下来，空气里的味道却已经变了。"
    }
  ]
}
```

---

## 2. TitleBlock

用于：

- 英文标题；
- 标题中文理解；
- 标题语言教学；
- 标题建立的问题、场景或阅读期待。

示例：

```json
{
  "id": "block-002",
  "type": "title",
  "original": "Why Does Rain Have a Smell?",
  "segments": [
    {
      "language": "en",
      "role": "original",
      "text": "Why Does Rain Have a Smell?"
    },
    {
      "language": "zh",
      "role": "teaching",
      "text": "雨为什么会有气味？"
    }
  ]
}
```

---

## 3. SentenceBlock

每个英文正文原句都必须有一个稳定的句子锚点。

推荐结构：

```json
{
  "id": "block-003",
  "type": "sentence",
  "sentenceId": "p1-s1",
  "paragraphIndex": 0,
  "sentenceIndex": 0,
  "original": "People often notice the smell of rain before the first drop reaches the ground.",
  "segments": [
    {
      "language": "en",
      "role": "original",
      "text": "People often notice the smell of rain before the first drop reaches the ground."
    },
    {
      "language": "zh",
      "role": "teaching",
      "text": "很多人在第一滴雨落地之前，就已经察觉到了雨的气味。"
    },
    {
      "language": "en",
      "role": "reread",
      "text": "People often notice the smell of rain before the first drop reaches the ground."
    }
  ]
}
```

重点：

- 同一句原文可以在讲解前后出现多次；
- 不要只保存一个 `guidedScript` 字符串；
- 保留讲稿实际顺序；
- `segments` 的文本必须来自终稿原文，不能重新生成；
- `role` 用于播放、显示和音频控制，不用于重新写课。

建议的 segment role 可以包括：

```ts
type SegmentRole =
  | "original"
  | "teaching"
  | "reread"
  | "quote"
  | "transition"
  | "recap"
  | "warmth";
```

保持角色集合精简，不要再制造几十个教学字段。

---

## 4. BridgeBlock

用于不适合强行挂到某个句子下面的内容：

- 段落过渡；
- 文章进度说明；
- 两部分之间的连接；
- 教师对当前阅读任务的提示；
- 学习状态切换；
- 少量教师温度表达。

示例：

```json
{
  "id": "block-010",
  "type": "bridge",
  "segments": [
    {
      "language": "zh",
      "role": "transition",
      "text": "到这里，标题问题最核心的一半已经读清楚了。"
    }
  ]
}
```

---

## 5. RecapBlock

用于：

- 多句连读；
- 一个过程、因果链、论证阶段或场景的整合；
- 段落回收。

它与 BridgeBlock 可以分开，也可以在项目中合并成一个通用教学块。请根据实际阅读器需求选择最简单的实现。

不要为了类型纯洁而过度拆分。

---

## 6. OutroBlock

用于：

- 回到标题；
- 文章最终回答或收束；
- 少量阅读收获；
- 真人式课程结束。

---

# 五、终稿解析策略

采用：

> 确定性程序负责精确原文锚定，Codex 负责有限的语义分块。

不要完全依赖正则，也不要完全交给模型自由重写。

---

## 第一步：从原文建立权威句子清单

从 `source/article.md` 提取：

- 标题；
- 自然段；
- 每个正文句子；
- paragraphIndex；
- sentenceIndex；
- 稳定 sentenceId；
- 原始字符内容。

句子切分必须考虑：

- 缩写；
- 引号；
- 对话；
- 问号和感叹号；
- 省略号；
- 标题；
- Markdown 格式。

如现有项目已有可靠分句器，可以复用；否则实现一个足够简单、可测试的版本，并允许人工修正 `article.md` 中的句子边界。

---

## 第二步：在终稿中精确匹配原句

程序必须验证：

- 标题是否存在；
- 每个原句是否至少出现一次；
- 第一次教学出现是否按原顺序；
- 是否有原句被篡改；
- 是否有漏句；
- 是否存在无法确认的近似匹配。

允许同一句原文因重听而多次出现。

不能简单用“出现次数必须等于 1”校验。

如果原文中存在完全相同的重复句子，需要结合顺序和上下文区分。

---

## 第三步：按英文原句锚点切出初始片段

程序根据标题和英文原句出现位置，把终稿切成连续片段。

初始片段至少保留：

- 原始文本；
- 起止字符位置；
- 前后锚点；
- 关联 sentenceId；
- 是否为标题；
- 是否可能是重听；
- 是否位于两个句子之间。

此阶段不要改写文本。

---

## 第四步：让 Codex 进行受限语义标记

Codex 只负责判断原始片段的角色：

- intro；
- title teaching；
- original；
- sentence teaching；
- reread；
- bridge；
- recap；
- outro。

Codex 必须遵守：

- 不新增任何文字；
- 不删除任何文字；
- 不改写任何文字；
- 不修正措辞；
- 不重排文字；
- 不补充教学内容；
- 只把已有文本原样归类；
- 不确定时标记 `needsReview`，不能猜测后修改。

输出必须包含字符范围或原始文本哈希，以便程序确认没有内容变化。

---

## 第五步：程序生成 Course JSON

将标记结果转换为 XReader Course Schema。

要求：

- block 顺序与终稿一致；
- segment 顺序与终稿一致；
- 所有终稿文字都被消费；
- 不允许出现未归属文本；
- 不允许产生终稿中不存在的文字；
- 每个正文原句都关联稳定 sentenceId；
- 重听片段关联到同一句；
- Bridge / Recap / Outro 不被强行塞进相邻句子的讲解字段。

---

## 第六步：往返还原校验

实现一个 renderer：

```text
course.json
→ render
→ reconstructed-lecture.md
```

对标准化后的文本执行：

```text
normalize(reconstructed-lecture.md)
===
normalize(final/lecture.md)
```

`normalize` 只允许处理无语义差异的格式，例如：

- Markdown 加粗标记；
- 多余空行；
- 行尾空格；
- 统一换行符；
- 明确允许的标点空格规范。

不得用 normalize 掩盖：

- 文本丢失；
- 文本改写；
- 顺序变化；
- 重复；
- 英文原句变化。

若无法无损还原，构建失败并生成清晰报告。

---

# 六、只保留客观工程校验

删除以教学审美为名的死板自动校验。

---

## 必须保留的硬校验

1. 英文标题存在；
2. 原文全部句子出现在终稿中；
3. 原句首次出现顺序正确；
4. 原句未被篡改；
5. 没有漏句；
6. 重听重复可被正确归属；
7. 终稿全部文本都被解析；
8. Course JSON 符合 Schema；
9. Course JSON 可无损还原终稿；
10. 音频资源生成成功；
11. 每个可播放块有正确资源映射；
12. XReader 可以完整导入；
13. 课程可以从头播放到尾；
14. 资源路径、Markdown、JSON 和数据库记录有效。

---

## 不再硬校验的内容

不要用程序要求：

- 每句话必须有几个语言点；
- 每段必须有总结；
- 重听必须达到某个比例；
- 共情必须出现几次；
- 标题必须提出问题；
- 每句必须分配深度；
- 重点句必须占多少；
- 例句数量；
- 真人感评分；
- 教师温度评分；
- QUICK / NORMAL / DEEP；
- 综合课程质量分数；
- 自动 Critic 达到某个阈值。

可以提供只读统计，但不得据此自动重写终稿。

---

# 七、音频构建重构

不要默认：

- 整篇终稿一次生成一条超长音频；
- 每个英文句子都单独生成一条碎片音频。

请结合现有 TTS 服务、成本、上下文表现和阅读器交互设计合理音频单元。

推荐按“自然教学块组”生成，例如：

- intro + title；
- 一个自然段内的一组 sentence blocks；
- 一个 recap；
- outro。

音频构建需要支持：

- 局部失败重试；
- 某个块修改后只重建相关音频；
- 稳定顺序；
- 音频时长记录；
- 可选时间轴；
- XReader 定位到 block；
- 连续播放；
- 中英文声音和停顿自然。

请设计：

```json
{
  "audioId": "audio-003",
  "blockIds": ["block-010", "block-011", "block-012"],
  "path": "audio/audio-003.mp3",
  "durationMs": 123456,
  "status": "ready"
}
```

不要让音频切分反过来改变讲稿结构。

---

# 八、XReader 阅读器适配

检查当前阅读器如何消费课程数据。

重构目标：

- 以 Course Blocks 顺序播放；
- 能显示当前英文原句；
- 能显示或隐藏中文教学文字；
- 能支持原句首次朗读和重听；
- Bridge / Recap / Intro / Outro 有合理展示方式；
- 音频进度能关联到 block；
- 不要求所有内容都属于某个 sentence；
- 不依赖旧的 `depth`、`meaning`、`focusScript` 等字段；
- 不因为新 Schema 破坏基本阅读体验。

不要在本次重构中顺便大规模重做 UI。

优先实现新的内容模型和稳定播放。

如旧 UI 需要兼容层，保持最薄实现。

---

# 九、Codex 驱动方式

Codex 可以负责：

- 按顺序调用五阶段 Prompt；
- 保存每阶段输出；
- 解析终稿的语义边界；
- 生成课程构建文件；
- 运行校验；
- 调用已有音频构建命令；
- 报告需要人工审查的位置。

Codex 不得：

- 在第五阶段之后继续润色终稿；
- 为了通过 Schema 修改终稿；
- 根据校验分数重写教学内容；
- 擅自补写缺失课程；
- 把解析失败的文本丢弃；
- 在无法确定时静默猜测。

无法确定时：

- 生成 `needsReview`；
- 在 `parse-report.json` 中给出精确位置；
- 保留原始文本；
- 阻止正式发布，但允许人工修正后重新构建。

---

# 十、课程构建命令

请结合当前项目技术栈，提供简单清晰的命令。

目标体验类似：

```bash
# 创建课程目录
pnpm course:new <course-slug>

# 依次生成五阶段草稿
pnpm course:generate <course-slug>

# 锁定终稿并解析
pnpm course:build <course-slug>

# 生成音频
pnpm course:audio <course-slug>

# 校验课程
pnpm course:validate <course-slug>

# 导入 XReader
pnpm course:import <course-slug>
```

命令名称可以按项目现状调整。

不要为了命令体系引入大型工作流框架。

优先使用现有项目语言、包管理器和脚本体系。

---

# 十一、数据库与迁移

检查当前数据库中旧课程字段的使用情况。

请制定最小迁移方案：

- 新课程使用新 Course Block Schema；
- 旧课程可以继续读取，或提供一次性迁移脚本；
- 不要求一次性把所有历史课程重做；
- 新旧 Schema 的兼容期应尽量短；
- 标记废弃字段；
- 在确认无引用后删除；
- 不保留长期双写。

如果项目自用且历史课程很少，可以选择更直接的重建方案，但必须先确认数据规模与风险。

不要引入与本次内容工作流无关的认证、备份、部署或复杂权限系统。

---

# 十二、实现顺序

请按以下顺序工作：

## 阶段 1：现状审计

输出一份简洁的审计说明：

- 当前生成链路；
- 当前数据模型；
- 当前导入与播放方式；
- 需要删除或废弃的模块；
- 迁移风险；
- 推荐实施顺序。

不要只写文档，审计后继续执行重构。

---

## 阶段 2：建立新 Schema 与文件约定

完成：

- Course Block 类型；
- Course Schema；
- JSON Schema 或运行时校验；
- 课程目录规范；
- 示例课程。

---

## 阶段 3：实现终稿解析器

完成：

- 原文分句；
- 原句精确匹配；
- 初始切片；
- Codex 语义标记接口；
- Course JSON 生成；
- `needsReview`；
- parse report；
- 往返还原校验。

---

## 阶段 4：重构 XReader 消费层

完成：

- 导入新 Schema；
- 阅读器按 block 展示和播放；
- 音频映射；
- 最小旧格式兼容或迁移。

---

## 阶段 5：替换旧生成流程

完成：

- 五阶段 Prompt 文件接入；
- Codex 工作流说明或脚本；
- 中间稿保存；
- final lecture 锁定；
- 删除旧生成、拼接和 Critic 链；
- 删除死板教学校验。

---

## 阶段 6：音频与端到端验证

使用至少一篇真实文章完成：

```text
article.md
→ 五阶段讲稿
→ final lecture
→ parse
→ course.json
→ audio
→ import
→ XReader 完整播放
```

优先使用已有的成熟样例课程作为端到端测试样本。

---

# 十三、测试要求

必须增加自动测试。

至少覆盖：

## 原文匹配

- 全部句子只出现一次；
- 某句有重听；
- 原文中存在相同重复句；
- 对话包含引号；
- 缩写和小数点；
- Markdown 加粗英文；
- 原句被轻微篡改时构建失败；
- 原句乱序时构建失败；
- 漏句时构建失败。

## 解析

- intro；
- title；
- sentence teaching；
- reread；
- bridge；
- recap；
- outro；
- 无法确认的文本进入 `needsReview`；
- 所有文本被消费；
- 无内容丢失。

## 往返校验

- Course JSON 渲染后可还原终稿；
- 字符丢失时失败；
- 顺序变化时失败；
- 重复文本时失败。

## 导入与播放

- 合法课程可导入；
- block 顺序正确；
- 音频映射正确；
- 无音频资源时有明确错误；
- 课程可从头播放到尾。

---

# 十四、验收标准

本次重构完成必须满足：

1. 五阶段最终 Markdown 成为唯一教学终稿；
2. 旧的程序化教学生成和拼接链不再参与新课程生产；
3. 旧的死板教学质量校验被删除；
4. 新 Course Block Schema 能表达完整终稿；
5. Intro、Title、Sentence、Bridge、Recap、Outro 不再被强塞到旧句子字段；
6. 解析过程中不改写终稿；
7. 所有终稿文本都被结构化数据完整保存；
8. 原文句子完整、准确、顺序正确；
9. Course JSON 可无损还原终稿；
10. Codex 只做五阶段生成和受限语义标记；
11. 客观工程错误可以被自动发现；
12. 教学审美不再由程序阈值决定；
13. 音频可以按合理教学块生成和重试；
14. XReader 能导入并完整播放新课程；
15. 至少一篇真实课程完成端到端验证；
16. 旧代码和废弃字段得到明确清理；
17. README 说明新的课程生产方式；
18. 不引入不必要的工程复杂度。

---

# 十五、最终交付

完成后请提供：

1. 重构后的代码；
2. 新旧架构变化说明；
3. 删除或废弃的旧模块清单；
4. Course Schema 文档；
5. 课程目录和构建命令说明；
6. 终稿解析规则；
7. 客观校验规则；
8. 音频构建与导入说明；
9. 数据库迁移说明；
10. 自动测试结果；
11. 一篇真实文章的完整构建样例；
12. 尚未解决的问题和明确风险。

---

# 十六、工作原则

- 先读代码，再修改；
- 优先复用稳定基础设施；
- 删除错误抽象，不在其上继续叠补丁；
- 内容质量由五阶段 Prompt 和试听负责；
- 程序只保证结构与资源正确；
- 终稿优先于旧 Schema；
- 解析适配不创作；
- 无法确定时报告，不猜测；
- 保持实现简单；
- 不顺便扩展无关功能；
- 所有完成声明都必须有测试或实际运行结果支持。

请现在开始审查当前 XReader 代码库，并按以上原则完成整个重构。
