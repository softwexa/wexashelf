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
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  return { record: saveRecord(await body(request)) };
});
