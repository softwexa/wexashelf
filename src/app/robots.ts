import type { MetadataRoute } from "next";
import { siteConfiguration } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  const config = siteConfiguration();
  return config.indexEnabled
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/", "/yonetim", "/ayarlar", "/kaydedilenler"],
        },
        sitemap: config.origin + "/sitemap.xml",
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
