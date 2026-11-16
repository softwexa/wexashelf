<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;

/** Bounded public reads. The projection contains searchable text, never private drafts. */
final class CatalogQuery {
    public const PAGE_SIZE=24;
    public function __construct(private PDO $db,private Repository $repo){}
    public static function migrate(PDO $db):void {
        if($db->inTransaction())return;
        $db->exec("CREATE TABLE IF NOT EXISTS ws_catalog_index (kind VARCHAR(20) NOT NULL,id VARCHAR(160) NOT NULL,locale VARCHAR(24) NOT NULL,slug VARCHAR(160) NOT NULL,available_at BIGINT NOT NULL,category VARCHAR(40) NOT NULL,platforms SMALLINT NOT NULL,pricing VARCHAR(24) NOT NULL,downloads BIGINT NULL,checked_at VARCHAR(40) NOT NULL,name VARCHAR(500) NOT NULL,search_text MEDIUMTEXT NOT NULL,tags TEXT NOT NULL,publisher VARCHAR(255) NOT NULL,publisher_slug VARCHAR(160) NOT NULL,KEY catalog_publisher(locale,kind,publisher_slug),PRIMARY KEY(kind,id,locale),KEY catalog_page(locale,kind,category,available_at,id),KEY catalog_slug(locale,kind,slug),KEY catalog_price(locale,kind,pricing),KEY catalog_name(locale,kind,name(100)),KEY catalog_fresh(locale,kind,checked_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        if(!$db->query("SHOW COLUMNS FROM ws_catalog_index LIKE 'publisher_slug'")->fetch())$db->exec("ALTER TABLE ws_catalog_index ADD publisher_slug VARCHAR(160) NOT NULL DEFAULT '', ADD KEY catalog_publisher(locale,kind,publisher_slug)");
    }
    private function query(string $sql,array $args=[]):\PDOStatement{$q=$this->db->prepare($sql);$q->execute($args);return$q;}
    public static function normalize(string $text):string {
        $text=mb_strtolower(strtr($text,['İ'=>'i','I'=>'i','ı'=>'i']),'UTF-8');
        return trim(strtr($text,['ç'=>'c','ğ'=>'g','ö'=>'o','ş'=>'s','ü'=>'u','á'=>'a','à'=>'a','â'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','ë'=>'e','í'=>'i','î'=>'i','ï'=>'i','ñ'=>'n','ó'=>'o','ô'=>'o','ú'=>'u','û'=>'u']));
    }
    private static function at(array $row):?int{return match($row['status']??''){'published'=>0,'scheduled'=>!empty($row['publishAt'])?strtotime($row['publishAt'])?:null:null,default=>null};}
    public function refreshRecord(string $kind,string $id):void {
        $this->query('DELETE FROM ws_catalog_index WHERE kind=? AND id=?',[$kind,$id]);$r=$this->repo->record($kind,$id);if(!$r)return;
        $at=self::at($r);if($at===null)return;
        if($kind==='app'&&!Admission::evaluate($r['data'],$this->repo->getAdmissionRules(),$r['admissionException']??'')['accepted'])return;
        $this->put($r,$r['data'],$r['sourceLocale']??'tr',$id,$at);
        $q=$this->query('SELECT payload FROM ws_translations WHERE kind=? AND base_id=?',[$kind,$id]);
        while($row=$q->fetch()){$t=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);$when=self::at($t);if($when===null||$t['locale']===($r['sourceLocale']??'tr')||!is_array($t['translatedData']??null))continue;$this->put($r,$t['translatedData'],$t['locale'],$t['slug'],max($at,$when));}
    }
    private function put(array $record,array $d,string $locale,string $slug,int $at):void {
        $mask=0;foreach($d['platforms']??[] as$p)$mask|=['android'=>1,'ios'=>2,'windows'=>4][$p]??0;
        $metrics=array_filter($d['storeMetrics']??[],fn($m)=>$m['platform']==='android'&&$m['country']==='TR'&&$m['downloadsLowerBound']!==null&&!empty($m['sourceUrl'])&&!empty($m['observedAt']));usort($metrics,fn($a,$b)=>strcmp($b['observedAt'],$a['observedAt']));
        $name=$d['name']??$d['title']??'';$text=implode(' ',[$name,$d['tagline']??'',$d['description']??$d['summary']??'',$d['publisher']??'',implode(' ',$d['aliases']??[]),implode(' ',$d['tags']??[]),$d['category']??'']);
        $this->query('INSERT INTO ws_catalog_index(kind,id,locale,slug,available_at,category,platforms,pricing,downloads,checked_at,name,search_text,tags,publisher,publisher_slug) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[$record['kind'],$record['id'],$locale,$slug,$at,$d['category']??'',$mask,$d['pricingModel']??'unknown',$metrics[0]['downloadsLowerBound']??null,$d['checkedAt']??$record['updatedAt'],self::normalize($name),self::normalize($text),json_encode(array_map([self::class,'normalize'],$d['tags']??[]),JSON_THROW_ON_ERROR),$d['publisher']??'',PublicSite::publisherSlug($d['publisher']??'')]);
    }
    /** Rebuild in bounded batches under the same write lock used by editor changes. */
    public function rebuild():int {
        return$this->repo->transaction(function(){ $this->db->exec('DELETE FROM ws_catalog_index');$lastKind='';$lastId='';$count=0;do{$batch=$this->query('SELECT kind,id FROM ws_records WHERE kind>? OR (kind=? AND id>?) ORDER BY kind,id LIMIT 100',[$lastKind,$lastKind,$lastId])->fetchAll();foreach($batch as$r){$this->refreshRecord($r['kind'],$r['id']);$lastKind=$r['kind'];$lastId=$r['id'];$count++;}}while(count($batch)===100);$this->repo->setSetting('catalog-index-version',1);return$count;},true);
    }
    private static function scalar(array $q,string $key,string $default=''):string{if(!isset($q[$key]))return$default;if(!is_scalar($q[$key]))throw new ApiException('Invalid catalog query.');return(string)$q[$key];}
    /** All parameters are bound; client page sizes and offsets are bounded. */
    public function search(array $input,string $locale,string $kind='app'):array {
        Validation::check(in_array($kind,['app','article','list'],true),'Invalid catalog kind.');$w=['locale=?','kind=?','available_at<=?'];$args=[$locale,$kind,time()];
        $q=mb_substr(self::scalar($input,'q'),0,200,'UTF-8');$terms=preg_split('/\s+/u',self::normalize($q),-1,PREG_SPLIT_NO_EMPTY);Validation::check(count($terms)<=20,'Invalid catalog query.');$categoryLabels=Localization::content($locale)['categories']??[];foreach($terms as$term){$termArgs=['%'.str_replace(['!','%','_'],['!!','!%','!_'],$term).'%'];$clauses=["search_text LIKE ? ESCAPE '!'"];$categories=[];foreach($categoryLabels as$category)if($category['id']!=='all'&&str_contains(self::normalize($category['label']),$term))$categories[]=$category['id'];if($categories){$clauses[]='category IN ('.implode(',',array_fill(0,count($categories),'?')).')';array_push($termArgs,...$categories);}$w[]='('.implode(' OR ',$clauses).')';array_push($args,...$termArgs);}
        foreach(['category','pricing']as$key){$value=self::scalar($input,$key,'all');if($value!==''&&$value!=='all'){$w[]=$key.'=?';$args[]=$value;}}
        $exclude=self::scalar($input,'exclude');if($exclude!==''){$w[]="pricing<>? AND pricing<>'unknown'";$args[]=$exclude;}
        $tag=self::scalar($input,'tag');if($tag!==''){$values=array_values(array_unique(array_map([self::class,'normalize'],Localization::tagValues($locale,$tag))));$w[]='('.implode(' OR ',array_fill(0,count($values),'JSON_CONTAINS(tags,?)')).')';foreach($values as$value)$args[]=json_encode($value,JSON_THROW_ON_ERROR);}
        $mask=0;foreach(explode(',',self::scalar($input,'platform'))as$p)$mask|=['android'=>1,'ios'=>2,'windows'=>4][$p]??0;if($mask){$w[]=self::scalar($input,'mode')==='all'?'(platforms & ?) = ?':'(platforms & ?) <> 0';$args[]=$mask;if(self::scalar($input,'mode')==='all')$args[]=$mask;}
        $minimum=filter_var(self::scalar($input,'downloads','0'),FILTER_VALIDATE_INT);if($minimum!==false&&$minimum>0){$w[]=self::scalar($input,'unknown')==='1'?'(downloads>=? OR downloads IS NULL)':'downloads>=?';$args[]=$minimum;}
        if(isset($input['ids'])){$ids=array_values(array_unique(array_filter(explode(',',self::scalar($input,'ids')),fn($v)=>preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$v))));Validation::check(count($ids)<=100,'At most 100 app IDs per request.');if(!$ids)$w[]='1=0';else{$w[]='id IN ('.implode(',',array_fill(0,count($ids),'?')).')';array_push($args,...$ids);}}
        if(isset($input['slug'])){$w[]='slug=?';$args[]=self::scalar($input,'slug');}
        if(isset($input['publisherSlug'])){$w[]='publisher_slug=?';$args[]=self::scalar($input,'publisherSlug');}
        if(isset($input['publisher'])){$w[]='publisher=?';$args[]=self::scalar($input,'publisher');}
        $where=implode(' AND ',$w);$total=(int)$this->query('SELECT COUNT(*) FROM ws_catalog_index WHERE '.$where,$args)->fetchColumn();
        $size=max(1,min(100,(int)self::scalar($input,'limit',(string)self::PAGE_SIZE)));$pages=max(1,(int)ceil($total/$size));$page=max(1,min($pages,(int)self::scalar($input,'page','1')));$offset=($page-1)*$size;
        $sort=self::scalar($input,'sort');$order=$sort==='freshness'?'checked_at DESC,name,id':($sort==='name'?'name,id':($q!==''?'(name=?) DESC,id':'id'));if($q!==''&&$sort!=='freshness'&&$sort!=='name')$args[]=self::normalize($q);
        $rows=$this->query('SELECT kind,id,slug FROM ws_catalog_index WHERE '.$where.' ORDER BY '.$order.' LIMIT '.$size.' OFFSET '.$offset,$args)->fetchAll();
        return ['items'=>$rows,'total'=>$total,'page'=>$page,'pageSize'=>$size,'pages'=>$pages,'hasMore'=>$page<$pages];
    }
    /** Publication date is editorial data, not an ID, update time, or install order. */
    public function latestArticles(string $locale,int $limit=6):array {
        $limit=max(1,min(12,$limit));
        // Normalize ISO offsets explicitly; database/session time zones cannot change order.
        $date="CASE WHEN COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.sourceLocale')),'tr')=i.locale THEN JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.data.publishedAt')) ELSE JSON_UNQUOTE(JSON_EXTRACT(t.payload,'$.translatedData.publishedAt')) END";
        $rows="SELECT i.kind,i.id,i.slug,".$date." AS publication FROM ws_catalog_index i JOIN ws_records r ON r.kind=i.kind AND r.id=i.id LEFT JOIN ws_translations t ON t.kind=i.kind AND t.base_id=i.id AND t.locale=i.locale WHERE i.locale=? AND i.kind='article' AND i.available_at<=?";
        return $this->query("SELECT kind,id,slug FROM (".$rows.") AS articles ORDER BY CONVERT_TZ(CAST(REPLACE(REGEXP_REPLACE(publication,'(Z|[+-][0-9]{2}:[0-9]{2})$',''),'T',' ') AS DATETIME(6)),CASE WHEN RIGHT(publication,6) REGEXP '^[+-][0-9]{2}:[0-9]{2}$' THEN RIGHT(publication,6) ELSE '+00:00' END,'+00:00') DESC,id LIMIT ".$limit,[$locale,time()])->fetchAll();
    }
    public function response(array $input,array $config):array {
        $locale=self::scalar($input,'locale',$config['localization']['defaultLocale']??'en');Validation::check(Localization::enabled($config,$locale),'This language is not enabled.');$kind=self::scalar($input,'kind','app');$result=$this->search($input,$locale,$kind);$catalog=$this->repo->getPublicSnapshot($result['items']);$localized=Localization::localizedCatalog($catalog,$locale);$key=['app'=>'apps','article'=>'articles','list'=>'lists'][$kind];$by=array_column($localized[$key],null,'id');$items=[];foreach($result['items']as$row)if(isset($by[$row['id']]))$items[]=$by[$row['id']];
        return array_replace($result,['items'=>$items,'localizedPaths'=>Localization::paths($catalog,$locale),'capabilities'=>$catalog['capabilities'],'storeObservations'=>$catalog['storeObservations']]);
    }
    public function publishers(string $locale,array $input):array{
        $where="locale=? AND kind='app' AND available_at<=? AND publisher<>''";$args=[$locale,time()];$term=self::scalar($input,'q');if($term!==''){$where.=" AND publisher LIKE ? ESCAPE '!'";$args[]='%'.str_replace(['!','%','_'],['!!','!%','!_'],mb_substr($term,0,200)).'%';}
        $total=(int)$this->query('SELECT COUNT(*) FROM (SELECT publisher_slug FROM ws_catalog_index WHERE '.$where.' GROUP BY publisher_slug) AS publishers',$args)->fetchColumn();$pages=max(1,(int)ceil($total/self::PAGE_SIZE));$page=max(1,min($pages,(int)self::scalar($input,'page','1')));$rows=$this->query('SELECT publisher_slug AS slug,MIN(publisher) AS name,COUNT(*) AS appCount,BIT_OR(platforms) AS platformsMask FROM ws_catalog_index WHERE '.$where.' GROUP BY publisher_slug ORDER BY name,slug LIMIT '.self::PAGE_SIZE.' OFFSET '.(($page-1)*self::PAGE_SIZE),$args)->fetchAll();foreach($rows as&$row){$row['appCount']=(int)$row['appCount'];$row['platforms']=[];foreach(['android'=>1,'ios'=>2,'windows'=>4]as$key=>$mask)if((int)$row['platformsMask']&$mask)$row['platforms'][]=$key;unset($row['platformsMask']);}return ['items'=>$rows,'total'=>$total,'page'=>$page,'pages'=>$pages,'pageSize'=>self::PAGE_SIZE];
    }
    public function sitemapSelection(int $page):array{return $this->query('SELECT DISTINCT kind,id FROM ws_catalog_index WHERE available_at<=? ORDER BY kind,id LIMIT 200 OFFSET '.(max(0,$page-1)*200),[time()])->fetchAll();}
    public function sitemapPages():int{return max(1,(int)ceil((int)$this->query('SELECT COUNT(*) FROM (SELECT kind,id FROM ws_catalog_index WHERE available_at<=? GROUP BY kind,id) AS published_records',[time()])->fetchColumn()/200));}
    public function mediaSelection(string $id,string $format='png'):array {
        $identity=json_encode(['assetId'=>$id,'format'=>$format],JSON_THROW_ON_ERROR);$icon='/media/'.$id.'.'.$format;$token='%[image id="'.$id.'"]%';
        $locales=array_column(array_filter((new Translations($this->db,$this->repo))->settings()['locales'],fn($l)=>$l['enabled']&&Localization::complete($l['code'])),'code');if(!$locales)return[];$in=implode(',',array_fill(0,count($locales),'?'));
        $reference=static function(string $column,string $data,string $kind):string{return "((".$kind."='app' AND (JSON_UNQUOTE(JSON_EXTRACT(".$column.",'".$data.".icon'))=? OR JSON_CONTAINS(JSON_EXTRACT(".$column.",'".$data.".screenshots'),?))) OR (".$kind."='article' AND ((?='png' AND JSON_UNQUOTE(JSON_EXTRACT(".$column.",'".$data.".cover.assetId'))=?) OR (JSON_CONTAINS(JSON_EXTRACT(".$column.",'".$data.".images'),?) AND JSON_SEARCH(JSON_EXTRACT(".$column.",'".$data.".sections[*].paragraphs[*]'),'one',?) IS NOT NULL))))";};
        $source=$reference('r.payload','$.data','r.kind');$translated=$reference('t.payload','$.translatedData','t.kind');
        $sql="SELECT r.kind,r.id FROM ws_records r WHERE r.kind IN ('app','article') AND EXISTS (SELECT 1 FROM ws_catalog_index i WHERE i.kind=r.kind AND i.id=r.id AND i.available_at<=? AND i.locale IN (".$in.")) AND ((COALESCE(JSON_UNQUOTE(JSON_EXTRACT(r.payload,'$.sourceLocale')),'tr') IN (".$in.") AND ".$source.") OR EXISTS (SELECT 1 FROM ws_translations t JOIN ws_catalog_index ti ON ti.kind=t.kind AND ti.id=t.base_id AND ti.locale=t.locale WHERE t.kind=r.kind AND t.base_id=r.id AND ti.available_at<=? AND ti.locale IN (".$in.") AND ".$translated.")) LIMIT 100";
        return $this->query($sql,[time(),...$locales,...$locales,$icon,$identity,$format,$id,$identity,$token,time(),...$locales,$icon,$identity,$format,$id,$identity,$token])->fetchAll();
    }
    /** Select the initial route and its referenced records without downloading the catalog. */
    public function forPage(string $path,array $query,array $extraAppIds=[]):array {
        $route=Localization::route($path);$locale=$route['locale']??'tr';$parts=$route['parts']??[];$name=$parts[0]??'';$input=$query;
        if($name==='yayinci')$input['publisherSlug']=$parts[1]??'';
        if($name==='kategori')$input['category']=$parts[1]??'';if($name==='etiket')$input['tag']=$parts[1]??'';
        $selection=[];$add=static function(array $rows)use(&$selection){foreach($rows as$r)$selection[$r['kind'].':'.$r['id']]=$r;};
        $result=$this->search($input,$locale);$add($result['items']);
        foreach(['article','list']as$kind){$editorial=$this->search($name===($kind==='article'?'blog':'listeler')&&!isset($parts[1])?$query:['limit'=>12],$locale,$kind);$add($editorial['items']);if($name===($kind==='article'?'blog':'listeler')&&!isset($parts[1]))$result=$editorial;}
        if(isset($parts[1])&&in_array($name,['uygulama','blog','liste'],true))$add($this->search(['slug'=>$parts[1]],$locale,['uygulama'=>'app','blog'=>'article','liste'=>'list'][$name])['items']);
        $requirements=$name===''?(new Extensions($this->repo))->requirements():['appIds'=>[],'latestArticleLimit'=>0];if($name==='')$add($this->latestArticles($locale,max(1,(int)$requirements['latestArticleLimit'])));$ids=array_merge($extraAppIds,$requirements['appIds']);foreach($selection as$row){if($row['kind']==='app')continue;$r=$this->repo->record($row['kind'],$row['id']);if(!$r)continue;$data=$r['data'];if(($r['sourceLocale']??'tr')!==$locale){$t=$this->query('SELECT payload FROM ws_translations WHERE kind=? AND base_id=? AND locale=?',[$row['kind'],$row['id'],$locale])->fetchColumn();if($t!==false)$data=json_decode($t,true,512,JSON_THROW_ON_ERROR)['translatedData']??$data;}array_push($ids,...($row['kind']==='article'?ArticleContent::appIds($data):array_column($data['entries'],'appId')));}
        foreach(['apps','compare']as$key)if(isset($query[$key])&&is_string($query[$key]))array_push($ids,...explode(',',$query[$key]));
        $static=Localization::content($locale);foreach(array_merge($static['guides']??[],$static['workflows']??[])as$item)array_push($ids,...($item['appIds']??array_column($item['steps']??[],'appId')));
        foreach(array_chunk(array_values(array_unique($ids)),100)as$batch)$add($this->search(['ids'=>implode(',',$batch),'limit'=>100],$locale)['items']);
        $catalog=$this->repo->getPublicSnapshot(array_values($selection));$catalog['pagination']=$result;$catalog['serverCatalog']=true;if($name==='yayincilar'){$directory=$this->publishers($locale,$query);$catalog['publisherDirectory']=$directory['items'];$catalog['publisherQuery']=self::scalar($query,'q');$catalog['pagination']=$directory;}return$catalog;
    }
}
