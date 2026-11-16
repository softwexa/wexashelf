<?php
declare(strict_types=1);
namespace WexaShelf;

/** URL locale is explicit; browser language never redirects or changes stored identifiers. */
final class Localization
{
    public const DEFAULT_LOCALE = 'en';
    public const SOURCE_LOCALE = 'tr';
    public const LOCALES = ['tr','en'];
    private const EN_ROUTES = [
        'kesfet'=>'apps','uygulama'=>'apps','kategoriler'=>'categories','kategori'=>'categories',
        'blog'=>'blog','listeler'=>'lists','liste'=>'lists','yayincilar'=>'publishers','yayinci'=>'publishers',
        'hakkimizda'=>'about','yontem'=>'methodology','gizlilik'=>'privacy','duzeltme-politikasi'=>'corrections',
        'rehberler'=>'guides','rehber'=>'guides','is-akislari'=>'workflows','is-akisi'=>'workflows','gecis-rehberleri'=>'migration-guides','ucretsiz-planlar'=>'free-plans','platform-farklari'=>'platform-differences','etiket'=>'tags',
        'submit-app'=>'submit-app','karsilastir'=>'compare','kaydedilenler'=>'saved','ayarlar'=>'settings','secim-sihirbazi'=>'finder','maliyet-hesapla'=>'cost',
    ];
    public static function builtinPacks(): array {
        $file=dirname(__DIR__).'/resources/locale-manifest.json';
        $rows=is_file($file)?json_decode((string)file_get_contents($file),true):[['code'=>'tr','label'=>'Türkçe','intlLocale'=>'tr-TR','direction'=>'ltr'],['code'=>'en','label'=>'English','intlLocale'=>'en-US','direction'=>'ltr']];
        $out=[];foreach(is_array($rows)?$rows:[] as $row)if(is_array($row)&&is_string($row['code']??null)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$row['code']))$out[$row['code']]=$row;return$out;
    }
    public static function packs(): array {
        $out=self::builtinPacks();foreach(LanguagePacks::runtimePackages() as $package){$ui=$package['ui'];$out[$package['locale']]=['code'=>$package['locale'],'label'=>$ui['label'],'intlLocale'=>$ui['intlLocale'],'direction'=>$ui['direction']];}return$out;
    }
    public static function server(string $locale): array {
        if(!isset(self::builtinPacks()[$locale]))return LanguagePacks::runtimePackage($locale)['server']??[];$file=dirname(__DIR__).'/resources/server.'.$locale.'.json';$data=is_file($file)?json_decode((string)file_get_contents($file),true):null;return is_array($data)?$data:[];
    }
    public static function content(string $locale): array {
        if(!isset(self::builtinPacks()[$locale]))return LanguagePacks::runtimePackage($locale)['content']??[];
        $file=dirname(__DIR__).'/resources/content.'.$locale.'.json';if(!is_file($file)&&$locale==='tr')$file=dirname(__DIR__).'/resources/content.json';$data=is_file($file)?json_decode((string)file_get_contents($file),true):null;return is_array($data)?$data:[];
    }
    public static function t(string $locale,string $key): string {
        $messages=self::server($locale)['messages']??[];
        if(!isset($messages[$key])||!is_string($messages[$key]))throw new \RuntimeException('Incomplete server language pack: '.$locale.' / '.$key);
        return$messages[$key];
    }
    public static function complete(string $locale): bool {
        if(!isset(self::packs()[$locale]))return false;
        $content=self::content($locale);foreach(['guides','workflows','categories','platformLabels','factLabels','evidenceLabels','pageNames']as$key)if(!is_array($content[$key]??null))return false;
        $base=self::server('en');$pack=self::server($locale);
        foreach(['messages','routes']as$group){if(!is_array($base[$group]??null)||!is_array($pack[$group]??null)||array_diff(array_keys($base[$group]),array_keys($pack[$group]))||array_diff(array_keys($pack[$group]),array_keys($base[$group])))return false;foreach($pack[$group]as$value)if(!is_string($value)||trim($value)===''||($group==='routes'&&!preg_match('/^[a-z0-9][a-z0-9-]*$/D',$value)))return false;}
        return true;
    }
    public static function locale(string $path): string { $prefix=explode('/',trim($path,'/'))[0]??'';return isset(self::packs()[$prefix])?$prefix:'tr'; }
    private static function staticGroup(string $route): ?string { return ['kategori'=>'categories','rehber'=>'guides','is-akisi'=>'workflows'][$route]??null; }
    private static function staticEntry(string $locale,string $route,string $value): ?array {
        $group=self::staticGroup($route);if(!$group)return null;
        foreach(self::content($locale)[$group]??[] as $entry)if($entry['id']===$value||($entry['slug']??$entry['id'])===$value)return $entry;
        return null;
    }
    /** Only declared taxonomy terms are translated; unknown owner tags stay untouched. */
    public static function tag(string $locale,string $value): ?array {
        foreach(self::content($locale)['tags']??[] as $entry)if(in_array($value,[$entry['id'],$entry['label'],$entry['slug']],true))return $entry;
        return null;
    }
    public static function tagLabel(string $locale,string $value): string { return self::tag($locale,$value)['label']??$value; }
    public static function tagValues(string $locale,string $value): array { $entry=self::tag($locale,$value);return $entry?array_values(array_unique([$entry['id'],$entry['label']])):[$value]; }
    public static function path(string $locale,string $route='',string $slug=''): ?string {
        if(!isset(self::packs()[$locale]))return null;
        if($locale==='tr'&&$route==='')return'/tr';
        if($route==='')return'/'.$locale;
        if($slug!==''&&($entry=self::staticEntry($locale,$route,$slug)))$slug=$entry['slug']??$entry['id'];
        if($slug!==''&&$route==='etiket'&&($tag=self::tag($locale,$slug)))$slug=$tag['slug'];
        $routes=self::server($locale)['routes']??($locale==='en'?self::EN_ROUTES:[]);
        return isset($routes[$route])?($locale==='tr'?'':'/'.$locale).'/'.$routes[$route].($slug!==''?'/'.rawurlencode($slug):''):null;
    }
    public static function route(string $path): ?array {
        if(preg_match('/%(?![a-f0-9]{2})/i',$path))return null;
        $segments=explode('/',trim($path,'/'));if($segments===[''])$segments=[];
        $locale=self::locale($path);if($segments===['tr'])return ['locale'=>'tr','parts'=>[]];
        if($locale!=='tr')array_shift($segments);
        if(!$segments)return ['locale'=>$locale,'parts'=>[]];if(count($segments)>2)return null;
        foreach($segments as &$segment){$segment=rawurldecode($segment);if($segment===''||str_contains($segment,'/')||str_contains($segment,chr(92))||preg_match('/[\x00-\x1f]/',$segment))return null;}unset($segment);
        $routes=self::server($locale)['routes']??[];
        $allowed=count($segments)===2?['uygulama','kategori','liste','yayinci','blog','rehber','is-akisi','etiket']:['kesfet','kategoriler','listeler','yayincilar','blog','rehberler','is-akislari','gecis-rehberleri','hakkimizda','yontem','gizlilik','duzeltme-politikasi','ucretsiz-planlar','platform-farklari','karsilastir','kaydedilenler','ayarlar','secim-sihirbazi','maliyet-hesapla','araclar','submit-app'];
        $route=null;foreach($allowed as $internal)if(($routes[$internal]??null)===$segments[0]){$route=$internal;break;}if($route===null)return null;
        if(count($segments)===1)return ['locale'=>$locale,'parts'=>[$route]];
        $slug=$segments[1];if($entry=self::staticEntry($locale,$route,$slug))$slug=$entry['id'];
        if($route==='etiket')$slug=self::tagLabel($locale,$slug);
        return ['locale'=>$locale,'parts'=>[$route,$slug]];
    }
    /** Safe legacy static/tag aliases only; the HTTP front controller preserves the query. */
    public static function canonicalAlias(string $path): ?string {
        $resolved=self::route($path);if(!$resolved||count($resolved['parts'])!==2)return null;
        [$route,$value]=$resolved['parts'];$locale=$resolved['locale'];
        if(!self::staticEntry($locale,$route,$value)&&!($route==='etiket'&&self::tag($locale,$value)))return null;
        $canonical=self::path($locale,$route,$value);return $canonical!==$path?$canonical:null;
    }
    public static function url(array $config,string $locale,string $route='',string $slug=''): ?string
    {
        $path=self::path($locale,$route,$slug);
        return $path===null?null:Config::url($config,$path);
    }
    public static function language(string $locale): array { $pack=self::packs()[$locale]??[];return ['html'=>$locale,'og'=>str_replace('-','_',$pack['intlLocale']??$locale),'label'=>$pack['label']??$locale,'direction'=>$pack['direction']??'ltr']; }
    public static function rootPath(array $config): string {
        $locale=$config['localization']['defaultLocale']??self::DEFAULT_LOCALE;
        if (!self::enabled($config,$locale)) $locale=self::SOURCE_LOCALE;
        return self::path($locale)??'/tr';
    }
    public static function enabled(array $config,string $locale): bool
    {
        if (!isset(self::packs()[$locale])||!self::complete($locale)) return false;
        if ($locale==='tr') return true;
        foreach ($config['localization']['locales']??[['code'=>'tr','enabled'=>true],['code'=>'en','enabled'=>true]] as $setting) if (($setting['code']??'')===$locale) return ($setting['enabled']??false)===true;
        return false;
    }
    public static function published(array $translation): bool
    {
        return ($translation['status']??'')==='published'||(($translation['status']??'')==='scheduled'&&!empty($translation['publishAt'])&&strtotime($translation['publishAt'])!==false&&strtotime($translation['publishAt'])<=time());
    }
    public static function record(array $catalog,string $kind,string $id): ?array
    {
        foreach ($catalog['records']??[] as $record) if (($record['kind']??'')===$kind&&($record['id']??'')===$id) return $record;
        return null;
    }
    public static function baseData(array $catalog,string $kind,string $id): ?array
    {
        $key=['app'=>'apps','article'=>'articles','list'=>'lists'][$kind]??'';
        foreach ($catalog[$key]??[] as $item) if (($item['id']??'')===$id) return $item;
        return null;
    }
    public static function stale(array $translation,array $catalog): bool
    {
        $record=self::record($catalog,$translation['kind'],$translation['id']);
        if (!$record || ($translation['stale']??false)===true) return true;
        if (isset($record['sourceFingerprint'],$translation['sourceFingerprint'])) return !hash_equals($record['sourceFingerprint'],$translation['sourceFingerprint']);
        return isset($record['revision']) && ($translation['sourceRevision']??null)!==$record['revision'];
    }
    public static function translations(array $catalog,string $locale='en'): array
    {
        return array_values(array_filter($catalog['translations']??[],static fn($t)=>is_array($t)&&($t['locale']??'')===$locale&&self::published($t)&&isset($t['kind'],$t['id'],$t['slug'],$t['data'])&&self::baseData($catalog,$t['kind'],$t['id'])!==null&&Translations::sourceLocale(self::record($catalog,$t['kind'],$t['id'])??[])!==$locale));
    }
    public static function translation(array $catalog,string $kind,string $id,string $locale='en',bool $bySlug=false): ?array
    {
        foreach(self::translations($catalog,$locale) as $t) if($t['kind']===$kind&&$t[$bySlug?'slug':'id']===$id)return $t;
        return null;
    }
    /** Bundled guidance is available only while every referenced app is public in this locale. */
    public static function availableContent(array $catalog,string $locale):array {
        $content=self::content($locale);$ids=[];foreach(self::entries($catalog,$locale) as $entry)if($entry['kind']==='app')$ids[]=$entry['id'];
        foreach(['guides','workflows']as$group)$content[$group]=array_values(array_filter($content[$group]??[],static function($item)use($ids){$references=$item['appIds']??array_column($item['steps']??[],'appId');return $references&&!array_diff($references,$ids);}));
        return $content;
    }
    public static function localizedCatalog(array $catalog,string $locale='en'): array
    {
        $out=$catalog; $out['extensionBlocks']=$catalog['extensionBlocksByLocale'][$locale]??[];unset($out['extensionBlocksByLocale']); $out['extensionCards']=$catalog['extensionCardsByLocale'][$locale]??[]; unset($out['extensionCardsByLocale']); $out['apps']=[];$out['articles']=[];$out['lists']=[];$out['records']=[];
        foreach(self::entries($catalog,$locale) as $t){
            $key=['app'=>'apps','article'=>'articles','list'=>'lists'][$t['kind']]??null;if(!$key)continue;
            $data=$t['data'];$data['id']=$t['id'];if($t['kind']==='app'&&isset($data['tags']))$data['tags']=array_map(fn($tag)=>self::tagLabel($locale,$tag),$data['tags']);$out[$key][]=$data;
            $r=self::record($catalog,$t['kind'],$t['id']);
            $out['records'][]=array_replace($r??[],['id'=>$t['id'],'kind'=>$t['kind'],'sourceLocale'=>Translations::sourceLocale($r??[]),'updatedAt'=>$t['updatedAt']??$r['updatedAt']??null,'seoApproved'=>self::indexableEntry($t,$catalog)]);
        }
        return $out;
    }
    public static function paths(array $catalog,string $locale='en'): array
    {
        $out=['/'=>self::path($locale),'/tr'=>self::path($locale)];
        foreach((self::server($locale)['routes']??self::EN_ROUTES) as $route=>$english) if(!str_starts_with($route,'growth')&&!in_array($route,['uygulama','kategori','liste','yayinci','rehber','is-akisi','etiket'],true))$out['/'.$route]=self::path($locale,$route);
        foreach(self::entries($catalog,$locale) as $t){$route=['app'=>'uygulama','article'=>'blog','list'=>'liste'][$t['kind']]??null;if($route)$out['/'.$route.'/'.$t['id']]=self::path($locale,$route,$t['slug']);}
        foreach(['categories'=>'kategori','guides'=>'rehber','workflows'=>'is-akisi'] as $group=>$route)foreach(self::availableContent($catalog,$locale)[$group]??[] as $entry)if($entry['id']!=='all')$out['/'.$route.'/'.$entry['id']]=self::path($locale,$route,$entry['id']);
        foreach(self::entries($catalog,$locale) as $entry)if($entry['kind']==='app'){
            $publisher=$entry['data']['publisher']??'';if($publisher!==''){$id=PublicSite::publisherSlug($publisher);$out['/yayinci/'.$id]=self::path($locale,'yayinci',$id);}
            foreach($entry['data']['tags']??[] as $tag){$url=self::path($locale,'etiket',$tag);foreach(array_unique([$tag,self::tagLabel($locale,$tag)]) as $value)$out['/etiket/'.$value]=$url;}
        }
        foreach($catalog['publisherDirectory']??[] as $publisher)$out['/yayinci/'.$publisher['slug']]=self::path($locale,'yayinci',$publisher['slug']);
        return $out;
    }
    public static function alternates(array $catalog,array $config,string $kind,string $id): array
    {
        $record=self::record($catalog,$kind,$id);$data=self::baseData($catalog,$kind,$id);
        if (!$record||empty($record['seoApproved'])||($data['seo']['noindex']??false))return [];
        $route=['app'=>'uygulama','article'=>'blog','list'=>'liste'][$kind]??null;if(!$route)return [];
        $out=[];
        foreach(array_unique(array_merge([Translations::sourceLocale($record)],array_keys(self::packs()))) as $locale){if(!self::enabled($config,$locale))continue;$t=self::entry($catalog,$kind,$id,$locale);if($t&&self::indexableEntry($t,$catalog))$out[]=['locale'=>$locale,'label'=>self::language($locale)['label'],'href'=>self::url($config,$locale,$route,$t['slug'])];}
        return count($out)>1?$out:[];
    }

    /** Published originals and explicit translations share routing, never storage identity. */
    public static function entries(array $catalog,string $locale): array {
        $out=[];
        foreach(['app'=>'apps','article'=>'articles','list'=>'lists'] as $kind=>$key)foreach($catalog[$key]??[] as $data){$record=self::record($catalog,$kind,$data['id'])??[];if(Translations::sourceLocale($record)!==$locale)continue;$out[]=['kind'=>$kind,'id'=>$data['id'],'locale'=>$locale,'slug'=>$data['id'],'data'=>$data,'updatedAt'=>$record['updatedAt']??$data['updatedAt']??null,'seoApproved'=>($record['seoApproved']??false)===true,'sourceOriginal'=>true];}
        foreach(self::translations($catalog,$locale) as $translation){$translation['sourceOriginal']=false;$out[]=$translation;}return$out;
    }
    public static function entry(array $catalog,string $kind,string $id,string $locale,bool $bySlug=false): ?array {
        foreach(self::entries($catalog,$locale) as $entry)if($entry['kind']===$kind&&$entry[$bySlug?'slug':'id']===$id)return$entry;return null;
    }
    public static function indexableEntry(array $entry,array $catalog): bool {
        $record=self::record($catalog,$entry['kind'],$entry['id']);$source=self::baseData($catalog,$entry['kind'],$entry['id']);
        return($record['seoApproved']??false)===true&&empty($source['seo']['noindex'])&&empty($entry['data']['seo']['noindex'])&&($entry['seoApproved']??false)===true&&(($entry['sourceOriginal']??false)===true||!self::stale($entry,$catalog));
    }

}
