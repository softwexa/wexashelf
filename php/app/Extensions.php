<?php
declare(strict_types=1);
namespace WexaShelf;

/** Installable declarative modules have no executable code or external resource loading. */
final class Extensions {
    public function __construct(private Repository $repo){}
    public static function validatePackage(mixed $p):array {
        $schema=is_array($p)?($p['schemaVersion']??null):null;
        Validation::check(is_array($p)&&!array_diff(array_keys($p),['schemaVersion','id','name','description','version','requires',$schema===2?'blocks':'cards'])&&in_array($schema,[1,2],true),'Unsupported module package.');
        Validation::check(strlen(json_encode($p,JSON_THROW_ON_ERROR))<=131072,'The package is too large.');
        Validation::check(is_string($p['id']??null)&&preg_match('/^[a-z][a-z0-9-]{2,63}$/D',$p['id']),'Invalid module ID.');
        foreach(['name'=>100,'description'=>500,'version'=>40] as $key=>$max){Validation::str($p[$key]??null,$key,$max);Validation::check(trim($p[$key])!=='','Module metadata is required.');}
        Validation::check(preg_match('/^\d+\.\d+\.\d+$/D',$p['version'])&&($p['requires']??null)==='wexashelf-module-api:'.$schema,'Unsupported module API or version.');
        if($schema===2){
            $ids=[];$blocks=Validation::items($p['blocks']??null,'blocks',4);Validation::check(count($blocks)>0,'A functional module needs at least one block.');
            foreach($blocks as $block){
                Validation::check(is_array($block)&&!array_diff(array_keys($block),['id','type','locales','appIds','limit','factKeys'])&&is_string($block['id']??null)&&preg_match('/^[a-z][a-z0-9-]{1,63}$/D',$block['id'])&&!isset($ids[$block['id']]),'Invalid or duplicate module block.');$ids[$block['id']]=true;
                Validation::check(in_array($block['type']??null,['curated-apps','comparison','latest-articles'],true),'Unsupported functional block.');
                self::copy($block['locales']??null,false);
                if($block['type']==='latest-articles')Validation::check(!isset($block['appIds'],$block['factKeys'])&&!array_key_exists('appIds',$block)&&!array_key_exists('factKeys',$block)&&is_int($block['limit']??null)&&$block['limit']>=1&&$block['limit']<=6,'Latest articles requires a limit from 1 to 6.');
                else {
                    Validation::check(!array_key_exists('limit',$block),'App blocks cannot define an article limit.');
                    $apps=Validation::items($block['appIds']??null,'appIds',$block['type']==='comparison'?4:12);
                    Validation::check(count($apps)>=($block['type']==='comparison'?2:1)&&count(array_unique($apps,SORT_REGULAR))===count($apps),'Choose unique app IDs within the block limit.');
                    foreach($apps as $id)Validation::check(is_string($id)&&preg_match('/^[a-z0-9][a-z0-9-]{0,79}$/D',$id),'Invalid app reference.');
                    if($block['type']==='comparison'){$facts=Validation::items($block['factKeys']??null,'factKeys',5);foreach($facts as $key)Validation::check(is_string($key)&&in_array($key,Validation::FACTS,true),'Choose recorded fact keys for comparison.');Validation::check(count($facts)>0&&count(array_unique($facts))===count($facts),'Choose recorded fact keys for comparison.');}
                    else Validation::check(!array_key_exists('factKeys',$block),'Curated apps cannot define comparison facts.');
                }
            }
            return $p;
        }
        $ids=[];foreach(Validation::items($p['cards']??null,'cards',12) as $card){
            Validation::check(is_array($card)&&!array_diff(array_keys($card),['id','locales'])&&is_string($card['id']??null)&&preg_match('/^[a-z][a-z0-9-]{1,63}$/D',$card['id'])&&!isset($ids[$card['id']]),'Invalid or duplicate module card.');$ids[$card['id']]=true;
            Validation::check(is_array($card['locales']??null)&&isset($card['locales']['en'])&&count($card['locales'])<=24,'English module content is required.');
            foreach($card['locales'] as $code=>$copy){Validation::check(is_string($code)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$code)&&is_array($copy)&&!array_diff(array_keys($copy),['title','description','href']),'Invalid module language.');foreach(['title'=>120,'description'=>500] as $key=>$max){Validation::str($copy[$key]??null,$key,$max);Validation::check(trim($copy[$key])!=='','Module text is required.');}$href=$copy['href']??null;Validation::check(is_string($href)&&strlen($href)<=500&&preg_match('~^/[a-zA-Z0-9][a-zA-Z0-9/_.%-]*$~D',$href)&&!str_contains($href,'..')&&!preg_match('/%2f|%5c|%2e/i',$href)&&!preg_match('~^/(?:[a-z]{2,3}(?:-[A-Z]{2})?/)?(?:api|admin|yonetim|install|kurulum|assets|media)(?:/|$)~i',rawurldecode($href))&&!str_contains(rawurldecode($href),'%'),'Cards must link to a local public page.');}
        }
        return $p;
    }
    private static function copy(mixed $locales,bool $links):void {
        Validation::check(is_array($locales)&&isset($locales['en'])&&count($locales)<=24,'English module content is required.');
        foreach($locales as $code=>$copy){Validation::check(is_string($code)&&preg_match('/^[a-z]{2,3}(?:-[A-Z]{2})?$/D',$code)&&is_array($copy)&&!array_diff(array_keys($copy),$links?['title','description','href']:['title','description']),'Invalid module language.');foreach(['title'=>120,'description'=>500] as $key=>$max){Validation::str($copy[$key]??null,$key,$max);Validation::check(trim($copy[$key])!==''&&!preg_match('/<[^>]+>/',$copy[$key]),'Module text must be plain text.');}}
    }
    public static function validateState(mixed $v):array {
        Validation::check(is_array($v)&&is_int($v['revision']??null)&&$v['revision']>=0&&$v['revision']<2147483647,'Invalid module revision.');$seen=[];
        foreach(Validation::items($v['packages']??null,'packages',40) as $package){Validation::check(is_array($package)&&is_bool($package['enabled']??null),'Invalid module status.');$manifest=self::validatePackage($package['manifest']??null);Validation::check(!isset($seen[$manifest['id']]),'Duplicate module.');$seen[$manifest['id']]=true;Validation::date($package['installedAt']??null);Validation::check(($package['checksum']??null)===self::checksum($manifest),'Module checksum does not match its contents.');if($manifest['schemaVersion']===2&&$package['enabled']){Validation::check(($package['reviewedChecksum']??null)===$package['checksum'],'Functional module must be reviewed before activation.');Validation::date($package['reviewedAt']??null);}}
        $requirements=self::packageRequirements($v['packages']);Validation::check(count($requirements['appIds'])<=96&&$requirements['blockCount']<=12,'Too many active functional module blocks or app references.');return ['revision'=>$v['revision'],'packages'=>$v['packages']];
    }
    public static function checksum(array $manifest):string{return hash('sha256',json_encode($manifest,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));}
    public function installed():array{return self::validateState($this->repo->setting('module-packages',['revision'=>0,'packages'=>[]]));}
    private static function packageRequirements(array $packages):array {
        $ids=[];$latest=0;$count=0;foreach($packages as $package){if(!$package['enabled']||$package['manifest']['schemaVersion']!==2)continue;foreach($package['manifest']['blocks'] as $block){$count++;array_push($ids,...($block['appIds']??[]));$latest=max($latest,$block['limit']??0);}}
        return ['appIds'=>array_values(array_unique($ids)),'latestArticleLimit'=>$latest,'blockCount'=>$count];
    }
    public function requirements(?array $manifest=null):array {return self::packageRequirements($manifest?[['enabled'=>true,'manifest'=>self::validatePackage($manifest)]]:$this->installed()['packages']);}
    public static function bundled():array {
        $file=dirname(__DIR__).'/resources/bundled-modules.json';if(!is_file($file))return [];$rows=json_decode(file_get_contents($file),true,32,JSON_THROW_ON_ERROR);$out=[];
        foreach(Validation::items($rows,'bundledModules',12) as $manifest){$manifest=self::validatePackage($manifest);$out[]=['manifest'=>$manifest,'checksum'=>self::checksum($manifest)];}return $out;
    }
    private function locale():string{return ($this->repo->setting('localization',[])['defaultLocale']??'en');}
    public function state():array{$locale=$this->locale();$source=$this->repo->extensionCatalog($this->requirements(),$locale,true);$catalog=Localization::localizedCatalog($source,$locale);$catalog['extensionBlocks']=$this->blocks($source,$locale);return ['previewLocale'=>$locale,'previewLocales'=>array_column(array_filter($source['localization']['locales'],fn($row)=>$row['enabled']),'code'),'modules'=>$this->installed(),'available'=>self::bundled(),'siteSettings'=>$this->repo->getSiteSettings(),'themeHistory'=>$this->repo->setting('appearance-history',[]),'catalog'=>$catalog];}
    public function export(string $id):array {foreach($this->installed()['packages'] as $package)if($package['manifest']['id']===$id)return ['manifest'=>$package['manifest'],'checksum'=>$package['checksum']];throw new ApiException('Module not found.',404);}
    public function preview(array $input):array {
        $manifest=self::validatePackage($input['manifest']??null);$locale=$input['locale']??$this->locale();Validation::check(is_string($locale)&&isset(Localization::packs()[$locale]),'Choose an available preview language.');
        $source=$this->repo->extensionCatalog($this->requirements($manifest),$locale);$blocks=$this->blocks($source,$locale,$manifest);$cards=$this->cards($locale,$manifest);$prior=null;
        foreach($this->installed()['packages'] as $package)if($package['manifest']['id']===$manifest['id'])$prior=$package;
        $operation=$prior?(version_compare($manifest['version'],$prior['manifest']['version'],'>')?'upgrade':(self::checksum($manifest)===$prior['checksum']?'identical':'incompatible-version')):'install';
        $warnings=[];$rendered=array_column($blocks,'id');foreach($manifest['blocks']??[] as $block){if(!isset($block['locales'][$locale]))$warnings[]=['code'=>'missing-locale','blockId'=>$block['id']];elseif(!in_array($block['id'],$rendered,true))$warnings[]=['code'=>'unavailable-content','blockId'=>$block['id']];else{foreach($blocks as $public)if($public['id']===$block['id']&&isset($block['appIds'])){$missing=array_values(array_diff($block['appIds'],array_column($public['apps'],'id')));if($missing)$warnings[]=['code'=>'missing-apps','blockId'=>$block['id'],'ids'=>$missing];}}}
        return ['manifest'=>$manifest,'checksum'=>self::checksum($manifest),'locale'=>$locale,'operation'=>$operation,'fromVersion'=>$prior['manifest']['version']??null,'canInstall'=>in_array($operation,['install','upgrade'],true),'canEnable'=>$manifest['schemaVersion']===1||count($blocks)>0,'blocks'=>$blocks,'cards'=>$cards,'warnings'=>$warnings];
    }
    public function change(array $input):array {
        Validation::check(is_int($input['revision']??null)&&in_array($input['action']??null,['install','enable','disable','uninstall'],true),'Invalid module action.');
        $manifest=$input['action']==='install'?self::validatePackage($input['manifest']??null):null;
        return $this->repo->transaction(function()use($input,$manifest){$state=$this->installed();if($state['revision']!==$input['revision'])throw new ApiException('Modules changed. Reload before continuing.',409);$id=$manifest['id']??$input['id']??null;Validation::check(is_string($id),'Module ID required.');$found=false;$next=[];foreach($state['packages'] as $package){if($package['manifest']['id']!==$id){$next[]=$package;continue;}$found=true;if($manifest)Validation::check(version_compare($manifest['version'],$package['manifest']['version'],'>'),'An upgrade must increase the installed module version.');if($input['action']==='uninstall'||$input['action']==='install')continue;
            if($input['action']==='enable'&&$package['manifest']['schemaVersion']===2){Validation::check(($input['reviewedChecksum']??null)===$package['checksum'],'Review this exact package before enabling it.');$preview=$this->preview(['manifest'=>$package['manifest'],'locale'=>$input['locale']??$this->locale()]);Validation::check($preview['canEnable'],'This module has no available published content.');$package['reviewedChecksum']=$package['checksum'];$package['reviewedAt']=Repository::now();}
            $package['enabled']=$input['action']==='enable';$next[]=$package;}
            if($manifest){$next[]=['manifest'=>$manifest,'checksum'=>self::checksum($manifest),'enabled'=>false,'installedAt'=>Repository::now()];}else Validation::check($found,'Module not found.');
            $state=self::validateState(['revision'=>$state['revision']+1,'packages'=>$next]);$this->repo->setSetting('module-packages',$state);$this->repo->audit('module-'.$input['action'],$id,$manifest?'sha256='.self::checksum($manifest):'');return $state;});
    }
    public function cards(string $locale,?array $manifest=null):array {$out=[];foreach($manifest?[['enabled'=>true,'manifest'=>$manifest]]:$this->installed()['packages'] as $package){if(!$package['enabled'])continue;foreach($package['manifest']['cards']??[] as $card){$copy=$card['locales'][$locale]??null;if(!$copy)continue;$out[]=array_merge(['moduleId'=>$package['manifest']['id'],'id'=>$card['id']],$copy);}}return $out;}
    public function blocks(array $source,string $locale,?array $manifest=null):array {
        $catalog=Localization::localizedCatalog($source,$locale);$apps=array_column($catalog['apps'],null,'id');$articles=$catalog['articles'];usort($articles,fn($a,$b)=>(strtotime($b['publishedAt'])<=>strtotime($a['publishedAt']))?:strcmp($a['id'],$b['id']));$out=[];
        foreach($manifest?[['enabled'=>true,'manifest'=>self::validatePackage($manifest)]]:$this->installed()['packages'] as $package){if(!$package['enabled'])continue;foreach($package['manifest']['blocks']??[] as $block){$copy=$block['locales'][$locale]??null;if(!$copy)continue;$public=['moduleId'=>$package['manifest']['id'],'id'=>$block['id'],'type'=>$block['type'],'title'=>$copy['title'],'description'=>$copy['description'],'apps'=>[],'articles'=>[]];
            if($block['type']==='latest-articles'){foreach(array_slice($articles,0,$block['limit']) as $article){$entry=Localization::entry($source,'article',$article['id'],$locale);if($entry)$public['articles'][]=array_intersect_key($article,array_flip(['id','title','summary','publishedAt']))+['href'=>Localization::path($locale,'blog',$entry['slug'])];}if(!$public['articles'])continue;}
            else {foreach($block['appIds'] as $id){$app=$apps[$id]??null;$entry=Localization::entry($source,'app',$id,$locale);if(!$app||!$entry)continue;$item=array_intersect_key($app,array_flip(['id','name','tagline','icon','platforms']));$item['href']=Localization::path($locale,'uygulama',$entry['slug']);$item['facts']=$block['type']==='comparison'?array_values(array_filter($app['facts']??[],fn($fact)=>in_array($fact['key'],$block['factKeys'],true))):[];$public['apps'][]=$item;}if(count($public['apps'])<($block['type']==='comparison'?2:1))continue;
                if($block['type']==='comparison'){$public['factKeys']=$block['factKeys'];$public['compareHref']=Localization::path($locale,'karsilastir').'?'.http_build_query(['apps'=>implode(',',array_column($public['apps'],'id'))],'','&',PHP_QUERY_RFC3986);}
            }$out[]=$public;
        }}return $out;
    }
    /** Server-rendered equivalent of the functional React blocks, with no hydration dependency. */
    public static function renderBlocks(array $catalog,array $config,string $locale):void {
        $e=fn($value)=>htmlspecialchars((string)$value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');$content=Localization::content($locale);
        foreach($catalog['extensionBlocks']??[] as $block){
            echo '<section data-module-block="'.$e($block['moduleId'].':'.$block['id']).'"><h2>'.$e($block['title']).'</h2><p>'.$e($block['description']).'</p>';
            foreach($block['apps'] as $app){echo '<article><h3><a href="'.$e(Config::url($config,$app['href'])).'">'.$e($app['name']).'</a></h3><p>'.$e($app['tagline']).'</p><p>'.$e(implode(' · ',array_map(fn($platform)=>$content['platformLabels'][$platform]??$platform,$app['platforms']))).'</p>';
                foreach($block['factKeys']??[] as $key){echo '<h4>'.$e($content['factLabels'][$key]??$key).'</h4>';$facts=array_values(array_filter($app['facts'],fn($fact)=>$fact['key']===$key));if(!$facts)echo '<p>'.$e($content['evidenceLabels']['unknown']).'</p>';foreach($facts as $fact)echo '<p>'.$e(($content['platformLabels'][$fact['platform']]??$fact['platform']).' · '.($content['evidenceLabels'][$fact['state']]??$fact['state'])).': '.$e($fact['detail']).' <a rel="noopener noreferrer" href="'.$e($fact['sourceUrl']).'">'.$e(Localization::t($locale,'sourcesAndChecks')).'</a> <time datetime="'.$e($fact['checkedAt']).'">'.$e($fact['checkedAt']).'</time></p>';}
                echo '</article>';
            }
            if(isset($block['compareHref']))echo '<a href="'.$e(Config::url($config,$block['compareHref'])).'">'.$e(Localization::t($locale,'growthComparison')).'</a>';
            foreach($block['articles'] as $article)echo '<article><h3><a href="'.$e(Config::url($config,$article['href'])).'">'.$e($article['title']).'</a></h3><p>'.$e($article['summary']).'</p><p>'.$e(Localization::t($locale,'published')).' <time datetime="'.$e($article['publishedAt']).'">'.$e($article['publishedAt']).'</time></p></article>';
            echo '</section>';
        }
    }
    public function restoreTheme(int $revision,int $currentRevision):array {
        return $this->repo->transaction(function()use($revision,$currentRevision){$current=$this->repo->getSiteSettings();if($current['revision']!==$currentRevision)throw new ApiException('Appearance changed. Reload before restoring.',409);$target=null;foreach($this->repo->setting('appearance-history',[]) as $row)if($row['revision']===$revision)$target=$row;Validation::check($target,'Appearance revision not found.');unset($target['savedAt']);$target['revision']=$currentRevision;return $this->repo->saveSiteSettings($target);});
    }
    public static function validateBackup(mixed $v):array {
        if($v===null)return ['modules'=>['revision'=>0,'packages'=>[]],'themeHistory'=>[]];Validation::check(is_array($v),'Invalid extension backup.');$out=['modules'=>self::validateState($v['modules']??null),'themeHistory'=>[]];$seen=[];foreach(Validation::items($v['themeHistory']??null,'themeHistory',100) as $row){Validation::date($row['savedAt']??null);$savedAt=$row['savedAt'];unset($row['savedAt']);$row=Validation::siteSettings($row);Validation::check(!isset($seen[$row['revision']]),'Duplicate appearance history.');$seen[$row['revision']]=true;$out['themeHistory'][]=array_merge($row,['savedAt'=>$savedAt]);}return $out;
    }
    public function backup():array{return ['modules'=>$this->installed(),'themeHistory'=>$this->repo->setting('appearance-history',[])];}
    public function restoreBackup(array $v):void {$v=self::validateBackup($v);$v['modules']['revision']=$this->installed()['revision']+1;$this->repo->setSetting('module-packages',$v['modules']);$this->repo->setSetting('appearance-history',$v['themeHistory']);}
}
