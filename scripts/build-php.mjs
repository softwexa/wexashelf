import sharp from 'sharp';
import { build } from 'esbuild';
import { publicLocales } from './public-locales.mjs';
import { mkdir, cp, writeFile, readdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const packageMetadata = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const out = resolve(root, 'php/public/assets');
await mkdir(out, {recursive: true});
await mkdir(resolve(root, 'php/resources'), {recursive: true});
// Genuine publisher icons retain their own rights; only the project landscape is MIT.
const artwork=JSON.parse(await readFile(resolve(root,'php/resources/artwork-manifest.json'),'utf8'));
const iconAssets={};
await mkdir(resolve(out,'icons'),{recursive:true});
await mkdir(resolve(out,'artwork'),{recursive:true});
for(const [legacy,entry]of Object.entries(artwork.icons)) {
  iconAssets[legacy]=entry.destination;
  const source=resolve(root,entry.source),destination=resolve(root,'php/public',entry.destination.slice(1));
  if(entry.destination.endsWith('.svg'))await cp(source,destination);
  else await sharp(source).resize({width:256,height:256,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toFile(destination);
  // Remove only our superseded monogram delivery, not publisher source files.
  await rm(resolve(out,'artwork',legacy.split('/').at(-1).replace(/\.[^.]+$/,'.svg')),{force:true});
}
await cp(resolve(root,artwork.background.source),resolve(root,'php/public',artwork.background.destination.slice(1)));
await writeFile(resolve(root,'php/resources/icon-assets.json'),JSON.stringify(iconAssets,null,2)+'\n');
// Keep proper character ranges: the subset-only Fontsource imports overlap.
const faces = [];
for (const weight of [400, 500, 600, 700]) {
  const css = await readFile(resolve(root, `node_modules/@fontsource/ibm-plex-sans/${weight}.css`), 'utf8');
  for (const face of css.matchAll(/\/\* ibm-plex-sans-latin(?:-ext)?-[\s\S]*?\}/g)) {
    faces.push(face[0].replace(/, url\([^)]*\.woff\) format\('woff'\)/g, '').replaceAll('url(./files/', 'url(../../node_modules/@fontsource/ibm-plex-sans/files/'));
  }
}
await writeFile(resolve(root, 'php/client/fonts.css'), faces.join('\n'));
const publicLocale = await publicLocales(root);
await writeFile(resolve(root,'php/resources/ui-public-keys.json'),JSON.stringify(publicLocale.keys)+'\n');
const commonBuild={absWorkingDir: root, outdir: out, bundle: true, minify: true, format: 'iife', platform: 'browser', target: ['es2022'], jsx: 'automatic', alias: {'@/lib/asset-url': './php/client/asset-url.ts', 'next/link': './php/client/link.tsx', 'next/navigation': './php/client/runtime.ts'}, define: {'process.env.NODE_ENV': '"production"'}, loader: {'.woff2': 'file'}, assetNames: 'fonts/[name]-[hash]'};
const backgrounds={name:'portable-backgrounds',setup(b){b.onResolve({filter:/^\/artwork\//},args=>({path:'.'+args.path,external:true}));}};
const publicBuild = await build({...commonBuild,metafile:true,entryPoints:{app:'php/client/entry.tsx',vitals:'php/client/vitals.ts'},plugins:[backgrounds,{name:'public-locales',setup(b){
 b.onLoad({filter:/\/src\/lib\/i18n-packs\/(?:en|tr)\.json$/},args=>({contents:JSON.stringify(publicLocale.packs[args.path.endsWith('/en.json')?'en':'tr']),loader:'json'}));
 b.onLoad({filter:/\/src\/lib\/i18n-source-keys\.json$/},()=>({contents:JSON.stringify(publicLocale.aliases),loader:'json'}));
}}]});
const fontAssets = {};
for (const file of Object.keys(publicBuild.metafile.outputs)) { const match = file.match(/\/fonts\/ibm-plex-sans-(latin(?:-ext)?)-(400|500|600|700)-normal-[^/]+\.woff2$/); if (match) fontAssets[`${match[1]}-${match[2]}`] = '/assets/fonts/' + file.split('/').at(-1); }
await writeFile(resolve(root,'php/resources/font-assets.json'),JSON.stringify(fontAssets,null,2)+'\n');
// The independent administration bundle keeps every editable translation key.
await build({...commonBuild,entryPoints:{admin:'php/client/admin.tsx'},plugins:[backgrounds]});
await cp(resolve(root, 'php/client/social.svg'), resolve(out, 'social.svg'));
await cp(resolve(root, 'php/client/favicon.svg'), resolve(out, 'favicon.svg'));
await cp(resolve(root, 'public/themes'), resolve(root, 'php/public/themes'), {recursive: true});
// Preserve full bundled dependency licenses in Docker as well as ZIP releases.
for (const pkg of ['react','react-dom','scheduler','web-vitals','lucide-react','@fontsource/ibm-plex-sans']) {
  const source = resolve(root, 'node_modules', pkg);
  const destination = resolve(root, 'php/resources/licenses', pkg.replaceAll('/', '_'));
  await mkdir(destination, {recursive: true});
  const licenses = (await readdir(source)).filter(name => /^(?:LICENSE|LICENCE|OFL)(?:\.|$)/i.test(name));
  if (!licenses.length) throw new Error(`Missing license: ${pkg}`);
  for (const name of licenses) await cp(resolve(source, name), resolve(destination, name));
}
const exported = await build({absWorkingDir: root, entryPoints: ['php/client/export-seed.ts'], bundle: true, write: false, platform: 'node', format: 'esm'});
const { seed, content, englishContent, locales, localeContents, serverLocaleContents, uiLocaleContents } = await import('data:text/javascript;base64,' + Buffer.from(exported.outputFiles[0].text).toString('base64'));
await writeFile(resolve(root, 'php/resources/seed.json'), JSON.stringify(seed, null, 2) + '\n');
await writeFile(resolve(root, 'php/resources/content.json'), JSON.stringify(content, null, 2) + '\n');
await writeFile(resolve(root, 'php/resources/content.en.json'), JSON.stringify(englishContent, null, 2) + '\n');
await writeFile(resolve(root, 'php/resources/locale-manifest.json'), JSON.stringify(locales, null, 2) + '\n');
for (const [code, localeContent] of Object.entries(localeContents)) await writeFile(resolve(root, `php/resources/content.${code}.json`), JSON.stringify(localeContent, null, 2) + '\n');
for (const [code, messages] of Object.entries(serverLocaleContents)) await writeFile(resolve(root, `php/resources/server.${code}.json`), JSON.stringify(messages, null, 2) + '\n');
for (const [code, ui] of Object.entries(uiLocaleContents)) await writeFile(resolve(root, `php/resources/ui.${code}.json`), JSON.stringify(ui, null, 2) + '\n');
await writeFile(resolve(root, 'php/resources/release.json'), JSON.stringify({version: packageMetadata.version}, null, 2) + '\n');
console.log(`PHP browser bundle and ${seed.records.length} seed records exported; no Node runtime required on host.`);
