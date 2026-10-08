import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dir, '..');
const BASH = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const PLUGIN_PREFIX = '${CLAUDE_PLUGIN_ROOT}';
const HOOK_PATH = 'hosts/claude/hooks/question-log-hook';
const MATCHER = '(AskUserQuestion|mcp__.*__AskUserQuestion)';
const TEST_TIMEOUT_MS = 60_000;
let fixture: string;
let pluginRoot: string;
let settingsFile: string;

function shellPath(value: string): string {
  return process.platform === 'win32' ? value.replace(/\\/g, '/') : value;
}

beforeEach(() => {
  fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'gstack-plugin-hooks-'));
  pluginRoot = path.join(fixture, 'plugin with spaces');
  settingsFile = path.join(fixture, 'hooks.json');
  const hook = path.join(pluginRoot, HOOK_PATH);
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, '#!/usr/bin/env bash\nprintf "plugin-hook-ran"\n', { mode: 0o755 });
});

afterEach(() => fs.rmSync(fixture, { recursive: true, force: true }));

function run(args: string[], root: string | undefined = pluginRoot) {
  const command = [shellPath(path.join(ROOT, 'bin/gstack-settings-hook')), ...args]
    .map(value => `'${value.replace(/'/g, `'\\''`)}'`).join(' ');
  return spawnSync(BASH, ['-s'], {
    input: `${command}\n`,
    cwd: fixture,
    env: {
      ...process.env,
      PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ''}`,
      GSTACK_SETTINGS_FILE: shellPath(settingsFile),
      GSTACK_HOME: shellPath(path.join(fixture, 'state')),
      CLAUDE_PLUGIN_ROOT: root === undefined ? undefined : shellPath(root),
    },
    encoding: 'utf-8',
    timeout: 10_000,
  });
}

function register(command = `${PLUGIN_PREFIX}/${HOOK_PATH}`) {
  const result = run(['ensure-event', '--event', 'PostToolUse', '--matcher', MATCHER,
    '--command', command, '--source', 'plan-tune-cathedral']);
  expect(result.status, result.stderr).toBe(0);
}

function readSettings() {
  return JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
}

describe('portable plugin hook commands', () => {
  test('registration preserves plugin-root expansion and the command runs after relocation', () => {
    register();
    const command = readSettings().hooks.PostToolUse[0].hooks[0].command;
    expect(command).toBe(`"${PLUGIN_PREFIX}/${HOOK_PATH}"`);
    const movedRoot = path.join(fixture, 'relocated plugin');
    fs.renameSync(pluginRoot, movedRoot);
    const result = spawnSync(BASH, ['-s'], {
      input: `${command}\n`,
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: shellPath(movedRoot) },
      encoding: 'utf-8', timeout: 10_000,
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe('plugin-hook-ran');
  }, TEST_TIMEOUT_MS);

  test('pruning retains a live plugin hook, including when its runtime root is unavailable', () => {
    register();
    expect(run(['prune-stale']).status).toBe(0);
    expect(readSettings().hooks.PostToolUse).toHaveLength(1);
    const result = run(['prune-stale'], '');
    expect(result.status, result.stderr).toBe(0);
    expect(readSettings().hooks.PostToolUse).toHaveLength(1);
    fs.unlinkSync(path.join(pluginRoot, HOOK_PATH));
    expect(run(['prune-stale']).status).toBe(0);
    expect(readSettings().hooks?.PostToolUse ?? []).toHaveLength(0);
  }, TEST_TIMEOUT_MS);

  test('healing an old absolute registration produces a portable live command', () => {
    register(shellPath(path.join(fixture, 'deleted checkout', HOOK_PATH)));
    const result = run(['prune-stale', '--repoint', PLUGIN_PREFIX]);
    expect(result.status, result.stderr).toBe(0);
    expect(readSettings().hooks.PostToolUse[0].hooks[0].command).toBe(`"${PLUGIN_PREFIX}/${HOOK_PATH}"`);
  }, TEST_TIMEOUT_MS);

  test('only the trusted prefix expands; shell metacharacters in the remaining path stay literal', () => {
    const result = run(['ensure-event', '--event', 'Stop', '--command',
      `${PLUGIN_PREFIX}/literal$HOME\`id\"/hook`, '--source', 'fixture']);
    expect(result.status, result.stderr).toBe(0);
    expect(readSettings().hooks.Stop[0].hooks[0].command)
      .toBe(`"${PLUGIN_PREFIX}/literal\\$HOME\\\`id\\\"/hook"`);
    const literal = run(['ensure-event', '--event', 'Stop', '--command',
      'literal/${OTHER_ROOT}/hook', '--source', 'fixture']);
    expect(literal.status, literal.stderr).toBe(0);
    expect(readSettings().hooks.Stop[0].hooks[0].command).toBe('"literal/\\${OTHER_ROOT}/hook"');
  }, TEST_TIMEOUT_MS);
});
