# XReader

XReader 是一个每天一篇的英语精读应用。读者可以在讲解和阅读模式之间切换，跟随课程音频阅读文章；课程内容通过文件系统制作后导入本地数据库。

## 本地运行

需要 Node.js 和 npm。复制 `.env.example` 为 `.env.local`，按需配置本地数据库路径；音频制作才需要 Fish Audio 凭据。

```bash
npm install
npm run db:migrate
npm run dev
```

默认数据库位于 `data/xreader.db`，不会提交到 Git。当前仓库中的示例课程包位于 `courses/why-rain-has-a-smell/`；导入与发布流程见 [课程操作文档](docs/handoff/COURSE_BLOCK_OPERATIONS.md)。部署说明见 [VPS 运维文档](docs/XREADER_VPS_RUNBOOK.md)。

## 许可

应用代码采用 [MIT 许可证](LICENSE)。`courses/` 内的课程文章、讲稿及配套文本，以及 `public/images/` 内的课程封面图，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可。再利用课程素材时请注明作者 Knight、附上许可链接，并说明修改。第三方依赖遵循各自的许可证。
