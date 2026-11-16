import { body, handler } from "@/lib/server/api";
import { requireAdmin, sameOrigin } from "@/lib/server/auth";
import { getSiteSettings, saveSiteSettings } from "@/lib/server/settings";
export const runtime = "nodejs";
export const GET = handler(async (request: Request) => {
  requireAdmin(request);
  return { settings: getSiteSettings() };
});
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  return { settings: saveSiteSettings(await body(request)) };
});
