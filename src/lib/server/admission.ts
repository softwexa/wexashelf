import {
  DEFAULT_ADMISSION_RULES,
  evaluateAdmission,
  validateAdmissionRules,
  type AdmissionRules,
} from "../admission";
import type { AppRecord } from "../domain";
import { db, getAdminSnapshot, transaction } from "./store";
import { StoreError } from "./validation";
export function getAdmissionRules(): AdmissionRules {
  const row = db()
    .prepare("SELECT value FROM settings WHERE key=?")
    .get("admission-rules");
  if (!row) return structuredClone(DEFAULT_ADMISSION_RULES);
  try {
    return validateAdmissionRules(JSON.parse(String(row.value)));
  } catch {
    throw new StoreError(
      "Kaydedilmiş kabul kuralları geçersiz; yönetici onarımı gerekli.",
      500,
    );
  }
}
export function saveAdmissionRules(input: unknown) {
  let rules: AdmissionRules;
  try {
    rules = validateAdmissionRules(input);
  } catch (e) {
    throw new StoreError(e instanceof Error ? e.message : "Geçersiz kurallar.");
  }
  return transaction(() => {
    const current = getAdmissionRules();
    if (current.revision !== rules.revision)
      throw new StoreError("Kabul kuralları değişti; yeniden yükleyin.", 409);
    const next = { ...rules, revision: current.revision + 1 };
    db()
      .prepare(
        "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      )
      .run("admission-rules", JSON.stringify(next));
    db()
      .prepare(
        "INSERT INTO audit(action,subject,detail,createdAt) VALUES(?,?,?,?)",
      )
      .run(
        "admission-rules",
        "catalog",
        JSON.stringify(next),
        new Date().toISOString(),
      );
    return next;
  });
}
export function getAdmissionPreview(rules: AdmissionRules) {
  const items = getAdminSnapshot()
    .records.filter((r) => r.kind === "app")
    .map((r) => ({
      id: r.id,
      name: (r.data as AppRecord).name,
      ...evaluateAdmission(
        r.data as AppRecord,
        rules,
        (r as typeof r & { admissionException?: string }).admissionException,
      ),
    }));
  return {
    total: items.length,
    accepted: items.filter((i) => i.accepted).length,
    rejected: items.filter((i) => !i.accepted).length,
    exceptions: items.filter((i) => i.state === "exception").length,
    items,
  };
}
