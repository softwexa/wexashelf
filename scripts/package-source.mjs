import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const archiveName=`wexashelf-source-${version}.zip`;
const output = path.join(root, 'artifacts/releases');
const roots = ['src', 'tests', 'examples', 'documents', 'public/artwork', 'public/icons', 'public/themes', 'php/app', 'php/cli', 'php/client', 'php/public', 'php/resources', 'php/tests'];
const files = ['scripts/verify-source-build.mjs', 'scripts/verify-release-hosting.mjs', 'scripts/prepare-release-mysql.mjs','docs/INSTALL-OPERATIONS.md','docs/DISTRIBUTION-ACCEPTANCE.md','docs/IMAGE-CONTENT.md','docs/ARTICLE-CONTENT.md','AGENTS.md','CLAUDE.md','.github/CODEOWNERS','.github/copilot-instructions.md','.github/PULL_REQUEST_TEMPLATE.md','.github/ISSUE_TEMPLATE/bug_report.md','.github/ISSUE_TEMPLATE/feature_request.md','.github/ISSUE_TEMPLATE/translation.md','.github/ISSUE_TEMPLATE/theme_module.md','scripts/check-locales.mjs','docs/TRANSLATING.md','docs/THEME-DEVELOPMENT.md','docs/THEME-COLLECTION.md','docs/THEME-COLLECTION-VALIDATION.md','docs/MODULE-DEVELOPMENT.md','docs/MULTILINGUAL-SEO.md','docs/GROWTH-EDITORIAL.md','docs/UPGRADING.md','docs/ACCOUNT-SECURITY.md','docs/BACKUP-RECOVERY.md','docs/AI-CONTENT.md','docs/CRON-WORKERS.md','docs/CATALOG-SCALING.md','docs/STORE-SOURCES.md','scripts/verify-catalog-scale.mjs','docs/AI_SAGLAYICILAR.md','LICENSE', 'php/.htaccess', 'php/storage/.htaccess', 'php/storage/index.php', 'package.json', 'package-lock.json', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md',
  'THIRD_PARTY_NOTICES.md', '.env.example', '.gitignore', '.gitattributes', '.dockerignore', 'Dockerfile', 'compose.yaml',
  'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'playwright.config.ts',
  'scripts/capture-theme-previews.mjs', 'scripts/package-themes.mjs', 'scripts/performance-audit.mjs', 'docs/SCHEMA-REPORT.md', 'docs/PERFORMANCE-AUDIT-REPORT.md','docs/RELEASE-0.7.0-VALIDATION.md','docs/RELEASE-0.7.1-VALIDATION.md','docs/RELEASE-0.8.0-VALIDATION.md','docs/IMPLEMENTATION-0.7.0.json','docs/IMPLEMENTATION-0.7.1.json', 'scripts/build-php.mjs', 'scripts/public-locales.mjs', 'scripts/performance-cohort-070.mjs','scripts/performance-cohort.mjs', 'scripts/package-php.mjs', 'scripts/test-release-package.mjs', 'docs/KURULUM_CPANEL.md', 'scripts/admin-init.ts', 'scripts/check-runtime.mjs', 'scripts/package-source.mjs',
  'docs/APP-SUBMISSIONS.md','docs/APP-SUBMISSIONS-VALIDATION.md','docs/ADMIN-INTERFACE.md', 'docs/editorial-seed.json', 'docs/KATALOG_ORNEKLERI.md', 'docs/VERI_VE_YONETIM.md',
  'docs/YEREL_DAGITIM.md', 'docs/TEMA_VE_EKLENTI_REHBERI.md', 'docs/EDITORIAL_KAYNAKLAR.md',
  'docs/AI_VE_SEO.md', 'docs/ACIK_KAYNAK_YAYIN.md', 'docs/UYGULAMA_DURUMU.md'];
const forbidden = /(^|\/)(?:\.git|\.local|private|node_modules|\.next[^/]*|artifacts|backups|AGENTS(?:\.override)?\.md|CLAUDE\.local\.md|\.claude|\.codex|\.codex-log|\.DS_Store)(\/|$)|(?:\.sqlite(?:-shm|-wal)?|\.tsbuildinfo|\.bak|\.log|\.pem|\.key|~)$/i;
function validate(relative) {
  if (path.isAbsolute(relative) || relative.split('/').includes('..') || /[\r\n\\]/.test(relative) || (relative !== 'AGENTS.md' && forbidden.test(relative)) ||
      (relative !== 'php/app/Config.php' && /(^|\/)(?:config\.php|install\.lock|install\.key|ai-settings\.json(?:\.lock)?|ai-settings\.lock)$/i.test(relative)) ||
      (relative.startsWith('php/storage/') && !['php/storage/.htaccess', 'php/storage/index.php'].includes(relative)) ||
      relative.split('/').some(p => p.startsWith('.env') && relative !== '.env.example')) {
    throw new Error(`Disallowed source path: ${relative}`);
  }
}
async function walk(relative) {
  validate(relative);
  const stat = await lstat(path.join(root, relative));
  if (stat.isSymbolicLink()) throw new Error(`Symlink rejected: ${relative}`);
  if (stat.isDirectory()) {
    for (const name of (await readdir(path.join(root, relative))).sort()) await walk(`${relative}/${name}`);
  } else if (stat.isFile()) files.push(relative);
  else throw new Error(`Unsupported source entry: ${relative}`);
}
for (const dir of roots) await walk(dir);
// Prebuilt browser assets contain dependencies: preserve their license texts.
const bundledLicenses = [];
for (const pkg of ['react', 'react-dom', 'scheduler', 'web-vitals', 'lucide-react', '@fontsource/ibm-plex-sans']) {
  const location = `node_modules/${pkg}`;
  const names = (await readdir(path.join(root, location))).filter(name => /^(?:LICENSE|LICENCE|OFL)(?:\.|$)/i.test(name));
  if (!names.length) throw new Error(`Missing bundled dependency license: ${pkg}`);
  for (const name of names) bundledLicenses.push({ source: `${location}/${name}`, target: `licenses/${pkg.replaceAll('/', '_')}/${name}` });
}

const ordered = [...new Set(files)].sort();
const stage = await mkdtemp(path.join(tmpdir(), 'wexashelf-source-'));
try {
  const manifestFiles = [];
  for (const relative of ordered) {
    validate(relative);
    const stat = await lstat(path.join(root, relative));
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular file: ${relative}`);
    const bytes = await readFile(path.join(root, relative));
    // Fail closed for accidentally populated sample credentials; never log values.
    if (relative === '.env.example' && /^[\t ]*(?:ADMIN_PASSWORD|[A-Z_]*(?:SECRET|TOKEN|PASSWORD|KEY))[\t ]*=[\t ]*[^\s#]/m.test(bytes.toString())) {
      throw new Error('Sample environment contains a credential value; remove it before packaging.');
    }
    const target = path.join(stage, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { mode: 0o644 });
    await utimes(target, new Date('2000-01-01T00:00:00Z'), new Date('2000-01-01T00:00:00Z'));
    manifestFiles.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  for (const {source, target} of bundledLicenses) {
    const stat = await lstat(path.join(root, source));
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Invalid license file: ${source}`);
    const bytes = await readFile(path.join(root, source));
    await mkdir(path.dirname(path.join(stage, target)), {recursive:true});
    await writeFile(path.join(stage, target), bytes, {mode:0o644});
    await utimes(path.join(stage, target), new Date('2000-01-01T00:00:00Z'), new Date('2000-01-01T00:00:00Z'));
    ordered.push(target);
    manifestFiles.push({path:target, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  ordered.sort();
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  const dependencies = [];
  for (const [location, locked] of Object.entries(lock.packages ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (!location.startsWith('node_modules/')) continue;
    let installed;
    try { installed = JSON.parse(await readFile(path.join(root, location, 'package.json'), 'utf8')); }
    catch { /* Optional/platform packages may be absent. */ }
    dependencies.push({ package: installed?.name ?? location.split('node_modules/').at(-1), version: locked.version,
      license: installed?.license ?? locked.license ?? 'UNKNOWN: review required',
      evidence: installed ? 'installed package.json' : 'package-lock.json', location });
  }
  await mkdir(output, { recursive: true });
  const archive = path.join(stage, archiveName);
  const zipped = spawnSync('zip', ['-X', '-q', archive, '-@'], {
    cwd: stage, input: ordered.join('\n') + '\n', encoding: 'utf8', env: { ...process.env, TZ: 'UTC' }
  });
  if (zipped.error || zipped.status !== 0) throw new Error('Source ZIP creation failed; install the system zip utility.');
  const zipBytes = await readFile(archive);
  await writeFile(path.join(output, archiveName), zipBytes);
  await writeFile(path.join(output, 'source-manifest.json'), JSON.stringify({
    status: 'LOCAL_SOURCE_PACKAGE_MIT', archive: archiveName,
    archiveSha256: createHash('sha256').update(zipBytes).digest('hex'), files: manifestFiles,
    policy: { roots, explicitFiles: files.filter(p => !roots.some(r => p.startsWith(`${r}/`))).sort(),
      excluded: ['private data and credentials including AI provider settings and locks', 'environment files except .env.example', 'Node dependency directories; PHP browser bundles and license texts included',
        'Git history and non-public local agent instructions; root contributor AGENTS.md is intentionally included', 'original design mockups', 'backups and artifacts', 'non-curated internal docs'],
      symlinks: 'rejected', dependenciesVendored: false, browserDependenciesBundled: true, licenseSelected: true, projectLicense: 'MIT', publisherIconsIncluded: true, iconRightsSeparate: true }
  }, null, 2) + '\n');
  await writeFile(path.join(output, 'dependency-license-inventory.json'), JSON.stringify({
    notice: 'Metadata inventory only; not a legal clearance or complete license-text bundle. Node dependency directories are not vendored; prebuilt browser dependencies and their license texts are included.', dependencies
  }, null, 2) + '\n');
  console.log(`Created local MIT source package: ${path.join(output, archiveName)} (${ordered.length} files)`);
} finally { await rm(stage, { recursive: true, force: true }); }
