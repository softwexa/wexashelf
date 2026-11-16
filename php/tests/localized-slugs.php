<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{LanguagePacks,Localization,PublicSite,SEOSettings};
function slugCheck(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
function slugHtml(array $catalog,array $config,string $path):string{http_response_code(200);ob_start();PublicSite::render($catalog,$config,$path,[]);return ob_get_clean();}
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>true],'seo'=>SEOSettings::defaults(['site'=>['indexing'=>true]]),'localization'=>['defaultLocale'=>'en','locales'=>[['code'=>'en','enabled'=>true],['code'=>'tr','enabled'=>true]]]];
$app=['id'=>'stable-tool','name'=>'Örnek araç','description'=>'Türkçe kaynak açıklaması.','publisher'=>'Example Publisher','website'=>'https://example.org','platforms'=>['android'],'category'=>'productivity','tags'=>['açık kaynak','custom owner tag'],'icon'=>'/app-icons/notion.jpg','facts'=>[],'seo'=>['noindex'=>false]];
$english=array_replace($app,['name'=>'Example tool','description'=>'English description.','tags'=>['open source','custom owner tag']]);
$translation=['kind'=>'app','id'=>$app['id'],'locale'=>'en','slug'=>'example-tool','status'=>'published','publishAt'=>null,'revision'=>1,'sourceRevision'=>1,'sourceFingerprint'=>'same','seoApproved'=>true,'updatedAt'=>'2026-11-01T00:00:00Z','data'=>$english];
$catalog=['apps'=>[$app],'articles'=>[],'lists'=>[],'records'=>[['kind'=>'app','id'=>$app['id'],'sourceLocale'=>'tr','revision'=>1,'sourceFingerprint'=>'same','seoApproved'=>true,'updatedAt'=>'2026-11-01T00:00:00Z']],'translations'=>[$translation]];
// Static examples need real published app references in every rendered locale.
$content=Localization::content('en');$references=[];
foreach($content['guides'] as $guide)if($guide['id']==='notes-migration')$references=array_merge($references,$guide['appIds']);
foreach($content['workflows'] as $flow)if($flow['id']==='research')$references=array_merge($references,array_column($flow['steps'],'appId'));
foreach(array_unique($references) as $id){
    $sourceApp=array_replace($app,['id'=>$id,'name'=>'Fixture '.$id,'tags'=>[]]);
    $catalog['apps'][]=$sourceApp;
    $catalog['records'][]=array_replace($catalog['records'][0],['id'=>$id]);
    $catalog['translations'][]=array_replace($translation,['id'=>$id,'slug'=>$id,'data'=>array_replace($sourceApp,['description'=>'English fixture reference.'])]);
}
// Independent authored content remains available even when bundled references disappear.
$authored=['id'=>'independent-article','title'=>'Independent authored article','summary'=>'A fixture article independent of bundled app examples.','author'=>'Synthetic editor','publishedAt'=>'2026-11-01','sections'=>[['heading'=>'Authored content','paragraphs'=>['This independent article remains available.']]],'sources'=>[],'appIds'=>[],'seo'=>['noindex'=>false]];
$catalog['articles'][]=$authored;
$catalog['records'][]=array_replace($catalog['records'][0],['kind'=>'article','id'=>$authored['id']]);
$catalog['translations'][]=array_replace($translation,['kind'=>'article','id'=>$authored['id'],'slug'=>$authored['id'],'data'=>$authored]);
$authoredList=['id'=>'independent-list','title'=>'Independent authored list','summary'=>'An independent fixture selection.','method'=>'Explicit editorial review.','period'=>'evergreen','entries'=>[],'publishedAt'=>'2026-11-01','seo'=>['noindex'=>false]];
$catalog['lists'][]=$authoredList;
$catalog['records'][]=array_replace($catalog['records'][0],['kind'=>'list','id'=>$authoredList['id']]);
$catalog['translations'][]=array_replace($translation,['kind'=>'list','id'=>$authoredList['id'],'slug'=>$authoredList['id'],'data'=>$authoredList]);
$before=json_encode($catalog);
$pairs=[['kategori','productivity','/en/categories/productivity','/kategori/verimlilik','/kategori/productivity'],['rehber','notes-migration','/en/guides/notes-migration','/rehber/notlarini-tasi','/rehber/notes-migration'],['is-akisi','research','/en/workflows/research','/is-akisi/arastirma','/is-akisi/research'],['etiket','açık kaynak','/en/tags/open-source','/etiket/acik-kaynak','/etiket/a%C3%A7%C4%B1k%20kaynak']];
foreach($pairs as [$route,$id,$en,$tr,$legacy]){
    slugCheck(Localization::path('en',$route,$id)===$en&&Localization::path('tr',$route,$id)===$tr,'Declared locale slug pair '.$route);
    slugCheck(Localization::canonicalAlias($legacy)===$tr&&Localization::canonicalAlias($tr)===null,'One-step legacy alias '.$route);
    foreach(['en'=>$en,'tr'=>$tr] as $locale=>$path){
        $html=slugHtml($catalog,$config,$path);slugCheck(http_response_code()===200,'Localized route renders '.$path);
        slugCheck(str_contains($html,'<html lang="'.$locale.'"')&&str_contains($html,'rel="canonical" href="https://catalog.example.org/sub'.$path.'"'),'Self canonical and language '.$path);
        foreach([$en,$tr] as $target)slugCheck(str_contains($html,'href="https://catalog.example.org/sub'.$target.'"'),'Available reciprocal language navigation '.$path);
        slugCheck(str_contains($html,'content="noindex, follow"'),'Taxonomy/editorial utility approval policy unchanged '.$path);
    }
}
slugCheck(Localization::tagValues('en','open-source')===['açık kaynak','open source'],'Stored/source and presentation tag values are explicit');
slugCheck(Localization::tagValues('en','custom owner tag')===['custom owner tag'],'Unknown tag is not translated');
slugCheck(Localization::path('en','etiket','custom owner tag')==='/en/tags/custom%20owner%20tag','Unknown owner tag keeps its text');
$catalog['publisherDirectory']=[['slug'=>'outside-initial-page','name'=>'Outside page','appCount'=>1,'platforms'=>['android']]];
$paths=Localization::paths($catalog,'en');slugCheck($paths['/etiket/open source']==='/en/tags/open-source'&&$paths['/yayinci/outside-initial-page']==='/en/publishers/outside-initial-page','Tag and bounded directory path maps');unset($catalog['publisherDirectory']);
$publisher=PublicSite::publisherSlug($app['publisher']);$nav=PublicSite::navigationAlternates($catalog,array_replace($config,['_renderLocale'=>'en']),['yayinci',$publisher]);slugCheck(count($nav)===2,'Publisher language navigation preserves identity');
$recordHtml=slugHtml($catalog,$config,'/en/apps/example-tool');slugCheck(str_contains($recordHtml,'hreflang="tr" href="https://catalog.example.org/sub/uygulama/stable-tool"'),'Managed translated slug retains reciprocal original URL');
slugCheck(json_encode($catalog)===$before,'Rendering did not mutate source records, tags or approval');

// Empty and partial public locales fail closed without hiding independent authored content.
foreach(['empty','partial','untranslated'] as $scenario){
    $unavailable=$catalog;
    if($scenario==='empty'){$unavailable['apps']=[];$unavailable['translations']=array_values(array_filter($unavailable['translations'],fn($row)=>$row['kind']!=='app'));}
    elseif($scenario==='partial'){$unavailable['apps']=array_values(array_filter($unavailable['apps'],fn($row)=>$row['id']!=='obsidian'));$unavailable['translations']=array_values(array_filter($unavailable['translations'],fn($row)=>$row['kind']!=='app'||$row['id']!=='obsidian'));}
    else $unavailable['translations']=array_values(array_filter($unavailable['translations'],fn($row)=>$row['kind']!=='app'||$row['id']!=='obsidian'));
    foreach(['/en/guides/notes-migration','/en/workflows/research'] as $path){
        $html=slugHtml($unavailable,$config,$path);
        slugCheck(http_response_code()===404&&str_contains($html,'noindex'),'Missing reference fails closed '.$scenario.' '.$path);
        slugCheck(!str_contains($html,'rel="canonical"')&&!str_contains($html,'rel="alternate"')&&!str_contains($html,'data-language-link'),'Unavailable detail emits no canonical or alternate '.$scenario);
    }
    $available=Localization::availableContent($unavailable,'en');
    slugCheck(!in_array('notes-migration',array_column($available['guides'],'id'),true)&&!in_array('research',array_column($available['workflows'],'id'),true),'Unavailable examples absent from content directories '.$scenario);
    $articleHtml=slugHtml($unavailable,$config,'/en/blog/independent-article');
    slugCheck(http_response_code()===200&&str_contains($articleHtml,'Independent authored article'),'Independent authored article preserved '.$scenario);
    $listHtml=slugHtml($unavailable,$config,'/en/lists/independent-list');
    slugCheck(http_response_code()===200&&str_contains($listHtml,'Independent authored list'),'Independent authored list preserved '.$scenario);
    if($scenario==='untranslated')slugCheck(count(Localization::availableContent($unavailable,'tr')['guides'])>count($available['guides']),'Source availability does not imply translated availability');
}

// A private in-memory-style fixture represents an installed complete 0.7 pack,
// without the new optional metadata. No real installation or database is used.
$storage=sys_get_temp_dir().'/wexa-legacy-slugs-'.bin2hex(random_bytes(6));mkdir($storage,0700);$old=getenv('WEXA_STORAGE_PATH');putenv('WEXA_STORAGE_PATH='.$storage);
try{
    $pack=['schemaVersion'=>1,'locale'=>'de'];foreach(['ui','content','server'] as $part)$pack[$part]=json_decode(file_get_contents(__DIR__.'/../resources/'.$part.'.en.json'),true,512,JSON_THROW_ON_ERROR);
    $pack['ui']['locale']='de';$pack['ui']['label']='Synthetic legacy German';$pack['ui']['intlLocale']='de-DE';unset($pack['content']['tags']);foreach(['categories','guides','workflows'] as $group)foreach($pack['content'][$group] as &$entry)unset($entry['slug']);unset($entry);
    $preview=LanguagePacks::preview($pack);slugCheck($preview['valid'],'Legacy complete package accepted: '.implode('; ',$preview['issues']));
    file_put_contents($storage.'/language-packs.json',json_encode(['revision'=>1,'packages'=>['de'=>['package'=>$pack,'checksum'=>$preview['checksum'],'enabled'=>true]]]));chmod($storage.'/language-packs.json',0600);
    slugCheck(LanguagePacks::runtimePackage('de')!==null&&Localization::complete('de'),'Legacy checksum package loads without migration');
    slugCheck(Localization::path('de','rehber','notes-migration')==='/de/guides/notes-migration','Legacy pack retains declared old ID route');
    foreach($catalog['translations'] as $row)if($row['locale']==='en'&&$row['kind']==='app'&&$row['id']!=='stable-tool')$catalog['translations'][]=array_replace($row,['locale'=>'de']);
    $config['localization']['locales'][]=['code'=>'de','enabled'=>true];$legacyHtml=slugHtml($catalog,$config,'/de/guides/notes-migration');slugCheck(http_response_code()===200&&str_contains($legacyHtml,'lang="de"'),'Legacy runtime package renders');
    $german=array_replace($translation,['locale'=>'de','slug'=>'synthetic-tool']);$catalog['translations'][]=$german;$catalog['translations'][0]['seoApproved']=false;
    $unapproved=slugHtml($catalog,$config,'/en/apps/example-tool');preg_match('~<head>(.*?)</head>~s',$unapproved,$head);slugCheck(!str_contains($head[1],'rel="alternate"')&&str_contains($unapproved,'content="noindex, follow"'),'Unapproved current language cannot emit other-language cluster without self');
    $bad=$pack;$bad['content']['guides'][0]['slug']='../admin';slugCheck(!LanguagePacks::preview($bad)['valid'],'Unsafe optional slug rejected');
    $bad=$pack;$bad['content']['tags']=null;slugCheck(!LanguagePacks::preview($bad)['valid'],'Optional field means omitted, not malformed null');
}finally{unlink($storage.'/language-packs.json');rmdir($storage);putenv($old===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$old);}
echo "PASS localized slugs: stable IDs/source tags, explicit EN/TR static/tag paths, canonical/lang/navigation, legacy aliases, bounded publisher links, unknown-tag preservation, legacy runtime pack/checksum, unsafe slug rejection, unapproved current-language hreflang guard, empty/partial/untranslated reference404 and independent authored content.\n";
