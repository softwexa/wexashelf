// Creates only the named, disposable local release-QA database container.
// No existing container/database is reset or reused automatically.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve('artifacts/release-qa-070');
const name='wexashelf-release-070-mysql84',network='wexashelf-release-070';
const docker=(args)=>execFileSync('docker',args,{encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
if(existsSync(root+'/database.json'))throw Error('QA credentials already exist; inspect and reuse explicitly. Nothing was reset.');
try{docker(['container','inspect',name]);throw Error('QA container already exists; nothing was reset.');}catch(e){if(!/No such (container|object)/.test(String(e.stderr??'')))throw e;}
try{docker(['network','inspect',network]);}catch{docker(['network','create',network]);}
mkdirSync(root,{recursive:true,mode:0o700});
const password=randomBytes(32).toString('hex'),rootPassword=randomBytes(32).toString('hex');
writeFileSync(root+'/mysql.env',`MYSQL_ROOT_PASSWORD=${rootPassword}\nMYSQL_DATABASE=wexashelf_release_070\nMYSQL_USER=wexa_release\nMYSQL_PASSWORD=${password}\n`,{mode:0o600});
writeFileSync(root+'/database.json',JSON.stringify({host:'127.0.0.1',port:33076,name:'wexashelf_release_070',user:'wexa_release',password},null,2)+'\n',{mode:0o600});
writeFileSync(root+'/installer.json',JSON.stringify({database:{host:'release-db',port:3306,name:'wexashelf_release_070',user:'wexa_release',password},adminPassword:'Local-E2E-Only-2026-Synthetic',setupKey:randomBytes(32).toString('hex')},null,2)+'\n',{mode:0o600});
const id=docker(['run','-d','--name',name,'--network',network,'--network-alias','release-db','--label','wexashelf.qa=release-070','-p','127.0.0.1:33076:3306','--env-file',root+'/mysql.env','mysql:8.4']);
console.log(JSON.stringify({container:name,id,network,privateConfig:root+'/database.json',status:'created; database readiness not yet verified'}));
