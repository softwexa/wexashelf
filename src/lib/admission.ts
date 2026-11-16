import type { AppRecord } from "./domain";
import type { Platform } from "./catalog";
export interface AdmissionRules {
  revision: number;
  country: string;
  profiles: Record<Platform, { enabled: boolean; minimum: number }>;
}
export interface AdmissionEvaluation {
  accepted: boolean;
  state: "not-configured" | "passed" | "exception" | "rejected";
  reasons: string[];
}
export const DEFAULT_ADMISSION_RULES: AdmissionRules = {
  revision: 0,
  country: "TR",
  profiles: {
    android: { enabled: false, minimum: 0 },
    ios: { enabled: false, minimum: 0 },
    windows: { enabled: false, minimum: 0 },
  },
};
export function validateAdmissionRules(value: unknown): AdmissionRules {
  if (!value || typeof value !== "object")
    throw new Error("Geçersiz kabul kuralları.");
  const r = value as AdmissionRules;
  if (
    !Number.isSafeInteger(r.revision) ||
    r.revision < 0 ||
    typeof r.country !== "string" ||
    !/^[a-zA-Z]{2}$/.test(r.country) ||
    !r.profiles
  )
    throw new Error("Geçersiz kural revizyonu veya ülke.");
  const profiles = {} as AdmissionRules["profiles"];
  for (const p of ["android", "ios", "windows"] as const) {
    const rule = r.profiles[p];
    if (
      !rule ||
      typeof rule.enabled !== "boolean" ||
      !Number.isSafeInteger(rule.minimum) ||
      rule.minimum < 0
    )
      throw new Error("Eşik sıfır veya pozitif tam sayı olmalı.");
    profiles[p] = { enabled: rule.enabled, minimum: rule.minimum };
  }
  return { revision: r.revision, country: r.country.toUpperCase(), profiles };
}
function officialSource(platform: Platform, url: string) {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (
        {
          android: ["play.google.com"],
          ios: ["apps.apple.com", "itunes.apple.com"],
          windows: ["apps.microsoft.com", "www.microsoft.com"],
        } as Record<Platform, string[]>
      )[platform].includes(u.hostname)
    );
  } catch {
    return false;
  }
}
export function evaluateAdmission(
  app: AppRecord,
  rules: AdmissionRules,
  exceptionReason = "",
): AdmissionEvaluation {
  const enabled = (["android", "ios", "windows"] as const).filter(
    (p) => rules.profiles[p].enabled,
  );
  if (enabled.length === 0)
    return {
      accepted: true,
      state: "not-configured",
      reasons: ["Mağaza kabul eşikleri henüz yapılandırılmadı."],
    };
  const reasons: string[] = [];
  for (const p of enabled) {
    const label =
      p === "android"
        ? "Android indirme alt sınırı"
        : `${p === "ios" ? "iOS" : "Windows"} değerlendirme sayısı`;
    if (!app.platforms.includes(p)) {
      reasons.push(`${label}: bu platformda kayıt yok.`);
      continue;
    }
    const observations = app.storeMetrics
      .filter(
        (m) =>
          m.platform === p &&
          m.country.toUpperCase() === rules.country.toUpperCase() &&
          Number.isFinite(Date.parse(m.observedAt)),
      )
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
    const latest = observations[0];
    const value = latest
      ? p === "android"
        ? latest.downloadsLowerBound
        : latest.ratingCount
      : null;
    if (
      !latest ||
      !officialSource(p, latest.sourceUrl) ||
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < 0
    ) {
      reasons.push(`${label}: bu ülke için kaynaklı güncel gözlem yok.`);
      continue;
    }
    if (value >= rules.profiles[p].minimum)
      return {
        accepted: true,
        state: "passed",
        reasons: [
          `${label} ${value}; ${rules.country.toUpperCase()} eşiği ${rules.profiles[p].minimum} karşılandı.`,
        ],
      };
    reasons.push(
      `${label} ${value}; gerekli eşik ${rules.profiles[p].minimum}.`,
    );
  }
  if (exceptionReason.trim().length >= 20)
    return {
      accepted: true,
      state: "exception",
      reasons: [...reasons, `Editoryal istisna: ${exceptionReason.trim()}`],
    };
  return { accepted: false, state: "rejected", reasons };
}
