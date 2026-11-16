import { handler, body } from "@/lib/server/api";
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
export const GET = handler(async (request: Request) => {
  requireAdmin(request);
  const u = new URL(request.url);
  return {
    revisions: history(
      u.searchParams.get("kind") || "",
      u.searchParams.get("id") || "",
    ),
  };
});
