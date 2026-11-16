import icons from '../resources/icon-assets.json';
import { basePath, localUrl } from './runtime';

export function appIconUrl(icon: string): string {
  const path = basePath && icon.startsWith(basePath + '/') ? icon.slice(basePath.length) : icon;
  if (/^\/icons\/[a-z0-9.-]+\.(?:svg|png|jpg|webp)$/.test(path)) {
    return localUrl((icons as Record<string, string>)[path] || path);
  }
  return localUrl(icon);
}
