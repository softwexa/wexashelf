import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const sampleTheme = JSON.parse(
  readFileSync("examples/themes/kobalt.json", "utf8"),
);

test("search combines platform and category, then recovers from empty results", async ({
  page,
}) => {
  await page.goto("/kesfet");
  await expect(page.locator(".catalog-card")).toHaveCount(10);
  await page.getByRole("button", { name: "iOS", exact: true }).click();
  await expect(page.locator(".catalog-card")).toHaveCount(8);
  await page.getByLabel("Uygulama veya ihtiyaç ara").fill("PDF");
  await expect(page.locator(".catalog-card")).toHaveCount(2);
  await page.getByLabel("Uygulama veya ihtiyaç ara").press("Enter");
  await expect(page).toHaveURL(/q=PDF&platform=ios/);
  await page.reload();
  await expect(page.locator(".catalog-card")).toHaveCount(2);
  await page
    .getByLabel("Uygulama veya ihtiyaç ara")
    .fill("bulunmayan uygulama xyz");
  await expect(
    page.getByRole("heading", { name: "Bu filtrelerle uygulama bulunamadı." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Filtreleri temizle" }).click();
  await expect(page.locator(".catalog-card")).toHaveCount(10);
  await page
    .locator(".category-filters")
    .getByRole("button", { name: "Medya", exact: true })
    .click();
  await expect(page.locator(".catalog-card")).toHaveCount(2);
});

test("saved apps survive reload and navigation", async ({ page }) => {
  await page.goto("/kesfet");
  await page
    .getByRole("button", { name: "Notion kaydet", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Notion kaydını kaldır", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.getByRole("link", { name: /Kaydedilenler/ }).click();
  await expect(page.locator(".catalog-card")).toHaveCount(1);
  await expect(page.locator(".catalog-card h2")).toHaveText("Notion");
  await page
    .getByRole("button", { name: "Notion kaydını kaldır", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "İlk uygulamanı kaydet." }),
  ).toBeVisible();
});

test("comparison uses selected apps and enforces four-app limit", async ({
  page,
}) => {
  await page.goto("/tr");
  await page
    .getByRole("link", { name: "Notion ve Obsidian’ı karşılaştır" })
    .click();
  await expect(page.locator(".comparison-table thead th")).toHaveCount(3);
  await page
    .locator(".compare-picker")
    .getByRole("button", { name: "Todoist", exact: true })
    .click();
  await page
    .locator(".compare-picker")
    .getByRole("button", { name: "TickTick", exact: true })
    .click();
  await page
    .locator(".compare-picker")
    .getByRole("button", { name: "VLC", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("en fazla 4 uygulamayı");
  await expect(page.locator(".comparison-table thead th")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Obsidian karşılaştırmadan kaldır" })
    .click();
  await expect(page.locator(".comparison-table thead th")).toHaveCount(4);
  await expect(page).toHaveURL(/apps=notion,todoist,ticktick$/);
  await page.reload();
  await expect(page.locator(".comparison-table thead th")).toHaveCount(4);
  await page.goto("/karsilastir");
  await expect(page.locator(".comparison-table thead th")).toHaveCount(4);
  await page.goto("/karsilastir?apps=");
  await expect(
    page.getByRole("heading", { name: "İki seçenekle başla." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "İki seçenekle başla." }),
  ).toBeVisible();
});

test("theme import persists layout and favorites, validates input, and exports", async ({
  page,
}) => {
  await page.goto("/kesfet");
  await page
    .getByRole("button", { name: "Notion kaydet", exact: true })
    .click();
  await page.getByRole("link", { name: "Temalar ve eklentiler" }).click();
  const input = page.getByLabel("Tema dosyası yükle", { exact: true });
  await input.setInputFiles("examples/themes/kobalt.json");
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    "kobalt-ornek",
  );
  await expect(page.locator("[data-theme]")).toHaveClass(/layout-topbar/);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("app-guide.theme.override.v1")),
    )
    .toBe("true");
  await page.reload();
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    "kobalt-ornek",
  );
  await input.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.locator('.settings-panel [role="alert"]')).toBeVisible();
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    "kobalt-ornek",
  );
  await input.setInputFiles({
    name: "unsafe.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        ...sampleTheme,
        tokens: { ...sampleTheme.tokens, accent: "url(https://invalid.test/)" },
      }),
    ),
  });
  await expect(page.locator('.settings-panel [role="alert"]')).toBeVisible();
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    "kobalt-ornek",
  );
  await input.setInputFiles({
    name: "large.json",
    mimeType: "application/json",
    buffer: Buffer.alloc(33 * 1024, " "),
  });
  await expect(page.locator('.settings-panel [role="alert"]')).toContainText(
    "32 KB",
  );
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Etkin temayı indir" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("kobalt-ornek.json");
  await page.getByRole("button", { name: "Gece Rotaları’na dön" }).click();
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    "gece-rotalari",
  );
  await page
    .getByRole("button", { name: "Site ayarlarını kullan", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("app-guide.theme.override.v1")),
    )
    .toBeNull();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("app-guide.theme.v1")))
    .toBeNull();
  await page.getByRole("link", { name: /Kaydedilenler/ }).click();
  await expect(page.locator(".catalog-card h2")).toHaveText("Notion");
});

test("plugin choices persist and remove only the corresponding home section", async ({
  page,
}) => {
  await page.goto("/ayarlar");
  const workflowSwitch = page.getByRole("switch", {
    name: "İş akışı koleksiyonları",
  });
  await expect(workflowSwitch).toHaveAttribute("aria-checked", "true");
  await workflowSwitch.click();
  await expect(workflowSwitch).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(workflowSwitch).toHaveAttribute("aria-checked", "false");
  await page.getByRole("link", { name: "Keşfet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Uygulamaları birlikte düşün" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Yeni bir şey keşfet" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Temalar ve eklentiler" }).click();
  await workflowSwitch.click();
  await page.getByRole("link", { name: "Keşfet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Uygulamaları birlikte düşün" }),
  ).toBeVisible();
});

test("mobile navigation, content links and unknown routes work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/tr");
  await expect(
    page.getByRole("heading", { name: /Telefonundan bilgisayarına/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Menüyü aç", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Ana gezinme" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Menüyü aç", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Menüyü aç", exact: true }).click();
  await page.getByRole("link", { name: "Rehberler", exact: true }).click();
  await page.locator(".story-card").first().click();
  await expect(page.locator(".readable-article li")).not.toHaveCount(0);
  await page.goto("/uygulama/notion");
  await expect(
    page.getByRole("heading", { name: "Notion", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Katalog kaynağı" }),
  ).toHaveAttribute("href", /^https:\/\//);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const response = await page.goto("/uygulama/bilinmeyen");
  expect(response?.status()).toBe(404);
  expect(runtimeErrors).toEqual([]);
});


test("English comparison retains explicit and saved selections across navigation", async ({ page, request }) => {
  const redirect = await request.get('/?q=notes%20and%20tasks&apps=todoist%2Cticktick', { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  expect(redirect.headers().location).toBe('/en?q=notes%20and%20tasks&apps=todoist%2Cticktick');
  await page.goto('/en/compare?apps=todoist,ticktick');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
  await expect(page.locator('.comparison-table thead')).toContainText('Todoist');
  await expect(page.locator('.comparison-table thead')).toContainText('TickTick');
  await page.reload();
  await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
  await page.goto('/en/compare');
  await expect(page.locator('.comparison-table thead th')).toHaveCount(3);
  await page.goto('/en/compare?apps=');
  await expect(page.locator('.comparison-table')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.comparison-table')).toHaveCount(0);
});


test("English app language navigation includes published Turkish counterpart before SEO approval", async ({ page }) => {
  await page.goto('/en/apps/notion');
  const turkish = page.getByRole('link', { name: 'Türkçe', exact: true });
  await expect(turkish).toBeVisible();
  await expect(turkish).toHaveAttribute('href', /\/uygulama\/notion$/);
  await turkish.click();
  await expect(page).toHaveURL(/\/uygulama\/notion$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});
