import { test, expect } from "@playwright/test";
import { expectAdminOverview, openAdminSection } from "./admin-navigation";

const baseURL = process.env.ADMIN_E2E_BASE_URL;
const password = process.env.ADMIN_E2E_PASSWORD;
test.use({ baseURL: baseURL || "http://127.0.0.1:3199" });
test.describe("isolated admin workflow", () => {
  test.beforeEach(async ({page}) => {
    // This legacy workflow explicitly tests Turkish; standalone admin defaults to English.
    await page.addInitScript(() => localStorage.setItem("wexashelf.admin.locale", "tr"));
  });
  test.skip(
    !baseURL || !password,
    "Requires isolated APP_DATA_DIR server via ADMIN_E2E_BASE_URL and ADMIN_E2E_PASSWORD; never writes default user database.",
  );
  test("login, editorial draft, publish gate, revisions, conflict and import preview", async ({
    page,
  }) => {
    test.setTimeout(60000);
    page.setDefaultTimeout(15000);
    await page.goto("/admin");
    await page.getByLabel("Yönetici parolası").fill(password!);
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expectAdminOverview(page);
    await openAdminSection(page, "İçerikler");
    await page.getByRole("button", { name: "Yazı", exact: true }).click();
    await page.getByRole("button", { name: "Yeni Yazı", exact: true }).click();
    const id = `admin-e2e-${Date.now()}`;
    await page.getByLabel("Kayıt kimliği", { exact: false }).fill(id);
    await page
      .getByLabel("Başlık *", { exact: true })
      .fill("Yerel editör akışı");
    await page
      .getByLabel("Kısa açıklama", { exact: false })
      .fill(
        "Yönetim ekranındaki yayın ve sürüm kontrolünü doğrulayan test yazısı.",
      );
    await page.getByLabel("Yazar", { exact: false }).fill("Test editörü");
    await page.getByLabel("Bölüm 1 başlığı").fill("Doğrulanan adımlar");
    await page
      .getByLabel("Bölüm 1 paragrafları")
      .fill(
        "Taslağı oluştur, resmî kaynağı ekle ve yayın durumunu gözden geçir.",
      );
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Kayıt kaydedildi");
    await page.getByLabel("Kayıt durumu").selectOption("published");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.locator('.admin-error[role="alert"]')).toContainText(
      /kaynak/i,
    );
    await page
      .getByText("Yazı kaynakları · JSON düzenleyici", { exact: true })
      .click();
    await page
      .getByLabel("sources", { exact: true })
      .fill(
        JSON.stringify([
          {
            title: "Notion resmî kaynak",
            url: "https://www.notion.com/mobile",
          },
        ]),
      );
    await page
      .getByLabel("Başlık, açıklama, kaynaklar ve SEO alanlarını inceledim.")
      .check();
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Yayında");
    await page.getByRole("button", { name: "Sürüm geçmişi" }).click();
    await expect(
      page.getByRole("heading", { name: "Önceki sürümler" }),
    ).toBeVisible();

    // Simulate a second editor through the authenticated browser context.
    const snapshot = await page.request.get("/api/admin");
    const current = (await snapshot.json()).records.find(
      (record: { id: string }) => record.id === id,
    );
    const changed = await page.request.post("/api/admin/records", {
      headers: { Origin: baseURL! },
      data: {
        ...current,
        data: { ...current.data, title: "Başka editör güncelledi" },
      },
    });
    expect(changed.ok()).toBeTruthy();
    await page
      .getByLabel("Başlık *", { exact: true })
      .fill("Benim yerel değişikliğim");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.locator('.admin-error[role="alert"]')).toContainText(
      "başka bir oturumda değişti",
    );
    await expect(page.getByLabel("Başlık *", { exact: true })).toHaveValue(
      "Benim yerel değişikliğim",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Güncel sürümü yükle" }).click();
    await expect(page.getByLabel("Başlık *", { exact: true })).toHaveValue(
      "Başka editör güncelledi",
    );
    await page.getByLabel("Kayıt durumu").selectOption("archived");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Arşivde");

    await openAdminSection(page, "İçe aktarma ve yedek");
    const importId = `${id}-import`;
    const records = [
      {
        kind: "article",
        data: { ...current.data, id: importId },
        status: "draft",
        seoApproved: false,
      },
    ];
    await page
      .getByLabel("İçe aktarılacak JSON dosyası")
      .setInputFiles({
        name: "records.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(records)),
      });
    await expect(
      page.getByRole("heading", { name: "İçe aktarma önizlemesi" }),
    ).toBeVisible();
    const before = await (await page.request.get("/api/admin")).json();
    expect(
      before.records.some((record: { id: string }) => record.id === importId),
    ).toBeFalsy();
    await page
      .getByRole("button", { name: "Önizlemeyi kabul et ve içe aktar" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "1 kayıt içe aktarıldı",
    );
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "İçerik yedeğini indir" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();
    await page
      .getByLabel("Geri yüklenecek yedek dosyası")
      .setInputFiles(backupPath!);
    await expect(
      page.getByRole("heading", { name: "Yedek geri yükleme önizlemesi" }),
    ).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Önizlemeyi kabul et ve geri yükle" })
      .click();
    await expect(page.getByRole("status")).toContainText("kayıt geri yüklendi");
    await page.getByRole("button", { name: "Çıkış", exact: true }).click();
    await expect(page.getByLabel("Yönetici parolası")).toBeVisible();
    expect((await page.request.get("/api/admin")).status()).toBe(401);
  });
  test("app and list editing, scheduled state and feedback resolution", async ({
    page,
  }) => {
    test.setTimeout(60000);
    page.setDefaultTimeout(15000);
    await page.goto("/admin");
    await page.getByLabel("Yönetici parolası").fill(password!);
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expectAdminOverview(page);
    await openAdminSection(page, "İçerikler");
    await page
      .getByRole("button", { name: "Yeni Uygulama", exact: true })
      .click();
    const id = `test-app-${Date.now()}`;
    await page.getByLabel("Kayıt kimliği", { exact: false }).fill(id);
    await page
      .getByLabel("Uygulama adı", { exact: false })
      .fill("Sentetik test uygulaması");
    await page
      .getByLabel("Kısa açıklama", { exact: false })
      .fill("İzole yönetim testi kaydı.");
    await page
      .getByLabel("Açıklama *", { exact: true })
      .fill("Yalnız test veritabanındaki uygulama düzenleme doğrulaması.");
    await page.getByLabel("Yayıncı *", { exact: true }).fill("Test yayıncısı");
    await page
      .getByLabel("Etiketler", { exact: false })
      .fill("notlar, üretkenlik");
    await page
      .getByLabel("Yerel ikon yolu", { exact: false })
      .fill("/icons/notion.jpg");
    await page
      .getByLabel("Yayıncı sitesi", { exact: false })
      .fill("https://www.notion.com");
    await page
      .getByLabel("Resmî kaynak URL", { exact: false })
      .fill("https://www.notion.com/mobile");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Taslak");
    await expect(page.getByLabel("Etiketler", { exact: false })).toHaveValue(
      "notlar, üretkenlik",
    );
    await page.getByLabel("Kayıt durumu").selectOption("review");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("İncelemede");
    await page.getByLabel("Kayıt durumu").selectOption("scheduled");
    const future = new Date(Date.now() + 86400000 * 2);
    const localFuture = new Date(
      future.getTime() - future.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    await page.getByLabel("Planlanan yayın (yerel saat)").fill(localFuture);
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Zamanlanmış");
    await page.getByRole("button", { name: "Sürüm geçmişi" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .getByRole("button", { name: "Bu sürümü geri yükle" })
      .last()
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Önceki sürüm geri yüklendi",
    );
    await expect(page.getByLabel("Kayıt durumu")).toHaveValue("draft");

    await page
      .getByRole("button", { name: "Editoryal liste", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Yeni Editoryal liste", exact: true })
      .click();
    await page
      .getByLabel("Kayıt kimliği", { exact: false })
      .fill(`test-list-${Date.now()}`);
    await page.getByLabel("Başlık *", { exact: true }).fill("Test seçkisi");
    await page
      .getByLabel("Kısa açıklama", { exact: false })
      .fill("Kaynaklı bir test seçkisi.");
    await page.getByLabel("Uygulama 1 kimliği").fill("notion");
    await page
      .getByLabel("Uygulama 1 seçim nedeni")
      .fill("Notları düzenlemek için örnek seçenek.");
    await page
      .getByRole("button", { name: "Kaydı kaydet", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Taslak");
    const feedback = await page.request.post("/api/feedback", {
      headers: { Origin: baseURL! },
      data: {
        appId: "notion",
        field: "source",
        message: "İzole test: kaynak bağlantısını yeniden kontrol edin.",
        website: "",
      },
    });
    expect(feedback.ok()).toBeTruthy();
    const { id: feedbackId } = await feedback.json();
    await page.getByRole("button", { name: "Listeyi yenile" }).click();
    await openAdminSection(page, "Geri bildirim");
    await page
      .getByRole("combobox", { name: `Bildirim # ${feedbackId} durumu`, exact: true })
      .selectOption("resolved");
    await expect(page.getByRole("status")).toContainText(
      "Bildirim durumu güncellendi",
    );
    await expect(page.getByRole("combobox", { name: `Bildirim # ${feedbackId} durumu`, exact: true })).toHaveValue(
      "resolved",
    );
  });

  test("global appearance stays a draft until activation and reaches a fresh visitor", async ({
    page,
    browser,
  }) => {
    test.setTimeout(60000);
    page.setDefaultTimeout(15000);
    await page.goto("/admin");
    await page.getByLabel("Yönetici parolası").fill(password!);
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expectAdminOverview(page);
    const originalResponse = await page.request.get("/api/admin/settings");
    expect(originalResponse.ok()).toBeTruthy();
    const { settings: original } = await originalResponse.json();
    const theme = {
      ...original.theme,
      id: `global-test-${Date.now()}`,
      name: "Site genelinde test görünümü",
      layout: "topbar",
      density: "compact",
    };
    await openAdminSection(page, "Site görünümü");
    await expect(
      page.getByRole("heading", { name: "Bir görünüm, bütün site." }),
    ).toBeVisible();
    await page
      .getByLabel("Site teması dosyası")
      .setInputFiles({
        name: "theme.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(theme)),
      });
    await expect(
      page.getByText("Etkinleştirilmemiş taslak", { exact: true }),
    ).toBeVisible();
    const toolbox = page.getByRole("switch", {
      name: "Karar araçları",
      exact: true,
    });
    if ((await toolbox.getAttribute("aria-checked")) === "true")
      await toolbox.click();
    const before = (
      await (await page.request.get("/api/admin/settings")).json()
    ).settings;
    expect(before).toEqual(original);
    const beforeContext = await browser.newContext();
    try {
      const beforePage = await beforeContext.newPage();
      await beforePage.goto(baseURL! + "/tr");
      await expect(beforePage.locator(".catalog-experience")).toHaveAttribute(
        "data-theme",
        original.theme.id,
      );
    } finally {
      await beforeContext.close();
    }
    try {
      await page
        .getByRole("button", { name: "Sitede etkinleştir", exact: true })
        .click();
      await expect(
        page.locator('.admin-appearance .admin-success[role="status"]'),
      ).toContainText("Site görünümü etkinleştirildi");
      const current = (
        await (await page.request.get("/api/admin/settings")).json()
      ).settings;
      expect(current.revision).toBe(original.revision + 1);
      expect(current.enabledPlugins).not.toContain("decision-tools");
      const stale = await page.request.post("/api/admin/settings", {
        headers: { Origin: baseURL! },
        data: { ...original, theme },
      });
      expect(stale.status()).toBe(409);
      const unsafe = await page.request.post("/api/admin/settings", {
        headers: { Origin: baseURL! },
        data: { ...current, enabledPlugins: ["remote-javascript"] },
      });
      expect(unsafe.status()).toBe(400);
      const visitorContext = await browser.newContext();
      try {
        const visitor = await visitorContext.newPage();
        await visitor.goto(baseURL! + "/tr");
        await expect(visitor.locator(".catalog-experience")).toHaveAttribute(
          "data-theme",
          theme.id,
        );
        await expect(visitor.locator(".catalog-experience")).toHaveClass(
          /layout-topbar/,
        );
        await expect(
          visitor.getByRole("heading", {
            name: "Karar vermek kolaylaşsın",
            exact: true,
          }),
        ).toHaveCount(0);
        expect(
          (
            await visitor.request.get(baseURL! + "/api/admin/settings")
          ).status(),
        ).toBe(401);
        await visitor.goto(baseURL! + "/ayarlar");
        const personalTheme = {
          ...theme,
          id: "personal-preview",
          name: "Kişisel test görünümü",
        };
        await visitor
          .getByLabel("Tema dosyası yükle")
          .setInputFiles({
            name: "personal.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify(personalTheme)),
          });
        await expect(visitor.locator(".catalog-experience")).toHaveAttribute(
          "data-theme",
          "personal-preview",
        );
        await expect
          .poll(() =>
            visitor.evaluate(() =>
              localStorage.getItem("app-guide.theme.override.v1"),
            ),
          )
          .toBe("true");
        const latest = (
          await (await page.request.get("/api/admin/settings")).json()
        ).settings;
        const reset = await page.request.post("/api/admin/settings", {
          headers: { Origin: baseURL! },
          data: { ...original, revision: latest.revision },
        });
        expect(reset.ok()).toBeTruthy();
        await visitor.reload();
        await expect(visitor.locator(".catalog-experience")).toHaveAttribute(
          "data-theme",
          "personal-preview",
        );
        await visitor
          .getByRole("button", { name: "Site ayarlarını kullan", exact: true })
          .click();
        await expect(visitor.locator(".catalog-experience")).toHaveAttribute(
          "data-theme",
          original.theme.id,
        );
        await expect
          .poll(() =>
            visitor.evaluate(() =>
              localStorage.getItem("app-guide.theme.override.v1"),
            ),
          )
          .toBeNull();
      } finally {
        await visitorContext.close();
      }
    } finally {
      const current = (
        await (await page.request.get("/api/admin/settings")).json()
      ).settings;
      if (
        JSON.stringify(current.theme) !== JSON.stringify(original.theme) ||
        JSON.stringify(current.enabledPlugins) !==
          JSON.stringify(original.enabledPlugins)
      ) {
        const restored = await page.request.post("/api/admin/settings", {
          headers: { Origin: baseURL! },
          data: { ...original, revision: current.revision },
        });
        expect(restored.ok()).toBeTruthy();
      }
    }
  });

  test("admission preview precedes activation and manual exception is explicit", async ({
    page,
    browser,
  }) => {
    test.setTimeout(60000);
    page.setDefaultTimeout(15000);
    await page.goto("/admin");
    await page.getByLabel("Yönetici parolası").fill(password!);
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expectAdminOverview(page);
    const original = (
      await (await page.request.get("/api/admin/admission")).json()
    ).rules;
    const originalRecord = (
      await (await page.request.get("/api/admin")).json()
    ).records.find(
      (record: { kind: string; id: string }) =>
        record.kind === "app" && record.id === "notion",
    );
    let recordChanged = false;
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    try {
      await visitor.goto(baseURL! + "/uygulama/notion");
      await visitor
        .getByRole("button", { name: "Notion kaydet", exact: true })
        .click();
      await expect
        .poll(() =>
          visitor.evaluate(() =>
            JSON.parse(localStorage.getItem("app-guide.saved.v1") || "[]"),
          ),
        )
        .toContain("notion");
      await openAdminSection(page, "Kabul kuralları");
      await expect(
        page.getByRole("heading", { name: "Önce etkisini gör, sonra uygula." }),
      ).toBeVisible();
      await page.getByLabel("Mağaza ülkesi (iki harf)").fill("TR");
      for (const platform of ["iOS", "Windows"]) {
        const toggle = page.getByRole("switch", {
          name: `${platform} kabul eşiği`,
          exact: true,
        });
        if ((await toggle.getAttribute("aria-checked")) === "true")
          await toggle.click();
      }
      const android = page.getByRole("switch", {
        name: "Android kabul eşiği",
        exact: true,
      });
      if ((await android.getAttribute("aria-checked")) !== "true")
        await android.click();
      await page
        .getByLabel("Android minimum indirme alt sınırı")
        .fill("999999999");
      await expect(
        page.getByRole("button", {
          name: "Kabul kurallarını uygula",
          exact: true,
        }),
      ).toBeDisabled();
      await page
        .getByRole("button", { name: "Etkiyi önizle", exact: true })
        .click();
      await expect(
        page.locator('.admin-admission [role="status"]'),
      ).toContainText("henüz değiştirilmedi");
      const before = (
        await (await page.request.get("/api/admin/admission")).json()
      ).rules;
      expect(before).toEqual(original);
      await expect(page.locator(".admin-admission-preview")).toContainText(
        "kaynaklı güncel gözlem yok",
      );
      await page
        .getByRole("button", { name: "Kabul kurallarını uygula", exact: true })
        .click();
      await expect(
        page.locator('.admin-admission [role="status"]'),
      ).toContainText("Kabul kuralları uygulandı");
      const applied = await (
        await page.request.get("/api/admin/admission")
      ).json();
      expect(applied.preview.accepted).toBe(0);
      {
        await visitor.goto(baseURL! + "/tr");
        await expect(
          visitor.getByRole("heading", {
            name: "Şu anda listelenebilen uygulama yok.",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          visitor.getByRole("link", {
            name: "Notion ve Obsidian’ı karşılaştır",
            exact: true,
          }),
        ).toHaveCount(0);
        await visitor.goto(baseURL! + "/kaydedilenler");
        await expect(visitor.locator(".unavailable-saved")).toBeVisible();
        await expect
          .poll(() =>
            visitor.evaluate(() =>
              JSON.parse(localStorage.getItem("app-guide.saved.v1") || "[]"),
            ),
          )
          .toContain("notion");
        await visitor.goto(baseURL! + "/kesfet");
        await expect(visitor.locator(".catalog-card")).toHaveCount(0);
        await expect(visitor.locator(".result-count")).toContainText(
          "0 uygulama",
        );
        await openAdminSection(page, "İçerikler");
        await page.getByLabel("Kayıtlarda ara").fill("notion");
        await page
          .locator(".admin-record-list")
          .getByRole("button", { name: /^Notion / })
          .click();
        await page
          .getByLabel("Editör istisnası gerekçesi", { exact: true })
          .fill(
            "Kaynak temelli editoryal örnek: indirme eşiği doğrulanmadığı açıkça belirtilerek geçici kabul.",
          );
        await page
          .getByRole("button", { name: "Kaydı kaydet", exact: true })
          .click();
        await expect(page.getByRole("status")).toContainText(
          "Kayıt kaydedildi",
        );
        recordChanged = true;
        const exceptionPreview = await (
          await page.request.get("/api/admin/admission")
        ).json();
        expect(
          exceptionPreview.preview.items.find(
            (item: { id: string }) => item.id === "notion",
          ).state,
        ).toBe("exception");
        expect(exceptionPreview.preview.exceptions).toBe(1);
        await visitor.reload();
        await expect(visitor.locator(".catalog-card")).toHaveCount(1);
        await expect(visitor.locator(".catalog-card")).toContainText("Notion");
      }
    } finally {
      await visitorContext.close();
      const latest = (
        await (await page.request.get("/api/admin/admission")).json()
      ).rules;
      const restored = await page.request.post("/api/admin/admission", {
        headers: { Origin: baseURL! },
        data: {
          rules: { ...original, revision: latest.revision },
          dryRun: false,
        },
      });
      expect(restored.ok()).toBeTruthy();
      if (recordChanged) {
        const latestRecord = (
          await (await page.request.get("/api/admin")).json()
        ).records.find(
          (record: { kind: string; id: string }) =>
            record.kind === "app" && record.id === "notion",
        );
        const restoreRecord = await page.request.post("/api/admin/records", {
          headers: { Origin: baseURL! },
          data: {
            ...originalRecord,
            admissionException: originalRecord.admissionException || "",
            revision: latestRecord.revision,
          },
        });
        expect(restoreRecord.ok()).toBeTruthy();
      }
    }
  });

  test("Apple candidate preview is read-only and downloads without creating a record", async ({
    page,
  }) => {
    test.setTimeout(30000);
    page.setDefaultTimeout(10000);
    await page.goto("/admin");
    await page.getByLabel("Yönetici parolası").fill(password!);
    await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
    await expectAdminOverview(page);
    const before = (await (await page.request.get("/api/admin")).json()).records
      .length;
    await page.route("**/api/admin/apple", async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        id: "1232780281",
        country: "TR",
      });
      await route.fulfill({
        json: {
          source: "https://itunes.apple.com/lookup?id=1232780281&country=tr",
          candidate: {
            name: "Örnek Apple uygulaması",
            publisher: "Test yayıncısı",
            description: "Yalnızca test yanıtındaki mağaza açıklaması.",
            platforms: ["ios"],
            facts: [],
            plans: [],
          },
          note: "Kaynak adayıdır; otomatik yayımlanmaz.",
        },
      });
    });
    await openAdminSection(page, "İçe aktarma ve yedek");
    await page.getByLabel("Apple uygulama kimliği").fill("1232780281");
    await page
      .getByRole("button", { name: "Apple adayını getir", exact: true })
      .click();
    await expect(
      page.getByRole("heading", {
        name: "Örnek Apple uygulaması",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".admin-apple-result")).toContainText(
      "Test yayıncısı",
    );
    await expect(page.locator(".admin-apple-result")).toContainText(
      "Kaydedilmedi",
    );
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", {
        name: "Apple aday JSON dosyasını indir",
        exact: true,
      })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("apple-1232780281-tr-aday.json");
    const { readFile } = await import("node:fs/promises");
    const downloaded = JSON.parse(
      await readFile((await download.path())!, "utf8"),
    );
    expect(downloaded.candidate.name).toBe("Örnek Apple uygulaması");
    expect(
      (await (await page.request.get("/api/admin")).json()).records.length,
    ).toBe(before);
  });
});
