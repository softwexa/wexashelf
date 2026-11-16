<?php
declare(strict_types=1);
require_once __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Database,Repository,EditorRoles,Auth,ApiException};
if($argc!==2)throw new RuntimeException('Usage: php php/tests/editor-roles.php QA_CONFIG_JSON');$config=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);if(!isset($config['database']))$config=['database'=>$config];$config['database']['name']='wexashelf_repo_test';$config['site']=['url'=>'http://127.0.0.1:3156'];$db=Database::connect($config);Database::migrate($db);$repo=new Repository($db,$config);$roles=new EditorRoles($repo);$auth=new Auth($db,$repo,$config);
function roleAssert(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function roleReject(callable $fn,int $status):void{try{$fn();}catch(ApiException $e){roleAssert($e->status===$status,'role status');return;}throw new RuntimeException('Forbidden role operation accepted');}
$db->beginTransaction();try{
 $repo->seed(json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR));$created=$roles->save(['id'=>'test-editor','name'=>'Test Editor','role'=>'editor','enabled'=>true,'revision'=>0,'password'=>'Synthetic-Test-Password-2026']);roleAssert(!isset($created['users'][0]['passwordHash']),'password hash redacted');$editor=$created['users'][0];
 roleReject(fn()=>EditorRoles::authorize($editor,'/api/admin/records','POST',['status'=>'published','seoApproved'=>true]),403);EditorRoles::authorize($editor,'/api/admin/records','POST',['status'=>'draft','seoApproved'=>false]);
 foreach(['/api/admin/editors','/api/admin/ai/settings','/api/admin/extensions','/api/admin/restore-backup','/api/admin/settings','/api/admin/admission','/api/admin/capabilities'] as $path)roleReject(fn()=>EditorRoles::authorize($editor,$path,'POST',[]),403);
 EditorRoles::authorize(['role'=>'publisher'],'/api/admin/records','POST',['status'=>'published','seoApproved'=>true]);EditorRoles::authorize(['role'=>'analyst'],'/api/admin/growth/gsc','POST',[]);roleReject(fn()=>EditorRoles::authorize(['role'=>'analyst'],'/api/admin/records','POST',['status'=>'draft']),403);
 $token=bin2hex(random_bytes(32));$hash=hash('sha256',$token);$db->prepare('INSERT INTO ws_sessions(token,expires) VALUES(?,?)')->execute([$hash,Auth::now()+60000]);$repo->setSetting('session-principal:'.$hash,['id'=>$editor['id'],'role'=>'owner','revision'=>$editor['revision']]);$_COOKIE['catalog_admin']=$token;roleAssert($auth->principal()['role']==='editor','session role cannot override current account role');
 $roles->save(array_merge($editor,['enabled'=>false,'password'=>'']));roleAssert(!$auth->authenticated(),'disabled account loses sessions');
 roleReject(fn()=>$roles->save(array_merge($editor,['password'=>''])),409);
 $legacy=bin2hex(random_bytes(32));$db->prepare('INSERT INTO ws_sessions(token,expires) VALUES(?,?)')->execute([hash('sha256',$legacy),Auth::now()+60000]);$_COOKIE['catalog_admin']=$legacy;roleAssert($auth->principal()['role']==='owner','existing owner session retained');
 $backup=$repo->exportBackup();roleAssert(!str_contains(json_encode($backup),'passwordHash'),'catalogue backup excludes editor credentials');$repo->restoreBackup($backup);roleAssert(count($roles->users())===1,'catalogue restore preserves editor access');
 echo "PASS: role permissions, draft-only editors, session revocation, owner compatibility and credential separation\n";
}finally{unset($_COOKIE['catalog_admin']);if($db->inTransaction())$db->rollBack();}
