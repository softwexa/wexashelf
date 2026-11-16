function decodedPath(value:string):string {
 try {const parts=value.split('/').map(segment=>decodeURIComponent(segment));return parts.some(segment=>/[\/\\\u0000-\u001f]/.test(segment))?value:parts.join('/');}catch{return value;}
}
/** Map only server-declared equivalents; preserve query/hash and install base. */
export function localizedUrl(value:string,basePath='',paths:Record<string,string>={}):string {
 if(!value.startsWith('/')||value.startsWith('//'))return value;
 const base=basePath.replace(/\/$/,'');
 const parsed=new URL(value,'https://local.invalid');
 const internal=base&&(parsed.pathname===base||parsed.pathname.startsWith(base+'/'))?(parsed.pathname.slice(base.length)||'/'):parsed.pathname;
 const mapped=paths[internal]??paths[decodedPath(internal)];
 const route=mapped&&mapped.startsWith('/')&&!mapped.startsWith('//')?mapped:internal;
 return base+route+parsed.search+parsed.hash;
}
export function internalPathname(pathname:string,basePath='',paths:Record<string,string>={}):string {
 const base=basePath.replace(/\/$/,'');
 const current=base&&(pathname===base||pathname.startsWith(base+'/'))?(pathname.slice(base.length)||'/'):pathname;
 return Object.entries(paths).find(([,localized])=>localized===current)?.[0]||current;
}
export function unavailableLocalizedRecord(value:string,locale:string,paths:Record<string,string>={}):boolean {
 if(!locale||!value.startsWith('/')||value.startsWith('//'))return false;
 const pathname=new URL(value,'https://local.invalid').pathname;
 return /^\/(?:uygulama|blog|liste)\/[^/]+\/?$/.test(pathname)&&!paths[pathname]&&!paths[decodedPath(pathname)];
}
