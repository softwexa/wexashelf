<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';

use WexaShelf\{ApiException,CatalogQuery,ContentMedia,PublicSite,Repository,Translations,Validation};

/** In-memory application fixture, not native MySQL or HTTP hosting verification. */
final class ScreenshotTestDB extends PDO {
    public function __construct() {
        parent::__construct('sqlite::memory:');
        $this->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
        $this->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);
        $this->exec('CREATE TABLE ws_settings(setting_key TEXT PRIMARY KEY,value TEXT);
          CREATE TABLE ws_audit(id INTEGER PRIMARY KEY,action TEXT,subject TEXT,detail TEXT,createdAt TEXT);
          CREATE TABLE ws_records(kind TEXT,id TEXT,payload TEXT,PRIMARY KEY(kind,id));
          CREATE TABLE ws_revisions(kind TEXT,id TEXT,revision INTEGER,payload TEXT,PRIMARY KEY(kind,id,revision));
          CREATE TABLE ws_translations(kind TEXT,base_id TEXT,locale TEXT,slug TEXT,revision INTEGER,payload TEXT,PRIMARY KEY(kind,base_id,locale));
          CREATE TABLE ws_translation_revisions(kind TEXT,base_id TEXT,locale TEXT,revision INTEGER,payload TEXT,PRIMARY KEY(kind,base_id,locale,revision));
          CREATE TABLE ws_catalog_index(kind TEXT,id TEXT,locale TEXT,slug TEXT,available_at INTEGER,category TEXT,platforms INTEGER,pricing TEXT,downloads INTEGER,checked_at TEXT,name TEXT,search_text TEXT,tags TEXT,publisher TEXT,publisher_slug TEXT,PRIMARY KEY(kind,id,locale));');
        // SQLite already extracts scalar JSON values. Only array/object containment is needed here.
        $this->sqliteCreateFunction('JSON_UNQUOTE',static fn($value)=>$value,1);
        $this->sqliteCreateFunction('JSON_CONTAINS',static function($target,$candidate):int {
            if($target===null)return 0;
            $target=json_decode($target,true,512,JSON_THROW_ON_ERROR);
            $candidate=json_decode($candidate,true,512,JSON_THROW_ON_ERROR);
            $contains=static function($haystack,$needle)use(&$contains):bool {
                if(is_array($haystack)&&array_is_list($haystack)) {
                    foreach($haystack as$item)if($contains($item,$needle))return true;
                    return false;
                }
                if(is_array($needle)) {
                    if(!is_array($haystack))return false;
                    foreach($needle as$key=>$value)if(!array_key_exists($key,$haystack)||!$contains($haystack[$key],$value))return false;
                    return true;
                }
                return $haystack===$needle;
            };
            return (int)$contains($target,$candidate);
        },2);
        // The media query includes an article branch; this suite must exercise only its app branch.
        $this->sqliteCreateFunction('JSON_SEARCH',static function():never {
            throw new LogicException('Article JSON search is outside the screenshot fixture.');
        },3);
    }
    public function prepare(string $query,array $options=[]):PDOStatement|false {
        $query=str_replace(
            ['INSERT IGNORE',' FOR UPDATE','ON DUPLICATE KEY UPDATE value=VALUES(value)',
             'ON DUPLICATE KEY UPDATE slug=VALUES(slug),revision=VALUES(revision),payload=VALUES(payload)',
             'ON DUPLICATE KEY UPDATE payload=VALUES(payload)'],
            ['INSERT OR IGNORE','','ON CONFLICT(setting_key) DO UPDATE SET value=excluded.value',
             'ON CONFLICT(kind,base_id,locale) DO UPDATE SET slug=excluded.slug,revision=excluded.revision,payload=excluded.payload',
             'ON CONFLICT DO UPDATE SET payload=excluded.payload'],$query);
        return parent::prepare($query,$options);
    }
}

$checks=0;
function shotCheck(bool $condition,string $label):void {
    global $checks;$checks++;
    if(!$condition)throw new RuntimeException($label);
}
function shotReject(callable $operation,string $label):void {
    try{$operation();}catch(ApiException $error){shotCheck($error->status===400,$label.' status');return;}
    throw new RuntimeException($label.' unexpectedly succeeded');
}
/** Mirrors the public media eligibility chain; no HTTP server or working installation is used. */
function accessibleScreenshot(Repository $repo,CatalogQuery $query,array $image):bool {
    $selection=$query->mediaSelection($image['assetId'],$image['format']);
    $catalog=$repo->getPublicSnapshot($selection);
    return PublicSite::publicMedia($catalog,$image['assetId'],$image['format']);
}
function removeShotFixture(string $path):void {
    foreach(scandir($path)?:[]as$name){if($name==='.'||$name==='..')continue;$file=$path.'/'.$name;if(is_dir($file)&&!is_link($file))removeShotFixture($file);else unlink($file);}
    rmdir($path);
}

$storage=sys_get_temp_dir().'/wexa-app-screenshots-'.bin2hex(random_bytes(8));
mkdir($storage,0700);$priorStorage=getenv('WEXA_STORAGE_PATH');putenv('WEXA_STORAGE_PATH='.$storage);
try {
    $seed=json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true,512,JSON_THROW_ON_ERROR);
    $source=array_values(array_filter($seed['records'],fn($row)=>$row['kind']==='app'))[0];
    $source['id']='screenshot-fixture';$source['revision']=0;$source['sourceLocale']='tr';$source['status']='draft';
    $source['publishAt']=null;$source['seoApproved']=false;$source['data']['id']=$source['id'];
    $source['data']['storeIds']=[];$source['data']['storeMetrics']=[];
    $fixtures=json_decode(file_get_contents(__DIR__.'/fixtures/content-media.json'),true,512,JSON_THROW_ON_ERROR);
    $images=[];
    foreach(['png','jpg','webp']as$format)$images[$format]=ContentMedia::upload([
        'base64'=>$fixtures[$format],'alt'=>'Çalışma alanı — 工作区 😀','caption'=>'Synthetic screenshot fixture',
    ]);
    $image=$images['png'];$source['data']['screenshots']=[$image];
    Validation::data('app',$source['data']);
    foreach([[],[$image]]as$valid)Validation::data('app',array_replace($source['data'],['screenshots'=>$valid]));
    $five=[];for($i=1;$i<=5;$i++)$five[]=array_replace($image,['assetId'=>str_repeat((string)$i,64)]);
    Validation::data('app',array_replace($source['data'],['screenshots'=>$five]));
    foreach([null,'image.png',[$image,$image],[$image,array_replace($image,['format'=>'jpg'])],
        [...$five,array_replace($image,['assetId'=>str_repeat('f',64)])],['named'=>$image]]as$bad)
        shotReject(fn()=>Validation::data('app',array_replace($source['data'],['screenshots'=>$bad])),'Screenshot collection guard');
    foreach([
        ['assetId'=>'../private'],['assetId'=>str_repeat('A',64)],['assetId'=>str_repeat('a',63)],
        ['format'=>'svg'],['format'=>'gif'],['format'=>'jpeg'],['width'=>0],['height'=>-1],
        ['width'=>1.5],['height'=>'800'],['width'=>4097],['width'=>4096,'height'=>4096],
        ['alt'=>''],['alt'=>'   '],['alt'=>'<img src=x>'],['caption'=>"line\nbreak"],
        ['alt'=>null],['caption'=>12],['aiGenerated'=>'false'],['url'=>'https://example.test/image.png'],
    ]as$mutation)shotReject(fn()=>Validation::data('app',array_replace($source['data'],['screenshots'=>[array_replace($image,$mutation)]])),'Screenshot metadata guard');
    foreach(['article','list']as$kind){$record=array_values(array_filter($seed['records'],fn($row)=>$row['kind']===$kind))[0];shotReject(fn()=>Validation::data($kind,array_replace($record['data'],['screenshots'=>[$image]])),'Screenshots are app-only');}
    foreach(['a','文','😀']as$character) {
        Validation::data('app',array_replace($source['data'],[
            'description'=>str_repeat($character,10000),'tags'=>[str_repeat($character,100)],'aliases'=>[str_repeat($character,100)],
            'screenshots'=>[array_replace($image,['alt'=>str_repeat($character,300),'caption'=>str_repeat($character,500)])],
        ]));
        shotReject(fn()=>Validation::data('app',array_replace($source['data'],['description'=>str_repeat($character,10001)])),'Description code-point ceiling');
        foreach(['tags','aliases']as$field)shotReject(fn()=>Validation::data('app',array_replace($source['data'],[$field=>[str_repeat($character,101)]])),'Tag code-point ceiling');
        foreach(['alt'=>301,'caption'=>501]as$field=>$length)shotReject(fn()=>Validation::data('app',array_replace($source['data'],['screenshots'=>[array_replace($image,[$field=>str_repeat($character,$length)])]])),'Screenshot code-point ceiling');
    }
    shotReject(fn()=>Validation::data('app',array_replace($source['data'],['description'=>"invalid\xff"])), 'Invalid UTF-8 description');

    $db=new ScreenshotTestDB();$repo=new Repository($db,['site'=>['url'=>'https://catalog.example.test']]);
    $query=new CatalogQuery($db,$repo);$translations=new Translations($db,$repo);
    $record=$repo->saveRecord($source);
    shotCheck(is_file($storage.'/media/'.$image['assetId'].'.png'),'Draft bytes exist in private storage');
    shotCheck($repo->getPublicSnapshot()['apps']===[]&&!accessibleScreenshot($repo,$query,$image),'Draft screenshot is not public');
    foreach([
        ['published',null,true],['review',null,false],['archived',null,false],
        ['scheduled',gmdate('c',time()+3600),false],['scheduled',gmdate('c',time()-3600),true],
    ]as[$status,$publishAt,$expected]) {
        $record=$repo->saveRecord(array_replace($record,['status'=>$status,'publishAt'=>$publishAt]));
        shotCheck(accessibleScreenshot($repo,$query,$image)===$expected,$status.' screenshot publication boundary');
        shotCheck(PublicSite::publicMedia($repo->getPublicSnapshot(),$image['assetId'],'png')===$expected,$status.' snapshot publication boundary');
    }
    $record=$repo->saveRecord(array_replace($record,['status'=>'published','publishAt'=>null]));
    shotCheck(ContentMedia::read($image['assetId'],'png')===base64_decode($fixtures['png']),'Published eligible screenshot retains verified bytes');
    shotCheck(!accessibleScreenshot($repo,$query,array_replace($image,['format'=>'webp'])),'Wrong format is not public');
    shotCheck(!accessibleScreenshot($repo,$query,$images['webp']),'Unreferenced stored screenshot is not public');

    $paths=array_column(Translations::fieldMap($record),'value','path');
    shotCheck(isset($paths['screenshots.0.alt'],$paths['screenshots.0.caption']),'Screenshot prose is translatable');
    $input=['kind'=>'app','id'=>$record['id'],'locale'=>'en','slug'=>'screenshot-english','revision'=>0,
        'sourceRevision'=>$record['revision'],'status'=>'draft','publishAt'=>null,'seoApproved'=>false,'fields'=>[],'seo'=>[],'reviewNote'=>'Synthetic translation'];
    foreach(['assetId','format','width','height','aiGenerated']as$field) {
        shotCheck(!isset($paths['screenshots.0.'.$field]),'Image '.$field.' is not a translation field');
        shotReject(fn()=>$repo->transaction(fn()=>$translations->save(array_replace($input,['fields'=>['screenshots.0.'.$field=>'changed']]))),'Cannot translate image '.$field);
    }
    $fields=[];foreach($paths as$path=>$text)$fields[$path]='Translated '.$path;
    $fields['screenshots.0.alt']='Translated workspace — çalışma alanı 😀';$fields['screenshots.0.caption']='Translated screenshot';
    $translation=$repo->transaction(fn()=>$translations->save(array_replace($input,['fields'=>$fields,'status'=>'published'])));
    $frozen=$translation['data']['screenshots'][0];
    shotCheck($frozen===array_replace($image,['alt'=>$fields['screenshots.0.alt'],'caption'=>$fields['screenshots.0.caption']]),'Translation changes prose and preserves all media metadata');
    $bundle=$translations->backup();$tampered=$bundle;$tampered['translations'][0]['translatedData']['screenshots'][0]['width']++;
    shotReject(fn()=>Translations::validateBackup($tampered,[$record]),'Backup cannot replace unchanged-source screenshot geometry');

    $record=$repo->saveRecord(array_replace($record,['data'=>array_replace($record['data'],['screenshots'=>[$images['jpg']]])]));
    $publicTranslation=$repo->getPublicSnapshot()['translations'][0];
    shotCheck($publicTranslation['stale']&&$publicTranslation['data']['screenshots'][0]===$frozen,'Source image replacement leaves published translation frozen');
    shotCheck(accessibleScreenshot($repo,$query,$image)&&accessibleScreenshot($repo,$query,$images['jpg']),'Both published source and frozen translation images remain eligible');
    $settings=$translations->settings();$settings['defaultLocale']='tr';$settings['sourceLocale']='tr';
    foreach($settings['locales']as&$locale)if($locale['code']==='en')$locale['enabled']=false;unset($locale);
    $settings=$translations->saveSettings($settings);
    shotCheck(!accessibleScreenshot($repo,$query,$image)&&accessibleScreenshot($repo,$query,$images['jpg']),'Disabled language cannot expose its frozen screenshot');
    foreach($settings['locales']as&$locale)if($locale['code']==='en')$locale['enabled']=true;unset($locale);
    $translations->saveSettings($settings);
    shotCheck(accessibleScreenshot($repo,$query,$image),'Re-enabled published translation restores its frozen screenshot');
    $repo->transaction(fn()=>$translations->save(array_replace($input,['revision'=>$translation['revision'],'sourceRevision'=>$record['revision'],'fields'=>$fields,'status'=>'draft'])));
    shotCheck(!accessibleScreenshot($repo,$query,$image),'Unpublishing the only image reference revokes public access');
    $record=$repo->saveRecord(array_replace($record,['status'=>'draft']));
    shotCheck(!accessibleScreenshot($repo,$query,$images['jpg']),'Unpublishing source revokes current screenshot access');
    echo "PASS app screenshots: $checks assertions; validation, Unicode boundaries, publication states, exact media identity, frozen translations and disabled-locale access. SQLite application fixture; no native MySQL/HTTP claim.\n";
} finally {
    removeShotFixture($storage);
    putenv($priorStorage===false?'WEXA_STORAGE_PATH':'WEXA_STORAGE_PATH='.$priorStorage);
}
