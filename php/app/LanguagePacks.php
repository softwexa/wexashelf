<?php
declare(strict_types=1);
namespace WexaShelf;

use PDO;

/** Complete declarative JSON packages. Never loads executable uploaded files. */
final class LanguagePacks {
    public const MAX_BYTES = 1048576;
    private const MAX_PACKS = 20;
    private static ?array $runtimeCache = null;
    private static string $runtimeStamp = '';
    public function __construct(private PDO $db, private Repository $repo) {}
    private static function json(mixed $value): string { return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
    private static function file(): string { return Config::storage().'/language-packs.json'; }
    private static function builtin(string $locale): array {
        if (!preg_match('/^[a-z]{2}(?:-[A-Z]{2})?$/D', $locale)) throw new ApiException('Invalid language code.');
        $root=dirname(__DIR__).'/resources/'; $parts=[];
        foreach (['ui'=>'ui','content'=>'content','server'=>'server'] as $key=>$prefix) {
            $path=$root.$prefix.'.'.$locale.'.json';
            if (!is_file($path)) throw new ApiException('The built-in language resources are incomplete. Install matching release resources.',503);
            $parts[$key]=json_decode((string)file_get_contents($path),true,64,JSON_THROW_ON_ERROR);
        }
        return ['schemaVersion'=>1,'locale'=>$locale]+$parts;
    }
    private static function read(): array {
        if (!is_file(self::file())) return ['revision'=>0,'packages'=>[]];
        if (filesize(self::file())>self::MAX_BYTES*self::MAX_PACKS+65536) throw new ApiException('Stored language packages exceed the size limit.',503);
        try { $state=json_decode((string)file_get_contents(self::file()),true,80,JSON_THROW_ON_ERROR); }
        catch (\Throwable) { throw new ApiException('Stored language packages could not be read. Restore the private language package file.',503); }
        if (!is_array($state)||!is_int($state['revision']??null)||$state['revision']<0||!is_array($state['packages']??null)||count($state['packages'])>self::MAX_PACKS) throw new ApiException('Stored language package state is invalid.',503);
        return $state;
    }
    private static function write(array $state): void {
        $temporary=tempnam(Config::storage(),'.language-packs-');
        if ($temporary===false) throw new ApiException('Language package storage is not writable.',503);
        try {
            if (!chmod($temporary,0600)||file_put_contents($temporary,self::json($state),LOCK_EX)===false||!rename($temporary,self::file())) throw new ApiException('Language packages could not be saved.',503);
        } finally { self::$runtimeCache=null;if (is_file($temporary)) unlink($temporary); }
    }
    private static function placeholders(string $value): array { preg_match_all('/\{([a-zA-Z][a-zA-Z0-9_]*)\}/',$value,$matches);$values=$matches[1];sort($values);return $values; }
    private static function text(mixed $value,string $path,array &$issues): bool {
        if (!is_string($value)||trim($value)===''||strlen($value)>20000||!mb_check_encoding($value,'UTF-8')) { $issues[]='Missing or excessive text: '.$path;return false; }
        if (preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]|<\/?[a-z!][^>]*>/iu',$value)) { $issues[]='Plain text required: '.$path;return false; }
        return true;
    }
    private static function shape(mixed $expected,mixed $actual,string $path,array &$issues): void {
        if (is_string($expected)) {
            if (!self::text($actual,$path,$issues)) return;
            if (preg_match('/(?:^|\.)(?:id|appId|kind)$|\.appIds\.\d+$/',$path)&&$actual!==$expected) $issues[]='Stable identity changed: '.$path;
            if (self::placeholders($actual)!==self::placeholders($expected)) $issues[]='Placeholder mismatch: '.$path;
        } elseif (is_array($expected)) {
            $optional=$path==='content'?['tags']:(preg_match('/^content\.(?:categories|guides|workflows)\.\d+$/D',$path)?['slug']:[]);
            if (!is_array($actual)||array_keys($actual)!==array_keys($expected)) {
                if (!is_array($actual)||array_is_list($expected)||array_is_list($actual)||array_diff(array_keys($expected),array_keys($actual),$optional)||array_diff(array_keys($actual),array_keys($expected))) { $issues[]='Content structure mismatch: '.$path;return; }
            }
            foreach ($expected as $key=>$value) {if(!array_key_exists($key,$actual)&&in_array($key,$optional,true))continue;self::shape($value,$actual[$key]??null,$path.'.'.$key,$issues);}
        } elseif ($actual!==$expected) $issues[]='Stable content value changed: '.$path;
    }
    public static function preview(mixed $package): array {
        $issues=[];
        try { $bytes=strlen(self::json($package)); } catch (\Throwable) { return ['valid'=>false,'issues'=>['Invalid JSON package.']]; }
        if (!is_array($package)||array_is_list($package)||array_diff(array_keys($package),['schemaVersion','locale','ui','content','server'])||($package['schemaVersion']??null)!==1) return ['valid'=>false,'issues'=>['A schemaVersion 1 language package is required.']];
        $locale=$package['locale']??null;
        if (!is_string($locale)||!preg_match('/^[a-z]{2}(?:-[A-Z]{2})?$/D',$locale)) $issues[]='Use a language code such as de or pt-BR.';
        if (in_array($locale,['en','tr'],true)) $issues[]='Built-in English and Turkish packages cannot be overwritten.';
        if ($bytes>self::MAX_BYTES) $issues[]='A language package must be at most 1 MiB.';
        $ui=$package['ui']??null;
        if (!is_array($ui)||array_diff(array_keys($ui),['schemaVersion','locale','label','intlLocale','direction','messages'])||($ui['schemaVersion']??null)!==1||($ui['locale']??null)!==$locale) $issues[]='UI metadata must match the package locale and schema.';
        if(!is_array($ui))$ui=[];
        if (!is_string($ui['label']??null)||trim($ui['label'])===''||mb_strlen($ui['label'])>80) $issues[]='A language label of up to 80 characters is required.';
        else self::text($ui['label'],'ui.label',$issues);
        if (!in_array($ui['direction']??null,['ltr','rtl'],true)) $issues[]='Language direction must be ltr or rtl.';
        $intl=$ui['intlLocale']??'';
        if (!is_string($intl)||!preg_match('/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/D',$intl)||explode('-',$intl)[0]!==explode('-',is_string($locale)?$locale:'')[0]) $issues[]='intlLocale must be a matching language tag.';
        $baseline=self::builtin('en');$server=is_array($package['server']??null)?$package['server']:[];
        foreach (['ui.messages'=>[$baseline['ui']['messages'],$ui['messages']??null], 'server.messages'=>[$baseline['server']['messages'],$server['messages']??null]] as $path=>[$expected,$actual]) self::shape($expected,$actual,$path,$issues);
        self::shape($baseline['content'],$package['content']??null,'content',$issues);
        foreach(['categories','guides','workflows','tags'] as $group){$tokens=[];foreach($package['content'][$group]??[] as $entry){if(!is_array($entry)||!is_string($entry['id']??null))continue;$slug=$entry['slug']??$entry['id'];if(!is_string($slug)||strlen($slug)>100||!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$slug))$issues[]='Unsafe static slug: '.$group.'.'.$entry['id'];foreach(array_merge([$entry['id'],$slug],$group==='tags'?[$entry['label']??null]:[]) as $token){if(!is_string($token))continue;if(isset($tokens[$token])&&$tokens[$token]!==$entry['id'])$issues[]='Static slug collision: '.$group.'.'.$entry['id'];$tokens[$token]=$entry['id'];}}}
        $server=$package['server']??null;$routes=is_array($server)?($server['routes']??null):null;
        if (!is_array($server)||array_diff(array_keys($server),['messages','routes'])||!is_array($routes)||array_diff(array_keys($baseline['server']['routes']),array_keys($routes))||array_diff(array_keys($routes),array_keys($baseline['server']['routes']))) $issues[]='Complete server message and route keys are required.';
        else {
            $groups=[];$reference=$baseline['server']['routes'];
            foreach ($routes as $key=>$value) {
                if (!is_string($value)||strlen($value)>100||!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D',$value)||in_array($value,['api','assets','storage','resources','app','kurulum','yonetim','admin','install','media','en','tr'],true)||$value===$locale) { $issues[]='Unsafe or reserved route segment: '.$key;continue; }
                foreach ($groups[$value]??[] as $other) if ($reference[$other]!==$reference[$key]) $issues[]='Route collision: '.$other.' / '.$key;
                $groups[$value][]=$key;
            }
        }
        $issues=array_values(array_unique($issues));
        return ['valid'=>!$issues,'locale'=>$locale,'label'=>$ui['label']??'','issues'=>$issues,'checksum'=>hash('sha256',self::json($package)),'bytes'=>$bytes];
    }
    /** Corrupt/incomplete installed packages never become executable or public. */
    public static function runtimePackages(): array {
        clearstatcache(true,self::file());$stat=@stat(self::file());$stamp=self::file().':'.($stat?implode(':',[$stat['ino'],$stat['mtime'],$stat['ctime'],$stat['size']]):'missing');
        if(self::$runtimeCache!==null&&self::$runtimeStamp===$stamp)return self::$runtimeCache;
        self::$runtimeStamp=$stamp;
        try { $state=self::read(); } catch (\Throwable) { return self::$runtimeCache=[]; }
        $out=[];
        foreach ($state['packages'] as $locale=>$entry) {
            if (($entry['enabled']??false)!==true||!is_array($entry['package']??null)||($entry['package']['locale']??null)!==$locale) continue;
            try { $preview=self::preview($entry['package']);if ($preview['valid']&&hash_equals($preview['checksum'],(string)($entry['checksum']??''))) $out[]=$entry['package']; } catch (\Throwable) {}
        }
        return self::$runtimeCache=$out;
    }
    public static function runtimePackage(string $locale): ?array { foreach (self::runtimePackages() as $package) if ($package['locale']===$locale) return $package;return null; }
    /** Send only the active visitor language and public UI keys to the public bundle. */
    public static function publicPackages(string $locale): array {
        $package=self::runtimePackage($locale);
        if($package===null)return [];
        $keys=json_decode((string)file_get_contents(dirname(__DIR__).'/resources/ui-public-keys.json'),true,32,JSON_THROW_ON_ERROR);
        $package['ui']['messages']=array_intersect_key($package['ui']['messages'],array_fill_keys($keys,true));
        return [$package];
    }
    public static function managedLocales(): array { return array_keys(self::read()['packages']); }
    public function state(): array {
        $state=self::read();$packs=[];
        $manifest=json_decode((string)file_get_contents(dirname(__DIR__).'/resources/locale-manifest.json'),true,32,JSON_THROW_ON_ERROR);
        foreach ($manifest as $locale) $packs[]=['locale'=>$locale['code'],'label'=>$locale['label'],'builtin'=>true,'enabled'=>true,'issues'=>[]];
        foreach ($state['packages'] as $code=>$entry) {
            $preview=self::preview($entry['package']??null);
            if(isset($preview['checksum'])&&!hash_equals($preview['checksum'],(string)($entry['checksum']??'')))$preview['issues'][]='Stored package checksum mismatch.';
            $packs[]=['locale'=>$code,'label'=>$preview['label']??$code,'builtin'=>false,'enabled'=>($entry['enabled']??false)===true,'issues'=>$preview['issues'],'checksum'=>$entry['checksum']??''];
        }
        return ['revision'=>$state['revision'],'packs'=>$packs,'defaultSourceLocale'=>(new Translations($this->db,$this->repo))->settings()['sourceLocale']];
    }
    public function assertUnused(string $locale,array $settings): void {
        Validation::check(!in_array($locale,[$settings['defaultLocale'],$settings['sourceLocale']],true),'Change the default visitor/source language before disabling this package.');
        foreach ($this->repo->allRecords() as $record) Validation::check(Translations::sourceLocale($record)!==$locale,'This language is referenced by source content.');
        foreach (['translations','growth_documents'] as $table) {
            try { $query=$this->db->prepare('SELECT COUNT(*) FROM '.Database::table($table).' WHERE locale=?');$query->execute([$locale]);Validation::check((int)$query->fetchColumn()===0,'This language is referenced by translated or editorial content.'); }
            catch (\PDOException $error) { if (($error->errorInfo[1]??0)!==1146) throw $error; }
        }
    }
    public function handle(array $input): array {
        $action=$input['action']??'';
        Validation::check(in_array($action,['preview','import','activate','disable','export'],true)&&!array_diff(array_keys($input),['action','revision','package','locale']),'Invalid language package action.');
        if ($action==='preview') return $this->state()+['preview'=>self::preview($input['package']??null)];
        if ($action==='export') {
            $locale=$input['locale']??'';Validation::check(is_string($locale)&&preg_match('/^[a-z]{2}(?:-[A-Z]{2})?$/D',$locale),'Invalid language code.');
            $state=self::read();$package=$state['packages'][$locale]['package']??self::builtin($locale);
            return ['package'=>$package];
        }
        Validation::check(is_int($input['revision']??null),'A language package revision is required.');
        $lock=fopen(Config::storage().'/.language-packs.lock','c');if (!$lock||!flock($lock,LOCK_EX)) throw new ApiException('Language package lock unavailable.',503);@chmod(Config::storage().'/.language-packs.lock',0600);
        try {
            $before=self::read();if ($before['revision']!==$input['revision']) throw new ApiException('Language packages changed. Reload and review your edits.',409);
            $next=$before;$translations=new Translations($this->db,$this->repo);$settings=$translations->settings();
            if ($action==='import') {
                $preview=self::preview($input['package']??null);Validation::check($preview['valid'],implode(' ',$preview['issues']));$locale=$preview['locale'];
                Validation::check(!isset(Localization::builtinPacks()[$locale]),'A built-in language cannot be overwritten.');
                Validation::check(empty($next['packages'][$locale]['enabled']),'Disable the active package before replacing it.');
                Validation::check(isset($next['packages'][$locale])||count($next['packages'])<self::MAX_PACKS,'At most 20 community language packages may be installed.');
                $next['packages'][$locale]=['package'=>$input['package'],'checksum'=>$preview['checksum'],'enabled'=>false,'installedAt'=>Repository::now()];
            } else {
                $locale=$input['locale']??'';Validation::check(is_string($locale)&&isset($next['packages'][$locale]),'Choose an installed community language package.');
                if ($action==='activate') { $preview=self::preview($next['packages'][$locale]['package']);Validation::check($preview['valid'],implode(' ',$preview['issues']));Validation::check(hash_equals($preview['checksum'],$next['packages'][$locale]['checksum']),'Stored language checksum mismatch.'); }
                $next['packages'][$locale]['enabled']=$action==='activate';
                $found=false;foreach ($settings['locales'] as &$row) if ($row['code']===$locale) {$row['enabled']=$action==='activate';if($action==='activate')$row['label']=$next['packages'][$locale]['package']['ui']['label'];$found=true;}unset($row);
                if (!$found&&$action==='activate') $settings['locales'][]=['code'=>$locale,'label'=>$next['packages'][$locale]['package']['ui']['label'],'enabled'=>true];
            }
            $next['revision']++;
            try { $this->repo->transaction(function()use($action,$next,$settings,$translations,$locale) { if($action==='disable')$this->assertUnused($locale,$translations->settings());self::write($next);if ($action!=='import') $translations->saveSettings($settings);$this->repo->audit('language-package-'.$action,$locale,'revision='.$next['revision']); }); }
            catch (\Throwable $error) { self::write($before);throw $error; }
            return $this->state();
        } finally { flock($lock,LOCK_UN);fclose($lock); }
    }
}
