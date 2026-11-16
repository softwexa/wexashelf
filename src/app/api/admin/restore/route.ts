import { handler, body } from "@/lib/server/api";
import { check } from "@/lib/server/validation";
import type { RecordKind } from "@/lib/domain";
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
    typeof b.kind === "string" &&
      ["app", "article", "list"].includes(b.kind) &&
      typeof b.id === "string" &&
      typeof b.revision === "number" &&
      Number.isSafeInteger(b.revision),
    "Geçersiz revizyon isteği.",
  );
  return { record: restoreRevision(b.kind as RecordKind, b.id, b.revision) };
});
