import { useSyncExternalStore } from 'react';
import { localizedUrl, internalPathname, unavailableLocalizedRecord } from '../../src/lib/i18n-routing';

export const bootstrap = JSON.parse(document.getElementById('wexa-bootstrap')!.textContent || '{}');
export const basePath: string = (bootstrap.basePath || '').replace(/\/$/, '');
export function localUrl(value: string): string {return localizedUrl(value,basePath,bootstrap.localizedPaths||{});}
const eventName = 'wexa:navigation';
for (const method of ['pushState', 'replaceState'] as const) {
  const original = history[method].bind(history);
  history[method] = (data: unknown, unused: string, url?: string | URL | null) => {
    original(data, unused, typeof url === 'string' ? localUrl(url) : url);
    window.dispatchEvent(new Event(eventName));
  };
}
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, init) => nativeFetch(typeof input === 'string' && input.startsWith('/api/') ? localUrl(input) : input, init);
function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('popstate', listener); window.removeEventListener(eventName, listener); };
}
function useLocation() { return useSyncExternalStore(subscribe, () => location.pathname + location.search); }
export function usePathname() { useLocation(); return internalPathname(location.pathname,basePath,bootstrap.localizedPaths||{}); }
export function useSearchParams() { useLocation(); return new URLSearchParams(location.search); }
function navigate(value: string, replace = false) {
  if(unavailableLocalizedRecord(value,bootstrap.locale,bootstrap.localizedPaths||{}))return;
  const target = new URL(localUrl(value), location.href);
  if (target.origin === location.origin && target.pathname === location.pathname) {
    history[replace ? 'replaceState' : 'pushState'](null, '', target.href);
  } else if (replace) location.replace(target.href);
  else location.assign(target.href);
}
const router = { push: (url: string) => navigate(url), replace: (url: string) => navigate(url, true), refresh: () => location.reload(), back: () => history.back(), forward: () => history.forward(), prefetch: () => {} };
export function useRouter() { return router; }
// Plain anchors used for downloads also work in subdirectory installations.
export function prefixRenderedLinks(root: HTMLElement) {
  if (!basePath && !Object.keys(bootstrap.localizedPaths||{}).length) return;
  const rewrite = () => root.querySelectorAll<HTMLAnchorElement | HTMLFormElement>('a[href^="/"], form[action^="/"]').forEach(element => {
    if(element.hasAttribute('data-language-link'))return;
    const attribute = element.tagName === 'FORM' ? 'action' : 'href';
    const value = element.getAttribute(attribute)!;
    const prefixed = localUrl(value);
    if (prefixed !== value) element.setAttribute(attribute, prefixed);
  });
  new MutationObserver(rewrite).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'action'] });
  rewrite();
}

window.addEventListener("wexa:catalog-paths", (event) => {Object.assign(bootstrap.localizedPaths ||= {}, (event as CustomEvent<Record<string,string>>).detail || {});});
