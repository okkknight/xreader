# XReader 验收证据

## 已验证

- 真实 Fish Audio 教师试听：`pcm_s16le`、44100Hz、单声道、5155ms。
- 真实 Fish Audio 朗读试听：`pcm_s16le`、44100Hz、单声道、4876ms。
- `seed-rain` 八个 LessonSegment 均为本地 `READY` 真实 WAV；manifest `script_sha256`、timeline 和 ffprobe 参数已核验。
- `npm run course:validate -- --article seed-rain` 通过。
- 2026-07-28 最终统一审查：`npm test` 为 21 files / 29 tests 通过；`npm run lint` 与 `npm run build` 通过；`npm run test:e2e` 为 4/4 通过；`npm run course:validate -- --all` 通过。

## 课程与人工审核状态

| Course | Source traceability | Fact review | English review | Teaching review | Audio audition |
| --- | --- | --- | --- | --- | --- |
| seed-rain | 既有本地生产证据 | pending | pending | pending | 本地真实 Fish Audio 完成 |
| review-waiting | 2 条 ArticleSource：PMC 等待研究、时间感综述 | pending | pending | pending | not generated |
| review-memory | 3 条 ArticleSource：APA reconstructive memory、misinformation effect、false memory | pending | pending | pending | not generated |
| review-quiet | 2 条 ArticleSource：APA fundamental attribution error、SEP Other Minds | pending | pending | pending | not generated |
| review-solitude | 2 条 ArticleSource：PMC solitude reappraisal、SEP Thoreau | pending | pending | pending | not generated |

四篇人文课程均为 450–600 词、六段二十四句、八个教学段的 `ARTICLE_DRAFT`。导入命令会清理旧的克隆草稿 `review-tides`、`review-ink`、`review-maps`、`review-shade`，并只写入这四篇独立课程；不会创建音频或通过 QA。

验证命令：`npm run courses:seed-humanities`，随后运行 `npm run course:validate -- --all`。不得仅凭自动 QA 或结构校验将任一审核课程发布；事实、英文、教学与试听均需人工完成。

## 最终统一审查结论（2026-07-28）

**实现验收：PASS。** 四篇课程均为独立正文、稳定 ID、有效批注偏移、八段教学映射；本地数据库抽查确认它们均为 `ARTICLE_DRAFT`、拥有 2–3 条来源、没有 QA 记录和音频资产。旧的克隆课程不会在新的导入流程中保留。

**发布就绪：BLOCKED。** 这不是代码或自动化失败，而是既定内容门槛：四篇课程的事实、英文、教学和 Fish Audio 试听仍标为人工待审。未完成这些审核前，禁止 QA 通过或发布。

## 讲解音频端到端修复（2026-07-28）

- 根因一：阅读器只改变播放状态，没有挂载媒体元素或调用 `AudioController`。
- 根因二：`db:seed` 重建 `seed-rain` 后没有恢复之前已生成且仍可用的本地音频绑定；公共查询还曾返回内部存储路径而不是媒体 API URL。
- 修复后，seed 仅重绑 `READY`、文本 hash 匹配且本地文件存在的资产；公共文章返回 `/api/media/<assetId>`；阅读器以该 URL 播放并在结束后推进队列。
- 运行时验收：浏览器点击“开始讲解”后，媒体 `readyState=4`、`paused=false`、无媒体错误，且自动推进到后续片段；本地首页为 HTTP 200，公共文章返回 8 条媒体 URL。
- 回归：`npm test` 为 23 files / 32 tests 通过；`npm run test:e2e` 为 4/4 通过；`npm run course:validate -- --all`、`npm run lint` 与 `npm run build` 均通过。
