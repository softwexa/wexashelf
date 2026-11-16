<?php
declare(strict_types=1);
require_once __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Database,Repository,Translations,ApiException};
if($argc!==2)throw new RuntimeException('Usage: php php/tests/translations.php QA_CONFIG_JSON');
$config=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);if(!isset($config['database']))$config=['database'=>$config];
$config['database']['name']='wexashelf_repo_test';
$db=Database::connect($config);Database::migrate($db);$repo=new Repository($db,$config);$service=new Translations($db,$repo);
function translationAssert(bool $ok,string $message):void{if(!$ok)throw new RuntimeException($message);}
function translationReject(callable $fn,int $status,string $message):void{try{$fn();}catch(ApiException $e){translationAssert($e->status===$status,$message.' status');return;}throw new RuntimeException($message);}
$db->beginTransaction();
try{
 $seed=json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR);unset($seed['translations']);$repo->seed($seed);
 $initial=$repo->exportBackup();$source=current(array_filter($repo->allRecords(),fn($r)=>$r['kind']==='article'));
 $fields=[];foreach(Translations::fieldMap($source) as $field)$fields[$field['path']]='English '.$field['path'];
 $input=['kind'=>$source['kind'],'id'=>$source['id'],'locale'=>'en','slug'=>'english-guide','revision'=>0,'sourceRevision'=>$source['revision'],'status'=>'draft','publishAt'=>null,'seoApproved'=>false,'fields'=>[],'seo'=>[],'reviewNote'=>'QA'];
 $draft=$service->save($input);translationAssert($db->inTransaction(),'save must not implicitly commit');translationAssert(!$repo->getPublicSnapshot()['translations'],'draft private');
 translationReject(fn()=>$service->save(array_replace($input,['revision'=>$draft['revision'],'status'=>'published'])),400,'incomplete publication rejected');
 translationReject(fn()=>$service->save(array_replace($input,['revision'=>$draft['revision'],'fields'=>['author'=>'Other identity']])),400,'immutable identity cannot translate');
 $published=$service->save(array_replace($input,['revision'=>$draft['revision'],'fields'=>$fields,'status'=>'published','seoApproved'=>true]));translationAssert(!$published['seoApproved'],'changed text clears SEO approval');
 $published=$service->save(array_replace($published,['seoApproved'=>true]));translationAssert($published['seoApproved'],'unchanged review approves');
 translationReject(fn()=>$service->save(array_replace($input,['revision'=>$draft['revision'],'fields'=>$fields])),409,'stale translation revision');
 $rows=$repo->getPublicSnapshot()['translations'];translationAssert(count($rows)===1&&$rows[0]['data']['title']==='English title'&&!$rows[0]['stale'],'published overlay');
 translationAssert($rows[0]['data']['sources'][0]['url']===$source['data']['sources'][0]['url'],'source URLs preserved');
 $source['seoApproved']=true;$source=$repo->saveRecord($source);translationAssert(!$repo->getPublicSnapshot()['translations'][0]['stale'],'approval-only source update not stale');
 $source['data']['sources'][0]['url']='https://example.org/revised-evidence';$source=$repo->saveRecord($source);$published=$service->save(array_replace($published,['sourceRevision'=>$source['revision'],'seoApproved'=>true]));translationAssert(!$published['seoApproved'],'Source evidence changes require renewed SEO review even with unchanged translated text');$published=$service->save(array_replace($published,['seoApproved'=>true]));
 $source['data']['sections'][]=['heading'=>'Yeni Türkçe bölüm','paragraphs'=>['Yeni Türkçe metin']];$source=$repo->saveRecord($source);
 $stale=$repo->getPublicSnapshot()['translations'][0];translationAssert($stale['stale'],'source change marks stale');translationAssert(!str_contains(json_encode($stale['data'],JSON_UNESCAPED_UNICODE),'Yeni Türkçe'),'stale frozen snapshot cannot leak new source text');
 translationReject(fn()=>$service->save($published),409,'source revision conflict');
 $restored=$service->restore($source['kind'],$source['id'],'en',$draft['revision']);translationAssert($restored['status']==='draft'&&!$restored['seoApproved']&&$restored['stale'],'restore draft retains source fingerprint');
 $backup=$repo->exportBackup();translationAssert(count($backup['localization']['translations'])===1,'translations exported');translationAssert($repo->restoreBackup($backup,true)['translations']===1,'translations backup validates');
 $repo->restoreBackup($backup);translationAssert(count($service->history($source['kind'],$source['id'],'en'))>=4,'translation history restored');
 $legacy=$initial;unset($legacy['localization']);translationAssert($repo->restoreBackup($legacy,true)['translationRestorePolicy']==='clear-legacy-translations','legacy restore explicit policy');$repo->restoreBackup($legacy);translationAssert(!$service->state()['translations'],'legacy restore clears unrelated translations');
 $settings=$service->settings();translationAssert($settings['defaultLocale']==='en'&&$settings['sourceLocale']==='en','English defaults for visitors and newly created content');
 $bad=$settings;$bad['locales'][]=['code'=>'de','label'=>'Deutsch','enabled'=>true];translationReject(fn()=>$service->saveSettings($bad),400,'unsupported UI cannot enabled');$bad['locales'][2]['enabled']=false;$savedSettings=$service->saveSettings($bad);translationAssert(count($savedSettings['locales'])===3,'disabled language drafts allowed');
 translationReject(fn()=>$service->saveSettings($settings),409,'settings optimistic concurrency');
 echo "PASS: translation review, immutable source facts, revision conflicts, frozen stale snapshots, backup/history, English default and language gates\n";
}finally{if($db->inTransaction())$db->rollBack();}
