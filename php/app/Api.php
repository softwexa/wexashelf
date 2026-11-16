<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
final class Api {
    public static function handle(PDO $db,array $config,string $path,string $method,?AIProvider $aiProvider=null): never {
        header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Robots-Tag: noindex');header('X-Content-Type-Options: nosniff');
        try {
            $routes=['/api/submissions'=>['GET','POST'],'/api/submissions/media'=>['POST'],'/api/admin/submissions'=>['GET','POST'],'/api/admin/submissions/media'=>['GET'],'/api/admin/media'=>['GET','POST'],'/api/admin/system-health'=>['GET'],'/api/admin/extensions/preview'=>['POST'],'/api/admin/extensions/export'=>['GET'],'/api/admin/source-providers'=>['GET','POST'],'/api/admin/record'=>['GET'],'/api/admin/ai/jobs'=>['POST'],'/api/catalog'=>['GET'],'/api/admin/security'=>['GET','POST'],'/api/admin/backup-transfer'=>['GET','POST'],'/api/admin/language-packs'=>['GET','POST'],'/api/admin/upgrade'=>['GET','POST'],'/api/admin/performance'=>['GET','POST'],'/api/vitals'=>['POST'],'/api/admin/editors'=>['GET','POST'],'/api/admin/capabilities'=>['GET','POST'],'/api/admin/capabilities/proposals'=>['POST'],'/api/proposals'=>['POST'],'/api/admin/extensions'=>['GET','POST'],'/api/admin/extensions/restore-theme'=>['POST'],'/api/admin/growth'=>['GET','POST'],'/api/admin/growth/history'=>['GET'],'/api/admin/growth/restore'=>['POST'],'/api/admin/growth/insights'=>['GET'],'/api/admin/growth/lifecycle'=>['GET','POST'],'/api/admin/growth/gsc'=>['POST'],'/api/admin/translations'=>['GET','POST'],'/api/admin/translations/history'=>['GET'],'/api/admin/translations/restore'=>['POST'],'/api/admin/localization'=>['GET','POST'],'/api/admin/seo'=>['GET','POST'],'/api/admin/ai'=>['GET'],'/api/admin/ai/settings'=>['POST'],'/api/admin/ai/generate'=>['POST'],'/api/admin/ai/poll'=>['POST'],'/api/admin/ai/apply'=>['POST'],'/api/admin/ai/media'=>['GET'],'/api/health'=>['GET'],'/api/admin/session'=>['GET'],'/api/admin/login'=>['POST'],'/api/admin/logout'=>['POST'],'/api/feedback'=>['POST'],'/api/admin'=>['GET'],'/api/admin/records'=>['POST'],'/api/admin/history'=>['GET'],'/api/admin/restore'=>['POST'],'/api/admin/backup'=>['GET'],'/api/admin/restore-backup'=>['POST'],'/api/admin/import'=>['POST'],'/api/admin/feedback'=>['POST'],'/api/admin/apple'=>['POST'],'/api/admin/settings'=>['GET','POST'],'/api/admin/admission'=>['GET','POST'],'/api/admin/refresh'=>['GET','POST']];
            if(!isset($routes[$path]))throw new ApiException('API yolu bulunamadı.',404);
            if(!in_array($method,$routes[$path],true)){header('Allow: '.implode(', ',$routes[$path]));throw new ApiException('Yöntem desteklenmiyor.',405);}
            $repo=new Repository($db,$config);$auth=new Auth($db,$repo,$config);
            if($method==='POST')$auth->sameOrigin();
            if(str_starts_with($path,'/api/admin')&&!in_array($path,['/api/admin/session','/api/admin/login','/api/admin/logout'],true))$auth->requireAdmin();
            $b=$method==='POST'&&$path!=='/api/admin/logout'?self::body($path==='/api/admin/media'?3145728:2097152):[];
            if(str_starts_with($path,'/api/admin')&&!in_array($path,['/api/admin/session','/api/admin/login','/api/admin/logout'],true))EditorRoles::authorize($auth->principal()??[],$path,$method,$b);
            $refresh=new SourceRefresh($db,$repo);
            switch($path){
                case '/api/submissions':
                    $submissions=new AppSubmissions($db,$repo,$config);
                    if($method==='GET'){$result=$submissions->publicConfig(isset($_GET['locale'])?self::string($_GET,'locale'):'en');break;}
                    $auth->rateLimit('submissions:global',3000,3600000);$auth->rateLimit('submissions:ip:'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'local')),180,3600000);
                    $result=$submissions->publicAction($b);break;
                case '/api/submissions/media':
                    $auth->rateLimit('submission-media:global',1200,3600000);$auth->rateLimit('submission-media:ip:'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'local')),120,3600000);
                    if(($b['action']??null)==='upload'){$auth->rateLimit('submission-upload:global',240,3600000);$auth->rateLimit('submission-upload:ip:'.hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'local')),48,3600000);}
                    $result=(new AppSubmissions($db,$repo,$config))->publicMedia($b);
                    if(is_string($result)){header('Content-Type: '.(['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'][$b['format']]));header('Content-Length: '.strlen($result));echo $result;exit;}break;
                case '/api/admin/submissions':
                    $submissions=new AppSubmissions($db,$repo,$config);$result=$method==='GET'?$submissions->adminState($_GET,$auth->principal()??[]):$submissions->adminAction($b,$auth->principal()??[]);break;
                case '/api/admin/submissions/media':
                    $bytes=(new AppSubmissions($db,$repo,$config))->adminMedia($_GET,$auth->principal()??[]);$format=self::string($_GET,'format');header('Content-Type: '.(['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'][$format]));header('Content-Length: '.strlen($bytes));echo $bytes;exit;
                case '/api/admin/media':
                    $auth->rateLimit('media:owner',120,3600000);
                    if($method==='POST'){$result=['image'=>ContentMedia::upload($b)];break;}
                    $id=self::string($_GET,'id');$format=self::string($_GET,'format');$bytes=ContentMedia::read($id,$format);header('Content-Type: '.(['png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp'][$format]));header('Content-Length: '.strlen($bytes));echo $bytes;exit;
                case '/api/admin/system-health':$result=(new SystemHealth($db,$repo,$config))->state();break;
                case '/api/admin/extensions/preview':$result=['preview'=>(new Extensions($repo))->preview($b)];break;
                case '/api/admin/extensions/export':$result=(new Extensions($repo))->export(self::string($_GET,'id'));break;
                case '/api/admin/source-providers':if(($auth->principal()['role']??null)!=='owner')throw new ApiException('Owner access required.',403);$providers=new StoreProviders($db,$repo);$result=$method==='GET'?$providers->state():$providers->save($b);break;
                case '/api/admin/record':$record=$repo->record(self::string($_GET,'kind'),self::string($_GET,'id'));if(!$record)throw new ApiException('Record not found.',404);$result=['record'=>$record];break;
                case '/api/admin/ai/jobs':$result=['job'=>(new AIService($db,$config,$aiProvider))->jobAction($b)];break;
                case '/api/admin/security':if(($auth->principal()['role']??null)!=='owner')throw new ApiException('Owner access required.',403);$service=new AccountSecurity($db,$repo,$config,$auth);$result=$method==='GET'?$service->state():$service->change($b);break;
                case '/api/admin/backup-transfer':if(($auth->principal()['role']??null)!=='owner')throw new ApiException('Owner access required.',403);$service=new BackupTransfer($db,$repo,$config,$auth);$result=$method==='GET'?$service->state(isset($_GET['id'])?self::string($_GET,'id'):null):$service->action($b);break;
                case '/api/admin/language-packs':if(($auth->principal()['role']??null)!=='owner')throw new ApiException('Owner access required.',403);$service=new LanguagePacks($db,$repo);$result=$method==='GET'?$service->state():$service->handle($b);break;
                case '/api/catalog':$result=(new CatalogQuery($db,$repo))->response($_GET,$config);break;

                case '/api/admin/upgrade':if(($auth->principal()['role']??null)!=='owner')throw new ApiException('Owner access required.',403);$upgrade=new Upgrade($db,$repo,$config);if($method==='GET'&&isset($_GET['download'])){if(!is_string($_GET['download']))throw new ApiException('Invalid receipt.');$bytes=$upgrade->download($_GET['download']);header('Content-Type: application/json');header('Content-Disposition: attachment; filename="wexashelf-catalog-backup.json"');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');echo $bytes;exit;}$result=$method==='GET'?$upgrade->state():$upgrade->change($b);break;
                case '/api/admin/performance':$performance=new Performance($db,$repo);if($method==='POST')$performance->configure($b);$result=$performance->state();break;
                case '/api/vitals':$auth->rateLimit('vitals:global',15000,86400000);$result=(new Performance($db,$repo))->collect($b);break;
                case '/api/admin/editors':$editors=new EditorRoles($repo);$result=$method==='GET'?$editors->state():$editors->save($b);break;
                case '/api/admin/capabilities':$capabilities=new Capabilities($db,$repo);$result=$method==='GET'?$capabilities->stateData():['capability'=>$capabilities->save($b)];break;
                case '/api/admin/capabilities/proposals':$result=(new Capabilities($db,$repo))->reviewProposal($b);break;
                case '/api/proposals':$auth->rateLimit('proposals:global',20,3600000);$result=(new Capabilities($db,$repo))->propose($b);break;

                case '/api/admin/extensions':$extensions=new Extensions($repo);$result=$method==='GET'?$extensions->state():['modules'=>$extensions->change($b)];break;
                case '/api/admin/extensions/restore-theme':if(!is_int($b['revision']??null)||!is_int($b['currentRevision']??null))throw new ApiException('Invalid theme revision.');$result=['settings'=>(new Extensions($repo))->restoreTheme($b['revision'],$b['currentRevision'])];break;

                case '/api/admin/growth':$growth=new Growth($db,$repo,$config);$result=$method==='GET'?$growth->state():['document'=>$growth->save($b)];break;
                case '/api/admin/growth/history':$result=['revisions'=>(new Growth($db,$repo,$config))->history(self::string($_GET,'id'),self::string($_GET,'locale'))];break;
                case '/api/admin/growth/restore':if(!is_int($b['revision']??null))throw new ApiException('Invalid revision.');$result=['document'=>(new Growth($db,$repo,$config))->restore(self::string($b,'id'),self::string($b,'locale'),$b['revision'])];break;
                case '/api/admin/growth/insights':$result=(new Growth($db,$repo,$config))->insights();break;
                case '/api/admin/growth/lifecycle':$growth=new Growth($db,$repo,$config);$result=['lifecycle'=>$method==='GET'?$growth->lifecycle():$growth->saveLifecycle($b)];break;
                case '/api/admin/growth/gsc':$auth->rateLimit('growth:gsc',20,3600000);$result=['gsc'=>(new Growth($db,$repo,$config))->importGsc($b)];break;

                case '/api/admin/translations':$translations=new Translations($db,$repo);$result=$method==='GET'?$translations->state($_GET):['translation'=>$translations->save($b)];break;
                case '/api/admin/translations/history':$result=['revisions'=>(new Translations($db,$repo))->history(self::string($_GET,'kind'),self::string($_GET,'id'),self::string($_GET,'locale'))];break;
                case '/api/admin/translations/restore':if(!is_int($b['revision']??null))throw new ApiException('Geçersiz revizyon.');$result=['translation'=>(new Translations($db,$repo))->restore(self::string($b,'kind'),self::string($b,'id'),self::string($b,'locale'),$b['revision'])];break;
                case '/api/admin/localization':$translations=new Translations($db,$repo);$result=['settings'=>$method==='GET'?$translations->settings():$translations->saveSettings($b)];break;
                case '/api/admin/seo':$seo=new SEOSettings($repo,$config);if($method==='POST')$seo->save($b);$result=$seo->state();break;
                case '/api/admin/ai':$result=(new AIService($db,$config,$aiProvider))->state($_GET);break;
                case '/api/admin/ai/settings':$auth->rateLimit('ai:settings',60,3600000);$result=(new AIService($db,$config,$aiProvider))->settings($b);break;
                case '/api/admin/ai/generate':$auth->rateLimit('ai:generate',60,3600000);$result=['job'=>(new AIService($db,$config,$aiProvider))->generate($b)];break;
                case '/api/admin/ai/poll':$auth->rateLimit('ai:poll',120,60000);$result=['job'=>(new AIService($db,$config,$aiProvider))->poll(self::string($b,'id'))];break;
                case '/api/admin/ai/apply':$result=(new AIService($db,$config,$aiProvider))->apply($b);break;
                case '/api/admin/ai/media':$bytes=AIMedia::read(self::string($_GET,'id'));header('Content-Type: image/png');echo $bytes;exit;
                case '/api/health':$db->query('SELECT 1');$result=['status'=>'ok'];break;
                case '/api/admin/session':$result=['authenticated'=>$auth->authenticated(),'configured'=>$auth->configured(),'principal'=>$auth->principal()];break;
                case '/api/admin/login':$auth->login($b['password']??null,$b['username']??'owner',$b['code']??'');$result=['authenticated'=>true];break;
                case '/api/admin/logout':$auth->logout();$result=['authenticated'=>false];break;
                case '/api/admin':$result=array_merge($repo->getAdminSnapshot($_GET),['defaultSourceLocale'=>(new Translations($db,$repo))->settings()['sourceLocale'],'runtimeLocalePacks'=>LanguagePacks::runtimePackages()]);break;
                case '/api/admin/records':$result=['record'=>$repo->saveRecord($b)];break;
                case '/api/admin/history':$result=['revisions'=>$repo->history(self::string($_GET,'kind'),self::string($_GET,'id'))];break;
                case '/api/admin/restore':if(!is_int($b['revision']??null))throw new ApiException('Geçersiz revizyon isteği.');$result=['record'=>$repo->restoreRevision(self::string($b,'kind'),self::string($b,'id'),$b['revision'])];break;
                case '/api/admin/backup':$result=$repo->exportBackup();break;
                case '/api/admin/restore-backup':$result=$repo->restoreBackup($b['backup']??null,($b['dryRun']??null)===true);break;
                case '/api/admin/import':$result=$repo->importRecords($b['records']??null,($b['dryRun']??null)!==false);break;
                case '/api/admin/feedback':if(!is_int($b['id']??null))throw new ApiException('Geçersiz bildirim isteği.');$result=$repo->updateFeedback($b['id'],self::string($b,'status'));break;
                case '/api/feedback':$auth->rateLimit('feedback:global',20,3600000);$result=$repo->submitFeedback($b);break;
                case '/api/admin/settings':$result=['settings'=>$method==='GET'?$repo->getSiteSettings():$repo->saveSiteSettings($b)];break;
                case '/api/admin/admission':$result=$repo->saveAdmissionRules($method==='GET'?$repo->getAdmissionRules():($b['rules']??null),$method==='GET'||($b['dryRun']??null)!==false);break;
                case '/api/admin/apple':
                    $auth->rateLimit('apple:global',20,3600000);$apple=AppleProvider::lookup(self::string($b,'id'),self::string($b,'country'));$app=$apple['app'];
                    $result=['source'=>$apple['source'],'candidate'=>['name'=>$app['trackName'],'publisher'=>$app['sellerName']??'','description'=>$app['description'],'website'=>$app['sellerUrl']??'','storeLinks'=>['ios'=>$apple['storeLink']],'platforms'=>['ios'],'pricingModel'=>'unknown','facts'=>[],'plans'=>[],'observedAt'=>$apple['observedAt']],'note'=>'Apple kaynak adayıdır; inceleme ve tam kayıt oluşturma gerekir. Otomatik yayımlanmaz.'];break;
                case '/api/admin/refresh':
                    if($method==='GET'){$result=$refresh->state(isset($_GET['appId'])?self::string($_GET,'appId'):null);break;}$action=self::string($b,'action');
                    if(in_array($action,['fetch','preview'],true)){$auth->rateLimit('apple:global',20,3600000);$result=$refresh->fetch(self::string($b,'appId'),self::string($b,'country'),isset($b['platform'])?self::string($b,'platform'):'ios',isset($b['providerId'])?self::string($b,'providerId'):null);}
                    elseif($action==='queue')$result=['job'=>(new SourceWorker($db,$repo))->enqueue($b)];elseif(in_array($action,['retry','cancel'],true))$result=['job'=>(new SourceWorker($db,$repo))->action($b)];elseif($action==='manual')$result=$refresh->manual($b);elseif(in_array($action,['apply','dismiss'],true)){$auth->rateLimit('refresh:review',120,3600000);$result=$refresh->review(self::string($b,'id'),$action);}else throw new ApiException('Geçersiz işlem.');break;
            }
            echo json_encode($result,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
        }catch(ApiException $e){http_response_code($e->status);echo json_encode(['error'=>ServerErrors::message($e->getMessage())],JSON_UNESCAPED_UNICODE);}
        catch(\Throwable $e){http_response_code($path==='/api/health'?503:500);echo json_encode($path==='/api/health'?['status'=>'unavailable']:['error'=>ServerErrors::message('İşlem tamamlanamadı.')]);error_log('WexaShelf API failure: '.get_class($e));}
        exit;
    }
    private static function string(array $input,string $key): string {if(!is_string($input[$key]??null))throw new ApiException('Geçersiz istek alanı: '.$key);return $input[$key];}
    public static function body(int $limit=2097152): array {
        if((int)($_SERVER['CONTENT_LENGTH']??0)>$limit)throw new ApiException('İstek çok büyük.',413);
        $stream=fopen('php://input','rb');$raw=stream_get_contents($stream,$limit+1);fclose($stream);
        if($raw===false||strlen($raw)>$limit)throw new ApiException('İstek çok büyük.',413);
        try{$obj=json_decode($raw,false,64,JSON_THROW_ON_ERROR);if(!$obj instanceof \stdClass)throw new ApiException('JSON nesnesi gerekli.');return json_decode($raw,true,64,JSON_THROW_ON_ERROR);}catch(\JsonException){throw new ApiException('Geçersiz JSON.');}
    }
}
