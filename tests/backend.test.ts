import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getAdminSnapshot,
  getPublicSnapshot,
  saveRecord,
  restoreRevision,
  history,
  exportBackup,
  restoreBackup,
  importRecords,
  submitFeedback,
  updateFeedback,
  db,
} from "../src/lib/server/store";
import {
  configurePassword,
  authenticated,
  login,
  logout,
  sameOrigin,
  sessionCookie,
} from "../src/lib/server/auth";
import { validateManaged } from "../src/lib/server/validation";
process.env.APP_DATA_DIR = mkdtempSync(join(tmpdir(), "catalog-backend-"));
delete process.env.ADMIN_PASSWORD;
test("persistent revisions, visibility, validation, import and restore preserve authentication", () => {
  const seed = getAdminSnapshot().records.find((r) => r.kind === "app")!;
  configurePassword("test-only-long-password");
  assert.throws(() => login("wrong", "test"), /parola/);
  const token = login("test-only-long-password", "test");
  assert.equal(authenticated(token), true);
  const draft = saveRecord({
    ...seed,
    data: { ...seed.data, id: "test-draft" },
    status: "draft",
    revision: 0,
    seoApproved: false,
  });
  assert.ok(!getPublicSnapshot().apps.some((a) => a.id === "test-draft"));
  assert.throws(() => saveRecord({ ...draft, revision: 0 }), /değişti/);
  assert.throws(
    () =>
      validateManaged({
        ...draft,
        data: { ...draft.data, website: "javascript:alert(1)" },
      }),
    /HTTP/,
  );
  assert.throws(
    () =>
      validateManaged({
        ...draft,
        data: {
          ...draft.data,
          storeLinks: { ios: "https://evil.example/app" },
        },
      }),
    /Mağaza/,
  );
  assert.throws(
    () =>
      saveRecord({
        ...draft,
        status: "published",
        data: { ...draft.data, description: "" },
      }),
    /açıklama/,
  );
  const published = saveRecord({
    ...draft,
    status: "published",
    seoApproved: false,
  });
  assert.equal(published.seoApproved, false);
  assert.ok(getPublicSnapshot().apps.some((a) => a.id === "test-draft"));
  const changed = saveRecord({
    ...published,
    data: { ...published.data, description: "Changed source-backed summary" },
  });
  assert.equal(changed.seoApproved, false);
  const restored = restoreRevision("app", "test-draft", 1);
  assert.equal(restored.status, "draft");
  assert.equal(history("app", "test-draft").length, 4);
  const preview = importRecords(
    [{ ...draft, data: { ...draft.data, id: "imported" } }],
    true,
  );
  assert.equal(preview.valid, true);
  assert.equal(preview.imported, 0);
  assert.equal(
    importRecords(
      [{ ...draft, data: { ...draft.data, id: "imported" } }],
      false,
    ).imported,
    1,
  );
  assert.equal(
    importRecords(
      [{ ...draft, data: { ...draft.data, id: "imported" } }],
      false,
    ).valid,
    false,
  );
  const before = getAdminSnapshot().records.length;
  assert.throws(() => restoreBackup({ version: 1, records: [{ bad: true }] }));
  assert.equal(getAdminSnapshot().records.length, before);
  const backup = exportBackup();
  assert.equal(restoreBackup(backup, true).count, before);
  restoreBackup(backup);
  assert.equal(authenticated(token), true);
  const f = submitFeedback({
    appId: seed.id,
    field: "source",
    message: "Kaynak bağlantısı kontrol edilmeli.",
  });
  updateFeedback(f.id, "resolved");
  assert.equal(getAdminSnapshot().feedback[0].status, "resolved");
  assert.throws(() =>
    submitFeedback({
      appId: seed.id,
      field: "x",
      message: "valid feedback message",
      website: "bot",
    }),
  );
  assert.throws(
    () => sameOrigin(new Request("http://localhost/api", { method: "POST" })),
    /kaynağı/,
  );
  assert.throws(
    () =>
      sameOrigin(
        new Request("http://localhost/api", {
          headers: { origin: "https://evil.example" },
        }),
      ),
    /kaynağı/,
  );
  sameOrigin(
    new Request("http://localhost/api", {
      headers: { origin: "http://localhost" },
    }),
  );
  assert.match(
    sessionCookie(new Request("https://localhost"), token),
    /Secure/,
  );
  db().prepare("UPDATE sessions SET expires=0").run();
  assert.equal(authenticated(token), false);
  logout(token);
});
test("schedules respect time and app edits invalidate linked SEO approval", () => {
  const base = getAdminSnapshot().records.find((r) => r.kind === "app")!;
  const future = saveRecord({
    ...base,
    revision: 0,
    data: { ...base.data, id: "scheduled-test" },
    status: "scheduled",
    publishAt: new Date(Date.now() + 86400000).toISOString(),
    seoApproved: false,
  });
  assert.ok(!getPublicSnapshot().apps.some((a) => a.id === future.id));
  saveRecord({
    ...future,
    publishAt: new Date(Date.now() - 1000).toISOString(),
  });
  assert.ok(getPublicSnapshot().apps.some((a) => a.id === future.id));
  const article = saveRecord({
    kind: "article",
    status: "published",
    seoApproved: true,
    publishAt: null,
    reviewNote: "",
    data: {
      id: "linked-article",
      title: "Article",
      summary: "Summary",
      author: "Editor",
      kind: "guide",
      sections: [{ heading: "Body", paragraphs: ["Substantive content"] }],
      appIds: [base.id],
      sources: [{ title: "Publisher", url: "https://example.com" }],
      method: "source-research",
      publishedAt: "2026-11-15",
      updatedAt: "2026-11-15",
    },
  });
  saveRecord({
    ...base,
    data: { ...base.data, description: "Updated publisher summary" },
  });
  const changed = getAdminSnapshot().records.find((r) => r.id === article.id)!;
  assert.equal(changed.seoApproved, false);
  assert.equal(changed.status, "published");
  assert.equal(changed.revision, 2);
  const backup = exportBackup();
  const count = history("article", article.id).length;
  restoreBackup(backup);
  assert.equal(history("article", article.id).length, count);
});

test("seed schema, imported value guards and loopback origin are consistent", () => {
  for (const record of getAdminSnapshot().records) validateManaged(record);
  const app = getAdminSnapshot().records.find(
    (record) => record.kind === "app",
  )!;
  assert.throws(
    () =>
      validateManaged({
        ...app,
        data: { ...app.data, checkedAt: "2026-02-31" },
      }),
    /tarih/,
  );
  assert.throws(
    () =>
      validateManaged({
        ...app,
        data: { ...app.data, color: "url(https://invalid.example)" },
      }),
    /renk/,
  );
  const plan = {
    id: "bad",
    name: "Bad",
    currency: "USD",
    monthlyPrice: 4,
    annualPrice: 40,
    perSeat: true,
    free: true,
    platforms: ["android"],
    features: [],
    limits: [],
    sourceUrl: "https://example.com",
    checkedAt: "2026-11-15",
    note: "",
  };
  assert.throws(
    () =>
      validateManaged({
        ...app,
        data: { ...app.data, platforms: ["android"], plans: [plan] },
      }),
    /Ücretsiz/,
  );
  sameOrigin(
    new Request("http://localhost:3142/api", {
      headers: { host: "127.0.0.1:3142", origin: "http://127.0.0.1:3142" },
    }),
  );
  assert.throws(
    () =>
      sameOrigin(
        new Request("http://localhost/api", {
          headers: {
            host: "attacker.example",
            origin: "http://attacker.example",
          },
        }),
      ),
    /APP_ORIGIN/,
  );
  const insert = db().prepare(
    "INSERT INTO feedback(appId,field,message,status,createdAt) VALUES(?,?,?,?,?)",
  );
  for (let i = 0; i < 501; i++)
    insert.run(
      app.id,
      "backup-test",
      "Synthetic backup completeness record",
      "open",
      "2026-11-15T12:00:00Z",
    );
  assert.ok(exportBackup().feedback.length > 500);
  assert.equal(getAdminSnapshot().feedback.length, 500);
  const backup = exportBackup();
  restoreBackup(backup);
  assert.equal(exportBackup().feedback.length, backup.feedback.length);
});

test("login throttles failed attempts without blocking successful regular sign-ins", () => {
  for (let i = 0; i < 8; i++)
    assert.throws(() => login("wrong", "bruteforce-fixture"), /parola/);
  assert.throws(() => login("wrong", "bruteforce-fixture"), /Çok fazla/);
  for (let i = 0; i < 10; i++) {
    const token = login("test-only-long-password", "regular-login-fixture");
    assert.equal(authenticated(token), true);
    logout(token);
  }
});
