# XReader

XReader 是“每天一篇”的英语精读产品，给想读知识类英文、又不想一个人硬啃的 B1–B2 学习者。

每篇是 450–600 词的短文，完整学习约十分钟。先进入讲解模式：固定教师按语义块带读，原文朗读、讲解、句子高亮和自动跟随连在一起，把这篇文章讲明白；再切到阅读模式，顺着已经理解的原文自己读一遍。

**[读一篇示例课程 →](https://boringmax.com/xreader/)**

![示例课程《Why Does Rain Have a Smell?》的封面](public/images/why-rain-has-a-smell-cover.png)

现在仓库里有一篇完整课程《Why Does Rain Have a Smell?》，可以直接体验“先听懂，再读进去”的节奏。

## 本地运行

需要 Node.js 和 npm。复制 `.env.example` 为 `.env.local`，按需设置本地数据库路径：

```bash
npm install
npm run db:migrate
npm run dev
```

默认 SQLite 数据库位于 `data/xreader.db`。仓库的示例课程包在 [`courses/why-rain-has-a-smell/`](courses/why-rain-has-a-smell/)；课程导入和发布步骤见 [课程操作文档](docs/handoff/COURSE_BLOCK_OPERATIONS.md)。线上部署见 [VPS 运维文档](docs/XREADER_VPS_RUNBOOK.md)。

## 课程如何制作

课程从原文和讲稿开始，经过分句、讲解片段、音频映射与发布检查，最后导入数据库。当前制作规范以[内容工作流](docs/XReader_内容生成工作流重构Prompt.md)和[五阶段 Prompt 包](docs/XReader_五阶段Prompt包_v2.2/README_使用说明.md)为准。人工编辑的终稿保存在课程包中，发布前需要检查文字与音频是否对得上。

项目架构和当前范围见 [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)。

## 许可

应用代码采用 [MIT 许可证](LICENSE)。`courses/` 内的课程文章、讲稿及配套文本，以及 `public/images/` 内的课程封面图，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；再利用时请注明作者 Knight、附上许可链接并说明修改。第三方依赖遵循各自的许可证。
