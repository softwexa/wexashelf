import { lookupApple } from "@/lib/server/apple-provider";
import { handler, body } from "@/lib/server/api";
import { requireAdmin, sameOrigin, rateLimit } from "@/lib/server/auth";
import { check } from "@/lib/server/validation";
export const runtime = "nodejs";
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  rateLimit("apple:global", 20, 60 * 60 * 1000);
  const b = await body(request);
  check(
    typeof b.id === "string" && /^\d{1,15}$/.test(b.id),
    "Sayısal Apple kimliği gerekli.",
  );
  check(
    typeof b.country === "string" && /^[a-zA-Z]{2}$/.test(b.country),
    "İki harfli ülke kodu gerekli.",
  );
  const { source, app } = await lookupApple(
    b.id as string,
    b.country as string,
  );
  return {
    source,
    candidate: {
      name: app.trackName,
      publisher: app.sellerName,
      description: app.description,
      website: app.sellerUrl || "",
      storeLinks: {
        ios: `https://apps.apple.com/${b.country.toLowerCase()}/app/id${b.id}`,
      },
      platforms: ["ios"],
      pricingModel: "unknown",
      facts: [],
      plans: [],
      observedAt: new Date().toISOString(),
    },
    note: "Apple kaynak adayıdır; inceleme ve tam kayıt oluşturma gerekir. Otomatik yayımlanmaz.",
  };
});
