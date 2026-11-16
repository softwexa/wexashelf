import { handler, body } from "@/lib/server/api";
import { requireAdmin, sameOrigin, rateLimit } from "@/lib/server/auth";
import { check } from "@/lib/server/validation";
import {
  fetchRefresh,
  getRefreshState,
  reviewRefresh,
} from "@/lib/server/source-refresh";
export const runtime = "nodejs";
export const GET = handler(async (request: Request) => {
  requireAdmin(request);
  return getRefreshState();
});
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  const b = await body(request);
  check(
    ["fetch", "preview", "apply", "dismiss"].includes(String(b.action)),
    "Geçersiz işlem.",
  );
  if (b.action === "fetch" || b.action === "preview") {
    rateLimit("apple:global", 20, 60 * 60 * 1000);
    check(
      typeof b.appId === "string" &&
        typeof b.country === "string" &&
        (b.platform === undefined || typeof b.platform === "string"),
      "Uygulama ve ülke gerekli.",
    );
    return fetchRefresh(b.appId, b.country, b.platform as string | undefined);
  }
  rateLimit("refresh:review", 120, 60 * 60 * 1000);
  check(typeof b.id === "string", "Aday kimliği gerekli.");
  return reviewRefresh(b.id, b.action as "apply" | "dismiss");
});
