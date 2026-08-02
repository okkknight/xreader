# XReader 新课程操作手册

本文是当前 XReader 新课程的实际操作入口。课程生产以文件系统课程包为中心，最终讲稿由五阶段 Prompt v2.2 生成，XReader 只消费经过确定性检查和 Course Block 转换的结果。

## 一、先记住三条边界

1. `source/article.md` 是英文原文真相源。
2. `final/lecture.md` 是唯一教学终稿，工程代码不得改写其中的教学文字。
3. 数据库只保存导入后的 Course Document、Course Block 音频映射和公开文章关系，不保存旧式段落讲解字段。

五阶段 Prompt 的完整说明见：

- [内容生成工作流重构 Prompt](../XReader_内容生成工作流重构Prompt.md)
- [五阶段 Prompt v2.2 使用说明](../XReader_五阶段Prompt包_v2.2/README_使用说明.md)

## 二、课程包目录

每篇课程使用一个稳定 slug，例如 `why-rain-has-a-smell`：

```text
courses/<slug>/
├── source/
│   └── article.md              # 英文标题和完整原文
├── prompts/                    # 本次课程使用的 Prompt 输入/输出记录
├── drafts/                     # 五阶段 v2.2 中间稿，不作为运行时真相
├── final/
│   └── lecture.md              # 人工确认后的唯一教学终稿
├── build/
│   ├── labels.json             # 受限语义标签
│   ├── course.json             # Course Document
│   └── parse-report.json       # 检查报告
├── audio/                      # 可选的课程包内音频副本
│   ├── *.wav / *.mp3
│   └── audio-manifest.json     # 音频与 block 的映射
└── package.json                # 可选：课程包元数据
```

`source/article.md` 和 `final/lecture.md` 应提交到课程包版本管理中；音频文件、数据库文件和缓存按项目部署策略管理，不要把旧数据库复制回来。

## 三、内容生产：严格执行五阶段

每一阶段都把英文原文和上一阶段的完整结果一起提供给 Prompt。不要让模型凭记忆续写，也不要跳过中间稿。

### 第 1 阶段：完整逐句带读初稿

使用 `01_完整逐句带读初稿Prompt.md`。

目标：从标题开始，按原文顺序覆盖标题和每个英文句子，建立完整教学底稿。简单句可以讲短，但不能漏掉。

输出保存到：

```text
courses/<slug>/drafts/01-complete-draft.md
```

### 第 2 阶段：教学节奏导演

使用 `02_教学节奏导演Prompt.md`。

目标：删除低收益重复，决定哪里快、哪里慢、哪里停顿、哪里回收，但保留完整逐句教学底盘。

输出保存到：

```text
courses/<slug>/drafts/02-rhythm-directed.md
```

### 第 3 阶段：学习者理解路径与课程编排

使用 `03_学习者理解路径与课程编排Prompt.md`。

目标：按学习者的理解顺序组织教学单元、衔接、开场、结尾、重听和连读，不重新选择已确定的教学内容。

输出保存到：

```text
courses/<slug>/drafts/03-learning-path.md
```

### 第 4 阶段：真人口播与去 AI 化编辑

使用 `04_真人口播与去AI化编辑Prompt.md`。

目标：在不改变教学结构和理解路径的前提下，完成真人口播、呼吸、中英文切换和去 AI 化编辑。

输出保存到：

```text
courses/<slug>/drafts/04-spoken-edited.md
```

### 第 5 阶段：Seven 教师人格与真教学终审

使用 `05_Seven教师人格与真教学终审Prompt.md`。

目标：在不改变教学骨架的前提下，完成 Seven 的教师判断、语言审美、克制幽默、教师温度和最终声音一致性。

输出保存到：

```text
courses/<slug>/drafts/05-seven-final.md
```

## 四、锁定终稿前的人工检查

把第五阶段结果复制为 `final/lecture.md` 后，人工逐项确认：

- 标题和正文顺序与 `source/article.md` 一致。
- 每个原文句子都出现，原句没有被同义改写、拼接或删掉。
- 允许为教学效果重复朗读原句，但重复必须能被识别为同一原文句子的再次出现。
- 中文解释服务于当前句子，不扩展成文章摘要或独立知识课。
- Intro、Title、Sentence、Bridge、Recap、Outro 的职责清楚，没有把所有内容塞进 sentence 字段。
- 没有遗留分析、评分、Prompt 说明、JSON 或修改说明。

确认后，`final/lecture.md` 视为内容冻结点。之后发现事实或词义错误时，直接人工小修，然后重新执行工程检查和受影响音频生成。

## 五、工程检查和构建

在项目根目录执行：

```bash
npm install
npm run course:check -- <slug> [courses-root]
```

默认课程根目录是 `courses/`。例如：

```bash
npm run course:check -- why-does-rain-have-a-smell
```

检查器会：

1. 读取 `source/article.md`。
2. 建立稳定的段落和句子 ID，例如 `p01-s01`。
3. 读取并规范化 `final/lecture.md` 的 Markdown 强调符号和空白。
4. 精确匹配每个原文句子。
5. 检查缺句、改写、首出现顺序错误。

检查失败时，不要在工程代码里放宽匹配规则。回到 `final/lecture.md` 修正终稿，再重新运行检查。

通过原文检查后，生成 Course Block JSON：

```bash
npm run course:build -- <slug> [courses-root]
```

该命令生成：

- `build/course.json`
- `build/labels.json`
- `build/parse-report.json`

构建器只根据原文锚点切分范围并应用受限标签，不重写终稿。

Course Block 的核心实现位于：

- `src/lib/course-blocks/source-parser.ts`
- `src/lib/course-blocks/lecture-parser.ts`
- `src/lib/course-blocks/semantic-labels.ts`
- `src/lib/course-blocks/build-course.ts`
- `src/lib/course-blocks/schema.ts`

## 六、语义标签与 Course Block

工程适配器只接受对终稿范围的受限标签。标签必须覆盖终稿全文，不能有空洞、重叠、错误 hash 或越界范围。

允许的 block 类型：

| 类型 | 用途 |
| --- | --- |
| `intro` | 很短的自然开场 |
| `title` | 标题和标题教学 |
| `sentence` | 围绕一个原文句子的带读 |
| `bridge` | 连接句子或段落的过渡 |
| `recap` | 对刚读内容的回收 |
| `outro` | 课程收束 |

句子 block 必须带 `sentenceId`；音频映射只能引用已存在的 block ID。Course Document 必须通过 `courseDocumentSchema` 校验后才能进入导入流程。

### 正文重点 cue

正文重点不是“这一句的关键词列表”，而是老师说到某个原文片段时的一次时间事件。需要重点的讲解 block 在对应 segment 中声明 `sourceReferences`，并在 block 上提供 `highlightCues`：

```json
{
  "id": "cue-dry-soil",
  "sentenceId": "p01-s02",
  "sourceText": "dry soil",
  "sourceStart": 16,
  "sourceEnd": 24,
  "spokenText": "dry soil",
  "spokenOccurrence": 1
}
```

- 多句讲解 block 的每条 cue 必须带 `sentenceId`；`sourceStart/sourceEnd` 始终相对于该句原文计算。生成音频后，阅读器会按 cue 时间切换当前原文句子，并把高亮渲染到对应句子。
- `sourceStart/sourceEnd` 是原文句子中的字符范围，处理重复词时不靠词面猜测。
- `spokenText/spokenOccurrence` 指向老师实际说到的那一次；例句、占位符或同形英文不能写成 cue。
- 课程中一旦声明 `sourceReferences`，schema 就要求同时声明 `highlightCues`。
- 生成音频后，Fish 的时间轴会补写 `startMs/endMs`；阅读器只在这段时间显示该 cue，随后立即清除。
- 每个句子 block 都有一条“原句朗读”cue：教师朗读整句时，正文整句标亮。讲解开始后，这条 cue 结束；`course:audio` 再只显示可确认的细粒度词组 cue。它不猜测中文讲解中的英语例句。新课程仍应优先提供细粒度 cue。
- 新课程的精确 `highlightCues` 永远优先。旧课程的自动补齐会使用英语词元化（单复数、时态、进行式和不规则词形），把讲稿中的词形定位到原文实际拼写；无法可靠定位的语义引用不得猜测，需回到课程生成阶段显式提供 cue。

## 七、音频生产

音频是 Course Block 的派生资产，不回写或改写终稿。每段音频至少要保留：

- `audioId`
- `blockIds`
- 文件路径
- 时长
- `scriptHash`
- 状态：`READY`、`MISSING` 或 `FAILED`
- 使用的 provider、model 和 `reference_id`

当前仓库保留的试听入口是：

```bash
npm run audio:audition -- ...
```

为课程的全部 Course Block 生成教师音频：

```bash
npm run course:audio -- <slug> [courses-root]
```

调试或重做单段时：

```bash
npm run course:audio -- <slug> --block <block-id>
```

音频当前保存到 `data/audio/<slug>/<block-id>/<version>/audio.mp3`（96kbps、单声道），并在同目录写入 manifest 和 timeline；Fish 返回的 WAV 仅作为生成过程中的临时源文件。timeline 会保留 Fish 对齐片段和重点 cue 时间。`build/course.json` 保存音频映射、时长、hash 和已补时的 cue。

正式音频生成应沿用 Fish Audio 的版本化文件、manifest、hash 和试听流程。不要恢复旧的 `AudioAsset`、段落讲解音频或运行时生成接口。

试听验收至少包括：

- 教师语气自然，不像逐字段朗读。
- 中英文切换没有明显断裂。
- 原文句子完整，没有截断或额外内容。
- 片段顺序与 Course Block 顺序一致。
- `scriptHash` 与实际送入 TTS 的脚本文本一致。

## 八、数据库初始化和导入

首次初始化或重建本地数据库：

```bash
npm run db:migrate
```

迁移脚本会自动处理项目默认的 `file:../data/...` 路径，并预创建 SQLite 文件。不要手动恢复旧 `xreader.db`。

校验课程包：

```bash
npm run course:import -- <slug> [courses-root]
```

该命令当前负责读取并校验 `build/course.json`，拒绝不符合 Course Document Schema 的结果，并规范化 JSON。数据库导入必须使用 `CourseDocumentRepository.importBuiltCourse`，导入前必须确认 `parseReport.needsReview` 为空。

导入成功后应确认：

- `CourseDocument.articleId` 唯一对应一篇文章。
- `sourceHash` 和 `finalLectureHash` 与当前课程包一致。
- `courseJson` 能通过 schema 解析。
- 每个音频映射都有有效 block ID。
- `CourseBlockAudio` 状态和文件实际存在情况一致。

## 九、公开发布前验收

执行：

```bash
npm test
npm run test:integration
npx tsc --noEmit
npm run lint
npm run build
```

然后在浏览器中验证：

1. 首页和归档只显示已发布文章。
2. 讲解模式按 Course Block 顺序播放。
3. 原文句子能定位到对应 block 并自动跟随。
4. 阅读/讲解模式切换不会丢失当前位置。
5. 刷新后进度仍能恢复。
6. `/api/articles/<slug>` 不返回旧 guide 字段、Prompt 或未发布内容。
7. 音频 Range 请求可以正常返回 `206`。

只有 Course Document、音频、阅读器和发布状态全部通过检查后，才允许从 `QA_PASSED` 进入 `PUBLISHED`。

## 十、失败处理和回滚

### 终稿检查失败

保留当前 draft，修复 `final/lecture.md`，重新运行 `course:check`。不要修改 parser 以迁就错误终稿。

### 语义标签失败

检查范围是否从 0 开始、是否覆盖到终稿末尾、是否有重叠或错误 hash。先修标签文件，再重建 Course JSON。

### 音频失败

保留失败记录和请求信息，状态设为 `FAILED`。修复 TTS 输入或配置后生成新版本，不覆盖已经验证通过的音频。

### 导入失败

不发布、不删除上一个已发布版本。修复课程包后重新导入；Course Document 使用 source/final hash 判断是否为当前版本。

### 发布后发现内容错误

先将文章撤回到 `ARCHIVED` 或停止公开入口，修复课程包并重新完成检查、音频和集成验收，再发布新版本。

## 十一、当前实现入口

- [Course Block 类型](/Users/linpeiwen/knightspace/xreader/src/lib/course-blocks/types.ts)
- [Course Block Schema](/Users/linpeiwen/knightspace/xreader/src/lib/course-blocks/schema.ts)
- [终稿锚定器](/Users/linpeiwen/knightspace/xreader/src/lib/course-blocks/lecture-parser.ts)
- [课程仓储](/Users/linpeiwen/knightspace/xreader/src/lib/db/course-document-repository.ts)
- [公开课程查询](/Users/linpeiwen/knightspace/xreader/src/server/articles/public-query.ts)
- [项目交接入口](/Users/linpeiwen/knightspace/xreader/docs/handoff/README.md)
