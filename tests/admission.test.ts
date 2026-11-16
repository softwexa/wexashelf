import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { APPS } from "../src/lib/catalog";
import type { AppRecord } from "../src/lib/domain";
import {
  DEFAULT_ADMISSION_RULES,
  evaluateAdmission,
  validateAdmissionRules,
} from "../src/lib/admission";
import {
  getAdmissionRules,
  saveAdmissionRules,
  getAdmissionPreview,
} from "../src/lib/server/admission";
process.env.APP_DATA_DIR = mkdtempSync(join(tmpdir(), "admission-test-"));
const app: AppRecord = {
  ...APPS[0],
  publisher: "notion.com",
  tags: [],
  aliases: [],
  pricingModel: "unknown",
  facts: [],
  plans: [],
  storeMetrics: [],
};
const rules = validateAdmissionRules({
  ...DEFAULT_ADMISSION_RULES,
  profiles: {
    android: { enabled: true, minimum: 1000 },
    ios: { enabled: false, minimum: 0 },
    windows: { enabled: false, minimum: 0 },
  },
});
const observation: AppRecord["storeMetrics"][number] = {
  platform: "android",
  country: "TR",
  downloadsLowerBound: 1000,
  rating: 4,
  ratingCount: 10,
  sourceUrl: "https://play.google.com/store/apps/details?id=notion.id",
  observedAt: "2026-11-15T00:00:00Z",
};
test("unconfigured differs from passed and unknown sources cannot satisfy even zero threshold", () => {
  assert.equal(
    evaluateAdmission(app, DEFAULT_ADMISSION_RULES).state,
    "not-configured",
  );
  assert.equal(evaluateAdmission(app, rules).accepted, false);
  const measured = { ...app, storeMetrics: [observation] };
  assert.equal(evaluateAdmission(measured, rules).state, "passed");
  for (const patch of [
    { country: "US" },
    { sourceUrl: "https://evil.test" },
    { downloadsLowerBound: null },
    { observedAt: "invalid" },
  ])
    assert.equal(
      evaluateAdmission(
        { ...app, storeMetrics: [{ ...observation, ...patch }] },
        rules,
      ).accepted,
      false,
    );
  const zero = structuredClone(rules);
  zero.profiles.android.minimum = 0;
  assert.equal(evaluateAdmission(app, zero).accepted, false);
});
test("latest observation wins and inactive stores do not bypass policy", () => {
  const ios = {
    ...observation,
    platform: "ios" as const,
    downloadsLowerBound: 999999,
    ratingCount: 5000,
    sourceUrl: "https://apps.apple.com/app/id123",
  };
  assert.equal(
    evaluateAdmission({ ...app, storeMetrics: [ios] }, rules).accepted,
    false,
  );
  const active = structuredClone(rules);
  active.profiles.ios = { enabled: true, minimum: 100 };
  assert.equal(
    evaluateAdmission({ ...app, storeMetrics: [ios] }, active).accepted,
    true,
  );
  assert.equal(
    evaluateAdmission(
      { ...app, storeMetrics: [{ ...ios, ratingCount: 10 }] },
      active,
    ).accepted,
    false,
  );
  assert.equal(
    evaluateAdmission(
      {
        ...app,
        storeMetrics: [
          observation,
          { ...observation, observedAt: "2026-11-16", downloadsLowerBound: 10 },
        ],
      },
      rules,
    ).accepted,
    false,
  );
  assert.equal(
    evaluateAdmission(
      {
        ...app,
        storeMetrics: [
          { ...observation, downloadsLowerBound: 10, ratingCount: 99999 },
        ],
      },
      rules,
    ).accepted,
    false,
  );
});
test("explicit exceptions remain distinguishable and revisions conflict", () => {
  assert.equal(evaluateAdmission(app, rules, "short").accepted, false);
  assert.equal(
    evaluateAdmission(
      app,
      rules,
      "Belgelendirilmiş editoryal kullanım gerekçesi.",
    ).state,
    "exception",
  );
  assert.throws(() =>
    validateAdmissionRules({
      ...rules,
      profiles: { ...rules.profiles, android: { enabled: true, minimum: -1 } },
    }),
  );
  const initial = getAdmissionRules();
  assert.equal(initial.revision, 0);
  const saved = saveAdmissionRules(rules);
  assert.equal(saved.revision, 1);
  assert.throws(() => saveAdmissionRules(rules), /değişti/);
  const preview = getAdmissionPreview(saved);
  assert.equal(preview.total, 10);
  assert.equal(preview.items.length, 10);
  assert.equal(preview.accepted + preview.rejected, 10);
});
