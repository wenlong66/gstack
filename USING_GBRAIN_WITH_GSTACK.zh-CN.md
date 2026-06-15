# 使用 GBrain 与 GStack

[English](USING_GBRAIN_WITH_GSTACK.md) | 简体中文

你的编码 agent，终于有了一份它真的记得住的记忆。

[GBrain](https://github.com/garrytan/gbrain) 是为 AI agent 设计的持久知识库。它会保存 agent 学到了什么、你们做过哪些决策、什么方案有效、什么方案无效，并允许 agent 在需要时按需检索这一切。GStack 提供的是一条一键路径，让你从零走到“gbrain 已经跑起来，而且我的 agent 能直接调用它”，无论你只是想本地试试、想和团队共享，还是介于两者之间的任意方案。

这是完整版说明：所有场景、所有 flag、所有 helper bin、所有排障步骤都在这里。想先看简版介绍，请看 [README 的 GBrain 小节](README.md#gbrain--persistent-knowledge-for-your-coding-agent)。想看错误码和 sync 专项问题，请看 [docs/gbrain-sync.md](docs/gbrain-sync.md)。

---

## 一键安装

```bash
/setup-gbrain
```

就这一条。这个 skill 会检测你当前的状态，最多问你三个问题，然后带你完成安装、初始化、Claude Code 的 MCP 注册，以及按仓库粒度的信任策略配置。在一台什么都没装的干净 Mac 上，它通常能在五分钟内跑完；如果你的机器上已经配过一些东西，它只需要几秒钟，因为它会识别已有状态并跳过已完成步骤。

## 配置完成后你会得到什么

当 `/setup-gbrain` 结束后，你的编码 agent 会多出两个它之前没有的检索面：

- **这个仓库上的语义级代码搜索。** `gbrain search "browser security canary"` 返回的是按相关性排序的文件片段，而不是精确匹配式的 grep 结果。`gbrain code-def`、`code-refs`、`code-callers`、`code-callees` 可以按符号遍历调用图，这在你不知道实现藏在哪个文件里、但知道它“做了什么”时特别有用。只要问题是语义型的，agent 会优先用这些而不是 Grep；项目里的 `CLAUDE.md` 也会被写入一个 `## GBrain Search Guidance` 区块，教会它何时该怎么路由。
- **跨 session 的记忆。** 过去 session 里的计划、复盘、决策和经验会保存在 `~/.gstack/` 中；如果你还启用了 artifacts sync，它们会被推送到一个私有 git 仓库，并由 gbrain 索引。所以当你执行 `gbrain search "what did we decide about auth?"` 时，它真的能把之前的 CEO 计划找出来，而不是逼你每次重新讲一遍上下文。

如果你还启用了远程 MCP（下面的路径 4），brain 查询会路由到一个共享 brain server，其他机器也能写入它。你的笔记本、台式机，以及队友的机器，都能看到同一份记忆。

## 四条路径

当 skill 问你 “Where should your brain live?” 时，你要从下面四种里选一种。

### 路径 1：Supabase，你已经有连接串了

适合：你自己，或者你队友的云端 agent，已经 provision 好了一个 Supabase brain，而你只是想让这台本地机器接入同一份数据。

**会发生什么：** 你贴入 Session Pooler URL（Settings → Database → Connection Pooler → Session → copy URI，端口 6543）。skill 会在关闭回显的状态下读取它，显示一份打码后的预览（例如 `aws-0-us-east-1.pooler.supabase.com:6543/postgres`，可见 host、隐藏密码），然后通过 `GBRAIN_DATABASE_URL` 环境变量把它交给 `gbrain init`。这个 URL 不会进入 argv，也不会落到你的 shell history 里。

**信任提示：** 一旦你粘贴这个 URL，你本地的 Claude Code 就拥有了对这份共享 brain 的完整读写权限。如果这不是你想要的信任级别，请改选 PGLite 本地模式（路径 3），接受两边 brain 彼此独立。

### 路径 2a：Supabase，自动创建一个新项目

适合：全新的 Supabase 账号，你想零点击搞出一个全新的项目。

**会发生什么：** 你贴一个 Supabase Personal Access Token（PAT）。skill 会先展示权限说明，明确告诉你：*这个 token 拥有你整个 Supabase 账号中所有项目的完全访问权限，而不只是我们即将创建的这个项目。* 然后它会列出你的 organizations，问你选哪个 organization 和哪个 region（默认 `us-east-1`），生成数据库密码，调用 `POST /v1/projects`，接着每 5 秒轮询一次 `GET /v1/projects/{ref}`，直到项目变成 `ACTIVE_HEALTHY`（180 秒超时），再取回 pooler URL 并交给 `gbrain init`。端到端大约 90 秒。

结束时会明确提醒你去 https://supabase.com/dashboard/account/tokens 撤销这个 PAT。skill 自己已经把它从内存里丢掉了。

**如果你在创建中途 Ctrl-C：** SIGINT trap 会打印当前正在创建的 project ref，以及一个恢复命令。你可以去 Supabase dashboard 手动删掉孤儿项目，也可以执行 `/setup-gbrain --resume-provision <ref>`，从中断处继续。

### 路径 2b：Supabase，手动创建

适合：你宁愿自己在 supabase.com 里点点点，也不愿意粘一个 PAT。

**会发生什么：** skill 会带你走完四个手动步骤（注册 → 新建项目 → 等待约 2 分钟 → 复制 Session Pooler URL），之后就接入路径 1 的粘贴步骤。安全处理方式与路径 1 相同。

### 路径 3：PGLite 本地模式

适合：先试试、不想注册账号、不想上云、不想共享。或者你就是想要一个“只属于这台 Mac”的 brain，和任何云端 agent 完全隔离。

**会发生什么：** 执行 `gbrain init --pglite`。brain 会落在 `~/.gbrain/brain.pglite`。初始化本身不需要任何网络调用。30 秒左右完成。

**Embedding 模型。** 当设置了 `VOYAGE_API_KEY` 时，gstack 会用 `voyage-code-3`（1024 维）来初始化 PGLite，这是 Voyage 针对代码优化的 embedding 模型。在这个代码库的 symbol 查询上，它正面胜过 Voyage 通用模型 `voyage-4-large`，也胜过 OpenAI 的 `text-embedding-3-large`。如果没有 `VOYAGE_API_KEY`，gbrain 会自动选择别的 provider（如果有 `OPENAI_API_KEY` 就用 OpenAI 的 1536 维模型，否则沿着自己的 provider 链继续向下尝试）。无论哪种情况，在 sync 过程中 embeddings 都会调用对应 provider 的 API，所以在执行 `/sync-gbrain` 之前，请先把你想用的 provider key 设好。

如果你只是想先感受一下 gbrain 的使用手感，这是最好的起点。以后你始终可以通过 `/setup-gbrain --switch` 再迁移到云端。

### 路径 4：远程 gbrain MCP（split-engine）

适合：你的 brain 跑在另一台你自己控制的机器上（Tailscale、ngrok、内网）或者队友的服务器上。你想获得跨机器共享记忆的好处，但不想在本地再起一个数据库，同时你又还想在这台 Mac 上保留符号感知的代码搜索能力。

**会发生什么：** 你粘贴一个 MCP URL（例如 `https://wintermute.tail554574.ts.net:3131/mcp`）和一个 bearer token。skill 会在线验证这个 URL，把 gbrain 注册成一个 user-scope 的 HTTP MCP，写进 `~/.claude.json`，然后再问你要不要顺手再起一个小型本地 PGLite 专供代码搜索使用（约 30 秒，约 120 MB 磁盘）。

如果你接受本地 PGLite，那么你会进入 **split-engine mode**：

- **Brain / context 查询**（`mcp__gbrain__search`、`mcp__gbrain__query`、`mcp__gbrain__get_page`）走远程 MCP。计划、复盘、经验、跨机器记忆，都在共享服务器上。
- **代码查询**（`gbrain code-def`、`code-refs`、`code-callers`、`code-callees`，以及针对代码的 `gbrain search`）走本地 PGLite，通过每个 worktree 里的 `.gbrain-source` pin 文件路由。代码是本地索引的，速度快，也不会离开这台机器。

这两个引擎彼此独立。清空本地 PGLite 不会碰远程 brain；轮换远程 MCP 的 bearer token 也不会影响本地代码搜索。如果你的远程 brain 管理员不能，也不应该，去索引每个开发者本机 checkout 的代码，那么这也是正确配置：远程负责共享记忆，本地负责本地代码。

## 给 Claude Code 注册 MCP

默认情况下，skill 会问你：“Give Claude Code a typed tool surface for gbrain?” 如果你回答 yes，它会执行：

```bash
claude mcp add gbrain -- gbrain serve
```

这样就把 gbrain 的 stdio MCP server 注册进 Claude Code 了。从此以后，`gbrain search`、`gbrain put`、`gbrain get` 等能力会以一等工具的形式出现在每个 session 中，而不是依赖 bash shell-out。

**如果 `claude` 不在 PATH 里，** skill 会优雅地跳过 MCP 注册，并给你一个手动注册提示。任何通过 shell 调用 `gbrain` 的 skill 仍然能继续工作，所以 MCP 是增强项，不是前置条件。

**其他本地 agent**（Cursor、Codex CLI 等）需要各自独立完成自己的 MCP 注册。这个 skill 的 v1 目标是 Claude Code；其他 host 需要在自己的 MCP 配置里手动注册 `gbrain serve`。

## 按 remote 粒度的信任策略（三元组）

你机器上的每个 repo 都要做一个策略决策：**read-write**、**read-only** 或 **deny**。

- **read-write** —— agent 可以在当前 repo 的上下文中 `gbrain search`，也可以把新页面写回 brain。适合你自己的项目，通常也是默认选择。
- **read-only** —— agent 可以搜索 brain，但绝不能从这个 repo 的 session 里写入新页面。非常适合服务多个客户的顾问：可以读取共享 brain，但不会在你身处 Client B 仓库时，把 Client A 的代码认知污染进去。
- **deny** —— 完全不允许任何 gbrain 交互。这个 repo 对 gbrain 工具链来说是不可见的。

这个 skill 会在你第一次在某个 repo 里运行 gstack skill 时询问一次。之后这个决定就会粘住：同一个 git remote 的所有 worktree 和 branch 都共享同一条策略，因此你只需要设一次，它就会一直跟着你。

SSH 和 HTTPS 的 remote 变体会被归一到同一个 key：`https://github.com/foo/bar.git` 和 `git@github.com:foo/bar.git` 会被视为同一个 repo。

**修改策略：**

```bash
/setup-gbrain --repo      # 只针对当前 repo 重新提问

# 或直接执行：
~/.claude/skills/gstack/bin/gstack-gbrain-repo-policy set "github.com/foo/bar" read-only
```

**查看所有策略：**

```bash
~/.claude/skills/gstack/bin/gstack-gbrain-repo-policy list
```

存储位置：`~/.gstack/gbrain-repo-policy.json`，权限 mode 0600，带 schema version，方便未来迁移保持确定性。

## 用 `/sync-gbrain` 让 brain 跟上最新代码

`/setup-gbrain` 是一次性的 onboarding。`/sync-gbrain` 才是你每次想让 gbrain 看到当前 repo 最新代码变化时要执行的动作。

```bash
/sync-gbrain                # 增量同步：走 mtime fast-path，干净树通常几秒
/sync-gbrain --full         # 全量重建索引（大 Mac 上约 25-35 分钟）
/sync-gbrain --code-only    # 只跑代码阶段，跳过 memory + brain-sync
/sync-gbrain --dry-run      # 只预览会同步什么，不做写入
```

这个 skill 会独立执行三段：code、memory、brain-sync。其中任何一段失败，都不会阻塞其他两段。状态保存在 `~/.gstack/.gbrain-sync-state.json` 中，因此重新运行可以平滑续上。

**在一个全新的 worktree 上，它会做这些事：**

1. **Pre-flight。** 检查 `gbrain_local_status`（本地引擎健康度）。如果引擎状态是 `broken-db` 或 `broken-config`，skill 会直接 STOP，并弹出修复菜单，它拒绝默默降级。如果本地引擎缺失，而你当前是 remote-MCP 模式（路径 4），那 code 阶段会干净地 SKIP，只有 brain-sync 会继续跑。
2. **Code 阶段。** 通过 `gbrain sources add` 把当前 cwd 注册成 federated source，在 repo 根目录写入一个 `.gbrain-source` pin 文件（风格类似 kubectl context。每个 worktree 都有自己独立的 pin，所以 Conductor 的兄弟 worktree 不会撞车），然后运行 `gbrain sync --strategy code`。
3. **Memory 阶段。** 暂存你的 `~/.gstack/` transcript 和 curated memory。在本地 stdio MCP 模式下，这些内容会被 ingest 到本地引擎；在远程 HTTP MCP 模式下，则会把暂存 markdown 落到 `~/.gstack/transcripts/run-<pid>-<ts>/`，供远程 brain 管理员的 pull pipeline 处理。默认 ingest timeout 是 30 分钟；如果是个很大的 brain，可以通过 `GSTACK_INGEST_TIMEOUT_MS` 调高（支持 1 分钟到 24 小时）。即使超时，gbrain 的 import checkpoint 也会保留，因此下一次 `/sync-gbrain` 会从中断处继续，而不是从头再来。
4. **Brain-sync 阶段。** 如果你配置了私有 artifacts repo，就把 curated artifacts（plans、designs、retros）推送过去。
5. **CLAUDE.md 指引。** 做一次能力往返检查（写一页 → 搜索 → 找到它）。如果检查通过，就把 `## GBrain Search Guidance` 区块写入项目的 `CLAUDE.md`；如果检查失败，就把这个区块删掉。agent 永远不应该被要求使用一个实际上并未安装好的工具。

**水位线（watermark）。** sync 状态按 commit hash 推进。如果 gbrain 遇到某个无法索引的文件（单文件 5 MB 硬上限，或者同步时文件中途消失），watermark 就不会前进，后续 sync 会持续重试。若这是一个你无法修复、但又想跳过去继续前进的失败，可以执行：

```bash
gbrain sync --source <source-id> --skip-failed
```

这个流程可重跑、幂等，并且可以在同一台机器上的多个终端里安全运行（由 `~/.gstack/.sync-gbrain.lock` 加锁）。

## 之后再切换引擎

一开始选了 PGLite，现在又想加入团队共享 brain？一个命令就行：

```bash
/setup-gbrain --switch
```

这个 skill 会在 `timeout 180s` 的保护下执行 `gbrain migrate --to supabase --url "$URL"`。迁移是双向的（Supabase → PGLite 也支持），而且是无损的：pages、chunks、embeddings、links、tags 和 timeline 都会被复制。原始 brain 会保留下来作为备份。

**如果迁移卡住：** 可能是另一个 gstack session 正持有源 brain 的锁。3 分钟后 timeout 会触发，并给出可执行的提示。关掉其他 workspace 后重试即可。

## GStack memory sync（这是另一件事）

这和 gbrain 本身不是一回事。默认情况下，你的 gstack 状态（`~/.gstack/` 中的 learnings、plans、retros、timeline、developer profile）只存在于本机。“GStack memory sync” 是一个可选能力：它会把一份经过筛选、经过 secret scan 的子集推送到一个私有 git 仓库，让你的记忆跟着你跨机器走。如果你也在跑 gbrain，那么这个私有 git 仓库还会顺便变成 gbrain 可索引的数据源。

开启方式：

```bash
gstack-brain-init
```

你会看到一个一次性的隐私选项：**everything allowlisted** / **artifacts only**（只同步 plans、designs、retros、learnings，跳过 timeline 这种行为性数据）/ **off**。每次 skill 运行开始和结束时都会同步队列，不需要 daemon，也没有后台进程。

任何看起来像 secret 的内容（AWS keys、GitHub tokens、PEM blocks、JWTs、bearer tokens）都会在离开你机器之前被拦住，不会进入 sync。

**换到一台新机器时：** 把 `~/.gstack-brain-remote.txt` 拷过去，执行 `gstack-brain-restore`，昨天的 learnings 就会出现在今天这台笔记本上。

完整说明： [docs/gbrain-sync.md](docs/gbrain-sync.md)。错误索引： [docs/gbrain-sync-errors.md](docs/gbrain-sync-errors.md)。

在首次初始化结束时，`/setup-gbrain` 也会顺便问你要不要把这个功能一起接上。它只会多问一个 AskUserQuestion，并且复用同一套私有仓库基础设施。

## 清理孤儿项目

如果你在 provision 中途 Ctrl-C 过、为试名字创建过三四个项目、或者总之在 Supabase 里堆出了一些你不用的 gbrain 风格项目，有一个专门的子命令：

```bash
/setup-gbrain --cleanup-orphans
```

这个 skill 会重新收集一个 PAT（一次性使用，用完即丢），然后列出你 Supabase 账号里所有名字以 `gbrain` 开头、但 ref 又与当前活跃 `~/.gbrain/config.json` pooler URL 不匹配的项目。对每个孤儿项目，它都会逐个询问：*“Delete orphan project `<ref>` (`<name>`, created `<date>`)?”* 没有批量操作，也没有 “delete all” 快捷方式。当前活跃 brain 绝不会出现在待删除列表里。

## 命令与 flag 参考

### `/setup-gbrain` 入口模式

| 调用方式 | 作用 |
|---|---|
| `/setup-gbrain` | 完整流程：检测状态、选择路径、安装、初始化、MCP、策略配置、可选 memory-sync |
| `/setup-gbrain --repo` | 只改当前 repo 的 per-remote 信任策略 |
| `/setup-gbrain --switch` | 迁移引擎（PGLite ↔ Supabase），不重跑其他步骤 |
| `/setup-gbrain --resume-provision <ref>` | 恢复一条在轮询阶段被打断的 path-2a 自动创建流程 |
| `/setup-gbrain --cleanup-orphans` | 列出孤儿 Supabase 项目，并逐个确认删除 |

### Bin helpers（适合脚本调用）

| Bin | 用途 |
|---|---|
| `gstack-gbrain-detect` | 以 JSON 输出当前状态：gbrain 是否在 PATH、版本、配置引擎、doctor 状态、sync 模式 |
| `gstack-gbrain-install` | 先探测再安装的安装器（依次探测 `~/git/gbrain`、`~/gbrain`，再 fresh clone）。支持 `--dry-run` 和 `--validate-only`。PATH shadow 检查若失败，会以退出码 3 结束并弹出修复菜单。 |
| `gstack-gbrain-lib.sh` | 这是被 source 的，不是被执行的。提供 `read_secret_to_env VARNAME "prompt" [--echo-redacted "<sed-expr>"]` |
| `gstack-gbrain-supabase-verify` | 做结构级 URL 校验。若是直接连接 URL（`db.*.supabase.co:5432`）会拒绝，并以退出码 3 结束。 |
| `gstack-gbrain-supabase-provision` | Management API 封装。子命令包括：`list-orgs`、`create`、`wait`、`pooler-url`、`list-orphans`、`delete-project`。都要求环境变量里有 `SUPABASE_ACCESS_TOKEN`。`create` 和 `pooler-url` 还要求 `DB_PASS`。每个子命令都支持 `--json`。 |
| `gstack-gbrain-repo-policy` | per-remote 的信任三元组。子命令：`get`、`set`、`list`、`normalize` |
| `gstack-gbrain-source-wireup` | 通过 `gbrain sources add` + `git worktree` 把你的 `~/.gstack/` brain repo 注册进 gbrain，作为 federated source，然后执行首次 `gbrain sync`。幂等。它替代了 v1.12.x 里已经废弃的 `consumers.json + /ingest-repo` HTTP 接线方式。支持的 flags：`--strict`、`--source-id <id>`、`--no-pull`、`--uninstall`、`--probe`。 |

### gbrain CLI（上游工具本体）

Gbrain 自身带有这些命令，gstack 只是对它们做了包装：

| Command | 用途 |
|---|---|
| `gbrain init --pglite` | 初始化一个本地 PGLite brain |
| `gbrain init --non-interactive` | 通过环境变量初始化（`GBRAIN_DATABASE_URL` 或 `DATABASE_URL`）。绝不要把 URL 作为 argv 传进去，否则会泄漏到 shell history。 |
| `gbrain doctor --json` | 健康检查。返回 `{status: "ok"|"warnings"|"error", health_score: 0-100, checks: [...]}` |
| `gbrain migrate --to supabase --url ...` | 把 PGLite brain 迁移到 Supabase（无损，且保留源作为备份） |
| `gbrain migrate --to pglite` | 反向迁移 |
| `gbrain search "query"` | 搜索 brain |
| `gbrain put "<slug>" --content "<markdown-with-frontmatter>"` | 写入一页（title / tags 要放在 `--content` 里的 YAML frontmatter 中） |
| `gbrain get "<slug>"` | 读取一页 |
| `gbrain serve` | 启动 MCP stdio server（供 `claude mcp add` 使用） |

### 配置文件与状态

| 路径 | 里面存什么 |
|---|---|
| `~/.gbrain/config.json` | 引擎类型（pglite / postgres）、数据库 URL 或路径、API keys。mode 0600。由 `gbrain init` 写入。 |
| `~/.gstack/gbrain-repo-policy.json` | per-remote 信任三元组。Schema v2。mode 0600。 |
| `~/.gstack/.setup-gbrain.lock.d` | 并发运行锁（原子 mkdir）。正常退出和 SIGINT 时都会释放。 |
| `~/.gstack/.brain-queue.jsonl` | GStack memory sync 的待同步队列 |
| `~/.gstack/.brain-last-push` | 最近一次 sync push 的时间戳（供 `/health` 评分使用） |
| `~/.gstack-brain-remote.txt` | 你的 gstack memory sync 远端地址（可以安全复制到别的机器） |
| `~/.gstack/.setup-gbrain-inflight.json` | 预留给未来 `--resume-provision` 的持久状态 |

### 环境变量

| 变量 | 在哪读取 | 作用 |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | `gstack-gbrain-supabase-provision` | 调 Management API 的 PAT。每次 setup 结束后即丢弃。 |
| `DB_PASS` | `gstack-gbrain-supabase-provision`（create、pooler-url） | 自动生成的数据库密码。绝不会放进 argv。 |
| `GBRAIN_DATABASE_URL` | `gbrain init`、`gbrain doctor` 等 | Postgres 连接串（在我们的场景里就是 Supabase pooler URL）。环境变量优先级高于 `~/.gbrain/config.json`。 |
| `DATABASE_URL` | `gbrain init`（回退项） | 与 `GBRAIN_DATABASE_URL` 语义相同；仅次级检查。 |
| `SUPABASE_API_BASE` | `gstack-gbrain-supabase-provision` | 覆盖默认的 Management API host。测试时常用来指向 mock server。 |
| `GBRAIN_INSTALL_DIR` | `gstack-gbrain-install` | 覆盖默认安装路径（`~/gbrain`） |
| `GSTACK_HOME` | 每个 bin helper | 覆盖 `~/.gstack` 状态目录。测试里大量使用。 |
| `VOYAGE_API_KEY` | `gbrain embed` 子进程；gstack 的 PGLite init | 当该变量存在时，gstack 会用 `voyage-code-3`（1024 维）初始化 PGLite，这是 Voyage 针对代码优化的 embedding 模型。在这个代码库的 symbol 查询上，它胜过 `voyage-4-large` 和 OpenAI 的 `text-embedding-3-large`。A/B 数据见 CHANGELOG v1.43.1.0。 |
| `OPENAI_API_KEY` | `gbrain embed` 子进程 | 当 `VOYAGE_API_KEY` 不存在时，`gbrain sync` / `/sync-gbrain` 的 embeddings 会使用它（gbrain 自动选择的回退项，即 `text-embedding-3-large` 1536 维）。如果两者都没有，页面仍会以结构化方式导入（symbol tables、chunks），但语义搜索会明显退化，你会在 sync log 中看到类似 `[gbrain] embedding failed for code file ...` 的日志。 |
| `ANTHROPIC_API_KEY` | `claude-agent-sdk`、付费 evals | `bun run test:evals` 以及任何直接对 Claude 发起 `query()` 调用都需要它。 |
| `GSTACK_OPENAI_API_KEY` | `lib/conductor-env-shim.ts` | Conductor 注入时的回退变量。当标准变量为空时，会被提升为 `OPENAI_API_KEY`。 |
| `GSTACK_ANTHROPIC_API_KEY` | `lib/conductor-env-shim.ts` | 与上面同理，用于 Anthropic。 |

## Conductor + GSTACK_* 环境变量

如果你是在 [Conductor](https://conductor.build) workspace 里运行 gstack，**Conductor 会明确从 workspace 的环境变量中剥掉 `ANTHROPIC_API_KEY` 和 `OPENAI_API_KEY`。** 所以把它们写进 `~/.zshrc` 或 `.env` 都没用，因为剥除发生在环境继承之后。想把可用的 API key 带进 workspace，正确方式是在 Conductor 的 workspace env 配置里设 `GSTACK_ANTHROPIC_API_KEY` 和 `GSTACK_OPENAI_API_KEY`。Conductor 会原样保留这两个变量。

`lib/conductor-env-shim.ts` 负责在 gstack 侧把这个缺口补上：只要以 side effect 的方式导入它（`import "../lib/conductor-env-shim";`），它就会在标准变量缺失时，把 `GSTACK_FOO_API_KEY` 提升成 `FOO_API_KEY`，供后续看不到标准变量名的子进程使用。这个 shim 已经接进了：

- `bin/gstack-gbrain-sync.ts` —— 所以 `/sync-gbrain` 能拿到 OpenAI 做 embeddings
- `bin/gstack-model-benchmark` —— 所以 `--judge` 模式能正常运行，无需手工映射 env
- `scripts/preflight-agent-sdk.ts` —— 所以 paid-eval 的 auth probe 能工作
- `test/helpers/e2e-helpers.ts` —— 所以 `bun run test:evals` 能拿到 Anthropic

如果你新增了一个会访问付费 API，或者需要 gbrain embeddings 的 TS 入口，请在文件顶部也加上同样这一行 import。贡献者 checklist 见 [CONTRIBUTING.md “Conductor workspaces”](CONTRIBUTING.md#conductor-workspaces)。

`bin/gstack-codex-probe` 是 bash 写的，它不会直接读取这些变量，它依赖的是 Codex CLI 自己管理在 `~/.codex/` 下的鉴权状态。

## 安全模型

这个 skill 处理的每一种 secret 都遵守同一条规则：**只走环境变量，不走 argv，不写日志，也不会由我们写进磁盘。** 唯一会持久化的是 gbrain 自己的 `~/.gbrain/config.json`，权限 mode 0600。这是 gbrain 自己的纪律，不是我们额外加的例外。

**代码层面的强制约束：**

- `test/skill-validation.test.ts` 里有 CI grep 测试，一旦发现 `$SUPABASE_ACCESS_TOKEN` 或 `$GBRAIN_DATABASE_URL` 出现在 argv 位置，构建就会失败
- 还有一条 CI grep 测试会检查 `bin/gstack-gbrain-supabase-provision` 中是否出现 `--insecure`、`-k` 或 `NODE_TLS_REJECT_UNAUTHORIZED=0`
- provision helper 文件顶部的 `set +x` 会阻止 debug trace 把 PAT 打印出来
- telemetry payload 只包含枚举型分类值（scenario、install result、MCP opt-in、trust tier），绝不包含可能混入 secret 的自由文本字符串

**测试层面的强制约束：**

- `test/secret-sink-harness.test.ts` 会对每个处理 secret 的 bin 注入一个种子 secret，然后断言这个 secret 不会出现在任何被捕获的通道里（stdout、stderr、`$HOME` 下写出的文件、telemetry JSONL）。每个 seed 会匹配四种形式：原文、URL 解码后、前 12 个字符前缀、base64。
- 同一个测试文件里还有正向对照，它会故意在所有受监控通道中泄漏 seed，并断言 harness 确实能抓到每一种。如果没有这些正向对照，一个静默漏报的 harness 看起来会和真正工作的 harness 没区别。

**你仍然可能泄漏的东西**（v1 的诚实边界）：

- 如果你不通过 `read -s`，而是直接把 secret 粘进普通聊天消息里，那它就会进入对话 transcript，也可能进入 host 侧日志
- leak harness 不会转储子进程环境，所以如果某个 bin 做了 `env >> ~/.log` 这种事，它是能绕过检测的（v1 里没有 bin 这么做，grep 测试也在阻止这件事）
- 你自己 shell 的 `HISTFILE` 行为属于你的 shell，不属于我们。我们的代码从不把 secret 作为 argv 传递，所以不会通过我们的路径落入 history；但如果你自己把 secret 粘进一条原始 `curl` 命令里，谁也拦不住

## 故障排查

### 安装时出现 “PATH SHADOWING DETECTED”

有另一个 `gbrain` 二进制排在 PATH 中，比安装器刚刚链接进去的那个更靠前。安装器的版本检查发现了它。解决方式任选其一：

- `rm $(which gbrain)`，如果你不需要前面那个版本
- 在你的 shell rc 中把 `~/.bun/bin` 提到更前面，让刚安装的链接版本胜出
- 把 `GBRAIN_INSTALL_DIR` 设成那个产生 shadow 的安装目录，然后重新执行

然后重新运行 `/setup-gbrain`。

### “rejected direct-connection URL”

你粘贴的是一个 `db.<ref>.supabase.co:5432` 形式的 URL。这种直连地址是 IPv6-only，在大多数环境下都会失败。请改用 Session Pooler URL：Supabase dashboard → Settings → Database → Connection Pooler → **Session** → copy URI（端口 6543）。

### 自动创建在 180 秒时超时

Supabase 项目仍在初始化。退出提示里已经打印了你的 ref。等一分钟后执行：

```bash
/setup-gbrain --resume-provision <ref>
```

这个 skill 会重新收集一个 PAT，跳过项目创建，直接恢复轮询。

### “Another `/setup-gbrain` instance is running”

你可能遗留了一个过期锁目录。如果你确认没有别的实例真的在跑：

```bash
rm -rf ~/.gstack/.setup-gbrain.lock.d
```

然后重试即可。

### 策略文件上出现 “No cross-model tension”

你手动编辑过 `~/.gstack/gbrain-repo-policy.json`，而且里面还保留着旧版的 `allow` 值？没关系。gstack 下次读取时会自动把 `allow` 迁移成 `read-write`，并补上 `_schema_version: 2`。stderr 会打一行日志，过程幂等、确定。

### `gbrain doctor` 显示 “warnings”

`/health` 会把这视为黄色，而不是红色。执行 `gbrain doctor --json | jq .checks` 看看哪些子检查在 warning。典型原因包括：resolver 的 MECE 重叠（skill 名称相互冲突），或者数据库连接尚未配置完成。

### `/sync-gbrain` 显示 `OK`，但 `gbrain search` 没有任何语义结果

大概率是导入时 embeddings 失败了。符号查询（`code-def`、`code-refs`）仍然能工作，因为它们不依赖 embeddings；但 `gbrain search "<terms>"` 会退化到一个效果较差的 BM25 路径。请在 sync 输出里找类似这样的日志：

```bash
[gbrain] embedding failed for code file <name>: OpenAI embedding requires OPENAI_API_KEY
```

修复方式是在重跑前，把某个 provider 的 API key 放进进程环境里。对代码来说优先推荐 `VOYAGE_API_KEY`（只要存在，gstack 初始化 PGLite 时就会默认用 `voyage-code-3`）；否则会回退到 `OPENAI_API_KEY`，即 `text-embedding-3-large`。在一台裸 Mac shell 里，请先从 `~/.zshrc` source 出对应 key，再执行命令。在 Conductor 里，`lib/conductor-env-shim.ts` 会自动把 `GSTACK_ANTHROPIC_API_KEY` / `GSTACK_OPENAI_API_KEY` 提升成标准变量；至于 `VOYAGE_API_KEY`，你需要直接把它配置在 Conductor workspace env 里。然后执行 `/sync-gbrain --code-only`，为已经导入的页面回填 embeddings。

### `gbrain sync` 卡在某个 commit hash，上报 `FILE_TOO_LARGE`

你的代码树里有某个文件超过了 gbrain 的 5 MB 硬上限（`gbrain/src/core/import-file.ts` 中的 `MAX_FILE_SIZE`）。常见元凶包括：response replay cache、截图文件、大型 JSON fixture。Gbrain 不支持 `.gitignore` 风格的代码同步排除列表；当前唯一的调节手段是显式确认跳过这个失败：

```bash
gbrain sync --source <source-id> --skip-failed
```

watermark 会越过这个有问题的 commit 继续前进。如果这个同一个文件后来又变动了，它还会再次失败；那时你需要再次执行 skip。

### 从 PGLite 切到 Supabase 时卡住

另一个 gstack session，尤其是某个兄弟 Conductor workspace，可能正在通过 preamble 中的 `gstack-brain-sync` 调用持有你的本地 PGLite 文件锁。关闭其他 workspace，然后重新执行 `/setup-gbrain --switch`。timeout 被硬性限制在 180 秒，所以你永远不会真的无限等下去。

## 为什么这样设计

**为什么不是二元 allow / deny，而是 per-remote 的三元信任策略？** 因为多客户顾问需要“可搜索但不可回写”。一个自由开发者早上在做 Client A，下午在做 Client B，绝不能让 A 的代码经验泄漏进 B 也能搜索到的 brain 里。read-only 正好解决这个问题。

**为什么不把 gbrain 直接打包进 gstack？** 因为 gbrain 是一个独立、活跃开发中的项目，它有自己的发布节奏、schema migration 和 MCP surface。如果把它绑死在 gstack 里，gstack 就不得不替 gbrain 把关版本更新，这会拖慢 gbrain 的改进到达用户的速度。分离但深度集成，能让两者各自按自己的节奏发货。

**为什么用环境变量调用 `gbrain init --non-interactive`，而不是传 flag？** 因为连接串里包含数据库密码。只要你通过 argv 传递，它就会落到 `ps`、shell history 和进程列表里。通过环境变量交接，secret 只会待在进程内存中。Gbrain 同时支持 `GBRAIN_DATABASE_URL` 和 `DATABASE_URL`；我们选择前者，是为了避免和其他非 gbrain 工具发生碰撞。

**为什么对 PATH shadowing 直接 fail-hard，而不是仅仅 warning 然后继续？** 因为一旦 `gbrain` 被 shadow，后续所有命令调用的都会是另一个二进制，而不是我们刚刚安装的那个。这是一类沉默型版本漂移 bug，通常要到几周后你发现功能莫名缺失时才暴露。setup skill 的职责只有一个：把环境真正配置到可用状态。拒绝把东西装到一个已知错误的环境里，才是正确行为。

**为什么不自动导入你碰到的每个 repo？** 因为隐私和噪音。一个自动导入 preamble hook，如果它把你碰到的每个 repo 都 ingest 进去，会造成两件坏事：一是未经同意就把工作代码泄漏进共享 brain，二是把搜索结果塞满大量一次性、无价值的仓库。按 remote 配置策略，让导入成为一个明确的、逐仓库的决定。今天 `/setup-gbrain` 还不会安装任何 auto-import hook，但这个 policy store 已经为将来的扩展做了前向兼容。

## 相关技能与下一步

- `/health` —— 会把 GBrain 维度（doctor 状态、sync queue 深度、last-push age）纳入 0-10 的综合评分。如果机器上没装 gbrain，这个维度会被省略；在非 gbrain 机器上运行 `/health` 不会因此被扣分。
- `/gstack-upgrade` —— 负责让 gstack 自己保持最新。它**不会**独立升级 gbrain。gbrain 默认安装的是最新 HEAD；想升级它，请到你的 gbrain clone 目录（默认 `~/gbrain`）里执行 `git pull`，然后重新跑 `/setup-gbrain`。如果你需要可复现性，可以通过 `gstack-gbrain-install --pinned-commit <sha>` 固定到某个提交。低于最低测试版本的安装会被拒绝。
- `/retro` —— 每周复盘会在 memory sync 打开的情况下，从你的 gbrain 里提取 learnings 和 plans，让 retro 能引用跨机器历史。

运行 `/setup-gbrain`，看看哪些能力会真正留下来。
