# Editorial Memory

Codex 每次制作课程前必须读取本文件。人工审阅发现的新规律追加到这里，不在工作流中另建副本。

- 不要连续两分钟只讲文章观点。
- 不要把所有语言点都定义成词组。
- 老师应偶尔明确说某处不值得单独记忆。
- 一个语言点通常只需要一个简短例句。
- 不要频繁使用“这里值得注意”。
- 不要用大量语气词假装活人感。
- 内容讲解和语言学习不能长期分离。

## 记录格式

每次人工试听修改后追加：

```text
观察到的问题：
为什么不合格：
具体修改：
对应质量标准：
未来课程如何避免：
```

## 2026-07-28：why-rain-has-a-smell 第 1 版试听批准

观察到的问题：静态校验完成后，仍缺少完整用户端试听结论。
为什么不合格：没有人工试听证据，无法确认讲解模式的节奏、衔接和教师声音在真实播放中的表现。
具体修改：完成讲解模式与阅读模式完整试听；未发现阻塞性问题，批准当前讲稿版本。
对应质量标准：articleRhythm、spokenNaturalness、teacherJudgment、cognitiveLoadControl。
未来课程如何避免：每个新版本都必须在静态校验后完成完整试听，并把结论写入 `calibrationNotes` 后才能批准。

## 2026-07-28：why-rain-has-a-smell 第 1 版退回

观察到的问题：用户复核认为当前讲稿整体质量不合格。
为什么不合格：结构和音频校验只能证明课程可播放，不能替代对讲解内容、教师判断、节奏和学习收益的人工判断。
具体修改：撤销批准，将版本退回 `REPAIR_REQUIRED`，暂不重新导入用户端。
对应质量标准：contentUnderstanding、languageLearningValue、instructionalNecessity、teacherJudgment、articleRhythm、spokenNaturalness、nonTemplateQuality。
未来课程如何避免：先完成人工内容复核和试听，再批准用户端导入；任何用户明确退回都必须阻止发布和重新导入。
