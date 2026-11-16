<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\Installer;
function installerLocaleCheck(bool $ok,string $label):void{if(!$ok)throw new RuntimeException($label);}
$storage=sys_get_temp_dir().'/wexa-installer-locales-'.bin2hex(random_bytes(8));mkdir($storage,0700);$prior=getenv('WEXA_STORAGE_PATH');$oldKey=getenv('WEXA_SETUP_KEY');putenv('WEXA_STORAGE_PATH='.$storage);putenv('WEXA_SETUP_KEY=synthetic-private-setup-key-for-local-tests');$_SERVER['SCRIPT_NAME']='/sub/index.php';
function installerLocalePage(string $method,array $get=[],array $post=[]):string{$_SERVER['REQUEST_METHOD']=$method;$_GET=$get;$_POST=$post;http_response_code(200);ob_start();Installer::run();return ob_get_clean();}
try{
 $en=installerLocalePage('GET');installerLocaleCheck(http_response_code()===200&&str_contains($en,'<html lang="en"')&&str_contains($en,'Start your app catalog'),'Installer defaults to English');installerLocaleCheck(str_contains($en,'name="locale" value="en"')&&str_contains($en,'value="tr"'),'Language choice carried in install form');
 $tr=installerLocalePage('GET',['locale'=>'tr']);installerLocaleCheck(str_contains($tr,'<html lang="tr"')&&str_contains($tr,'Uygulama kataloğunuzu açın'),'Turkish choice');
 $enError=installerLocalePage('POST',[],['locale'=>'en']);installerLocaleCheck(http_response_code()===400&&str_contains($enError,'Complete all required fields.'),'English validation error');
 $trError=installerLocalePage('POST',[],['locale'=>'tr']);installerLocaleCheck(http_response_code()===400&&str_contains($trError,'Tüm alanları doldurun.'),'Turkish validation error');
 $fallback=installerLocalePage('GET',['locale'=>['invalid']]);installerLocaleCheck(str_contains($fallback,'<html lang="en"'),'Invalid locale safely defaults to English');
 file_put_contents($storage.'/config.php','synthetic existing configuration');$hash=hash_file('sha256',$storage.'/config.php');$locked=installerLocalePage('POST',[],['locale'=>'en']);installerLocaleCheck(http_response_code()===409&&str_contains($locked,'Installation is locked.')&&hash_file('sha256',$storage.'/config.php')===$hash,'Existing configuration never overwritten');
 echo "PASS installer languages: English default, Turkish choice, matching errors, malformed locale fallback and existing configuration preservation. No database installed.\n";
}finally{if(session_status()===PHP_SESSION_ACTIVE)session_write_close();foreach(glob($storage.'/*') as $file)if(is_file($file))unlink($file);rmdir($storage);putenv($prior===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$prior);putenv($oldKey===false?'WEXA_SETUP_KEY':'WEXA_SETUP_KEY='.$oldKey);}
