<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{AIContent,AIBudget,ApiException};
function aiCheck(bool $v,string $m):void{if(!$v)throw new RuntimeException($m);}
function aiReject(callable $f):void{try{$f();}catch(ApiException){return;}throw new RuntimeException('Expected rejection');}
$context=['target'=>['kind'=>'app','id'=>'sample','data'=>['name'=>'Sample','tagline'=>'A documented tool','description'=>'Only provided description','tags'=>[],'aliases'=>[]]],'apps'=>[]];
$ref=['recordId'=>'app:sample','field'=>'description'];
$result=['claims'=>[['text'=>'Only provided description','references'=>[$ref]]],'gaps'=>[],'warnings'=>[]];
aiCheck(AIContent::parse('claims',json_encode($result),$context)===$result,'Valid citation accepted');$result['claims'][0]['references'][0]['field']='invented.price';aiReject(fn()=>AIContent::parse('claims',json_encode($result),$context));$result['claims'][0]['references']=[];aiReject(fn()=>AIContent::parse('claims',json_encode($result),$context));
$translation=['fields'=>[['path'=>'name','text'=>'Name'],['path'=>'tagline','text'=>'Tagline'],['path'=>'description','text'=>'Description']],'warnings'=>[]];AIContent::parse('translation',json_encode($translation),$context);$translation['fields'][]=['path'=>'price','text'=>'Free'];aiReject(fn()=>AIContent::parse('translation',json_encode($translation),$context));
$budget=AIBudget::settings(['enabled'=>true,'currency'=>'USD','dailyLimit'=>1]);aiReject(fn()=>AIBudget::reserve([],'qa','prompt',$budget));$provider=['pricing'=>['inputPerMillion'=>1,'outputPerMillion'=>2,'imagePerRequest'=>.05]];$cost=AIBudget::reserve($provider,'qa','four',$budget);aiCheck($cost['reserved']>=.0161,'Conservative prompt plus framing and max output reservation');$settled=AIBudget::settle($cost,['input_tokens'=>10,'output_tokens'=>20],'qa');aiCheck(abs($settled['estimated']-.00005)<.000001,'Usage estimate uses saved prices');$jobs=[['createdAt'=>gmdate('c'),'status'=>'uncertain','cost'=>$cost]];aiCheck(AIBudget::daily($jobs,'USD')===$cost['reserved'],'Uncertain retains reservation');$jobs[0]['status']='completed';$jobs[0]['cost']=$settled;aiCheck(AIBudget::daily($jobs,'USD')===$settled['estimated'],'Completion uses estimate');aiReject(fn()=>AIBudget::settings(['enabled'=>true,'currency'=>'EUR','dailyLimit'=>1]));
echo "PASS AI grounding: citation allowlist, uncited claim rejection, exact translation fields, unknown prices, reservation, usage settlement and currency.\n";
