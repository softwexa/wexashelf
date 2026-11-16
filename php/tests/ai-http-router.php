<?php
// Explicit local test router only; never packaged or reachable through production routes.
declare(strict_types=1);
$uri=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH)?:'/';
if(str_starts_with($uri,'/api/')){
 require __DIR__.'/../app/bootstrap.php';
 $config=\WexaShelf\Config::load();
 if(($config['database']['name']??'')!=='wexashelf_ai_e2e')throw new RuntimeException('AI fixture requires its dedicated test database.');
 $provider=new \WexaShelf\AIProvider(static function(array $p,string $method,string $path,?array $body):array {
  if($method==='POST'){
   $prompt=json_encode($body);$task=str_contains($prompt,'image_generation')?'image':(preg_match('/Task: (titles|description|article|seo)/',$prompt,$m)?$m[1]:'titles');
   return ['id'=>'resp_fixture_'.$task,'status'=>'queued'];
  }
  $task=substr($path,strrpos($path,'_')+1);
  if($task==='image')return ['id'=>'resp_fixture_image','status'=>'completed','output'=>[['type'=>'image_generation_call','status'=>'completed','result'=>'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=']],'usage'=>['input_tokens'=>17,'output_tokens'=>8,'total_tokens'=>25]];
  $result=match($task){'seo'=>['title'=>'Fixture SEO title','description'=>'Fixture SEO description grounded in catalog records.','warnings'=>[]],'description'=>['tagline'=>'Fixture AI tagline','description'=>'Fixture description grounded in the selected source record.','summary'=>'Fixture source summary.','warnings'=>[]],'article'=>['title'=>'Fixture editorial title','summary'=>'Fixture source summary.','sections'=>[['heading'=>'Source review','paragraphs'=>['Only catalog facts are used.']],['heading'=>'Limitations','paragraphs'=>['No hands-on testing is claimed.']]],'warnings'=>[]],default=>['titles'=>['Fixture title one','Fixture title two','Fixture title three'],'warnings'=>[]]};
  return ['id'=>'resp_fixture_'.$task,'status'=>'completed','output'=>[['content'=>[['type'=>'output_text','text'=>json_encode($result)]]]],'usage'=>['input_tokens'=>17,'output_tokens'=>8,'total_tokens'=>25]];
 });
 \WexaShelf\Api::handle(\WexaShelf\Database::connect($config),$config,$uri,$_SERVER['REQUEST_METHOD']??'GET',$provider);
}
require __DIR__.'/../public/router.php';
