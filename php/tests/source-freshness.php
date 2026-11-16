<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{ApiException,Database,Repository,SourceRefresh,SourceWorker};

if($argc!==2)throw new RuntimeException('Usage: php php/tests/source-freshness.php PRIVATE_QA_DATABASE_JSON');
$config=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);
if(!isset($config['database']))$config=['database'=>$config];
$config['database']['name']='wexashelf_sources_070';
$db=Database::connect($config);Database::migrate($db);SourceWorker::migrate($db);
$repo=new Repository($db,$config);
if($repo->allRecords())throw new RuntimeException('Empty dedicated wexashelf_sources_070 schema required.');
function freshnessAssert(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
$db->beginTransaction();
try{
    $insert=$db->prepare('INSERT INTO ws_records(kind,id,payload) VALUES(?,?,?)');
    for($i=0;$i<=100;$i++){
        $id='source-freshness-'.str_pad((string)$i,3,'0',STR_PAD_LEFT);
        $data=['id'=>$id,'name'=>'Synthetic '.$id,'platforms'=>['android'],'storeMetrics'=>[],'storeIds'=>[],'facts'=>[],'plans'=>[]];
        if($i===100)$data['storeMetrics'][]=['platform'=>'android','country'=>'US','observedAt'=>'2026-01-01T00:00:00Z','downloadsLowerBound'=>null,'rating'=>null,'ratingCount'=>null];
        $record=['kind'=>'app','id'=>$id,'revision'=>1,'status'=>'draft','seoApproved'=>false,'sourceLocale'=>'en','data'=>$data];
        $insert->execute(['app',$id,json_encode($record,JSON_THROW_ON_ERROR)]);
    }
    $service=new SourceRefresh($db,$repo);$target='source-freshness-100';
    $default=$service->state();
    freshnessAssert(count($default['freshness'])===100&&!in_array($target,array_column($default['freshness'],'appId'),true),'Default state remains bounded to first100.');
    freshnessAssert($repo->getAdminSnapshot(['q'=>$target])['records'][0]['id']===$target,'Content search can select an app beyond the first page.');
    $selected=$service->state($target);
    freshnessAssert(count($selected['freshness'])===1&&$selected['freshness'][0]['appId']===$target,'Selected app freshness is bounded to its direct record.');
    $field=$selected['freshness'][0]['fields'][0];
    freshnessAssert($field['field']==='storeMetrics.android.US'&&$field['checkedAt']==='2026-01-01T00:00:00Z'&&$field['state']==='stale','Offpage selected app keeps the recorded observation date and state.');
    freshnessAssert($selected['candidates']===$default['candidates']&&$selected['jobs']===$default['jobs'],'Selecting freshness does not change candidate or job history.');
    try{$service->state('../invalid');throw new RuntimeException('Invalid identity accepted.');}catch(ApiException $e){freshnessAssert($e->status===400,'Invalid identity rejected.');}
    freshnessAssert($repo->getAdminSnapshot()['pagination']['total']===101,'Reading freshness leaves all fixture records unchanged.');
    echo "PASS selected source freshness: 101 synthetic drafts; Content search finds offpage app, direct state returns recorded date, legacy state bounded100, histories unchanged, invalid identity rejected. No provider calls.\n";
}finally{if($db->inTransaction())$db->rollBack();}
