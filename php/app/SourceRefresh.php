<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
final class SourceRefresh {
    public function __construct(private PDO $db,private Repository $repo,private ?StoreProviders $storeProviders=null) {}
    private function record(string $id,bool $lock=false): array {
        $q=$this->db->prepare('SELECT payload FROM '.Database::table('records')." WHERE kind='app' AND id=?".($lock?' FOR UPDATE':''));$q->execute([$id]);$raw=$q->fetchColumn();
        if (!$raw) throw new ApiException('Uygulama bulunamadı.'); return json_decode($raw,true,64,JSON_THROW_ON_ERROR);
    }
    private function patch(array $a): array { return ['storeMetrics'=>$a['storeMetrics']??[],'storeIds'=>$a['storeIds']??[],'storeLinks'=>$a['storeLinks']??(object)[]]; }
    private function put(array $c): array {
        return $this->repo->transaction(function() use ($c) {
        $t=Database::table('source_refresh');
        $pending=$this->db->prepare("SELECT COUNT(*) FROM $t WHERE JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status'))='pending' AND id<>?");$pending->execute([$c['id']]);if($c['status']==='pending'&&(int)$pending->fetchColumn()>=1000)throw new ApiException('Review existing source candidates before adding more; the pending limit is 1000.',429);
        $this->db->prepare("INSERT INTO $t (id,payload) VALUES (?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)")->execute([$c['id'],json_encode($c,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)]);
        $this->db->exec("DELETE FROM $t WHERE JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status'))<>'pending' AND sequence NOT IN (SELECT sequence FROM (SELECT sequence FROM $t WHERE JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status'))<>'pending' ORDER BY sequence DESC LIMIT 500) AS retained)");return $c;
        });
    }
    public function state(?string $appId=null): array {
        $candidates=array_map(fn($r)=>json_decode($r['payload'],true,64,JSON_THROW_ON_ERROR),$this->db->query('SELECT payload FROM '.Database::table('source_refresh').' ORDER BY sequence DESC')->fetchAll(PDO::FETCH_ASSOC));$freshness=[];
        if($appId!==null)Validation::check((bool)preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$appId),'Geçersiz uygulama kimliği.');
        $records=$appId===null?$this->repo->getAdminSnapshot()['records']:[$this->record($appId)];
        foreach($records as $r) {
            if ($r['kind']!=='app')continue; $a=$r['data'];$fields=[];
            foreach(['storeMetrics','storeIds','facts','plans'] as $group) foreach($a[$group]??[] as $f){
                $field=match($group){'storeMetrics','storeIds'=>$group.'.'.$f['platform'].'.'.$f['country'],'facts'=>'facts.'.$f['platform'].'.'.$f['key'],default=>'plans.'.$f['id']};
                $date=$f[$group==='storeMetrics'?'observedAt':'checkedAt']??null;$time=is_string($date)?strtotime($date):false;
                $fields[]=['field'=>$field,'checkedAt'=>$date,'state'=>$time===false?'unknown':(time()-$time>90*86400?'stale':'fresh')];
            }
            foreach($a['platforms']??[] as $platform) if(!array_filter($a['storeMetrics']??[],fn($m)=>$m['platform']===$platform))$fields[]=['field'=>'storeMetrics.'.$platform,'checkedAt'=>null,'state'=>'unknown'];
            $freshness[]=['appId'=>$r['id'],'name'=>$a['name'],'fields'=>$fields];
        }
        return ['candidates'=>$candidates,'freshness'=>$freshness,'providers'=>['ios'=>'apple-lookup','android'=>'google-play-public','windows'=>'microsoft-store-public'],'jobs'=>(new SourceWorker($this->db,$this->repo))->jobs()];
    }
    public function fetch(string $appId,string $country,string $platform='ios',?string $providerId=null,bool $throwErrors=false,?string $jobId=null): array {
        $candidateId=$jobId===null?null:substr(hash('sha256','source-job:'.$jobId),0,32);if($candidateId!==null){$query=$this->db->prepare('SELECT payload FROM ws_source_refresh WHERE id=?');$query->execute([$candidateId]);$existing=$query->fetchColumn();if($existing!==false)return json_decode($existing,true,64,JSON_THROW_ON_ERROR);}
        $r=$this->record($appId);$country=AppleProvider::country($country);$id=StoreProviders::identity($r['data'],$platform,$country);$providerId=$providerId??(['ios'=>'apple-lookup','android'=>'google-play-public','windows'=>'microsoft-store-public'][$platform]??'');
        try{$observation=($this->storeProviders??new StoreProviders($this->db,$this->repo))->fetch($providerId,$platform,$id,$country);return$this->candidate($r,$observation,$candidateId);}
        catch(\Throwable $error){if($throwErrors)throw$error;$now=Repository::now();return$this->put(['id'=>bin2hex(random_bytes(16)),'appId'=>$appId,'baseRevision'=>$r['revision'],'status'=>'error','source'=>StoreProviders::storeLink($platform,$id,$country),'createdAt'=>$now,'updatedAt'=>$now,'before'=>$this->patch($r['data']),'after'=>$this->patch($r['data']),'diff'=>[],'error'=>$error instanceof ApiException?$error->getMessage():'Source provider could not be read.']);}
    }
    public function manual(array $input):array {
        Validation::check(!array_diff(array_keys($input),['action','appId','platform','country','storeId','storeLink','sourceUrl','observedAt','rating','ratingCount','downloadsLowerBound'])&&is_string($input['appId']??null)&&is_string($input['platform']??null)&&is_string($input['country']??null)&&is_string($input['storeId']??null),'Invalid manual observation.');
        $record=$this->record($input['appId']);$country=AppleProvider::country($input['country']);Validation::check(in_array($input['platform'],$record['data']['platforms'],true),'Application platform mismatch.');$observation=array_intersect_key($input,array_flip(['platform','country','storeId','storeLink','sourceUrl','observedAt','rating','ratingCount','downloadsLowerBound']));$observation['country']=$country;$observation['schemaVersion']=1;$observation=StoreProviders::observation($observation,$input['platform'],$input['storeId'],$country);$observation['provenance']=['providerId'=>'manual','method'=>'manual-review','checkedAt'=>Repository::now()];return$this->candidate($record,$observation);
    }
    private function candidate(array $record,array $observation,?string $candidateId=null):array {
        $app=$record['data'];$platform=$observation['platform'];$country=$observation['country'];$keep=fn($row)=>!($row['platform']===$platform&&$row['country']===$country);$now=Repository::now();
        $after=['storeLinks'=>array_replace($app['storeLinks']??[],[$platform=>$observation['storeLink']]),'storeIds'=>[...array_values(array_filter($app['storeIds']??[],$keep)),['platform'=>$platform,'storeId'=>$observation['storeId'],'country'=>$country,'sourceUrl'=>$observation['storeLink'],'checkedAt'=>$observation['observedAt']]],'storeMetrics'=>[...array_values(array_filter($app['storeMetrics']??[],$keep)),['platform'=>$platform,'country'=>$country,'downloadsLowerBound'=>$observation['downloadsLowerBound'],'rating'=>$observation['rating'],'ratingCount'=>$observation['ratingCount'],'sourceUrl'=>$observation['sourceUrl'],'observedAt'=>$observation['observedAt']]]];
        Validation::data('app',array_replace($app,$after));$before=$this->patch($app);$diff=[];foreach($after as $key=>$value)if($before[$key]!==$value)$diff[]=$key;
        return$this->put(['id'=>$candidateId??bin2hex(random_bytes(16)),'appId'=>$record['id'],'baseRevision'=>$record['revision'],'status'=>'pending','source'=>$observation['sourceUrl'],'createdAt'=>$now,'updatedAt'=>$now,'before'=>$before,'after'=>$after,'diff'=>$diff,'provenance'=>$observation['provenance']??[],'cached'=>($observation['cached']??false)===true]);
    }
    public function review(string $id,string $action): array {
        return $this->repo->transaction(function()use($id,$action){
            $q=$this->db->prepare('SELECT payload FROM '.Database::table('source_refresh').' WHERE id=? FOR UPDATE');$q->execute([$id]);$raw=$q->fetchColumn();if(!$raw)throw new ApiException('Aday bulunamadı.');$c=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
            if($c['status']!=='pending')throw new ApiException('Yalnız bekleyen aday incelenebilir.');
            if($action==='apply'){$r=$this->record($c['appId'],true);if($r['revision']!==$c['baseRevision'])throw new ApiException('Kayıt değişti; yeni kaynak adayı alın.',409);foreach(['storeMetrics','storeIds','storeLinks']as $key)$r['data'][$key]=$c['after'][$key];$this->repo->saveRecord($r);$c['status']='applied';}
            elseif($action==='dismiss')$c['status']='dismissed';else throw new ApiException('Geçersiz işlem.');
            $c['updatedAt']=gmdate('Y-m-d\TH:i:s\Z');return $this->put($c);
        });
    }
}
