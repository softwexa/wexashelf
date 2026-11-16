<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
/** Owner-only caller; no network probes, credentials, filesystem paths or raw exception text. */
final class SystemHealth {
 public function __construct(private PDO $db,private Repository $repo,private array $config){}
 public function state():array {
  $checks=[];$add=function(string$id,string$status,string$detail)use(&$checks){$checks[]=['id'=>$id,'status'=>$status,'detail'=>$detail];};
  $add('php',PHP_VERSION_ID>=80300?'pass':'fail','PHP '.PHP_VERSION);
  foreach(['pdo_mysql','curl','mbstring','intl','session','fileinfo']as$extension)$add('extension-'.$extension,extension_loaded($extension)?'pass':'fail',$extension);
  $version='unknown';try{$version=(string)$this->db->query('SELECT VERSION()')->fetchColumn();$add('database','pass','Database connection available.');}catch(\Throwable){$add('database','fail','Database connection unavailable.');}
  $storage=realpath(Config::storage());$public=realpath(is_dir(dirname(__DIR__).'/public')?dirname(__DIR__).'/public':dirname(__DIR__));$outside=$storage!==false&&$public!==false&&$storage!==$public&&!str_starts_with($storage,$public.'/');
  $add('storage-writable',$storage!==false&&is_writable($storage)?'pass':'fail','Private storage must be writable by PHP.');
  $deny=$storage!==false&&is_file($storage.'/.htaccess')&&str_contains((string)file_get_contents($storage.'/.htaccess'),'Require all denied');
  $add('storage-boundary',$outside?'pass':'warn',$outside?'Storage is outside the public document root.':($deny?'Access-denial rules exist; verify HTTP denial on your host.':'Storage is within the document root; configure and verify HTTP denial.'));
  $add('storage-http','warn','HTTP protection is not probed automatically. Verify private URLs return 403 or 404.');
  $permissions=$storage!==false&&((fileperms($storage)&0077)===0);$add('storage-permissions',$permissions?'pass':'warn','Private storage should not permit access to other system users.');
  $url=$this->config['site']['url']??'';$origin=SEOSettings::publicHttps($url);$add('production-origin',$origin?'pass':'warn','Use a real public HTTPS origin before enabling indexing.');
  $seo=(new SEOSettings($this->repo,$this->config))->get();$add('indexing',$seo['indexingEnabled']&&$origin?'pass':'warn','Enable indexing only after reviewing public content and the production origin.');
  $counts=['records'=>0,'published'=>0,'approved'=>0];$rows=$this->db->query("SELECT JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status')) status,JSON_UNQUOTE(JSON_EXTRACT(payload,'$.seoApproved')) approved,COUNT(*) total FROM ws_records GROUP BY status,approved")->fetchAll();foreach($rows as$r){$counts['records']+=(int)$r['total'];if($r['status']==='published'){$counts['published']+=(int)$r['total'];if($r['approved']==='true')$counts['approved']+=(int)$r['total'];}}
  $add('catalog',$counts['records']>0?'pass':'warn','Create your first app, review its sources, then publish when ready.');$add('seo-approval',$counts['approved']>0?'pass':'warn','Published content needs separate editorial SEO approval.');
  $release=json_decode((string)@file_get_contents(dirname(__DIR__).'/resources/release.json'),true);$runtime=is_string($release['version']??null)?$release['version']:'unknown';$installed=$this->repo->setting('installed-schema-version','unrecorded');$add('schema-version',$runtime===$installed?'pass':'warn','Installed schema and uploaded runtime versions should match.');
  $workers=[];foreach(['ai','sources']as$queue){$workers[$queue]=class_exists(WorkerHeartbeat::class)?WorkerHeartbeat::read($queue):null;$add('worker-'.$queue,$workers[$queue]===null?'warn':($workers[$queue]['status']==='completed'?'pass':'warn'),$workers[$queue]===null?'No worker completion evidence recorded.':'A worker invocation was recorded; this does not prove a scheduled cron job is active.');}
  return ['checkedAt'=>gmdate('c'),'runtimeVersion'=>$runtime,'installedSchemaVersion'=>$installed,'phpVersion'=>PHP_VERSION,'databaseVersion'=>mb_substr($version,0,120),'installationMode'=>$this->repo->setting('installation-mode','unknown'),'catalog'=>$counts,'workers'=>$workers,'checks'=>$checks,'readyForLocalUse'=>!in_array('fail',array_column($checks,'status'),true),'productionVerified'=>false,'firstUse'=>['Configure site identity and language.','Create an app and add source references.','Review and publish content.','Verify HTTPS and private-path denial.','Configure optional workers and confirm their recorded runs.','Enable indexing after editorial SEO approval.'],'commands'=>['ai'=>'WEXA_STORAGE_PATH=/absolute/private/storage /path/to/php /path/to/site/cli/worker.php --queue=ai --max-jobs=5 --max-seconds=50','sources'=>'WEXA_STORAGE_PATH=/absolute/private/storage /path/to/php /path/to/site/cli/source-worker.php --max-jobs=5 --max-seconds=50']];
 }
}
