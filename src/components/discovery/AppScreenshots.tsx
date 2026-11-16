"use client";
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { appIconUrl } from '@/lib/asset-url';
import type { ArticleImage } from '@/lib/domain';
import ui from './AppScreenshots.module.css';

export default function AppScreenshots({ images = [] }: { images?: ArticleImage[] }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState<string[]>([]);
  if (!images.length) return null;
  return <section className={`home-panel ${ui.gallery}`}>
    <h2>{t('App screenshots')}</h2>
    <div className={ui.images}>{images.slice(0, 5).map(image => {
      const url = appIconUrl(`/media/${image.assetId}.${image.format}`);
      return <figure key={image.assetId}>
        {failed.includes(image.assetId) ? <p>{t('This image is unavailable.')}</p> : <a href={url} target="_blank" rel="noopener noreferrer" aria-label={t('Open screenshot: {description}', { description: image.alt })}>
          <img src={url} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" onError={() => setFailed(previous => [...previous, image.assetId])} />
        </a>}
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>;
    })}</div>
  </section>;
}
