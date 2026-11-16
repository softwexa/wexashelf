"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { appIconUrl } from "@/lib/asset-url";
import type { ArticleImage } from "@/lib/domain";
import ui from "./AppScreenshotEditor.module.css";

type Props = {
  name: string;
  screenshots: ArticleImage[];
  disabled: boolean;
  onChange: (screenshots: ArticleImage[]) => void;
  onBusy: (busy: boolean) => void;
  onDraftTouched: () => void;
};
const maxImages = 5;
const maxBytes = 2 * 1024 * 1024;

function ScreenshotPreview({ image }: { image: ArticleImage }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  return <div className={ui.preview}>
    {failed ? <div><p role="status">{t("This screenshot preview is unavailable. Check the saved media before publishing.")}</p><button type="button" className="admin-button" onClick={() => setFailed(false)}>{t("Reload image preview")}</button></div>
      : <img src={appIconUrl(`/api/admin/media?${new URLSearchParams({ id: image.assetId, format: image.format })}`)} alt={image.alt} width={image.width} height={image.height} loading="lazy" onError={() => setFailed(true)} />}
  </div>;
}

export default function AppScreenshotEditor({ name, screenshots, disabled, onChange, onBusy, onDraftTouched }: Props) {
  const { t } = useI18n();
  const [error, setError] = useState(""), [working, setWorking] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => { pending.current?.abort(); }, []);

  function update(index: number, patch: Partial<Pick<ArticleImage, "alt" | "caption">>) {
    if (disabled || working) return;
    onChange(screenshots.map((image, position) => position === index ? { ...image, ...patch } : image));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (disabled || working || target < 0 || target >= screenshots.length) return;
    const next = [...screenshots]; [next[index], next[target]] = [next[target], next[index]]; onChange(next);
  }
  async function upload(file: File) {
    if (disabled || working || pending.current) return;
    setError("");
    if (screenshots.length >= maxImages) { setError(t("An app can contain at most five screenshots.")); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > maxBytes) { setError(t("Use a PNG, JPEG or WebP image no larger than 2 MiB.")); return; }
    const controller = new AbortController(); pending.current = controller; setWorking(true); onBusy(true); onDraftTouched();
    let objectUrl = "";
    try {
      objectUrl = URL.createObjectURL(file);
      const image = new Image(); image.src = objectUrl; await image.decode();
      if (controller.signal.aborted) return;
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth > 4096 || image.naturalHeight > 4096 || image.naturalWidth * image.naturalHeight > 12000000) throw Error(t("Image dimensions must be at most 4096 pixels per side and 12 megapixels."));
      const scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d"); if (!context) throw Error(t("The screenshot could not be prepared."));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(Error(t("The screenshot could not be prepared."))), "image/webp", 0.9));
      if (controller.signal.aborted) return;
      if (blob.type !== "image/webp" || blob.size > maxBytes) throw Error(t("The prepared screenshot must be WebP and no larger than 2 MiB."));
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = () => reject(Error(t("The image file could not be read."))); reader.readAsDataURL(blob);
      });
      if (controller.signal.aborted) return;
      const alt = name.trim() ? t("Screenshot of {name}", { name: name.trim() }) : t("Application screenshot");
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ base64, alt, caption: "" }), signal: controller.signal });
      const result = await response.json().catch(() => ({ error: t("The image upload response could not be read.") }));
      if (response.status === 401) throw Error(t("Your admin session expired. Sign in again before uploading. Your unsaved app changes are preserved."));
      if (!response.ok) throw Error(result.error || t("The screenshot could not be uploaded."));
      if (controller.signal.aborted) return;
      const uploaded = result.image as ArticleImage | undefined;
      if (!uploaded || !/^[a-f0-9]{64}$/.test(uploaded.assetId) || uploaded.format !== "webp" || uploaded.width !== canvas.width || uploaded.height !== canvas.height || typeof uploaded.alt !== "string" || typeof uploaded.caption !== "string" || typeof uploaded.aiGenerated !== "boolean") throw Error(t("The server returned invalid image metadata."));
      if (screenshots.some(existing => existing.assetId === uploaded.assetId)) { setError(t("This screenshot is already attached. Edit its text below.")); return; }
      onChange([...screenshots, uploaded]);
    } catch (caught) { if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : t("The screenshot could not be uploaded.")); }
    finally { if (objectUrl) URL.revokeObjectURL(objectUrl); if (!controller.signal.aborted) { setWorking(false); onBusy(false); } pending.current = null; }
  }

  return <section className={`wide ${ui.editor}`} aria-label={t("Application screenshots")} aria-busy={working}>
    <div className={ui.heading}><h3>{t("Application screenshots")}</h3><span className="admin-badge">{screenshots.length} / {maxImages}</span></div>
    <p className={ui.note}>{t("Add up to five screenshots, arrange their order and describe each image. Changes apply to this form only until you save the app.")}</p>
    <label className="admin-field"><span>{t("Upload application screenshot")}</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || working || screenshots.length >= maxImages} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file); }} /><small>{t("PNG, JPEG or WebP, up to 2 MiB. Images are resized to a maximum 1440-pixel edge and uploaded as WebP. New uploads stay private until a qualifying app record is published.")}</small></label>
    {working && <p role="status" className={ui.note}>{t("Preparing and uploading screenshot…")}</p>}{error && <p className="admin-error" role="alert">{error}</p>}
    {screenshots.length === 0 && <p className={ui.note}>{t("No screenshots attached.")}</p>}
    <div className={ui.list}>{screenshots.map((image, index) => <article className={ui.item} key={image.assetId}>
      <ScreenshotPreview image={image} />
      <div className={ui.fields}><div className={ui.heading}><h4>{t("Screenshot {number}", { number: index + 1 })}</h4><small>{image.width} × {image.height} · {image.format.toUpperCase()}</small></div>
        <label className="admin-field"><span>{t("Image alternative text")}</span><input required maxLength={300} value={image.alt} disabled={disabled || working} onChange={event => update(index, { alt: event.target.value })} /><small>{t("Describe what the screenshot shows so the image is understandable without seeing it.")}</small></label>
        <label className="admin-field"><span>{t("Image caption")}</span><textarea rows={2} maxLength={500} value={image.caption} disabled={disabled || working} onChange={event => update(index, { caption: event.target.value })} /></label>
        <div className={ui.actions}><button type="button" className="admin-button" disabled={disabled || working || index === 0} onClick={() => move(index, -1)} aria-label={t("Move screenshot {number} up", { number: index + 1 })}><ArrowUp size={15} />{t("Move up")}</button><button type="button" className="admin-button" disabled={disabled || working || index === screenshots.length - 1} onClick={() => move(index, 1)} aria-label={t("Move screenshot {number} down", { number: index + 1 })}><ArrowDown size={15} />{t("Move down")}</button><button type="button" className="admin-button subtle" disabled={disabled || working} onClick={() => onChange(screenshots.filter((_, position) => position !== index))} aria-label={t("Remove screenshot {number}", { number: index + 1 })}><Trash2 size={15} />{t("Remove screenshot")}</button></div>
      </div>
    </article>)}</div>
  </section>;
}
