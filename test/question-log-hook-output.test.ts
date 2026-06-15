import { describe, expect, test } from 'bun:test';

import { postToolUseNoOpOutput } from '../hosts/claude/hooks/question-log-hook.ts';

describe('question-log-hook PostToolUse envelope', () => {
  test('returns the JSON no-op envelope Claude Code expects from PostToolUse hooks', () => {
    expect(postToolUseNoOpOutput()).toEqual({
      hookSpecificOutput: { hookEventName: 'PostToolUse' },
    });
  });
});
