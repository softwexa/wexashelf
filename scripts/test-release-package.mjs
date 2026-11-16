import sharp from 'sharp';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const contributionFiles=['AGENTS.md','CLAUDE.md','CONTRIBUTING.md','documents/README.md','documents/featured.md','documents/ARCHITECTURE.md','documents/TESTING.md','documents/AI-CONTRIBUTION.md','documents/GITHUB-SETUP.md','.github/PULL_REQUEST_TEMPLATE.md','.github/copilot-instructions.md','.github/ISSUE_TEMPLATE/bug_report.md','.github/ISSUE_TEMPLATE/feature_request.md','.github/ISSUE_TEMPLATE/translation.md','.github/ISSUE_TEMPLATE/theme_module.md'];
for(const [manifestName,required] of [
  ['source-manifest.json',['LICENSE','php/app/Api.php','php/cli/worker.php','php/cli/source-worker.php','php/cli/account-recovery.php','php/cli/backup-restore.php','php/resources/ui.en.json','php/resources/ui-public-keys.json','scripts/public-locales.mjs','php/resources/artwork-manifest.json','php/public/assets/app.js','php/public/assets/app.css','php/public/assets/admin.js','php/public/assets/admin.css','php/public/assets/favicon.svg','php/client/admin.tsx','php/client/fonts.css','scripts/performance-audit.mjs','docs/SCHEMA-REPORT.md','docs/PERFORMANCE-AUDIT-REPORT.md','php/resources/seed.json','php/storage/.htaccess','php/client/entry.tsx','php/client/asset-url.ts','src/lib/asset-url.ts','php/resources/icon-assets.json','php/resources/locale-manifest.json','php/resources/server.en.json','php/resources/server.tr.json','php/resources/release.json','php/app/Translations.php','php/app/Upgrade.php','docs/TRANSLATING.md','docs/THEME-DEVELOPMENT.md','docs/MODULE-DEVELOPMENT.md','scripts/check-locales.mjs']],
  ['php-manifest.json',['LICENSE','index.php','app/Api.php','cli/worker.php','cli/source-worker.php','cli/account-recovery.php','cli/backup-restore.php','resources/ui.en.json','resources/ui-public-keys.json','resources/artwork-manifest.json','assets/app.js','assets/app.css','assets/admin.js','assets/admin.css','assets/favicon.svg','docs/SCHEMA-REPORT.md','docs/PERFORMANCE-AUDIT-REPORT.md','resources/seed.json','resources/icon-assets.json','storage/.htaccess','assets/vitals.js','resources/locale-manifest.json','resources/server.en.json','resources/release.json','app/Upgrade.php','app/EditorRoles.php','docs/TRANSLATING.md','docs/THEME-DEVELOPMENT.md','docs/MODULE-DEVELOPMENT.md']]
]) {
  const manifest=JSON.parse(await readFile(path.join(root,'artifacts/releases',manifestName),'utf8'));
  const archive=path.join(root,'artifacts/releases',manifest.archive);
  assert.equal(createHash('sha256').update(await readFile(archive)).digest('hex'),manifest.archiveSha256);
  const result=spawnSync('unzip',['-Z1',archive],{encoding:'utf8'});assert.equal(result.status,0);
  const names=result.stdout.trim().split('\n');
  for(const name of [...required,...contributionFiles])assert(names.includes(name),`${manifestName}: missing ${name}`);
  assert(names.some(n=>n.startsWith('licenses/react/')),'Missing bundled React license');
  assert(names.some(n=>n.startsWith('licenses/web-vitals/')),'Missing bundled web-vitals license');
  const source=manifestName==='source-manifest.json';
  if(!source)for(const directory of ['examples','.github','cli']){
    const denial=spawnSync('unzip',['-p',archive,`${directory}/.htaccess`],{encoding:'utf8'});
    assert.equal(denial.status,0);assert.equal(denial.stdout,'Require all denied\n',`${directory}: missing hosting access protection`);
  }
  const mapPath=source?'php/resources/icon-assets.json':'resources/icon-assets.json';
  const mapResult=spawnSync('unzip',['-p',archive,mapPath],{encoding:'utf8'});assert.equal(mapResult.status,0);
  const iconMap=JSON.parse(mapResult.stdout);assert.equal(Object.keys(iconMap).length,10,'All ten publisher icons must be delivered');
  const artwork=JSON.parse(spawnSync('unzip',['-p',archive,source?'php/resources/artwork-manifest.json':'resources/artwork-manifest.json'],{encoding:'utf8'}).stdout);
  for(const [original,delivered] of Object.entries(iconMap)) {
    assert(/^\/icons\/[a-z0-9.-]+\.(svg|png|jpg|webp)$/.test(original),'Invalid original icon path');
    assert(typeof delivered==='string'&&/^\/assets\/icons\/[a-z0-9.-]+\.(svg|webp)$/.test(delivered),'Invalid delivered icon path');
    const target=(source?'php/public':'')+delivered;
    assert(names.includes(target.replace(/^\//,'')),`${manifestName}: missing mapped icon ${target}`);
    const entry=artwork.icons[original];assert(entry&&entry.source==='public'+original&&entry.destination===delivered,'Publisher source/delivery mapping drift');
    assert(entry.sourceUrl.startsWith('https://')&&entry.rights.includes('not covered by the WexaShelf MIT'),'Missing separate publisher provenance');
    const originalBytes=await readFile(path.join(root,entry.source));
    if(source){assert(names.includes(entry.source),'Source ZIP missing genuine icon');const packed=spawnSync('unzip',['-p',archive,entry.source]).stdout;assert.deepEqual(packed,originalBytes,'Source icon changed in archive');}
    const deliveredBytes=spawnSync('unzip',['-p',archive,target.replace(/^\//,'' )]).stdout;
    const expected=delivered.endsWith('.svg')?originalBytes:await sharp(originalBytes).resize({width:256,height:256,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
    assert.deepEqual(deliveredBytes,expected,'Delivered icon must derive from its genuine publisher source');
    if(delivered.endsWith('.webp')){const metadata=await sharp(deliveredBytes).metadata();assert(metadata.width>0&&metadata.height>0&&metadata.width<=256&&metadata.height<=256,'Bounded icon dimensions');}
  }

  for(const name of names) {
    assert(!/(?:^|\/)night-landscape\.(?:png|webp)$/.test(name),`Unused landscape should not ship: ${name}`);
    assert(['php/app/Config.php','app/Config.php'].includes(name) || !/(^|\/)(?:\.local|\.git|\.claude|\.codex|\.codex-log|AGENTS\.override\.md|CLAUDE\.local\.md|node_modules|private|config\.php|install\.key|install\.lock|ai-settings\.json(?:\.lock)?|ai-settings\.lock)(\/|$)|\.(?:sqlite|log|pem|key)$/i.test(name),`Private entry: ${name}`);
    if(/(^|\/)storage\//.test(name))assert(/storage\/(?:\.htaccess|index\.php)$/.test(name),`Runtime storage: ${name}`);
  }
  for(const file of manifest.files) {
    const extracted=spawnSync('unzip',['-p',archive,file.path.replace(/[\[\]*?]/g, '\\$&')],{maxBuffer:32*1024*1024});assert.equal(extracted.status,0);
    assert.equal(createHash('sha256').update(extracted.stdout).digest('hex'),file.sha256,`${file.path}: hash mismatch`);
  }
  console.log(`${manifestName}: required source, MIT, bundled licenses, private-path exclusions and hashes passed (${names.length} entries)`);
}
