/**
 * Preamble composition order — gate-tier test.
 *
 * Asserts that the AskUserQuestion Format section renders BEFORE the
 * Model-Specific Behavioral Patch section in tier-≥2 preamble output.
 * This order is load-bearing: Opus 4.7 reads top-to-bottom and absorbs
 * the first pacing directive it hits. v1.6.4.0 regressed plan-review
 * cadence because the overlay rendered first with "Batch your questions"
 * as the ambient default.
 *
 * If someone later reorders `scripts/resolvers/preamble.ts` so Overlay
 * comes before Format, this test catches it before the next model
 * migration can silently re-break the plan-review pacing.
 */
import { describe, test, expect } from 'bun:test';
import type { TemplateContext } from '../scripts/resolvers/types';
import { HOST_PATHS } from '../scripts/resolvers/types';
import { generatePreamble } from '../scripts/resolvers/preamble';

function makeCtx(
  host: 'claude' | 'codex' | 'factory',
  tier: 1 | 2 | 3 | 4,
  model?: string,
): TemplateContext {
  return {
    skillName: 'test-skill',
    tmplPath: 'test.tmpl',
    host,
    paths: HOST_PATHS[host],
    preambleTier: tier,
    ...(model ? { model } : {}),
  };
}

describe('Preamble composition order', () => {
  test('AskUserQuestion Format renders before Model-Specific Behavioral Patch (tier 2, claude)', () => {
    const out = generatePreamble(makeCtx('claude', 2, 'claude'));
    const formatIdx = out.indexOf('## AskUserQuestion Format');
    const overlayIdx = out.indexOf('## Model-Specific Behavioral Patch');
    expect(formatIdx).toBeGreaterThan(-1);
    expect(overlayIdx).toBeGreaterThan(-1);
    expect(formatIdx).toBeLessThan(overlayIdx);
  });

  test('AskUserQuestion Format renders before Model-Specific Behavioral Patch (tier 2, opus-4-7)', () => {
    const out = generatePreamble(makeCtx('claude', 2, 'opus-4-7'));
    const formatIdx = out.indexOf('## AskUserQuestion Format');
    const overlayIdx = out.indexOf('## Model-Specific Behavioral Patch');
    expect(formatIdx).toBeGreaterThan(-1);
    expect(overlayIdx).toBeGreaterThan(-1);
    expect(formatIdx).toBeLessThan(overlayIdx);
  });

  test('AskUserQuestion Format renders before Model-Specific Behavioral Patch (tier 3)', () => {
    const out = generatePreamble(makeCtx('claude', 3, 'opus-4-7'));
    const formatIdx = out.indexOf('## AskUserQuestion Format');
    const overlayIdx = out.indexOf('## Model-Specific Behavioral Patch');
    expect(formatIdx).toBeLessThan(overlayIdx);
  });

  test('AskUserQuestion Format renders before Model-Specific Behavioral Patch (codex host)', () => {
    const out = generatePreamble(makeCtx('codex', 2, 'opus-4-7'));
    const formatIdx = out.indexOf('## AskUserQuestion Format');
    const overlayIdx = out.indexOf('## Model-Specific Behavioral Patch');
    expect(formatIdx).toBeLessThan(overlayIdx);
  });

  test('tier 1 preamble does NOT include AskUserQuestion Format (but MAY include overlay)', () => {
    const out = generatePreamble(makeCtx('claude', 1));
    expect(out).not.toContain('## AskUserQuestion Format');
  });
});

describe('Conductor signal (preamble bash)', () => {
  test('claude preamble emits CONDUCTOR_SESSION, gated on != headless (Issue 8)', () => {
    const out = generatePreamble(makeCtx('claude', 2, 'claude'));
    expect(out).toContain('echo "CONDUCTOR_SESSION: true"');
    // The emission must be suppressed when the session is headless (eval/CI
    // inside Conductor must BLOCK, not render prose to nobody).
    expect(out).toMatch(/"\$_SESSION_KIND" != "headless"[\s\S]*CONDUCTOR_WORKSPACE_PATH[\s\S]*CONDUCTOR_PORT[\s\S]*CONDUCTOR_SESSION: true/);
  });

  test('codex preamble can resolve runtime root from Codex plugin cache', () => {
    const out = generatePreamble(makeCtx('codex', 1, 'claude'));
    expect(out).toContain('GSTACK_ROOT="${GSTACK_ROOT:-$HOME/.codex/skills/gstack}"');
    expect(out).toContain('"$HOME/.codex/plugins/cache"/*/gstack/*/.agents/skills/gstack');
    expect(out).toContain('[ -x "$_GSTACK_CAND/bin/gstack-config" ] && GSTACK_ROOT="$_GSTACK_CAND" && break');
  });

  test('non-Codex env-var hosts do not scan Codex plugin cache', () => {
    const out = generatePreamble(makeCtx('factory', 1, 'claude'));
    expect(out).toContain('GSTACK_ROOT="${GSTACK_ROOT:-$HOME/.factory/skills/gstack}"');
    expect(out).not.toContain('.codex/plugins/cache');
  });
});
