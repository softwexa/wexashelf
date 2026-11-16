import { handler, body } from "@/lib/server/api";
import { check } from "@/lib/server/validation";
import {
  authenticated,
  cookieToken,
  configured,
  requireAdmin,
  sameOrigin,
  login,
  logout,
  sessionCookie,
  rateLimit,
} from "@/lib/server/auth";
import {
  getAdminSnapshot,
  history,
  exportBackup,
  saveRecord,
  restoreRevision,
  restoreBackup,
  importRecords,
  updateFeedback,
  submitFeedback,
} from "@/lib/server/store";
export const runtime = "nodejs";
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  const b = await body(request);
  check(
    typeof b.id === "number" && typeof b.status === "string",
    "Geçersiz bildirim isteği.",
  );
  return updateFeedback(b.id, b.status);
});
