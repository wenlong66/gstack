# Plugin Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `./setup --plugin` generate Claude plugin artifacts under `.claude/`, point `.claude-plugin/plugin.json` at `.claude`, and emit `.claude/hooks/hooks.json` instead of mutating global Claude settings.

**Architecture:** Reuse the existing Claude `.claude/skills/...` runtime shape rather than inventing a new plugin runtime layout. Keep the repo-root plugin manifest, move plugin-generated content under `.claude/`, and replace plugin-mode hook file copying with deterministic `hooks.json` generation that mirrors the existing plan-tune hook behavior.

**Tech Stack:** Bash setup script, Claude plugin manifest JSON, generated hook JSON, Bun tests (`bun test`)

---

## File structure map

- `setup`
  - Owns `--plugin` path initialization, plugin artifact generation, and Claude/Codex install branching.
- `.claude-plugin/plugin.json`
  - Owns the repo-root Claude plugin manifest and must point plugin content discovery at `.claude`.
- `.claude/hooks/hooks.json`
  - Generated plugin hook config for `PreToolUse` and `PostToolUse`.
- `test/gen-skill-docs.test.ts`
  - Static assertions for plugin paths, plugin manifest shape, and plugin hook generation behavior.

## Task 1: Repoint Claude plugin mode at the `.claude` tree

**Files:**
- Modify: `setup:232-256`
- Modify: `setup:1116-1219`
- Modify: `.claude-plugin/plugin.json`
- Test: `test/gen-skill-docs.test.ts:2358-2417`

- [ ] **Step 1: Write the failing test for plugin path layout**

Add or update the plugin assertions in `test/gen-skill-docs.test.ts` so they expect `.claude`-based output instead of repo-root `skills/`:

```ts
expect(setupContent).toContain('INSTALL_SKILLS_DIR="$PLUGIN_OUTPUT_DIR/.claude/skills"');
expect(setupContent).toContain('INSTALL_GSTACK_DIR="$INSTALL_SKILLS_DIR/gstack"');
expect(setupContent).toContain('PLUGIN_HOOKS_DIR="$PLUGIN_OUTPUT_DIR/.claude/hooks"');
expect(setupContent).toContain('PLUGIN_HOOKS_FILE="$PLUGIN_HOOKS_DIR/hooks.json"');
```

Update the manifest assertion so it expects the plugin source to be `.claude`:

```ts
expect(claudePlugin.plugins[0].source).toBe('.claude');
```

- [ ] **Step 2: Run the targeted plugin test to verify it fails**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: FAIL because `setup` still points plugin mode at `skills/` and `.claude-plugin/plugin.json` still has `source: "./"`.

- [ ] **Step 3: Change plugin-mode path initialization in `setup`**

In the `if [ "$PLUGIN_MODE" -eq 1 ]` block, replace the Claude path initialization:

```bash
PLUGIN_OUTPUT_DIR="$(pwd -P)"
if [ "$INSTALL_CLAUDE" -eq 1 ]; then
  INSTALL_SKILLS_DIR="$PLUGIN_OUTPUT_DIR/.claude/skills"
  INSTALL_GSTACK_DIR="$INSTALL_SKILLS_DIR/gstack"
  PLUGIN_HOOKS_DIR="$PLUGIN_OUTPUT_DIR/.claude/hooks"
  PLUGIN_HOOKS_FILE="$PLUGIN_HOOKS_DIR/hooks.json"
fi
```

Do not change the Codex `.agents/skills` branch in this task.

- [ ] **Step 4: Point the manifest source at `.claude`**

Update `.claude-plugin/plugin.json` so the plugin entry becomes:

```json
{
  "name": "gstack",
  "version": "1.55.1.0",
  "source": ".claude",
  "description": "Garry's Stack — Claude Code skills plus fast browser automation for AI-assisted engineering workflows.",
  "homepage": "https://github.com/garrytan/gstack",
  "license": "MIT"
}
```

Keep the rest of the manifest unchanged in this task.

- [ ] **Step 5: Run the targeted plugin test to verify the path changes pass**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: plugin-path assertions move forward, with any remaining failures isolated to hook generation behavior.

- [ ] **Step 6: Commit the path-layout slice**

```bash
git add setup .claude-plugin/plugin.json test/gen-skill-docs.test.ts
git commit -m "refactor: point plugin mode at .claude artifacts"
```

## Task 2: Replace plugin hook copying with generated `.claude/hooks/hooks.json`

**Files:**
- Modify: `setup:247-256`
- Modify: `setup:615-616`
- Create: `.claude/hooks/hooks.json` (generated at runtime, not checked in)
- Test: `test/gen-skill-docs.test.ts:2358-2417`

- [ ] **Step 1: Write the failing test for generated plugin hooks**

Update plugin assertions in `test/gen-skill-docs.test.ts` so they expect `.claude/hooks/hooks.json` generation and no root `hooks/` copying:

```ts
expect(setupContent).toContain('PLUGIN_HOOKS_FILE="$PLUGIN_HOOKS_DIR/hooks.json"');
expect(setupContent).toContain('write_claude_plugin_hooks_json');
expect(setupContent).not.toContain('mkdir -p "$PLUGIN_OUTPUT_DIR/hooks"');
```

Add a manifest/source behavior assertion comment if needed to explain that plugin hooks now live under `.claude/hooks/hooks.json`.

- [ ] **Step 2: Run the targeted plugin test to verify it fails for the expected reason**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: FAIL because `setup` still defines `copy_claude_plugin_hooks()` and writes plugin hook files under the repo-root `hooks/` directory.

- [ ] **Step 3: Replace the copy helper with a JSON writer helper**

In `setup`, delete the plugin hook copy helper and replace it with a generator like this:

```bash
write_claude_plugin_hooks_json() {
  [ "$PLUGIN_MODE" -eq 1 ] || return 0
  [ "$INSTALL_CLAUDE" -eq 1 ] || return 0
  mkdir -p "$PLUGIN_HOOKS_DIR"
  cat > "$PLUGIN_HOOKS_FILE" <<EOF
{
  "PostToolUse": [
    {
      "matcher": "(AskUserQuestion|mcp__.*__AskUserQuestion)",
      "hooks": [
        {
          "type": "command",
          "command": "\${CLAUDE_PLUGIN_ROOT}/skills/gstack/hosts/claude/hooks/question-log-hook",
          "timeout": 5
        }
      ]
    }
  ],
  "PreToolUse": [
    {
      "matcher": "(AskUserQuestion|mcp__.*__AskUserQuestion)",
      "hooks": [
        {
          "type": "command",
          "command": "\${CLAUDE_PLUGIN_ROOT}/skills/gstack/hosts/claude/hooks/question-preference-hook",
          "timeout": 5
        }
      ]
    }
  ]
}
EOF
}
```

Important constraints in this step:
- write to `.claude/hooks/hooks.json`
- overwrite on every `./setup --plugin` run
- do not copy `question-log-hook` or `question-preference-hook` into `.claude/hooks/`

- [ ] **Step 4: Swap the setup call site to use the JSON writer**

Replace the plugin hook setup call near the plugin manifest copy section:

```bash
copy_plugin_manifests
write_claude_plugin_hooks_json
```

Remove the old `copy_claude_plugin_hooks` call entirely.

- [ ] **Step 5: Run the targeted plugin test to verify hook generation passes**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: PASS for plugin tests, with assertions confirming `.claude/hooks/hooks.json` generation and removal of repo-root hook-copy behavior.

- [ ] **Step 6: Commit the hook-generation slice**

```bash
git add setup test/gen-skill-docs.test.ts
git commit -m "refactor: generate plugin hooks under .claude"
```

## Task 3: Keep plugin mode on the Claude skill-generation path, but off global settings hooks

**Files:**
- Modify: `setup:1116-1219`
- Verify: `setup:1460-1464`
- Test: `test/gen-skill-docs.test.ts:2381-2401`

- [ ] **Step 1: Write the failing test for plugin-mode Claude generation invariants**

Extend the plugin-related tests so they pin the final intended behavior:

```ts
expect(claudeSection).toContain('INSTALL_SKILLS_DIR="$PLUGIN_OUTPUT_DIR/.claude/skills"');
expect(claudeSection).toContain('create_claude_plugin_runtime_root "$SOURCE_GSTACK_DIR" "$INSTALL_GSTACK_DIR"');
expect(setupContent).toContain('&& [ "$PLUGIN_MODE" -ne 1 ] \\');
```

The point of this test is to prove:
- plugin mode still uses the Claude install path
- plugin mode still creates `.claude/skills/gstack`
- plugin mode still skips global settings-hook installation

- [ ] **Step 2: Run the targeted plugin test to verify the invariant is not fully satisfied yet**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: FAIL if any plugin-mode invariants are still tied to root `skills/` assumptions or missing `.claude`-specific checks.

- [ ] **Step 3: Keep the runtime root creation on `.claude/skills/gstack`**

Do not remove the existing plugin runtime root branch in the Claude install path. The expected structure remains:

```bash
if [ "$INSTALL_CLAUDE" -eq 1 ]; then
  if [ "$SKILLS_BASENAME" = "skills" ]; then
    if [ "$PLUGIN_MODE" -eq 1 ]; then
      create_claude_plugin_runtime_root "$SOURCE_GSTACK_DIR" "$INSTALL_GSTACK_DIR"
    fi
    ...
  fi
fi
```

This preserves the current Claude runtime assumptions because generated Claude SKILL files already look for `.claude/skills/gstack/...`.

- [ ] **Step 4: Verify plugin mode still skips global plan-tune settings installation**

Check that the guard stays intact in the plan-tune installation block:

```bash
if [ "$NO_TEAM_MODE" -ne 1 ] \
   && [ "$PLUGIN_MODE" -ne 1 ] \
   && [ -x "$SETTINGS_HOOK" ] \
   && [ -x "$PLAN_TUNE_LOG_HOOK" ] \
   && [ -x "$PLAN_TUNE_PREF_HOOK" ]; then
```

No code change is needed if this block already matches the desired behavior. The test only exists to pin the invariant.

- [ ] **Step 5: Run the targeted plugin test to verify the full plugin mode contract passes**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: PASS, proving plugin mode now uses `.claude/skills`, emits `.claude/hooks/hooks.json`, and avoids the global settings hook installer.

- [ ] **Step 6: Commit the plugin-mode invariants slice**

```bash
git add setup test/gen-skill-docs.test.ts
git commit -m "test: pin plugin mode claude invariants"
```

## Task 4: Run final verification for the redesign

**Files:**
- Verify only: `setup`
- Verify only: `.claude-plugin/plugin.json`
- Verify only: `test/gen-skill-docs.test.ts`

- [ ] **Step 1: Run the focused plugin test suite**

Run:

```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin"
```

Expected: all plugin-related tests pass.

- [ ] **Step 2: Run the full setup test file**

Run:

```bash
bun test test/gen-skill-docs.test.ts
```

Expected: PASS with 0 failures, proving the plugin changes did not break adjacent setup invariants.

- [ ] **Step 3: Inspect the final diff for scope discipline**

Run:

```bash
git diff -- setup .claude-plugin/plugin.json test/gen-skill-docs.test.ts
```

Expected: only plugin path initialization, plugin manifest source, plugin hook generation, and corresponding static tests changed.

- [ ] **Step 4: Commit the final verification checkpoint**

```bash
git add setup .claude-plugin/plugin.json test/gen-skill-docs.test.ts
git commit -m "refactor: align plugin setup with .claude layout"
```

## Self-review

- **Spec coverage:** Covered `.claude` output root, `.claude-plugin/plugin.json` source change, `.claude/hooks/hooks.json` generation, preservation of `.claude/skills/gstack` runtime assumptions, and continued skip of global settings-hook installation in plugin mode.
- **Placeholder scan:** No TBD/TODO placeholders remain. Every task includes exact files, commands, and concrete code snippets.
- **Type consistency:** Uses the same path names throughout: `.claude/skills`, `.claude/hooks/hooks.json`, `write_claude_plugin_hooks_json`, and `.claude-plugin/plugin.json` `source: ".claude"`.
