<?php
declare(strict_types=1);
// Isolated in-memory SQLite adapter: exercises repository transactions without user storage.
foreach(['ApiException','Validation','Repository','SEOSettings'] as $class)require __DIR__.'/../app/'.$class.'.php';
use WexaShelf\{SEOSettings,Repository,ApiException};
final class SEOTestDB extends PDO {
 public function __construct(){parent::__construct('sqlite::memory:');$this->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$this->exec('CREATE TABLE ws_settings(setting_key TEXT PRIMARY KEY,value TEXT); CREATE TABLE ws_audit(id INTEGER PRIMARY KEY,action TEXT,subject TEXT,detail TEXT,createdAt TEXT);CREATE TABLE ws_records(kind TEXT,id TEXT,payload TEXT);CREATE TABLE ws_feedback(id INTEGER PRIMARY KEY);');}
 public function prepare(string $query,array $options=[]):PDOStatement|false {
  $query=str_replace(['INSERT IGNORE',' FOR UPDATE','ON DUPLICATE KEY UPDATE value=VALUES(value)'],['INSERT OR IGNORE','','ON CONFLICT(setting_key) DO UPDATE SET value=excluded.value'],$query);
  // Match the MySQL JSON scalar values used by the current paginated admin snapshot.
  $query=str_replace("JSON_UNQUOTE(JSON_EXTRACT(payload,'$.status'))", "json_extract(payload,'$.status')",$query);
  $query=str_replace("JSON_UNQUOTE(JSON_EXTRACT(payload,'$.seoApproved'))", "CASE WHEN json_extract(payload,'$.seoApproved')=1 THEN 'true' ELSE 'false' END",$query);
  return parent::prepare($query,$options);
 }
}
function expect(bool $value,string $message):void{if(!$value)throw new RuntimeException($message);}
function reject(callable $fn,int $status=400):void{try{$fn();throw new RuntimeException('Invalid input accepted');}catch(ApiException $e){expect($e->status===$status,'wrong error status');}}
$db=new SEOTestDB();$repo=new Repository($db);$local=new SEOSettings($repo,['site'=>['url'=>'http://localhost:3141/demo','indexing'=>true]]);
expect($local->get()['indexingEnabled'],'legacy setting retained');$state=$local->state();expect(!$state['environment']['publicHttps']&&!$state['environment']['indexingEffective']&&$state['sitemapCount']===0,'local fail closed');
$settings=$local->get();$settings['homeTitle']='Test ana sayfası';$saved=$local->save($settings);expect($saved['revision']===1&&$local->get()['homeTitle']==='Test ana sayfası','persisted revision');reject(fn()=>$local->save($settings),409);expect((int)$db->query('SELECT COUNT(*) FROM ws_audit')->fetchColumn()===1,'only successful save audited');
foreach(['siteName'=>'<img src=x onerror=alert(1)>','homeDescription'=>"line\nbreak",'googleVerification'=>'<meta name="google-site-verification">','bingVerification'=>'bad"token','homeTitle'=>str_repeat('ğ',121),'revision'=>-1,'indexingEnabled'=>'true','unknown'=>'field'] as $key=>$value){$bad=$saved;$bad[$key]=$value;reject(fn()=>$local->save($bad));}
$valid=$saved;$valid['homeTitle']=str_repeat('ğ',120);expect(SEOSettings::validate($valid)['homeTitle']===$valid['homeTitle'],'unicode character limit');
foreach(['http://wexashelf.com','https://localhost','https://127.0.0.1','https://[::1]','https://192.168.1.1','https://preview.local','https://preview.test','https://user:pass@wexashelf.com','https://wexashelf.com/?token=x'] as $url)expect(!SEOSettings::publicHttps($url),'unsafe URL '.$url);expect(SEOSettings::publicHttps('https://wexashelf.com/catalog'),'public HTTPS subdirectory');
$repo->setSetting('seo-settings',['indexingEnabled'=>true]);expect(!$local->get()['indexingEnabled'],'invalid stored settings fail closed');
$records=[['kind'=>'article','id'=>'qa-article','status'=>'draft','seoApproved'=>false,'data'=>['title'=>'Same','summary'=>'Same summary','sections'=>[['heading'=>'Empty','paragraphs'=>[]]],'appIds'=>['absent'],'sources'=>[]]],['kind'=>'article','id'=>'qa-other','status'=>'published','seoApproved'=>true,'data'=>['title'=>'Same','summary'=>'Same summary','sections'=>[['heading'=>'Small','paragraphs'=>['Short text']]],'appIds'=>[],'sources'=>[]]]];
$checks=SEOSettings::checks($records);$codes=array_column($checks[0]['issues'],'code');foreach(['duplicate-title','duplicate-description','empty-sections','thin-article','missing-sources','orphan-app','unreviewed-seo'] as $code)expect(in_array($code,$codes,true),'missing check '.$code);
foreach($records as $record){$db->prepare('INSERT INTO ws_records(kind,id,payload) VALUES(?,?,?)')->execute([$record['kind'],$record['id'],json_encode($record)]);}expect(count($local->state()['checks'])===2,'state reads current repository');
echo "PASS: SEO validation, Unicode limits, token/XSS rejection, revisions/audit, local fail-closed, corrupt settings and source checks; in-memory database only\n";
