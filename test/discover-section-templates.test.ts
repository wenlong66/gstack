/**
 * Unit coverage for discoverSectionTemplates — the section-discovery half of the
 * v2 plan T9 pipeline. Drives it against a temp fixture tree so it doesn't
 * depend on which skills have been carved in the real repo.
 */

import { describe, test, expect, afterAll } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { discoverSectionStaticFiles, discoverSectionTemplates, discoverSkillSupportFiles } from '../scripts/discover-skills';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sections-disc-'));
afterAll(() => { try { fs.rmSync(root, { recursive: true, force: true }); } catch { /* noop */ } });

// ship/ has two section templates + a non-template file; review/ has none;
// hidden + node_modules dirs must be skipped by the shared subdirs() filter.
fs.mkdirSync(path.join(root, 'ship', 'sections'), { recursive: true });
fs.writeFileSync(path.join(root, 'ship', 'SKILL.md.tmpl'), '---\nname: ship\n---\nbody');
fs.writeFileSync(path.join(root, 'ship', 'sections', 'version-bump.md.tmpl'), 'bump');
fs.writeFileSync(path.join(root, 'ship', 'sections', 'changelog.md.tmpl'), 'changelog');
fs.writeFileSync(path.join(root, 'ship', 'sections', 'changelog.md'), 'generated changelog');
fs.writeFileSync(path.join(root, 'ship', 'sections', 'manifest.json'), '{}'); // not a .md.tmpl
fs.writeFileSync(path.join(root, 'ship', 'checklist.md'), 'checklist');
fs.mkdirSync(path.join(root, 'ship', 'specialists'), { recursive: true });
fs.writeFileSync(path.join(root, 'ship', 'specialists', 'testing.md'), 'testing');
fs.writeFileSync(path.join(root, 'ship', 'specialists', 'helper.ts'), 'not markdown');
fs.mkdirSync(path.join(root, 'review', 'specialists'), { recursive: true });
fs.writeFileSync(path.join(root, 'review', 'SKILL.md.tmpl'), '---\nname: review\n---\nbody');
fs.writeFileSync(path.join(root, 'review', 'checklist.md'), 'checklist');
fs.writeFileSync(path.join(root, 'review', 'specialists', 'testing.md'), 'testing');
fs.mkdirSync(path.join(root, 'qa', 'templates'), { recursive: true });
fs.mkdirSync(path.join(root, 'qa', 'references'), { recursive: true });
fs.writeFileSync(path.join(root, 'qa', 'SKILL.md.tmpl'), '---\nname: qa\n---\nbody');
fs.writeFileSync(path.join(root, 'qa', 'templates', 'qa-report-template.md'), 'template');
fs.writeFileSync(path.join(root, 'qa', 'references', 'issue-taxonomy.md'), 'taxonomy');
fs.mkdirSync(path.join(root, 'plan-devex-review'), { recursive: true });
fs.writeFileSync(path.join(root, 'plan-devex-review', 'SKILL.md.tmpl'), '---\nname: plan-devex-review\n---\nbody');
fs.writeFileSync(path.join(root, 'plan-devex-review', 'dx-hall-of-fame.md'), 'hall');
fs.mkdirSync(path.join(root, 'node_modules', 'sections'), { recursive: true });
fs.writeFileSync(path.join(root, 'node_modules', 'sections', 'x.md.tmpl'), 'nope');

describe('discoverSectionTemplates', () => {
  const found = discoverSectionTemplates(root);

  test('finds only *.md.tmpl files inside <skill>/sections/', () => {
    expect(found.map(f => f.tmpl)).toEqual([
      'ship/sections/changelog.md.tmpl',
      'ship/sections/version-bump.md.tmpl',
    ]);
  });

  test('strips .tmpl for the output path and records the owning skill dir', () => {
    const bump = found.find(f => f.tmpl.endsWith('version-bump.md.tmpl'))!;
    expect(bump.output).toBe('ship/sections/version-bump.md');
    expect(bump.skillDir).toBe('ship');
  });

  test('ignores non-template files (manifest.json) and skipped dirs (node_modules)', () => {
    expect(found.some(f => f.tmpl.includes('manifest.json'))).toBe(false);
    expect(found.some(f => f.tmpl.includes('node_modules'))).toBe(false);
  });

  test('returns deterministic (sorted) order', () => {
    const tmpls = found.map(f => f.tmpl);
    expect([...tmpls].sort()).toEqual(tmpls);
  });

  test('skills without a sections/ dir contribute nothing', () => {
    expect(found.some(f => f.skillDir === 'review')).toBe(false);
  });
});

describe('discoverSectionStaticFiles', () => {
  const found = discoverSectionStaticFiles(root);

  test('finds static section sidecars', () => {
    expect(found.map(f => f.source)).toEqual(['ship/sections/manifest.json']);
  });

  test('does not treat generated markdown or templates as static sidecars', () => {
    expect(found.some(f => f.source.endsWith('.md'))).toBe(false);
    expect(found.some(f => f.source.endsWith('.tmpl'))).toBe(false);
  });

  test('records the owning skill dir', () => {
    expect(found[0].skillDir).toBe('ship');
  });
});

describe('discoverSkillSupportFiles', () => {
  const found = discoverSkillSupportFiles(root);

  test('finds Markdown support files outside sections/', () => {
    expect(found.map(f => f.source)).toEqual([
      'plan-devex-review/dx-hall-of-fame.md',
      'qa/references/issue-taxonomy.md',
      'qa/templates/qa-report-template.md',
      'review/checklist.md',
      'review/specialists/testing.md',
    ]);
  });

  test('ignores generated sections, templates, non-Markdown files, and unallowlisted docs', () => {
    expect(found.some(f => f.source.includes('sections/'))).toBe(false);
    expect(found.some(f => f.source.endsWith('.tmpl'))).toBe(false);
    expect(found.some(f => f.source.endsWith('.ts'))).toBe(false);
    expect(found.some(f => f.source.startsWith('ship/'))).toBe(false);
  });

  test('records the owning skill dir for nested files', () => {
    const specialist = found.find(f => f.source.endsWith('specialists/testing.md'))!;
    expect(specialist.skillDir).toBe('review');
  });
});
