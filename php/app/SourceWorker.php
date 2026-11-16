<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;

/** Durable read-only fetch queue. Completion creates a candidate; publication requires editor review. */
final class SourceWorker {
 public function __construct(private PDO $db,private Repository $repo,private ?StoreProviders $providers=null){}
 public static function migrate(PDO $db):void{if($db->inTransaction())return;StoreProviders::migrate($db);$db->exec('CREATE TABLE IF NOT EXISTS ws_source_jobs (id CHAR(36) PRIMARY KEY,status VARCHAR(20) NOT NULL,next_run BIGINT NOT NULL,locked_until BIGINT NOT NULL,payload LONGTEXT NOT NULL,INDEX source_due(status,next_run)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');}
 private function query(string $sql,array $args=[]):\PDOStatement{$q=$this->db->prepare($sql);$q->execute($args);return$q;}
 private function providers():StoreProviders{return$this->providers??new StoreProviders($this->db,$this->repo);}
 private function read(string $id,bool $lock=false):?array{$raw=$this->query('SELECT payload FROM ws_source_jobs WHERE id=?'.($lock?' FOR UPDATE':''),[$id])->fetchColumn();return$raw===false?null:json_decode($raw,true,64,JSON_THROW_ON_ERROR);}
 private function write(array $job):void{$this->query('INSERT INTO ws_source_jobs(id,status,next_run,locked_until,payload) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),next_run=VALUES(next_run),locked_until=VALUES(locked_until),payload=VALUES(payload)',[$job['id'],$job['status'],$job['nextRun'],$job['lockedUntil']??0,json_encode($job,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES)]);}
 private static function publicJob(array $job):array{unset($job['requestHash'],$job['providerFingerprint'],$job['lease'],$job['lockedUntil']);return$job;}
 public function jobs():array{return array_map(fn($row)=>self::publicJob(json_decode($row['payload'],true,64,JSON_THROW_ON_ERROR)),$this->query("SELECT payload FROM ws_source_jobs ORDER BY JSON_UNQUOTE(JSON_EXTRACT(payload,'$.createdAt')) DESC,id DESC LIMIT 200")->fetchAll());}
 public function enqueue(array $input):array {
  Validation::check(!array_diff(array_keys($input),['action','requestId','appId','providerId','platform','country']),'Invalid source queue fields.');foreach(['requestId','appId','providerId','platform','country'] as $key)Validation::check(is_string($input[$key]??null),'Missing source queue field: '.$key);Validation::check(preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/iD',$input['requestId']),'A UUID v4 request ID is required.');$input['country']=AppleProvider::country($input['country']);$request=array_intersect_key($input,array_flip(['appId','providerId','platform','country']));$hash=hash('sha256',json_encode($request,JSON_THROW_ON_ERROR));
  return$this->repo->transaction(function()use($input,$request,$hash){$existing=$this->read($input['requestId'],true);if($existing){if(!hash_equals($existing['requestHash'],$hash))throw new ApiException('Request ID was already used for another source fetch.',409);return self::publicJob($existing);}$record=$this->repo->record('app',$input['appId']);Validation::check($record!==null,'Application not found.');StoreProviders::identity($record['data'],$input['platform'],$input['country']);$provider=$this->providers()->provider($input['providerId']);Validation::check(in_array($input['platform'],$provider['platforms'],true),'Provider platform mismatch.');
   $this->db->exec("DELETE FROM ws_source_jobs WHERE status IN ('completed','failed','cancelled') AND id NOT IN (SELECT id FROM (SELECT id FROM ws_source_jobs WHERE status IN ('completed','failed','cancelled') ORDER BY JSON_UNQUOTE(JSON_EXTRACT(payload,'$.createdAt')) DESC,id DESC LIMIT 500) AS retained)");
   $count=(int)$this->query('SELECT COUNT(*) FROM ws_source_jobs')->fetchColumn();Validation::check($count<2000,'Source queue archive is full.');$now=Repository::now();$job=$request+['id'=>$input['requestId'],'status'=>'queued','attempts'=>0,'nextRun'=>0,'lockedUntil'=>0,'createdAt'=>$now,'updatedAt'=>$now,'requestHash'=>$hash,'providerFingerprint'=>$this->providers()->fingerprint($input['providerId'])];$this->write($job);$this->repo->audit('source-queued',$job['id'],$job['appId'].'; '.$job['providerId']);return self::publicJob($job);
  });
 }
 public function action(array $input):array {
  Validation::check(!array_diff(array_keys($input),['action','id'])&&is_string($input['id']??null)&&in_array($input['action']??null,['retry','cancel'],true),'Invalid source job action.');return$this->repo->transaction(function()use($input){$job=$this->read($input['id'],true);Validation::check($job!==null,'Source job not found.');
   if($input['action']==='cancel'){Validation::check(in_array($job['status'],['queued','retry_wait'],true),'Only waiting source jobs may be cancelled.');$job['status']='cancelled';}
   else{Validation::check(in_array($job['status'],['failed','cancelled'],true),'Only failed or cancelled source jobs may be retried.');$job['status']='queued';$job['attempts']=0;$job['providerFingerprint']=$this->providers()->fingerprint($job['providerId']);unset($job['error']);}$job['nextRun']=0;$job['lockedUntil']=0;$job['updatedAt']=Repository::now();$this->write($job);$this->repo->audit('source-'.$input['action'],$job['id']);return self::publicJob($job);
  });
 }
 private function claim():?array{return$this->repo->transaction(function(){
  $row=$this->query("SELECT payload FROM ws_source_jobs WHERE (status IN ('queued','retry_wait') AND next_run<=?) OR (status='running' AND locked_until<?) ORDER BY next_run,id LIMIT 1 FOR UPDATE",[time(),time()])->fetchColumn();if($row===false)return null;$job=json_decode($row,true,64,JSON_THROW_ON_ERROR);
  if($job['status']==='running'&&$job['attempts']>=3){$job['status']='failed';$job['error']='The read-only worker lease expired repeatedly. Review and retry explicitly.';$job['updatedAt']=Repository::now();$job['lockedUntil']=0;$this->write($job);return null;}
  $job['status']='running';$job['attempts']++;$job['lockedUntil']=time()+90;$job['lease']=bin2hex(random_bytes(16));$job['updatedAt']=Repository::now();$this->write($job);return$job;
 });}
 public function run(int $maxJobs=5,int $maxSeconds=50):array {
  Validation::check($maxJobs>=1&&$maxJobs<=25&&$maxSeconds>=5&&$maxSeconds<=300,'Worker bounds exceeded.');$started=microtime(true);$processed=[];
  while(count($processed)<$maxJobs&&microtime(true)-$started<$maxSeconds){$job=$this->claim();if(!$job)break;
   try{if(!hash_equals($job['providerFingerprint'],$this->providers()->fingerprint($job['providerId'])))throw new ApiException('Source provider configuration changed. Review and retry this job.',409);$candidate=(new SourceRefresh($this->db,$this->repo,$this->providers()))->fetch($job['appId'],$job['country'],$job['platform'],$job['providerId'],true,$job['id']);$job['status']='completed';$job['candidateId']=$candidate['id'];$job['nextRun']=0;unset($job['error']);}
   catch(\Throwable $error){$retryable=$error instanceof ApiException&&in_array($error->status,[429,502,503,504],true);$job['status']=$retryable&&$job['attempts']<3?'retry_wait':'failed';$job['error']=$error instanceof ApiException?$error->getMessage():'Source processing failed. Review the private worker logs.';$job['nextRun']=$job['status']==='retry_wait'?time()+($error instanceof ApiException&&$error->status===429?3600:60*(2**($job['attempts']-1))):0;}
   $this->repo->transaction(function()use(&$job){$current=$this->read($job['id'],true);if(!$current||($current['lease']??'')!==$job['lease'])throw new ApiException('Source worker lease changed.',409);$job['lockedUntil']=0;unset($job['lease']);$job['updatedAt']=Repository::now();$this->write($job);$this->repo->audit('source-worker',$job['id'],$job['status']);});$processed[]=self::publicJob($job);
  }
  return['processed'=>count($processed),'jobs'=>$processed,'publication'=>'review-required'];
 }
}
