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
  logout(cookieToken(request));
  return Response.json(
    { authenticated: false },
    {
      headers: {
        "Set-Cookie": sessionCookie(request, ""),
        "Cache-Control": "no-store",
      },
    },
  );
});
