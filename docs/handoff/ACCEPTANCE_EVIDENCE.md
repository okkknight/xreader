# XReader 验收证据

## 已验证

- 真实 Fish Audio 教师试听：`pcm_s16le`、44100Hz、单声道、5155ms。
- 真实 Fish Audio 朗读试听：`pcm_s16le`、44100Hz、单声道、4876ms。
- `seed-rain` 八个 LessonSegment 均为本地 `READY` 真实 WAV；manifest `script_sha256`、timeline 和 ffprobe 参数已核验。
- `npm run course:validate -- --article seed-rain` 通过。
- 自动测试、lint、Next 生产构建和阅读器/后台 E2E 在实现过程中均已通过；最终统一审查需重新运行并记录最终输出。

## 五篇审核课程

| ID | 状态 | 人工审核要求 |
| --- | --- | --- |
| seed-rain | 本地真实音频完成 | 试听、事实、英文、教学、移动端审阅 |
| review-tides | ARTICLE_DRAFT | 需替换为已核验的潮汐内容后再生成音频 |
| review-ink | ARTICLE_DRAFT | 需替换为已核验的墨水内容后再生成音频 |
| review-maps | ARTICLE_DRAFT | 需替换为已核验的地图内容后再生成音频 |
| review-shade | ARTICLE_DRAFT | 需替换为已核验的阴影内容后再生成音频 |

不得仅凭自动 QA 或结构校验将任一审核课程发布。`npm run course:validate -- --all` 还会拒绝正文重复的课程；当前四篇草稿预期会被该规则阻止，直到各自替换为独立内容。
