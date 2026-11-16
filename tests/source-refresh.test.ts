import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fetchRefresh,
  reviewRefresh,
  getRefreshState,
} from "../src/lib/server/source-refresh";
import {
  getAdminSnapshot,
  saveRecord,
  exportBackup,
  restoreBackup,
} from "../src/lib/server/store";
import type { AppRecord } from "../src/lib/domain";
import { lookupApple } from "../src/lib/server/apple-provider";
test("refresh preview, whitelist apply, conflict, dismiss, restore and provider validation", async () => {
  const dir = mkdtempSync(join(tmpdir(), "source-refresh-"));
  process.env.APP_DATA_DIR = dir;
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      resultCount: 1,
      results: [
        {
          trackId: 123,
          trackName: "Verified",
          description: "provider description",
          averageUserRating: 4.5,
          userRatingCount: 42,
        },
      ],
    });
  try {
    const seed = getAdminSnapshot().records.find((r) => r.kind === "app")!;
    const r = saveRecord({
      ...seed,
      status: "draft",
      data: {
        ...seed.data,
        storeLinks: {
          ...(seed.data as AppRecord).storeLinks,
          ios: "https://apps.apple.com/tr/app/id123",
        },
      },
    });
    const c = await fetchRefresh(r.id, "TR");
    assert.equal(c.status, "pending");
    assert.equal(
      getAdminSnapshot().records.find((x) => x.id === r.id)?.revision,
      r.revision,
    );
    const applied = reviewRefresh(c.id, "apply");
    assert.equal(applied.status, "applied");
    const current = getAdminSnapshot().records.find((x) => x.id === r.id)!;
    const data = current.data as AppRecord;
    assert.equal(data.description, (r.data as AppRecord).description);
    assert.equal(data.checkedAt, (r.data as AppRecord).checkedAt);
    assert.deepEqual(data.facts, (r.data as AppRecord).facts);
    assert.equal(current.status, "draft");
    assert.equal(
      data.storeMetrics.find((m) => m.platform === "ios")?.downloadsLowerBound,
      null,
    );
    assert.equal(
      data.storeMetrics.find((m) => m.platform === "ios")?.ratingCount,
      42,
    );
    const conflict = await fetchRefresh(r.id, "TR");
    saveRecord({ ...current, reviewNote: "concurrent change" });
    assert.throws(() => reviewRefresh(conflict.id, "apply"), /Kayıt değişti/);
    assert.equal(reviewRefresh(conflict.id, "dismiss").status, "dismissed");
    await assert.rejects(
      () => fetchRefresh(r.id, "TR", "android"),
      /sağlayıcı yok/,
    );
    globalThis.fetch = async () =>
      Response.json({
        resultCount: 1,
        results: [
          {
            trackId: 123,
            trackName: "bad",
            description: "bad",
            averageUserRating: 9,
          },
        ],
      });
    assert.equal((await fetchRefresh(r.id, "TR")).status, "error");
    await assert.rejects(() => lookupApple("123&x=1", "TR"));
    await fetchRefresh(r.id, "TR");
    assert.ok(getRefreshState().candidates.length);
    restoreBackup(exportBackup());
    assert.equal(getRefreshState().candidates.length, 0);
  } finally {
    globalThis.fetch = original;
    rmSync(dir, { recursive: true, force: true });
  }
});
