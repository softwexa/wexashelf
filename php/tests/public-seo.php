<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{PublicSite,SEOSettings,Config};
function verify(bool $ok,string $label):void {if(!$ok)throw new RuntimeException($label);}
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>false],'seo'=>array_replace(SEOSettings::defaults(),['indexingEnabled'=>true,'titleSuffix'=>'Example','googleVerification'=>'token'])];
$article=['id'=>'sample','title'=>'Visible title','summary'=>'Visible summary','author'=>'Editor','publishedAt'=>'2026-11-01','updatedAt'=>'2026-11-02','sources'=>[],'sections'=>[],'appIds'=>[],'seo'=>['title'=>'Search title','description'=>'Search description','noindex'=>false]];
$catalog=['apps'=>[],'articles'=>[$article],'lists'=>[],'records'=>[['id'=>'sample','kind'=>'article','seoApproved'=>true,'updatedAt'=>'2026-11-03T12:00:00Z']]];
ob_start(); PublicSite::render($catalog,$config,'/blog/sample',[]); $html=ob_get_clean();
verify(str_contains($html,'<title>Search title | Example</title>'),'Meta title override');verify(str_contains($html,'<h1>Visible title</h1><p>Visible summary</p>'),'Visible fields preserved');verify(str_contains($html,'name="description" content="Search description"'),'Description override');verify(str_contains($html,'name="robots" content="index, follow"'),'Approved index');verify(str_contains($html,'BreadcrumbList'),'Breadcrumb');
$xml=PublicSite::sitemap($catalog,$config);verify(str_contains($xml,'/blog/sample</loc><lastmod>2026-11-03T12:00:00+00:00</lastmod>'),'Actual record lastmod');
$catalog['articles'][0]['seo']['noindex']=true;
verify(!str_contains(PublicSite::sitemap($catalog,$config),'/blog/sample'),'Manual noindex sitemap');
ob_start();PublicSite::render($catalog,$config,'/blog/sample',[]);$html=ob_get_clean();verify(str_contains($html,'name="robots" content="noindex, follow"'),'Manual noindex meta');
$catalog['articles'][0]['seo']['noindex']=false;$catalog['records'][0]['seoApproved']=false;verify(!str_contains(PublicSite::sitemap($catalog,$config),'/blog/sample'),'Noindex false cannot grant approval');
$catalog['articles'][0]['seo']['title']='x"><script>alert(1)</script>';$config['seo']['googleVerification']='x"><script>alert(2)</script>';
ob_start();PublicSite::render($catalog,$config,'/blog/sample',[]);$html=ob_get_clean();verify(!str_contains($html,'<script>alert('),'Escaped meta');
verify(str_contains(PublicSite::robots($config),'Disallow: /sub/kurulum'),'Installer robots');
$id=str_repeat('a',64);$catalog['articles'][0]['cover']=['assetId'=>$id,'alt'=>'Cover','aiGenerated'=>true];verify(PublicSite::publicMedia($catalog,$id),'Published media reference');verify(!PublicSite::publicMedia(['articles'=>[]],$id),'Unpublished media denied');verify(!PublicSite::publicMedia($catalog,'../secret'),'Media path denied');
$previous=getenv('WEXA_STORAGE_PATH');$temp=sys_get_temp_dir().'/wexa-public-seo-'.bin2hex(random_bytes(6));mkdir($temp.'/media',0700,true);putenv('WEXA_STORAGE_PATH='.$temp);
try {
    file_put_contents($temp.'/media/'.$id.'.png',base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII='));
    $catalog['articles'][0]['cover']['alt']='x" onerror="alert(1)';
    ob_start();PublicSite::render($catalog,$config,'/blog/sample',[]);$html=ob_get_clean();
    verify(str_contains($html,'https://catalog.example.org/sub/media/'.$id.'.png'),'Absolute cover URL');verify(str_contains($html,'<figure>')&&str_contains($html,'Yapay zekâ ile oluşturulmuş temsili görsel.'),'Generated caption');verify(!str_contains($html,'alt="x" onerror='),'Escaped cover alt');
} finally {unlink($temp.'/media/'.$id.'.png');rmdir($temp.'/media');rmdir($temp);putenv($previous===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$previous);}
$config['site']['url']='https://localhost/sub';verify(!str_contains(PublicSite::sitemap($catalog,$config),'<url>'),'Local fail closed');
echo "Public SEO: metadata/H1, noindex/approval, lastmod, breadcrumb, escaping and published media gates passed.\n";
