import { storeIdentityKey } from "../store-identities";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { resolve, join } from "node:path";
import { APPS } from "../catalog";
import { ARTICLES, EDITORIAL_LISTS, APP_ENRICHMENTS } from "../editorial";
import type {
  AppRecord,
  CatalogSnapshot,
  ManagedRecord,
  RecordKind,
  FeedbackRecord,
  AuditEvent,
} from "../domain";
import { check, object, StoreError, validateManaged } from "./validation";
import { getSiteSettings } from "./settings";
import { parseSiteSettings } from "../site-settings";
import { evaluateAdmission, validateAdmissionRules } from "../admission";
import { getAdmissionRules } from "./admission";
let cached: { path: string; db: DatabaseSync } | undefined;
export function dataDirectory() {
  return resolve(
    /* turbopackIgnore: true */ process.env.APP_DATA_DIR || ".local/data",
  );
}
export function db() {
  const dir = dataDirectory();
  if (cached?.path === dir) return cached.db;
  cached?.db.close();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(join(dir, "catalog.sqlite"));
  chmodSync(join(dir, "catalog.sqlite"), 0o600);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS source_refresh(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id));
 CREATE TABLE IF NOT EXISTS revisions(kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id,revision));
 CREATE TABLE IF NOT EXISTS feedback(id INTEGER PRIMARY KEY,appId TEXT,field TEXT,message TEXT,status TEXT,createdAt TEXT);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,action TEXT,subject TEXT,detail TEXT,createdAt TEXT);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER,expires INTEGER);`);
  cached = { path: dir, db: database };
  if (!database.prepare("SELECT value FROM settings WHERE key=?").get("seeded"))
    transaction(() => {
      for (const a of APPS) {
        const data: AppRecord = {
          ...a,
          publisher: new URL(a.website).hostname,
          tags: [],
          aliases: [],
          pricingModel: "unknown",
          facts: [],
          plans: [],
          storeMetrics: [],
          ...APP_ENRICHMENTS[a.id],
        };
        write({
          kind: "app",
          id: a.id,
          data,
          status: "published",
          revision: 1,
          updatedAt: new Date().toISOString(),
          reviewNote:
            "Resmi kaynaklara dayalı başlangıç kaydı; uygulamalı test değildir.",
          seoApproved: false,
          publishAt: null,
        });
      }
      for (const [kind, items] of [
        ["article", ARTICLES],
        ["list", EDITORIAL_LISTS],
      ] as const)
        for (const data of items)
          write({
            kind,
            id: data.id,
            data,
            status: "published",
            revision: 1,
            updatedAt: new Date().toISOString(),
            reviewNote: "Editoryal başlangıç içeriği.",
            seoApproved: false,
            publishAt: null,
          });
      database.prepare("INSERT INTO settings VALUES (?,?)").run("seeded", "1");
    });
  return database;
}
export function transaction<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
function audit(action: string, subject: string, detail = "") {
  db()
    .prepare(
      "INSERT INTO audit(action,subject,detail,createdAt) VALUES(?,?,?,?)",
    )
    .run(action, subject, detail, new Date().toISOString());
}
function write(record: ManagedRecord) {
  const payload = JSON.stringify(record);
  db()
    .prepare("INSERT OR REPLACE INTO records VALUES(?,?,?)")
    .run(record.kind, record.id, payload);
  db()
    .prepare("INSERT INTO revisions VALUES(?,?,?,?)")
    .run(record.kind, record.id, record.revision, payload);
}
function all(): ManagedRecord[] {
  return db()
    .prepare("SELECT payload FROM records ORDER BY kind,id")
    .all()
    .map((r) => JSON.parse(r.payload as string));
}
function validateIdentityUniqueness(records: ManagedRecord[]) {
  const owners = new Map<string, string>();
  for (const record of records) {
    if (record.kind !== "app" || record.status === "archived") continue;
    for (const identity of (record.data as AppRecord).storeIds ?? []) {
      const key = storeIdentityKey(identity);
      const owner = owners.get(key);
      check(
        !owner || owner === record.id,
        `Mağaza kimliği başka uygulamaya ait: ${key} (${owner}).`,
      );
      owners.set(key, record.id);
    }
  }
}
export function history(kind: string, id: string): ManagedRecord[] {
  return db()
    .prepare(
      "SELECT payload FROM revisions WHERE kind=? AND id=? ORDER BY revision DESC",
    )
    .all(kind, id)
    .map((r) => JSON.parse(r.payload as string));
}
export function getAdminSnapshot() {
  return {
    records: all(),
    feedback: db()
      .prepare("SELECT * FROM feedback ORDER BY id DESC LIMIT 500")
      .all() as unknown as FeedbackRecord[],
    audit: db()
      .prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 500")
      .all() as unknown as AuditEvent[],
  };
}
export function getPublicSnapshot(): CatalogSnapshot {
  const admissionRules = getAdmissionRules();
  const admissions: NonNullable<CatalogSnapshot["admissions"]> = {};
  const records = all()
    .filter(
      (r) =>
        r.status === "published" ||
        (r.status === "scheduled" &&
          r.publishAt &&
          Date.parse(r.publishAt) <= Date.now()),
    )
    .filter((record) => {
      if (record.kind !== "app") return true;
      const result = evaluateAdmission(
        record.data as AppRecord,
        admissionRules,
        record.admissionException,
      );
      if (result.accepted) admissions[record.id] = result;
      return result.accepted;
    });
  return {
    admissionRules,
    admissions,
    siteSettings: getSiteSettings(),
    apps: records
      .filter((r) => r.kind === "app")
      .map((r) => r.data) as CatalogSnapshot["apps"],
    articles: records
      .filter((r) => r.kind === "article")
      .map((r) => r.data) as CatalogSnapshot["articles"],
    lists: records
      .filter((r) => r.kind === "list")
      .map((r) => r.data) as CatalogSnapshot["lists"],
    records: records.map(({ id, kind, updatedAt, seoApproved }) => ({
      id,
      kind,
      updatedAt,
      seoApproved,
    })),
  };
}
export function saveRecord(
  input: unknown,
  withinTransaction = false,
): ManagedRecord {
  const r = validateManaged(input);
  const save = () => {
    validateIdentityUniqueness([
      ...all().filter((old) => old.kind !== r.kind || old.id !== r.id),
      r,
    ]);
    if (r.kind === "app" && ["published", "scheduled"].includes(r.status)) {
      const result = evaluateAdmission(
        r.data as AppRecord,
        getAdmissionRules(),
        r.admissionException,
      );
      check(
        result.accepted,
        "Kayıt kabul kurallarını karşılamıyor. Kaynaklı mağaza gözlemi veya en az 20 karakterlik editör istisnası gerekçesi gerekli.",
      );
    }
    const old = db()
      .prepare("SELECT payload FROM records WHERE kind=? AND id=?")
      .get(r.kind, r.id);
    const previous = old
      ? (JSON.parse(old.payload as string) as ManagedRecord)
      : undefined;
    if (previous && r.revision !== previous.revision)
      throw new StoreError("Kayıt değişti. Son sürümü yükleyin.", 409);
    if (!previous && r.revision && r.revision !== 0)
      throw new StoreError("Kayıt bulunamadı veya revizyon geçersiz.", 409);
    const next = {
      ...r,
      revision: (previous?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    if (
      previous &&
      JSON.stringify(previous.data) !== JSON.stringify(next.data)
    ) {
      next.seoApproved = false;
      if (next.kind === "app")
        for (const linked of all()) {
          const related =
            linked.kind === "article"
              ? (
                  linked.data as import("../domain").ArticleRecord
                ).appIds.includes(next.id)
              : linked.kind === "list"
                ? (
                    linked.data as import("../domain").EditorialList
                  ).entries.some((e) => e.appId === next.id)
                : false;
          if (related)
            write({
              ...linked,
              revision: linked.revision + 1,
              updatedAt: next.updatedAt,
              seoApproved: false,
              reviewNote:
                "Bağlı uygulama değişti; kaynak ve SEO incelemesi gerekli.",
            });
        }
    }
    write(next);
    audit(
      "save",
      `${r.kind}:${r.id}`,
      `${next.status}; revision=${next.revision}`,
    );
    return next;
  };
  return withinTransaction ? save() : transaction(save);
}
export function restoreRevision(
  kind: RecordKind,
  id: string,
  revision: number,
) {
  const row = db()
    .prepare(
      "SELECT payload FROM revisions WHERE kind=? AND id=? AND revision=?",
    )
    .get(kind, id, revision);
  check(row, "Revizyon bulunamadı.");
  const old = JSON.parse(row.payload as string) as ManagedRecord;
  const current = history(kind, id)[0];
  return saveRecord({
    ...old,
    status: "draft",
    seoApproved: false,
    publishAt: null,
    revision: current.revision,
    reviewNote: `${revision} numaralı revizyondan geri yüklendi.`,
  });
}
export function exportBackup() {
  return {
    admissionRules: getAdmissionRules(),
    siteSettings: getSiteSettings(),
    sourceRefreshRestorePolicy: "clear-history-and-pending",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: all(),
    revisions: db()
      .prepare("SELECT payload FROM revisions ORDER BY kind,id,revision")
      .all()
      .map((r) => JSON.parse(r.payload as string)),
    feedback: db().prepare("SELECT * FROM feedback ORDER BY id").all(),
  };
}
export function restoreBackup(input: unknown, dryRun = false) {
  const b = object(input);
  let admissionRules: ReturnType<typeof validateAdmissionRules> | null = null;
  if (b.admissionRules !== undefined) {
    try {
      admissionRules = validateAdmissionRules(b.admissionRules);
    } catch {
      throw new StoreError("Yedekte geçersiz kabul kuralları.");
    }
  }
  const appearance =
    b.siteSettings === undefined ? null : parseSiteSettings(b.siteSettings);
  check(!appearance || appearance.ok, "Yedekte geçersiz site ayarları.");
  check(
    b.version === 1 && Array.isArray(b.records) && b.records.length <= 10000,
    "Geçersiz yedek.",
  );
  const records = b.records.map((x) => validateManaged(x));
  validateIdentityUniqueness(records);
  const keys = new Set<string>();
  for (const r of records) {
    const k = `${r.kind}:${r.id}`;
    check(!keys.has(k), "Yinelenen kayıt.");
    keys.add(k);
    check(Number.isInteger(r.revision) && r.revision > 0, "Geçersiz revizyon.");
  }
  check(
    Array.isArray(b.revisions) && b.revisions.length <= 100000,
    "Revizyon listesi gerekli.",
  );
  const revisions = b.revisions.map((x) => validateManaged(x));
  const revisionKeys = new Set<string>();
  for (const r of revisions) {
    const k = `${r.kind}:${r.id}:${r.revision}`;
    check(
      Number.isInteger(r.revision) && r.revision > 0 && !revisionKeys.has(k),
      "Geçersiz veya yinelenen revizyon.",
    );
    revisionKeys.add(k);
  }
  for (const r of records)
    check(
      !revisions.some(
        (h) => h.kind === r.kind && h.id === r.id && h.revision > r.revision,
      ),
      "Güncel kayıt revizyon geçmişinin gerisinde.",
    );
  check(
    Array.isArray(b.feedback) && b.feedback.length <= 10000,
    "Geri bildirim listesi gerekli.",
  );
  const feedback = b.feedback.map((v) => {
    const f = object(v);
    check(
      Number.isInteger(f.id) &&
        Number(f.id) > 0 &&
        typeof f.appId === "string" &&
        typeof f.field === "string" &&
        f.field.length <= 80 &&
        typeof f.message === "string" &&
        f.message.length <= 2000 &&
        ["open", "resolved", "dismissed"].includes(String(f.status)) &&
        typeof f.createdAt === "string",
      "Geçersiz geri bildirim.",
    );
    return f;
  });
  check(
    new Set(feedback.map((f) => f.id)).size === feedback.length,
    "Yinelenen geri bildirim.",
  );
  if (dryRun) return { valid: true, count: records.length };
  transaction(() => {
    if (admissionRules)
      db()
        .prepare(
          "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run(
          "admission-rules",
          JSON.stringify({
            ...admissionRules,
            revision: getAdmissionRules().revision + 1,
          }),
        );
    if (appearance?.ok) {
      const settings = {
        ...appearance.value,
        revision: getSiteSettings().revision + 1,
      };
      db()
        .prepare(
          "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        )
        .run("site-settings", JSON.stringify(settings));
    }
    db().exec(
      "DELETE FROM source_refresh; DELETE FROM records; DELETE FROM revisions; DELETE FROM feedback",
    );
    for (const r of revisions)
      db()
        .prepare("INSERT INTO revisions VALUES(?,?,?,?)")
        .run(r.kind, r.id, r.revision, JSON.stringify(r));
    for (const r of records) {
      db()
        .prepare("INSERT INTO records VALUES(?,?,?)")
        .run(r.kind, r.id, JSON.stringify(r));
      db()
        .prepare("INSERT OR REPLACE INTO revisions VALUES(?,?,?,?)")
        .run(r.kind, r.id, r.revision, JSON.stringify(r));
    }
    for (const f of feedback)
      db()
        .prepare("INSERT INTO feedback VALUES(?,?,?,?,?,?)")
        .run(
          Number(f.id),
          String(f.appId),
          String(f.field),
          String(f.message),
          String(f.status),
          String(f.createdAt),
        );
    audit("restore-backup", "catalog", String(records.length));
  });
  return { restored: records.length };
}
export function importRecords(input: unknown, dryRun = true) {
  check(
    Array.isArray(input) && input.length <= 100,
    "En çok 100 kayıt alınabilir.",
  );
  const errors: string[] = [];
  const records: ManagedRecord[] = [];
  const keys = new Set(all().map((r) => `${r.kind}:${r.id}`));
  input.forEach((x, i) => {
    try {
      const raw = object(x);
      const r = validateManaged({
        ...raw,
        status: "draft",
        seoApproved: false,
        publishAt: null,
        reviewNote: "İçe aktarılan taslak",
        revision: 0,
      });
      const key = `${r.kind}:${r.id}`;
      check(!keys.has(key), "Kimlik zaten var veya yineleniyor.");
      keys.add(key);
      records.push(r);
    } catch (e) {
      errors.push(
        `${i + 1}: ${e instanceof Error ? e.message : "Geçersiz kayıt"}`,
      );
    }
  });
  try {
    validateIdentityUniqueness([...all(), ...records]);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "Yinelenen mağaza kimliği.");
  }
  if (!dryRun && errors.length === 0)
    transaction(() => {
      validateIdentityUniqueness([...all(), ...records]);
      for (const r of records)
        check(
          !db()
            .prepare("SELECT id FROM records WHERE kind=? AND id=?")
            .get(r.kind, r.id),
          "Kimlik içe aktarma sırasında eklendi.",
        );
      for (const r of records)
        write({ ...r, revision: 1, updatedAt: new Date().toISOString() });
      audit("import", "catalog", String(records.length));
    });
  return {
    valid: errors.length === 0,
    errors,
    records,
    imported: !dryRun && errors.length === 0 ? records.length : 0,
  };
}
export function submitFeedback(input: unknown) {
  const f = object(input);
  check(
    typeof f.appId === "string" &&
      getPublicSnapshot().apps.some((a) => a.id === f.appId),
    "Uygulama bulunamadı.",
  );
  check(
    typeof f.field === "string" && f.field.length > 0 && f.field.length <= 80,
    "Alan 1–80 karakter olmalı.",
  );
  check(
    typeof f.message === "string" &&
      f.message.trim().length >= 10 &&
      f.message.length <= 2000,
    "Mesaj 10–2000 karakter olmalı.",
  );
  check(!f.website, "Geçersiz istek.");
  const result = db()
    .prepare(
      "INSERT INTO feedback(appId,field,message,status,createdAt) VALUES(?,?,?,?,?)",
    )
    .run(f.appId, f.field, f.message.trim(), "open", new Date().toISOString());
  return { id: Number(result.lastInsertRowid) };
}
export function updateFeedback(id: number, status: string) {
  check(
    Number.isInteger(id) && ["open", "resolved", "dismissed"].includes(status),
    "Geçersiz geri bildirim.",
  );
  const r = db()
    .prepare("UPDATE feedback SET status=? WHERE id=?")
    .run(status, id);
  check(r.changes, "Geri bildirim bulunamadı.");
  audit("feedback", String(id), status);
  return { ok: true };
}
