<?php
declare(strict_types=1);
namespace WexaShelf;
/** Shared locale SSR requires complete explicit UI, content and server packs. */
final class EnglishPublicSite
{
    private static function e(mixed $s):string{return htmlspecialchars((string)$s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
    private static function json(mixed $s):string{return json_encode($s,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);}
    private static function t(array $config,string $key):string{return Localization::t($config['_renderLocale']??'en',$key);}
    private static function find(array $items,string $id):?array{foreach($items as $item)if($item['id']===$id)return $item;return null;}
    private static function link(array $config,array $paths,string $route='',string $id=''):?string{
        $key='/'.$route.($id!==''?'/'.$id:'');if(isset($paths[$key]))return Config::url($config,$paths[$key]);
        if($id!==''&&in_array($route,['uygulama','blog','liste'],true))return null;
        return Localization::url($config,$config['_renderLocale']??'en',$route,$id);
    }
    public static function render(array $source,array $config,string $path,array $query):void{
        $locale=Localization::locale($path);$config['_renderLocale']=$locale;$resolved=Localization::route($path);$content=Localization::availableContent($source,$locale);
        if(!Localization::enabled($config,$locale)||!$resolved||!$content){self::notFound($config);return;}
        $parts=$resolved['parts'];$route=$parts[0]??'';$slug=$parts[1]??'';
        $catalog=Localization::localizedCatalog($source,$locale);$paths=Localization::paths($source,$locale);$translation=null;$item=null;
        $publishers=[];foreach($catalog['apps'] as $app){$name=trim($app['publisher']??'');if($name==='')continue;$publisherId=PublicSite::publisherSlug($name);$publishers[$publisherId]??=['id'=>$publisherId,'name'=>$name,'apps'=>[]];$publishers[$publisherId]['apps'][]=$app;}
        foreach(['categories'=>'kategori','guides'=>'rehber','workflows'=>'is-akisi'] as $key=>$r)foreach($content[$key]??[] as $entry)$paths['/'.$r.'/'.$entry['id']]=Localization::path($locale,$r,$entry['id']);
        foreach($publishers as $publisher)$paths['/yayinci/'.$publisher['id']]=Localization::path($locale,'yayinci',$publisher['id']);
        foreach($catalog['apps'] as $app)foreach($app['tags']??[] as $tag)$paths['/etiket/'.$tag]=Localization::path($locale,'etiket',$tag);

        $kind=['uygulama'=>'app','blog'=>'article','liste'=>'list'][$route]??null;
        if(count($parts)===2&&$kind){$translation=Localization::entry($source,$kind,$slug,$locale,true);if(!$translation){self::notFound($config);return;}$item=$translation['data'];$item['id']=$translation['id'];$parts[1]=$item['id'];}
        elseif(count($parts)===2){$items=match($route){'kategori'=>$content['categories']??[],'rehber'=>$content['guides']??[],'is-akisi'=>$content['workflows']??[],'yayinci'=>array_values($publishers),'etiket'=>array_map(fn($tag)=>['id'=>$tag,'name'=>$tag],array_values(array_unique(array_merge(...array_map(fn($a)=>$a['tags']??[],$catalog['apps']))))),default=>[]};$item=self::find($items,$slug);if(!$item||($route==='kategori'&&$slug==='all')){self::notFound($config);return;}}
        elseif($parts&&$route!=='araclar'&&!isset($content['pageNames'][$route])){self::notFound($config);return;}
        $base=Config::basePath($config);$seo=array_replace(SEOSettings::defaults($config),$config['seo']??[]);$private=in_array($route,['ayarlar','kaydedilenler','secim-sihirbazi','maliyet-hesapla','submit-app'],true);
        $title=$item['title']??$item['name']??(isset($item['label'])?$item['label'].self::t($config,'appsSuffix'):null)??($content['pageNames'][$route]??self::t($config,'homeTitle'));
        $description=$item['description']??$item['summary']??self::t($config,'homeDescription');if($route==='araclar'){$title=self::t($config,'toolsTitle');$description=self::t($config,'toolsDescription');}
        $canonical=($query||$private)?null:Config::url($config,Localization::path($locale,$route,$slug));
        $enabled=($config['seo']['indexingEnabled']??$config['site']['indexing']??false)===true&&SEOSettings::publicHttps($config['site']['url']);
        $index=$enabled&&!$query&&!$private&&($translation?Localization::indexableEntry($translation,$source):in_array($route,['','hakkimizda','yontem','duzeltme-politikasi'],true));
        if($enabled&&!$query&&!$private&&!$translation&&in_array($route,['blog','listeler'],true))foreach(Localization::entries($source,$locale) as $entry)if($entry['kind']===($route==='blog'?'article':'list')&&Localization::indexableEntry($entry,$source)){$index=true;break;}
        $robots=($index?'index':'noindex').', '.($enabled&&!$private?'follow':'nofollow');header('Content-Type: text/html; charset=utf-8');header('Content-Language: '.$locale);header('X-Robots-Tag: '.$robots);
        $alternates=(!$query&&!$private&&(!$translation||Localization::indexableEntry($translation,$source)))?PublicSite::languageAlternates($source,$config,$parts):[];
        $metaTitle=trim($item['seo']['title']??'')?:$title;$metaDescription=trim($item['seo']['description']??'')?:$description;$cover=$item['cover']??null;
        if(!$parts){$homeSeo=$config['localization']['homeSeo'][$locale]??[];if(trim($homeSeo['title']??'')!=='')$metaTitle=$homeSeo['title'];if(trim($homeSeo['description']??'')!=='')$metaDescription=$homeSeo['description'];}
        if(!$cover||!preg_match('/^[a-f0-9]{64}$/D',$cover['assetId']??'')||!is_file(Config::storage().'/media/'.$cover['assetId'].'.png'))$cover=null;
        if($cover)$cover['url']=Config::url($config,'media/'.$cover['assetId'].'.png');$image=$cover['url']??Config::url($config,'assets/social.svg');$publicScript=$base.'/assets/app.js';
        echo '<!doctype html><html lang="'.self::e($locale).'" dir="'.self::e(Localization::language($locale)['direction']).'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.self::e($metaTitle.($seo['titleSuffix']!==''?' | '.$seo['titleSuffix']:'')).'</title><meta name="description" content="'.self::e($metaDescription).'"><meta name="robots" content="'.$robots.'">';
        echo '<link rel="preload" as="script" fetchpriority="high" href="'.self::e($publicScript).'">';
        if(!$parts)echo ThemeView::headingFontPreload($catalog,$config);
        if($canonical)echo '<link rel="canonical" href="'.self::e($canonical).'">';
        foreach($alternates as $a)echo '<link rel="alternate" hreflang="'.self::e($a['locale']).'" href="'.self::e($a['href']).'">';
        foreach(['og:type'=>$route==='blog'&&$item?'article':'website','og:title'=>$metaTitle,'og:description'=>$metaDescription,'og:locale'=>Localization::language($locale)['og'],'og:site_name'=>$seo['siteName'],'og:image'=>$image]as$key=>$value)echo '<meta property="'.$key.'" content="'.self::e($value).'">';
        if($canonical)echo '<meta property="og:url" content="'.self::e($canonical).'">';
        echo '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'.self::e($metaTitle).'"><meta name="twitter:description" content="'.self::e($metaDescription).'"><meta name="twitter:image" content="'.self::e($image).'"><link rel="icon" type="image/svg+xml" href="'.self::e($base.'/assets/favicon.svg').'"><link rel="stylesheet" href="'.self::e($base.'/assets/app.css').'">';
        foreach(['googleVerification'=>'google-site-verification','bingVerification'=>'msvalidate.01']as$field=>$name)if($seo[$field]!=='')echo '<meta name="'.$name.'" content="'.self::e($seo[$field]).'">';
        if(!$parts&&($catalog['siteSettings']['theme']['template']??'night')==='night')echo '<link rel="preload" as="image" type="image/svg+xml" fetchpriority="high" href="'.self::e($base.'/assets/artwork/night-mountains.svg').'">';
        if($canonical)echo '<script type="application/ld+json">'.self::json(self::graph(PublicSite::structuredData($catalog,$config,$content,$parts,$item,$title,$description,$canonical,$cover),$config,$paths)).'</script>';
        echo '</head><body><div id="wexa-root"><div '.ThemeView::attributes($catalog,$route?:'home').'><a class="skip-link" href="#main-content">'.self::e(self::t($config,'skipToContent')).'</a><header>'.Branding::link($config,Config::url($config,$locale)).'<nav aria-label="'.self::e(self::t($config,'mainNavigation')).'">';
        foreach(['kesfet'=>'navExplore','kategoriler'=>'navCategories','blog'=>'navBlog','listeler'=>'navLists']as$r=>$label)echo '<a href="'.self::e(self::link($config,$paths,$r)).'">'.self::e(self::t($config,$label)).'</a> ';
        if(($catalog['appSubmissions']['enabled']??false)===true)echo '<a href="'.self::e(self::link($config,$paths,'submit-app')).'">'.self::e(self::t($config,'navSubmitApp')).'</a> ';
        foreach(PublicSite::navigationAlternates($source,$config,$parts,$query) as$a)echo '<a hreflang="'.self::e($a['locale']).'" href="'.self::e($a['href']).'">'.self::e($a['label']).'</a> ';
        echo '</nav></header><main id="main-content"><h1>'.self::e($title).'</h1><p>'.self::e($description).'</p>';
        if($translation&&empty($translation['sourceOriginal'])&&Localization::stale($translation,$source))echo '<p role="status">'.self::e(self::t($config,'staleTranslation')).'</p>';
        if($cover)echo '<figure><img src="'.self::e($cover['url']).'" alt="'.self::e($cover['alt']??'').'" width="1536" height="1024"><figcaption>'.self::e(trim($cover['caption']??'')?:self::t($config,'aiIllustration')).'</figcaption></figure>';
        $bodyCatalog=$catalog;
        if(isset($catalog['pagination']['items'])&&in_array($route,['kesfet','kategori','etiket','yayinci','blog','listeler'],true)&&(!isset($parts[1])||in_array($route,['kategori','etiket','yayinci'],true))){$ids=array_column($catalog['pagination']['items'],'id');$key=$route==='blog'?'articles':($route==='listeler'?'lists':'apps');$bodyCatalog[$key]=array_values(array_filter($catalog[$key],fn($row)=>in_array($row['id'],$ids,true)));if($route==='yayinci'&&$item)$item['apps']=$bodyCatalog['apps'];}
        self::body($bodyCatalog,$content,$config,$paths,$route,$item);
        if($route==='')Extensions::renderBlocks($catalog,$config,$locale);
        if(isset($catalog['pagination']['pages'])&&$catalog['pagination']['pages']>1&&in_array($route,['kesfet','kategori','etiket','yayinci','yayincilar','blog','listeler'],true)&&(!isset($parts[1])||in_array($route,['kategori','etiket','yayinci'],true))){$paging=$catalog['pagination'];echo '<nav aria-label="'.self::e(self::t($config,'navExplore')).'">';foreach(array_unique(array_filter([$paging['page']-1,$paging['page']+1],fn($p)=>$p>=1&&$p<=$paging['pages']))as$p)echo '<a href="?'.self::e(http_build_query(array_replace($query,['page'=>$p]),'','&',PHP_QUERY_RFC3986)).'">'.($p<$paging['page']?'← ':'').$p.($p>$paging['page']?' →':'').'</a> ';echo'</nav>';}

        echo '</main><footer>'.Branding::link($config,Config::url($config,$locale)).'<a href="'.self::e(self::link($config,$paths,'gizlilik')).'">'.self::e(self::t($config,'privacy')).'</a> · <a href="'.self::e(self::link($config,$paths,'yontem')).'">'.self::e(self::t($config,'methodology')).'</a>';
        if(($config['site']['show_credit']??true)!==false)echo '<p>'.self::e(self::t($config,'developedBy')).' <a href="https://softwexa.com" rel="nofollow">Softwexa</a>.</p>';echo '</footer></div></div>';
        foreach($catalog['apps']as&$app)if(str_starts_with($app['icon']??'','/')&&!str_starts_with($app['icon'],'//'))$app['icon']=$base.$app['icon'];unset($app);
        unset($catalog['translations'],$catalog['growth'],$catalog['growthLifecycle']);
        $payload=['catalog'=>$catalog,'path'=>$parts,'locale'=>$locale,'localizedPaths'=>$paths,'languageAlternates'=>PublicSite::navigationAlternates($source,$config,$parts,$query),'basePath'=>$base,'initialQuery'=>is_string($query['q']??null)?mb_substr($query['q'],0,200):'','initialPlatform'=>in_array($query['platform']??'',['android','ios','windows'],true)?$query['platform']:'all','initialCategory'=>$route==='kategori'?$slug:'all','initialCompare'=>is_string($query['apps']??null)?array_slice(array_values(array_unique(array_filter(explode(',',$query['apps']),fn($id)=>in_array($id,array_column($catalog['apps'],'id'),true)))),0,4):[],'initialCompareSpecified'=>is_string($query['apps']??null),'admin'=>false,'siteName'=>$seo['siteName'],'branding'=>Branding::fromConfig($config),'showDeveloperCredit'=>($config['site']['show_credit']??true)!==false,'translationStale'=>$translation&&empty($translation['sourceOriginal'])?Localization::stale($translation,$source):false,'runtimeLocalePacks'=>LanguagePacks::publicPackages($locale)];
        if($route==='submit-app'&&isset($config['_submissionConfig']))$payload['submissionConfig']=$config['_submissionConfig'];
        echo '<script id="wexa-bootstrap" type="application/json">'.self::json($payload).'</script><script defer src="'.self::e($publicScript).'" fetchpriority="high"></script>'.Performance::script($catalog,$config,$path).'</body></html>';
    }
    private static function graph(mixed$value,array$config,array$paths,?string$key=null):mixed{
        if(is_array($value)){foreach($value as$k=>$v)$value[$k]=self::graph($v,$config,$paths,(string)$k);return$value;}
        if($key==='inLanguage')return$config['_renderLocale'];
        if(is_string($value)&&str_starts_with($value,Config::url($config))){$relative=substr($value,strlen(rtrim(Config::url($config),'/')));[$url,$fragment]=array_pad(explode('#',$relative,2),2,null);if(($url==='/'.$config['_renderLocale']||str_starts_with($url,'/'.$config['_renderLocale'].'/')))return$value;$parts=explode('/',trim($url,'/'));$mapped=self::link($config,$paths,$parts[0]??'',$parts[1]??'');if($mapped)return$mapped.($fragment!==null?'#'.$fragment:'');}
        if($key==='caption'&&$value==='Yapay zekâ ile oluşturulmuş temsili görsel.')return self::t($config,'aiIllustration');return$value;
    }
    private static function notFound(array$config):void{http_response_code(404);header('Content-Type: text/html; charset=utf-8');header('X-Robots-Tag: noindex, nofollow');$locale=$config['_renderLocale']??'en';$complete=Localization::complete($locale);$title=$complete?self::t($config,'pageNotFound'):'404';echo '<!doctype html><html lang="'.self::e($locale).'"><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>'.self::e($title).'</title><h1>'.self::e($title).'</h1>';if($complete)echo'<p>'.self::e(self::t($config,'noPublishedVersion')).'</p>';echo'</html>';}
    private static function body(array$catalog,array$content,array$config,array$paths,string$route,?array$item):void{
        $apps=function(array$items)use($config,$paths):void{foreach($items as$app){$url=self::link($config,$paths,'uygulama',$app['id']);if($url)echo'<article><h2><a href="'.self::e($url).'">'.self::e($app['name']).'</a></h2><p>'.self::e($app['description']).'</p></article>';}};
        if($route==='submit-app'){echo '<p>'.self::e(self::t($config,'submissionNotice')).'</p>';return;}
        if($route==='araclar'){echo '<p>'.self::e(self::t($config,'interactiveNotice')).'</p>';return;}
        if($route==='')PublicSite::moduleCards($catalog,$config);
        if($item){
            if($route==='yayinci'){$apps($item['apps']);return;}
            if($route==='etiket'){$apps(array_values(array_filter($catalog['apps'],fn($a)=>in_array($item['id'],$a['tags']??[],true))));return;}
            if($route==='kategori'){$apps(array_values(array_filter($catalog['apps'],fn($a)=>$a['category']===$item['id'])));return;}
            if($route==='blog')echo'<p>'.self::e($item['author']??'').' · '.self::e(self::t($config,'published')).': '.self::e($item['publishedAt']??'').' · '.self::e(self::t($config,'updated')).': '.self::e($item['updatedAt']??'').'</p>';
            if($route==='uygulama'){AppScreenshots::render($item,$config,$config['_renderLocale']);echo'<p>'.self::e(self::t($config,'publisher')).': '.self::e($item['publisher']).'</p><p><a rel="noopener noreferrer" href="'.self::e($item['website']).'">'.self::e(self::t($config,'officialWebsite')).'</a></p>';foreach($item['facts']??[]as$fact)echo'<section><h2>'.self::e($content['factLabels'][$fact['key']]??$fact['key']).'</h2><p>'.self::e($fact['detail']).'</p></section>';}
            foreach($item['sections']??[]as$section){echo'<section><h2>'.self::e($section['heading']).'</h2>';foreach($section['paragraphs']as$p){if($route==='blog')ArticleContent::renderParagraph($p,$item,$catalog,$config,$paths,$config['_renderLocale']);else echo'<p>'.self::e($p).'</p>';}echo'</section>';}
            if(!empty($item['steps'])){echo'<ol>';foreach($item['steps']as$step)echo'<li>'.self::e(is_string($step)?$step:($step['title'].': '.$step['description'])).'</li>';echo'</ol>';}
            foreach($item['entries']??[]as$entry){$app=self::find($catalog['apps'],$entry['appId']);if($app){$apps([$app]);echo'<p>'.self::e($entry['reason']).'</p>';}}
            foreach($item['sources']??[]as$source)echo'<p><a rel="noopener noreferrer" href="'.self::e($source['url']).'">'.self::e($source['title']??$source['url']).'</a></p>';
            foreach($item['appIds']??[]as$id){$app=self::find($catalog['apps'],$id);if($app)$apps([$app]);}return;
        }
        if(in_array($route,['hakkimizda','yontem','gizlilik','duzeltme-politikasi'],true)){echo'<p>'.self::e(self::t($config,match($route){'hakkimizda'=>'aboutText','gizlilik'=>'privacyText','yontem'=>'methodologyText',default=>'correctionsText'})).'</p>';return;}
        if(in_array($route,['blog','listeler','rehberler','is-akislari','gecis-rehberleri'],true)){[$items,$prefix]=match($route){'blog'=>[$catalog['articles'],'blog'],'listeler'=>[$catalog['lists'],'liste'],'is-akislari'=>[$content['workflows']??[],'is-akisi'],default=>[$content['guides']??[],'rehber']};foreach($items as$entry){$url=self::link($config,$paths,$prefix,$entry['id']);if($url)echo'<article><h2><a href="'.self::e($url).'">'.self::e($entry['title']).'</a></h2><p>'.self::e($entry['summary']??$entry['description']??'').'</p></article>';}return;}
        if($route==='yayincilar'){if(isset($catalog['publisherDirectory'])){foreach($catalog['publisherDirectory']as$publisher)echo'<p><a href="'.self::e(self::link($config,$paths,'yayinci',$publisher['slug'])).'">'.self::e($publisher['name']).'</a> ('.(int)$publisher['appCount'].')</p>';return;} $seen=[];foreach($catalog['apps'] as $app){$name=trim($app['publisher']??'');if($name===''||isset($seen[$name]))continue;$seen[$name]=true;echo '<p><a href="'.self::e(self::link($config,$paths,'yayinci',PublicSite::publisherSlug($name))).'">'.self::e($name).'</a></p>';}return;}
        if($route==='kategoriler'){foreach($content['categories']??[]as$category)if($category['id']!=='all')echo'<p><a href="'.self::e(self::link($config,$paths,'kategori',$category['id'])).'">'.self::e($category['label']).'</a></p>';return;}
        if(in_array($route,['ayarlar','kaydedilenler','secim-sihirbazi','maliyet-hesapla','karsilastir'],true)){echo'<p>'.self::e(self::t($config,'interactiveNotice')).'</p>';return;}$apps($catalog['apps']);
    }
}
