<?php
declare(strict_types=1);
namespace WexaShelf;
/** Administrator supplied pricing estimates. Never a provider invoice. */
final class AIBudget {
 public static function settings(mixed $v):array {$v=$v??['enabled'=>false,'currency'=>'USD','dailyLimit'=>0];Validation::check(is_array($v)&&is_bool($v['enabled']??null)&&is_string($v['currency']??null)&&$v['currency']==='USD','Invalid budget settings.');Validation::check(is_numeric($v['dailyLimit']??null)&&is_finite((float)$v['dailyLimit'])&&$v['dailyLimit']>=0&&$v['dailyLimit']<=1000000,'Invalid daily monetary limit.');return ['enabled'=>$v['enabled'],'currency'=>$v['currency'],'dailyLimit'=>(float)$v['dailyLimit']];}
 public static function pricing(mixed $v):array {$v=$v??[];Validation::check(is_array($v),'Invalid pricing.');$out=[];foreach(['inputPerMillion','outputPerMillion','imagePerRequest'] as $key){$x=$v[$key]??null;Validation::check($x===null||(is_int($x)||is_float($x))&&is_finite((float)$x)&&$x>=0&&$x<=1000000,'Invalid configured price.');$out[$key]=$x===null?null:(float)$x;}return $out;}
 public static function reserve(array $provider,string $task,string $prompt,array $budget):array {
  $p=self::pricing($provider['pricing']??null);$known=$p['inputPerMillion']!==null&&$p['outputPerMillion']!==null&&($task!=='image'||$p['imagePerRequest']!==null);
  Validation::check(!$budget['enabled']||$known,'Set input/output and image prices before using a monetary budget.');
  // One token per UTF-8 byte plus framing allowance is deliberately conservative.
  $input=strlen($prompt)+4096;$amount=$known?($input*$p['inputPerMillion']+6000*$p['outputPerMillion'])/1000000+($task==='image'?$p['imagePerRequest']:0):null;
  return ['currency'=>$budget['currency'],'reserved'=>$amount===null?null:ceil($amount*1000000)/1000000,'estimated'=>null,'pricing'=>$p,'inputTokenCeiling'=>$input,'outputTokenCeiling'=>6000,'basis'=>'administrator-configured estimate; not provider invoice'];
 }
 public static function settle(array $cost,array $usage,string $task):array {$i=$usage['input_tokens']??$usage['prompt_tokens']??null;$o=$usage['output_tokens']??$usage['completion_tokens']??null;$p=$cost['pricing'];if($cost['reserved']!==null&&is_int($i)&&is_int($o))$cost['estimated']=ceil((($i*$p['inputPerMillion']+$o*$p['outputPerMillion'])/1000000+($task==='image'?$p['imagePerRequest']:0))*1000000)/1000000;return $cost;}
 public static function daily(array $jobs,string $currency):float {$sum=0.;foreach($jobs as $j)if(substr($j['createdAt'],0,10)===gmdate('Y-m-d')){$cost=$j['cost']??null;if(!$cost)continue;Validation::check($cost['currency']===$currency,'Daily budget currency cannot change while today has reserved jobs.');$sum+=$j['status']==='completed'?($cost['estimated']??$cost['reserved']??0):($cost['reserved']??0);}return $sum;}
}
