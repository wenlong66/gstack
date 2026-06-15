import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const ACTIVE_SKILL_PATH = path.join(ROOT, 'skills', 'gstack-office-hours', 'SKILL.md');
const ACTIVE_SECTION_PATH = path.join(ROOT, 'skills', 'gstack-office-hours', 'sections', 'design-and-handoff.md');

const activeSkill = fs.readFileSync(ACTIVE_SKILL_PATH, 'utf-8');
const activeSection = fs.readFileSync(ACTIVE_SECTION_PATH, 'utf-8');

describe('office-hours no-auth regression guards', () => {
  test('active skill preserves AskUserQuestion failure fallback instructions', () => {
    expect(activeSkill).toContain('## AskUserQuestion Format');
    expect(activeSkill).toContain('`interactive` → **prose fallback** (below).');
    expect(activeSkill).toContain('Every AskUserQuestion is a decision brief and must be sent as tool_use, not prose');
    expect(activeSkill).toContain('reply with a letter');
  });

  test('active skill still asks the initial goal question via AskUserQuestion', () => {
    expect(activeSkill).toContain('Via AskUserQuestion, ask:');
    expect(activeSkill).toContain("Before we dig in — what's your goal with this?");
    expect(activeSkill).toContain('Mode mapping:');
    expect(activeSkill).toContain('Startup, intrapreneurship → **Startup mode**');
    expect(activeSkill).toContain('Hackathon, open source, research, learning, having fun → **Builder mode**');
  });

  test('phase 4 preserves the alternatives AskUserQuestion stop gate', () => {
    expect(activeSkill).toContain('## Phase 4: Alternatives Generation (MANDATORY)');
    expect(activeSkill).toContain('Emit ONE AskUserQuestion that lists every alternative');
    expect(activeSkill).toContain('The AskUserQuestion call is a tool_use, not prose');
    expect(activeSkill).toContain('**STOP.** Do NOT proceed to Phase 4.5');
  });

  test('design-and-handoff carve still requires approval via AskUserQuestion', () => {
    expect(activeSkill).toContain('`sections/design-and-handoff.md`');
    expect(activeSkill).toContain('Read `${CLAUDE_PLUGIN_ROOT}/office-hours/sections/design-and-handoff.md` and execute it');
    expect(activeSection).toContain('Present the reviewed design doc to the user via AskUserQuestion:');
    expect(activeSection).toContain('A) Approve — mark Status: APPROVED and proceed to handoff');
    expect(activeSection).toContain('B) Revise — specify which sections need changes');
    expect(activeSection).toContain('C) Start over — return to Phase 2');
  });
});
