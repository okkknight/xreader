# XReader 验收证据

## 已验证

- 真实 Fish Audio 教师试听：`pcm_s16le`、44100Hz、单声道、5155ms。
- 真实 Fish Audio 朗读试听：`pcm_s16le`、44100Hz、单声道、4876ms。
- `seed-rain` 八个 LessonSegment 均为本地 `READY` 真实 WAV；manifest `script_sha256`、timeline 和 ffprobe 参数已核验。
- `npm run course:validate -- --article seed-rain` 通过。
- 自动测试、lint、Next 生产构建和阅读器/后台 E2E 在实现过程中均已通过；最终统一审查需重新运行并记录最终输出。

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
