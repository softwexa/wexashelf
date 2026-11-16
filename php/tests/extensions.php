<?php
declare(strict_types=1);
require_once __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Database,Repository,Extensions,ApiException};
if($argc!==2)throw new RuntimeException('Usage: php php/tests/extensions.php QA_CONFIG_JSON');
$config=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);if(!isset($config['database']))$config=['database'=>$config];$config['database']['name']='wexashelf_repo_test';$db=Database::connect($config);Database::migrate($db);$repo=new Repository($db,$config);$ext=new Extensions($repo);
function extensionAssert(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function extensionReject(callable $fn,int $status):void{try{$fn();}catch(ApiException $e){extensionAssert($e->status===$status,'rejection status');return;}throw new RuntimeException('Invalid change accepted');}
$db->beginTransaction();try{
 $repo->seed(json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR));
 $manifest=['schemaVersion'=>1,'id'=>'community-links','name'=>'Community links','description'=>'Useful catalogue entry points.','version'=>'1.0.0','requires'=>'wexashelf-module-api:1','cards'=>[['id'=>'catalogue','locales'=>['en'=>['title'=>'Find an app','description'=>'Explore the catalogue.','href'=>'/en/apps']]]]];
 $installed=$ext->change(['revision'=>0,'action'=>'install','manifest'=>$manifest]);extensionAssert(!$installed['packages'][0]['enabled']&&!$ext->cards('en'),'installed disabled');
 extensionReject(fn()=>$ext->change(['revision'=>0,'action'=>'enable','id'=>$manifest['id']]),409);
 $enabled=$ext->change(['revision'=>$installed['revision'],'action'=>'enable','id'=>$manifest['id']]);extensionAssert(count($ext->cards('en'))===1&&!$ext->cards('tr'),'only reviewed language cards');
 foreach(['/admin','/yonetim','/en/admin','/en/yonetim','/%61pi/health','/api','//example.com','/en/../admin','/en/%2e%2e/admin','/en/%2561dmin','javascript:alert(1)'] as $href){$bad=$manifest;$bad['cards'][0]['locales']['en']['href']=$href;extensionReject(fn()=>Extensions::validatePackage($bad),400);}
 $bad=$manifest;$bad['script']='alert(1)';extensionReject(fn()=>Extensions::validatePackage($bad),400);
 $site=$repo->getSiteSettings();$original=$site;$site['theme']['tokens']['accent']='#24abcf';$saved=$repo->saveSiteSettings($site);$history=$repo->setting('appearance-history');extensionAssert(count($history)===2,'previous and next appearance revisions kept');
 $restored=$ext->restoreTheme($original['revision'],$saved['revision']);extensionAssert($restored['theme']===$original['theme']&&$restored['revision']>$saved['revision'],'restore as new revision');
 extensionReject(fn()=>$ext->restoreTheme($original['revision'],$saved['revision']),409);
 $backup=$repo->exportBackup();extensionAssert(count($backup['extensions']['modules']['packages'])===1,'extension backup included');$repo->restoreBackup($backup);extensionAssert(count($ext->cards('en'))===1,'module state restored');
 $corrupt=$backup;$corrupt['extensions']['modules']['packages'][0]['checksum']=str_repeat('0',64);extensionReject(fn()=>$repo->restoreBackup($corrupt),400);extensionAssert(count($ext->cards('en'))===1,'bad backup cannot mutate installed packages');
 $ext->change(['revision'=>$ext->installed()['revision'],'action'=>'uninstall','id'=>$manifest['id']]);extensionAssert(!$ext->cards('en'),'uninstall removes cards');
 extensionAssert($db->inTransaction(),'all changes remain atomic');echo "PASS: module validation, disabled installation, locale isolation, revision conflicts, appearance rollback and backup integrity\n";
}finally{if($db->inTransaction())$db->rollBack();}
