# Claude Plugin Host-Config Path Rewrites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Claude plugin path rewriting from setup-local `sed` logic into a host-config-driven generation path, while preserving normal Claude install behavior.

**Architecture:** Keep the existing `claude` host unchanged for normal `~/.claude/skills/gstack` installs. Add a separate plugin-only host/profile that generates root `skills/` output with `${CLAUDE_PLUGIN_ROOT}` path rewrites, then make `./setup --plugin --host claude` consume that generated output instead of mutating copied Claude files in setup.

**Tech Stack:** TypeScript, Bun tests, host config registry, generated SKILL.md pipeline, bash setup script.

---

## File map

- Modify: `hosts/index.ts`
  - Register the new plugin-only Claude host.
- Create: `hosts/claude-plugin.ts`
  - Define plugin-specific path rewrites and output layout.
- Modify: `scripts/gen-skill-docs.ts`
  - Ensure the plugin host can generate into repo-root `skills/` cleanly.
- Modify: `scripts/resolvers/types.ts`
  - Keep normal Claude host behavior unchanged; only the plugin host should expose plugin-root paths.
- Modify: `setup`
  - Stop rewriting copied plugin skills with setup-local `sed`; install from the generated plugin host output instead.
- Modify: `test/gen-skill-docs.test.ts`
  - Add/adjust regression tests for config-driven plugin generation and setup consumption.

### Task 1: Add a dedicated Claude plugin host config

**Files:**
- Create: `hosts/claude-plugin.ts`
- Modify: `hosts/index.ts`
- Test: `test/gen-skill-docs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('Claude plugin host rewrites Claude runtime paths to CLAUDE_PLUGIN_ROOT', () => {
  const content = fs.readFileSync(path.join(ROOT, 'skills', 'gstack-browse', 'SKILL.md'), 'utf-8');
  expect(content).toContain('${CLAUDE_PLUGIN_ROOT}/bin/gstack-config');
  expect(content).not.toContain('~/.claude/skills/gstack');
  expect(content).not.toContain('.claude/skills/gstack');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "Claude plugin host rewrites Claude runtime paths to CLAUDE_PLUGIN_ROOT"
```

Expected: FAIL because the plugin host does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `hosts/claude-plugin.ts` with the same baseline behavior as `hosts/claude.ts`, but plugin-specific fields:

```ts
import type { HostConfig } from '../scripts/host-config';

const claudePlugin: HostConfig = {
  name: 'claude-plugin',
  displayName: 'Claude Code Plugin',
  cliCommand: 'claude',
  cliAliases: [],
  globalRoot: 'skills/gstack',
  localSkillRoot: 'skills/gstack',
  hostSubdir: '.',
  usesEnvVars: false,
  frontmatter: {
    mode: 'denylist',
    stripFields: ['sensitive', 'voice-triggers'],
    descriptionLimit: null,
  },
  generation: {
    generateMetadata: false,
    skipSkills: ['claude'],
  },
  pathRewrites: [
    { from: '~/.claude/skills/gstack', to: '${CLAUDE_PLUGIN_ROOT}' },
    { from: '.claude/skills/gstack', to: '${CLAUDE_PLUGIN_ROOT}' },
    { from: '.claude/skills/review', to: '${CLAUDE_PLUGIN_ROOT}/review' },
    { from: '.claude/skills', to: '${CLAUDE_PLUGIN_ROOT}/skills' },
  ],
  toolRewrites: {},
  suppressedResolvers: ['GBRAIN_CONTEXT_LOAD', 'GBRAIN_SAVE_RESULTS'],
  runtimeRoot: {
    globalSymlinks: ['bin', 'browse/dist', 'browse/bin', 'gstack-upgrade', 'ETHOS.md'],
    globalFiles: {
      review: ['checklist.md', 'TODOS-format.md'],
    },
  },
  install: {
    prefixable: true,
    linkingStrategy: 'real-dir-symlink',
  },
  coAuthorTrailer: 'Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>',
  learningsMode: 'full',
};

export default claudePlugin;
```

Then register it in `hosts/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "Claude plugin host rewrites Claude runtime paths to CLAUDE_PLUGIN_ROOT"
```

Expected: PASS.

### Task 2: Generate plugin skills from host config instead of setup-local sed rewrites

**Files:**
- Modify: `scripts/gen-skill-docs.ts`
- Modify: `setup`
- Test: `test/gen-skill-docs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('plugin Claude install consumes generated plugin-host skills instead of setup rewrite helper', () => {
  const setupContent = fs.readFileSync(path.join(ROOT, 'setup'), 'utf-8');
  expect(setupContent).toContain('bun run gen:skill-docs --host claude-plugin');
  expect(setupContent).not.toContain('rewrite_claude_plugin_skill_paths');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin Claude install consumes generated plugin-host skills instead of setup rewrite helper"
```

Expected: FAIL because setup still uses the helper.

- [ ] **Step 3: Write minimal implementation**

Update `setup` so the plugin Claude branch does this:

```bash
if [ "$PLUGIN_MODE" -eq 1 ]; then
  ( cd "$SOURCE_GSTACK_DIR" && bun run gen:skill-docs --host claude-plugin )
  link_claude_skill_dirs "$SOURCE_GSTACK_DIR" "$INSTALL_SKILLS_DIR" copy
  link_claude_root_skill_alias "$SOURCE_GSTACK_DIR" "$INSTALL_SKILLS_DIR" copy
fi
```

But the copy source for plugin mode must switch from source repo skill dirs to generated `skills/` dirs. Keep normal Claude installs using the existing `claude` host and current source-tree behavior.

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin Claude install consumes generated plugin-host skills instead of setup rewrite helper"
```

Expected: PASS.

### Task 3: Keep plugin metadata and root hooks aligned with the new generated output

**Files:**
- Modify: `setup`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`
- Test: `test/gen-skill-docs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('Claude plugin metadata and hooks still target repo-root plugin outputs', () => {
  const pluginManifest = fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf-8');
  const marketplaceManifest = fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf-8');
  const hooks = fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf-8');

  expect(pluginManifest).toContain('"skills": "./skills"');
  expect(marketplaceManifest).toContain('"source": "."');
  expect(hooks).toContain('${CLAUDE_PLUGIN_ROOT}/hosts/claude/hooks/question-log-hook');
  expect(hooks).toContain('${CLAUDE_PLUGIN_ROOT}/hosts/claude/hooks/question-preference-hook');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "Claude plugin metadata and hooks still target repo-root plugin outputs"
```

Expected: FAIL if setup/gen pipeline drifted during the refactor.

- [ ] **Step 3: Write minimal implementation**

Keep these exact outputs:

```json
// .claude-plugin/plugin.json
"skills": "./skills"
```

```json
// .claude-plugin/marketplace.json
"source": "."
```

```json
// hooks/hooks.json command values
"${CLAUDE_PLUGIN_ROOT}/hosts/claude/hooks/question-log-hook"
"${CLAUDE_PLUGIN_ROOT}/hosts/claude/hooks/question-preference-hook"
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "Claude plugin metadata and hooks still target repo-root plugin outputs"
```

Expected: PASS.

### Task 4: Full verification

**Files:**
- Test: `test/gen-skill-docs.test.ts`
- Test: real generated `skills/` and `hooks/hooks.json` outputs

- [ ] **Step 1: Run focused regression tests**

Run:
```bash
bun test test/gen-skill-docs.test.ts --test-name-pattern "plugin|Claude plugin"
```

Expected: PASS.

- [ ] **Step 2: Syntax-check setup**

Run:
```bash
bash -n ./setup
```

Expected: no output, exit 0.

- [ ] **Step 3: Run real plugin setup**

Run:
```bash
./setup --plugin --host claude
```

Expected: creates/refreshes `skills/` and `hooks/hooks.json`.

- [ ] **Step 4: Verify generated outputs**

Run:
```bash
grep -R "\.claude/skills/gstack\|~/.claude/skills/gstack" skills --include="*.md"
```

Expected: no matches.

Run:
```bash
grep "CLAUDE_PLUGIN_ROOT" hooks/hooks.json
```

Expected: both hook commands reference `${CLAUDE_PLUGIN_ROOT}`.
