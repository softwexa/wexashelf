<?php
declare(strict_types=1);
require_once __DIR__.'/../app/ApiException.php';
require_once __DIR__.'/../app/AIProvider.php';
require_once __DIR__.'/../app/AIContent.php';
use WexaShelf\AIProvider;
use WexaShelf\AIContent;
use WexaShelf\ApiException;
function check(bool $v,string $label):void {if(!$v)throw new RuntimeException($label);}
function rejects(callable $fn):void {try{$fn();}catch(ApiException){return;}throw new RuntimeException('Expected rejection');}
$p=['id'=>'openai','label'=>'OpenAI','protocol'=>'openai','baseUrl'=>'https://api.openai.com/v1','textModel'=>'gpt-5.6-luna','imageModel'=>'gpt-image-2.5-flare','imageEnabled'=>true,'apiKey'=>'test-only'];
AIProvider::validateProvider($p);
foreach(['http://example.com/v1','https://localhost/v1','https://127.0.0.1/v1','https://[::1]/v1','https://user@example.com','https://example.com:444','https://example.com/v1?x=1','https://example.com/v1#x','https://2130706433/v1'] as $url) rejects(fn()=>AIProvider::validateProvider(array_replace($p,['protocol'=>'compatible','baseUrl'=>$url])));
foreach(['127.0.0.1','10.1.1.1','172.16.2.1','192.168.2.1','169.254.169.254','100.64.0.1','192.0.2.1','198.18.1.1','198.51.100.1','203.0.113.1','224.0.0.1','240.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::'] as $ip) check(!AIProvider::isPublicIp($ip),'Blocked '.$ip);
check(AIProvider::isPublicIp('8.8.8.8'),'Public IPv4');check(AIProvider::isPublicIp('2606:4700:4700::1111'),'Public IPv6');
$calls=[];
$transport=new AIProvider(function($provider,$method,$path,$body,$timeout,$limit)use(&$calls){$calls[]=func_get_args();return $method==='GET'?['id'=>'resp_test','status'=>'completed','output'=>[['type'=>'message','content'=>[['type'=>'output_text','text'=>'{"titles":["a","b","c"],"warnings":[]}']]]]]:['id'=>'resp_test','status'=>'queued'];});
$b=AIContent::build('titles',['apps'=>[['name'=>'Example']]],['brief'=>'Headlines']);
$r=$transport->start($p,'titles',$b['prompt'],$b['schema'],'request1');check($r['status']==='queued','Queued');
check($calls[0][3]['background']===true && $calls[0][3]['store']===false,'Background ephemeral');check($calls[0][3]['text']['format']['strict']===true,'Strict JSON');
$r=$transport->poll($p,'resp_test');check(count(AIContent::parse('titles',$r['text'])['titles'])===3,'Parsed');
$transport->start($p,'image','cover',[],'request2');check($calls[2][3]['tool_choice']['type']==='image_generation','Forced image');check(count($calls[2][3]['tools'])===1,'Only image tool');check($calls[2][3]['max_tool_calls']===1,'Single image call cap');
rejects(fn()=>$transport->poll($p,'../../secret'));
rejects(fn()=>AIContent::parse('titles','{"titles":["one"],"warnings":[]}'));
rejects(fn()=>AIContent::parse('seo','{"title":"<script>x</script>","description":"x","warnings":[]}'));
rejects(fn()=>AIContent::parse('seo','{"title":"x","description":"x","warnings":[],"admin":true}'));
$cp=array_replace($p,['protocol'=>'compatible','baseUrl'=>'https://example.com/v1','imageEnabled'=>false,'imageModel'=>'']);AIProvider::validateProvider($cp);
$compatible=new AIProvider(function($provider,$method,$path,$body,$timeout){check($path==='/chat/completions' && $timeout===35,'Compatible bounds');return ['choices'=>[['finish_reason'=>'stop','message'=>['content'=>'{}']]]];});
check($compatible->start($cp,'seo','test',[],'request3')['status']==='completed','Compatible complete');
$imageTransport=new AIProvider(function($provider,$method,$path,$body,$timeout){check($path==='/images/generations' && $timeout===55,'Compatible image bounds');check($body['n']===1 && $body['size']==='1536x1024','Single landscape');if(str_starts_with($body['model'],'gpt-image-'))check(!isset($body['response_format'])&&$body['output_format']==='png','GPT Image defaults base64');else check($body['response_format']==='b64_json','Legacy requests base64');return ['data'=>[['b64_json'=>'test-only']]];});
$imageTransport->start(array_replace($cp,['imageEnabled'=>true,'imageModel'=>'gpt-image-2.5-flare']),'image','cover',[],'image1');
$imageTransport->start(array_replace($cp,['imageEnabled'=>true,'imageModel'=>'legacy-image']),'image','cover',[],'image2');
echo "AI provider/content: passed (offline transport, SSRF ranges, strict parsing).\n";

$privateCheck=\WexaShelf\AIContent::build('titles',['target'=>['kind'=>'app','reviewNote'=>'DO_NOT_SEND_INTERNAL_NOTE','data'=>['name'=>'Visible app']],'apps'=>[]],['brief'=>'Draft a title','locale'=>'en','tone'=>'neutral']);
if(str_contains($privateCheck['prompt'],'DO_NOT_SEND_INTERNAL_NOTE')||!str_contains($privateCheck['prompt'],'Visible app'))throw new \RuntimeException('Prompt must omit private review metadata and preserve chosen content.');
