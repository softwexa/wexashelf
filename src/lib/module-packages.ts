import type { AppFact, FactKey } from './domain';
import type { Platform } from './catalog';

export type ModuleCopy = {title:string;description:string};
type ModuleMetadata={id:string;name:string;description:string;version:string;requires:string};
export type ModuleCard={id:string;locales:Record<string,ModuleCopy&{href:string}>};
export type FunctionalModuleBlock =
 | {id:string;type:'curated-apps';locales:Record<string,ModuleCopy>;appIds:string[]}
 | {id:string;type:'comparison';locales:Record<string,ModuleCopy>;appIds:string[];factKeys:FactKey[]}
 | {id:string;type:'latest-articles';locales:Record<string,ModuleCopy>;limit:number};
export type ModuleManifest = ModuleMetadata & (
 | {schemaVersion:1;cards:ModuleCard[]}
 | {schemaVersion:2;blocks:FunctionalModuleBlock[]}
);
export type PublicModuleApp={id:string;name:string;tagline:string;icon:string;platforms:Platform[];href:string;facts:AppFact[]};
export type PublicModuleArticle={id:string;title:string;summary:string;publishedAt:string;href:string};
export type PublicExtensionBlock={moduleId:string;id:string;type:FunctionalModuleBlock['type'];title:string;description:string;apps:PublicModuleApp[];articles:PublicModuleArticle[];factKeys?:FactKey[];compareHref?:string};
export type InstalledModule={manifest:ModuleManifest;checksum:string;enabled:boolean;installedAt:string;reviewedChecksum?:string;reviewedAt?:string};
export type ModulePreview={manifest:ModuleManifest;checksum:string;locale:string;operation:'install'|'upgrade'|'identical'|'incompatible-version';fromVersion:string|null;canInstall:boolean;canEnable:boolean;blocks:PublicExtensionBlock[];cards:{moduleId:string;id:string;title:string;description:string;href:string}[];warnings:{code:'missing-locale'|'unavailable-content'|'missing-apps';blockId:string;ids?:string[]}[]};
