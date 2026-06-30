# gstack

[English](README.md) | 简体中文

## 库说明

gstack 是一套面向 Claude Code 和其他 AI 编程 agent 的技能与工具集合。它把常见的软件开发流程拆成可复用的 slash command：产品梳理、计划评审、工程评审、设计评审、代码审查、QA、安全审计、发布、部署、浏览器自动化和长期记忆。

它的目标是让 agent 按结构化流程工作，而不是靠一次性提示词临场发挥：

**Think → Plan → Build → Review → Test → Ship → Reflect**

主要能力：

- **流程化技能**：从需求澄清到 PR、部署和复盘的端到端工作流。
- **真实浏览器工具**：通过 `/browse`、`/open-gstack-browser`、`/qa` 等技能驱动 Chromium，执行点击、截图、表单填写和页面检查。
- **多角色评审**：产品、工程、设计、DX、安全、QA、发布等不同视角的独立检查。
- **多 agent / 多模型协作**：支持 Claude Code、Codex CLI、OpenClaw、Cursor、OpenCode、Factory Droid、Slate、Kiro、Hermes、GBrain 等 host。
- **持久知识与记忆**：通过 `/learn`、`/setup-gbrain`、`/sync-gbrain` 管理跨 session 的项目知识。

许可：MIT。

## 安装

要求：

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Git](https://git-scm.com/)
- [Bun](https://bun.sh/) v1.0+
- Windows 还需要 [Node.js](https://nodejs.org/)

### 安装到 Claude Code

在 Claude Code 中执行：

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack
./setup
```

如果希望把 gstack 配到当前团队仓库：

```bash
(cd ~/.claude/skills/gstack && ./setup --team) && ~/.claude/skills/gstack/bin/gstack-team-init required
```

如果只想提醒队友但不强制安装，把 `required` 改成 `optional`。

### 安装到其他 AI agent

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/gstack
cd ~/gstack
./setup
```

也可以指定目标 host：

```bash
./setup --host codex
./setup --host opencode
./setup --host cursor
./setup --host factory
./setup --host slate
./setup --host kiro
./setup --host hermes
./setup --host gbrain
```

| Agent | Flag | Skills 安装目录 |
|-------|------|----------------|
| Claude Code | 默认 | `~/.claude/skills/gstack` |
| OpenAI Codex CLI | `--host codex` | `~/.codex/skills/gstack-*/` |
| OpenCode | `--host opencode` | `~/.config/opencode/skills/gstack-*/` |
| Cursor | `--host cursor` | `~/.cursor/skills/gstack-*/` |
| Factory Droid | `--host factory` | `~/.factory/skills/gstack-*/` |
| Slate | `--host slate` | `~/.slate/skills/gstack-*/` |
| Kiro | `--host kiro` | `~/.kiro/skills/gstack-*/` |
| Hermes | `--host hermes` | `~/.hermes/skills/gstack-*/` |
| GBrain | `--host gbrain` | `~/.gbrain/skills/gstack-*/` |

更多 host 适配方式见 [docs/ADDING_A_HOST.md](docs/ADDING_A_HOST.md)。

## Claude Code 配置

建议在项目的 `CLAUDE.md` 中加入：

```markdown
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /open-gstack-browser, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /sync-gbrain, /retro, /investigate,
/document-release, /document-generate, /codex, /cso, /autoplan, /pair-agent, /careful, /freeze,
/guard, /unfreeze, /gstack-upgrade, /learn.
```

如果希望使用短命令，例如 `/qa` 而不是 `/gstack-qa`：

```bash
cd ~/.claude/skills/gstack
./setup --no-prefix
```

如果并行使用多个 skill pack，希望保留命名空间：

```bash
cd ~/.claude/skills/gstack
./setup --prefix
```

## 技能使用

### 推荐流程

| 阶段 | 推荐技能 | 用途 |
|------|----------|------|
| 想法澄清 | `/office-hours` | 通过强制问题重新定义需求、用户痛点和实现路径。 |
| 自动计划 | `/autoplan` | 自动串联 CEO、设计、工程和 DX 评审，生成更完整的计划。 |
| 产品范围 | `/plan-ceo-review` | 挑战范围、定位和产品假设。 |
| 工程方案 | `/plan-eng-review` | 检查架构、数据流、边界情况、测试矩阵和故障模式。 |
| 设计计划 | `/plan-design-review` | 在编码前评审设计质量和交互决策。 |
| DX 计划 | `/plan-devex-review` | 评审 API、CLI、SDK、文档和 onboarding 的开发者体验。 |
| 代码审查 | `/review` | 找出能通过 CI 但可能在生产出问题的 bug。 |
| 根因排查 | `/investigate` | 先调查再修复，系统化定位问题。 |
| 设计落地 | `/design-review` | 审核并修复真实 UI，带 before/after 截图。 |
| QA | `/qa` | 用真实浏览器测试应用、修 bug、补回归测试并重新验证。 |
| 只出 QA 报告 | `/qa-only` | 和 `/qa` 同样测试，但不改代码。 |
| 安全审计 | `/cso` | 跑 OWASP Top 10 + STRIDE threat model。 |
| 发布 | `/ship` | 同步 main、跑测试、审覆盖率、推送并开 PR。 |
| 合并部署 | `/land-and-deploy` | 合并 PR、等待 CI/部署完成，并验证生产健康。 |
| 部署监控 | `/canary` | 上线后监控 console error、性能回退和页面故障。 |
| 性能基准 | `/benchmark` | 对比页面加载时间、Core Web Vitals 和资源体积。 |
| 文档更新 | `/document-release` | 根据最新改动更新已有文档。 |
| 文档生成 | `/document-generate` | 用 Diataxis 框架生成缺失文档。 |
| 复盘 | `/retro` | 生成团队或个人工程复盘。 |

### 设计相关技能

| Skill | 用途 |
|-------|------|
| `/design-consultation` | 从零搭建设计系统，调研行业、提出方向并生成 mockup。 |
| `/design-shotgun` | 生成 4-6 个视觉方案，在浏览器对比并根据反馈迭代。 |
| `/design-html` | 把 mockup 或自然语言描述转成可上线的 HTML/CSS，自动识别 React、Svelte、Vue。 |
| `/design-review` | 对已实现界面做设计审核和修复。 |
| `/plan-design-review` | 对计划阶段的设计方案做审查。 |

### 开发者体验相关技能

| Skill | 用途 |
|-------|------|
| `/plan-devex-review` | 计划阶段评审开发者体验、TTHW、onboarding 和 friction。 |
| `/devex-review` | 实测开发者体验，走 getting started 流程并截图记录问题。 |

### 浏览器和 QA 相关技能

| Skill | 用途 |
|-------|------|
| `/browse` | 让 agent 使用真实 Chromium 执行页面操作、截图和检查。 |
| `/open-gstack-browser` | 启动带侧栏、反反爬、自动模型路由和 cookies 导入的 GStack Browser。 |
| `/setup-browser-cookies` | 从 Chrome、Arc、Brave、Edge 导入 cookies 到 headless session。 |
| `/qa` | 浏览器驱动的端到端 QA 和修复循环。 |
| `/qa-only` | 只测试并出报告，不修改代码。 |
| `/pair-agent` | 把浏览器共享给其他 AI agent，每个 agent 使用独立 tab 和 token。 |

### 安全和护栏技能

| Skill | 用途 |
|-------|------|
| `/cso` | 安全审计，覆盖 OWASP Top 10 和 STRIDE。 |
| `/careful` | 在破坏性命令前提醒，例如 `rm -rf`、`DROP TABLE`、force-push。 |
| `/freeze` | 把可编辑范围锁到一个目录，避免调试时改到无关文件。 |
| `/guard` | 同时启用 `/careful` 和 `/freeze`。 |
| `/unfreeze` | 移除编辑范围锁。 |

### 发布和运维技能

| Skill | 用途 |
|-------|------|
| `/ship` | 运行发布前检查、测试、覆盖率审计、推送和 PR 创建。 |
| `/land-and-deploy` | 合并 PR、等待 CI 和部署，并做生产验证。 |
| `/setup-deploy` | 一次性配置生产 URL、部署命令和平台信息。 |
| `/canary` | 部署后的监控循环。 |
| `/benchmark` | 性能基准和前后对比。 |

### 记忆和知识技能

| Skill | 用途 |
|-------|------|
| `/learn` | 查看、搜索、清理、导出 gstack 学到的项目知识。 |
| `/setup-gbrain` | 配置 GBrain 持久知识库，支持 Supabase、PGLite、本地或远程 MCP。 |
| `/sync-gbrain` | 重新索引当前仓库，并刷新项目 `CLAUDE.md` 中的 GBrain 搜索指导。 |

### 其他技能

| Skill | 用途 |
|-------|------|
| `/codex` | 调用 OpenAI Codex CLI 获取第二意见，可做 review、adversarial challenge 或 consultation。 |
| `/spec` | 把模糊需求变成可执行 spec，并可创建 issue 或拉起实现流程。 |
| `/document-release` | 更新已存在文档，修正文档漂移。 |
| `/document-generate` | 生成 reference、how-to、tutorial、explanation 等缺失文档。 |
| `/gstack-upgrade` | 升级 gstack，并同步全局和项目安装。 |

## 工具使用

### 浏览器命令

`/browse` 背后使用 gstack 的浏览器工具。常见用途：

- 打开 URL
- 点击元素
- 填表单
- 截图
- 读取页面结构
- 检查 console error
- 执行 QA 流程

在 gstack 项目内部，也可以直接使用 browse binary：

```bash
bun run dev <command>
```

例如：

```bash
bun run dev goto https://example.com
```

### GStack Browser

```bash
/open-gstack-browser
```

GStack Browser 是一个可见 Chromium，会和 Claude Code 集成，并提供：

- 侧栏 agent
- 智能截图
- cookies 导入
- 页面清理
- CSS 检查
- 与 `/browse` 命令共享浏览器上下文

### GBrain

初始化：

```bash
/setup-gbrain
```

同步当前仓库：

```bash
/sync-gbrain
```

支持的模式：

- Supabase 已有 URL
- Supabase 自动创建
- PGLite 本地模式
- 远程 gbrain MCP

### CLI 工具

| Command | 作用 |
|---------|------|
| `gstack-model-benchmark` | 把同一个 prompt 跑给 Claude、GPT/Codex 和 Gemini，对比延迟、token、成本和可选质量评分。 |
| `gstack-taste-update` | 把 `/design-shotgun` 的偏好结果写入项目级 taste profile。 |
| `gstack-ios-qa-daemon` | 在 Mac 端连接 agent 和 USB CoreDevice iPhone，用于真实设备 iOS QA。 |
| `gstack-ios-qa-mint` | 管理 iOS QA tailnet allowlist。 |
| `gstack-config` | 查看和修改 gstack 配置，例如 telemetry、checkpoint、prefix 等。 |
| `gstack-analytics` | 从本地 JSONL 查看使用统计。 |

### iOS 工具

| Skill / Command | 作用 |
|-----------------|------|
| `/ios-qa` | 通过 USB CoreDevice 驱动真实 iPhone 做 QA。 |
| `/ios-fix` | iOS bug 修复循环。 |
| `/ios-design-review` | 按 Apple HIG 做 iOS 设计审核。 |
| `/ios-clean` | 清理 debug bridge。 |
| `/ios-sync` | 重新同步 accessor。 |
| `gstack-ios-qa-daemon` | iOS QA daemon。 |
| `gstack-ios-qa-mint` | iOS allowlist 管理。 |

更多说明见 [docs/howto-ios-testing-with-gstack.md](docs/howto-ios-testing-with-gstack.md)。

## 常见任务怎么选技能

| 你要做什么 | 推荐技能 |
|------------|----------|
| 还没想清楚产品方向 | `/office-hours` |
| 想自动生成完整计划 | `/autoplan` |
| 想审查计划范围 | `/plan-ceo-review` |
| 想审查架构和测试方案 | `/plan-eng-review` |
| 想审查 UI / 交互 | `/plan-design-review` 或 `/design-review` |
| 想审查开发者体验 | `/plan-devex-review` 或 `/devex-review` |
| 想找生产级 bug | `/review` |
| 想排查一个具体问题 | `/investigate` |
| 想跑真实浏览器测试 | `/qa` |
| 只想要 QA 报告 | `/qa-only` |
| 想做安全审计 | `/cso` |
| 想发 PR | `/ship` |
| 想合并并部署 | `/land-and-deploy` |
| 想更新文档 | `/document-release` |
| 想生成新文档 | `/document-generate` |
| 想升级 gstack | `/gstack-upgrade` |
| 想配置持久记忆 | `/setup-gbrain` |

## OpenClaw

如果 OpenClaw 通过 ACP 拉起 Claude Code session，只要 Claude Code 已安装 gstack，OpenClaw 就可以让 Claude Code 执行 gstack skills。

示例：

| 你说 | 建议路由 |
|------|----------|
| `Run a security audit on this repo` | `Load gstack. Run /cso` |
| `Build me a notifications feature` | `Load gstack. Run /autoplan, implement the plan, then run /ship` |
| `Help me plan the v2 API redesign` | `Load gstack. Run /office-hours then /autoplan. Save the plan, don't implement.` |
| `QA this staging URL` | `Load gstack. Run /qa https://...` |

原生 OpenClaw skills 可通过 ClawHub 安装：

```bash
clawhub install gstack-openclaw-office-hours gstack-openclaw-ceo-review gstack-openclaw-investigate gstack-openclaw-retro
```

| Skill | 作用 |
|-------|------|
| `gstack-openclaw-office-hours` | 通过 6 个强制问题做产品拷问。 |
| `gstack-openclaw-ceo-review` | 用 4 种 scope 模式做战略挑战。 |
| `gstack-openclaw-investigate` | 根因排查方法论。 |
| `gstack-openclaw-retro` | 每周工程复盘。 |

更多说明见 [docs/OPENCLAW.md](docs/OPENCLAW.md)。

## 卸载

```bash
~/.claude/skills/gstack/bin/gstack-uninstall
```

常用选项：

- `--keep-state`：保留配置和分析数据。
- `--force`：跳过确认。

卸载脚本不会修改项目的 `CLAUDE.md`。如果项目里写入过 gstack 配置，请手动删除相关区块。

## 故障排查

**Skill 没显示出来：**

```bash
cd ~/.claude/skills/gstack
./setup
```

**`/browse` 失败：**

```bash
cd ~/.claude/skills/gstack
bun install
bun run build
```

**安装旧了：**

```bash
/gstack-upgrade
```

或者：

```bash
gstack-config set auto_upgrade true
```

**Windows 用户：**

gstack 可在 Windows 11 上通过 Git Bash 或 WSL 运行。除 Bun 外还需要 Node.js。browse server 会自动 fallback 到 Node.js。请确保 `bun` 和 `node` 都在 PATH 中。

在没有启用 Developer Mode 的 Windows Git Bash / MSYS2 中，`setup` 会使用文件复制而不是 symlink。每次 `git pull` 后请重新执行：

```bash
cd ~/.claude/skills/gstack
./setup
```

## 文档

| 文档 | 覆盖内容 |
|------|----------|
| [Skill Deep Dives](docs/skills.md) | 每个 skill 的原理、示例和工作流。 |
| [Browser Reference](BROWSER.md) | `/browse` 的完整命令参考。 |
| [Using GBrain with GStack](USING_GBRAIN_WITH_GSTACK.md) | `/setup-gbrain` 的路径、flag、bin helper 和排障。 |
| [GBrain Sync](docs/gbrain-sync.md) | 跨机器记忆设置、隐私模式、故障排查。 |
| [游戏开发使用指南](zh-game-usage.md) | 面向游戏项目的中文技能选择和工作流。 |
| [Architecture](ARCHITECTURE.md) | 设计决策与系统内部原理。 |
| [Contributing](CONTRIBUTING.md) | 开发环境、测试和 contributor mode。 |
| [Changelog](CHANGELOG.md) | 版本变化。 |

## 许可证

MIT。永久免费。
