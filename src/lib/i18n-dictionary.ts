/** Compatibility view for TR-key call sites; English JSON is authoritative. */
import englishPack from './i18n-packs/en.json';
import sourceKeys from './i18n-source-keys.json';
export const english:Record<string,string>=Object.fromEntries(Object.entries(sourceKeys).map(([source,key])=>[source,englishPack.messages[key as keyof typeof englishPack.messages]]));
