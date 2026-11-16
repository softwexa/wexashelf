import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractStoreId,
  type StoreIdentity,
} from "../src/lib/store-identities";
import {
  getAdminSnapshot,
  saveRecord,
  exportBackup,
  restoreBackup,
  importRecords,
} from "../src/lib/server/store";
import { validateManaged } from "../src/lib/server/validation";
import type { AppRecord, ManagedRecord } from "../src/lib/domain";
process.env.APP_DATA_DIR = mkdtempSync(join(tmpdir(), "store-identities-"));
const identity: StoreIdentity = {
  platform: "android",
  storeId: "org.example.identity",
  country: "TR",
  sourceUrl:
    "https://play.google.com/store/apps/details?id=org.example.identity&gl=tr",
  checkedAt: "2026-01-01",
};
function draft(id: string, storeIds?: StoreIdentity[]): ManagedRecord {
  const seed = getAdminSnapshot().records.find((r) => r.kind === "app")!;
  return {
    ...seed,
    status: "draft",
    revision: 0,
    id,
    data: {
      ...(seed.data as AppRecord),
      id,
      platforms: ["android", "ios", "windows"],
      storeIds,
    },
  };
}
test("official product extraction rejects homepages, lookalike hosts and ambiguous IDs", () => {
  assert.equal(extractStoreId("android", identity.sourceUrl), identity.storeId);
  assert.equal(
    extractStoreId("ios", "https://apps.apple.com/tr/app/notion/id1232780281"),
    "1232780281",
  );
  assert.equal(
    extractStoreId(
      "windows",
      "https://apps.microsoft.com/detail/XP89DCGQ3K6VLD",
    ),
    "XP89DCGQ3K6VLD",
  );
  assert.equal(
    extractStoreId("windows", "https://apps.microsoft.com/detail/9wzdncrfhvjl"),
    "9WZDNCRFHVJL",
  );
  for (const url of [
    "https://play.google.com",
    identity.sourceUrl.replace("play.google.com", "play.google.com.evil.test"),
    identity.sourceUrl + "&id=org.other.app",
    identity.sourceUrl.replace("https:", "http:"),
  ])
    assert.equal(extractStoreId("android", url), null);
});
test("optional identity records validate URL identity, country and safe dates", () => {
  assert.doesNotThrow(() => validateManaged(draft("legacy")));
  assert.doesNotThrow(() => validateManaged(draft("valid", [identity])));
  for (const change of [
    { storeId: "org.other.app" },
    { country: "ZZ" },
    { country: "US" },
    { checkedAt: "2026-02-30" },
    { checkedAt: "2999-01-01" },
    { sourceUrl: "https://play.google.com/" },
  ])
    assert.throws(() =>
      validateManaged(draft("invalid", [{ ...identity, ...change }])),
    );
});
test("save, import and backup uniqueness is atomic, edits allowed, legacy backups retained", () => {
  const original = saveRecord(draft("identity-owner", [identity]));
  assert.doesNotThrow(() => saveRecord(original));
  const before = exportBackup();
  assert.throws(
    () => saveRecord(draft("identity-conflict", [identity])),
    /başka uygulamaya/,
  );
  const imported = importRecords(
    [draft("new-first"), draft("new-conflict", [identity])],
    false,
  );
  assert.equal(imported.valid, false);
  assert.equal(imported.imported, 0);
  assert.deepEqual(exportBackup().records, before.records);
  const conflicting = { ...draft("backup-conflict", [identity]), revision: 1 };
  const backup = {
    ...before,
    records: [...before.records, conflicting],
    revisions: [...before.revisions, conflicting],
  };
  assert.throws(() => restoreBackup(backup, true), /başka uygulamaya/);
  assert.throws(() => restoreBackup(backup), /başka uygulamaya/);
  assert.deepEqual(exportBackup().records, before.records);
  assert.doesNotThrow(() => restoreBackup(before));
  assert.doesNotThrow(() =>
    saveRecord(
      draft("other-country", [
        {
          ...identity,
          country: "US",
          sourceUrl: identity.sourceUrl.replace("gl=tr", "gl=us"),
        },
      ]),
    ),
  );
});
