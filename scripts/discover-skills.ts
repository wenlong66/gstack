/**
 * Shared discovery for SKILL.md and .tmpl files.
 * Scans root + one level of subdirs, skipping node_modules/.git/dist.
 */

import * as fs from 'fs';
import * as path from 'path';

const SKIP = new Set(['node_modules', '.git', 'dist']);

function subdirs(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && !SKIP.has(d.name))
    .map(d => d.name);
}

export function discoverTemplates(root: string): Array<{ tmpl: string; output: string }> {
  const dirs = ['', ...subdirs(root)];
  const results: Array<{ tmpl: string; output: string }> = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md.tmpl` : 'SKILL.md.tmpl';
    if (fs.existsSync(path.join(root, rel))) {
      results.push({ tmpl: rel, output: rel.replace(/\.tmpl$/, '') });
    }
  }
  return results;
}

/**
 * Discover on-demand section templates: `<skill>/sections/*.md.tmpl`.
 *
 * Returns the relative tmpl path, its generated output path (`.tmpl` stripped),
 * and the owning skill directory so the generator can build a TemplateContext
 * with the PARENT skill's name (not "sections") — see processSectionTemplate.
 *
 * Scans one level of subdirs (same depth as discoverTemplates), looking only
 * inside a `sections/` child. Skills without a sections/ dir contribute nothing,
 * so this is a no-op for every skill that hasn't been carved.
 */
export function discoverSectionTemplates(
  root: string,
): Array<{ tmpl: string; output: string; skillDir: string }> {
  const results: Array<{ tmpl: string; output: string; skillDir: string }> = [];
  for (const dir of subdirs(root)) {
    const sectionsDir = path.join(root, dir, 'sections');
    if (!fs.existsSync(sectionsDir) || !fs.statSync(sectionsDir).isDirectory()) continue;
    for (const entry of fs.readdirSync(sectionsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md.tmpl')) continue;
      const rel = `${dir}/sections/${entry.name}`;
      results.push({ tmpl: rel, output: rel.replace(/\.tmpl$/, ''), skillDir: dir });
    }
  }
  // Deterministic order so CI freshness checks don't flap on FS iteration order.
  return results.sort((a, b) => a.tmpl.localeCompare(b.tmpl));
}

/**
 * Discover static files that live next to on-demand section templates.
 *
 * Generated `.md` files are deliberately excluded: they are derived from
 * `.md.tmpl` and must be rendered per host so path/tool rewrites stay current.
 * Static sidecars such as `manifest.json` are copied as-is.
 */
export function discoverSectionStaticFiles(
  root: string,
): Array<{ source: string; output: string; skillDir: string }> {
  const results: Array<{ source: string; output: string; skillDir: string }> = [];
  for (const dir of subdirs(root)) {
    const sectionsDir = path.join(root, dir, 'sections');
    if (!fs.existsSync(sectionsDir) || !fs.statSync(sectionsDir).isDirectory()) continue;
    for (const entry of fs.readdirSync(sectionsDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (entry.name.endsWith('.tmpl') || entry.name.endsWith('.md')) continue;
      const rel = `${dir}/sections/${entry.name}`;
      results.push({ source: rel, output: rel, skillDir: dir });
    }
  }
  return results.sort((a, b) => a.source.localeCompare(b.source));
}

function walkFiles(dir: string, visit: (filePath: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      walkFiles(fullPath, visit);
    } else if (entry.isFile()) {
      visit(fullPath);
    }
  }
}

function isSkillSupportFile(skillDir: string, relToSkill: string): boolean {
  if (!relToSkill.endsWith('.md')) return false;
  if (skillDir === 'review') return true;
  if (skillDir === 'qa') {
    return relToSkill.startsWith('templates/') || relToSkill.startsWith('references/');
  }
  if (skillDir === 'plan-devex-review') return relToSkill === 'dx-hall-of-fame.md';
  return false;
}

/**
 * Discover Markdown support files that should travel with generated skill dirs.
 *
 * The allowlist is intentionally narrow: large runtime assets such as bin/,
 * browse/dist/, design/dist/, and vendor code are installed through host runtime
 * roots/sidecars, and arbitrary planning docs must not leak into generated skill
 * bundles. Section bodies are rendered through discoverSectionTemplates() so
 * host rewrites and freshness checks remain accurate.
 */
export function discoverSkillSupportFiles(
  root: string,
): Array<{ source: string; output: string; skillDir: string }> {
  const results: Array<{ source: string; output: string; skillDir: string }> = [];
  for (const dir of subdirs(root)) {
    const skillRoot = path.join(root, dir);
    if (!fs.existsSync(path.join(skillRoot, 'SKILL.md.tmpl'))) continue;
    walkFiles(skillRoot, (filePath) => {
      const relToSkill = path.relative(skillRoot, filePath).replace(/\\/g, '/');
      if (relToSkill === 'SKILL.md' || relToSkill === 'SKILL.md.tmpl') return;
      if (relToSkill.startsWith('sections/')) return;
      if (!isSkillSupportFile(dir, relToSkill)) return;
      const rel = `${dir}/${relToSkill}`;
      results.push({ source: rel, output: rel, skillDir: dir });
    });
  }
  return results.sort((a, b) => a.source.localeCompare(b.source));
}

export function discoverSkillFiles(root: string): string[] {
  const dirs = ['', ...subdirs(root)];
  const results: string[] = [];
  for (const dir of dirs) {
    const rel = dir ? `${dir}/SKILL.md` : 'SKILL.md';
    if (fs.existsSync(path.join(root, rel))) {
      results.push(rel);
    }
  }
  return results;
}
