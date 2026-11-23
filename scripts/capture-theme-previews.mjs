import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Usage: node scripts/capture-theme-previews.mjs BASE OWNER_FIXTURE_JSON|- [EVIDENCE_DIR] [SYNTHETIC_SITE_NAME]
// '-' requires an already branded localhost fixture; every browser request is GET/HEAD-only.
const [baseArg, fixture, outputArg = 'artifacts/theme-090', previewSiteName = 'WexaShelf'] = process.argv.slice(2);
const base = (baseArg || '').replace(/\/$/, '');
const target = new URL(base);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.protocol !== 'http:' || !fixture) throw Error('Use an isolated localhost PHP fixture with its private owner JSON, or - for an already branded read-only fixture.');
const readOnly = fixture === '-';
const { adminPassword } = readOnly ? {} : JSON.parse(await fs.readFile(fixture, 'utf8'));
if (!readOnly) assert.ok(adminPassword, 'Synthetic owner password is required.');
const seed = JSON.parse(await fs.readFile('php/resources/seed.json', 'utf8'));
const themes = seed.builtinThemes;
assert.ok(themes.length > 0);
assert.equal(new Set(themes.map(theme => theme.id)).size, themes.length, 'Unique registered preset IDs');
const defaultSections = ['discovery', 'weekly', 'trending', 'toolbox', 'guides', 'workflows'];
const out = path.resolve(outputArg);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const admin = await browser.newPage();
const result = { generatedAt: new Date().toISOString(), base, previewSiteName, kind: 'Real PHP browser screenshots with synthetic published catalog', readOnly, viewport: { width: 1440, height: 1000 }, themes: [], errors: [] };
async function settings() { const response = await admin.request.get(base + '/api/admin/settings'); assert.ok(response.ok()); return (await response.json()).settings; }
async function seo() { const response = await admin.request.get(base + '/api/admin/seo'); assert.ok(response.ok()); return (await response.json()).settings; }
try {
let original, originalSeo;
async function publicState() {
  const response = await admin.goto(base + '/en', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  return admin.locator('#wexa-bootstrap').evaluate(node => { const data = JSON.parse(node.textContent); return { settings: data.catalog.siteSettings, siteName: data.siteName }; });
}
if (readOnly) {
  await admin.context().route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
  const state = await publicState();
  assert.equal(state.siteName, previewSiteName, 'Read-only mode requires an already branded synthetic fixture');
  original = state.settings; originalSeo = { siteName: state.siteName };
} else {
  await admin.goto(base + '/admin');
  await admin.getByLabel('Administrator password', { exact: true }).fill(adminPassword);
  await admin.getByRole('button', { name: 'Sign in', exact: true }).click();
  await admin.getByRole('button', { name: 'Themes & modules', exact: true }).waitFor();
  original = await settings(); originalSeo = await seo();
}
try {
  if (originalSeo.siteName !== previewSiteName) {
    result.identityChanged = true;
    const branded = await admin.request.post(base + '/api/admin/seo', { headers: { Origin: target.origin }, data: { ...originalSeo, siteName: previewSiteName } });
    assert.ok(branded.ok(), 'Set the synthetic preview identity');
  }
  for (const theme of themes) {
    const context = await browser.newContext({ viewport: result.viewport, reducedMotion: 'reduce' });
    await context.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
    await context.addInitScript(theme => {
      localStorage.setItem('app-guide.theme.v1', JSON.stringify(theme));
      localStorage.setItem('app-guide.theme.override.v1', 'true');
    }, theme);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const folder = path.resolve('public/themes', theme.id);
    await fs.mkdir(folder, { recursive: true });
    const row = { id: theme.id, name: theme.name, template: theme.template || 'night', checks: [] };
    try {
      for (const locale of ['en','tr']) {
        await page.setViewportSize(result.viewport);
        const response = await page.goto(base + '/' + locale, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        await expect(page.locator('.catalog-experience')).toHaveAttribute('data-template', theme.template || 'night');
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('.catalog-experience')).toHaveAttribute('data-theme', theme.id);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 850) { scrollTo(0, y); await new Promise(resolve => setTimeout(resolve, 50)); }
          scrollTo(0, 0);
        });
        const icons = await page.locator('img.app-icon').evaluateAll(async images => ({ count: images.length, valid: (await Promise.all(images.map(async image => { try { await image.decode(); return image.naturalWidth > 0; } catch { return false; } }))).every(Boolean) }));
        assert.ok(icons.count > 0 && icons.valid, theme.id + ' app icons');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, theme.id + ' desktop overflow');
        const sections = await page.locator('[data-home-section]').evaluateAll(nodes => nodes.map(node => node.dataset.homeSection));
        const expected = (theme.sections || defaultSections).filter(id => !({ toolbox: 'decision-tools', guides: 'migration-guides', workflows: 'workflow-collections' }[id]) || original.enabledPlugins.includes({ toolbox: 'decision-tools', guides: 'migration-guides', workflows: 'workflow-collections' }[id]));
        assert.deepEqual(sections, expected, theme.id + ' section order');
        if (locale === 'en') {
          const preview = path.join(folder, 'preview.jpg');
          await page.screenshot({ path: preview, type: 'jpeg', quality: 88, fullPage: false, animations: 'disabled' });
          const previewBytes = await fs.readFile(preview);
          row.preview = { path: path.relative(process.cwd(), preview), sha256: crypto.createHash('sha256').update(previewBytes).digest('hex'), bytes: previewBytes.length, ...result.viewport };
          const image = path.join(folder, 'screen.jpg');
          await page.screenshot({ path: image, type: 'jpeg', quality: 85, fullPage: true, animations: 'disabled' });
          const bytes = await fs.readFile(image);
          row.screenshot = { path: path.relative(process.cwd(), image), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, height: await page.evaluate(() => document.documentElement.scrollHeight) };
          const manifest = path.resolve('public/themes', theme.id + '.json');
          try {
            const portable = JSON.parse(await fs.readFile(manifest, 'utf8'));
            assert.equal(portable.id, theme.id, 'Portable manifest must match registered preset');
            assert.equal(portable.template || 'night', theme.template || 'night');
            const transport = path.join(folder, 'theme.json');
            await fs.access(transport);
            await fs.copyFile(manifest, transport);
          } catch (error) { if (error.code !== 'ENOENT') throw error; }
          const mirror = path.resolve('php/public/themes', theme.id);
          await fs.mkdir(mirror, { recursive: true });
          for (const imageName of ['preview.jpg', 'screen.jpg']) await fs.copyFile(path.join(folder, imageName), path.join(mirror, imageName));
        }
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, theme.id + ' mobile overflow');
        await expect(page.locator('.mobile-brand')).toBeVisible();
        assert.ok((await page.locator('.mobile-brand').innerText()).trim() || await page.locator('.mobile-brand img').count(), theme.id + ' mobile site identity');
        await page.screenshot({ path: path.join(out, theme.id + '-' + locale + '-mobile.jpg'), type: 'jpeg', quality: 82, fullPage: true, animations: 'disabled' });
        row.checks.push({ locale, desktopOverflow: false, mobileOverflow: false, iconCount: icons.count, iconsDecoded: icons.valid, sections });
      }
      assert.deepEqual(errors, [], theme.id + ' browser errors');
      result.themes.push(row);
      console.log('PASS', theme.id, row.screenshot.height, 'px; EN/TR, desktop/mobile, icons and section order');
    } finally { await context.close(); }
  }
} finally {
  try {
    try { const current = readOnly ? (await publicState()).settings : await settings(); assert.deepEqual(current, original, 'Browser overrides must leave site appearance unchanged'); result.restored = true; }
    catch (error) { result.errors.push(error.message); }
    try {
      const currentSeo = readOnly ? { siteName: (await publicState()).siteName } : await seo();
      if (result.identityChanged) {
        const response = await admin.request.post(base + '/api/admin/seo', { headers: { Origin: target.origin }, data: { ...originalSeo, revision: currentSeo.revision } });
        assert.ok(response.ok(), 'Restore original identity');
      } else assert.deepEqual(currentSeo, originalSeo, 'Synthetic identity unchanged');
      result.identityRestored = true;
    }
    catch (error) { result.errors.push(error.message); }
  } finally { await fs.writeFile(path.join(out, 'screenshots.json'), JSON.stringify(result, null, 2) + '\n'); }
}
assert.deepEqual(result.errors, [], 'The fixture must be fully restored');
console.log('Captured', result.themes.length, 'real theme previews; original site appearance restored.');

} finally { await browser.close(); }
