import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const destination = path.resolve(root, process.argv[2] || 'artifacts/theme-collection');
const ids = ['porcelain', 'ember', 'fieldnotes', 'signal', 'lilac-studio', 'tide', 'copper-desk', 'prism', 'index', 'velvet'];
const seed = JSON.parse(await readFile(path.join(root, 'php/resources/seed.json'), 'utf8'));
const stage = await mkdtemp(path.join(tmpdir(), 'wexashelf-themes-'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const record = { kind: 'Portable theme presets with real runtime screenshots', requires: 'WexaShelf source build containing all sixteen templates', themes: [], archives: [] };
await mkdir(destination, { recursive: true });

async function copy(source, target) {
  const from = path.join(root, source), to = path.join(stage, target);
  const stat = await lstat(from);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Expected regular source file: ${source}`);
  const bytes = await readFile(from);
  await mkdir(path.dirname(to), { recursive: true });
  await writeFile(to, bytes, { mode: 0o644 });
  await utimes(to, new Date('2000-01-01T00:00:00Z'), new Date('2000-01-01T00:00:00Z'));
  return { path: target, bytes: bytes.length, sha256: digest(bytes) };
}
async function archive(name, files) {
  const zip = path.join(stage, name);
  const result = spawnSync('zip', ['-X', '-q', zip, '-@'], { cwd: stage, input: [...files].sort().join('\n') + '\n', encoding: 'utf8', env: { ...process.env, TZ: 'UTC' } });
  assert.equal(result.status, 0, 'ZIP creation failed; install the system zip utility.');
  const check = spawnSync('unzip', ['-t', zip], { encoding: 'utf8' });
  assert.equal(check.status, 0, `ZIP integrity check failed: ${name}`);
  const bytes = await readFile(zip);
  await writeFile(path.join(destination, name), bytes);
  record.archives.push({ name, bytes: bytes.length, sha256: digest(bytes), entries: files.length });
}
try {
  const all = [];
  for (const id of ids) {
    const folder = `public/themes/${id}`;
    const theme = JSON.parse(await readFile(path.join(root, folder, 'theme.json'), 'utf8'));
    assert.equal(theme.id, id);
    assert.deepEqual(theme, JSON.parse(await readFile(path.join(root, 'public/themes', `${id}.json`), 'utf8')));
    assert.deepEqual(theme, seed.builtinThemes.find(candidate => candidate.id === id), `${id}: rebuild the PHP resources before packaging`);
    const screenshot = await readFile(path.join(root, folder, 'screen.jpg'));
    const dimensions = await sharp(screenshot).metadata();
    assert.equal(dimensions.format, 'jpeg');
    assert.equal(dimensions.width, 1440);
    assert.ok(dimensions.height >= 1000);
    const files = [];
    for (const file of ['theme.json', 'screen.jpg', 'README.md']) files.push(await copy(`${folder}/${file}`, `${id}/${file}`));
    for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) files.push(await copy(file, `${id}/${file}`));
    record.themes.push({ id, name: theme.name, template: theme.template, screenshot: { width: dimensions.width, height: dimensions.height }, files });
    const names = files.map(file => file.path);
    all.push(...names);
    await archive(`wexashelf-theme-${id}.zip`, names);
  }
  all.push((await copy('docs/THEME-COLLECTION.md', 'THEME-COLLECTION.md')).path);
  const guidePath = path.join(stage, 'THEME-COLLECTION.md');
  await writeFile(guidePath, (await readFile(guidePath, 'utf8')).replaceAll('../public/themes/', './'));
  await utimes(guidePath, new Date('2000-01-01T00:00:00Z'), new Date('2000-01-01T00:00:00Z'));
  all.push((await copy('docs/THEME-DEVELOPMENT.md', 'THEME-DEVELOPMENT.md')).path);
  all.push((await copy('docs/THEME-COLLECTION-VALIDATION.md', 'THEME-COLLECTION-VALIDATION.md')).path);
  await archive('wexashelf-ten-themes.zip', all);
  await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(record, null, 2) + '\n');
  console.log(`Packaged ${record.themes.length} separate themes and one collection in ${destination}. All ZIP integrity checks passed.`);
} finally { await rm(stage, { recursive: true, force: true }); }
