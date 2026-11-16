import { body } from "./api";
import { check, object, StoreError } from "./validation";
import { isStoreCountry } from "../store-identities";
export async function lookupApple(id: string, country: string) {
  check(
    /^[1-9][0-9]{0,14}$/.test(id) && Number.isSafeInteger(Number(id)),
    "Geçersiz Apple kimliği.",
  );
  country = country.toUpperCase();
  check(isStoreCountry(country), "Geçersiz ülke.");
  const source = `https://itunes.apple.com/lookup?id=${id}&country=${country.toLowerCase()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(source, {
      signal: controller.signal,
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new StoreError("Apple kaynağı yanıt vermedi.", 502);
    const result = await body(
      new Request(source, {
        method: "POST",
        body: response.body,
        duplex: "half",
      } as RequestInit),
    );
    check(
      result.resultCount === 1 &&
        Array.isArray(result.results) &&
        result.results.length === 1,
      "Uygulama bulunamadı.",
    );
    const app = object(result.results[0]);
    check(
      app.trackId === Number(id) &&
        typeof app.trackName === "string" &&
        app.trackName.trim().length > 0 &&
        app.trackName.length <= 300 &&
        typeof app.description === "string",
      "Apple kaydı kimlik veya metaverisi geçersiz.",
    );
    const rating = app.averageUserRating ?? null;
    const ratingCount = app.userRatingCount ?? null;
    check(
      rating === null ||
        (typeof rating === "number" &&
          Number.isFinite(rating) &&
          rating >= 0 &&
          rating <= 5),
      "Geçersiz Apple puanı.",
    );
    check(
      ratingCount === null ||
        (typeof ratingCount === "number" &&
          Number.isSafeInteger(ratingCount) &&
          ratingCount >= 0),
      "Geçersiz Apple oy sayısı.",
    );
    return {
      source,
      app,
      country,
      id,
      rating: rating as number | null,
      ratingCount: ratingCount as number | null,
      observedAt: new Date().toISOString(),
      storeLink: `https://apps.apple.com/${country.toLowerCase()}/app/id${id}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
