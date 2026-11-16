import {createHash} from 'node:crypto';
import {lstat,mkdir,mkdtemp,readFile,readdir,rm,writeFile,utimes} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const archiveName=`wexashelf-php-${version}.zip`;
const output=path.join(root,'artifacts/releases'), stage=await mkdtemp(path.join(tmpdir(),'wexashelf-php-'));
const entries=new Map();
const forbidden=/(^|\/)(?:\.git|\.local|\.claude|\.codex|\.codex-log|AGENTS\.override\.md|CLAUDE\.local\.md|node_modules|client|tests|install\.key|install\.lock|ai-settings\.json(?:\.lock)?|ai-settings\.lock|\.DS_Store)(\/|$)|\.(?:log|sqlite|bak|map)$/i;
async function add(source,destination) {
  if(destination==='storage/config.php'||forbidden.test(destination)||destination.startsWith('/')||destination.split('/').includes('..')||/[\r\n\\]/.test(destination))throw Error(`Rejected package path: ${destination}`);
  const stat=await lstat(path.join(root,source));if(stat.isSymbolicLink())throw Error(`Rejected symlink: ${source}`);
  if(stat.isDirectory()){for(const name of (await readdir(path.join(root,source))).sort())await add(`${source}/${name}`,`${destination}/${name}`);}
  else if(stat.isFile())entries.set(destination,await readFile(path.join(root,source)));else throw Error(`Rejected special file: ${source}`);
}
try {
  for(const name of (await readdir(path.join(root,'php/public'))).sort())if(name!=='router.php')await add(`php/public/${name}`,name);
  for(const dir of ['app','resources','cli'])await add(`php/${dir}`,dir);
  await add('examples','examples');
  entries.set('examples/.htaccess',Buffer.from('Require all denied\n'));
  await add('documents','documents');
  for(const file of ['AGENTS.md','CLAUDE.md','.github/copilot-instructions.md','.github/PULL_REQUEST_TEMPLATE.md','.github/ISSUE_TEMPLATE/bug_report.md','.github/ISSUE_TEMPLATE/feature_request.md','.github/ISSUE_TEMPLATE/translation.md','.github/ISSUE_TEMPLATE/theme_module.md'])await add(file,file);
  entries.set('.github/.htaccess',Buffer.from('Require all denied\n'));
  for(const file of ['.htaccess','index.php'])await add(`php/storage/${file}`,`storage/${file}`);
  for(const dir of ['app','resources','cli'])entries.set(`${dir}/.htaccess`,Buffer.from('Require all denied\n'));
  for(const file of ['LICENSE','README.md','CONTRIBUTING.md','SECURITY.md','docs/KURULUM_CPANEL.md','docs/YEREL_DAGITIM.md','docs/AI_VE_SEO.md','docs/AI_SAGLAYICILAR.md','docs/SCHEMA-REPORT.md','docs/PERFORMANCE-AUDIT-REPORT.md','docs/RELEASE-0.7.0-VALIDATION.md','docs/RELEASE-0.7.1-VALIDATION.md','docs/RELEASE-0.8.0-VALIDATION.md','docs/IMPLEMENTATION-0.7.0.json','docs/IMPLEMENTATION-0.7.1.json','docs/UYGULAMA_DURUMU.md','THIRD_PARTY_NOTICES.md','docs/TRANSLATING.md','docs/THEME-DEVELOPMENT.md','docs/THEME-COLLECTION.md','docs/THEME-COLLECTION-VALIDATION.md','docs/MODULE-DEVELOPMENT.md','docs/MULTILINGUAL-SEO.md','docs/GROWTH-EDITORIAL.md','docs/UPGRADING.md','docs/ACCOUNT-SECURITY.md','docs/BACKUP-RECOVERY.md','docs/AI-CONTENT.md','docs/CRON-WORKERS.md','docs/CATALOG-SCALING.md','docs/STORE-SOURCES.md','docs/INSTALL-OPERATIONS.md','docs/DISTRIBUTION-ACCEPTANCE.md','docs/IMAGE-CONTENT.md','docs/ARTICLE-CONTENT.md','docs/APP-SUBMISSIONS.md','docs/APP-SUBMISSIONS-VALIDATION.md','docs/ADMIN-INTERFACE.md','docs/TEMA_VE_EKLENTI_REHBERI.md','docs/VERI_VE_YONETIM.md'])await add(file,file);
  for(const pkg of ['react','react-dom','scheduler','web-vitals','lucide-react','@fontsource/ibm-plex-sans']) {
    const directory=path.join(root,'node_modules',pkg);
    const files=(await readdir(directory)).filter(name=>/^(?:LICENSE|LICENCE|OFL)(?:\.|$)/i.test(name));
    if(!files.length)throw Error(`Missing bundled dependency license: ${pkg}`);
    for(const file of files)await add(`node_modules/${pkg}/${file}`,`licenses/${pkg.replaceAll('/','_')}/${file}`);
  }
  if(['index.php','assets/app.js','assets/app.css','assets/admin.js','assets/admin.css'].some(file=>!entries.has(file)))throw Error('Build PHP assets and router before packaging.');
  entries.set('PACKAGE_STATUS.txt',Buffer.from(`WexaShelf ${version} PHP hosting package\nPHP 8.3+ / MySQL 8.4 recommended or MariaDB 10.11+ / Apache .htaccess\nNo npm, Composer or Node runtime required on the host.\nProject code: MIT (see LICENSE). Original project landscape: MIT. App icons retain third-party publisher rights; see THIRD_PARTY_NOTICES.md. Bundled dependency license texts are included.\nLocal installation artifact; live hosting verification is documented separately.\nRead docs/KURULUM_CPANEL.md before installation. No credentials are bundled.\n`));
  const manifestFiles=[];
  for(const [relative,bytes] of [...entries].sort(([a],[b])=>a.localeCompare(b))){const target=path.join(stage,relative);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes,{mode:0o644});await utimes(target,new Date('2000-01-01T00:00:00Z'),new Date('2000-01-01T00:00:00Z'));manifestFiles.push({path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
  const manifest={version,status:'LOCAL_PHP_INSTALLATION_PACKAGE_MIT',runtime:'PHP 8.3+ with pdo_mysql,curl,mbstring,intl',hostBuildRequired:false,licenseSelected:true,projectLicense:'MIT',publisherIconsIncluded:true,iconRightsSeparate:true,files:manifestFiles,excluded:['php/client','test files','configuration, AI provider settings and locks, installation secrets','logs','local databases','Node dependencies except bundled runtime license texts']};
  await writeFile(path.join(stage,'package-manifest.json'),JSON.stringify(manifest,null,2)+'\n');await utimes(path.join(stage,'package-manifest.json'),new Date('2000-01-01T00:00:00Z'),new Date('2000-01-01T00:00:00Z'));
  const zip=path.join(stage,archiveName);const zipped=spawnSync('zip',['-X','-q',zip,'-@'],{cwd:stage,input:[...entries.keys(),'package-manifest.json'].sort().join('\n')+'\n',encoding:'utf8',env:{...process.env,TZ:'UTC'}});
  if(zipped.error||zipped.status!==0)throw Error('ZIP generation failed; system zip is required on the packaging workstation.');
  const bytes=await readFile(zip);await mkdir(output,{recursive:true});await writeFile(path.join(output,archiveName),bytes);await writeFile(path.join(output,'php-manifest.json'),JSON.stringify({...manifest,archive:archiveName,archiveSha256:createHash('sha256').update(bytes).digest('hex')},null,2)+'\n');
  console.log(`Created ${path.join(output,archiveName)} (${entries.size+1} files; MIT code; third-party rights separate).`);
}finally{await rm(stage,{recursive:true,force:true});}
