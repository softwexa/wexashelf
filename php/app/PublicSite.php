<?php
declare(strict_types=1);
namespace WexaShelf;

final class PublicSite {
    private const PRIVATE_ROUTES = ['ayarlar','kaydedilenler','yonetim','admin','secim-sihirbazi','maliyet-hesapla','submit-app'];
    private const STATIC_PATHS = ['/','/hakkimizda','/yontem','/duzeltme-politikasi'];
    private static function e(mixed $v): string { return htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
    private static function json(mixed $v): string { return json_encode($v, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); }
    private static function content(): array { return json_decode(file_get_contents(dirname(__DIR__).'/resources/content.json'), true, 512, JSON_THROW_ON_ERROR); }
    private static function find(array $items, string $id): ?array { foreach ($items as $item) if (($item['id'] ?? '') === $id) return $item; return null; }
    public static function publisherSlug(string $name): string {
        if (class_exists('Normalizer')) $name = \Normalizer::normalize($name, \Normalizer::FORM_C);
        $name = preg_replace('/\s+/u', ' ', trim($name));
        $lower = mb_strtolower(strtr($name, ['I'=>'ı','İ'=>'i']), 'UTF-8');
        $lower = str_replace('ı', 'i', $lower);
        if (class_exists('Normalizer')) $lower = preg_replace('/\p{M}/u', '', \Normalizer::normalize($lower, \Normalizer::FORM_D));
        else $lower = strtr($lower, ['ç'=>'c','ğ'=>'g','ö'=>'o','ş'=>'s','ü'=>'u','é'=>'e','á'=>'a','è'=>'e','ä'=>'a','ñ'=>'n']);
        $readable = substr(trim(preg_replace('/[^a-z0-9]+/', '-', $lower), '-'), 0, 60) ?: 'yayinci';
        $codes = array_map(fn($char) => base_convert((string)mb_ord($char, 'UTF-8'), 10, 36), preg_split('//u', $name, -1, PREG_SPLIT_NO_EMPTY));
        return $readable.'--'.implode('.', $codes);
    }
    private static function publishers(array $catalog): array {
        $groups = [];
        foreach ($catalog['apps'] as $app) {
            $name = preg_replace('/\s+/u', ' ', trim($app['publisher'] ?? ''));
            if (class_exists('Normalizer')) $name = \Normalizer::normalize($name, \Normalizer::FORM_C);
            if ($name === '') continue;
            $slug = self::publisherSlug($name);
            $groups[$slug] ??= ['id'=>$slug,'name'=>$name,'apps'=>[]];
            $groups[$slug]['apps'][] = $app;
        }
        return array_values($groups);
    }
    private static function enabled(array $config): bool {
        return ($config['seo']['indexingEnabled'] ?? $config['site']['indexing'] ?? false) === true && SEOSettings::publicHttps($config['site']['url']);
    }
    private static function recordNoindex(array $record, array $catalog): bool {
        $collection = ['app'=>'apps','article'=>'articles','list'=>'lists'][$record['kind']] ?? '';
        $data = $record['data'] ?? self::find($catalog[$collection] ?? [], $record['id']);
        return ($data['seo']['noindex'] ?? false) === true;
    }
    public static function publicMedia(array $catalog, string $id, string $format='png'): bool {
        if (!preg_match('/^[a-f0-9]{64}$/D', $id)) return false;
        $branding=$catalog['branding']??[];$logo=$branding['logo']??null;
        if(($branding['logoMode']??'text-only')!=='text-only'&&is_array($logo)&&($logo['assetId']??'')===$id&&($logo['format']??'')===$format)return true;
        $icon='/media/'.$id.'.'.$format;$apps=$catalog['apps']??[];
        foreach($catalog['translations']??[]as$translation)if(($translation['kind']??'')==='app'&&Localization::published($translation)&&self::find($catalog['apps']??[],$translation['id'])!==null)$apps[]=$translation['data'];
        foreach($apps as$app){if(($app['icon']??'')===$icon)return true;foreach($app['screenshots']??[]as$image)if(($image['assetId']??'')===$id&&($image['format']??'')===$format)return true;}
        $articles=$catalog['articles']??[];
        foreach($catalog['translations']??[] as $translation)if(($translation['kind']??'')==='article'&&Localization::published($translation)&&self::find($catalog['articles']??[],$translation['id'])!==null)$articles[]=$translation['data'];
        foreach ($articles as $article) {if ($format==='png'&&($article['cover']['assetId'] ?? '') === $id) return true;foreach($article['images']??[] as $image)if($image['assetId']===$id&&$image['format']===$format&&in_array($id,ArticleContent::imageIds($article),true))return true;}
        return false;
    }
    private static function cover(array $item, array $config): ?array {
        $cover = $item['cover'] ?? null;
        if (!is_array($cover) || !preg_match('/^[a-f0-9]{64}$/D', $cover['assetId'] ?? '') || !is_file(Config::storage().'/media/'.$cover['assetId'].'.png')) return null;
        return $cover + ['url'=>Config::url($config, 'media/'.$cover['assetId'].'.png')];
    }
    private static function indexable(array $parts, array $catalog, array $config, array $query = []): bool {
        if (!self::enabled($config) || $query || in_array($parts[0] ?? '', self::PRIVATE_ROUTES, true)) return false;
        if (in_array('/'.implode('/', $parts), self::STATIC_PATHS, true)) return true;
        $kind = ['uygulama'=>'app','blog'=>'article','liste'=>'list'][$parts[0] ?? ''] ?? null;
        foreach ($catalog['records'] ?? [] as $r) {
            if (empty($r['seoApproved']) || self::recordNoindex($r, $catalog)) continue;
            if (count($parts) === 2 && $r['kind'] === $kind && $r['id'] === $parts[1]) return true;
            if (count($parts) === 1 && (($parts[0] === 'blog' && $r['kind'] === 'article') || ($parts[0] === 'listeler' && $r['kind'] === 'list'))) return true;
        }
        return false;
    }
    public static function moduleCards(array $catalog,array $config):void {
        foreach($catalog['extensionCards']??[] as $card) {
            $href=$card['href']??'';
            if(!is_string($href)||!preg_match('~^/[a-zA-Z0-9][a-zA-Z0-9/_.%-]*$~D',$href)||str_contains($href,'..'))continue;
            echo '<article><h2><a href="'.self::e(Config::basePath($config).$href).'">'.self::e($card['title']??'').'</a></h2><p>'.self::e($card['description']??'').'</p></article>';
        }
    }
    public static function render(array $catalog, array $config, string $path, array $query): void {
        if(in_array(rtrim($path,'/'),['/admin','/yonetim'],true)){AdminSite::render($config);return;}
        if ($path==='/' ) { header('Location: '.Config::basePath($config).Localization::rootPath($config),true,302); return; }
        if ($path==='/tr'||$path==='/tr/') $path='/';
        if (GrowthSite::matches($path)) { GrowthSite::render($catalog['growth']??[],$catalog,$config,$path,$query); return; }
        if ($path!=='/yonetim') { EnglishPublicSite::render($catalog,$config,$path,$query); return; }
        $content = self::content(); $parts = array_values(array_filter(explode('/', trim($path, '/')), fn($s) => $s !== '')); $route = $parts[0] ?? ''; $id = $parts[1] ?? '';
        $publishers = self::publishers($catalog);
        $collections = ['uygulama'=>$catalog['apps'],'blog'=>$catalog['articles'],'liste'=>$catalog['lists'],'rehber'=>$content['guides'],'is-akisi'=>$content['workflows'],'kategori'=>$content['categories'],'yayinci'=>$publishers];
        $item = count($parts) === 2 && isset($collections[$route]) ? self::find($collections[$route], $id) : null;
        if ($route === 'kategori' && $id === 'all') $item = null;
        $tagExists = $route === 'etiket' && count($parts) === 2 && count(array_filter($catalog['apps'], fn($a) => in_array($id, $a['tags'] ?? [], true))) > 0;
        $admin = $parts === ['yonetim'];
        $valid = !$parts || $admin || (count($parts) === 1 && ($route==='araclar'||isset($content['pageNames'][$route]))) || $item || $tagExists;
        if (!$valid) http_response_code(404);
        $title = !$valid ? 'Sayfa bulunamadı' : ($admin ? 'İçerik yönetimi' : ($item['title'] ?? $item['name'] ?? (isset($item['label']) ? $item['label'].' uygulamaları' : null) ?? ($tagExists ? $id.' uygulamaları' : ($content['pageNames'][$route] ?? 'Kendine uygun olanı keşfet'))));
        $description = $item['description'] ?? $item['summary'] ?? 'Android, iOS ve Windows uygulamalarını kaynaklarıyla keşfet, karşılaştır ve ihtiyacına uygun araçları seç.';
        if($route==='araclar'){$title=Localization::t('tr','toolsTitle');$description=Localization::t('tr','toolsDescription');}
        $seo = array_replace(SEOSettings::defaults($config), $config['seo'] ?? []);
        $metaTitle = trim($item['seo']['title'] ?? '') ?: (!$parts ? $seo['homeTitle'] : $title);
        $metaDescription = trim($item['seo']['description'] ?? '') ?: (!$parts ? $seo['homeDescription'] : $description);
        if(!$parts){$homeSeo=$config['localization']['homeSeo']['tr']??[];if(trim($homeSeo['title']??'')!=='')$metaTitle=$homeSeo['title'];if(trim($homeSeo['description']??'')!=='')$metaDescription=$homeSeo['description'];}
        $cover = $route === 'blog' && $item ? self::cover($item, $config) : null;
        $socialImage = $cover['url'] ?? Config::url($config, 'assets/social.svg');
        $private = in_array($route, self::PRIVATE_ROUTES, true);
        $canonical = $valid && !$private && !$query ? (!$parts ? Localization::url($config,'tr') : Config::url($config, implode('/', array_map('rawurlencode', $parts)))) : null;
        $index = $valid && self::indexable($parts, $catalog, $config, $query);
        $robots = ($index ? 'index' : 'noindex').', '.(self::enabled($config) && !$private && $valid ? 'follow' : 'nofollow');
        header('Content-Type: text/html; charset=utf-8'); header('X-Robots-Tag: '.$robots);
        $base = Config::basePath($config);
        $assetEntry = $admin ? 'admin' : 'app';
        $scriptUrl = $base.'/assets/'.$assetEntry.'.js';
        echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.self::e($metaTitle.($seo['titleSuffix'] !== '' ? ' | '.$seo['titleSuffix'] : '')).'</title><meta name="description" content="'.self::e($metaDescription).'"><meta name="robots" content="'.$robots.'">';
        if ($valid && !$admin) echo '<link rel="preload" as="script" fetchpriority="high" href="'.self::e($scriptUrl).'">';
        if($valid&&!$admin&&!$parts)echo ThemeView::headingFontPreload($catalog,$config);
        if ($canonical) echo '<link rel="canonical" href="'.self::e($canonical).'">';
        $languageAlternates = !$query && $valid ? self::languageAlternates($catalog,$config,$parts) : [];
        foreach ($languageAlternates as $alternate) echo '<link rel="alternate" hreflang="'.self::e($alternate['locale']).'" href="'.self::e($alternate['href']).'">';
        echo '<link rel="icon" type="image/svg+xml" href="'.self::e($base.'/assets/favicon.svg').'">';
        if (!$parts && ($catalog['siteSettings']['theme']['template'] ?? 'night') === 'night') echo '<link rel="preload" as="image" type="image/svg+xml" fetchpriority="high" href="'.self::e($base.'/assets/artwork/night-mountains.svg').'">';
        foreach (['og:type'=>$route === 'blog' && $item ? 'article' : 'website','og:title'=>$metaTitle,'og:description'=>$metaDescription,'og:site_name'=>$seo['siteName'],'og:locale'=>'tr_TR','og:image'=>$socialImage] as $key=>$value) echo '<meta property="'.$key.'" content="'.self::e($value).'">';
        if ($canonical) echo '<meta property="og:url" content="'.self::e($canonical).'">';
        echo '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'.self::e($metaTitle).'"><meta name="twitter:description" content="'.self::e($metaDescription).'"><meta name="twitter:image" content="'.self::e($socialImage).'"><link rel="stylesheet" href="'.self::e($base.'/assets/'.$assetEntry.'.css').'">';
        foreach (['googleVerification'=>'google-site-verification','bingVerification'=>'msvalidate.01'] as $field=>$name) if ($seo[$field] !== '') echo '<meta name="'.$name.'" content="'.self::e($seo[$field]).'">';
        if ($valid && !$private && !$query && $canonical) {
            echo '<script type="application/ld+json">'.self::json(self::structuredData($catalog,$config,$content,$parts,$item,$title,$description,$canonical,$cover)).'</script>';
        }
        echo '</head><body><div id="wexa-root"><div '.ThemeView::attributes($catalog,$route?:'home').'><a class="skip-link" href="#main-content">İçeriğe geç</a><header>'.Branding::link($config,Config::url($config,'tr')).'<nav aria-label="Ana gezinme">';
        foreach (['kesfet'=>'Keşfet','kategoriler'=>'Kategoriler','rehberler'=>'Rehberler','listeler'=>'Seçkiler','yayincilar'=>'Yayıncılar'] as $p=>$label) echo ' <a href="'.self::e($base.'/'.$p).'">'.$label.'</a> ';
        if(($catalog['appSubmissions']['enabled']??false)===true)echo ' <a href="'.self::e($base.'/uygulama-gonder').'">'.self::e(Localization::t('tr','navSubmitApp')).'</a>';
        echo '</nav></header><main id="main-content"><h1>'.self::e($title).'</h1><p>'.self::e($description).'</p>';
        if ($cover) echo '<figure><img src="'.self::e($cover['url']).'" alt="'.self::e($cover['alt'] ?? '').'" width="1536" height="1024"><figcaption>'.self::e(trim($cover['caption'] ?? '') ?: 'Yapay zekâ ile oluşturulmuş temsili görsel.').'</figcaption></figure>';
        if (!$valid) echo '<p>Bu adres bulunamadı. <a href="'.self::e($base.'/tr').'">Ana sayfaya dön</a>.</p>';
        elseif ($item) self::detail($route, $item, $catalog, $content, $base);
        elseif ($route === 'yayincilar') foreach ($publishers as $p) echo '<p><a href="'.self::e($base.'/yayinci/'.$p['id']).'">'.self::e($p['name']).'</a> · '.count($p['apps']).' uygulama</p>';
        elseif ($route === 'kategoriler') foreach ($content['categories'] as $c) { if ($c['id'] !== 'all') echo '<p><a href="'.self::e($base.'/kategori/'.$c['id']).'">'.self::e($c['label']).'</a></p>'; }
        elseif (in_array($route, ['blog','listeler','rehberler','gecis-rehberleri','is-akislari'], true)) {
            [$items,$prefix] = match($route) {'blog'=>[$catalog['articles'],'blog'],'listeler'=>[$catalog['lists'],'liste'],'is-akislari'=>[$content['workflows'],'is-akisi'],default=>[$content['guides'],'rehber']};
            foreach ($items as $entry) echo '<article><h2><a href="'.self::e($base.'/'.$prefix.'/'.$entry['id']).'">'.self::e($entry['title']).'</a></h2><p>'.self::e($entry['summary'] ?? $entry['description'] ?? '').'</p></article>';
        } elseif (in_array($route, ['yontem','hakkimizda','gizlilik','duzeltme-politikasi'], true)) self::policy($route);
        elseif ($route==='submit-app') echo '<p>'.self::e(Localization::t('tr','submissionNotice')).'</p>';
        elseif ($private || in_array($route,['karsilastir','araclar'],true)) echo '<p>Bu sayfanın seçim, hesaplama ve kişisel tercih özellikleri JavaScript ile çalışır. Kaydedilen uygulamalar ve tema tercihleri tarayıcında saklanır. Yönetim işlemleri sunucudaki yetkili oturumu gerektirir.</p>';
        else self::apps($tagExists ? array_values(array_filter($catalog['apps'], fn($a) => in_array($id, $a['tags'] ?? [], true))) : $catalog['apps'], $base);
        if(!$parts)self::moduleCards($catalog,$config);
        echo '</main><footer>'.Branding::link($config,Config::url($config,'tr'));
        if (($config['site']['show_credit'] ?? true) !== false) echo '<p><a href="https://softwexa.com" rel="nofollow">Softwexa</a> tarafından geliştirilmiştir.</p>';
        echo '<a href="'.self::e($base.'/gizlilik').'">Gizlilik</a> · <a href="'.self::e($base.'/yontem').'">Yöntem</a></footer></div></div>'; 
        if ($valid) {
            $display = $catalog; unset($display['translations'],$display['growth'],$display['growthLifecycle'],$display['extensionCardsByLocale']);
            foreach ($display['apps'] as &$a) if (str_starts_with($a['icon'] ?? '', '/') && !str_starts_with($a['icon'], '//')) $a['icon'] = $base.$a['icon'];
            unset($a);
            $compare = is_string($query['apps'] ?? null) ? array_slice(array_values(array_unique(array_filter(explode(',', $query['apps']), fn($id) => self::find($catalog['apps'], $id) !== null))), 0, 4) : [];
            $payload = ['catalog'=>$display,'path'=>$parts,'initialQuery'=>is_string($query['q'] ?? null) ? mb_substr($query['q'],0,200) : '', 'initialPlatform'=>in_array($query['platform'] ?? '', ['android','ios','windows'], true) ? $query['platform'] : 'all', 'initialCategory'=>$route === 'kategori' ? $id : (is_string($query['category'] ?? null) && self::find($content['categories'], $query['category']) ? $query['category'] : 'all'), 'initialCompare'=>$compare,'initialCompareSpecified'=>is_string($query['apps'] ?? null),'basePath'=>$base,'admin'=>$admin,'siteName'=>$seo['siteName'],'branding'=>Branding::fromConfig($config),'showDeveloperCredit'=>($config['site']['show_credit'] ?? true) !== false,'locale'=>$config['localization']['defaultLocale']??'en','runtimeLocalePacks'=>$admin?LanguagePacks::runtimePackages():LanguagePacks::publicPackages($config['localization']['defaultLocale']??'en'),'localizedPaths'=>['/'=>'/tr'],'languageAlternates'=>self::navigationAlternates($catalog,$config,$parts,$query)];
            if($route==='submit-app'&&isset($config['_submissionConfig']))$payload['submissionConfig']=$config['_submissionConfig'];
            echo '<script id="wexa-bootstrap" type="application/json">'.self::json($payload).'</script><script defer src="'.self::e($scriptUrl).'"'.(!$admin?' fetchpriority="high"':'').'></script>';
        }
        if($valid&&!$admin)echo Performance::script($catalog,$config,$path);
        echo '</body></html>';
    }
    public static function languageAlternates(array $catalog,array $config,array $parts): array {
        $kind=['uygulama'=>'app','blog'=>'article','liste'=>'list'][$parts[0]??'']??null;
        if($kind&&count($parts)===2)return Localization::alternates($catalog,$config,$kind,$parts[1]);
        if(in_array('/'.implode('/',$parts),self::STATIC_PATHS,true)){$out=[];foreach(array_keys(Localization::packs())as$locale)if(Localization::enabled($config,$locale))$out[]=['locale'=>$locale,'label'=>Localization::language($locale)['label'],'href'=>Localization::url($config,$locale,$parts[0]??'')];return count($out)>1?$out:[];}return[];
    }
    /** Language navigation follows available content, independently of SEO approval. */
    public static function navigationAlternates(array $catalog,array $config,array $parts,array $query=[]):array {
        $kind=['uygulama'=>'app','blog'=>'article','liste'=>'list'][$parts[0]??'']??null;$out=[];$current=$config['_renderLocale']??'tr';
        foreach(array_keys(Localization::packs()) as $locale){if(!Localization::enabled($config,$locale))continue;$slug=$parts[1]??'';
            if($kind&&count($parts)===2){$translation=Localization::entry($catalog,$kind,$slug,$locale);if(!$translation)continue;$slug=$translation['slug'];}
            elseif(count($parts)>1){
                $group=['rehber'=>'guides','is-akisi'=>'workflows','kategori'=>'categories'][$parts[0]]??null;
                if($group){$content=Localization::availableContent($catalog,$locale);if(!in_array($slug,array_column($content[$group]??[],'id'),true))continue;}
                elseif($parts[0]==='etiket'){$key=Localization::tag($current,$slug)['id']??$slug;$slug=Localization::tagLabel($locale,$key);$found=false;foreach(Localization::localizedCatalog($catalog,$locale)['apps'] as $app)if(in_array($slug,$app['tags']??[],true)){$found=true;break;}if(!$found)continue;}
                elseif($parts[0]==='yayinci'){$found=false;foreach(Localization::localizedCatalog($catalog,$locale)['apps'] as $app)if(self::publisherSlug($app['publisher']??'')===$slug){$found=true;break;}if(!$found)continue;}
                else continue;
            }
            $url=Localization::url($config,$locale,$parts[0]??'',$slug);if(!$url)continue;$localizedQuery=$query;if(is_string($query['tag']??null)&&($tag=Localization::tag($current,$query['tag'])))$localizedQuery['tag']=Localization::tagLabel($locale,$tag['id']);if($localizedQuery)$url.='?'.http_build_query($localizedQuery,'','&',PHP_QUERY_RFC3986);$out[]=['locale'=>$locale,'label'=>Localization::language($locale)['label'],'href'=>$url];
        }return count($out)>1?$out:[];
    }
    /** Graph uses visible source fields, never promotional SEO overrides or inferred ratings/prices. */
    public static function structuredData(array $catalog,array $config,array $content,array $parts,?array $item,string $title,string $description,string $canonical,?array $cover): array {
        $route=$parts[0]??''; $home=Localization::url($config,'tr'); $siteId=$home.'#website'; $pageId=$canonical.'#webpage';
        $seo=array_replace(SEOSettings::defaults($config),$config['seo']??[]);
        $graph=[['@type'=>'WebSite','@id'=>$siteId,'name'=>$seo['siteName'],'url'=>$home,'inLanguage'=>'tr']];
        $page=['@type'=>'WebPage','@id'=>$pageId,'url'=>$canonical,'name'=>$title,'description'=>$description,'inLanguage'=>'tr','isPartOf'=>['@id'=>$siteId]];
        if ($route==='hakkimizda') $page['@type']='AboutPage';
        if ($parts) {
            $crumbs=[['@type'=>'ListItem','position'=>1,'name'=>$seo['siteName'],'item'=>$home]];
            $parent=['uygulama'=>'kesfet','blog'=>'blog','liste'=>'listeler','kategori'=>'kategoriler','yayinci'=>'yayincilar','rehber'=>'rehberler','is-akisi'=>'is-akislari'][$route]??null;
            if ($item && $parent) $crumbs[]=['@type'=>'ListItem','position'=>2,'name'=>$content['pageNames'][$parent]??$parent,'item'=>Config::url($config,$parent)];
            $crumbs[]=['@type'=>'ListItem','position'=>count($crumbs)+1,'name'=>$title,'item'=>$canonical];
            $graph[]=['@type'=>'BreadcrumbList','@id'=>$canonical.'#breadcrumb','itemListElement'=>$crumbs];
            $page['breadcrumb']=['@id'=>$canonical.'#breadcrumb'];
        }
        if ($route==='uygulama' && $item) {
            $app=['@type'=>'SoftwareApplication','@id'=>$canonical.'#software','name'=>$item['name'],'description'=>$item['description'],'url'=>$canonical,'mainEntityOfPage'=>['@id'=>$pageId],'operatingSystem'=>array_map(fn($p)=>$content['platformLabels'][$p]??$p,$item['platforms'])];
            if (self::httpUrl($item['website']??'')) $app['sameAs']=$item['website'];
            $graph[]=$app; $page['mainEntity']=['@id'=>$app['@id']];
        }
        if ($route==='blog' && $item) {
            $article=['@type'=>'BlogPosting','@id'=>$canonical.'#article','headline'=>$item['title'],'description'=>$item['summary'],'url'=>$canonical,'mainEntityOfPage'=>['@id'=>$pageId],'inLanguage'=>'tr'];
            // A free-text byline does not establish whether the author is a person or organization.
            if (trim($item['author']??'')!=='') $article['author']=['name'=>$item['author']];
            foreach (['publishedAt'=>'datePublished','updatedAt'=>'dateModified'] as $field=>$property) if (self::isoDate($item[$field]??'')) $article[$property]=$item[$field];
            $citations=array_values(array_filter(array_column($item['sources']??[],'url'),[self::class,'httpUrl']));
            if ($citations) $article['citation']=$citations;
            if ($cover) {
                $image=['@type'=>'ImageObject','@id'=>$canonical.'#primaryimage','url'=>$cover['url'],'contentUrl'=>$cover['url'],'caption'=>trim($cover['caption']??'')?:'Yapay zekâ ile oluşturulmuş temsili görsel.'];
                $graph[]=$image; $article['image']=['@id'=>$image['@id']]; $page['primaryImageOfPage']=['@id'=>$image['@id']];
            }
            $inline=[];foreach($item['images']??[] as $image)if(in_array($image['assetId'],ArticleContent::imageIds($item),true)){
                $url=Config::url($config,'media/'.$image['assetId'].'.'.$image['format']);$node=['@type'=>'ImageObject','@id'=>$canonical.'#image-'.$image['assetId'],'url'=>$url,'contentUrl'=>$url,'description'=>$image['alt'],'width'=>$image['width'],'height'=>$image['height']];if($image['caption']!=='')$node['caption']=$image['caption'];$graph[]=$node;$inline[]=['@id'=>$node['@id']];
            }if($inline)$article['image']=array_merge(isset($article['image'])?[$article['image']]:[],$inline);
            $graph[]=$article; $page['mainEntity']=['@id'=>$article['@id']];
        }
        $entries=[]; $collection=false;
        if ($route==='liste' && $item) {
            $collection=true;
            foreach ($item['entries']??[] as $entry) { $app=self::find($catalog['apps'],$entry['appId']); if ($app) $entries[]=['name'=>$app['name'],'url'=>Config::url($config,'uygulama/'.rawurlencode($app['id']))]; }
        } elseif ($route==='kategori' && $item) {
            $collection=true;
            foreach ($catalog['apps'] as $app) if (($app['category']??'')===$item['id']) $entries[]=['name'=>$app['name'],'url'=>Config::url($config,'uygulama/'.rawurlencode($app['id']))];
        } elseif ($route==='yayinci' && $item) {
            $collection=true;
            foreach ($item['apps'] as $app) $entries[]=['name'=>$app['name'],'url'=>Config::url($config,'uygulama/'.rawurlencode($app['id']))];
        } elseif (count($parts)===1 && in_array($route,['blog','listeler','kesfet'],true)) {
            $collection=true; [$items,$prefix]=match($route){'blog'=>[$catalog['articles'],'blog'],'listeler'=>[$catalog['lists'],'liste'],default=>[$catalog['apps'],'uygulama']};
            foreach ($items as $entry) $entries[]=['name'=>$entry['title']??$entry['name'],'url'=>Config::url($config,$prefix.'/'.rawurlencode($entry['id']))];
        }
        if ($collection) {
            $page['@type']='CollectionPage'; $listId=$canonical.'#itemlist'; $elements=[];
            foreach ($entries as $entry) $elements[]=['@type'=>'ListItem','position'=>count($elements)+1,'name'=>$entry['name'],'url'=>$entry['url']];
            $graph[]=['@type'=>'ItemList','@id'=>$listId,'name'=>$title,'numberOfItems'=>count($elements),'itemListOrder'=>'https://schema.org/ItemListUnordered','itemListElement'=>$elements];
            $page['mainEntity']=['@id'=>$listId];
        }
        $graph[]=$page;
        return ['@context'=>'https://schema.org','@graph'=>$graph];
    }
    private static function httpUrl(mixed $url): bool { return is_string($url) && filter_var($url,FILTER_VALIDATE_URL)!==false && in_array(strtolower(parse_url($url,PHP_URL_SCHEME)??''),['http','https'],true); }
    private static function isoDate(string $value): bool {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/D',$value,$m) || !checkdate((int)$m[2],(int)$m[3],(int)$m[1])) return false;
        return strtotime($value)!==false;
    }
    private static function apps(array $apps, string $base): void {
        foreach ($apps as $app) echo '<article><h2><a href="'.self::e($base.'/uygulama/'.rawurlencode($app['id'])).'">'.self::e($app['name']).'</a></h2><p>'.self::e($app['description']).'</p><p>'.self::e($app['publisher'] ?? '').' · '.self::e(implode(', ', $app['platforms'])).'</p></article>';
    }
    private static function detail(string $route, array $item, array $catalog, array $content, string $base): void {
        if ($route === 'blog') echo '<p>'.self::e($item['author'] ?? '').' · Yayın: '.self::e($item['publishedAt'] ?? '').' · Güncelleme: '.self::e($item['updatedAt'] ?? '').'</p>';
        if ($route === 'yayinci') { self::apps($item['apps'], $base); return; }
        if ($route === 'kategori') { self::apps(array_values(array_filter($catalog['apps'], fn($a) => $a['category'] === $item['id'])), $base); return; }
        if ($route === 'uygulama') {
            AppScreenshots::render($item,['site'=>['url'=>$base]],'tr');
            echo '<p>Yayıncı: '.self::e($item['publisher']).'</p><p>Platformlar: '.self::e(implode(', ', array_map(fn($p) => $content['platformLabels'][$p] ?? $p, $item['platforms']))).'</p><p><a rel="noopener noreferrer" href="'.self::e($item['website']).'">Resmî yayıncı sitesi</a></p>';
            foreach ($item['facts'] ?? [] as $fact) echo '<section><h2>'.self::e($content['factLabels'][$fact['key']] ?? $fact['key'] ?? 'Özellik').'</h2><p>'.self::e($fact['detail'] ?? '').'</p><p>'.self::e($fact['platform'] ?? '').' · '.self::e($fact['state'] ?? '').' · '.self::e($fact['checkedAt'] ?? '').'</p><p><a rel="noopener noreferrer" href="'.self::e($fact['sourceUrl'] ?? $item['website']).'">Kaynak</a> · '.self::e($content['evidenceLabels'][$fact['evidence'] ?? ''] ?? $fact['evidence'] ?? '').'</p></section>';
        }
        foreach ($item['sections'] ?? [] as $section) { echo '<section><h2>'.self::e($section['heading']).'</h2>'; foreach ($section['paragraphs'] as $p) echo '<p>'.self::e($p).'</p>'; echo '</section>'; }
        if (!empty($item['steps'])) { echo '<ol>'; foreach ($item['steps'] as $step) echo '<li>'.self::e(is_string($step) ? $step : ($step['title'].': '.$step['description'])).'</li>'; echo '</ol>'; }
        if (!empty($item['method'])) echo '<p>Yöntem: '.self::e($item['method']).'</p>';
        foreach ($item['entries'] ?? [] as $entry) { $app = self::find($catalog['apps'], $entry['appId']); if ($app) echo '<section><h2><a href="'.self::e($base.'/uygulama/'.rawurlencode($app['id'])).'">'.self::e($app['name']).'</a></h2><p>'.self::e($entry['reason']).'</p></section>'; }
        foreach ($item['sources'] ?? [] as $source) echo '<p><a rel="noopener noreferrer" href="'.self::e($source['url']).'">'.self::e($source['title'] ?? $source['url']).'</a></p>';
        foreach ($item['appIds'] ?? [] as $appId) { $app = self::find($catalog['apps'], $appId); if ($app) self::apps([$app], $base); }
    }
    private static function policy(string $route): void {
        $text = match($route) {
            'hakkimizda'=>'WexaShelf, Softwexa tarafından geliştirilen uygulama keşif ve karşılaştırma yazılımıdır. Bu yazılımı kullanan siteler farklı işletmeciler tarafından yönetilebilir. Yazılım geliştiricisi bilgisi, kurulumun site işletmecisini veya veri sorumlusunu belirtmez. Katalog bütün mağazaları veya bütün uygulamaları kapsamaz.',
            'gizlilik'=>'Kaydedilen uygulamalar, karşılaştırma seçimi ve tema tercihleri bu tarayıcının localStorage alanında tutulur. Yönetim oturumu sunucunun doğruladığı bir çerez kullanır. İçerik ve düzeltme bildirimleri kurulumun veritabanında saklanır. Düzeltme formuna parola, ödeme bilgisi veya başka kişilere ait özel bilgi yazma. Haricî yayıncı ve mağaza bağlantılarının kendi gizlilik koşulları vardır.',
            'yontem'=>'Resmî belgelerden derlenen bilgi, uygulamalı editör testi olarak sunulmaz. Doğrulanmamış bilgi yok veya ücretsiz olarak yorumlanmaz. Mağazada listelenme, platform desteği ve özellik kapsamı ayrı değerlendirilir. Editör seçkileri indirme sıralaması değildir. Karşılaştırma ve maliyet hesapları kayıtlı bilgilerle sınırlıdır.',
            default=>'Hatalı veya eski bilgiyi uygulama ayrıntısındaki düzeltme formuyla bildir. Alanı, açıklamayı ve mümkünse resmî kaynak adresini belirt. Bildirim doğrudan yayımlanmaz; yönetim kuyruğunda incelenir. Kabul edilen değişiklik yeni kayıt sürümü oluşturur. Önemli değişikliklerde indeks onayı yeniden incelemeye kadar kaldırılır.'
        };
        echo '<p>'.self::e($text).'</p>';
    }
    public static function robots(array $config): string {
        $base = Config::basePath($config);
        if (!self::enabled($config)) return "User-agent: *\nDisallow: ".($base ?: '/')."\n";
        $out = "User-agent: *\n";
        foreach (array_merge(self::PRIVATE_ROUTES, ['api','kurulum','install']) as $route) $out .= 'Disallow: '.$base.'/'.$route."\n";
        return $out.'Sitemap: '.Config::url($config, 'sitemap.xml')."\n";
    }
    public static function sitemap(array $catalog, array $config): string {
        $paths = []; $modified = [];
        if(self::enabled($config))foreach(array_keys(Localization::packs()) as $locale){
            if(!Localization::enabled($config,$locale))continue;
            foreach(self::STATIC_PATHS as $static){$path=Localization::path($locale,trim($static,'/'));if($path)$paths[]=$path;}
            $indexes=[];
            foreach(Localization::entries($catalog,$locale) as $entry){
                if(!Localization::indexableEntry($entry,$catalog))continue;
                $route=['app'=>'uygulama','article'=>'blog','list'=>'liste'][$entry['kind']];$path=Localization::path($locale,$route,$entry['slug']);if(!$path)continue;$paths[]=$path;
                if(!empty($entry['updatedAt'])&&strtotime($entry['updatedAt'])!==false)$modified[$path]=gmdate('c',strtotime($entry['updatedAt']));
                if($entry['kind']==='article')$indexes['blog']=true;if($entry['kind']==='list')$indexes['listeler']=true;
            }
            foreach(array_keys($indexes) as $route){$path=Localization::path($locale,$route);if($path)$paths[]=$path;}
        }
        if (self::enabled($config)) foreach(GrowthSite::sitemapEntries($catalog['growth']??[],$config,$catalog['growthLifecycle']??[]) as $entry) { $path=substr($entry['url'],strlen(rtrim(Config::url($config),'/')));$paths[]=$path;if(strtotime($entry['updatedAt'])!==false)$modified[$path]=gmdate('c',strtotime($entry['updatedAt'])); }
        $paths=array_values(array_filter($paths,fn($path)=>!in_array($path,array_column($catalog['growthLifecycle']??[],'from'),true)));
        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        foreach (array_unique($paths) as $path) $xml .= '<url><loc>'.self::e(Config::url($config, $path)).'</loc>'.(isset($modified[$path]) ? '<lastmod>'.self::e($modified[$path]).'</lastmod>' : '').'</url>';
        return $xml.'</urlset>';
    }
}
