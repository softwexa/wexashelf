<?php
declare(strict_types=1);
// Isolated source/resource copy. No live pack registration is changed.
$root=sys_get_temp_dir().'/wexa-locale-'.bin2hex(random_bytes(6));mkdir($root.'/app',0700,true);mkdir($root.'/resources',0700,true);
foreach(glob(__DIR__.'/../app/*.php')as$file)copy($file,$root.'/app/'.basename($file));
// ThemeView reads the built-in theme from the generated seed even with an empty catalog.
foreach(['seed.json','content.json','content.en.json','server.en.json','server.tr.json']as$file)copy(__DIR__.'/../resources/'.$file,$root.'/resources/'.$file);
$server=json_decode(file_get_contents($root.'/resources/server.en.json'),true);foreach($server['messages']as$key=>&$value)$value='DE fixture '.$key;unset($value);$server['messages']['homeTitle']='Passende Apps entdecken';$server['messages']['aboutText']='Dies ist eine isolierte deutsche Testbeschreibung.';$server['messages']['navExplore']='Entdecken';$server['routes']['kesfet']='anwendungen';$server['routes']['uygulama']='anwendungen';$server['routes']['hakkimizda']='ueber-uns';file_put_contents($root.'/resources/server.de.json',json_encode($server));copy($root.'/resources/content.en.json',$root.'/resources/content.de.json');
file_put_contents($root.'/resources/locale-manifest.json',json_encode([['code'=>'tr','label'=>'Türkçe','intlLocale'=>'tr-TR','direction'=>'ltr'],['code'=>'en','label'=>'English','intlLocale'=>'en-US','direction'=>'ltr'],['code'=>'de','label'=>'Deutsch','intlLocale'=>'de-DE','direction'=>'ltr']]));
$case=<<<'CASE'
<?php
require __DIR__.'/app/bootstrap.php';
use WexaShelf\{Localization,PublicSite,SEOSettings};
function packCheck($v,$m){if(!$v)throw new RuntimeException($m);}
$config=['site'=>['url'=>'https://catalog.example.org/sub','indexing'=>true],'seo'=>SEOSettings::defaults(['site'=>['indexing'=>true]]),'localization'=>['defaultLocale'=>'de','locales'=>[['code'=>'tr','enabled'=>true],['code'=>'en','enabled'=>true],['code'=>'de','enabled'=>true]]]];
$catalog=['apps'=>[],'articles'=>[],'lists'=>[],'records'=>[],'translations'=>[]];
packCheck(Localization::complete('de')&&Localization::enabled($config,'de'),'Complete third pack enabled');packCheck(Localization::rootPath($config)==='/de','Third default');packCheck(Localization::route('/de/anwendungen')===['locale'=>'de','parts'=>['kesfet']],'Localized route');
ob_start();PublicSite::render($catalog,$config,'/de',[]);$html=ob_get_clean();packCheck(str_contains($html,'lang="de"')&&str_contains($html,'"inLanguage":"de"'),'HTML and schema language');packCheck(str_contains($html,'Passende Apps entdecken')&&str_contains($html,'Entdecken'),'Explicit server messages');packCheck(!str_contains($html,'>Skip to content<')&&!str_contains($html,'>Privacy<'),'No English SSR fallback');packCheck(str_contains($html,'hreflang="de" href="https://catalog.example.org/sub/de"'),'Third self hreflang');packCheck(str_contains(PublicSite::sitemap($catalog,$config),'/de/ueber-uns'),'Localized sitemap route');
ob_start();PublicSite::render($catalog,$config,'/de/ueber-uns',[]);$about=ob_get_clean();packCheck(str_contains($about,'Dies ist eine isolierte deutsche Testbeschreibung.'),'Localized policy copy');
ob_start();PublicSite::render($catalog,$config,'/de/tools',[]);$tools=ob_get_clean();packCheck(str_contains($tools,'DE fixture toolsTitle')&&str_contains($tools,'noindex'),'Third-locale utility noindex');
$catalog['extensionCardsByLocale']=['de'=>[['title'=>'<unsafe>','description'=>'Module description','href'=>'/de/tools']]];ob_start();PublicSite::render($catalog,$config,'/de',[]);$modules=ob_get_clean();packCheck(str_contains($modules,'&lt;unsafe&gt;')&&str_contains($modules,'href="/sub/de/tools"'),'Module title escaped');
$broken=json_decode(file_get_contents(__DIR__.'/resources/server.de.json'),true);unset($broken['messages']['privacy']);file_put_contents(__DIR__.'/resources/server.de.json',json_encode($broken));packCheck(!Localization::enabled($config,'de'),'Incomplete server pack fails closed');
echo "PASS isolated third-locale pack: registry, explicit SSR labels/policy, localized routes, canonical/hreflang/schema/sitemap, incomplete-pack gate.\n";
CASE;
file_put_contents($root.'/case.php',$case);
try{passthru(escapeshellarg(PHP_BINARY).' '.escapeshellarg($root.'/case.php'),$code);if($code!==0)throw new RuntimeException('Third-locale test failed.');}finally{foreach(glob($root.'/app/*')as$file)unlink($file);foreach(glob($root.'/resources/*')as$file)unlink($file);unlink($root.'/case.php');rmdir($root.'/app');rmdir($root.'/resources');rmdir($root);}
