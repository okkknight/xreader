# XReader iOS 原生迁移规格

## 1. 已确认的产品决策

本规格是 XReader 从当前 Web 产品迁移到原生 iOS App 的唯一产品与工程基线。

对应的逐任务实施计划见 [2026-08-06-xreader-ios-native-migration.md](superpowers/plans/2026-08-06-xreader-ios-native-migration.md)。

当前代码与验收状态见 [IOS_PARITY_AUDIT.md](ios-parity/IOS_PARITY_AUDIT.md)。

- iOS 是面向学习者的主端；当前 Next.js 应用继续承担课程生产、公开 Web 访问和只读内容服务。
- **保留当前所有已实现功能、UI 设计和交互设计。** 迁移不是重新设计，不能以“更像 iOS”为由删减或改变现有学习路径。
- 课程可远程发布；不建设后台管理、App 内发布页、用户上传或自动生成后发布系统。
- 内容继续在 Git 仓库的 `courses/<slug>/` 课程包中由人工与 Codex 维护、检查、试听和发布。
- 首发不引入账户、订阅、社交、用户上传、运行时 AI 或 WebView。未登录学习进度只保存在设备本地。

## 2. 迁移目标与非目标

### 2.1 目标

在 iPhone 上提供与 Web 等价的完整学习闭环：发现课程、进入文章、讲解/阅读模式切换、连续播放、逐句高亮、字幕、自动跟随、手动阅读优先、倍速、进度恢复和远程上新。

原生实现应在以下系统能力上优于浏览器，但不改变产品语义：锁屏与耳机控制、后台继续播放、电话/Siri/耳机打断恢复、离线课程、系统动态字体和 VoiceOver。

### 2.2 明确不做

- 不将现有页面嵌进 WKWebView。
- 不让 App 读取 VPS SQLite、直接访问 `data/audio/` 文件路径或拥有部署 SSH 权限。
- 不制作 CMS、运营后台、课程编辑器、审核流或 App 内“发布”按钮。
- 不让客户端调用 Fish Audio、LLM 或访问生产密钥。
- 不在迁移中重写文章、讲解稿、稳定 ID 或音频生产流程。
- 不以 iOS 迁移为理由改变当前 Web 产品，Web 与 iOS 可独立发布和回滚。

## 3. 当前 Web 基线

当前实现的事实源是 Web 代码与课程包，而不是早期产品资料。

| 区域 | 当前行为 | iOS 等价要求 |
| --- | --- | --- |
| 首页 `/` | 今日课程封面、英文/中文标题；“开始讲解”“先读文章”入口；从本地进度显示继续状态 | 保留同一视觉层级、封面、文案和两个入口；进入相同模式并恢复该模式位置 |
| 归档 `/archive` | 已发布课程的封面列表；点击进入阅读 | 保留列表视觉、顺序、空状态与进入行为 |
| 文章页 | 标题、正文、句子点按、注释、底部播放器 | 原生逐页还原，不使用网页容器替代 |
| 讲解模式 | Course Block 队列；按音频时间推进句子、字幕和高亮 | 保留队列顺序、Block 类型与所有句子归属 |
| 阅读模式 | 逐句音频队列 | 保留逐句播放、点句跳转和位置恢复 |
| 模式切换 | 按当前 sentence ID 映射到目标队列；原播放中则继续播放 | 保留映射与继续行为，不能从头重置 |
| 自动跟随 | 播放推进时滚动到当前句；用户手动滚远后停止，并显示“跟随” | 保留手动阅读优先原则和恢复入口 |
| 播放器 | 模式切换、上一段/播放/下一段、0.75×/1×/1.25×、位置进度 | 保留布局信息层级、按键语义、禁用状态和完成后的重新开始 |
| 进度 | 每文章保存讲解 Block 或阅读句子、最后模式、完成状态 | 首发保存到本机；数据模型为未来跨设备同步预留稳定 ID |

### 3.1 视觉与交互不可变项

- 保留当前“安静的知识杂志”视觉：浅纸张背景、深墨绿色、衬线英文标题、细分隔线、低装饰密度。
- 保留首页封面主视觉、首页/归档/文章三页的信息顺序和中文文案。
- 保留文章正文为主视觉、底部深色播放器、当前高亮与已讲解高亮的表达方式。
- 保留桌面/移动现有的响应式意图；iOS 只适配 iPhone，但必须覆盖小屏、普通屏和大屏动态字体下的可读性。
- 使用原生返回手势、锁屏控件和系统选择控件属于实现替换，不构成产品交互变更。

## 4. 目标架构

```text
课程包 Markdown / Course JSON / MP3
        ↓（私有检查与发布命令）
VPS SQLite + 被引用的 MP3
        ↓（版本化、只读的公开内容 API）
iOS Networking → 本地课程缓存 → Audio Engine → SwiftUI Features
```

### 4.1 仓库与发布边界

新建独立仓库或 sibling 目录 `xreader-ios`。它不读取、写入或部署当前 Web 的源码、SQLite、`data/audio/`、环境变量和 systemd 服务。

Web 仓库保留内容生产与发布命令；iOS 仓库只包含 App 代码、测试 fixture、资源和发布配置。两端通过版本化 JSON 合同衔接。

### 4.2 iOS 工程结构

最低支持 iOS 17，使用 Swift 6、SwiftUI 和本地 Swift Package。应用目标只承担启动、依赖装配、App 生命周期和系统配置。

| Package | 职责 |
| --- | --- |
| `XReaderCore` | `Article`、`CourseBlock`、`AudioAsset`、`Sentence`、`PlaybackPosition` 等无 UI 模型与稳定 ID 规则 |
| `XReaderNetworking` | 公共内容 API、HTTP 缓存、版本检查、错误映射；不含业务 UI |
| `XReaderContent` | 已下载课程清单、JSON 与 MP3 文件、校验、磁盘预算与离线清理 |
| `XReaderAudio` | AVFoundation 队列、时间轴回调、倍速、后台播放、打断、耳机和锁屏控制 |
| `XReaderProgress` | 本地进度存储、恢复和完成状态；接口可供未来云同步实现替换 |
| `XReaderDesignSystem` | 色彩、字体、间距、按钮、播放器和无障碍标识 |
| `XReaderFeatures` | Today、Archive、Reader、Download、Settings 页面与页面级状态 |

采用 SwiftUI 原生数据流：局部显示状态使用 `@State`，页面输入以显式初始化传递；跨页面服务通过受控依赖注入提供。禁止把网络请求、音频控制和复杂业务逻辑塞入 View `body`。

## 5. 远程内容发布与 API

### 5.1 私有发布流程

“远程发布”是开发者/编辑者执行的受控运维动作，不是面向用户或运营的系统功能。建议在 Web 仓库提供一个私有入口，例如：

```text
课程包完成 → course:check → 音频/试听检查 → course:publish <slug>
```

`course:publish` 的责任：

1. 复跑课程结构、原文锚定、音频 manifest 与文件存在性检查。
2. 在临时 SQLite 副本导入课程，并验证该课程对公开查询可见。
3. 从 `CourseBlockAudio.status = READY` 精确取得引用 MP3 清单。
4. 将数据库和上述 MP3 staged 上传到 VPS；不得按目录整体同步音频，也不得覆盖无关课程。
5. 原子替换课程数据，重启服务后验证首页、课程 JSON、封面和 MP3 Range 请求。
6. 失败时保留线上数据库和既有音频，不把半成品暴露给 App。

课程可通过 `publishedAt` 立即可见，或通过 `scheduledAt` 定时可见。二者都只由课程包和私有发布命令驱动。

### 5.2 App 的只读合同

现有 `/api/articles/*` 只能作为迁移调研起点；在 iOS 联调前新增稳定的 `/api/v1` 只读合同。最低端点：

- `GET /api/v1/catalog`：已发布课程摘要、封面、发布时间、`contentVersion`。
- `GET /api/v1/articles/{slug}`：文章、段落、句子、Course Block、字幕/高亮 cues、音频元数据与版本。
- `GET /api/v1/media/{assetId}`：MP3，支持 `Range`。

所有内容响应必须只包含已发布或已到期排期内容；不得泄露 Prompt、来源摘录、编辑备注、未发布版本、服务器路径或 Fish Audio 配置。

### 5.3 合同不变量

- `articleId`、`slug`、`blockId`、`sentenceId`、`audioId` 都是跨 Web/iOS/发布的稳定标识；不得用数组序号替代。
- Guided 队列的每个播放项必须合并并去重 `segments[].sourceSentenceIds`、`sentenceIds` 和旧兼容字段 `sentenceId`。
- Cue 的毫秒时间轴、音频时长、MP3 URL 和文本范围必须来自同一课程版本。
- iOS 必须忽略未知的可选字段，但当 schema 主版本不兼容时拒绝使用缓存并显示可理解的更新提示。

## 6. 原生播放与离线要求

### 6.1 播放状态机

播放器唯一状态源应包含：`mode`、当前 `itemId`、当前 `sentenceId`、播放/暂停、速率、完成状态、自动跟随状态和当前课程版本。

- 讲解队列只纳入 READY 且有可访问 MP3 的 Block。
- 阅读队列只纳入 READY 且有可访问 MP3 的句子。
- `timeupdate` 的原生等价回调驱动当前字幕、句子和高亮；不能仅在切换 Block 时更新。
- 点按任一句时，定位到覆盖该句的当前模式队列项并从头播放该项。
- 模式切换以当前 sentence ID 寻找目标项；若原来在播放，目标项开始后继续播放。
- 播放结束自动进入下一项；最后一项结束写入完成状态，并允许“重新开始”。

### 6.2 音频系统集成

使用 `AVAudioSession` 的播放类别；仅在实际开始播放时激活会话。配置 Audio 后台模式，支持锁屏、控制中心、耳机控制、路线变化和系统打断后的正确暂停/恢复。

### 6.3 离线策略

首发支持用户按篇下载：课程 JSON 与该课程 READY MP3 完整下载并校验后才标记为可离线。下载失败保留已完成的旧版本，不标记为可用。缓存淘汰只删除未下载、非当前播放且可重新获取的内容；永不在播放期间清理文件。

## 7. UI 页面迁移与验收矩阵

| iOS 页面 | 对应 Web 文件 | 必须保留的 UI/交互 | 原生差异 |
| --- | --- | --- | --- |
| Today | `today-article-feature.tsx`、`app/page.tsx` | 封面、标题、中文标题、开始讲解/先读文章、继续状态 | 使用 `NavigationStack` 推入 Reader |
| Archive | `article-list.tsx`、`app/archive/page.tsx` | 封面列表、标题层级、空状态、点击进入 | 使用原生滚动列表，但不可改变信息密度与排序 |
| Reader Header | `reader-header.tsx` | 标题、主题/难度、模式切换 | 系统返回手势替代网页导航链接 |
| Article Canvas | `article-canvas.tsx` | 段落、句子点按、翻译、词汇注释、活跃/已讲解高亮 | 以原生 `ScrollView` 与文本布局实现 |
| Player Dock | `player-bar.tsx` | 模式、上一段、播放/暂停、下一段、倍速、进度、跟随 | 锁屏/耳机成为同一状态机的附加控制面 |
| Guided Subtitle | `guided-subtitle.tsx` | cue 文案、随时间更新、暂停状态 | 不能遮挡正文；保持当前视觉位置和层级 |
| 阅读辅助 | `auto-follow.ts`、`progress.ts` | 自动跟随、手动滚动停跟随、恢复、模式独立进度 | 使用原生可见性判断与滚动定位 |

每个页面至少需要：Light/Dark（若系统支持）、小屏/大屏、动态字体、无网络、仅缓存、下载中、音频缺失、播放中、完成后和 VoiceOver 的截图或 UI 测试证据。

## 8. 分阶段实施

### Phase 0：基线与合同

1. 为当前 Web 三页、播放器关键状态和移动布局制作固定截图/fixture。
2. 为 Today、Archive、Article Detail、课程 JSON、媒体 Range 建立 API contract fixture。
3. 新增包含真正多句 Course Block 的课程 fixture 或样本课程，覆盖句子映射 → 时间轴 → DOM/原生高亮全链路。
4. 写出 Web → iOS 逐项对照表，并将每一项标注为未开始/实现中/验收通过。

完成标准：fixture 可离线运行；现有 Web 的 76 个单测和课程检查继续通过。

### Phase 1：原生播放纵向闭环

1. 初始化 iOS 工程和上述 Package 边界。
2. 使用 fixture 实现单篇文章的讲解/阅读队列、MP3 播放、字幕/高亮、点句跳转、模式切换、进度恢复。
3. 增加后台播放、锁屏控制、耳机控制和打断测试。

完成标准：断网下可用 fixture 完整听完一篇，Web/iOS 对照的播放状态逐项一致。

### Phase 2：页面与视觉等价

1. 完成 Today、Archive、Reader 的原生 UI，并逐屏对照 Web 基线。
2. 完成自动跟随、手动停止跟随、翻译和注释的完整交互。
3. 完成动态字体、VoiceOver、横竖屏策略和错误/空状态。

完成标准：功能/UI/交互矩阵无缺项，设计验收不接受“原生大致类似”。

### Phase 3：真实远程内容与离线

1. 实现 `/api/v1` 内容合同和私有 `course:publish`。
2. 接通 App 的目录刷新、版本更新、MP3 下载、Range 播放和离线课程。
3. 在独立测试环境发布一篇课程，验证 Web 与 iOS 同时可读、可播、可恢复。

完成标准：新的远程课程不发布新版 App 也会在 App 中出现；发布失败不能影响上一份线上课程。

### Phase 4：TestFlight 与 App Store

1. 先进行内部 TestFlight，再进行外部小规模试用。
2. 收集听完率、音频错误、下载失败、自动跟随关闭、崩溃和用户反馈；不采集与产品无关的数据。
3. 准备 App Icon、截图、预览文案、审核说明、隐私政策 URL、`PrivacyInfo.xcprivacy` 和 App Privacy 声明。
4. 审核包提供可用的演示内容；若未来引入账号，提供 App 内账号删除流程。

完成标准：真实设备上完成公开 API、离线、后台音频、无障碍与 TestFlight 验收后，再创建 App Store build。

## 9. 验收与发布门槛

### 9.1 必须自动验证

- Swift Package 单测：模型解析、队列、模式映射、进度、缓存与播放器状态机。
- API contract 测试：目录、详情、未知可选字段、拒绝未发布课程、媒体 Range。
- UI 测试：Today → Reader、模式切换、点句、上一/下一段、速率、恢复进度、手动停止/恢复跟随。
- 音频测试：打断、后台、锁屏、耳机、网络切换、离线与媒体失效。
- Web 回归：`npm test`、`npx tsc --noEmit`、`npm run lint`、`npm run course:check -- <slug>`。

### 9.2 必须人工验收

- 每次更改 Course Block、sentence ID、cue 或播放器状态机，都要听完受影响课程并检查高亮。
- 每个主要 iOS 页面与当前 Web 基线截图并排审阅。
- 每次远程发课验证目录、详情、封面、MP3 `Range`、本地缓存和真实设备播放。
- App Store 提交前核对 App Store Connect 的真实状态；“可供审核”不等于“已提交审核”。

## 10. 风险与决策记录

| 风险 | 控制措施 |
| --- | --- |
| Web/UI 迁移时发生悄然改版 | 固定截图/fixture 与逐项矩阵；任何视觉或语义变化需单独产品决策 |
| 多句 Block 高亮在真实课程中失效 | Phase 0 必须加入真实多句样本，完整验证数据→队列→时间轴→高亮 |
| App 与 Web 内容版本不一致 | 课程版本、稳定 ID、原子发布、客户端整篇课程缓存 |
| 音频切换时旧异步回调覆盖新状态 | 为每次播放请求使用 generation/token guard，并为快速切段写回归测试 |
| 不当音频同步覆盖线上内容 | 按数据库 READY 引用精确同步，staging 后原子切换，保留线上回滚点 |
| 发布要求临近才暴露 | 从工程初始化即维护隐私 manifest、SDK 清单与审核材料 |

## 11. 下一步

在写 iOS 代码前，先完成 Phase 0：从当前 Web 代码抽取 API fixture、补真实多句课程 fixture，并创建逐页视觉/交互验收清单。该阶段通过后，再写独立的逐文件实施计划。
