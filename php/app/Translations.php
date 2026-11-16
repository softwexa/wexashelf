<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;

/** Translation overlays never replace canonical identities, metrics or evidence. */
final class Translations {
    public function __construct(private PDO $db, private Repository $repo) {}
    public static function migrate(PDO $db): void {
        if($db->inTransaction())return; // DDL must never implicitly commit an editorial transaction.
        foreach (['translations'=>'kind VARCHAR(20) NOT NULL,base_id VARCHAR(160) NOT NULL,locale VARCHAR(24) NOT NULL,slug VARCHAR(160) NOT NULL,revision INT NOT NULL,payload LONGTEXT NOT NULL,PRIMARY KEY(kind,base_id,locale),UNIQUE KEY localized_slug(locale,kind,slug)', 'translation_revisions'=>'kind VARCHAR(20) NOT NULL,base_id VARCHAR(160) NOT NULL,locale VARCHAR(24) NOT NULL,revision INT NOT NULL,payload LONGTEXT NOT NULL,PRIMARY KEY(kind,base_id,locale,revision)'] as $name=>$ddl) $db->exec('CREATE TABLE IF NOT EXISTS '.Database::table($name).' ('.$ddl.') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');
    }
    private function query(string $sql,array $args=[]): \PDOStatement { $q=$this->db->prepare($sql);$q->execute($args);return $q; }
    private static function json(mixed $v): string {return json_encode($v,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);}
    public static function fingerprint(array $data): string {return hash('sha256',self::json($data));}
    public static function supportedLocales(): array {return array_keys(Localization::packs());}
    public static function sourceLocale(array $record): string {return is_string($record['sourceLocale']??null)?$record['sourceLocale']:'tr';}
    public static function defaults(): array {return ['revision'=>0,'defaultLocale'=>'en','sourceLocale'=>'en','homeSeo'=>[],'locales'=>[['code'=>'tr','label'=>'Türkçe','enabled'=>true],['code'=>'en','label'=>'English','enabled'=>true]]];}
    public static function validateSettings(mixed $v,bool $requireInstalled=true): array {
        Validation::check(is_array($v)&&!array_diff(array_keys($v),['revision','defaultLocale','sourceLocale','locales','homeSeo'])&&is_string($v['defaultLocale']??null)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$v['defaultLocale'])&&is_string($v['sourceLocale']??'tr')&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$v['sourceLocale']??'tr')&&is_int($v['revision']??null)&&$v['revision']>=0&&$v['revision']<2147483647,'Geçersiz dil ayarları.');
        $seen=[];foreach(Validation::items($v['locales']??null,'locales',24) as $l){
            Validation::check(is_array($l)&&!array_diff(array_keys($l),['code','label','enabled'])&&is_string($l['code']??null)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$l['code'])&&!isset($seen[$l['code']])&&is_bool($l['enabled']??null),'Geçersiz veya yinelenen dil.');
            Validation::str($l['label']??null,'Dil adı',80);Validation::check(trim($l['label'])!=='','Dil adı gerekli.');
            Validation::check(!$requireInstalled||!$l['enabled']||in_array($l['code'],self::supportedLocales(),true),'Bu dil için tamamlanmış arayüz paketi gerekli. Çeviri taslakları hazırlanabilir.');$seen[$l['code']]=$l['enabled'];
        }
        $v['homeSeo']=$v['homeSeo']??[];Validation::check(is_array($v['homeSeo'])&&!array_diff(array_keys($v['homeSeo']),array_keys($seen)),'Invalid homepage metadata language.');foreach($v['homeSeo'] as $meta){Validation::check(is_array($meta)&&!array_diff(array_keys($meta),['title','description']),'Invalid homepage metadata.');foreach(['title'=>160,'description'=>500] as $key=>$limit){Validation::str($meta[$key]??'',$key,$limit*4);Validation::check(mb_strlen($meta[$key]??'','UTF-8')<=$limit,'Homepage metadata is too long.');}}
        $v['sourceLocale']=$v['sourceLocale']??'tr';Validation::check(($seen['tr']??false)===true,'Mevcut Türkçe adresleri etkin kalmalı.');Validation::check(($seen[$v['defaultLocale']]??false)===true&&($seen[$v['sourceLocale']]??false)===true,'Default visitor and new-content languages must be enabled.');return $v;
    }
    public function settings(): array {return self::validateSettings($this->repo->setting('localization',self::defaults()),false);}
    public function saveSettings(array $v): array {
        $v=self::validateSettings($v);return $this->repo->transaction(function()use($v){if($v['revision']!==$this->settings()['revision'])throw new ApiException('Dil ayarları değişti. Yeniden yükleyin.',409);$previous=$this->settings();$enabled=array_column($v['locales'],'enabled','code');foreach($previous['locales'] as $locale)if($locale['enabled']&&empty($enabled[$locale['code']])&&in_array($locale['code'],LanguagePacks::managedLocales(),true))(new LanguagePacks($this->db,$this->repo))->assertUnused($locale['code'],$v);$v['revision']++;$this->repo->setSetting('localization',$v);$this->repo->audit('localization','settings','revision='.$v['revision']);return $v;});
    }
    public static function fieldMap(array $r): array {
        $d=$r['data'];$paths=[];$add=static function(string $path,mixed $value)use(&$paths):void{if(is_string($value)&&trim($value)!=='')$paths[]=['path'=>$path,'label'=>$path,'value'=>$value];};
        if($r['kind']==='app'){
            foreach($d['screenshots']??[]as$i=>$image)foreach(['alt','caption']as$key)$add("screenshots.$i.$key",$image[$key]??null);
            foreach(['name','tagline','description','pricingLabel'] as $key)$add($key,$d[$key]??null);
            foreach(['tags','aliases'] as $key)foreach($d[$key]??[] as $i=>$value)$add("$key.$i",$value);
            foreach($d['featureNotes']??[] as $i=>$row)foreach(['label','value'] as $key)$add("featureNotes.$i.$key",$row[$key]??null);
            foreach($d['facts']??[] as $i=>$row)$add("facts.$i.detail",$row['detail']??null);
            foreach($d['plans']??[] as $i=>$row){foreach(['name','note'] as $key)$add("plans.$i.$key",$row[$key]??null);foreach($row['limits']??[] as $j=>$limit)foreach(['label','value'] as $key)$add("plans.$i.limits.$j.$key",$limit[$key]??null);}
        }elseif($r['kind']==='article'){
            foreach(['title','summary'] as $key)$add($key,$d[$key]??null);
            foreach($d['sections'] as $i=>$row){$add("sections.$i.heading",$row['heading']);foreach($row['paragraphs'] as $j=>$p)$add("sections.$i.paragraphs.$j",$p);}
            foreach($d['sources'] as $i=>$row)$add("sources.$i.title",$row['title']);
            foreach(['alt','caption'] as $key)$add("cover.$key",$d['cover'][$key]??null);
            foreach($d['images']??[] as $i=>$image)foreach(['alt','caption']as$key)$add("images.$i.$key",$image[$key]??null);
        }else{
            foreach(['title','summary','method'] as $key)$add($key,$d[$key]??null);
            foreach($d['entries'] as $i=>$row)$add("entries.$i.reason",$row['reason']);
        }
        return $paths;
    }
    private static function overlay(array $r,array $t): array {
        $data=$r['data'];unset($data['seo']);$allowed=array_column(self::fieldMap($r),'path');
        foreach($t['fields'] as $path=>$value){if(!in_array($path,$allowed,true)||trim($value)==='')continue;$parts=explode('.',$path);$ref=&$data;foreach($parts as $part)$ref=&$ref[$part];if(preg_match('/^sections\.\d+\.paragraphs\.\d+$/D',$path)){$before=ArticleContent::references($ref);$after=ArticleContent::references($value);$key=fn($token)=>$token['type'].':'.$token['id'];$before=array_map($key,$before);$after=array_map($key,$after);sort($before);sort($after);Validation::check($before===$after,'Translation must preserve image and app shortcode identities.');}$ref=$value;unset($ref);}
        if($t['seo'])$data['seo']=$t['seo'];return $data;
    }
    private function rows(string $table='translations'): array {
        try{return array_map(fn($row)=>json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR),$this->query('SELECT payload FROM '.Database::table($table).' ORDER BY kind,base_id,locale,revision')->fetchAll());}
        catch(\PDOException $e){if(($e->errorInfo[1]??0)===1146)return [];throw $e;}
    }
    private function source(string $kind,string $id): array {$record=$this->repo->record($kind,$id);if($record)return $record;throw new ApiException('Kaynak kayıt bulunamadı.',404);}
    private function present(array $t,array $r): array {$t['stale']=!hash_equals($t['sourceFingerprint'],self::fingerprint($r['data']));$t['data']=$t['translatedData']??self::overlay($r,$t);unset($t['translatedData']);return $t;}
    public function state(array $input=[]): array {
        self::migrate($this->db);if(isset($input['id'])){Validation::check(is_string($input['id'])&&is_string($input['kind']??null),'Invalid source identity.');$record=$this->source($input['kind'],$input['id']);$page=['records'=>[$record],'pagination'=>['total'=>1,'page'=>1,'pages'=>1,'pageSize'=>100]];}else$page=$this->repo->getAdminSnapshot($input);$records=$page['records'];$by=[];$maps=[];$rows=[];
        foreach($records as$r){$key=$r['kind'].':'.$r['id'];$by[$key]=$r;$maps[$key]=self::fieldMap($r);}
        foreach(array_chunk($records,100)as$batch){$where=[];$args=[];foreach($batch as$r){$where[]='(kind=? AND base_id=?)';array_push($args,$r['kind'],$r['id']);}if($where)foreach($this->query('SELECT payload FROM ws_translations WHERE '.implode(' OR ',$where).' ORDER BY kind,base_id,locale',$args)->fetchAll()as$row){$t=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);$rows[]=$this->present($t,$by[$t['kind'].':'.$t['id']]);}}
        return ['supportedLocales'=>self::supportedLocales(),'settings'=>$this->settings(),'records'=>$records,'translations'=>$rows,'fieldMaps'=>$maps,'pagination'=>$page['pagination']];
    }
    private static function validateEnvelope(mixed $v): array {
        Validation::check(is_array($v)&&!array_diff(array_keys($v),['kind','id','locale','slug','revision','sourceRevision','sourceFingerprint','status','publishAt','seoApproved','updatedAt','fields','seo','reviewNote','stale','data','translatedData']),'Geçersiz çeviri alanları.');
        Validation::check(in_array($v['kind']??null,['app','article','list'],true)&&is_string($v['id']??null)&&preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$v['id']),'Geçersiz kaynak kimliği.');
        Validation::check(is_string($v['locale']??null)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$v['locale']),'Geçersiz çeviri dili.');
        Validation::check(is_string($v['slug']??null)&&mb_strlen($v['slug'],'UTF-8')<=120&&preg_match('/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/uD',$v['slug'])&&mb_strtolower($v['slug'],'UTF-8')===$v['slug'],'Geçersiz dil adresi.');
        foreach(['revision','sourceRevision'] as $key)Validation::check(is_int($v[$key]??null)&&$v[$key]>=0&&$v[$key]<2147483647,'Geçersiz çeviri revizyonu.');
        Validation::check(in_array($v['status']??null,['draft','published','scheduled','archived'],true)&&is_bool($v['seoApproved']??null),'Geçersiz çeviri yayın tercihi.');
        Validation::check(($v['publishAt']??null)===null||is_string($v['publishAt'])&&strtotime($v['publishAt'])!==false,'Geçersiz çeviri yayın zamanı.');
        if($v['status']==='scheduled')Validation::check(!empty($v['publishAt']),'Yayın zamanı gerekli.');
        Validation::check(is_array($v['fields']??null)&&count($v['fields'])<=2000,'Çeviri alanları gerekli.');foreach($v['fields'] as $key=>$value){Validation::check(is_string($key)&&preg_match('/^[a-zA-Z0-9.]+$/D',$key),'Geçersiz çeviri alan yolu.');Validation::str($value,$key);}
        $seo=$v['seo']??[];Validation::check(is_array($seo)&&!array_diff(array_keys($seo),['title','description','noindex']),'Geçersiz çeviri SEO alanları.');foreach(['title'=>160,'description'=>500] as $key=>$max)if(isset($seo[$key])){Validation::str($seo[$key],$key,$max*4);Validation::check(mb_strlen($seo[$key],'UTF-8')<=$max,'SEO metni çok uzun.');}if(isset($seo['noindex']))Validation::check(is_bool($seo['noindex']),'Geçersiz indeks tercihi.');
        Validation::str($v['reviewNote']??'','İnceleme notu',2000);
        return array_intersect_key(array_replace($v,['seo'=>$seo,'publishAt'=>$v['publishAt']??null,'reviewNote'=>$v['reviewNote']??'']),array_flip(['kind','id','locale','slug','revision','sourceRevision','sourceFingerprint','status','publishAt','seoApproved','updatedAt','fields','seo','reviewNote','translatedData']));
    }
    public function save(array $input): array {
        self::migrate($this->db);$v=self::validateEnvelope($input);
        return $this->repo->transaction(function()use($v){
            $r=$this->source($v['kind'],$v['id']);if($r['revision']!==$v['sourceRevision'])throw new ApiException('Kaynak içerik değişti. Son sürümü inceleyin.',409);
            Validation::check($v['locale']!==self::sourceLocale($r),'Choose a translation language different from this record\'s source language.');
            Validation::check(in_array($v['locale'],array_column($this->settings()['locales'],'code'),true),'Önce çeviri dilini dil ayarlarına ekleyin.');
            $sourceAtSlug=$this->repo->record($v['kind'],$v['slug']);if($sourceAtSlug&&self::sourceLocale($sourceAtSlug)===$v['locale'])throw new ApiException('This localized address belongs to source content.',409);
            $old=null;foreach($this->query('SELECT payload FROM ws_translations WHERE kind=? AND locale=? AND (base_id=? OR slug=?)',[$v['kind'],$v['locale'],$v['id'],$v['slug']])->fetchAll()as$raw){$row=json_decode($raw['payload'],true,512,JSON_THROW_ON_ERROR);if($row['id']===$v['id'])$old=$row;else throw new ApiException('Bu dil adresi başka kayda ait.',409);}
            if(($old['revision']??0)!==$v['revision'])throw new ApiException('Çeviri değişti. Güncel sürümü yükleyin.',409);
            $paths=array_column(self::fieldMap($r),'path');Validation::check(!array_diff(array_keys($v['fields']),$paths),'Kimlik, kaynak, fiyat veya bilinmeyen alan çevrilemez.');
            if(in_array($v['status'],['published','scheduled'],true))foreach($paths as $path)Validation::check(trim($v['fields'][$path]??'')!=='','Yayın için tüm metin alanlarını çevirin: '.$path);
            $v['revision']++;$v['sourceFingerprint']=self::fingerprint($r['data']);$v['updatedAt']=Repository::now();
            if(!$old||!hash_equals($old['sourceFingerprint'],$v['sourceFingerprint'])||$old['fields']!==$v['fields']||$old['seo']!==$v['seo']||$old['slug']!==$v['slug'])$v['seoApproved']=false;
            $v['translatedData']=self::overlay($r,$v);Validation::data($v['kind'],$v['translatedData']);$this->write($v);$this->repo->audit('translation-save',$v['kind'].':'.$v['id'].':'.$v['locale'],'revision='.$v['revision'].'; '.$v['status']);return $this->present($v,$r);
        });
    }
    private function write(array $v): void {
        $payload=self::json($v);
        $this->query('INSERT INTO ws_translations(kind,base_id,locale,slug,revision,payload) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE slug=VALUES(slug),revision=VALUES(revision),payload=VALUES(payload)',[$v['kind'],$v['id'],$v['locale'],$v['slug'],$v['revision'],$payload]);
        $this->query('INSERT INTO ws_translation_revisions(kind,base_id,locale,revision,payload) VALUES(?,?,?,?,?)',[$v['kind'],$v['id'],$v['locale'],$v['revision'],$payload]);
        if(class_exists(CatalogQuery::class))(new CatalogQuery($this->db,$this->repo))->refreshRecord($v['kind'],$v['id']);
    }
    public function history(string $kind,string $id,string $locale): array {return array_map(fn($r)=>json_decode($r['payload'],true,512,JSON_THROW_ON_ERROR),$this->query('SELECT payload FROM ws_translation_revisions WHERE kind=? AND base_id=? AND locale=? ORDER BY revision DESC',[$kind,$id,$locale])->fetchAll());}
    public function restore(string $kind,string $id,string $locale,int $revision): array {
        self::migrate($this->db);return $this->repo->transaction(function()use($kind,$id,$locale,$revision){$rows=$this->history($kind,$id,$locale);$old=null;foreach($rows as $r)if($r['revision']===$revision)$old=$r;Validation::check($old,'Çeviri revizyonu bulunamadı.');$source=$this->source($kind,$id);Validation::check($locale!==self::sourceLocale($source),'Translation target must differ from the record source language.');$old['revision']=$rows[0]['revision']+1;$old['status']='draft';$old['seoApproved']=false;$old['publishAt']=null;$old['updatedAt']=Repository::now();$old['reviewNote']="$revision numaralı çeviri geri yüklendi; kaynakla yeniden karşılaştırın.";$this->write($old);$this->repo->audit('translation-restore',"$kind:$id:$locale",(string)$revision);return $this->present($old,$source);});
    }
    public function publicRows(array $publicRecords): array {
        if(!$publicRecords)return [];$enabled=array_column(array_filter($this->settings()['locales'],fn($l)=>$l['enabled']),'code');$out=[];
        foreach(array_chunk($publicRecords,100) as $batch){$clauses=[];$args=[];foreach($batch as $record){$clauses[]='(kind=? AND id=?)';array_push($args,$record['kind'],$record['id']);}$sources=[];foreach($this->query('SELECT payload FROM ws_records WHERE '.implode(' OR ',$clauses),$args)->fetchAll() as $row){$record=json_decode($row['payload'],true,512,JSON_THROW_ON_ERROR);$sources[$record['kind'].':'.$record['id']]=$record;}
            try{$rows=$this->query('SELECT payload FROM ws_translations WHERE '.str_replace('id=?','base_id=?',implode(' OR ',$clauses)).' ORDER BY kind,base_id,locale',$args)->fetchAll();}catch(\PDOException $error){if(($error->errorInfo[1]??0)===1146)return [];throw $error;}
            foreach($rows as $raw){$t=json_decode($raw['payload'],true,512,JSON_THROW_ON_ERROR);$key=$t['kind'].':'.$t['id'];if(!isset($sources[$key])||$t['locale']===self::sourceLocale($sources[$key])||!in_array($t['locale'],$enabled,true)||!Localization::published($t))continue;$row=$this->present($t,$sources[$key]);unset($row['fields'],$row['reviewNote']);$out[]=$row;}
        }return $out;
    }
    public function backup(): array {return ['settings'=>$this->settings(),'translations'=>$this->rows(),'revisions'=>$this->rows('translation_revisions')];}
    public static function validateBackup(mixed $bundle,array $records): array {
        if($bundle===null)return ['settings'=>self::defaults(),'translations'=>[],'revisions'=>[]];
        Validation::check(is_array($bundle),'Geçersiz çeviri yedeği.');$settings=self::validateSettings($bundle['settings']??null);$sources=[];foreach($records as $r)$sources[$r['kind'].':'.$r['id']]=$r;
        $out=['settings'=>$settings];$current=[];$slugs=[];
        foreach(['translations'=>100000,'revisions'=>100000] as $table=>$max){$out[$table]=[];$seen=[];foreach(Validation::items($bundle[$table]??null,$table,$max) as $raw){$v=self::validateEnvelope($raw);$key=$v['kind'].':'.$v['id'].':'.$v['locale'];$versionKey=$key.($table==='revisions'?':'.$v['revision']:'');Validation::check(!isset($seen[$versionKey])&&$v['revision']>0&&is_string($v['sourceFingerprint']??null)&&preg_match('/^[a-f0-9]{64}$/D',$v['sourceFingerprint'])&&in_array($v['locale'],array_column($settings['locales'],'code'),true),'Geçersiz veya yinelenen çeviri yedeği.');Validation::date($v['updatedAt']??null);$seen[$versionKey]=true;
            Validation::data($v['kind'],$v['translatedData']??null);Validation::check($v['translatedData']['id']===$v['id'],'Çeviri kimliği kaynakla eşleşmiyor.');
            if($table==='translations'){Validation::check(isset($sources[$v['kind'].':'.$v['id']]),'Çeviri kaynağı eksik.');$slugKey=$v['locale'].':'.$v['kind'].':'.$v['slug'];Validation::check(!isset($slugs[$slugKey]),'Yinelenen çeviri adresi.');$slugs[$slugKey]=true;$current[$key]=$v['revision'];$source=$sources[$v['kind'].':'.$v['id']];Validation::check($v['locale']!==self::sourceLocale($source),'Translation target must differ from the record source language.');$collision=$sources[$v['kind'].':'.$v['slug']]??null;Validation::check(!$collision||self::sourceLocale($collision)!==$v['locale'],'Translation URL collides with original source content.');if(hash_equals($v['sourceFingerprint'],self::fingerprint($source['data']))){$paths=array_column(self::fieldMap($source),'path');Validation::check(!array_diff(array_keys($v['fields']),$paths),'Geçersiz çeviri alanları.');if(in_array($v['status'],['published','scheduled'],true))foreach($paths as $path)Validation::check(trim($v['fields'][$path]??'')!=='','Yayımlanmış çeviri eksik.');Validation::check($v['translatedData']===self::overlay($source,$v),'Çeviri görüntüsü kaynak alanlarıyla eşleşmiyor.');}}
            elseif(isset($current[$key]))Validation::check($v['revision']<=$current[$key],'Çeviri revizyonu güncel sürümden ileride.');$out[$table][]=$v;
        }}return $out;
    }
    public function restoreBackup(array $bundle): void {
        $settings=$bundle['settings'];$settings['revision']=$this->settings()['revision']+1;$this->repo->setSetting('localization',$settings);
        $this->db->exec('DELETE FROM ws_translations');$this->db->exec('DELETE FROM ws_translation_revisions');
        foreach($bundle['revisions'] as $v)$this->query('INSERT INTO ws_translation_revisions(kind,base_id,locale,revision,payload) VALUES(?,?,?,?,?)',[$v['kind'],$v['id'],$v['locale'],$v['revision'],self::json($v)]);
        foreach($bundle['translations'] as $v){$this->query('INSERT INTO ws_translations(kind,base_id,locale,slug,revision,payload) VALUES(?,?,?,?,?,?)',[$v['kind'],$v['id'],$v['locale'],$v['slug'],$v['revision'],self::json($v)]);$this->query('INSERT INTO ws_translation_revisions(kind,base_id,locale,revision,payload) VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE payload=VALUES(payload)',[$v['kind'],$v['id'],$v['locale'],$v['revision'],self::json($v)]);}
        if(class_exists(CatalogQuery::class))(new CatalogQuery($this->db,$this->repo))->rebuild();
    }
}
