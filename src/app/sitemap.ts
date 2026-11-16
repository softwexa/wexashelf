import { getPublicSnapshot } from "@/lib/server/store";
import { buildSitemap } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function sitemap() {
  return buildSitemap(getPublicSnapshot());
}
