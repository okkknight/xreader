# 数据模型与 API

## 1. 核心实体

### Article

```prisma
model Article {
  id              String        @id @default(cuid())
  slug            String        @unique
  titleEn         String
  titleZh         String
  dekZh           String?
  topic           String
  difficulty      String        @default("B1-B2")
  status          ArticleStatus @default(IDEA)
  bodyText        String
  wordCount       Int           @default(0)
  estimatedReadMs Int?
  publishedAt     DateTime?
  scheduledAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  paragraphs      Paragraph[]
  sources         ArticleSource[]
  analysis        ArticleAnalysis?
  lessonPlan      LessonPlan?
  lessonSegments  LessonSegment[]
  feedback        ArticleFeedback[]
}
```

### Paragraph

```prisma
model Paragraph {
  id        String     @id
  articleId String
  order     Int
  text      String

  article   Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  sentences Sentence[]

  @@unique([articleId, order])
}
```

段落 ID 示例：`articleId_p01`。

### Sentence

```prisma
model Sentence {
  id            String      @id
  paragraphId   String
  order         Int
  text          String
  translationZh String?
  startOffset   Int?
  endOffset     Int?

  paragraph     Paragraph   @relation(fields: [paragraphId], references: [id], onDelete: Cascade)
  audio         SentenceAudio?
  annotations   Annotation[]

  @@unique([paragraphId, order])
}
```

### Source

```prisma
model Source {
  id          String          @id @default(cuid())
  title       String
  publisher   String?
  url         String
  publishedAt DateTime?
  accessedAt  DateTime?
  notes       String?

  articles    ArticleSource[]
}
```

### ArticleSource

```prisma
model ArticleSource {
  articleId String
  sourceId  String
  role      String
  factNotes Json?

  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  source    Source  @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@id([articleId, sourceId])
}
```

### ArticleAnalysis

```prisma
model ArticleAnalysis {
  id          String   @id @default(cuid())
  articleId   String   @unique
  version     Int      @default(1)
  promptVer   String
  model       String?
  data        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}
```

### LessonPlan

```prisma
model LessonPlan {
  id          String   @id @default(cuid())
  articleId   String   @unique
  version     Int      @default(1)
  promptVer   String
  model       String?
  data        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}
```

### LessonSegment

```prisma
model LessonSegment {
  id                   String        @id
  articleId            String
  order                Int
  type                 SegmentType
  primaryGoal          String?
  script               String?
  voiceRole            VoiceRole
  sentenceIds          Json
  highlightMode        String?
  autoScrollTarget     String?
  pauseBeforeMs        Int           @default(0)
  pauseAfterMs         Int           @default(400)
  replaySourceSegmentId String?
  audioPath            String?
  audioDurationMs      Int?
  audioStatus          AudioStatus   @default(MISSING)
  textHash             String?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  article              Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([articleId, order])
}
```

### Annotation

```prisma
model Annotation {
  id          String   @id @default(cuid())
  sentenceId  String
  startOffset Int
  endOffset   Int
  text        String
  meaningZh   String
  noteZh      String?
  exampleEn   String?
  audioPath   String?

  sentence    Sentence @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
}
```

### AudioAsset

可选择独立表统一记录音频；若实现简单，也可先将字段放在句子和片段中。

```prisma
model AudioAsset {
  id                String      @id @default(cuid())
  ownerType         String
  ownerId           String
  provider          String
  voiceId           String
  path              String
  format            String
  durationMs        Int
  textHash          String
  providerRequestId String?
  status            AudioStatus
  error             String?
  createdAt         DateTime    @default(now())
}
```

### GenerationJob

```prisma
model GenerationJob {
  id         String    @id @default(cuid())
  articleId  String?
  type       String
  status     JobStatus
  inputHash  String
  promptVer  String?
  model      String?
  input      Json
  output     Json?
  error      String?
  attempts   Int       @default(0)
  startedAt  DateTime?
  finishedAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

### Feedback

```prisma
model ArticleFeedback {
  id          String   @id @default(cuid())
  articleId   String
  sessionId   String
  difficulty  String?
  density     String?
  worthReading Boolean?
  createdAt   DateTime @default(now())

  article     Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
}
```

## 2. 枚举

```prisma
enum ArticleStatus {
  IDEA
  SOURCED
  ARTICLE_DRAFT
  ARTICLE_EDITED
  ANALYZED
  DIRECTED
  SCRIPTED
  AUDIO_READY
  QA_PASSED
  SCHEDULED
  PUBLISHED
  ARCHIVED
}

enum SegmentType {
  OPENING
  ORIENTATION
  ARTICLE_READ
  QUICK_EXPLANATION
  NORMAL_EXPLANATION
  DEEP_EXPLANATION
  EXPRESSION_NOTE
  CONTEXT_CONNECTION
  REPLAY
  SECTION_SUMMARY
  FINAL_WRAP
}

enum VoiceRole {
  TEACHER
  READER
}

enum AudioStatus {
  MISSING
  QUEUED
  GENERATING
  READY
  STALE
  FAILED
}

enum JobStatus {
  QUEUED
  RUNNING
  SUCCEEDED
  FAILED
  CANCELLED
}
```

## 3. 公共 API

### 获取今日文章

```http
GET /api/articles/today
```

返回首页卡片与基本进度相关数据。

### 获取文章

```http
GET /api/articles/:slug
```

返回：

- 文章信息
- 段落
- 句子
- 注释
- 已发布讲解片段
- 音频地址

不要返回：

- 原始来源摘录
- AI Prompt
- 编辑备注
- 未发布版本

### 提交反馈

```http
POST /api/articles/:id/feedback
```

```json
{
  "sessionId": "anonymous-session-id",
  "difficulty": "JUST_RIGHT",
  "density": "JUST_RIGHT",
  "worthReading": true
}
```

## 4. 后台 API

建议使用服务端 Action 或内部 API。

需要：

- 创建选题
- 保存来源
- 生成事实卡
- 生成文章
- 编辑文章
- 句子切分
- 生成分析
- 生成教学计划
- 生成讲稿
- 校验结构
- 生成单片音频
- 生成全部音频
- 预览
- 运行 QA
- 发布 / 撤回

所有写操作必须验证后台权限。

## 5. 内容版本

至少记录：

- Prompt 版本
- 模型
- 生成时间
- 输入哈希
- 文章版本
- 教学计划版本
- 讲稿版本

文章原文变化后：

1. 标记分析可能过期
2. 标记教学计划可能过期
3. 找出受影响片段
4. 标记相关音频 `STALE`
5. 禁止直接发布，直到再次检查

## 6. 导入导出

支持将一篇完整课程导出为 JSON，便于备份和 Codex 调试。

```json
{
  "schemaVersion": "1.0",
  "article": {},
  "paragraphs": [],
  "analysis": {},
  "lessonPlan": {},
  "segments": [],
  "annotations": [],
  "sources": []
}
```

导入时必须校验：

- ID 唯一
- 句子引用存在
- 片段顺序连续
- `ARTICLE_READ` 有句子
- 讲解片段有 script
- 音频路径安全
