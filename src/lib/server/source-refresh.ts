import { randomUUID } from "node:crypto";
import type { AppRecord, ManagedRecord } from "../domain";
import type {
  RefreshCandidate,
  RefreshPatch,
  RefreshState,
} from "../source-refresh";
import { extractStoreId, isStoreCountry } from "../store-identities";
import { db, getAdminSnapshot, saveRecord, transaction } from "./store";
import { check, StoreError } from "./validation";
import { lookupApple } from "./apple-provider";
const patch = (a: AppRecord): RefreshPatch => ({
  storeMetrics: a.storeMetrics,
  storeIds: a.storeIds ?? [],
  storeLinks: a.storeLinks,
});
function record(id: string): ManagedRecord<"app"> {
  const row = db()
    .prepare("SELECT payload FROM records WHERE kind='app' AND id=?")
    .get(id);
  check(row, "Uygulama bulunamadı.");
  return JSON.parse(row.payload as string);
}
function put(c: RefreshCandidate) {
  db()
    .prepare("INSERT OR REPLACE INTO source_refresh VALUES(?,?)")
    .run(c.id, JSON.stringify(c));
  // Keep a bounded queue/history, including pending entries. Old entries expire by eviction.
  db().exec(
    "DELETE FROM source_refresh WHERE rowid NOT IN (SELECT rowid FROM source_refresh ORDER BY rowid DESC LIMIT 500)",
  );
  return c;
}
export function getRefreshState(): RefreshState {
  return {
    candidates: db()
      .prepare("SELECT payload FROM source_refresh ORDER BY rowid DESC")
      .all()
      .map((r) => JSON.parse(r.payload as string)),
    providers: { ios: "apple-lookup", android: "manual", windows: "manual" },
    freshness: getAdminSnapshot()
      .records.filter((r) => r.kind === "app")
      .map((r) => {
        const a = r.data as AppRecord;
        const dates: { field: string; checkedAt: string | null }[] = [
          ...a.storeMetrics.map((m) => ({
            field: `storeMetrics.${m.platform}.${m.country}`,
            checkedAt: m.observedAt,
          })),
          ...(a.storeIds ?? []).map((i) => ({
            field: `storeIds.${i.platform}.${i.country}`,
            checkedAt: i.checkedAt,
          })),
          ...a.facts.map((f) => ({
            field: `facts.${f.platform}.${f.key}`,
            checkedAt: f.checkedAt,
          })),
          ...a.plans.map((p) => ({
            field: `plans.${p.id}`,
            checkedAt: p.checkedAt,
          })),
        ];
        for (const platform of a.platforms)
          if (!a.storeMetrics.some((m) => m.platform === platform))
            dates.push({ field: `storeMetrics.${platform}`, checkedAt: null });
        return {
          appId: r.id,
          name: a.name,
          fields: dates.map((d) => ({
            ...d,
            state:
              !d.checkedAt || !Number.isFinite(Date.parse(d.checkedAt))
                ? "unknown"
                : Date.now() - Date.parse(d.checkedAt) > 90 * 86400000
                  ? "stale"
                  : "fresh",
          })),
        };
      }),
  };
}
export async function fetchRefresh(
  appId: string,
  country: string,
  platform = "ios",
) {
  check(
    platform === "ios",
    "Bu mağazada otomatik sağlayıcı yok; elle kaynak incelemesi gerekli.",
  );
  country = country.toUpperCase();
  check(isStoreCountry(country), "Geçersiz ülke.");
  const r = record(appId);
  const a = r.data;
  const id =
    a.storeIds?.find((i) => i.platform === "ios" && i.country === country)
      ?.storeId ?? extractStoreId("ios", a.storeLinks?.ios ?? "");
  check(
    id,
    "Doğrulanmış Apple kimliği veya tam resmi ürün bağlantısı gerekli.",
  );
  const now = new Date().toISOString();
  const c: RefreshCandidate = {
    id: randomUUID(),
    appId,
    baseRevision: r.revision,
    status: "pending",
    source: `https://itunes.apple.com/lookup?id=${id}&country=${country.toLowerCase()}`,
    createdAt: now,
    updatedAt: now,
    before: patch(a),
    after: patch(a),
    diff: [],
  };
  try {
    const result = await lookupApple(id, country);
    c.after = {
      storeLinks: { ...a.storeLinks, ios: result.storeLink },
      storeIds: [
        ...(a.storeIds ?? []).filter(
          (i) => !(i.platform === "ios" && i.country === country),
        ),
        {
          platform: "ios",
          storeId: id,
          country,
          sourceUrl: result.storeLink,
          checkedAt: result.observedAt,
        },
      ],
      storeMetrics: [
        ...a.storeMetrics.filter(
          (m) => !(m.platform === "ios" && m.country === country),
        ),
        {
          platform: "ios",
          country,
          downloadsLowerBound: null,
          rating: result.rating,
          ratingCount: result.ratingCount,
          sourceUrl: result.source,
          observedAt: result.observedAt,
        },
      ],
    };
    c.diff = (Object.keys(c.after) as (keyof RefreshPatch)[]).filter(
      (k) => JSON.stringify(c.before[k]) !== JSON.stringify(c.after[k]),
    );
  } catch (e) {
    c.status = "error";
    c.error =
      e instanceof StoreError
        ? e.message
        : "Apple kaynağı okunamadı; yeniden deneyin.";
  }
  return put(c);
}
export function reviewRefresh(id: string, action: "apply" | "dismiss") {
  return transaction(() => {
    const row = db()
      .prepare("SELECT payload FROM source_refresh WHERE id=?")
      .get(id);
    check(row, "Aday bulunamadı.");
    const c = JSON.parse(row.payload as string) as RefreshCandidate;
    check(c.status === "pending", "Yalnız bekleyen aday incelenebilir.");
    if (action === "apply") {
      const r = record(c.appId);
      if (r.revision !== c.baseRevision)
        throw new StoreError("Kayıt değişti; yeni kaynak adayı alın.", 409);
      saveRecord(
        {
          ...r,
          data: {
            ...r.data,
            storeMetrics: c.after.storeMetrics,
            storeIds: c.after.storeIds,
            storeLinks: c.after.storeLinks,
          },
        },
        true,
      );
      c.status = "applied";
    } else c.status = "dismissed";
    c.updatedAt = new Date().toISOString();
    return put(c);
  });
}
