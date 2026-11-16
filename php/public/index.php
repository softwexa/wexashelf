<?php
declare(strict_types=1);
$bootstrap = is_file(__DIR__.'/../app/bootstrap.php') ? __DIR__.'/../app/bootstrap.php' : __DIR__.'/app/bootstrap.php';
require $bootstrap;
use WexaShelf\{Config,Database,Repository,Api,PublicSite,AdminSite,Installer,SEOSettings,AIMedia,ContentMedia,ApiException,Translations,Localization,Growth,GrowthSite,CatalogQuery};
header('X-Content-Type-Options: nosniff'); header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin'); header('Permissions-Policy: camera=(), microphone=(), geolocation=()'); header_remove('X-Powered-By');
try {
    $config=Config::load(); $base=Config::basePath($config); $uri=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH) ?: '/';
    if ($base!=='' && $uri!==$base && !str_starts_with($uri,$base.'/')) { http_response_code(404); echo 'Sayfa bulunamadı.'; exit; }
    $path=substr($uri,strlen($base)) ?: '/'; if ($path==='/index.php') $path='/';
    if (preg_match('~^/(?:app|resources|storage|client|cli)(?:/|$)|(?:^|/)\.~',$path)) { http_response_code(404); exit; }
    $method=$_SERVER['REQUEST_METHOD']??'GET';
    $querySuffix=$_GET?'?'.http_build_query($_GET,'','&',PHP_QUERY_RFC3986):'';
    if (in_array($path,['/kurulum','/kurulum/','/install/'],true)&&in_array($method,['GET','HEAD'],true)) { header('Location: '.$base.'/install'.$querySuffix,true,301); exit; }
    if (in_array($path,['/install','/kurulum','/kurulum/'],true)) { Installer::run(); exit; }
    if (!$config) {
        if (str_starts_with($path,'/api/')) { http_response_code(503); header('Content-Type: application/json'); header('Cache-Control: no-store'); echo json_encode(['error'=>'Önce kurulum tamamlanmalı.']); exit; }
        header('Location: '.$base.'/install',true,302); exit;
    }
    $db=Database::connect($config);
    $repo=new Repository($db,$config); $config['seo']=(new SEOSettings($repo,$config))->get(); $config['localization']=(new Translations($db,$repo))->settings();
    if (str_starts_with($path,'/api/')) Api::handle($db,$config,$path,$_SERVER['REQUEST_METHOD']??'GET');
    if (!in_array($_SERVER['REQUEST_METHOD']??'GET',['GET','HEAD'],true)) { http_response_code(405); header('Allow: GET, HEAD'); exit; }
    if(in_array($path,['/yonetim','/yonetim/','/admin/'],true)){header('X-Robots-Tag: noindex, nofollow');header('Cache-Control: private, no-store');header('Location: '.$base.'/admin'.$querySuffix,true,301);exit;}
    if($path==='/admin'){AdminSite::render($config);exit;}
    $growth=new Growth($db,$repo,$config);
    if ($rule=$growth->resolveLifecycle($path)) { header('X-Robots-Tag: noindex'); if ($rule['status']===301) header('Location: '.$base.$rule['to'],true,301); else { http_response_code(410); header('Content-Type: text/html; charset=utf-8'); if (($_SERVER['REQUEST_METHOD']??'GET')!=='HEAD') echo '<!doctype html><html lang="'.htmlspecialchars(Localization::locale($path),ENT_QUOTES).'"><meta charset="utf-8"><meta name="robots" content="noindex"><title>'.htmlspecialchars(Localization::t(Localization::locale($path),'removedTitle'),ENT_QUOTES).'</title><h1>'.htmlspecialchars(Localization::t(Localization::locale($path),'removedMessage'),ENT_QUOTES).'</h1></html>'; } exit; }
    if ($path==='/') { header('Cache-Control: no-cache'); header('Location: '.$base.Localization::rootPath($config).($_GET?'?'.http_build_query($_GET,'','&',PHP_QUERY_RFC3986):''),true,302); exit; }
    if (Localization::enabled($config,Localization::locale($path))&&($canonicalAlias=Localization::canonicalAlias($path))!==null) { header('Location: '.$base.$canonicalAlias.$querySuffix,true,301); exit; }
    if ($path==='/robots.txt') { header('Content-Type: text/plain; charset=utf-8'); if (($_SERVER['REQUEST_METHOD']??'GET')!=='HEAD') echo PublicSite::robots($config); exit; }
    $catalogQuery=new CatalogQuery($db,$repo);
    $sitemapPage=$path==='/sitemap.xml'?1:(preg_match('~^/sitemap-([1-9][0-9]{0,5})\.xml$~D',$path,$sitemapMatch)?(int)$sitemapMatch[1]:null);
    if($sitemapPage!==null){
        $pages=$catalogQuery->sitemapPages();if($sitemapPage>$pages){http_response_code(404);exit;}
        header('Content-Type: application/xml; charset=utf-8');
        if($path==='/sitemap.xml'&&$pages>1){$xml='<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';for($i=1;$i<=$pages;$i++)$xml.='<sitemap><loc>'.htmlspecialchars(Config::url($config,'sitemap-'.$i.'.xml'),ENT_XML1).'</loc></sitemap>';echo $xml.'</sitemapindex>';exit;}
        $catalog=$repo->getPublicSnapshot($catalogQuery->sitemapSelection($sitemapPage));$catalog['growth']=$growth->publicDocuments($catalog);$catalog['growthLifecycle']=$growth->lifecycle()['rules'];echo PublicSite::sitemap($catalog,$config);exit;
    }
    $catalog=preg_match('~^/media/([a-f0-9]{64})\.(png|jpg|webp)$~D',$path,$mediaMatch)?$repo->getPublicSnapshot($catalogQuery->mediaSelection($mediaMatch[1],$mediaMatch[2])):$catalogQuery->forPage($path,$_GET,GrowthSite::matches($path)?$growth->referencesForPath($path):[]); $catalog['growth']=$growth->publicDocuments($catalog,$path); $catalog['growthLifecycle']=$growth->lifecycle()['rules'];
    if (preg_match('~^/media/([a-f0-9]{64})\.(png|jpg|webp)$~D',$path,$match)) {
        header('Cache-Control: no-cache, must-revalidate');
        if (!PublicSite::publicMedia($catalog,$match[1],$match[2])) { http_response_code(404); exit; }
        try { $bytes=ContentMedia::read($match[1],$match[2]); } catch (ApiException $e) { http_response_code($e->status); exit; }
        header('Content-Type: '.['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'][$match[2]]); header('X-Content-Type-Options: nosniff'); header('Content-Length: '.strlen($bytes));
        if (($_SERVER['REQUEST_METHOD']??'GET')!=='HEAD') echo $bytes; exit;
    }
    if ($path==='/sitemap.xml') { header('Content-Type: application/xml; charset=utf-8'); echo PublicSite::sitemap($catalog,$config); exit; }
    if((Localization::route($path)['parts']??[])===['submit-app'])$config['_submissionConfig']=(new \WexaShelf\AppSubmissions($db,$repo,$config))->publicConfig(Localization::locale($path));
    PublicSite::render($catalog,$config,$path,$_GET);
} catch (Throwable $e) {
    http_response_code(503); header('Cache-Control: no-store');
    if (str_starts_with($path??'','/api/')) { header('Content-Type: application/json'); echo json_encode(['error'=>'Servis şu anda kullanılamıyor.']); }
    else { header('Content-Type: text/html; charset=utf-8'); echo '<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="robots" content="noindex"><title>WexaShelf</title><h1>WexaShelf şu anda açılamıyor.</h1><p>Site yöneticisi yapılandırmayı ve veritabanı bağlantısını kontrol edebilir.</p></html>'; }
    error_log('WexaShelf startup failure: '.get_class($e));
}
