<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\AdminSite;
$storage=sys_get_temp_dir().'/wexashelf-admin-site-'.bin2hex(random_bytes(8));mkdir($storage,0700);$previous=getenv('WEXA_STORAGE_PATH');putenv('WEXA_STORAGE_PATH='.$storage);
try {
    ob_start();AdminSite::render(['site'=>['url'=>'https://example.test/catalog']]);$html=ob_get_clean();
    foreach(['name="robots" content="noindex, nofollow, noarchive"','/catalog/assets/admin.js','/catalog/assets/admin.css','href="/catalog/admin"','class="admin-document"'] as $expected)if(!str_contains($html,$expected))throw new RuntimeException('Missing administrative document requirement: '.$expected);
    foreach(['class="app-shell"','<footer','assets/app.js','application/ld+json','og:','Search apps'] as $forbidden)if(str_contains($html,$forbidden))throw new RuntimeException('Public shell leaked into administration: '.$forbidden);
    preg_match('/<script id="wexa-bootstrap" type="application\/json">(.*?)<\/script>/s',$html,$matches);$data=json_decode($matches[1]??'',true,512,JSON_THROW_ON_ERROR);
    if(isset($data['catalog'])||($data['basePath']??null)!=='/catalog'||($data['admin']??null)!==true||($data['locale']??null)!=='en')throw new RuntimeException('Admin bootstrap must be minimal, independent and English default.');
}finally{putenv($previous===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$previous);rmdir($storage);}
echo "Admin document: independent shell, minimal bootstrap, noindex and subdirectory asset links passed.\n";
