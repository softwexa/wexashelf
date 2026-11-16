import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { localUrl, bootstrap } from './runtime';
import { unavailableLocalizedRecord } from '../../src/lib/i18n-routing';
type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };
export default forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, ...props }, ref) {
  void prefetch; void replace; void scroll;
  if(unavailableLocalizedRecord(href,bootstrap.locale,bootstrap.localizedPaths||{}))return <span className={props.className} aria-disabled="true">{props.children}</span>;
  return <a {...props} href={localUrl(href)} ref={ref} />;
});
