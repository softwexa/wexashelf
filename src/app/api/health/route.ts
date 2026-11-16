import { db } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  try {
    db().prepare("SELECT 1").get();
    return Response.json({ status: "ok" }, { headers });
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
