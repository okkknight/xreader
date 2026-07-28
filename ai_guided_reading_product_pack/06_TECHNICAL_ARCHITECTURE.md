# 技术架构

## 1. 推荐技术栈

默认实现选择：

- Web：Next.js App Router + TypeScript
- UI：React + CSS Modules、Tailwind 或项目内统一组件方案
- 数据库：SQLite
- ORM：Prisma
- 音频：Fish Audio API
- 文件存储：VPS 本地持久化目录
- AI：OpenAI-compatible Provider Adapter
- 任务：数据库记录 + CLI/后台手动执行，不引入 Redis
- 测试：单元测试 + 浏览器端端到端测试
- 部署：本项目只保证可在单机 Node.js 环境运行，不包含 Docker、Nginx 和云平台配置

选择理由：

- 单体应用适合 MVP，前后端共享类型。
- SQLite 无需独立数据库服务，适合单机内容产品。
- Prisma 提供类型安全的数据访问和迁移。
- 结构化片段适合本地文件音频和单片重生成。
- Provider Adapter 避免把内容生成绑定到单一模型。

## 2. 系统边界

```text
Browser
  ↓
Next.js Application
  ├── Public Reader
  ├── Admin Studio
  ├── API / Server Actions
  ├── Content Pipeline
  ├── LLM Provider Adapter
  ├── Fish Audio Adapter
  ├── SQLite / Prisma
  └── Local Audio Storage
```

## 3. 目录建议

```text
src/
├── app/
│   ├── page.tsx
│   ├── archive/
│   ├── articles/[slug]/
│   ├── admin/
│   └── api/
├── components/
│   ├── reader/
│   ├── player/
│   ├── article/
│   └── admin/
├── lib/
│   ├── db/
│   ├── audio/
│   ├── ai/
│   ├── content-pipeline/
│   ├── validation/
│   └── progress/
├── server/
│   ├── articles/
│   ├── generation/
│   └── publishing/
├── styles/
└── types/
prisma/
├── schema.prisma
└── migrations/
data/
├── audio/
├── exports/
└── backups/
scripts/
├── seed.ts
├── generate-course.ts
├── regenerate-audio.ts
├── validate-course.ts
└── export-course.ts
```

## 4. 内容状态机

```text
IDEA
→ SOURCED
→ ARTICLE_DRAFT
→ ARTICLE_EDITED
→ ANALYZED
→ DIRECTED
→ SCRIPTED
→ AUDIO_READY
→ QA_PASSED
→ SCHEDULED
→ PUBLISHED
→ ARCHIVED
```

禁止从 `SCRIPTED` 直接发布。

## 5. 播放器架构

### 两条播放队列

#### 讲解队列

由 `LessonSegment` 按顺序组成。

每个片段引用：

- 音频文件
- 原文句子 ID
- 高亮方式
- 停顿
- 字幕
- 滚动目标

#### 阅读队列

由 `ArticleSentenceAudio` 组成。

支持：

- 单句播放
- 从任意句连续播放
- 合成完整文章播放体验

不一定需要额外生成一个完整长音频，可由句子队列无缝连续播放。若听感受损，再生成完整音频。

## 6. 播放状态

建议前端状态：

```ts
type PlaybackState = {
  mode: "guided" | "reading";
  articleId: string;
  isPlaying: boolean;
  currentSegmentId?: string;
  currentSentenceId?: string;
  currentTimeMs: number;
  playbackRate: number;
  autoFollow: boolean;
  userScrolledAway: boolean;
};
```

## 7. 自动滚动

- 使用句子元素 `data-sentence-id`
- 当前片段变化时定位 DOM
- 只在元素离开安全视区时滚动
- 用户主动滚动后设置 `userScrolledAway = true`
- 显示恢复跟随按钮
- 不基于音频逐词时间戳滚动
- MVP 以片段和句子级同步为准

## 8. Fish Audio 适配器

定义统一接口：

```ts
export interface TTSProvider {
  synthesize(input: {
    text: string;
    voiceId: string;
    format: "mp3" | "wav";
    prosody?: {
      speed?: number;
      volume?: number;
    };
    idempotencyKey: string;
  }): Promise<{
    filePath: string;
    durationMs: number;
    providerRequestId?: string;
  }>;
}
```

Fish Audio 实现放在：

```text
src/lib/audio/fish-audio-provider.ts
```

环境变量示例：

```env
FISH_AUDIO_API_KEY=
FISH_AUDIO_TEACHER_VOICE_ID=
FISH_AUDIO_READER_VOICE_ID=
AUDIO_STORAGE_DIR=./data/audio
```

### 必须支持

- 请求超时
- 重试
- 幂等键
- 文件哈希
- 失败状态
- 局部重新生成
- 音频元数据
- API 错误日志
- 文本变更后标记旧音频失效

## 9. LLM Provider

```ts
export interface LLMProvider {
  generateStructured<T>(input: {
    system: string;
    prompt: string;
    schema: unknown;
    temperature?: number;
  }): Promise<T>;

  generateText(input: {
    system: string;
    prompt: string;
    temperature?: number;
  }): Promise<string>;
}
```

默认实现使用 OpenAI-compatible Chat Completions 或 Responses 风格接口，但业务层不得直接依赖具体供应商字段。

环境变量：

```env
LLM_BASE_URL=
LLM_API_KEY=
LLM_MODEL=
```

## 10. 生成任务

不必引入复杂队列。

数据库保存：

```text
GenerationJob
- type
- status
- inputHash
- output
- error
- attempts
- startedAt
- finishedAt
```

执行方式：

- 后台点击运行
- CLI 运行
- 开发时同步执行
- 每个步骤可重跑
- 相同输入哈希可复用结果

## 11. 管理后台保护

MVP 可使用环境变量中的单一后台密码或反向代理保护。

不要为了后台引入完整用户系统。

至少需要：

- 未授权不能进入 `/admin`
- 修改和发布操作有服务端验证
- API 密钥只存在服务端
- 原始来源资料不暴露给公共端

## 12. 本地进度

未登录用户使用 `localStorage`：

```ts
type ArticleProgress = {
  articleId: string;
  guidedSegmentId?: string;
  readingSentenceId?: string;
  guidedTimeMs?: number;
  readingTimeMs?: number;
  completedGuided?: boolean;
  updatedAt: string;
};
```

未来加入账号后再迁移。

## 13. 日志

至少记录：

- 内容生成步骤
- Prompt 版本
- 模型
- 输入哈希
- 输出校验错误
- TTS 请求
- 发布与撤回
- 用户匿名播放事件

不要记录 API Key。

## 14. 参考资料

- Next.js App Router 官方文档
- SQLite 官方文档
- Prisma SQLite 官方文档
- Fish Audio TTS API 官方文档

实现时以官方当前文档和项目锁定版本为准，不要复制过时示例。
