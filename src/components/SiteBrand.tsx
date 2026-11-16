"use client";
import { useEffect, useState } from "react";
import { Layers3 } from "lucide-react";
import { appIconUrl } from "@/lib/asset-url";
import { normalizeBranding, brandingImageUrl, type SiteBranding } from "@/lib/branding";

export default function SiteBrand({ name, branding, privatePreview = false }: { name: string; branding?: SiteBranding; privatePreview?: boolean }) {
  const safe = normalizeBranding(branding);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [safe.logo?.assetId, privatePreview]);
  const image = safe.logoMode !== "text-only" && safe.logo && !failed ? safe.logo : null;
  return <span className="site-brand-content" data-mode={safe.logoMode}>
    {image ? <img className="site-brand-logo" src={appIconUrl(brandingImageUrl(image, privatePreview))}
      width={safe.logoWidth} height={Math.max(1, Math.round(safe.logoWidth * image.height / image.width))}
      style={{ width: safe.logoWidth, aspectRatio: `${image.width}/${image.height}` }}
      alt={safe.logoMode === "image-only" ? image.alt || name : ""} onError={() => setFailed(true)} />
      : safe.logoMode !== "text-only" && <span className="brand-symbol" aria-hidden="true"><Layers3 size={26} /></span>}
    {(!image || safe.logoMode !== "image-only") && <span className="site-brand-name">{name}</span>}
  </span>;
}
