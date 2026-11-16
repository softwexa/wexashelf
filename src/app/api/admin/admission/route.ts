import { handler, body } from "@/lib/server/api";
import { requireAdmin, sameOrigin } from "@/lib/server/auth";
import {
  getAdmissionRules,
  getAdmissionPreview,
  saveAdmissionRules,
} from "@/lib/server/admission";
import { validateAdmissionRules } from "@/lib/admission";
import { StoreError } from "@/lib/server/validation";
export const runtime = "nodejs";
export const GET = handler(async (request: Request) => {
  requireAdmin(request);
  const rules = getAdmissionRules();
  return { rules, preview: getAdmissionPreview(rules) };
});
export const POST = handler(async (request: Request) => {
  sameOrigin(request);
  requireAdmin(request);
  const b = await body(request);
  let rules;
  try {
    rules = validateAdmissionRules(b.rules);
  } catch (e) {
    throw new StoreError(e instanceof Error ? e.message : "Geçersiz kurallar.");
  }
  if (b.dryRun === false) rules = saveAdmissionRules(rules);
  return { rules, preview: getAdmissionPreview(rules) };
});
