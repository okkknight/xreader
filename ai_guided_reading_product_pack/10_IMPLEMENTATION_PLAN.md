# Codex 实施计划

## 1. 总体策略

采用纵向切片，保证每个阶段都有可运行结果。

不要先搭建复杂 AI 管线后才做播放器，因为最先需要验证的是用户体验和数据结构是否合理。

## 2. Phase 0：项目初始化

### 任务

- 初始化 Next.js + TypeScript
- 配置 SQLite + Prisma
- 建立环境变量模板
- 建立代码格式和测试命令
- 创建基础 UI tokens
- 加入种子数据
- 建立 `/data/audio` 持久化目录

### 验收

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

可以看到今日文章。

## 3. Phase 1：公共阅读器

### 任务

- 首页
- 归档页
- 文章详情
- 讲解 / 阅读模式
- 句子 DOM 结构
- 模拟音频队列
- 播放器
- 自动滚动
- 手动滚动暂停跟随
- 本地进度
- 课程结束反馈

### 种子内容

至少加入一篇完整的静态示例课：

- 6 段文章
- 20–30 句
- 8–12 个讲解片段
- 假音频或本地占位音频

### 验收

- 两种模式均可完整使用
- 高亮无错位
- 刷新恢复
- 模式切换定位正确
- 移动端可用

## 4. Phase 2：后台内容编辑

### 任务

- 简单后台保护
- 文章 CRUD
- 来源 CRUD
- 文章状态
- 自动句子切分
- 稳定 ID
- 讲解片段编辑
- 排序
- 句子映射
- 预览
- JSON 导入导出

### 验收

不调用 AI，也能手工创建并发布一篇完整课程。

这是重要里程碑。若手工内容无法顺利进入产品，AI 自动化只会放大问题。

## 5. Phase 3：Fish Audio

### 任务

- `TTSProvider` 接口
- Fish Audio 实现
- 教师和原文声音配置
- 单片生成
- 批量生成
- 重试
- 失败状态
- 时长提取
- 文件哈希
- 文本变化后标记 stale
- 后台试听
- 音量和格式统一

### 验收

- 可单独生成某个讲解片段
- 修改片段后只需重生成该片
- 原文和讲解声音清楚区分
- 失败不破坏已完成音频
- 页面播放顺序正确

## 6. Phase 4：AI 内容管线

### 任务

按顺序实现：

1. Source input
2. Fact card
3. Article writer
4. Article editor
5. Sentence splitter
6. Article analyzer
7. Teaching director
8. Script writer
9. Script editor
10. QA reviewer

每一步：

- 独立运行
- 保存输入输出
- JSON Schema 验证
- 可人工编辑
- 可重新运行
- 记录 Prompt 版本和模型

### 验收

输入一个选题和多个来源资料后，可以生成待编辑课程，但不会自动发布。

## 7. Phase 5：发布流程

### 任务

- QA 状态
- 发布检查清单
- 定时发布日期
- 今日文章选择
- 撤回
- 归档
- 公开 API 只返回已发布内容

### 验收

- 未完成 QA 无法发布
- 每天最多一篇主推文章
- 发布时间到达后可显示
- 撤回后公共端不可访问或显示归档策略

## 8. Phase 6：数据与改进

### 任务

匿名事件：

- article_opened
- guided_started
- segment_started
- segment_completed
- segment_skipped
- sentence_replayed
- switched_to_reading
- guided_completed
- feedback_submitted

MVP 可先写数据库或简单日志，不接复杂分析平台。

## 9. 建议开发任务拆分

### Epic A：Reader

- Article renderer
- Sentence highlighter
- Guided queue player
- Reading queue player
- Auto-follow controller
- Progress persistence
- Feedback

### Epic B：Admin

- Article editor
- Source editor
- Sentence editor
- Segment editor
- Audio panel
- QA panel
- Publish panel

### Epic C：Generation

- Provider interfaces
- Prompt loader
- Schema validator
- Job runner
- Pipeline steps
- Version records

### Epic D：Audio

- Fish client
- Storage
- Metadata
- Regeneration
- Playback compatibility

## 10. 实现约束

- 不要将整篇讲解存为单个 MP3。
- 不要把 Prompt 写在页面组件里。
- 不要让前端直接调用 Fish Audio 或 LLM。
- 不要依赖句子文本作为唯一 ID。
- 不要在自动滚动时抢夺用户控制。
- 不要默认展示全部中文翻译。
- 不要允许 `SCRIPTED` 状态直接发布。
- 不要自动覆盖人工修改稿。
- 不要在 MVP 引入 Redis、消息队列、微服务或复杂权限系统。

## 11. 推荐命令

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx scripts/seed.ts",
    "course:generate": "tsx scripts/generate-course.ts",
    "course:validate": "tsx scripts/validate-course.ts",
    "audio:regenerate": "tsx scripts/regenerate-audio.ts"
  }
}
```

具体工具可按项目锁定版本调整。

## 12. 完成定义

MVP 完成不是“页面能打开”，而是：

1. 编辑者可以输入资料并生成一篇课程。
2. 编辑者可以修改文章和任意讲解片段。
3. 可以局部生成 Fish Audio。
4. 可以完整试听和预览。
5. 通过检查后发布。
6. 用户可以在讲解和阅读模式中稳定完成文章。
7. 页面刷新和模式切换不丢失位置。
8. 至少有 5 篇人工审阅过的真实课程可用。
