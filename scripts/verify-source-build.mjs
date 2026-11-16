// Rebuild an extracted source archive with the workstation's existing dependencies.
// This proves source/build consistency, not a fresh npm ci or network installation.
import {mkdtemp,readFile,readdir,symlink,rm,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
const archive=path.join(root,'artifacts/releases',`wexashelf-source-${version}.zip`);
const stage=await mkdtemp(path.join(tmpdir(),'wexa-source-rebuild-'));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function files(directory,prefix=''){const result=[];for(const entry of await readdir(directory,{withFileTypes:true})){const name=path.join(prefix,entry.name);if(entry.isDirectory())result.push(...await files(path.join(directory,entry.name),name));else if(entry.isFile())result.push(name);else throw Error('Unexpected extracted file type.');}return result;}
try{
 const unzip=spawnSync('unzip',['-q',archive,'-d',stage],{encoding:'utf8'});if(unzip.status!==0)throw Error('Source extraction failed.');
 const tracked=[...(await files(path.join(stage,'php/public'))).map(file=>'php/public/'+file),...(await files(path.join(stage,'php/resources'))).map(file=>'php/resources/'+file)];
 const before=new Map(await Promise.all(tracked.map(async file=>[file,digest(await readFile(path.join(stage,file)))])));
 await symlink(path.join(root,'node_modules'),path.join(stage,'node_modules'),'dir');
 const build=spawnSync(process.execPath,['scripts/build-php.mjs'],{cwd:stage,encoding:'utf8',timeout:120000});if(build.status!==0)throw Error('Extracted source build failed: '+build.stderr.slice(-2000));
 const mismatches=[];for(const [file,hash]of before)if(digest(await readFile(path.join(stage,file)))!==hash)mismatches.push(file);
 const after=[...(await files(path.join(stage,'php/public'))).map(file=>'php/public/'+file),...(await files(path.join(stage,'php/resources'))).map(file=>'php/resources/'+file)];
 for(const file of after)if(!before.has(file))mismatches.push('unexpected:'+file);
 const receipt={checkedAt:new Date().toISOString(),version,archiveSha256:digest(await readFile(archive)),filesChecked:before.size,passed:mismatches.length===0,mismatches,scope:'Clean source ZIP extraction and rebuild; existing workstation node_modules reused via a temporary symlink. No fresh npm ci, publication or provider call.'};
 await mkdir(path.join(root,'artifacts/verification'),{recursive:true});await writeFile(path.join(root,'artifacts/verification',`source-build-${version}.json`),JSON.stringify(receipt,null,2)+'\n');
 if(mismatches.length)throw Error('Source rebuild differs: '+mismatches.join(', '));console.log(`PASS source ZIP rebuild: ${before.size} runtime/resource files match.`);
}finally{await rm(stage,{recursive:true,force:true});}
