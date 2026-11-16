<?php
declare(strict_types=1);
namespace WexaShelf;
final class Installer {
 private static string $locale='en';
 private static function t(string $english,string $turkish):string {return self::$locale==='tr'?$turkish:$english;}

 public static function run():void {
  self::$locale=(($_POST['locale']??$_GET['locale']??'en')==='tr')?'tr':'en';
  header('Content-Language: '.self::$locale);header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
  $storage=Config::storage();$error='';$values=[];$ready=true;
  if(is_file($storage.'/config.php')||is_file($storage.'/install.lock')){http_response_code(409);self::page(self::t('Installation is locked. Existing configuration cannot be overwritten.','Kurulum kilitli. Mevcut yapılandırma yeniden yazılamaz.'),[],false);return;}
  $requirements=[];if(PHP_VERSION_ID<80300)$requirements[]=self::t('PHP 8.3 or newer','PHP 8.3 veya üzeri');foreach(['pdo_mysql','curl','mbstring','intl','session'] as $e)if(!extension_loaded($e))$requirements[]=$e.self::t(' extension',' uzantısı');if(!is_dir($storage)||!is_writable($storage))$requirements[]=self::t('a writable private storage directory','yazılabilir özel storage klasörü');$assetRoot=is_dir(dirname(__DIR__).'/public/assets')?dirname(__DIR__).'/public/assets':dirname(__DIR__).'/assets';foreach(['app.js','app.css','admin.js','admin.css'] as $asset)if(!is_file($assetRoot.'/'.$asset))$requirements[]=self::t('compiled interface asset: ','derlenmiş arayüz dosyası: ').$asset;$iconMap=json_decode((string)@file_get_contents(dirname(__DIR__).'/resources/icon-assets.json'),true);if(!is_array($iconMap)||!$iconMap)$requirements[]=self::t('compiled icon manifest','derlenmiş ikon eşlemesi');else foreach($iconMap as $delivered)if(!is_string($delivered)||!preg_match('~^/assets/(?:icons|artwork)/[a-z0-9.-]+\.(svg|webp)$~D',$delivered)||!is_file($assetRoot.substr($delivered,7))){$requirements[]=self::t('missing compiled icon assets','eksik derlenmiş ikon dosyaları');break;}
  $key=getenv('WEXA_SETUP_KEY')?: (is_file($storage.'/install.key')?trim((string)file_get_contents($storage.'/install.key')):'');
  if(strlen($key)<24){$requirements[]=self::t('a private setup key: create storage/install.key with at least 24 random characters or set WEXA_SETUP_KEY','özel kurulum anahtarı: dosya yöneticisiyle storage/install.key dosyasına en az 24 karakterlik rastgele bir anahtar yazın veya WEXA_SETUP_KEY tanımlayın');}
  if($requirements){http_response_code(503);self::page(self::t('Installation prerequisites: ','Kurulum ön koşulları: ').implode('; ',$requirements).'.',[],false);return;}
  if(session_status()!==PHP_SESSION_ACTIVE){session_name('wexa_setup');session_set_cookie_params(['lifetime'=>0,'path'=>Config::basePath().'/','secure'=>(!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off'),'httponly'=>true,'samesite'=>'Strict']);session_start();}
  if(!isset($_SESSION['setup_csrf']))$_SESSION['setup_csrf']=bin2hex(random_bytes(32));
  if(($_SERVER['REQUEST_METHOD']??'GET')==='POST'){
   try{
    if((int)($_SERVER['CONTENT_LENGTH']??0)>16384)throw new ApiException(self::t('Request is too large.','İstek çok büyük.'),413);
    foreach(['site_name','catalog_mode','site_url','db_host','db_port','db_name','db_user'] as $name)$values[$name]=is_string($_POST[$name]??null)?substr($_POST[$name],0,2048):'';
    foreach(['setup_key','csrf','site_url','db_host','db_port','db_name','db_user','db_password','admin_password','admin_password_confirm'] as $name)if(!is_string($_POST[$name]??null))throw new ApiException(self::t('Complete all required fields.','Tüm alanları doldurun.'));
    if(!hash_equals($key,$_POST['setup_key'])||!hash_equals($_SESSION['setup_csrf'],$_POST['csrf']))throw new ApiException(self::t('The setup key or session could not be verified.','Kurulum anahtarı veya oturum doğrulanamadı.'),403);
    $url=rtrim(trim($_POST['site_url']),'/');$u=parse_url($url);if(!$u||!in_array($u['scheme']??'',['http','https'],true)||empty($u['host'])||isset($u['user'])||isset($u['pass'])||isset($u['query'])||isset($u['fragment'])||rtrim($u['path']??'','/')!==Config::basePath())throw new ApiException(self::t('The site URL must use HTTP(S) and match the installation directory.','Site URL adresi HTTP(S) olmalı ve yüklenen klasör yoluyla eşleşmeli.'));
    if(preg_match('/[\x00-\x20\x7f]/',$url)||strlen($url)>2048)throw new ApiException(self::t('Invalid site URL.','Geçersiz site URL adresi.'));
    $origin=$u['scheme'].'://'.$u['host'];if(isset($u['port'])&&!(($u['scheme']==='https'&&$u['port']===443)||($u['scheme']==='http'&&$u['port']===80)))$origin.=':'.$u['port'];if(($_SERVER['HTTP_ORIGIN']??'')!==$origin)throw new ApiException(self::t('The request origin does not match the site URL.','İstek kaynağı site URL adresiyle eşleşmiyor.'),403);
    $host=trim($_POST['db_host']);if(!preg_match('/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9.-]{0,251}[a-zA-Z0-9])?|\[[0-9a-fA-F:]+\]|[0-9a-fA-F:]+)$/D',$host)||str_contains($host,';'))throw new ApiException(self::t('Invalid database host.','Geçersiz veritabanı sunucusu.'));
    if(!ctype_digit($_POST['db_port'])||(int)$_POST['db_port']<1||(int)$_POST['db_port']>65535||!preg_match('/^[a-zA-Z0-9_]{1,64}$/D',$_POST['db_name'])||strlen($_POST['db_user'])<1||strlen($_POST['db_user'])>128||strlen($_POST['db_password'])>1024)throw new ApiException(self::t('Invalid database connection fields.','Veritabanı alanları geçersiz.'));
    if(strlen($_POST['admin_password'])<12||strlen($_POST['admin_password'])>256||$_POST['admin_password']!==$_POST['admin_password_confirm'])throw new ApiException(self::t('The administrator password must contain 12–256 characters and match its confirmation.','Yönetici parolası 12–256 karakter olmalı ve tekrarı eşleşmeli.'));
    $options=self::options($_POST);
    $config=['site'=>['url'=>$url,'indexing'=>false],'database'=>['host'=>$host,'port'=>(int)$_POST['db_port'],'name'=>$_POST['db_name'],'user'=>$_POST['db_user'],'password'=>$_POST['db_password']]];
    $lock=fopen($storage.'/.setup.lock','c');if(!$lock||!flock($lock,LOCK_EX))throw new ApiException(self::t('The installation lock could not be acquired.','Kurulum kilidi alınamadı.'));@chmod($storage.'/.setup.lock',0600);
    $tmp=null;$wroteConfig=false;$wroteLock=false;
    try{
     if(is_file($storage.'/config.php')||is_file($storage.'/install.lock'))throw new ApiException(self::t('Installation was completed in another session.','Kurulum başka bir oturumda tamamlandı.'),409);
     $db=Database::connect($config);Database::migrate($db);$repo=new Repository($db,$config);
     $repo->transaction(function()use($repo,$config,$options,$storage,&$tmp,&$wroteConfig,&$wroteLock){
      if($repo->setting('password')||$repo->setting('installed'))throw new ApiException(self::t('This database is already installed. Choose a new empty database.','Bu veritabanı zaten kurulmuş. Yeni ve boş bir veritabanı seçin.'),409);
      self::initializeCatalog($repo,$config,$options,self::$locale);Auth::configurePassword($repo,$_POST['admin_password']);$repo->setSetting('installed',true);
      $tmp=tempnam($storage,'.config-');if($tmp===false)throw new \RuntimeException('write');if(!chmod($tmp,0600)||file_put_contents($tmp,"<?php\ndeclare(strict_types=1);\nreturn ".var_export($config,true).";\n",LOCK_EX)===false||!rename($tmp,$storage.'/config.php'))throw new \RuntimeException('write');$wroteConfig=true;$tmp=null;
      $handle=fopen($storage.'/install.lock','x');if(!$handle)throw new \RuntimeException('lock');$wroteLock=true;if(fwrite($handle,gmdate('c')."\n")===false){fclose($handle);throw new \RuntimeException('lock');}fclose($handle);if(!chmod($storage.'/install.lock',0600))throw new \RuntimeException('lock');
     });
    }catch(\Throwable $e){if($tmp&&is_file($tmp))unlink($tmp);if($wroteLock)unlink($storage.'/install.lock');if($wroteConfig)unlink($storage.'/config.php');throw $e;}finally{flock($lock,LOCK_UN);fclose($lock);}
    unset($_SESSION['setup_csrf']);session_write_close();header('Location: '.Config::basePath($config).'/admin',true,303);return;
   }catch(ApiException $e){http_response_code($e->status);$error=$e->getMessage();}catch(\Throwable){http_response_code(500);$error=self::t('Installation could not finish. Check the database connection, access rights and directory permissions.','Kurulum tamamlanamadı. Veritabanı bağlantısını, erişim yetkilerini ve klasör yazma izinlerini kontrol edin.');}
  }elseif(($_SERVER['REQUEST_METHOD']??'GET')!=='GET'){http_response_code(405);header('Allow: GET, POST');$error=self::t('Unsupported request method.','Geçersiz istek yöntemi.');$ready=false;}
  self::page($error,$values,$ready);
 }
 public static function options(array $input):array {
  $name=$input['site_name']??'WexaShelf';$mode=$input['catalog_mode']??'empty';
  if(!is_string($name)||!preg_match('//u',$name)||mb_strlen(trim($name))<1||mb_strlen(trim($name))>80||preg_match('/[<>\x00-\x1f\x7f]/u',$name))throw new ApiException(self::t('Enter a plain site name of 1–80 characters.','1–80 karakterlik düz metin site adı girin.'));
  if(!in_array($mode,['empty','sample'],true))throw new ApiException(self::t('Choose an empty or sample catalog.','Boş veya örnek katalog seçin.'));
  return ['siteName'=>trim($name),'catalogMode'=>$mode];
 }
 public static function initializeCatalog(Repository $repo,array $config,array $options,string $locale):void {
  Validation::check(in_array($locale,['en','tr'],true),'Invalid installation locale.');
  $options=self::options(['site_name'=>$options['siteName']??null,'catalog_mode'=>$options['catalogMode']??null]);
  $seed=json_decode((string)file_get_contents(dirname(__DIR__).'/resources/seed.json'),true,512,JSON_THROW_ON_ERROR);
  if($options['catalogMode']==='empty'){$seed['records']=[];$seed['translations']=[];}
  $repo->seed($seed);$localization=Translations::defaults();$localization['defaultLocale']=$locale;$localization['sourceLocale']=$locale;$repo->setSetting('localization',$localization);
  $seo=SEOSettings::defaults($config);$seo['siteName']=$options['siteName'];$seo['titleSuffix']=$options['siteName'];$repo->setSetting('seo-settings',SEOSettings::validate($seo));
  $repo->setSetting('installation-mode',$options['catalogMode']);$repo->setSetting('installed-schema-version',json_decode((string)file_get_contents(dirname(__DIR__).'/resources/release.json'),true)['version']??'unrecorded');
 }
 private static function page(string $error,array $v,bool $ready):void {
  $e=fn($s)=>htmlspecialchars((string)$s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');$t=fn($en,$tr)=>self::t($en,$tr);
  header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="'.self::$locale.'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'.$t('WexaShelf setup','WexaShelf kurulumu').'</title><style>body{margin:0;background:#101a2b;color:#edf3fc;font:16px/1.5 system-ui,sans-serif}main{max-width:760px;margin:48px auto;padding:28px;background:#18263a;border:1px solid #2c3d52;border-radius:16px}h1{font-size:30px;margin:8px 0}p{color:#b9c8dc}a{color:#65d8be}form{display:grid;grid-template-columns:1fr 1fr;gap:18px}label{display:flex;flex-direction:column;gap:7px}input,select{box-sizing:border-box;min-height:46px;width:100%;border:1px solid #60748e;border-radius:7px;padding:10px;background:#101a2b;color:#fff;font:inherit}input:focus,select:focus{outline:2px solid #65d8be;outline-offset:2px}.full{grid-column:1/-1}button{min-height:48px;padding:12px 20px;border:0;border-radius:7px;background:#65d8be;color:#102c2a;font:700 16px system-ui;cursor:pointer}.notice{padding:14px;border:1px solid #dca96a;border-radius:8px;color:#ffe3ba;margin:20px 0}small{color:#b9c8dc}footer{margin-top:28px;font-size:14px}@media(max-width:600px){main{margin:16px;padding:20px}form{grid-template-columns:1fr}}</style></head><body><main><small>WexaShelf · '.$t('First installation','İlk kurulum').'</small><h1>'.$t('Start your app catalog','Uygulama kataloğunuzu açın').'</h1><p>'.$t('Set up MySQL and your administrator password. This screen locks after installation. Search indexing starts disabled.','MySQL bağlantısını ve yönetici parolanızı belirleyin. Kurulum tamamlandığında bu ekran kilitlenir. Arama motoru indekslemesi başlangıçta kapalıdır.').'</p>';
  echo '<form method="get"><label>'.$t('Installation and default site language','Kurulum ve varsayılan site dili').'<select name="locale"><option value="en"'.(self::$locale==='en'?' selected':'').'>English</option><option value="tr"'.(self::$locale==='tr'?' selected':'').'>Türkçe</option></select></label><button type="submit">'.$t('Use language','Dili uygula').'</button></form><p>'.$t('Existing sample records retain their original language. You can change the default for new content later.','Örnek kayıtların özgün dili korunur. Yeni içeriklerin varsayılan dilini daha sonra değiştirebilirsiniz.').'</p>';
  if($error!=='')echo '<div class="notice" role="alert">'.$e($error).'</div>';
  if($ready){echo '<form method="post" autocomplete="off"><input type="hidden" name="locale" value="'.self::$locale.'"><input type="hidden" name="csrf" value="'.$e($_SESSION['setup_csrf']??'').'">';
   echo '<label class="full">'.$t('Starting catalog','Başlangıç kataloğu').'<select name="catalog_mode"><option value="empty"'.(($v['catalog_mode']??'empty')==='empty'?' selected':'').'>'.$t('Empty catalog — recommended for your site','Boş katalog — kendi siteniz için önerilir').'</option><option value="sample"'.(($v['catalog_mode']??'empty')==='sample'?' selected':'').'>'.$t('Sample catalog — demonstration content','Örnek katalog — tanıtım içeriği').'</option></select></label><small class="full">'.$t('An empty catalog contains no sample apps, articles or lists. Sample records retain their original Turkish source language and require your editorial review. Indexing starts disabled.','Boş katalog örnek uygulama, yazı veya liste içermez. Örnek kayıtların özgün Türkçe kaynak dili korunur ve editör incelemeniz gerekir. İndeksleme kapalı başlar.').'</small>';
   $fields=[['site_name',$t('Site name','Site adı'),'text',$v['site_name']??'WexaShelf',true],['setup_key',$t('Setup key','Kurulum anahtarı'),'password','',true],['site_url',$t('Site URL','Site URL adresi'),'url',$v['site_url']??'',true],['db_host',$t('MySQL host','MySQL sunucusu'),'text',$v['db_host']??'localhost',false],['db_port',$t('MySQL port','MySQL portu'),'number',$v['db_port']??'3306',false],['db_name',$t('Database name','Veritabanı adı'),'text',$v['db_name']??'',false],['db_user',$t('Database user','Veritabanı kullanıcısı'),'text',$v['db_user']??'',false],['db_password',$t('Database password','Veritabanı parolası'),'password','',true],['admin_password',$t('Administrator password (at least 12 characters)','Yönetici parolası (en az 12 karakter)'),'password','',false],['admin_password_confirm',$t('Confirm administrator password','Yönetici parolasını tekrarlayın'),'password','',false]];
   foreach($fields as [$name,$label,$type,$value,$full])echo '<label'.($full?' class="full"':'').'>'.$e($label).'<input name="'.$name.'" type="'.$type.'" value="'.$e($value).'" '.($name==='db_password'?'':'required ').($type==='password'?'autocomplete="new-password" ':'').($name==='db_port'?'min="1" max="65535" ':'').'></label>';
   echo '<small class="full">'.$t('The site URL must match your installation directory. Example:','Site adresi yüklediğiniz klasörle eşleşmelidir. Örnek:').' https://example.com'.$e(Config::basePath()).'</small><button class="full" type="submit">'.$t('Complete installation','Kurulumu tamamla').'</button></form>';
  }
  echo '<footer>WexaShelf · <a href="https://softwexa.com" rel="nofollow noopener noreferrer">Softwexa</a></footer></main></body></html>';
 }
}
