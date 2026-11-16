<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Localization,PublicSite,SEOSettings,Translations};
function sourceCheck(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
function sourceHtml(array $catalog,array $config,string $path):string{http_response_code(200);ob_start();PublicSite::render($catalog,$config,$path,[]);return ob_get_clean();}
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>true],'seo'=>SEOSettings::defaults(['site'=>['indexing'=>true]]),'localization'=>Translations::defaults()];
$app=['id'=>'english-original','name'=>'English original','description'=>'Original English description','publisher'=>'Example','website'=>'https://example.org','platforms'=>['android'],'category'=>'notes','tags'=>[],'icon'=>'/icons/notion.jpg','facts'=>[],'seo'=>['noindex'=>false]];
$record=['kind'=>'app','id'=>$app['id'],'sourceLocale'=>'en','revision'=>1,'sourceFingerprint'=>'same','seoApproved'=>true,'updatedAt'=>'2026-11-16T12:00:00Z'];
$catalog=['apps'=>[$app],'articles'=>[],'lists'=>[],'records'=>[$record],'translations'=>[],'serverCatalog'=>true,'pagination'=>['page'=>1,'total'=>1]];
sourceCheck(Localization::localizedCatalog($catalog,'tr')['apps']===[],'English original must not appear in Turkish catalog');
sourceCheck(Localization::localizedCatalog($catalog,'en')['apps']===[$app],'English original requires no Turkish source stub');
sourceCheck(Localization::localizedCatalog($catalog,'en')['pagination']===$catalog['pagination'],'Bounded catalog metadata preserved');
$en=sourceHtml($catalog,$config,'/en/apps/english-original');sourceCheck(http_response_code()===200&&str_contains($en,'<h1>English original</h1>'),'English original rendered');
sourceCheck(str_contains($en,'rel="canonical" href="https://catalog.example.org/sub/en/apps/english-original"')&&str_contains($en,'content="index, follow"'),'English original self canonical and SEO approval');
$missing=sourceHtml($catalog,$config,'/uygulama/english-original');sourceCheck(http_response_code()===404&&!str_contains($missing,'Original English description'),'No English content at Turkish source URL');
$xml=PublicSite::sitemap($catalog,$config);sourceCheck(str_contains($xml,'/en/apps/english-original</loc>')&&!str_contains($xml,'/uygulama/english-original'),'Original source sitemap without translation cluster');
sourceCheck(Localization::alternates($catalog,$config,'app',$app['id'])===[],'Single-language original does not invent alternates');
$tr=array_replace($app,['name'=>'Türkçe çeviri','description'=>'Türkçe açıklama']);
$translation=['kind'=>'app','id'=>$app['id'],'locale'=>'tr','slug'=>'turkce-ceviri','status'=>'published','publishAt'=>null,'revision'=>1,'sourceRevision'=>1,'sourceFingerprint'=>'same','stale'=>false,'seoApproved'=>true,'updatedAt'=>'2026-11-16T12:30:00Z','data'=>$tr];$catalog['translations'][]=$translation;
sourceCheck(Localization::paths($catalog,'tr')['/uygulama/english-original']==='/uygulama/turkce-ceviri','Turkish overlay uses localized slug');
$trHtml=sourceHtml($catalog,$config,'/uygulama/turkce-ceviri');$enHtml=sourceHtml($catalog,$config,'/en/apps/english-original');
foreach(Localization::alternates($catalog,$config,'app',$app['id']) as $alternate){$tag='hreflang="'.$alternate['locale'].'" href="'.$alternate['href'].'"';sourceCheck(str_contains($trHtml,$tag)&&str_contains($enHtml,$tag),'Source and overlay reciprocal alternates');}
sourceCheck(str_contains($trHtml,'<h1>Türkçe çeviri</h1>')&&!str_contains($trHtml,'Original English description'),'Explicit Turkish overlay, no English fallback');
sourceCheck(str_contains(sourceHtml($catalog,$config,'/kesfet'),'href="https://catalog.example.org/sub/uygulama/turkce-ceviri"'),'Turkish listing links to overlay slug');
sourceCheck(str_contains(PublicSite::sitemap($catalog,$config),'/uygulama/turkce-ceviri</loc>'),'Turkish overlay sitemap');
$catalog['records'][0]['sourceFingerprint']='changed';$stale=sourceHtml($catalog,$config,'/uygulama/turkce-ceviri');sourceCheck(str_contains($stale,'content="noindex, follow"'),'Stale overlay noindex');sourceCheck(!str_contains(PublicSite::sitemap($catalog,$config),'/uygulama/turkce-ceviri</loc>'),'Stale overlay excluded sitemap');sourceCheck(str_contains(PublicSite::sitemap($catalog,$config),'/en/apps/english-original</loc>'),'Original source remains indexable');
$catalog['translations'][0]['locale']='en';sourceCheck(Localization::translations($catalog,'en')===[],'Invalid same-source overlay never overrides original');
sourceCheck(Localization::route('/uygulama/invalid%2Fslug')===null&&Localization::route('/uygulama/a/b')===null,'Turkish malformed URL rejected');
unset($catalog['records'][0]['sourceLocale']);sourceCheck(Localization::localizedCatalog($catalog,'tr')['apps']===[$app],'Legacy absent source language stays Turkish');
echo "PASS mixed source locales: original EN without TR stub, explicit TR overlay, legacy TR, reciprocal SEO, stale gates, slug links, pagination metadata.\n";
