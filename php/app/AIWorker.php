<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
final class AIWorker {
 private AIService $service;
 public function __construct(PDO $db,array $config,?AIProvider $provider=null){$this->service=new AIService($db,$config,$provider);}
 public function run(int $maxJobs=5,int $maxSeconds=50,int $concurrency=2):array{$maxJobs=max(1,min(20,$maxJobs));$maxSeconds=max(1,min(300,$maxSeconds));$started=microtime(true);$jobs=[];while(count($jobs)<$maxJobs&&microtime(true)-$started<$maxSeconds){$job=$this->service->workOne($concurrency);if(!$job)break;$jobs[]=['id'=>$job['id'],'status'=>$job['status']];}return ['processed'=>count($jobs),'jobs'=>$jobs,'seconds'=>round(microtime(true)-$started,3)];}
}
