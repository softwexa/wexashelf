import type { GUIDES,WORKFLOWS,CATEGORIES,PLATFORM_LABELS } from './catalog';
import { getLocalePack } from './i18n-registry';
export function localeContent(locale?:string){const content=getLocalePack(locale).content;return content as unknown as {guides:typeof GUIDES;workflows:typeof WORKFLOWS;categories:typeof CATEGORIES;platformLabels:typeof PLATFORM_LABELS;factLabels:Record<string,string>;evidenceLabels:Record<string,string>;pageNames:Record<string,string>};}
