<?php
declare(strict_types=1);
namespace WexaShelf;

use PDO;

/** Optional first-party intake. A receipt authorizes one private submission, never publication. */
final class AppSubmissions {
    public const MAX_ROWS=200;
    public const MAX_IMAGE_BYTES=1048576;
    public const MAX_STORAGE_BYTES=104857600;
    public const MAX_UPLOADS=12;
    public const MAX_SCREENSHOTS=5;
    public const STATUSES=['draft','pending','accepted','rejected','withdrawn'];
    private const SETTINGS='app-submissions-settings';
    private const QUEUE='app-submissions-queue';
    private const DRAFT_DAYS=7;
    public function __construct(private PDO $db,private Repository $repo,private array $config=[]){ }

    public static function defaults():array{return ['enabled'=>false,'revision'=>0];}
    public function settings():array{return self::validateSettings($this->repo->setting(self::SETTINGS,self::defaults()));}
    private static function validateSettings(mixed $input):array {
        Validation::check(is_array($input)&&!array_diff(array_keys($input),['enabled','revision'])&&is_bool($input['enabled']??null)&&self::revision($input['revision']??null),'Invalid submission settings.');
        return $input;
    }
    private static function revision(mixed $value):bool{return is_int($value)&&$value>=0&&$value<2147483647;}
    private static function owner(array $principal):void {if(($principal['role']??'')!=='owner')throw new ApiException('Owner access required.',403);}
    private static function fields(array $input,array $allowed):void {Validation::check(!array_diff(array_keys($input),$allowed),'Unexpected submission fields.');}
    private static function text(mixed $input,int $limit,bool $required=false):string {
        Validation::check(is_string($input)&&mb_check_encoding($input,'UTF-8')&&mb_strlen($input,'UTF-8')<=$limit&&!preg_match('/[<>\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u',$input),'Submission text must be plain text within the allowed length.');
        $value=trim($input);Validation::check(!$required||$value!=='','Required submission information is missing.');return $value;
    }
    private static function https(mixed $input,bool $optional=false):string {
        $url=self::text($input,2048,!$optional);if($optional&&$url==='')return '';
        $parts=parse_url($url);Validation::check(filter_var($url,FILTER_VALIDATE_URL)!==false&&is_array($parts)&&($parts['scheme']??'')==='https'&&!isset($parts['user'])&&!isset($parts['pass'])&&!isset($parts['fragment'])&&(!isset($parts['port'])||$parts['port']===443),'Use a complete HTTPS URL without credentials or fragments.');return $url;
    }
    public static function validateDraft(mixed $input):array {
        Validation::check(is_array($input),'Invalid submission information.');
        self::fields($input,['name','tagline','description','publisher','website','category','sourceLocale','pricingModel','tags','storeLinks','contactName','contactEmail']);
        $out=[];foreach(['name'=>100,'tagline'=>180,'description'=>8000,'publisher'=>120,'contactName'=>100,'contactEmail'=>254] as $key=>$limit)$out[$key]=self::text($input[$key]??'', $limit,in_array($key,['name','tagline','description','publisher'],true));
        Validation::check($out['contactEmail']===''||filter_var($out['contactEmail'],FILTER_VALIDATE_EMAIL)!==false,'Enter a valid private contact email.');
        $out['website']=self::https($input['website']??'',true);
        Validation::check(in_array($input['category']??null,['productivity','notes','documents','media','browser','design'],true),'Choose a valid application category.');$out['category']=$input['category'];
        Validation::check(is_string($input['sourceLocale']??null)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$input['sourceLocale']),'Choose a valid content language.');$out['sourceLocale']=$input['sourceLocale'];
        Validation::check(in_array($input['pricingModel']??null,['free','freemium','subscription','one-time','unknown'],true),'Choose a valid pricing model.');$out['pricingModel']=$input['pricingModel'];
        Validation::check(is_array($input['tags']??null)&&array_is_list($input['tags'])&&count($input['tags'])<=10,'Use no more than ten tags.');$out['tags']=[];
        foreach($input['tags'] as $tag){$tag=self::text($tag,40,true);Validation::check(!in_array($tag,$out['tags'],true),'Duplicate submission tag.');$out['tags'][]=$tag;}
        $links=$input['storeLinks']??null;Validation::check(is_array($links)&&count($links)>=1&&count($links)<=3&&!array_diff(array_keys($links),Validation::PLATFORMS),'Add at least one supported store link.');$out['storeLinks']=[];
        foreach(Validation::PLATFORMS as $platform)if(array_key_exists($platform,$links)){$url=self::https($links[$platform]);Validation::check(Validation::extractStoreId($platform,$url)!==null,'The store link does not identify an application on that platform.');$out['storeLinks'][$platform]=$url;}
        return $out;
    }
    private function checkLanguage(string $locale):void {
        $settings=(new Translations($this->db,$this->repo))->settings();
        Validation::check(in_array($locale,array_column(array_filter($settings['locales'],fn($row)=>$row['enabled']),'code'),true)&&Localization::complete($locale),'The submission language must be installed and enabled.');
    }
    public function publicConfig(string $locale='en'):array {
        $settings=(new Translations($this->db,$this->repo))->settings();$packs=Localization::packs();$locales=[];
        foreach($settings['locales'] as $row)if($row['enabled']&&isset($packs[$row['code']])&&Localization::complete($row['code']))$locales[]=['code'=>$row['code'],'label'=>$packs[$row['code']]['label']];
        if(!isset($packs[$locale])||!Localization::complete($locale))$locale='en';$categories=[];
        foreach(Localization::content($locale)['categories']??[] as $category)if(($category['id']??'all')!=='all')$categories[]=array_intersect_key($category,array_flip(['id','label']));
        return ['enabled'=>$this->settings()['enabled'],'limits'=>['maxScreenshots'=>self::MAX_SCREENSHOTS,'maxImageBytes'=>self::MAX_IMAGE_BYTES,'maxUploads'=>self::MAX_UPLOADS],'locales'=>$locales,'categories'=>$categories];
    }
    private function requireOpen():void {if(!$this->settings()['enabled'])throw new ApiException('New application submissions are closed.',403);}
    private function rows():array{return $this->repo->setting(self::QUEUE,[]);}
    private function store(array $rows):void{$this->repo->setSetting(self::QUEUE,array_values($rows));}
    private static function projection(array $row):array{return array_intersect_key($row,array_flip(['id','status','revision','draft','icon','screenshots','reviewNote','recordId','createdAt','updatedAt']));}
    private static function id(mixed $id):string{Validation::check(is_string($id)&&preg_match('/^[a-f0-9]{32}$/D',$id),'Invalid submission identity.');return $id;}
    private static function token(mixed $token):string{Validation::check(is_string($token)&&preg_match('/^[a-f0-9]{64}$/D',$token),'Invalid private tracking code.');return $token;}
    private static function expired(array $row):bool{return $row['status']==='draft'&&strtotime($row['updatedAt'])<time()-self::DRAFT_DAYS*86400;}
    private static function index(array $rows,string $id):int {foreach($rows as $i=>$row)if($row['id']===$id&&!self::expired($row))return $i;throw new ApiException('Submission was not found or the tracking code is invalid.',404);}
    private static function authenticatedIndex(array $rows,array $input):int {
        $id=self::id($input['id']??null);$token=self::token($input['token']??null);$index=self::index($rows,$id);
        if(!hash_equals($rows[$index]['tokenHash'],hash('sha256',$token)))throw new ApiException('Submission was not found or the tracking code is invalid.',404);return $index;
    }
    private static function expectRevision(array $row,array $input):void {if(!self::revision($input['revision']??null)||$row['revision']!==$input['revision'])throw new ApiException('This submission changed. Reload it before saving.',409);}
    private static function editable(array $row):void {if($row['status']!=='draft')throw new ApiException('Only an unfinished submission can be edited.',409);}
    private static function identities(array $draft):array {
        $ids=[];foreach($draft['storeLinks'] as $platform=>$url)$ids[]=$platform.':'.Validation::extractStoreId($platform,$url);sort($ids);return $ids;
    }
    private function noDuplicate(array $draft,array $rows,?string $ownId=null):void {
        $identities=self::identities($draft);
        foreach($rows as $row)if($row['id']!==$ownId&&in_array($row['status'],['pending','accepted'],true)&&array_intersect($identities,self::identities($row['draft'])))throw new ApiException('This application is already listed or awaiting review.',409);
        $statement=$this->db->query("SELECT payload FROM ws_records WHERE kind='app'");
        while($raw=$statement->fetchColumn()){$record=json_decode($raw,true,512,JSON_THROW_ON_ERROR);if($record['status']==='archived')continue;$existing=[];foreach($record['data']['storeLinks']??[] as $platform=>$url){$identity=Validation::extractStoreId($platform,$url);if($identity!==null)$existing[]=$platform.':'.$identity;}foreach($record['data']['storeIds']??[] as $identity)$existing[]=$identity['platform'].':'.$identity['storeId'];if(array_intersect($identities,$existing))throw new ApiException('This application is already listed or awaiting review.',409);}
    }
    public function publicAction(array $input):array {
        $action=$input['action']??'';if($action==='create')return $this->create($input);
        Validation::check(in_array($action,['status','save','remove-media','submit','withdraw'],true),'Invalid submission action.');
        $allowed=match($action){'status'=>['action','id','token'],'save'=>['action','id','token','revision','draft'],'remove-media'=>['action','id','token','revision','assetId'],'submit'=>['action','id','token','revision','rightsConfirmed'],default=>['action','id','token','revision']};self::fields($input,$allowed);
        return $this->repo->transaction(function()use($input,$action){
            $rows=$this->rows();$index=self::authenticatedIndex($rows,$input);$row=$rows[$index];
            if($action==='status')return ['submission'=>self::projection($row)];
            if(in_array($action,['save','remove-media','submit'],true))$this->requireOpen();
            if($action==='submit'&&$row['status']==='pending')return ['submission'=>self::projection($row)];
            if($action==='withdraw'&&$row['status']==='withdrawn')return ['submission'=>self::projection($row)];
            self::expectRevision($row,$input);
            if($action==='withdraw'){Validation::check(in_array($row['status'],['draft','pending'],true),'This submission can no longer be withdrawn.');$row['status']='withdrawn';}
            else {
                self::editable($row);
                if($action==='save'){$draft=self::validateDraft($input['draft']??null);$this->checkLanguage($draft['sourceLocale']);$this->noDuplicate($draft,$rows,$row['id']);$row['draft']=$draft;}
                elseif($action==='remove-media'){$assetId=$input['assetId']??null;Validation::check(is_string($assetId)&&preg_match('/^[a-f0-9]{64}$/D',$assetId),'Invalid image identity.');$found=false;if(($row['icon']['assetId']??null)===$assetId){$row['icon']=null;$found=true;}$filtered=array_values(array_filter($row['screenshots'],fn($image)=>$image['assetId']!==$assetId));$found=$found||count($filtered)!==count($row['screenshots']);Validation::check($found,'Image is not part of this submission.');$row['screenshots']=$filtered;}
                else {Validation::check(($input['rightsConfirmed']??false)===true&&$row['icon']!==null,'Confirm your permission to submit the application and upload its icon.');$this->checkLanguage($row['draft']['sourceLocale']);$this->noDuplicate($row['draft'],$rows,$row['id']);foreach(self::images($row) as $image)$this->readImage($row,$image['assetId'],$image['format']);$row['status']='pending';}
            }
            $row['revision']++;$row['updatedAt']=Repository::now();$rows[$index]=$row;$this->store($rows);$this->repo->audit('submission-'.$action,$row['id'],'status='.$row['status']);
            return ['submission'=>self::projection($row)];
        });
    }
    private function create(array $input):array {
        self::fields($input,['action','requestId','token','draft','websiteTrap']);Validation::check(($input['websiteTrap']??'')==='','Invalid submission request.');
        $token=self::token($input['token']??null);$requestId=$input['requestId']??null;Validation::check(is_string($requestId)&&preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D',$requestId),'Invalid submission request identity.');
        return $this->repo->transaction(function()use($input,$token,$requestId){
            $rows=$this->rows();$requestHash=hash('sha256',$requestId);$tokenHash=hash('sha256',$token);
            foreach($rows as $row)if(hash_equals($row['requestHash'],$requestHash)){if(!hash_equals($row['tokenHash'],$tokenHash)||self::expired($row))throw new ApiException('The submission request could not be resumed.',409);return ['submission'=>self::projection($row)];}
            $this->requireOpen();$draft=self::validateDraft($input['draft']??null);$this->checkLanguage($draft['sourceLocale']);$rows=$this->cleanupExpired($rows);if(count($rows)>=self::MAX_ROWS)throw new ApiException('The submission queue is full. Try again later.',429);
            $addressHash=hash('sha256',(string)($_SERVER['REMOTE_ADDR']??'local'));$recent=array_filter($rows,fn($row)=>strtotime($row['createdAt'])>time()-86400);
            if(count($recent)>=20||count(array_filter($recent,fn($row)=>hash_equals($row['addressHash'],$addressHash)))>=5)throw new ApiException('The daily submission limit has been reached. Try again later.',429);
            $this->noDuplicate($draft,$rows);if($this->storageBytes()>=self::MAX_STORAGE_BYTES)throw new ApiException('Submission media storage is full. Try again later.',429);
            $row=['id'=>bin2hex(random_bytes(16)),'status'=>'draft','revision'=>1,'draft'=>$draft,'icon'=>null,'screenshots'=>[],'reviewNote'=>'','recordId'=>null,'createdAt'=>Repository::now(),'updatedAt'=>Repository::now(),'tokenHash'=>$tokenHash,'requestHash'=>$requestHash,'addressHash'=>$addressHash,'uploads'=>0];$rows[]=$row;$this->store($rows);$this->repo->audit('submission-created',$row['id'],'private draft');return ['submission'=>self::projection($row)];
        });
    }
    private static function images(array $row):array{return [...($row['icon']?[$row['icon']]:[]),...$row['screenshots']];}
    private function rootDirectory():string {
        $dir=Config::storage().'/submissions';if(is_link($dir))throw new ApiException('Private submission media is unavailable.',503);
        if(!is_dir($dir)&&!@mkdir($dir,0700,true))throw new ApiException('Private submission media is unavailable.',503);@chmod($dir,0700);return $dir;
    }
    private function ticketDirectory(string $id,bool $create=false):string {
        $dir=$this->rootDirectory().'/'.self::id($id);if(is_link($dir))throw new ApiException('Private submission media is unavailable.',503);
        if($create&&!is_dir($dir)&&!@mkdir($dir,0700))throw new ApiException('Private submission media is unavailable.',503);return $dir;
    }
    private function storageBytes():int {
        $bytes=0;$root=$this->rootDirectory();foreach(scandir($root)?:[] as $entry){if($entry==='.'||$entry==='..')continue;$directory=$root.'/'.$entry;if(!preg_match('/^[a-f0-9]{32}$/D',$entry)||is_link($directory)||!is_dir($directory))throw new ApiException('Private submission media is unavailable.',503);foreach(scandir($directory)?:[] as $file){if($file==='.'||$file==='..')continue;$path=$directory.'/'.$file;if(is_link($path)||!is_file($path))throw new ApiException('Private submission media is unavailable.',503);$bytes+=(int)filesize($path);}}return $bytes;
    }
    private function eraseTicket(string $id):void {
        $dir=$this->ticketDirectory($id);if(!is_dir($dir))return;foreach(scandir($dir)?:[] as $file){if($file==='.'||$file==='..')continue;$path=$dir.'/'.$file;if(is_link($path)||!is_file($path))throw new ApiException('Private submission media is unavailable.',503);if(!@unlink($path))throw new ApiException('Private submission media could not be removed.',503);}if(!@rmdir($dir))throw new ApiException('Private submission media could not be removed.',503);
    }
    private function cleanupExpired(array $rows):array {foreach($rows as $index=>$row)if(self::expired($row)){$this->eraseTicket($row['id']);unset($rows[$index]);}return array_values($rows);}
    private function readImage(array $row,string $assetId,string $format):string {
        Validation::check((bool)preg_match('/^[a-f0-9]{64}$/D',$assetId)&&in_array($format,['png','jpg','webp'],true),'Invalid image identity.');$image=null;foreach(self::images($row) as $candidate)if($candidate['assetId']===$assetId&&$candidate['format']===$format)$image=$candidate;
        if(!$image)throw new ApiException('Image is not part of this submission.',404);
        $path=$this->ticketDirectory($row['id']).'/'.$assetId.'.'.$format;
        if(is_link($path)||!is_file($path)||filesize($path)>self::MAX_IMAGE_BYTES)throw new ApiException('Submission image is unavailable. Upload it again before sending.',404);
        $bytes=file_get_contents($path);if($bytes===false||!hash_equals($assetId,hash('sha256',$bytes)))throw new ApiException('Submission image is unavailable. Upload it again before sending.',404);
        $actual=ContentMedia::inspectUpload(['base64'=>base64_encode($bytes),'alt'=>$image['alt'],'caption'=>$image['caption']]);if($actual['image']!==$image)throw new ApiException('Submission image metadata does not match its bytes.',409);return $bytes;
    }
    public function publicMedia(array $input):array|string {
        $action=$input['action']??'';Validation::check(in_array($action,['read','upload'],true),'Invalid submission media action.');
        self::fields($input,$action==='read'?['action','id','token','assetId','format']:['action','id','token','revision','kind','base64','alt','caption']);
        if($action==='read'){$rows=$this->rows();$index=self::authenticatedIndex($rows,$input);return $this->readImage($rows[$index],is_string($input['assetId']??null)?$input['assetId']:'',is_string($input['format']??null)?$input['format']:'');}
        return $this->repo->transaction(function()use($input){
            $this->requireOpen();$rows=$this->rows();$index=self::authenticatedIndex($rows,$input);$row=$rows[$index];self::expectRevision($row,$input);self::editable($row);
            Validation::check(in_array($input['kind']??null,['icon','screenshot'],true),'Choose an icon or screenshot.');if($row['uploads']>=self::MAX_UPLOADS)throw new ApiException('This draft has reached its image upload limit.',429);
            Validation::check(is_string($input['base64']??null)&&strlen($input['base64'])<=1398104,'Submission images must be no larger than 1 MiB.');
            $inspected=ContentMedia::inspectUpload(array_intersect_key($input,array_flip(['base64','alt','caption'])));$image=$inspected['image'];$bytes=$inspected['bytes'];Validation::check(strlen($bytes)<=self::MAX_IMAGE_BYTES,'Submission images must be no larger than 1 MiB.');$max=$input['kind']==='icon'?512:2048;
            Validation::check($image['width']<=$max&&$image['height']<=$max,'Resize the image before uploading it.');
            if($input['kind']==='screenshot'){Validation::check(count($row['screenshots'])<self::MAX_SCREENSHOTS,'Use no more than five screenshots.');Validation::check(!in_array($image['assetId'],array_column($row['screenshots'],'assetId'),true),'This screenshot is already attached.');$row['screenshots'][]=$image;}else $row['icon']=$image;
            $directory=$this->ticketDirectory($row['id'],true);$path=$directory.'/'.$image['assetId'].'.'.$image['format'];if(is_link($path))throw new ApiException('Private submission media is unavailable.',503);
            if($this->storageBytes()+(is_file($path)?0:strlen($bytes))>self::MAX_STORAGE_BYTES)throw new ApiException('Submission media storage is full. Try again later.',429);
            $temporary=tempnam($directory,'.upload-');if($temporary===false)throw new ApiException('Submission image could not be saved.',503);
            try {if(!chmod($temporary,0600)||file_put_contents($temporary,$bytes,LOCK_EX)!==strlen($bytes)||!rename($temporary,$path))throw new ApiException('Submission image could not be saved.',503);}finally{if(is_file($temporary))@unlink($temporary);}
            $row['uploads']++;$row['revision']++;$row['updatedAt']=Repository::now();$rows[$index]=$row;$this->store($rows);return ['submission'=>self::projection($row),'image'=>$image];
        });
    }
    public function adminState(array $input,array $principal):array {
        self::owner($principal);$rows=array_values(array_filter($this->rows(),fn($row)=>!self::expired($row)));
        if(isset($input['id']))return ['submission'=>self::projection($rows[self::index($rows,self::id($input['id']))])];
        $status=$input['status']??'pending';Validation::check(is_string($status)&&in_array($status,[...self::STATUSES,'all'],true),'Invalid submission status filter.');$counts=array_fill_keys(self::STATUSES,0);foreach($rows as $row)$counts[$row['status']]++;
        if($status!=='all')$rows=array_values(array_filter($rows,fn($row)=>$row['status']===$status));usort($rows,fn($a,$b)=>strcmp($b['createdAt'],$a['createdAt'])?:strcmp($b['id'],$a['id']));$pages=max(1,(int)ceil(count($rows)/20));$page=max(1,min($pages,is_scalar($input['page']??1)?(int)($input['page']??1):1));
        return ['settings'=>$this->settings(),'items'=>array_map([self::class,'projection'],array_slice($rows,($page-1)*20,20)),'pagination'=>['page'=>$page,'pages'=>$pages,'total'=>count($rows),'pageSize'=>20],'counts'=>$counts];
    }
    public function adminMedia(array $input,array $principal):string {
        self::owner($principal);$rows=$this->rows();$index=self::index($rows,self::id($input['id']??null));return $this->readImage($rows[$index],is_string($input['assetId']??null)?$input['assetId']:'',is_string($input['format']??null)?$input['format']:'');
    }
    public function adminAction(array $input,array $principal):array {
        self::owner($principal);$action=$input['action']??'';Validation::check(in_array($action,['configure','accept','reject','purge'],true),'Invalid submission administration action.');
        self::fields($input,match($action){'configure'=>['action','enabled','revision'],'accept'=>['action','id','revision','recordId','reviewNote','reviewed'],'reject'=>['action','id','revision','reviewNote'],default=>['action','id','revision']});
        $result=$this->repo->transaction(function()use($input,$action){
            if($action==='configure'){$next=self::validateSettings(array_intersect_key($input,array_flip(['enabled','revision'])));if($next['revision']!==$this->settings()['revision'])throw new ApiException('Submission settings changed. Reload before saving.',409);$next['revision']++;$this->repo->setSetting(self::SETTINGS,$next);$this->repo->audit('submission-settings','intake','enabled='.(int)$next['enabled']);return ['settings'=>$next];}
            $rows=$this->rows();$index=self::index($rows,self::id($input['id']??null));$row=$rows[$index];
            if($action==='accept'&&$row['status']==='accepted'&&($input['recordId']??null)===$row['recordId']){$record=$this->repo->record('app',$row['recordId']);if(!$record)throw new ApiException('The accepted application draft no longer exists.',409);return ['submission'=>self::projection($row),'record'=>$record];}
            self::expectRevision($row,$input);
            if($action==='purge'){Validation::check(in_array($row['status'],['accepted','rejected','withdrawn'],true),'Close the submission before removing it.');$this->eraseTicket($row['id']);unset($rows[$index]);$this->store($rows);$this->repo->audit('submission-purge',$row['id'],'private intake removed');return ['deleted'=>true];}
            if($row['status']!=='pending')throw new ApiException('Only a pending submission can be reviewed.',409);
            $row['reviewNote']=self::text($input['reviewNote']??'',1000,$action==='reject');$record=null;
            if($action==='reject')$row['status']='rejected';
            else {
                Validation::check(($input['reviewed']??false)===true,'Confirm that you reviewed the submitted information and store links.');$recordId=$input['recordId']??null;Validation::check(is_string($recordId)&&preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$recordId),'Choose a valid application address.');if($this->repo->record('app',$recordId))throw new ApiException('The application address is already in use.',409);
                $this->checkLanguage($row['draft']['sourceLocale']);$this->noDuplicate($row['draft'],$rows,$row['id']);Validation::check($row['icon']!==null,'The submitted icon is missing.');
                $copies=[];foreach(self::images($row) as $image){$bytes=$this->readImage($row,$image['assetId'],$image['format']);$copies[$image['assetId']]=ContentMedia::upload(['base64'=>base64_encode($bytes),'alt'=>$image['alt'],'caption'=>$image['caption']]);}
                $draft=$row['draft'];$source=array_values($draft['storeLinks'])[0];$icon=$copies[$row['icon']['assetId']];
                $data=['id'=>$recordId,'name'=>$draft['name'],'tagline'=>$draft['tagline'],'description'=>$draft['description'],'publisher'=>$draft['publisher'],'category'=>$draft['category'],'website'=>$draft['website']?:$source,'platforms'=>array_keys($draft['storeLinks']),'storeLinks'=>$draft['storeLinks'],'icon'=>'/media/'.$icon['assetId'].'.'.$icon['format'],'screenshots'=>array_map(fn($image)=>$copies[$image['assetId']],$row['screenshots']),'color'=>'#397D73','pricingModel'=>$draft['pricingModel'],'pricingLabel'=>'','tags'=>$draft['tags'],'aliases'=>[],'featureNotes'=>[],'facts'=>[],'plans'=>[],'storeMetrics'=>[],'storeIds'=>[],'sourceUrl'=>$source,'checkedAt'=>gmdate('Y-m-d')];
                $record=$this->repo->saveRecord(['kind'=>'app','sourceLocale'=>$draft['sourceLocale'],'data'=>$data,'revision'=>0,'status'=>'draft','seoApproved'=>false,'publishAt'=>null,'reviewNote'=>'Created from a reviewed application submission. Publication and factual checks remain separate.']);$row['status']='accepted';$row['recordId']=$recordId;
            }
            $row['revision']++;$row['updatedAt']=Repository::now();$rows[$index]=$row;$this->store($rows);$this->repo->audit('submission-'.$action,$row['id'],'status='.$row['status']);$response=['submission'=>self::projection($row)];if($record)$response['record']=$record;return $response;
        });
        return $result;
    }
    public function backup():array{return ['settings'=>$this->settings(),'queue'=>$this->rows()];}
    public static function validateBackup(mixed $input):array {
        if($input===null)return ['settings'=>self::defaults(),'queue'=>[]];Validation::check(is_array($input),'Invalid submission backup.');self::fields($input,['settings','queue']);$settings=self::validateSettings($input['settings']??null);$rows=Validation::items($input['queue']??null,'submission queue',self::MAX_ROWS);$ids=[];$requests=[];
        foreach($rows as &$row){Validation::check(is_array($row),'Invalid submission backup row.');self::fields($row,['id','status','revision','draft','icon','screenshots','reviewNote','recordId','createdAt','updatedAt','tokenHash','requestHash','addressHash','uploads']);$id=self::id($row['id']??null);Validation::check(!isset($ids[$id])&&in_array($row['status']??null,self::STATUSES,true)&&self::revision($row['revision']??null)&&$row['revision']>0,'Invalid or duplicate submission backup identity.');$ids[$id]=true;
            foreach(['tokenHash','requestHash','addressHash'] as $key)Validation::check(is_string($row[$key]??null)&&preg_match('/^[a-f0-9]{64}$/D',$row[$key]),'Invalid private submission hash.');Validation::check(!isset($requests[$row['requestHash']]),'Duplicate submission request identity.');$requests[$row['requestHash']]=true;$row['draft']=self::validateDraft($row['draft']??null);
            Validation::check(array_key_exists('icon',$row)&&is_array($row['screenshots']??null)&&array_is_list($row['screenshots'])&&count($row['screenshots'])<=self::MAX_SCREENSHOTS,'Invalid submission images.');if($row['icon']!==null)Validation::articleImages([$row['icon']]);Validation::articleImages($row['screenshots']);foreach(self::images($row) as $image)Validation::check($image['aiGenerated']===false&&$image['width']<=2048&&$image['height']<=2048,'Invalid submitted image metadata.');if($row['icon'])Validation::check($row['icon']['width']<=512&&$row['icon']['height']<=512,'Invalid submitted icon dimensions.');
            $row['reviewNote']=self::text($row['reviewNote']??null,1000);Validation::check(is_int($row['uploads']??null)&&$row['uploads']>=count($row['screenshots'])+(int)($row['icon']!==null)&&$row['uploads']<=self::MAX_UPLOADS,'Invalid submission upload count.');foreach(['createdAt','updatedAt'] as $key){Validation::date($row[$key]??null);Validation::check((bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/D',$row[$key])&&strtotime($row[$key])<=time()+300,'Submission dates must be valid UTC timestamps and cannot be in the future.');}Validation::check($row['createdAt']<=$row['updatedAt'],'Invalid submission date order.');
            Validation::check(array_key_exists('recordId',$row)&&($row['status']==='accepted'?is_string($row['recordId'])&&preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$row['recordId']):$row['recordId']===null),'Invalid accepted application reference.');if(in_array($row['status'],['pending','accepted','rejected'],true))Validation::check($row['icon']!==null,'A submitted application needs an icon.');
        }unset($row);return ['settings'=>$settings,'queue'=>$rows];
    }
    public function restoreBackup(array $input):void {$backup=self::validateBackup($input);$backup['settings']['revision']=$this->settings()['revision']+1;$this->repo->setSetting(self::SETTINGS,$backup['settings']);$this->store($backup['queue']);}
}
