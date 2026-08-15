# XReader VPS 部署与运维手册

本手册记录 XReader 当前已验证的 VPS 运行方式。以实际服务器为准，不要从旧项目或本地开发命令推断生产拓扑。

## 1. 当前生产拓扑

- 公网地址：`https://boringmax.com/xreader/`
- VPS：`root@89.208.242.44`
- 应用目录：`/opt/boringmax/xreader`
- 反向代理：Caddy
- 应用服务：`xreader.service`
- 本机监听：`127.0.0.1:3014`
- 生产前缀：`/xreader`
- 课程数据库：`/opt/boringmax/xreader/data/xreader.db`
- 音频目录：`/opt/boringmax/xreader/data/audio`

公网请求路径：

1. 浏览器访问 `/xreader/*`。
2. Caddy 的 `/etc/caddy/xreader.caddy` 将请求转发到 `127.0.0.1:3014`。
3. Next.js 生产服务读取本机 SQLite 与音频文件。

## 2. 运行时保留与禁止同步的内容

服务器上需要保留：

- `.next/`：Linux 上生成的生产构建产物。
- `node_modules/`：裁剪后的生产依赖。
- `public/`：封面等静态资源。
- `data/`：当前已发布课程的数据库和**被数据库引用的成品音频**；常规代码发布绝不能删除或覆盖。
- `src/`、`prisma/`、`package.json`、`package-lock.json`、`next.config.ts`：下一次服务器构建所需的最小源码与配置。

不要同步或保留：

- 本地 `.next/dev`、`.next/cache`、诊断文件、类型生成文件。
- `docs/`、`tests/`、`src/test/`、课程生成中间稿、审稿资料。
- 本地 `data/`、`.env*`、本地 `node_modules/`。
- 音频生成过程留下的历史版本、试音、失败文件与未被 `CourseBlockAudio` 的 `READY` 记录引用的文件。

特别注意：本地 macOS 生成的 `.next` 不能作为 Linux 最终运行产物。它会导致 Prisma 外部模块名不匹配或 Next 内部清单错误。应在本地完成构建验收，但必须在 VPS 上再做一次带 `/xreader` 前缀的最终构建。

### 运行时媒体的强制规则

音频目录是生成工作区，不是发布包。**严禁**执行 `rsync data/audio/` 或按课程目录整体同步，因为同一段台词可能保留多个生成版本。

只有在导入新课程、并且需要替换线上课程数据时，才可以同步：

1. 已验收的 `data/xreader.db`；
2. 该数据库中 `CourseBlockAudio.status = 'READY'` 的 `path` 指向的文件。

用数据库清单精确传输音频：

```sh
sqlite3 -noheader data/xreader.db \
  "select path from CourseBlockAudio where status = 'READY' order by audioId;" \
  | rsync -a --files-from=- data/audio/ \
      root@89.208.242.44:/opt/boringmax/xreader/data/audio/
```

在替换整个课程数据前，先停止服务，清理服务器的旧 `data/audio/<slug>/` 与旧数据库，再同步新数据库和上述引用清单；绝不上传历史版本作为“备份”。需要保留的本地版本留在本地生成工作区即可。

## 3. 发布前检查

在仓库根目录执行：

```sh
npm test
npx tsc --noEmit
npm run lint
git diff --check
NEXT_PUBLIC_BASE_PATH=/xreader DATABASE_URL=file:../data/xreader.db npm run build
```

本地构建用于确认代码可发布；最后的生产构建仍在 VPS 上完成。

### 课程内容发布（无后台）

课程仍由仓库中的 `courses/<slug>/` 和人工验收维护；不要建设或暴露发布 UI。完成 `course:check`、音频试听和数据库导入后，先在本地生成精确发布清单：

```sh
npm run course:publish -- <slug> --dry-run
```

该命令只读取公开课程的 SQLite 记录，拒绝缺失、非 READY、非 MP3 或越出 `data/audio` 的资产，并输出数据库路径与所有将同步的相对 MP3 路径。它不连接服务器。

只有明确需要上新时，才提供主机和绝对远端目录：

```sh
npm run course:publish -- <slug> --host root@89.208.242.44 --remote-root /opt/boringmax/xreader
```

远程模式先传输到 `.releases/` staging，再同步清单中的音频，原子移动数据库并重启 `xreader.service`。运行后仍必须执行第 5 节的公开 catalog、课程详情和 Range 音频验证；不要把一次 dry run 当作已发布。

## 4. 最小发布流程

以下命令只同步运行和构建所需的源码。不要使用会覆盖 `data/` 的全仓库 rsync。

```sh
rsync -a --delete --exclude 'test/' src/ root@89.208.242.44:/opt/boringmax/xreader/src/
rsync -a --delete prisma/ root@89.208.242.44:/opt/boringmax/xreader/prisma/
rsync -a --delete public/ root@89.208.242.44:/opt/boringmax/xreader/public/
rsync -a next.config.ts next-env.d.ts package.json package-lock.json tsconfig.json root@89.208.242.44:/opt/boringmax/xreader/
```

然后在 VPS 生成 Linux 构建、裁剪开发依赖并重启服务。此服务器的旧 Node 进程可能在 `systemctl stop` 时以 143 退出；该停止结果不能使后续构建短路。只有在 `npm ci`、Prisma Client 生成和 `.next/BUILD_ID` 都成功后才能 prune 或重启服务。常规代码发布优先设置 `XREADER_DIST_DIR` 生成独立构建目录，确认其中有 `BUILD_ID` 后再以短窗口切换，避免把未完成的构建暴露给线上服务。

```sh
ssh -tt root@89.208.242.44 '
  set -eu
  systemctl stop xreader.service || true
  cd /opt/boringmax/xreader
  npm ci
  npx prisma generate
  # 已在本地运行 npx tsc --noEmit 后，1GB VPS 可跳过 Next 的重复类型检查。
  XREADER_SKIP_NEXT_TYPECHECK=1 NEXT_PRIVATE_BUILD_WORKER=1 \
    NEXT_PUBLIC_BASE_PATH=/xreader DATABASE_URL=file:../data/xreader.db \
    npm run build -- --webpack
  test -f .next/BUILD_ID
  npm prune --omit=dev
  rm -rf scripts src/test
  chown -R shipnow:shipnow .next
  systemctl restart xreader.service
'
```

`ssh -tt` 是有意保留的：这台服务器上服务控制命令需要分配终端，普通非交互 SSH 可能静默地没有完成重启。

不要运行 `npm run db:migrate` 作为常规发布步骤。该命令使用 `prisma db push --accept-data-loss`，只有确认 schema 发生变化并完成数据库备份后才可执行。若 `npm ci` 被 OOM 杀死或构建失败，保留当前 `node_modules` 和 `.next`，先在独立 staging 目录重建依赖；绝不可对不完整依赖执行 `npm prune --omit=dev`。

## 5. 发布后验证

不能只看服务显示 active。至少验证：首页、动态课程页、静态封面和带 Range 的音频。

```sh
curl -fsSL -o /dev/null -w 'home=%{http_code} %{content_type}\n' https://boringmax.com/xreader/
curl -fsSL -o /dev/null -w 'article=%{http_code} %{content_type}\n' https://boringmax.com/xreader/articles/why-rain-has-a-smell
curl -fsSL -o /dev/null -w 'cover=%{http_code} %{content_type}\n' https://boringmax.com/xreader/images/why-rain-has-a-smell-cover.png
curl -fsSL -H 'Range: bytes=0-1023' -o /dev/null -w 'audio=%{http_code} %{content_type} bytes=%{size_download}\n' https://boringmax.com/xreader/api/media/<asset-id>
curl -fsSL -o /dev/null -w 'v1-catalog=%{http_code} %{content_type}\n' https://boringmax.com/xreader/api/v1/catalog
curl -fsSL -o /dev/null -w 'v1-article=%{http_code} %{content_type}\n' https://boringmax.com/xreader/api/v1/articles/why-rain-has-a-smell
```

其中 `<asset-id>` 可从课程接口 `GET /xreader/api/articles/why-rain-has-a-smell` 返回的 `audioPath` 取得。音频预期返回 `206`。

服务与日志检查：

```sh
ssh -tt root@89.208.242.44 'systemctl --no-pager --full status xreader.service'
ssh -tt root@89.208.242.44 'journalctl -u xreader.service -n 80 --no-pager'
```

## 6. 空间管理

2026-07-29 的已验证运行占用约为：

- `.next`：20MB
- `node_modules`：626MB（已执行 `npm prune --omit=dev`）
- `data`：160MB（课程数据库与音频）

发布后可以安全清理：

```sh
ssh -tt root@89.208.242.44 '
  cd /opt/boringmax/xreader
  npm prune --omit=dev
  rm -rf scripts src/test
'
```

不要删除 `data/`、`public/`、`.next/server`、`.next/static`、`.next/BUILD_ID` 或生产依赖。`data/audio` 里的任何文件都可能被已发布课程引用。

## 7. 常见故障

### 服务提示找不到生产构建

现象：日志出现 `Could not find a production build`。

处理：检查 `.next/BUILD_ID` 是否存在；不存在时在 VPS 执行第 4 节的 `npm ci` 与 `npm run build`，不要上传本地不完整 `.next` 目录。

### 启动后出现 `/_middleware` 内部错误

原因：`.next` 在传输过程中被读取，或目录混入了不完整的本地构建产物。

处理：停止服务，删除明确的 `/opt/boringmax/xreader/.next` 构建目录，然后在 VPS 重新构建；构建完成且 `BUILD_ID` 存在后再启动服务。

### 页面报 Prisma 外部模块找不到

现象：日志出现 `Failed to load external module @prisma/client-...`。

原因：本地 macOS 构建与 Linux 的 Prisma 运行时模块不匹配，或生产构建与当前 `node_modules` 不对应。

处理：在 VPS 依次执行 `npm ci`、带 `/xreader` 前缀的 `npm run build`、`npm prune --omit=dev`，然后重启服务。

### 服务 active 但页面仍打不开

先检查本机端口与真实页面，不要只看 systemd：

```sh
ssh -tt root@89.208.242.44 'curl -fsSL -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3014/xreader/'
```

再检查 Caddy 的 `/etc/caddy/xreader.caddy` 是否仍将 `/xreader*` 转发到 `127.0.0.1:3014`。
