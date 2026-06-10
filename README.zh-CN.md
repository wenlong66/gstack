# gstack

[English](README.md) | 简体中文

> “我大概从去年 12 月开始，基本就没怎么亲手敲过代码了，这真的是一个巨大的变化。” —— [Andrej Karpathy](https://fortune.com/2026/03/21/andrej-karpathy-openai-cofounder-ai-agents-coding-state-of-psychosis-openclaw/)，No Priors 播客，2026 年 3 月

听到 Karpathy 这么说之后，我就想弄清楚这到底是怎么做到的。一个人怎么才能像二十人的团队那样持续发货？Peter Steinberger 基本以单兵 + AI agent 的方式做出了 [OpenClaw](https://github.com/openclaw/openclaw)，拿下了 24.7 万 GitHub stars。革命已经到了。只要工具对，一个人就能比传统团队跑得更快。

我是 [Garry Tan](https://x.com/garrytan)，[Y Combinator](https://www.ycombinator.com/) 的总裁兼 CEO。我和几千家创业公司一起工作过，它们当时往往只有一两个人，在车库里起步，比如 Coinbase、Instacart、Rippling。加入 YC 之前，我曾是 Palantir 最早期的工程 / 产品 / 设计成员之一，后来联合创办了 Posterous（后被 Twitter 收购），也做过 YC 内部社交网络 Bookface。

**gstack 就是我的答案。** 我做产品已经二十年了，而现在是我发货速度最快的时候。过去 60 天里，我一边全职管理 YC，一边兼职做出了 3 个生产服务、40+ 个已上线功能。按“逻辑代码改动”而不是 AI 会放大的原始 LOC 计算，我在 2026 年的节奏大约是 **2013 年的 810×**（11,417 vs 14 逻辑行/天）。截至 4 月 18 日，2026 年年初至今的产出已经是 **2013 全年的 240×**。统计范围覆盖 40 个公开 + 私有的 `garrytan/*` 仓库，包括 Bookface，且排除了一个 demo 仓库。大部分代码都是 AI 写的。重点不在于是谁敲了键盘，而在于什么真正上线了。

> 觉得 LOC 被 AI 注水的人并没有错。错的是他们认为做了归一化之后，我的效率反而更低。并不是，我的效率高得多。完整方法、限制和复现脚本见：**[On the LOC Controversy](docs/ON_THE_LOC_CONTROVERSY.md)**。

**2026 年 —— 1,237 次贡献，还在增长：**

![GitHub contributions 2026 — 1,237 contributions, massive acceleration in Jan-Mar](docs/images/github-2026.png)

**2013 年 —— 我在 YC 做 Bookface 时（772 次贡献）：**

![GitHub contributions 2013 — 772 contributions building Bookface at YC](docs/images/github-2013.png)

同一个人，不同的时代。差别就在工具。

**gstack 就是我现在的工作方式。** 它把 Claude Code 变成一支虚拟工程团队：一个重新思考产品的 CEO、一个锁定架构的工程经理、一个专抓 AI 糊弄设计的设计师、一个寻找生产级 bug 的 reviewer、一个能打开真实浏览器的 QA 负责人、一个跑 OWASP + STRIDE 审计的安全官、一个真正把 PR 发出去的发布工程师。23 个专家角色，8 个强力工具，全是 slash command，全是 Markdown，全都免费，MIT 许可。

这是我的开源软件工厂。我每天都在用它。我把它分享出来，是因为这些工具应该人人可用。

Fork 它。改进它。把它变成你自己的。如果你就是想喷免费开源软件，也欢迎，但我更希望你先亲自试一下。

**这套东西适合谁：**
- **创始人和 CEO** —— 尤其是还想亲自下场发货的技术型创始人
- **第一次用 Claude Code 的人** —— 不想面对空白提示词，而是希望直接获得结构化角色
- **Tech lead 和 staff engineer** —— 想在每个 PR 上都跑严格评审、QA 和发布自动化

## 快速开始

1. 安装 gstack（30 秒，见下方）
2. 运行 `/office-hours`，描述你正在构建什么
3. 对任何功能想法运行 `/plan-ceo-review`
4. 对任何有改动的分支运行 `/review`
5. 对你的 staging URL 运行 `/qa`
6. 到这里先停下。你很快就会知道这套东西适不适合你。

## 安装，只要 30 秒

**要求：** [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Git](https://git-scm.com/)、[Bun](https://bun.sh/) v1.0+、[Node.js](https://nodejs.org/)（仅 Windows 需要）

### 第 1 步：安装到你的机器上

打开 Claude Code，把下面这段贴进去，剩下的 Claude 会自己做。

> Install gstack: run **`git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup`** then add a "gstack" section to CLAUDE.md that says to use the /browse skill from gstack for all web browsing, never use mcp__claude-in-chrome__* tools, and lists the available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate, /document-release, /document-generate, /codex, /cso, /autoplan, /plan-devex-review, /devex-review, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn. Then ask the user if they also want to add gstack to the current project so teammates get it.

### 第 2 步：团队模式，为共享仓库自动更新（推荐）

在你的仓库里执行下面这段。它会切到 team mode，初始化仓库，让队友自动拿到 gstack，并提交改动：

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required && git add .claude/ CLAUDE.md && git commit -m "require gstack for AI-assisted work"
```

你的仓库里不会塞进 vendored 文件，不会出现版本漂移，也不用手动升级。每次 Claude Code session 启动时都会做一次快速自动更新检查（最多每小时一次，对网络失败安全，而且完全静默）。

如果你想提醒队友但不强制，`required` 换成 `optional`。

### OpenClaw

OpenClaw 通过 ACP 拉起 Claude Code session，所以只要 Claude Code 已经装了 gstack，所有 gstack skill 都能直接工作。把下面这段贴给你的 OpenClaw agent：

> Install gstack: run `git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup` to install gstack for Claude Code. Then add a "Coding Tasks" section to AGENTS.md that says: when spawning Claude Code sessions for coding work, tell the session to use gstack skills. Include these examples — security audit: "Load gstack. Run /cso", code review: "Load gstack. Run /review", QA test a URL: "Load gstack. Run /qa https://...", build a feature end-to-end: "Load gstack. Run /autoplan, implement the plan, then run /ship", plan before building: "Load gstack. Run /office-hours then /autoplan. Save the plan, don't implement."

**装好之后，正常跟你的 OpenClaw agent 说话就行：**

| 你说 | 会发生什么 |
|------|------------|
| “Fix the typo in README” | 简单任务，直接拉起 Claude Code session，不需要 gstack |
| “Run a security audit on this repo” | 拉起 Claude Code，并执行 `Run /cso` |
| “Build me a notifications feature” | 拉起 Claude Code，走 /autoplan → implement → /ship |
| “Help me plan the v2 API redesign” | 拉起 Claude Code，走 /office-hours → /autoplan，并保存计划 |

高级路由和 gstack-lite / gstack-full 提示模板见 [docs/OPENCLAW.md](docs/OPENCLAW.md)。

### 原生 OpenClaw Skills（通过 ClawHub）

4 个可以直接运行在 OpenClaw agent 里的方法论技能，不需要额外拉 Claude Code session。通过 ClawHub 安装：

```
clawhub install gstack-openclaw-office-hours gstack-openclaw-ceo-review gstack-openclaw-investigate gstack-openclaw-retro
```

| Skill | 作用 |
|-------|------|
| `gstack-openclaw-office-hours` | 通过 6 个强制问题做产品拷问 |
| `gstack-openclaw-ceo-review` | 用 4 种 scope 模式做战略挑战 |
| `gstack-openclaw-investigate` | 根因排查方法论 |
| `gstack-openclaw-retro` | 每周工程复盘 |

这些都是对话式 skill，你的 OpenClaw agent 会直接在聊天里执行它们。

### 其他 AI Agent

gstack 不只支持 Claude，还能跑在 10 种 AI 编程 agent 上。`setup` 会自动检测你装了哪些：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack && ./setup
```

也可以通过 `./setup --host <name>` 指定目标 agent：

| Agent | Flag | Skills 安装目录 |
|-------|------|----------------|
| OpenAI Codex CLI | `--host codex` | `~/.codex/skills/gstack-*/` |
| OpenCode | `--host opencode` | `~/.config/opencode/skills/gstack-*/` |
| Cursor | `--host cursor` | `~/.cursor/skills/gstack-*/` |
| Factory Droid | `--host factory` | `~/.factory/skills/gstack-*/` |
| Slate | `--host slate` | `~/.slate/skills/gstack-*/` |
| Kiro | `--host kiro` | `~/.kiro/skills/gstack-*/` |
| Hermes | `--host hermes` | `~/.hermes/skills/gstack-*/` |
| GBrain (mod) | `--host gbrain` | `~/.gbrain/skills/gstack-*/` |

**想支持更多 agent？** 看 [docs/ADDING_A_HOST.md](docs/ADDING_A_HOST.md)。只要一个 TypeScript 配置文件，不需要改代码。

## 看看它怎么工作

```
你：    I want to build a daily briefing app for my calendar.
你：    /office-hours
Claude: [开始追问真实痛点，要具体例子，不接受泛泛而谈]

你：    Multiple Google calendars, events with stale info, wrong locations.
        Prep takes forever and the results aren't good enough...

Claude: 我先挑战一下你的 framing。你说的是“daily briefing app”，
        但你真正描述的，其实是一个 personal chief of staff AI。
        [提炼出 5 个你自己都没意识到的能力]
        [挑战 4 个前提，你可以同意、反对或调整]
        [给出 3 条实现路径，并附带工作量估算]
        RECOMMENDATION: 明天就先发最窄的 wedge，从真实使用中学习。
        完整愿景是一个 3 个月项目，先把真正能用的 daily briefing 做出来。
        [写出设计文档，并自动喂给后续技能]

你：    /plan-ceo-review
        [读取设计文档，挑战范围，跑一套 10 节评审]

你：    /plan-eng-review
        [用 ASCII 图解释数据流、状态机、错误路径]
        [给出测试矩阵、故障模式、安全问题]

你：    Approve plan. Exit plan mode.
        [跨 11 个文件写了 2400 行，大约 8 分钟]

你：    /review
        [AUTO-FIXED] 2 issues. [ASK] Race condition → 你批准修复。

你：    /qa https://staging.myapp.com
        [打开真实浏览器，点击真实流程，发现并修复一个 bug]

你：    /ship
        Tests: 42 → 51（+9 个新测试）。PR: github.com/you/app/pull/42
```

你说的是“daily briefing app”，agent 回你的是“你其实在做一个 chief of staff AI”，因为它听的是你的痛点，而不是你的功能描述。8 个命令，一条龙到底。这不是 copilot，这是一个团队。

## 一次 sprint 的完整流程

gstack 不是一堆工具的堆砌，而是一整套流程。技能顺序和 sprint 顺序一致：

**Think → Plan → Build → Review → Test → Ship → Reflect**

每个 skill 都会把产物交给下一个。`/office-hours` 写出设计文档，由 `/plan-ceo-review` 读取；`/plan-eng-review` 写出测试计划，由 `/qa` 接上；`/review` 找出 bug，再由 `/ship` 验证是否修复。因为每一步都知道上一步做了什么，所以不会漏。

| Skill | 你的专家角色 | 它会做什么 |
|-------|-------------|------------|
| `/office-hours` | **YC Office Hours** | 从这里开始。6 个强制问题，在你写代码之前重新定义产品。会挑战你的 framing、质疑前提、生成实现路径。设计文档会流入所有下游技能。 |
| `/plan-ceo-review` | **CEO / Founder** | 重新定义问题。挖出需求里隐藏的 10 星产品。四种模式：Expansion、Selective Expansion、Hold Scope、Reduction。 |
| `/plan-eng-review` | **Eng Manager** | 锁定架构、数据流、图、边界情况和测试。把隐藏假设强行拉到明面上。 |
| `/plan-design-review` | **Senior Designer** | 按设计维度 0-10 打分，解释什么才算 10 分，然后直接修改计划把它拉上去。专抓 AI Slop。交互式，每个设计决策只问一个 AskUserQuestion。 |
| `/plan-devex-review` | **Developer Experience Lead** | 交互式 DX 评审：分析开发者画像，和竞品比较 TTHW，设计 magical moment，逐步追踪摩擦点。三种模式：DX EXPANSION、DX POLISH、DX TRIAGE。20-45 个强制问题。 |
| `/design-consultation` | **Design Partner** | 从零搭建一整套设计系统。调研行业、提出大胆创意、生成真实感产品 mockup。 |
| `/review` | **Staff Engineer** | 找出那些能过 CI、但会上线炸掉的 bug。显而易见的会自动修。还会指出完整性缺口。 |
| `/investigate` | **Debugger** | 系统化根因排查。铁律是：不先调查，就不允许修。它会追数据流、测假设，连续 3 次修不对就停。 |
| `/design-review` | **Designer Who Codes** | 用和 /plan-design-review 相同的标准审设计，然后直接修。原子提交，带 before/after 截图。 |
| `/devex-review` | **DX Tester** | 实测开发者体验。真的去走 onboarding，看 getting started 流程、计时 TTHW、截图错误，再和 `/plan-devex-review` 的评分对照，看你的计划和现实到底差在哪。 |
| `/design-shotgun` | **Design Explorer** | “给我几个方案看看。” 生成 4-6 个 AI mockup 变体，在浏览器里打开对比板，收集你的反馈并继续迭代。Taste memory 会记住你的偏好。直到你真心喜欢，再把结果交给 `/design-html`。 |
| `/design-html` | **Design Engineer** | 把 mockup 变成真的、可上线的 HTML。用 Pretext 做计算布局，文字会重排、高度会自适应、布局是动态的。30KB、零依赖。自动识别 React / Svelte / Vue。按设计类型智能路由 API。输出不是 demo，而是可以发货的东西。 |
| `/qa` | **QA Lead** | 测试你的应用，找 bug，用原子提交修掉，再重新验证。每个修复都会自动生成回归测试。 |
| `/qa-only` | **QA Reporter** | 和 /qa 同样的方法，但只出报告，不改代码。 |
| `/pair-agent` | **Multi-Agent Coordinator** | 把你的浏览器共享给任意 AI agent。一个命令，一段复制粘贴，就连上。兼容 OpenClaw、Hermes、Codex、Cursor，或者任何能 curl 的 agent。每个 agent 都有自己的标签页。会自动启用 headed 模式，让你看见一切。还会自动拉 ngrok 供远端 agent 使用。带作用域 token、tab 隔离、限速和行为归因。 |
| `/cso` | **Chief Security Officer** | 跑 OWASP Top 10 + STRIDE threat model。低噪声：17 条误报排除、8/10+ 置信门槛、独立 finding 验证。每个 finding 都会附具体 exploit 场景。 |
| `/ship` | **Release Engineer** | 同步 main、跑测试、审覆盖率、推送、开 PR。即使你还没有测试框架，它也会帮你 bootstrap。 |
| `/land-and-deploy` | **Release Engineer** | 合并 PR、等 CI 和部署完成、再验证生产健康。一个命令，从“已批准”走到“生产已确认”。 |
| `/canary` | **SRE** | 上线后的监控循环，盯 console error、性能回退和页面故障。 |
| `/benchmark` | **Performance Engineer** | 基准化页面加载时间、Core Web Vitals 和资源体积。每个 PR 都能做前后对比。 |
| `/document-release` | **Technical Writer** | 更新项目文档，让它们和最新发货内容一致。会自动抓出过期 README。还能构建 Diataxis coverage map（reference / how-to / tutorial / explanation），方便你在 PR 里看到缺口。 |
| `/document-generate` | **Documentation Author** | 从零生成缺失文档，用的是 Diataxis 框架。先研究代码库，再生成 reference / how-to / tutorial / explanation，并确保内容和代码一致。可以单独调用，也可以由 `/document-release` 在发现缺口后串起来调用。更多说明：[tutorial](docs/tutorial-document-generate.md) • [how-to](docs/howto-document-a-shipped-feature.md) • [why Diataxis](docs/explanation-diataxis-in-gstack.md)。 |
| `/retro` | **Eng Manager** | 支持团队视角的每周复盘。按人拆分、统计发货 streak、追踪测试健康趋势、找成长机会。`/retro global` 能跨所有项目和 AI 工具（Claude Code、Codex、Gemini）跑全局复盘。 |
| `/browse` | **QA Engineer** | 给 agent 装上眼睛。真实 Chromium、真实点击、真实截图，每个命令大约 100ms。`/open-gstack-browser` 会启动带侧栏、反反爬和自动模型路由的 GStack Browser。 |
| `/setup-browser-cookies` | **Session Manager** | 把你真实浏览器（Chrome、Arc、Brave、Edge）的 cookies 导入到 headless session，方便测试登录态页面。 |
| `/autoplan` | **Review Pipeline** | 一个命令拿到完整评审过的计划。会自动跑 CEO → design → eng review，并把决策原则编码进去。只把真正需要你拍板的 taste 决策抛给你。 |
| `/spec` | **Spec Author** | 把模糊意图变成可执行 spec，分五阶段：why、scope、technical（必须读代码）、draft、file。带 Codex 质量门槛（低于 7/10 不让写入）、失败即关闭的 secret redaction、现有 issue 去重，并把结果归档到 `$GSTACK_STATE_ROOT/projects/$SLUG/specs/`，方便团队后续检索。`--execute` 会在全新 worktree 里拉起 `claude -p`；`/ship` 合并后会自动关闭源 issue。兼容 plan mode。 |
| `/learn` | **Memory** | 管理 gstack 在多 session 中学到的东西。可以查看、搜索、清理、导出项目级模式、坑点和偏好。学到的内容会跨 session 复利。 |

### 我该用哪种 review？

| 你构建的是… | 计划阶段（写代码前） | 线上审计（发货后） |
|---------------|----------------------|----------------------|
| **面向终端用户**（UI、Web app、移动端） | `/plan-design-review` | `/design-review` |
| **面向开发者**（API、CLI、SDK、文档） | `/plan-devex-review` | `/devex-review` |
| **偏架构问题**（数据流、性能、测试） | `/plan-eng-review` | `/review` |
| **以上全都涉及** | `/autoplan`（自动跑 CEO → design → eng → DX，并自动判断哪些适用） | — |

### 强力工具

| Skill | 作用 |
|-------|------|
| `/codex` | **Second Opinion**，从 OpenAI Codex CLI 拿一个独立代码评审。三种模式：review（通过 / 不通过门槛）、adversarial challenge、open consultation。若 `/review` 和 `/codex` 都跑过，还会给你一份跨模型对比分析。 |
| `/careful` | **Safety Guardrails**，在 destructive command（rm -rf、DROP TABLE、force-push）前提醒你。说一句 “be careful” 就能激活，可手动覆盖。 |
| `/freeze` | **Edit Lock**，把编辑范围锁在一个目录里，避免调试时顺手改到别处。 |
| `/guard` | **Full Safety**，等于 `/careful` + `/freeze` 的组合。适合做生产环境工作。 |
| `/unfreeze` | **Unlock**，移除 `/freeze` 的边界。 |
| `/open-gstack-browser` | **GStack Browser**，启动带侧栏、反反爬、自动模型路由（Sonnet 做动作，Opus 做分析）、一键导入 cookies、并和 Claude Code 集成的浏览器。可清理页面、做智能截图、改 CSS，并把信息回传终端。 |
| `/setup-deploy` | **Deploy Configurator**，给 `/land-and-deploy` 做一次性配置。自动识别你的平台、生产 URL 和部署命令。 |
| `/setup-gbrain` | **GBrain Onboarding**，5 分钟内把 gbrain 从零配到可用。支持本地 PGLite、已有 Supabase URL，或直接通过 Management API 自动新建 Supabase 项目。还会给 Claude Code 注册 MCP，并按仓库设置读写 / 只读 / 拒绝三段式信任策略。[完整说明](USING_GBRAIN_WITH_GSTACK.md)。 |
| `/sync-gbrain` | **Keep Brain Current**，通过 `gbrain sources add` + `gbrain sync --strategy code` 给当前仓库重新索引，并刷新 CLAUDE.md 中的 `## GBrain Search Guidance` 区块。支持 `--incremental`（默认）、`--full`、`--dry-run`。幂等，可重复运行。 |
| `/gstack-upgrade` | **Self-Updater**，升级 gstack 到最新版本。自动识别是全局安装还是 vendored 安装，并同步二者，顺便展示改了什么。 |
| `/ios-qa` | **iOS Live-Device QA（v1.43.0.0+）**，通过 USB CoreDevice 驱动一台真实 iPhone，并在应用中嵌入 `StateServer`。能读 Swift 源码、生成类型安全的 `@Observable` accessor，并跑 agent loop。可选 `--tailnet`，让 OpenClaw 或任何支持 HTTP 的 agent 通过 Tailscale 调用这台设备做远程 iOS QA。带能力分层 allowlist、设备级 session 锁和审计日志。 |
| `/ios-fix`、`/ios-design-review`、`/ios-clean`、`/ios-sync` | iOS bug 修复循环、设计师视角 HIG 审核、debug bridge 清理和 accessor 重同步。见 `docs/skills.md`。完整 walkthrough 见 [docs/howto-ios-testing-with-gstack.md](docs/howto-ios-testing-with-gstack.md)。 |

### 新增二进制工具（v0.19）

除了 slash command，gstack 还附带一些更适合脱离 session 独立运行的 CLI：

| Command | 作用 |
|---------|------|
| `gstack-model-benchmark` | **跨模型基准测试**，把同一个 prompt 同时跑给 Claude、GPT（通过 Codex CLI）和 Gemini，对比延迟、token、成本，和可选的 LLM-judge 质量评分。每个 provider 自动探测鉴权，没配置的会优雅跳过。输出支持 table、JSON 或 markdown。`--dry-run` 可以在不花 API 调用的前提下校验 flag 和 auth。 |
| `gstack-taste-update` | **设计偏好学习**，把 `/design-shotgun` 中的通过 / 否决结果写入一个持久化的项目级 taste profile，每周衰减 5%。后续变体生成会参考这个 profile，逐步学会你的审美。 |
| `gstack-ios-qa-daemon` | **iOS QA daemon**，运行在 Mac 端，在 agent 和 USB CoreDevice 连接的 iPhone 之间充当 broker。默认 loopback，`--tailnet` 可打开一个面向 Tailscale 的监听，并按身份做能力分层。单实例通过 `~/.gstack/ios-qa-daemon.pid` flock 保证。详见 [docs/howto-ios-testing-with-gstack.md](docs/howto-ios-testing-with-gstack.md)。 |
| `gstack-ios-qa-mint` | **iOS allowlist 管理器**，给 tailnet allowlist 做 owner 授权。支持对 `~/.gstack/ios-qa-allowlist.json`（0600）执行 `grant` / `revoke` / `list`。远端 agent 永远不会自动放行，这条路径必须显式授权。 |

### 持续 checkpoint 模式（可选，默认只在本地）

执行 `gstack-config set checkpoint_mode continuous` 后，skills 会在你工作过程中自动提交，commit 前缀是 `WIP:`，正文带结构化 `[gstack-context]` 信息（决策、剩余工作、失败尝试）。这样即使 crash 或中断 session，也能恢复。`/context-restore` 会读取这些提交并重建上下文。`/ship` 在发 PR 前会 filter-squash 掉这些 WIP commit（保留非 WIP commit），因此 bisect 依然干净。推送默认关闭，只有设 `checkpoint_push=true` 才会推，这样不会每个 WIP commit 都触发 CI。

### 领域技能 + 原始 CDP 逃生口

两个新的浏览器原语会让 gstack agent 越跑越懂：

- **`$B domain-skill save`**，保存站点级笔记，例如“LinkedIn 的 Apply 按钮在 iframe 里”，以后再次访问这个 hostname 时会自动触发。状态从 quarantined 开始，成功 3 次后进入 active，还可以通过 `$B domain-skill promote-to-global` 提升为跨项目规则。存储位置和 `/learn` 的项目学习文件同目录。完整文档：**[docs/domain-skills.md](docs/domain-skills.md)**。
- **`$B cdp <Domain.method>`**，给浏览器原生命令留一个少见场景下的逃生口。默认拒绝，只有显式加到 `browse/src/cdp-allowlist.ts` 并写上一句理由的方法才能调用。两层 mutex 会把 browser-scope 的 CDP 调用和 per-tab 工作串行化。对可能导出数据的方法，输出会自动包上 UNTRUSTED envelope。

> 如果你想要的是彻底不设防、不走 allowlist、不跑 daemon，只做 agent 到 Chrome 的薄传输层，那么 [browser-use/browser-harness-js](https://github.com/browser-use/browser-harness-js) 这类哲学更适合你。gstack 走的是 curated commands + security stack，这两者也可以共存，gstack 的 `$B cdp` 和 harness 都能通过 Playwright 的 `newCDPSession` 连接同一个 Chrome。

**[每个 skill 的深入原理、示例和设计哲学 →](docs/skills.md)**

### Karpathy 提到的四种失败模式？这里都覆盖了。

Andrej Karpathy 的 [AI coding rules](https://github.com/forrestchang/andrej-karpathy-skills)（1.7 万 stars）非常准确地指出了四种常见失败模式：错误假设、过度复杂、无关改动、命令式胜过声明式。gstack 的工作流技能把这四类问题都编进流程里。`/office-hours` 会在写代码前把假设挖出来；Confusion Protocol 阻止 Claude 在架构决策上瞎猜；`/review` 会抓不必要的复杂性和顺手乱改；`/ship` 会把任务转成可验证目标，并坚持 test-first 执行。如果你已经在用 Karpathy 风格的 CLAUDE.md 规则，那么 gstack 就是把这些规则从“单个 prompt 的注意事项”升级为“整条 sprint 的执行系统”。

## 并行 sprint

gstack 单跑一条 sprint 就已经很好用。十条同时跑的时候，它才真正有意思。

**设计是核心。** `/design-consultation` 会从零搭你的设计系统，研究现有方案、提出有风险但可能很好的方向，并写出 `DESIGN.md`。但真正魔法般的地方，是 shotgun-to-HTML 这一整条链。

**`/design-shotgun` 负责探索。** 你描述需求，它用 GPT Image 生成 4-6 个 mockup 变体，然后在浏览器里打开对比板，把所有方案并排给你看。你挑喜欢的，给反馈，比如“多一点留白”“标题更粗”“不要渐变”，然后它再生成下一轮。一直到你真心喜欢为止。几轮之后，taste memory 会记住你的偏好，所以生成结果会越来越像你真正会选的方案。不再是“用语言描述想象中的界面，祈祷 AI 猜中”，而是“直接看方案，挑好的，快速迭代”。

**`/design-html` 负责落地。** 把已经确认的 mockup（来自 `/design-shotgun`、CEO 计划、设计评审，或者单纯的自然语言描述）转换成真正可上线的 HTML/CSS。不是那种“某个视口看着还行，换尺寸立刻坏掉”的 AI HTML。这里用的是 Pretext 做计算文本布局，文本会随窗口重排，高度随内容变化，布局是真动态的。30KB 开销，零依赖。它会自动识别你的框架（React、Svelte、Vue），输出对应格式。根据页面类型（落地页、dashboard、表单、卡片布局）智能选择不同的 Pretext 模式。出来的是能发货的产物，不是 demo。

**`/qa` 是一个巨大的解锁器。** 它让我能把并行 worker 从 6 个提到 12 个。Claude Code 说出 *“I SEE THE ISSUE”*，然后真的去修，补回归测试，再验证修复，这种工作方式改变了一切。agent 现在是有眼睛的。

**智能 review 路由。** 就像一支运转良好的创业团队一样：CEO 不需要看 infra bug fix，设计评审也不该跑到纯后端改动上。gstack 会追踪已经跑过哪些评审，判断哪些才适用，然后自动做聪明的事。Review Readiness Dashboard 会在你发货前告诉你当前处在哪个状态。

**凡事都测。** `/ship` 会在你项目还没有测试框架时直接从零 bootstrap。每次 `/ship` 都会产出 coverage audit。每次 `/qa` 修 bug 都会补一个回归测试。目标是 100% test coverage，测试让 vibe coding 变成安全的，而不是 yolo coding。

**`/document-release` 是你一直缺的那位工程师。** 它会读遍项目里的每份文档，对照 diff，把已经漂移的地方全改回来。README、ARCHITECTURE、CONTRIBUTING、CLAUDE.md、TODOS，全部自动保持同步。而且现在 `/ship` 会自动调用它，所以文档更新不再需要额外命令。

**真实浏览器模式。** `/open-gstack-browser` 会启动 GStack Browser，一个由 AI 控制的 Chromium，内置反反爬、定制品牌和侧栏扩展。像 Google、NYTimes 这类站点也能正常工作，不用跟 CAPTCHA 打架。菜单栏会显示 “GStack Browser”，而不是 “Chrome for Testing”。你的日常 Chrome 完全不受影响。所有已有 browse 命令都不用改。`$B disconnect` 会回到 headless 模式。只要窗口开着，浏览器就会一直活着，不会因为 idle timeout 在你工作时被杀掉。

**Sidebar agent，就是你的 AI 浏览器助手。** 在 Chrome 侧栏里直接输入自然语言，一个子 Claude 实例会替你执行。“去设置页然后截图。”“填这张表，用测试数据。”“把这个列表里每个项目的价格都提出来。” 侧栏会自动选模型：点击、跳转、截图这类快动作用 Sonnet，阅读分析用 Opus。每个任务最多 5 分钟。侧栏 agent 跑在隔离 session 里，不会干扰你的主 Claude Code 窗口。侧栏底部还支持一键导入 cookies。

**个人自动化也很好用。** 侧栏 agent 不只是给开发流程用。比如：“去我孩子学校家长门户，把所有其他家长的姓名、电话和头像加到我的 Google Contacts。” 登录态有两条路：1）在 headed 浏览器里手动登录一次，session 会保留；2）点击侧栏底部的 cookies 按钮，从你的真实 Chrome 导入 cookies。认证完成后，Claude 会自己浏览目录、提取数据、创建联系人。

**Prompt injection 防线。** 恶意网页会试图劫持你的 sidebar agent。gstack 提供分层防御：浏览器里内置一个 22MB 的本地 ML classifier，扫描每一页和每一段工具输出；Claude Haiku 再从整段对话结构做一次投票；system prompt 里放一个随机 canary token，用来抓跨文本、工具参数、URL 和文件写入的 session 外泄尝试；最后 verdict combiner 要求两个分类器都同意才 block，这样能减少 Stack Overflow 这类 instruction 页面上的单模型误报。侧栏头部的盾牌图标会显示状态（绿 / 黄 / 红）。如果你愿意再加一层，可以通过 `GSTACK_SECURITY_ENSEMBLE=deberta` 启用 721MB 的 DeBERTa-v3 ensemble，要求 2-of-3 同意。紧急开关是 `GSTACK_SECURITY_OFF=1`。完整说明见 [ARCHITECTURE.md](ARCHITECTURE.md#prompt-injection-defense-sidebar-agent)。

**AI 卡住时的人类接管。** 遇到验证码、认证墙、MFA 提示？执行 `$B handoff`，它会在可见 Chrome 里打开完全相同的页面，并保留所有 cookies 和 tabs。你自己把这一步搞定，然后告诉 Claude 继续，执行 `$B resume` 就能从中断位置接上。连续 3 次失败后，agent 还会主动建议你这么做。

**`/pair-agent` 是跨 agent 协同。** 你在 Claude Code 里，同时还开着 OpenClaw，或者 Hermes，或者 Codex。你希望它们一起看同一个网站。输入 `/pair-agent`，选好 agent，GStack Browser 就会打开，让你实时观看。这个 skill 会打印一大段说明，你把它贴到另一个 agent 的聊天里。对方会把一次性 setup key 换成 session token，拿到自己的 tab，然后开始浏览。你会看到两个 agent 在同一个浏览器里工作，各占一个标签页，彼此不能干扰。如果机器上装了 ngrok，隧道会自动起来，所以另一个 agent 甚至可以在别的机器上。对同机 agent 还有零摩擦 shortcut，可以直接写入凭据。这是第一次，不同厂商的 AI agent 可以通过一个共享浏览器协同工作，而且安全边界是真实存在的：作用域 token、tab 隔离、速率限制、域名限制和行为归因。

**多模型第二意见。** `/codex` 会从 OpenAI 的 Codex CLI 拿一个独立评审，也就是完全不同的 AI 看同一份 diff。三种模式：带通过 / 失败门槛的 code review、主动想办法把代码搞坏的 adversarial challenge，以及保留会话连续性的 open consultation。如果 `/review`（Claude）和 `/codex`（OpenAI）都看过同一个分支，你会得到一份跨模型分析，告诉你哪些 finding 重叠，哪些是各自独有。

**按需开启的安全护栏。** 只要说一句 “be careful”，`/careful` 就会在 destructive command 之前提醒你，比如 rm -rf、DROP TABLE、force-push、git reset --hard。`/freeze` 能在调试时把可编辑范围锁到一个目录，防止 Claude “顺手”修别的地方。`/guard` 会同时打开两者。`/investigate` 在排查问题时会自动加 freeze。

**主动技能建议。** gstack 会判断你现在处在哪个阶段，是在 brainstorm、review、debug 还是 testing，然后建议你运行合适的 skill。不喜欢？直接说 “stop suggesting”，它会跨 session 记住。

## 10-15 条并行 sprint

gstack 在单条 sprint 下已经很强，而在 10 条同时运行时，它会发生质变。

[Conductor](https://conductor.build) 能并行运行多个 Claude Code session，每个都在隔离 workspace 里。一个 session 用 `/office-hours` 探索新想法，另一个在 PR 上跑 `/review`，第三个实现功能，第四个在 staging 上跑 `/qa`，剩下六个在其他分支上继续推进。一切同时发生。我现在经常同时跑 10-15 条并行 sprint，这已经是当下比较实际的上限了。

真正让并行成立的是 sprint 结构本身。没有流程，十个 agent 就是十个混乱源。有了流程，think、plan、build、review、test、ship，每个 agent 都知道自己该做什么，也知道什么时候该停。你管理它们的方式，就像 CEO 管团队：关键决策你来过目，剩下的放手让它们跑。

### 语音输入（AquaVoice、Whisper 等）

gstack skills 都有适合语音触发的短语。你可以自然地说：“run a security check”“test the website”“do an engineering review”，系统会自动触发合适的 skill。你不需要死记 slash command 名字或缩写。

## 卸载

### 方案 1：运行卸载脚本

如果你的机器上已经装了 gstack：

```bash
~/.claude/skills/gstack/bin/gstack-uninstall
```

它会清理 skills、symlink、全局状态（`~/.gstack/`）、项目本地状态、browse daemon 和临时文件。用 `--keep-state` 可以保留配置和分析数据，用 `--force` 可以跳过确认。

### 方案 2：手动移除（本地仓库已不在时）

如果你已经删掉了本地 clone，例如当初是通过 Claude Code 粘贴命令安装的：

```bash
# 1. 停掉 browse daemons
pkill -f "gstack.*browse" 2>/dev/null || true

# 2. 删除那些 SKILL.md 指向 gstack/ 的 per-skill 目录
find ~/.claude/skills -mindepth 1 -maxdepth 1 -type d ! -name gstack 2>/dev/null |
while IFS= read -r dir; do
  link="$dir/SKILL.md"
  [ -L "$link" ] || continue
  target=$(readlink "$link" 2>/dev/null) || continue
  case "$target" in
    gstack/*|*/gstack/*)
      rm -f "$link"
      rmdir "$dir" 2>/dev/null || true
      ;;
  esac
done

# 3. 删除 gstack
rm -rf ~/.claude/skills/gstack

# 4. 删除全局状态
rm -rf ~/.gstack

# 5. 删除各类集成（没装过的可以跳过）
rm -rf ~/.codex/skills/gstack* 2>/dev/null
rm -rf ~/.factory/skills/gstack* 2>/dev/null
rm -rf ~/.kiro/skills/gstack* 2>/dev/null
rm -rf ~/.openclaw/skills/gstack* 2>/dev/null

# 6. 删除临时文件
rm -f /tmp/gstack-* 2>/dev/null

# 7. 项目级清理（在每个项目根目录执行）
rm -rf .gstack .gstack-worktrees .claude/skills/gstack 2>/dev/null
rm -rf .agents/skills/gstack* .factory/skills/gstack* 2>/dev/null
```

### 清理 CLAUDE.md

卸载脚本不会改你的 `CLAUDE.md`。对于每个启用了 gstack 的项目，请手动删除其中的 `## gstack` 和 `## Skill routing` 两个区块。

### Playwright

`~/Library/Caches/ms-playwright/`（macOS）会被保留，因为其他工具也可能共用它。如果确认别的工具不需要，再手动删。

---

免费、MIT 许可、开源。没有 premium tier，没有 waitlist。

我把自己构建软件的方式开源出来了。你可以 fork 它，把它变成你自己的。

> **我们在招人。** 如果你想用 AI coding 的速度发真正的产品，也想一起把 gstack 打磨得更硬，
> 来 YC 吧 —— [ycombinator.com/software](https://ycombinator.com/software)
> 薪资和股权都非常有竞争力，地点在旧金山 Dogpatch District。

## GBrain，给你的编码 agent 提供持久知识

[GBrain](https://github.com/garrytan/gbrain) 是 AI agent 的持久知识库，你可以把它理解成“agent 真正能在 session 之间保留下来的记忆”。GStack 给你提供的是一条从零到“已经跑起来，我的 agent 现在能用了”的一键路径。

```bash
/setup-gbrain
```

一共有四条路，任选其一：

- **Supabase，已有 URL**，你的云端 agent 已经配好一个 brain，直接把 Session Pooler URL 粘过来，这台电脑就会接上同一份数据。
- **Supabase，自动创建**，粘一个 Supabase Personal Access Token，skill 会自动新建项目、轮询到 healthy、拿到 pooler URL，再交给 `gbrain init`，全流程大约 90 秒。
- **PGLite 本地模式**，零账号、零联网，大约 30 秒。brain 只存在这台机器上，很适合先试试，后面再用 `/setup-gbrain --switch` 迁到 Supabase。
- **远程 gbrain MCP**，你的 brain 跑在另一台机器上（Tailscale、ngrok、内网，或队友的服务器），你只要粘一个 MCP URL 和 bearer token。也可以搭配本地 PGLite 做 split-engine mode，拿到 symbol-aware code search。特别适合跨机器共享记忆，但又不想本地起 DB。

初始化之后，skill 会询问是否把 gbrain 注册成 Claude Code 的 MCP server（`claude mcp add gbrain -- gbrain serve`），这样 `gbrain search`、`gbrain put` 等能力就会以一等 typed tools 的形式出现，而不是靠 bash shell-out。

**如何让 brain 跟上代码变化。** 在任何仓库里运行 `/sync-gbrain`，就能把代码重新索引进 gbrain（默认 incremental，`--full` 做全量重建，`--dry-run` 只预览）。这个 skill 会用 `gbrain sources add` 把当前 cwd 注册成 federated source，再执行 `gbrain sync --strategy code`，并把 `## GBrain Search Guidance` 区块写进项目的 `CLAUDE.md`，让 agent 更倾向于用 `gbrain search` / `code-def` / `code-refs`，而不是 Grep。如果能力检查失败，这个区块还会被自动移除，不会留下指向不存在工具的过期提示。

**按远程仓库区分信任等级。** 你机器上的每个 repo 都有三档策略：

- `read-write`，agent 可以搜索 brain，也能把新页面写回去
- `read-only`，agent 只能搜，不能写（非常适合服务多个客户的顾问，能读取共享 brain，但不会把 Client A 的内容污染到 Client B 的 repo 里）
- `deny`，彻底不允许与 gbrain 交互

每个 repo 只问一次，这个决定会跨同一 remote 的所有 worktree 和分支持续生效。

**GStack memory sync（另一项功能，但复用同一套私有仓库基础设施）。** 可选地把你的 gstack 状态（learnings、CEO plans、design docs、retros、developer profile）同步到一个私有 git 仓库，让你的记忆跨机器跟随你。第一次会问一个隐私选择（全部 allowlisted / 仅 artifacts / 关闭），并有一层防御性 secret scanner，在数据离开你机器前拦住 AWS key、token、PEM block 和 JWT。

```bash
gstack-brain-init
```

**如果你在 Conductor 里跑 gstack。** Conductor 会显式从每个 workspace 的进程环境中移除 `ANTHROPIC_API_KEY` 和 `OPENAI_API_KEY`，因此 paid eval 和 gbrain embedding 默认不会工作。请改为在 Conductor 的 workspace env 配置里设置 `GSTACK_ANTHROPIC_API_KEY` 和 `GSTACK_OPENAI_API_KEY`，gstack 的 TypeScript 入口会在运行时把它们提升为标准环境变量。完整说明和给新入口补 import 的 contributor checklist 见：[Conductor + GSTACK_* env vars](USING_GBRAIN_WITH_GSTACK.md#conductor--gstack_-env-vars)。

**完整版，包括所有场景、flag、bin helper 和排障步骤：** [USING_GBRAIN_WITH_GSTACK.md](USING_GBRAIN_WITH_GSTACK.md)

其他参考： [docs/gbrain-sync.md](docs/gbrain-sync.md)（同步专用指南） • [docs/gbrain-sync-errors.md](docs/gbrain-sync-errors.md)（错误索引）

## 文档

| 文档 | 覆盖内容 |
|------|----------|
| [Skill Deep Dives](docs/skills.md) | 每个 skill 的哲学、示例和工作流（包含 Greptile 集成） |
| [Builder Ethos](ETHOS.md) | Builder 哲学：Boil the Lake、Search Before Building、三层知识模型 |
| [Using GBrain with GStack](USING_GBRAIN_WITH_GSTACK.md) | `/setup-gbrain` 的所有路径、flag、bin helper 和排障步骤 |
| [GBrain Sync](docs/gbrain-sync.md) | 跨机器记忆设置、隐私模式、故障排查 |
| [Architecture](ARCHITECTURE.md) | 设计决策与系统内部原理 |
| [Browser Reference](BROWSER.md) | `/browse` 的完整命令参考 |
| [Contributing](CONTRIBUTING.md) | 开发环境、测试、contributor mode 和 dev mode |
| [Changelog](CHANGELOG.md) | 每个版本有什么新变化 |

## 隐私与遥测

gstack 带有**可选启用**的使用遥测，用来帮助改进项目。具体行为完全透明：

- **默认关闭。** 除非你明确同意，否则什么都不会发送。
- **首次运行时，** gstack 会询问你是否愿意分享匿名使用数据。你可以直接拒绝。
- **如果启用，会发送什么：** skill 名称、执行时长、成功 / 失败、gstack 版本、操作系统。仅此而已。
- **绝不会发送什么：** 代码、文件路径、repo 名称、分支名称、prompt 或任何用户生成内容。
- **随时关闭：** 执行 `gstack-config set telemetry off`，会立刻彻底关闭。

数据存储在 [Supabase](https://supabase.com)（开源的 Firebase 替代品）上。数据库 schema 在 [`supabase/migrations/`](supabase/migrations/) 中，你可以亲自核对到底收集了什么。仓库里的 Supabase publishable key 是公开 key，和 Firebase API key 一类，真正的直接访问会被 row-level security policy 拦住。遥测会经过带校验的 edge function，负责 schema 检查、事件类型 allowlist 和字段长度限制。

**本地分析永远可用。** 执行 `gstack-analytics`，你就能从本地 JSONL 文件看到自己的使用仪表盘，不需要任何远端数据。

## 故障排查

**Skill 没显示出来？** `cd ~/.claude/skills/gstack && ./setup`

**`/browse` 失败？** `cd ~/.claude/skills/gstack && bun install && bun run build`

**安装旧了？** 运行 `/gstack-upgrade`，或者在 `~/.gstack/config.yaml` 里设 `auto_upgrade: true`

**想用更短的命令？** `cd ~/.claude/skills/gstack && ./setup --no-prefix`，会把 `/gstack-qa` 切成 `/qa`。你的选择会被记住，用于后续升级。

**想用带命名空间的命令？** `cd ~/.claude/skills/gstack && ./setup --prefix`，会把 `/qa` 切成 `/gstack-qa`。如果你并行使用多个 skill pack，这会更合适。

**Codex 提示 “Skipped loading skill(s) due to invalid SKILL.md)”？** 你的 Codex skill 描述过期了。修复方式：`cd ~/.codex/skills/gstack && git pull && ./setup --host codex`。如果是 repo-local 安装，则执行：`cd "$(readlink -f .agents/skills/gstack)" && git pull && ./setup --host codex`

**Windows 用户：** gstack 可在 Windows 11 上通过 Git Bash 或 WSL 运行。除 Bun 外还需要 Node.js，因为 Bun 在 Windows 上对 Playwright pipe transport 有已知问题（[bun#4253](https://github.com/oven-sh/bun/issues/4253)）。browse server 会自动 fallback 到 Node.js。请确保 `bun` 和 `node` 都在 PATH 中。

在没有启用 Developer Mode 的 Windows（MSYS2 / Git Bash）里，`setup` 会使用文件复制而不是 symlink，因为 `ln -snf` 会生成不会随 `git pull` 刷新的冻结副本。**每次 `git pull` 之后都请重新执行 `cd ~/.claude/skills/gstack && ./setup`**，确保 skill 文件和仓库一致。`setup` 会打印一条简短提醒。Unix 和 WSL 使用 symlink，不需要这一步。

**Claude 说它看不到这些 skills？** 确保项目的 `CLAUDE.md` 里有一段 gstack 配置。可直接加上：

```
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze,
/guard, /unfreeze, /gstack-upgrade, /learn.
```

## 许可证

MIT。永久免费。去做点东西吧。
