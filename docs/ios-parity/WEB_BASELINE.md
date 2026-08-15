# XReader Web → iOS 验收基线

本文件记录 iOS 迁移期间不可悄然改变的当前 Web 行为。它与 `tests/e2e/` 的隔离 SQLite 课程 fixture 一起使用；浏览器验收不得读取或修改 `data/xreader.db`。

## 运行基线

- 公开课程由 `courses/why-rain-has-a-smell` 和测试课程 `tests/fixtures/courses/multi-sentence-fixture` 导入 `data/xreader.e2e.db`。
- `scripts/e2e-server.ts` 每次浏览器测试前重新创建该数据库，再启动 Next 开发服务器。
- 基线命令：`npm run test:e2e`。
- 视口：桌面测试使用 Playwright Desktop Chrome；移动播放器测试使用 390 × 844。

## 页面和状态

| 状态 | 路径 | 必须保留的事实 | 自动验收 |
| --- | --- | --- | --- |
| Today | `/` | 顶部 XReader、Today/Archive 导航；已发布课程标题与“开始讲解”“先读文章”入口 | `tests/e2e/home.spec.ts` |
| 移动 Reader 初始态 | `/articles/why-rain-has-a-smell` | 标题、固定播放器、可访问的“播放”控件 | `tests/e2e/reader-mobile.spec.ts` |
| 隔离课程加载 | `/articles/why-rain-has-a-smell` | 仅靠隔离库能读取已发布课程，不依赖开发库 | `tests/e2e/reader-playback-baseline.spec.ts` |
| 多句 Block | `/articles/multi-sentence-fixture` | 同一 guided Block 持有 `p01-s01` 和 `p01-s02`；1.8 秒 cue 激活第二句 | `tests/e2e/reader-playback-baseline.spec.ts` |

## 迁移不变量

- 公开层继续使用课程 source ID（例如 `p01-s01`），即使 SQLite 内部主键使用文章前缀避免跨课程冲突。
- Guided 队列、timeupdate、active sentence 和 DOM `data-sentence-id` 必须始终使用同一公开 source ID。
- 用户手动滚动不会暂停音频；只有自动跟随状态改变，并显示恢复跟随入口。
- 讲解/阅读模式切换依据当前 source sentence ID 映射目标队列项，不从文章首项重置。

## Phase 0 验收命令

```sh
npm test
npm run test:integration
npx tsc --noEmit
npm run lint
npm run test:e2e
```
