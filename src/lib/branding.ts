import type { ArticleImage } from "./domain";

export type SiteBranding = {
  logo: ArticleImage | null;
  logoMode: "image-and-name" | "image-only" | "text-only";
  logoWidth: number;
};
export const DEFAULT_BRANDING: SiteBranding = { logo: null, logoMode: "image-and-name", logoWidth: 160 };

// Only local, content-addressed media can become a public site logo.
export function normalizeBranding(input?: Partial<SiteBranding> | null): SiteBranding {
  const logo = input?.logo;
  const validLogo = logo && /^[a-f0-9]{64}$/.test(logo.assetId) &&
    ["png", "jpg", "webp"].includes(logo.format) &&
    Number.isInteger(logo.width) && logo.width > 0 && logo.width <= 4096 &&
    Number.isInteger(logo.height) && logo.height > 0 && logo.height <= 4096 &&
    typeof logo.alt === "string";
  return {
    logo: validLogo ? logo : null,
    logoMode: ["image-and-name", "image-only", "text-only"].includes(input?.logoMode || "") ? input!.logoMode! : DEFAULT_BRANDING.logoMode,
    logoWidth: Number.isInteger(input?.logoWidth) && input!.logoWidth! >= 64 && input!.logoWidth! <= 320 ? input!.logoWidth! : DEFAULT_BRANDING.logoWidth,
  };
}

export function brandingImageUrl(logo: ArticleImage, privatePreview = false): string {
  return privatePreview ? `/api/admin/media?id=${logo.assetId}&format=${logo.format}` : `/media/${logo.assetId}.${logo.format}`;
}
