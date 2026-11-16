<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;

final class Performance {
    public function __construct(private PDO $db,private Repository $repo){}
    public static function migrate(PDO $db):void{if(!$db->inTransaction())$db->exec('CREATE TABLE IF NOT EXISTS ws_vital_samples (id CHAR(64) PRIMARY KEY,day DATE NOT NULL,metric VARCHAR(8) NOT NULL,bucket VARCHAR(160) NOT NULL,value DOUBLE NOT NULL,INDEX day_bucket(day,bucket)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');}
    public function settings():array{return $this->repo->setting('performance-settings',['revision'=>0,'enabled'=>false,'sampleRate'=>0.1]);}
    public static function script(array $catalog,array $config,string $path):string {
        $settings=$catalog['performanceSettings']??[];if(empty($settings['enabled'])||(str_starts_with($path,'/yonetim')||str_starts_with($path,'/admin')))return '';
        $route=Localization::route($path);$kind=$route['parts'][0]??'';$pageType=match($kind){''=>'home','uygulama'=>'app','blog'=>count($route['parts'])>1?'article':'discovery','liste'=>'list','kesfet','kategori','kategoriler','etiket'=>'discovery',default=>'utility'};
        $data=['enabled'=>true,'sampleRate'=>$settings['sampleRate'],'endpoint'=>Config::basePath($config).'/api/vitals','locale'=>$route['locale']??Localization::locale($path),'pageType'=>$pageType,'theme'=>$catalog['siteSettings']['theme']['template']??'night'];
        return '<script id="wexa-performance" type="application/json">'.json_encode($data,JSON_THROW_ON_ERROR|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT).'</script><script defer src="'.htmlspecialchars(Config::basePath($config).'/assets/vitals.js',ENT_QUOTES).'"></script>';
    }
    public function configure(array $v):array{Validation::check(!array_diff(array_keys($v),['revision','enabled','sampleRate'])&&is_int($v['revision']??null)&&is_bool($v['enabled']??null)&&(is_int($v['sampleRate']??null)||is_float($v['sampleRate']??null))&&$v['sampleRate']>0&&$v['sampleRate']<=1,'Invalid performance settings.');self::migrate($this->db);return $this->repo->transaction(function()use($v){if($v['revision']!==$this->settings()['revision'])throw new ApiException('Performance settings changed.',409);$v['revision']++;$this->repo->setSetting('performance-settings',$v);$this->repo->audit('performance-settings','sampling',($v['enabled']?'enabled':'disabled').'; rate='.$v['sampleRate']);return $v;});}
    public function collect(array $v):array{
        if(!$this->settings()['enabled'])return ['accepted'=>false];Validation::check(!array_diff(array_keys($v),['id','metric','value','locale','pageType','device','theme']),'Unknown performance fields.');
        Validation::check(is_string($v['id']??null)&&preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$v['id'])&&in_array($v['metric']??null,['LCP','INP','CLS'],true),'Invalid performance sample.');Validation::check((is_int($v['value']??null)||is_float($v['value']??null))&&is_finite((float)$v['value'])&&$v['value']>=0&&$v['value']<=($v['metric']==='CLS'?100:120000),'Invalid performance measurement.');
        Validation::check(in_array($v['locale']??null,Translations::supportedLocales(),true)&&in_array($v['pageType']??null,['home','app','article','list','discovery','utility','editorial'],true)&&in_array($v['device']??null,['mobile','desktop'],true)&&in_array($v['theme']??null,['night','atlas','workflow','catalog'],true),'Invalid performance grouping.');
        $day=gmdate('Y-m-d');$bucket=implode(':',[$v['locale'],$v['pageType'],$v['device'],$v['theme']]);$q=$this->db->prepare('INSERT INTO ws_vital_samples(id,day,metric,bucket,value) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE value=GREATEST(value,VALUES(value))');$q->execute([hash('sha256',$day.':'.$v['metric'].':'.$v['id']),$day,$v['metric'],$bucket,$v['value']]);$this->db->exec('DELETE FROM ws_vital_samples WHERE day < DATE_SUB(UTC_DATE(), INTERVAL 30 DAY)');return ['accepted'=>true];
    }
    public function state():array{
        $groups=[];$total=0;try{$total=(int)$this->db->query('SELECT COUNT(*) FROM ws_vital_samples WHERE day >= DATE_SUB(UTC_DATE(), INTERVAL 27 DAY)')->fetchColumn();$q=$this->db->query('SELECT metric,bucket,value FROM ws_vital_samples WHERE day >= DATE_SUB(UTC_DATE(), INTERVAL 27 DAY) ORDER BY day DESC,id LIMIT 30000');foreach($q->fetchAll() as $row)$groups[$row['bucket']][$row['metric']][]=(float)$row['value'];}catch(\PDOException $e){if(($e->errorInfo[1]??0)!==1146)throw $e;}
        $rows=[];foreach($groups as $bucket=>$metrics){[$locale,$pageType,$device,$theme]=explode(':',$bucket);$row=compact('locale','pageType','device','theme');foreach($metrics as $metric=>$values){sort($values,SORT_NUMERIC);$p75=$values[max(0,(int)ceil(count($values)*0.75)-1)];$row[$metric]=['samples'=>count($values),'p75'=>$p75,'good'=>$p75<=['LCP'=>2500,'INP'=>200,'CLS'=>0.1][$metric]];}$rows[]=$row;}
        return ['settings'=>$this->settings(),'windowDays'=>28,'retentionDays'=>30,'sampleLimit'=>30000,'truncated'=>$total>30000,'rows'=>$rows,'source'=>'Site-owned sampled browser measurements; not Google CrUX or a Lighthouse score.'];
    }
}
