import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const [baseArg, fixture, outputArg = 'artifacts/theme-090', previewSiteName = 'WexaShelf'] = process.argv.slice(2);
const base = (baseArg || '').replace(/\/$/, '');
const target = new URL(base);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.protocol !== 'http:' || !fixture) throw Error('Use an isolated localhost PHP fixture and its private owner fixture JSON.');
const { adminPassword } = JSON.parse(await fs.readFile(fixture, 'utf8'));
assert.ok(adminPassword, 'Synthetic owner password is required.');
const seed = JSON.parse(await fs.readFile('php/resources/seed.json', 'utf8'));
const templates = new Set(['porcelain','ember','fieldnotes','signal','lilac','tide','copper','prism','index','velvet']);
const themes = seed.builtinThemes.filter(theme => templates.has(theme.template));
assert.equal(themes.length, 10);
const out = path.resolve(outputArg);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const admin = await browser.newPage();
const result = { generatedAt: new Date().toISOString(), base, previewSiteName, kind: 'Real PHP browser screenshots with synthetic published catalog', viewport: { width: 1440, height: 1000 }, themes: [], errors: [] };
async function settings() { const response = await admin.request.get(base + '/api/admin/settings'); assert.ok(response.ok()); return (await response.json()).settings; }
async function seo() { const response = await admin.request.get(base + '/api/admin/seo'); assert.ok(response.ok()); return (await response.json()).settings; }
async function activate(theme) { const old = await settings(); const response = await admin.request.post(base + '/api/admin/settings', { headers: { Origin: target.origin }, data: { ...old, theme } }); assert.ok(response.ok(), await response.text()); }
await admin.goto(base + '/admin');
await admin.getByLabel('Administrator password', { exact: true }).fill(adminPassword);
await admin.getByRole('button', { name: 'Sign in', exact: true }).click();
await admin.getByRole('button', { name: 'Themes & modules', exact: true }).waitFor();
const original = await settings();
const originalSeo = await seo();
try {
  const branded = await admin.request.post(base + '/api/admin/seo', { headers: { Origin: target.origin }, data: { ...originalSeo, siteName: previewSiteName } });
  assert.ok(branded.ok(), 'Set the synthetic preview identity');
  for (const theme of themes) {
    await activate(theme);
    const context = await browser.newContext({ viewport: result.viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const folder = path.resolve('public/themes', theme.id);
    await fs.mkdir(folder, { recursive: true });
    const row = { id: theme.id, name: theme.name, template: theme.template, checks: [] };
    try {
      for (const locale of ['en','tr']) {
        await page.setViewportSize(result.viewport);
        const response = await page.goto(base + '/' + locale, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        await expect(page.locator('.catalog-experience')).toHaveAttribute('data-template', theme.template);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await page.evaluate(() => document.fonts.ready);
        const icons = await page.locator('img.app-icon').evaluateAll(async images => ({ count: images.length, valid: (await Promise.all(images.map(async image => { try { await image.decode(); return image.naturalWidth > 0; } catch { return false; } }))).every(Boolean) }));
        assert.ok(icons.count > 0 && icons.valid, theme.id + ' app icons');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, theme.id + ' desktop overflow');
        const sections = await page.locator('[data-home-section]').evaluateAll(nodes => nodes.map(node => node.dataset.homeSection));
        const expected = theme.sections.filter(id => !({ toolbox: 'decision-tools', guides: 'migration-guides', workflows: 'workflow-collections' }[id]) || original.enabledPlugins.includes({ toolbox: 'decision-tools', guides: 'migration-guides', workflows: 'workflow-collections' }[id]));
        assert.deepEqual(sections, expected, theme.id + ' section order');
        if (locale === 'en') {
          const image = path.join(folder, 'screen.jpg');
          await page.screenshot({ path: image, type: 'jpeg', quality: 85, fullPage: true, animations: 'disabled' });
          const bytes = await fs.readFile(image);
          row.screenshot = { path: path.relative(process.cwd(), image), sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, height: await page.evaluate(() => document.documentElement.scrollHeight) };
          await fs.copyFile(path.resolve('public/themes', theme.id + '.json'), path.join(folder, 'theme.json'));
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
    try { const current = await settings(); const response = await admin.request.post(base + '/api/admin/settings', { headers: { Origin: target.origin }, data: { ...original, revision: current.revision } }); assert.ok(response.ok(), 'Restore original appearance'); result.restored = true; }
    catch (error) { result.errors.push(error.message); }
    try { const currentSeo = await seo(); const response = await admin.request.post(base + '/api/admin/seo', { headers: { Origin: target.origin }, data: { ...originalSeo, revision: currentSeo.revision } }); assert.ok(response.ok(), 'Restore original identity'); result.identityRestored = true; }
    catch (error) { result.errors.push(error.message); }
  } finally { await browser.close(); await fs.writeFile(path.join(out, 'screenshots.json'), JSON.stringify(result, null, 2) + '\n'); }
}
assert.deepEqual(result.errors, [], 'The fixture must be fully restored');
console.log('Captured', result.themes.length, 'real theme previews; original site appearance restored.');
