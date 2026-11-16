import { test, expect } from "@playwright/test";
import { DEFAULT_THEME } from "../../src/lib/themes";
import { DEFAULT_ENABLED_PLUGINS } from "../../src/lib/plugins";

test("fresh visitors inherit site appearance and old automatic defaults migrate without becoming overrides", async ({
  page,
}) => {
  await page.goto("/ayarlar");
  const inheritedTheme = await page
    .locator("[data-theme]")
    .getAttribute("data-theme");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("app-guide.saved.v1")))
    .not.toBeNull();
  const appearanceKeys = [
    "app-guide.theme.v1",
    "app-guide.plugins.v1",
    "app-guide.theme.override.v1",
    "app-guide.plugins.override.v1",
  ];
  expect(
    await page.evaluate(
      (keys) => keys.map((key) => localStorage.getItem(key)),
      appearanceKeys,
    ),
  ).toEqual([null, null, null, null]);
  await page.evaluate(
    ({ theme, plugins }) => {
      localStorage.setItem("app-guide.theme.v1", JSON.stringify(theme));
      localStorage.setItem("app-guide.plugins.v1", JSON.stringify(plugins));
    },
    { theme: DEFAULT_THEME, plugins: DEFAULT_ENABLED_PLUGINS },
  );
  await page.reload();
  await expect(page.locator("[data-theme]")).toHaveAttribute(
    "data-theme",
    inheritedTheme!,
  );
  await expect(
    page.getByRole("heading", { name: "Site varsayılanlarını kullanıyorsun" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        (keys) => keys.map((key) => localStorage.getItem(key)),
        appearanceKeys,
      ),
    )
    .toEqual([null, null, null, null]);
});

test("unavailable saved and comparison references are retained and reported separately", async ({
  page,
}) => {
  await page.goto("/tr");
  await page.evaluate(() => {
    localStorage.setItem(
      "app-guide.saved.v1",
      JSON.stringify(["notion", "temporarily-unpublished"]),
    );
    localStorage.setItem(
      "app-guide.compare.v1",
      JSON.stringify(["notion", "temporarily-unpublished"]),
    );
  });
  await page.goto("/kaydedilenler");
  await expect(page.locator(".unavailable-saved")).toContainText(
    "1 kaydedilmiş uygulama",
  );
  await expect(page.locator(".catalog-card h2")).toHaveText("Notion");
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("app-guide.saved.v1") || "[]"),
    ),
  ).toEqual(["notion", "temporarily-unpublished"]);
  await page.goto("/karsilastir?apps=notion,temporarily-unpublished");
  await expect(page.locator(".unavailable-comparison")).toContainText(
    "1 seçili uygulama",
  );
  await expect(page.locator(".comparison-table thead th")).toHaveCount(2);
  await page.reload();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("app-guide.compare.v1") || "[]"),
    ),
  ).toEqual(["notion", "temporarily-unpublished"]);
  await page
    .getByRole("button", {
      name: "temporarily-unpublished karşılaştırmadan kaldır",
      exact: true,
    })
    .click();
  await expect(page.locator(".unavailable-comparison")).toHaveCount(0);
  await expect(page).toHaveURL(/apps=notion$/);
});

test("multi-platform filters preserve all/any state across reload and browser back", async ({
  page,
}) => {
  await page.goto("/kesfet?platform=android,windows&mode=all");
  await expect(page.locator(".catalog-card")).toHaveCount(8);
  await expect(
    page.getByRole("button", { name: "Android", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Windows", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".advanced-filters summary").click();
  await page.getByLabel("Platform eşleşmesi").selectOption("any");
  await expect(page.locator(".catalog-card")).toHaveCount(10);
  await expect(page).not.toHaveURL(/mode=all/);
  await page.goBack();
  await expect(page).toHaveURL(/mode=all/);
  await expect(page.locator(".catalog-card")).toHaveCount(8);
  await page.reload();
  await expect(page.locator(".catalog-card")).toHaveCount(8);
  await page.locator(".advanced-filters summary").click();
  await page.getByLabel("Android indirme alt sınırı").selectOption("1000000");
  await expect(
    page.getByRole("heading", { name: "Bu filtrelerle uygulama bulunamadı." }),
  ).toBeVisible();
  await page.getByLabel("İndirme bilgisi olmayanları da dahil et").check();
  await expect(page.locator(".catalog-card")).toHaveCount(8);
});

test("wizard separates a sourced match from missing required evidence", async ({
  page,
}) => {
  await page.goto("/secim-sihirbazi");
  await page.getByLabel("Ne yapmak istiyorsun?").selectOption("notes");
  await page.getByRole("checkbox", { name: "Android", exact: true }).check();
  await page
    .getByRole("checkbox", { name: "Çevrimdışı kullanım", exact: true })
    .check();
  await page.getByRole("button", { name: "Eşleşmeleri göster" }).click();
  await expect(
    page
      .locator(".recommendation")
      .filter({
        has: page.getByRole("link", { name: "Obsidian", exact: true }),
      })
      .locator(".evidence-badge"),
  ).toHaveText("Koşullar eşleşiyor");
  await expect(
    page
      .locator(".recommendation")
      .filter({ has: page.getByRole("link", { name: "Notion", exact: true }) })
      .locator(".evidence-badge"),
  ).toHaveText("Doğrulama gerekiyor");
  await page
    .getByRole("checkbox", { name: "OCR / metin tanıma", exact: true })
    .check();
  await page.getByRole("button", { name: "Eşleşmeleri göster" }).click();
  await expect(page.locator(".recommendation-results>h2")).toContainText(
    "0 tam eşleşme",
  );
  await expect(page.locator(".evidence-badge.match")).toHaveCount(0);
});

test("cost tool distinguishes verified zero price from an unknown plan", async ({
  page,
}) => {
  await page.goto("/maliyet-hesapla");
  await page
    .getByRole("combobox", { name: "Uygulama", exact: true })
    .selectOption("notion");
  await expect(page.locator(".cost-result h2")).toHaveText("0 USD");
  await page
    .getByRole("combobox", { name: "Süre", exact: true })
    .selectOption("36");
  await page.getByLabel("Kişi sayısı", { exact: true }).fill("3");
  await expect(page.locator(".cost-result h2")).toHaveText("0 USD");
  await expect(page.locator(".cost-result")).toContainText("36 ay");
  await page
    .getByRole("combobox", { name: "Uygulama", exact: true })
    .selectOption("acrobat");
  await expect(page.locator(".cost-result h2")).toHaveText(
    "Kesin toplam hesaplanamıyor",
  );
  await expect(page.locator(".cost-result")).toContainText(
    "Eksik fiyatı sıfır olarak saymıyoruz",
  );
});

test("blog and editorial lists expose readable content, author and selection method", async ({
  page,
}) => {
  await page.goto("/blog");
  await expect(page.locator(".story-card")).toHaveCount(4);
  await page.locator(".story-card").first().click();
  await expect(page.locator(".long-article section")).not.toHaveCount(0);
  await expect(page.locator(".article-meta")).toContainText(
    "Kaynak araştırması",
  );
  await expect(page.locator(".article-sources a").first()).toHaveAttribute(
    "href",
    /^https:\/\//,
  );
  await page.goto("/listeler");
  await page.locator(".story-card").first().click();
  await expect(
    page.getByRole("heading", { name: "Nasıl seçildi?" }),
  ).toBeVisible();
  await expect(
    page.locator(".selection-list .selection-reason"),
  ).not.toHaveCount(0);
  await expect(page.locator(".list-method")).toContainText("mağaza");
});

test("private collections persist notes and membership and require explicit deletion", async ({
  page,
}) => {
  await page.goto("/kesfet");
  await page
    .getByRole("button", { name: "Notion kaydet", exact: true })
    .click();
  await page.getByRole("link", { name: /Kaydedilenler/ }).click();
  await page.getByLabel("Koleksiyon adı", { exact: true }).fill("Ders düzenim");
  await page.getByRole("button", { name: "Kaydettiklerimle oluştur" }).click();
  const collection = page.locator(".collection-grid article");
  await expect(
    collection.getByRole("link", { name: "Notion", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Ders düzenim notu")
    .fill("Kaynaklar ve haftalık ders notları.");
  await page
    .getByLabel("Ders düzenim koleksiyonuna uygulama ekle")
    .selectOption("obsidian");
  await page.reload();
  await expect(page.getByLabel("Ders düzenim notu")).toHaveValue(
    "Kaynaklar ve haftalık ders notları.",
  );
  await expect(
    collection.getByRole("link", { name: "Obsidian", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Koleksiyonları dışa aktar" }).click();
  expect((await download).suggestedFilename()).toBe(
    "uygulama-koleksiyonlarim.json",
  );
  await page
    .getByRole("button", { name: "Koleksiyonu sil", exact: true })
    .click();
  await expect(collection).toHaveCount(1);
  await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await expect(collection).toHaveCount(1);
  await page
    .getByRole("button", { name: "Koleksiyonu sil", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Silmeyi onayla", exact: true })
    .click();
  await expect(collection).toHaveCount(0);
  await expect(page.locator(".catalog-card h2")).toHaveText("Notion");
});

test.describe("isolated public feedback submission", () => {
  const feedbackBase = process.env.PRODUCT_FEEDBACK_BASE_URL;
  test.use({ baseURL: feedbackBase || "http://127.0.0.1:3198" });
  test.skip(
    !feedbackBase,
    "Requires PRODUCT_FEEDBACK_BASE_URL pointed at an isolated APP_DATA_DIR server.",
  );
  test("sends an app-scoped correction through the real API", async ({
    page,
  }) => {
    await page.goto("/uygulama/notion");
    await page.locator(".feedback-panel summary").click();
    await page
      .getByRole("combobox", { name: "İlgili alan", exact: true })
      .selectOption("Genel bilgi");
    await page
      .getByLabel("Düzeltme ve varsa kaynak bağlantısı")
      .fill(
        "Sentetik E2E bildirimi: kaynak tarihini editör incelemesi için kontrol edin.",
      );
    const response = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/feedback") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "İncelemeye gönder" }).click();
    expect((await response).ok()).toBe(true);
    await expect(page.locator('.feedback-panel [role="status"]')).toContainText(
      "inceleme kuyruğuna alındı",
    );
    await expect(
      page.getByLabel("Düzeltme ve varsa kaynak bağlantısı"),
    ).toHaveValue("");
  });
});
