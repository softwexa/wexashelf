<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{PublicSite,SEOSettings};
function schemaCheck(bool $ok,string $message):void {if(!$ok)throw new RuntimeException($message);}
$seed=json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR);
$catalog=['apps'=>[],'articles'=>[],'lists'=>[],'records'=>[]];
foreach($seed['records'] as $r){$catalog[['app'=>'apps','article'=>'articles','list'=>'lists'][$r['kind']]][]=$r['data'];$catalog['records'][]=$r;}
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>false],'seo'=>SEOSettings::defaults()];
$routes=['/tr','/uygulama/'.$catalog['apps'][0]['id'],'/blog/'.$catalog['articles'][0]['id'],'/liste/'.$catalog['lists'][0]['id'],'/kategori/'.$catalog['apps'][0]['category']];
foreach($routes as $route){
 ob_start();PublicSite::render($catalog,$config,$route,[]);$html=ob_get_clean();
 schemaCheck((bool)preg_match('~<script type="application/ld\+json">(.*?)</script>~s',$html,$match),'JSON-LD '.$route);
 $json=json_decode($match[1],true,512,JSON_THROW_ON_ERROR);schemaCheck($json['@context']==='https://schema.org','Context');$graph=$json['@graph'];$ids=array_column($graph,'@id');schemaCheck(count($ids)===count(array_unique($ids)),'Unique IDs');
 $byType=[];foreach($graph as $node){$byType[$node['@type']]=$node;schemaCheck(str_starts_with($node['@id'],'https://catalog.example.org/sub/'),'Absolute scoped ID');}
 $page=$byType['WebPage']??$byType['CollectionPage'];schemaCheck($page['isPartOf']['@id']===$byType['WebSite']['@id'],'Connected site/page');schemaCheck(str_contains($html,'<h1>'.htmlspecialchars($page['name'],ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'</h1>'),'Visible page name');
 if($route!=='/tr'){schemaCheck($page['breadcrumb']['@id']===$byType['BreadcrumbList']['@id'],'Connected breadcrumb');$positions=array_column($byType['BreadcrumbList']['itemListElement'],'position');schemaCheck($positions===range(1,count($positions)),'Breadcrumb sequence');}
 if(isset($byType['SoftwareApplication'])){schemaCheck(!isset($byType['SoftwareApplication']['offers'])&&!isset($byType['SoftwareApplication']['aggregateRating']),'No invented commercial evidence');schemaCheck($page['mainEntity']['@id']===$byType['SoftwareApplication']['@id'],'App entity');}
 if(isset($byType['BlogPosting'])){schemaCheck(!isset($byType['BlogPosting']['author']['@type']),'Do not guess author identity type');schemaCheck(!isset($byType['BlogPosting']['image']),'No generic article image');schemaCheck($byType['BlogPosting']['headline']===$catalog['articles'][0]['title'],'Visible article title');}
 if(isset($byType['ItemList'])){schemaCheck($byType['ItemList']['numberOfItems']===count($byType['ItemList']['itemListElement']),'Item count');foreach($byType['ItemList']['itemListElement'] as $entry)schemaCheck(str_contains($html,htmlspecialchars(parse_url($entry['url'],PHP_URL_PATH),ENT_QUOTES,'UTF-8')),'List URL visible');}
}
foreach([['/yonetim',[]],['/blog/'.$catalog['articles'][0]['id'],['q'=>'filter']],['/not-found',[]]] as [$route,$query]){ob_start();PublicSite::render($catalog,$config,$route,$query);$html=ob_get_clean();schemaCheck(!str_contains($html,'application/ld+json'),'No schema private/query/404');}
$catalog['articles'][0]['publishedAt']='2026-02-31';$catalog['articles'][0]['updatedAt']='not-a-date';
ob_start();PublicSite::render($catalog,$config,'/blog/'.$catalog['articles'][0]['id'],[]);$html=ob_get_clean();preg_match('~<script type="application/ld\+json">(.*?)</script>~s',$html,$match);$graph=json_decode($match[1],true)['@graph'];foreach($graph as $node)if($node['@type']==='BlogPosting')schemaCheck(!isset($node['datePublished'])&&!isset($node['dateModified']),'Reject malformed dates');
echo "PASS schema graph: home/app/article/list/category, visible names/URLs, refs, dates, no invented offers/ratings/authors, private/query/404 gates.\n";
