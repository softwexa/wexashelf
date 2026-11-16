<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{ApiException,Branding,ContentMedia,EditorRoles,Extensions,PublicSite,Repository,SEOSettings,Validation};

// Disposable in-memory adapter: no user catalog or persistent database is touched.
final class BrandingTestDB extends PDO {
    public function __construct() {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $this->exec('CREATE TABLE ws_settings(setting_key TEXT PRIMARY KEY,value TEXT); CREATE TABLE ws_audit(id INTEGER PRIMARY KEY,action TEXT,subject TEXT,detail TEXT,createdAt TEXT);');
    }
    public function prepare(string $query,array $options=[]):PDOStatement|false {
        return parent::prepare(str_replace(['INSERT IGNORE',' FOR UPDATE','ON DUPLICATE KEY UPDATE value=VALUES(value)'],['INSERT OR IGNORE','','ON CONFLICT(setting_key) DO UPDATE SET value=excluded.value'],$query),$options);
    }
}
$assertions=0;
function brandingCheck(bool $value,string $label):void {global $assertions;$assertions++;if(!$value)throw new RuntimeException($label);}
function brandingReject(callable $fn,string $label,int $status=400):void {
    try {$fn();} catch(ApiException $e) {brandingCheck($e->status===$status,$label.' status');return;}
    throw new RuntimeException($label);
}
$storage=sys_get_temp_dir().'/wexa-branding-'.bin2hex(random_bytes(8));mkdir($storage,0700);
$previous=getenv('WEXA_STORAGE_PATH');putenv('WEXA_STORAGE_PATH='.$storage);
try {
    $fixtures=json_decode(file_get_contents(__DIR__.'/fixtures/content-media.json'),true,512,JSON_THROW_ON_ERROR);
    $image=ContentMedia::upload(['base64'=>$fixtures['png'],'alt'=>'Example identity','caption'=>'']);
    $branding=Branding::defaults();$branding['logo']=$image;
    $repo=new Repository(new BrandingTestDB());$service=new SEOSettings($repo,['site'=>['url'=>'https://catalog.example.org/sub']]);
    $settings=$service->get();$settings['siteName']='Example Catalog';$settings['branding']=$branding;
    brandingCheck(!PublicSite::publicMedia(['branding'=>Branding::defaults()],$image['assetId'],'png'),'Private upload is not a public brand reference');
    $saved=$service->save($settings);
    brandingCheck($saved['revision']===1&&$saved['branding']===$branding,'Owner branding save persisted');
    brandingCheck(PublicSite::publicMedia(['branding'=>$saved['branding']],$image['assetId'],'png'),'Saved active logo is public');
    brandingCheck(!PublicSite::publicMedia(['branding'=>$saved['branding']],$image['assetId'],'jpg'),'Wrong format is not public');
    brandingReject(fn()=>$service->save($settings),'Stale SEO revision rejected',409);
    $olderClient=$saved;unset($olderClient['branding']);$olderClient['homeTitle']='Updated title';
    $saved=$service->save($olderClient);brandingCheck($saved['branding']===$branding,'Legacy SEO save preserves branding');

    $appearance=$repo->getSiteSettings();$initialRevision=$appearance['revision'];$appearance['theme']['template']='porcelain';
    $changed=$repo->saveSiteSettings($appearance);brandingCheck($service->get()['branding']===$branding,'Theme activation preserves branding');
    (new Extensions($repo))->restoreTheme($initialRevision,$changed['revision']);
    brandingCheck($service->get()['branding']===$branding,'Appearance rollback preserves branding');

    $config=['site'=>['url'=>'https://catalog.example.org/sub'],'seo'=>$saved];
    $html=Branding::link($config,'https://catalog.example.org/sub/en');
    brandingCheck(str_contains($html,'/sub/media/'.$image['assetId'].'.png')&&str_contains($html,'width="3" height="2"'),'SSR safe subdirectory URL and intrinsic dimensions');
    brandingCheck(str_contains($html,'Example Catalog')&&str_contains($html,'alt="Example identity"'),'SSR site identity and alternative text');
    $catalog=['apps'=>[],'articles'=>[],'lists'=>[],'records'=>[],'translations'=>[],'siteSettings'=>$repo->getSiteSettings(),'branding'=>$branding];
    $catalog['siteSettings']['theme']['template']='porcelain';
    $catalog['siteSettings']['theme']['presentation']=['font'=>'serif','width'=>'standard','radius'=>'round','hero'=>'compact','cardStyle'=>'elevated'];
    foreach(['/en'=>'en','/tr'=>'tr'] as$path=>$locale){
        ob_start();PublicSite::render($catalog,$config,$path,[]);$page=ob_get_clean();
        brandingCheck(substr_count($page,'class="site-brand-logo"')===2,'SSR header and footer display logo in '.$locale);
        brandingCheck(str_contains($page,'data-template="porcelain"')&&str_contains($page,'data-page="home"')&&str_contains($page,'data-width="standard"')&&str_contains($page,'--theme-radius:24px'),'SSR theme/presentation parity in '.$locale);
        brandingCheck(str_contains($page,'property="og:site_name" content="Example Catalog"')&&str_contains($page,'"name":"Example Catalog"'),'SSR social/schema identity in '.$locale);
        preg_match('~<script id="wexa-bootstrap" type="application/json">(.*?)</script>~s',$page,$match);
        $payload=json_decode($match[1]??'',true,512,JSON_THROW_ON_ERROR);
        brandingCheck($payload['siteName']==='Example Catalog'&&$payload['branding']===$branding,'SSR client bootstrap branding parity in '.$locale);
    }
    $config['seo']['branding']['logoMode']='image-only';$html=Branding::link($config,'/sub/en');
    brandingCheck(!str_contains($html,'<span')&&str_contains($html,'aria-label="Example Catalog"'),'Image-only retains accessible identity');
    $config['seo']['branding']['logoMode']='text-only';$html=Branding::link($config,'/sub/en');
    brandingCheck(!str_contains($html,'<img')&&str_contains($html,'<span class="site-brand-name">Example Catalog</span>'),'Text-only renders a readable identity');
    brandingCheck(!PublicSite::publicMedia(['branding'=>$config['seo']['branding']],$image['assetId'],'png'),'Hidden logo reference is private');

    foreach(['logoWidth'=>63,'logoMode'=>'html','unknown'=>'<script>'] as$key=>$value){$bad=$branding;$bad[$key]=$value;brandingReject(fn()=>Branding::validate($bad),'Invalid branding field rejected');}
    $bad=$branding;$bad['logo']['src']='https://remote.invalid/logo.svg';brandingReject(fn()=>Branding::validate($bad),'Remote field rejected');
    $bad=$branding;$bad['logo']['alt']='<svg onload="run()">';brandingReject(fn()=>Branding::validate($bad),'Markup rejected');
    $bad=$saved;$bad['branding']['logo']['width']=4;brandingReject(fn()=>$service->save($bad),'Forged dimensions rejected');
    $bad=$saved;$bad['branding']['logo']['assetId']=str_repeat('a',64);brandingReject(fn()=>$service->save($bad),'Missing media rejected on explicit save');
    brandingCheck(SEOSettings::validate($bad)['branding']['logo']['assetId']===str_repeat('a',64),'Backup metadata validation remains portable');
    foreach(['editor','publisher','analyst']as$role)brandingReject(fn()=>EditorRoles::authorize(['role'=>$role],'/api/admin/seo','POST',$saved),'Non-owner branding write denied',403);

    $remove=$saved;$remove['branding']['logo']=null;$saved=$service->save($remove);
    brandingCheck(!PublicSite::publicMedia(['branding'=>$saved['branding']],$image['assetId'],'png'),'Removal revokes logo public reference');
    $config['seo']['branding']=$branding;file_put_contents($storage.'/media/'.$image['assetId'].'.png','tampered');
    brandingCheck(!str_contains(Branding::link($config,'/sub/en'),'<img'),'Tampered or missing file falls back to text');
    brandingReject(fn()=>Branding::assertAvailable($branding),'Tampered logo rejected');
    echo 'Branding: '.$assertions." checks passed (isolated SQLite/media fixtures; not a MySQL hosting test).\n";
} finally {
    foreach(glob($storage.'/media/*')?:[]as$file)unlink($file);
    if(is_dir($storage.'/media'))rmdir($storage.'/media');rmdir($storage);
    putenv($previous===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$previous);
}
