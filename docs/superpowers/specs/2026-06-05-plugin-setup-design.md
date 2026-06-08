# `setup --plugin` 重构设计

## 目标

让 `--plugin` 生成 Claude plugin 产物时：

- 复用现有 Claude skill 目录形状
- 不修改全局 Claude settings
- 尽量减少改动范围

## 最终决定

`--plugin` 复用 `--local` 使用的 `.claude` 目录形状，不再引入新的 `plugin/` 运行时目录。

生成产物如下：

- 仓库根 manifest：`.claude-plugin/plugin.json`
- plugin source 根目录：`.claude/`
- Claude skills：`.claude/skills/`
- plugin hook 配置：`.claude/hooks/hooks.json`

## 为什么选这个方向

当前 Claude 生成出来的 skills，本来就会从下面两个位置找运行时文件：

- `~/.claude/skills/gstack/...`
- `.claude/skills/gstack/...`

这意味着，如果改成 `plugin/skills/...`，就必须额外做 Claude 专用的路径重写，或者再造一套兼容运行时目录。

继续复用 `.claude/skills/...`，可以保留现有 Claude runtime 假设，改动最小。

## 行为变化

### 1. `--plugin` 的输出根目录

在 Claude plugin 模式下，skill 生成根目录改为：

- `$(pwd)/.claude/skills`

这和 `--local` 的磁盘形状一致，但语义仍然是 plugin 产物生成，不是本地安装。

### 2. Plugin manifest 的 source

`.claude-plugin/plugin.json` 里的 `source` 应该指向 `.claude`。

这样 `.claude/` 就成为 plugin 的内容根目录，同时 manifest 继续放在仓库根。

### 3. Hook 生成规则

`--plugin` 不能写入全局 `~/.claude/settings.json`。

取而代之的是，每次执行 `./setup --plugin`，都覆盖生成：

- `.claude/hooks/hooks.json`

生成出来的 hook 配置，语义上与当前 `--plan-tune-hooks` 一致：

- 一条 `PostToolUse` hook
- 一条 `PreToolUse` hook
- matcher：`(AskUserQuestion|mcp__.*__AskUserQuestion)`
- timeout：`5`

### 4. Hook 实现引用规则

`--plugin` 不复制第二份 hook 脚本。

`hooks.json` 应直接引用 `.claude` 目录树里的现有实现，这样 plugin source 子树内部保持自洽。

## `setup` 结构调整

### 保留

- 现有 Claude skill linking 逻辑，例如 `link_claude_skill_dirs`
- Claude 生成物当前对 runtime 布局的假设
- plugin 模式下跳过全局 plan-tune hook 安装的保护逻辑

### 删除或替换

- `skills/` 这种仓库根级别的 plugin skill 输出
- 仓库根 `hooks/` 这种 plugin hook 输出
- plugin 模式下复制 hook 脚本的逻辑

### 新增

- plugin 模式下初始化 `.claude/skills` 路径
- plugin 模式下生成 `.claude/hooks/hooks.json`
- manifest 更新，让 plugin source 指向 `.claude`

## 非目标

这次不做下面这些事：

- 不引入新的 `plugin/` runtime 目录
- 不为 plugin 模式增加 Claude 专用路径重写层
- 不在 plugin 模式下修改全局 `~/.claude/settings.json`
- 不把它做成脱离当前仓库结构也能独立搬运的插件包

## 成功标准

1. `./setup --plugin` 会把 plugin 产物生成到 `.claude/` 下。
2. `.claude-plugin/plugin.json` 的 `source` 指向 `.claude`。
3. `.claude/hooks/hooks.json` 每次 plugin setup 都会重新生成。
4. plugin 模式不会调用全局 settings-hook 安装逻辑。
5. 现有 Claude 生成物的 runtime 假设继续成立，不需要新增路径重写系统。

## 预计改动位置

- `setup`
- `.claude-plugin/plugin.json`
- `test/gen-skill-docs.test.ts` 中与 plugin 相关的测试
