# XReader iOS 迁移验收矩阵

更新日期：2026-08-06。本文件区分已由当前代码和自动测试证明的能力、尚待视觉/设备验收的能力，以及必须先发生的外部发布条件。它不能替代真实 App Store Connect 状态。

| 需求 | 当前实现证据 | 自动验证 | 状态 |
| --- | --- | --- | --- |
| Today 封面、双入口、继续状态 | `TodayView`、`CatalogRow`、`ReaderProgressStore` | Swift 模型/缓存测试 | 代码完成；待视觉验收 |
| Archive 完整列表与中文导语 | `ArchiveView`、`CatalogView` | Swift 编译 | 代码完成；待视觉验收 |
| 讲解/阅读队列、点句、模式映射 | `GuidedPlaybackSession` | `GuidedPlaybackSessionTests` | 已自动验证 |
| 多句 Block 高亮和字幕 | Web fixture、iOS cue 状态机 | Web E2E、Swift 播放测试 | 已自动验证 |
| 自动跟随、手动停止、恢复入口 | `ArticleReaderView` | Swift 编译 | 代码完成；待真实 UI 验收 |
| 倍速、上一/下一、播完重启、进度恢复 | `GuidedPlaybackSession`、`ReaderProgressStore` | Swift 播放/进度测试 | 已自动验证 |
| 缓存和完整课程离线下载 | `ContentCache`、`OfflineCourseStore` | 缓存/下载原子性测试 | 已自动验证；待设备断网验收 |
| 系统打断、后台音频、锁屏命令 | `AVPlayerAudioEngine`、`ReaderPlaybackRemoteController` | 打断状态机测试、iOS 编译 | 代码完成；待真机验收 |
| 动态字体和 VoiceOver | `@ScaledMetric`、可访问标签 | iOS 编译 | 待小屏/大字体/VoiceOver 验收 |
| v1 目录、详情、Range 媒体与稳定 ID | Web `/api/v1` 路由与 DTO | Web v1 E2E 3 项；生产目录、详情和 Range 核验 | 已发布并验证 |
| 无 CMS 的私有课程发布 | `course:publish` 及 VPS runbook | 发布计划集成测试 | 发布链路已准备；待首次实际课程发布验收 |
| App 图标、隐私清单、后台模式 | `Assets.xcassets`、`PrivacyInfo.xcprivacy`、Info.plist | iOS 编译 | 工程准备完成 |

## 发布前外部闸门

1. 已于 2026-08-06 核验生产目录、课程详情和 MP3 Range；iOS 仍需在真实设备/TestFlight 上验证实际播放与离线行为。
2. Apple Developer Team、`com.boringmax.xreader` Bundle ID 和专属 `XReader App Store` provisioning profile 已配置；已成功 Archive。仍需在 App Store Connect 填写元数据并上传 TestFlight，才能进入设备验收或提交审核。
3. 需要在真实 iPhone 上完成播放、锁屏/耳机、系统打断、网络切换、完整离线下载、动态字体和 VoiceOver 验收，并留存截图。
4. 隐私政策已公开在 `https://boringmax.com/xreader/privacy`；提交前仍需保证审核可访问的演示课程持续可用。

## 已执行的本地检查

```sh
# Web
npx tsc --noEmit
npm run test:e2e -- tests/e2e/public-content-api.spec.ts

# iOS
swift test
xcodebuild -project XReader.xcodeproj -scheme XReader \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  build CODE_SIGNING_ALLOWED=NO
```
