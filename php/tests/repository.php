<?php
declare(strict_types=1);
require_once __DIR__.'/../app/bootstrap.php';
// Run only against a dedicated empty QA database; configuration path is explicit.
foreach (['ApiException','Database','Validation','Admission','Repository','SEOSettings'] as $class) require __DIR__.'/../app/'.$class.'.php';
use WexaShelf\{Database,Repository,ApiException};
if ($argc !== 2) throw new RuntimeException('Usage: php tests/repository.php QA_CONFIG_JSON');
$config=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);
if (!isset($config['database'])) $config=['database'=>$config];
$config['database']['name']='wexashelf_repo_test';
$db=Database::connect($config);Database::migrate($db);$repo=new Repository($db,$config);
function expect(bool $ok,string $msg):void {if(!$ok)throw new RuntimeException($msg);}
$db->beginTransaction();
try {
 $seed=json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR);$repo->seed($seed);expect(count($repo->getAdminSnapshot()['records'])===17,'seed');$initial=$repo->exportBackup();$repo->setSetting('admin-password','qa-preserve');expect(isset($initial['seoSettings'])&&!isset($initial['aiSettings']),'SEO exported without provider secrets');$seo=new \WexaShelf\SEOSettings($repo,$config);$changedSeo=$seo->get();$changedSeo['homeTitle']='QA changed title';$seo->save($changedSeo);
 $r=$initial['records'][0];$r['reviewNote']='QA revision';$saved=$repo->saveRecord($r);expect($saved['revision']===$r['revision']+1,'revision');try{$repo->saveRecord($r);throw new RuntimeException('Missing conflict');}catch(ApiException $e){expect($e->status===409,'conflict status');}
 $restored=$repo->restoreRevision($r['kind'],$r['id'],$r['revision']);expect($restored['status']==='draft'&&!$restored['seoApproved'],'restore draft');
 $app=current(array_filter($initial['records'],fn($x)=>$x['kind']==='app'));$app['data']['id']='qa-imported';$app['data']['storeIds']=[];$import=$repo->importRecords([$app],true);expect($import['valid']&&$import['imported']===0,'dry import');expect($repo->importRecords([$app],false)['imported']===1,'import');
 expect($repo->restoreBackup($initial,true)['valid'],'backup dryrun');$db->prepare('INSERT INTO ws_source_refresh(id,payload) VALUES(?,?)')->execute(['00000000-0000-4000-8000-000000000001','{}']);$repo->restoreBackup($initial,false);expect((int)$db->query('SELECT COUNT(*) FROM ws_source_refresh')->fetchColumn()===0,'refresh cleared');expect($repo->setting('admin-password')==='qa-preserve','auth preserved');expect(count($repo->getAdminSnapshot()['records'])===17,'restore count');expect($seo->get()['homeTitle']===$initial['seoSettings']['homeTitle'],'SEO settings restored');
 $bad=$initial;$bad['revisions'][0]['revision']=0;try{$repo->restoreBackup($bad,false);throw new RuntimeException('Bad backup accepted');}catch(ApiException){}expect(count($repo->getAdminSnapshot()['records'])===17,'bad backup unchanged');
 $app=current(array_filter($repo->getAdminSnapshot()['records'],fn($x)=>$x['kind']==='app'));$app['seoApproved']=true;$app=$repo->saveRecord($app);$app['data']['tagline'].=' QA';$app=$repo->saveRecord($app);expect(!$app['seoApproved'],'SEO invalidation');
 $settings=$repo->getSiteSettings();$repo->saveSiteSettings($settings);try{$repo->saveSiteSettings($settings);throw new RuntimeException('Settings conflict absent');}catch(ApiException $e){expect($e->status===409,'settings conflict');}
 $feedback=$repo->submitFeedback(['appId'=> $repo->getPublicSnapshot()['apps'][0]['id'],'field'=>'price','message'=>'QA feedback message']);$repo->updateFeedback($feedback['id'],'resolved');
 echo "PASS: seed, snapshots, revision conflict/history, import, backup validation/restore, auth preservation, settings conflict, feedback\n";
} finally {if($db->inTransaction())$db->rollBack();}
