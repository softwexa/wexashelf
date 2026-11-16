import { test, expect, type Page } from '@playwright/test';

const baseURL = process.env.ADMIN_E2E_BASE_URL;
const password = process.env.ADMIN_E2E_PASSWORD;
test.use({ baseURL: baseURL || 'http://127.0.0.1:3199' });
test.skip(!baseURL || !password, 'Requires explicitly isolated admin test server.');
test.setTimeout(90000);
test.beforeEach(async ({ page }) => { page.setDefaultTimeout(15000); });
async function login(page: Page) {
  // This suite explicitly exercises the Turkish admin pack; English is the default.
  await page.addInitScript(() => localStorage.setItem('wexashelf.admin.locale', 'tr'));
  await page.goto('/admin');
  await page.getByLabel('Yönetici parolası').fill(password!);
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'İçeriğin kontrolü sende.' })).toBeVisible();
}

test('six gallery layouts persist without losing saved apps, collections or plugins', async ({ page }) => {
  await page.goto('/kesfet');
  await page.getByRole('button', { name: 'Notion kaydet', exact: true }).click();
  await page.goto('/kaydedilenler');
  await page.getByLabel('Koleksiyon adı', { exact: true }).fill('Tema boyunca');
  await page.getByRole('button', { name: 'Kaydettiklerimle oluştur' }).click();
  await page.getByLabel('Tema boyunca notu').fill('Korunan not');
  await page.goto('/ayarlar');
  await page.getByRole('switch', { name: 'Karar araçları', exact: true }).click();
  const themes = [
    ['Gece Rotaları', 'night', 'Telefonundan bilgisayarına'],
    ['Kobalt Atlas', 'atlas', 'Bir ihtiyacın var. Doğru aracı bulalım.'],
    ['İş Akışı Haritası', 'workflow', 'Dağınık işleri, sakin bir akışa dönüştür.'],
    ['Canlı Katalog', 'catalog', 'Gününe iyi gelecek bir uygulama.'],
    ['Editoryal Masa', 'magazine', 'Bağlamı oku. Araçlarını seç.'],
    ['Kompakt Dizin', 'directory', 'Uygulamayı bul. Ayrıntıları incele.'],
  ];
  for (const [name, template, heading] of themes) {
    await page.goto('/ayarlar');
    const choose = page.getByRole('button', { name: new RegExp(`^Temayı kullan\\s*:\\s*${name}$`) });
    if (await choose.count()) await choose.click();
    else await expect(page.getByRole('button', { name: new RegExp(`^Etkin tema\\s*:\\s*${name}$`) })).toBeVisible();
    await page.goto('/tr');
    await expect(page.locator('.catalog-experience')).toHaveAttribute('data-template', template);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    // A rendered card can still hide a broken asset path (Apache reserves /icons/).
    // Decode every real image so a visually present card cannot mask HTTP 404s.
    const icons = await page.locator('img.app-icon').evaluateAll(async images => {
      const loaded = await Promise.all(images.map(async image => {
        const img = image as HTMLImageElement;
        try { await img.decode(); } catch { return false; }
        return img.naturalWidth > 0 && img.naturalHeight > 0;
      }));
      return { count: images.length, loaded: loaded.every(Boolean) };
    });
    expect(icons.count).toBeGreaterThan(0);
    expect(icons.loaded).toBe(true);
    await page.reload();
    await expect(page.locator('.catalog-experience')).toHaveAttribute('data-template', template);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole('heading', { name: 'Karar vermek kolaylaşsın', exact: true })).toHaveCount(0);
    if(template==='directory'){const table=page.getByRole('region',{name:'Uygulama dizini tablosu',exact:true});await table.focus();await expect(table).toBeFocused();expect(await table.evaluate(element=>element.scrollWidth>element.clientWidth)).toBe(true);}
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await page.goto('/kaydedilenler');
  await expect(page.locator('.catalog-card h2')).toHaveText('Notion');
  await expect(page.getByLabel('Tema boyunca notu')).toHaveValue('Korunan not');
  await expect(page.locator('.collection-grid').getByRole('link', { name: 'Notion', exact: true })).toBeVisible();
  await page.goto('/ayarlar');
  await expect(page.getByRole('switch', { name: 'Karar araçları', exact: true })).toHaveAttribute('aria-checked', 'false');
});

test('admin gallery selection is only global after activation', async ({ page, browser }) => {
  await login(page);
  const original = (await (await page.request.get('/api/admin/settings')).json()).settings;
  const visitor = await browser.newContext();
  try {
    await page.getByRole('button', { name: 'Site görünümü', exact: true }).click();
    await page.getByRole('button', { name: /^Taslağa al\s*:\s*Kobalt Atlas$/ }).click();
    expect((await (await page.request.get('/api/admin/settings')).json()).settings).toEqual(original);
    const fresh = await visitor.newPage();
    await fresh.goto(baseURL! + '/tr');
    await expect(fresh.locator('.catalog-experience')).toHaveAttribute('data-theme', original.theme.id);
    await page.getByRole('button', { name: 'Sitede etkinleştir', exact: true }).click();
    await expect(page.locator('.admin-appearance .admin-success[role="status"]')).toContainText('Site görünümü etkinleştirildi');
    await fresh.reload();
    await expect(fresh.locator('.catalog-experience')).toHaveAttribute('data-template', 'atlas');
    expect((await (await page.request.get('/api/admin/settings')).json()).settings.enabledPlugins).toEqual(original.enabledPlugins);
  } finally {
    const current = (await (await page.request.get('/api/admin/settings')).json()).settings;
    expect((await page.request.post('/api/admin/settings', { headers: { Origin: baseURL! }, data: { ...original, revision: current.revision } })).ok()).toBe(true);
    await visitor.close();
  }
});

test('store identity form rejects mismatches and duplicate identities, saves with revision conflict protection', async ({ page }) => {
  await login(page);
  const record = (await (await page.request.get('/api/admin')).json()).records.find((r: { id: string }) => r.id === 'notion');
  try {
    await page.getByRole('button', { name: 'İçerikler', exact: true }).click();
    await page.locator('.admin-record-list button').filter({ has: page.getByText('notion', { exact: true }) }).click();
    while (await page.getByRole('button', { name: 'Kimliği kaldır', exact: true }).count()) await page.getByRole('button', { name: 'Kimliği kaldır', exact: true }).first().click();
    const add = async () => {
      await page.getByRole('button', { name: 'Mağaza kimliği ekle', exact: true }).click();
      const field = page.locator('fieldset').filter({ has: page.getByText(/Mağaza kimliği \d+/) }).last();
      await field.getByLabel('Mağaza kimliği', { exact: true }).fill('123456789');
      await field.getByLabel('Kontrol tarihi').fill('2026-01-01');
      await field.getByLabel('Resmî mağaza ürün URL’si').fill('https://apps.apple.com/tr/app/id123456789');
      return field;
    };
    const first = await add();
    await first.getByLabel('Mağaza kimliği', { exact: true }).fill('987654321');
    await page.getByRole('button', { name: 'Kaydı kaydet', exact: true }).click();
    await expect(page.locator('.admin-error[role="alert"]')).toBeVisible();
    await first.getByRole('button', { name: 'URL’den aday kimliği al' }).click();
    await expect(first.getByLabel('Mağaza kimliği', { exact: true })).toHaveValue('123456789');
    await add();
    await page.getByRole('button', { name: 'Kaydı kaydet', exact: true }).click();
    await expect(page.locator('.admin-error[role="alert"]')).toBeVisible();
    await page.getByRole('button', { name: 'Kimliği kaldır', exact: true }).last().click();
    await page.getByRole('button', { name: 'Kaydı kaydet', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Kayıt kaydedildi');
    const saved = (await (await page.request.get('/api/admin')).json()).records.find((r: { id: string }) => r.id === 'notion');
    expect(saved.data.storeIds[0].storeId).toBe('123456789');
    expect(saved.revision).toBe(record.revision + 1);
    expect((await page.request.post('/api/admin/records', { headers: { Origin: baseURL! }, data: record })).status()).toBe(409);
  } finally {
    const current = (await (await page.request.get('/api/admin')).json()).records.find((r: { id: string }) => r.id === 'notion');
    expect((await page.request.post('/api/admin/records', { headers: { Origin: baseURL! }, data: { ...record, revision: current.revision } })).ok()).toBe(true);
  }
});

test('refresh authorization is real; mocked provider UI preserves pending, conflict and error semantics', async ({ page, request }) => {
  expect((await request.get('/api/admin/refresh')).status()).toBe(401);
  expect((await request.post('/api/admin/refresh', { data: { action: 'fetch', appId: 'notion', country: 'TR' } })).status()).toBe(403);
  await login(page);
  const original = (await (await page.request.get('/api/admin')).json()).records.find((r: { id: string }) => r.id === 'notion');
  let candidates: Record<string, unknown>[] = [];
  let jobs: Record<string, unknown>[] = [];
  let conflict = true;
  let failFetch = false;
  await page.route(/\/api\/admin\/refresh(?:\?.*)?$/, async route => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill({ json: { candidates, jobs, freshness: [], providers: { ios: 'UI fixture', android: 'manual', windows: 'manual' } } });
    const body = req.postDataJSON();
    if (body.action === 'queue') {
      jobs = [{id: body.requestId, appId: 'notion', providerId: body.providerId, platform: body.platform, country: body.country, status: failFetch ? 'failed' : 'completed', error: failFetch ? 'Sentetik sağlayıcı hatası' : undefined}];
      candidates = [{ id: 'ui-fixture', appId: 'notion', baseRevision: original.revision, status: failFetch ? 'error' : 'pending', error: failFetch ? 'Sentetik sağlayıcı hatası' : undefined, source: 'UI integration fixture; no live provider', createdAt: '2026-01-01', updatedAt: '2026-01-01', before: {}, after: { storeMetrics: [] }, diff: ['storeMetrics'] }];
      if (failFetch) candidates = [];
      return route.fulfill({json: {job: jobs[0]}});
    } else if (body.action === 'apply' && conflict) return route.fulfill({ status: 409, json: { error: 'Revision conflict' } });
    else candidates[0].status = body.action === 'apply' ? 'applied' : 'dismissed';
    return route.fulfill({ json: candidates[0] });
  });
  await page.getByRole('button', { name: 'Kaynak bakımı', exact: true }).click();
  await page.getByRole('combobox', { name: 'Uygulama', exact: true }).selectOption('notion');
  await page.getByRole('button', { name: 'Kaynak gözlemini sıraya al' }).click();
  await page.getByRole('button', { name: 'Kaynak işlerini yenile' }).click();
  await expect(page.getByText('İnceleme bekliyor', { exact: true })).toBeVisible();
  expect((await (await page.request.get('/api/admin')).json()).records.find((r: { id: string }) => r.id === 'notion')).toEqual(original);
  await page.getByRole('button', { name: 'Kaynak değişikliklerini uygula' }).click();
  await expect(page.locator('.admin-error[role="alert"]')).toContainText('Üzerine yazılmadı');
  conflict = false;
  await page.getByRole('button', { name: 'Kaynak değişikliklerini uygula' }).click();
  await expect(page.getByText('Uygulandı', { exact: true })).toBeVisible();
  failFetch = true;
  await page.getByRole('button', { name: 'Kaynak gözlemini sıraya al' }).click();
  await page.getByRole('button', { name: 'Kaynak işlerini yenile' }).click();
  await expect(page.getByText('Sentetik sağlayıcı hatası', {exact: true})).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kaynak değişikliklerini uygula' })).toHaveCount(0);
});

test('publisher directory searches, navigates to apps and rejects unknown slugs', async ({ page }) => {
  await page.goto('/yayincilar');
  await expect(page.getByRole('heading', { name: 'Yayıncılar', exact: true })).toBeVisible();
  await page.getByLabel('Yayıncı ara').fill('no-such-publisher-xyz');
  // The bounded PHP directory searches the full catalog with a GET form.
  if (await page.getByRole('button', { name: 'Yayıncı ara', exact: true }).count()) await page.getByRole('button', { name: 'Yayıncı ara', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('0 yayıncı');
  await page.locator('form').filter({ has: page.getByLabel('Yayıncı ara') }).getByRole('button', { name: 'Aramayı temizle', exact: true }).click();
  if (await page.getByRole('button', { name: 'Yayıncı ara', exact: true }).count()) await page.getByRole('button', { name: 'Yayıncı ara', exact: true }).click();
  await page.locator('a[href^="/yayinci/"]').first().click();
  await page.locator('a[href^="/uygulama/"]').first().click();
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('a[href^="/yayinci/"]').first().click();
  await expect(page.getByRole('link', { name: '← Tüm yayıncılar' })).toBeVisible();
  expect((await page.goto('/yayinci/no-such-publisher-xyz'))?.status()).toBe(404);
});
