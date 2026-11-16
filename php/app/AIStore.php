<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
/** Indexed queue metadata; provider secrets are never stored in jobs. */
final class AIStore {
 public const TERMINAL=['completed','failed','uncertain','cancelled'];
 public function __construct(private PDO $db){}
 public static function migrate(PDO $db):void{
  if($db->inTransaction())throw new \LogicException('Initialize the AI queue before starting a transaction.');
  $lock='wexa_ai_schema_'.sha1((string)$db->query('SELECT DATABASE()')->fetchColumn());$q=$db->prepare('SELECT GET_LOCK(?,10)');$q->execute([$lock]);if((int)$q->fetchColumn()!==1)throw new ApiException('AI schema initialization is busy.',503);try{
  $db->exec('CREATE TABLE IF NOT EXISTS ws_ai_jobs (id VARCHAR(36) PRIMARY KEY,payload LONGTEXT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');$columns=array_column($db->query('SHOW COLUMNS FROM ws_ai_jobs')->fetchAll(PDO::FETCH_ASSOC),'Field');
  foreach(['status'=>"VARCHAR(24) NOT NULL DEFAULT ''",'created_at'=>"VARCHAR(40) NOT NULL DEFAULT ''",'next_run'=>'BIGINT NOT NULL DEFAULT 0','lease_until'=>'BIGINT NOT NULL DEFAULT 0','lease_token'=>"VARCHAR(64) NOT NULL DEFAULT ''",'archived'=>'TINYINT NOT NULL DEFAULT 0']as$name=>$ddl)if(!in_array($name,$columns,true))$db->exec('ALTER TABLE ws_ai_jobs ADD COLUMN '.$name.' '.$ddl);
  $indexes=array_column($db->query('SHOW INDEX FROM ws_ai_jobs')->fetchAll(PDO::FETCH_ASSOC),'Key_name');if(!in_array('queue_due',$indexes,true))$db->exec('CREATE INDEX queue_due ON ws_ai_jobs(status,next_run,lease_until)');
  $db->exec("UPDATE ws_ai_jobs SET status=JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status')),created_at=JSON_UNQUOTE(JSON_EXTRACT(payload,'$.createdAt')) WHERE status=''");
  $db->exec('CREATE TABLE IF NOT EXISTS ws_ai_tombstones (id VARCHAR(36) PRIMARY KEY,expires BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');
  $db->exec("UPDATE ws_ai_jobs SET lease_until=UNIX_TIMESTAMP(REPLACE(SUBSTRING(created_at,1,19),'T',' '))+180 WHERE status='submitting' AND lease_until=0");
  }finally{$db->prepare('SELECT RELEASE_LOCK(?)')->execute([$lock]);}
 }
 public function save(array$j):void{$q=$this->db->prepare('INSERT INTO ws_ai_jobs(id,payload,status,created_at,next_run,lease_until,lease_token,archived) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload),status=VALUES(status),created_at=VALUES(created_at),next_run=VALUES(next_run),lease_until=VALUES(lease_until),lease_token=VALUES(lease_token),archived=VALUES(archived)');$q->execute([$j['id'],json_encode($j,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$j['status'],$j['createdAt'],$j['nextRun']??0,$j['leaseUntil']??0,$j['leaseToken']??'',(int)($j['archived']??false)]);}
 public function get(string$id):array{$q=$this->db->prepare('SELECT payload FROM ws_ai_jobs WHERE id=?');$q->execute([$id]);$v=$q->fetchColumn();if($v===false)throw new ApiException('AI job not found.',404);return json_decode($v,true,64,JSON_THROW_ON_ERROR);}
 public function existing(string$id):?array{try{return$this->get($id);}catch(ApiException$e){if($e->status!==404)throw$e;}$q=$this->db->prepare('SELECT id FROM ws_ai_tombstones WHERE id=? AND expires>?');$q->execute([$id,time()]);if($q->fetchColumn()!==false)throw new ApiException('This request ID belongs to a retired job. Use a new request ID.',410);return null;}
 public function recent(int$limit=100):array{$limit=max(1,min(500,$limit));return array_map(fn($r)=>json_decode($r['payload'],true,64,JSON_THROW_ON_ERROR),$this->db->query('SELECT payload FROM ws_ai_jobs ORDER BY created_at DESC,id DESC LIMIT '.$limit)->fetchAll());}
 public function today():array{$q=$this->db->prepare('SELECT payload FROM ws_ai_jobs WHERE created_at>=? ORDER BY created_at');$q->execute([gmdate('Y-m-d').'T00:00:00']);return array_map(fn($r)=>json_decode($r['payload'],true,64,JSON_THROW_ON_ERROR),$q->fetchAll());}
 public function count():int{return(int)$this->db->query('SELECT COUNT(*) FROM ws_ai_jobs')->fetchColumn();}
 public function delete(array$j):void{$this->db->prepare('INSERT INTO ws_ai_tombstones(id,expires) VALUES(?,?) ON DUPLICATE KEY UPDATE expires=VALUES(expires)')->execute([$j['id'],time()+90*86400]);$this->db->prepare('DELETE FROM ws_ai_jobs WHERE id=?')->execute([$j['id']]);}
 public function prune():int{$q=$this->db->prepare("SELECT id FROM ws_ai_jobs WHERE status IN ('completed','failed','uncertain','cancelled') AND lease_until<? AND ((archived=1 AND created_at<?) OR created_at<?) LIMIT 100");$q->execute([time(),gmdate('c',time()-30*86400),gmdate('c',time()-90*86400)]);$ids=$q->fetchAll(PDO::FETCH_COLUMN);foreach($ids as$id)$this->delete($this->get($id));$this->db->prepare('DELETE FROM ws_ai_tombstones WHERE expires<?')->execute([time()]);return count($ids);}
 /** Caller holds repository write lock. */
 public function claim(int$concurrency=2):?array{
  $q=$this->db->prepare("SELECT id FROM ws_ai_jobs WHERE lease_until>0 AND lease_until<? AND status IN ('submitting','queued','in_progress') LIMIT 50");$q->execute([time()]);foreach($q->fetchAll(PDO::FETCH_COLUMN)as$id){$j=$this->get($id);$j['leaseUntil']=0;$j['leaseToken']='';if($j['status']==='submitting'){$j['status']='uncertain';$j['error']='Worker lease expired during submission. No automatic generation retry was made.';}$this->save($j);}
  $q=$this->db->prepare('SELECT COUNT(*) FROM ws_ai_jobs WHERE lease_until>?');$q->execute([time()]);if((int)$q->fetchColumn()>=max(1,min(2,$concurrency)))return null;
  $q=$this->db->prepare("SELECT id FROM ws_ai_jobs WHERE status IN ('pending','queued','in_progress') AND next_run<=? AND lease_until<=? ORDER BY created_at,id LIMIT 1 FOR UPDATE");$q->execute([time(),time()]);$id=$q->fetchColumn();if($id===false)return null;$j=$this->get($id);$j['workerAction']=$j['status']==='pending'?'submit':'poll';if($j['workerAction']==='submit')$j['status']='submitting';$j['leaseToken']=bin2hex(random_bytes(24));$j['leaseUntil']=time()+300;$j['attempts']=($j['attempts']??0)+1;$this->save($j);return$j;
 }
 public function finish(array$j,string$lease):array{$current=$this->get($j['id']);if(!hash_equals($current['leaseToken']??'',$lease))return$current;$j['leaseUntil']=0;$j['leaseToken']='';unset($j['workerAction']);$this->save($j);return$j;}
}
