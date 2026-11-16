<?php
declare(strict_types=1);
namespace WexaShelf;
final class SEOSettings {
    public function __construct(private Repository $repo, private array $config) {}
    public static function defaults(array $config=[]):array {
        return ['siteName'=>'WexaShelf','titleSuffix'=>'WexaShelf','homeTitle'=>'Kendine uygun olanı keşfet','homeDescription'=>'Android, iOS ve Windows uygulamalarını kaynaklarıyla keşfet, karşılaştır ve ihtiyacına uygun araçları seç.','indexingEnabled'=>($config['site']['indexing']??false)===true,'googleVerification'=>'','bingVerification'=>'','revision'=>0];
    }
    public static function validate(mixed $input):array {
        Validation::check(is_array($input)&&!array_diff(array_keys($input),array_merge(array_keys(self::defaults()),['branding'])), 'Geçersiz SEO ayarları.');
        foreach(['siteName'=>80,'titleSuffix'=>80,'homeTitle'=>120,'homeDescription'=>300] as $key=>$max) {
            $value=$input[$key]??null;
            Validation::check(is_string($value)&&preg_match('//u',$value)&&preg_match_all('/./us',$value)<=$max&&!preg_match('/[<>\x00-\x1f\x7f]/u',$value), "$key: geçersiz düz metin.");
            $input[$key]=trim($value);
        }
        Validation::check($input['siteName']!==''&&$input['homeTitle']!==''&&$input['homeDescription']!=='','Site adı, ana sayfa başlığı ve açıklaması gerekli.');
        foreach(['googleVerification','bingVerification'] as $key) Validation::check(is_string($input[$key]??null)&&preg_match('/^[A-Za-z0-9_-]{0,120}$/D',$input[$key]),'Doğrulama alanına yalnız token girin; HTML etiketi kullanmayın.');
        Validation::check(is_bool($input['indexingEnabled']??null)&&is_int($input['revision']??null)&&$input['revision']>=0&&$input['revision']<2147483646,'Geçersiz indeksleme seçimi veya revizyon.');
        if (array_key_exists('branding', $input)) $input['branding'] = Branding::validate($input['branding']);
        return $input;
    }
    public function get():array {
        $stored=$this->repo->setting('seo-settings');
        if($stored===null)return self::defaults($this->config);
        try{return self::validate($stored);}catch(\Throwable){$safe=self::defaults();$safe['indexingEnabled']=false;return $safe;}
    }
    public function save(mixed $input):array {
        $settings=self::validate($input);
        return $this->repo->transaction(function()use($settings){
            if($settings['revision']!==$this->get()['revision'])throw new ApiException('SEO ayarları değişti. Güncel sürümü yükleyin.',409);
            $previous=$this->get();
            if(!array_key_exists('branding',$settings)&&array_key_exists('branding',$previous))$settings['branding']=$previous['branding'];
            if(isset($settings['branding']))Branding::assertAvailable($settings['branding']);
            $settings['revision']++;$this->repo->setSetting('seo-settings',$settings);$this->repo->audit('seo-settings','site','revision='.$settings['revision'].'; indexing='.($settings['indexingEnabled']?'on':'off'));return $settings;
        });
    }
    public static function publicHttps(string $url):bool {
        $u=parse_url($url);if(!$u||($u['scheme']??'')!=='https'||empty($u['host'])||isset($u['user'])||isset($u['pass'])||isset($u['query'])||isset($u['fragment']))return false;
        $host=strtolower(rtrim($u['host'],'.'));
        if(filter_var(trim($host,'[]'),FILTER_VALIDATE_IP))return false;
        if(!str_contains($host,'.')||preg_match('/(?:^|\.)(localhost|local|test|invalid|example|internal|lan|home)$/D',$host))return false;
        return filter_var($host,FILTER_VALIDATE_DOMAIN,FILTER_FLAG_HOSTNAME)!==false;
    }
    public static function checks(array $records):array {
        $titles=[];$descriptions=[];$apps=[];
        foreach($records as $r){$d=$r['data'];$title=trim($d['seo']['title']??'')?:trim($d['title']??$d['name']??'');$description=trim($d['seo']['description']??'')?:trim($d['summary']??$d['description']??'');if($title!=='')$titles[strtolower($title)]=($titles[strtolower($title)]??0)+1;if($description!=='')$descriptions[strtolower($description)]=($descriptions[strtolower($description)]??0)+1;if($r['kind']==='app')$apps[$r['id']]=true;}
        $checks=[];
        foreach($records as $r){$d=$r['data'];$issues=[];$add=static function($code,$label,$level='warning')use(&$issues){$issues[]=compact('code','label','level');};$title=trim($d['seo']['title']??'')?:trim($d['title']??$d['name']??'');$description=trim($d['seo']['description']??'')?:trim($d['summary']??$d['description']??'');
            if($title==='')$add('missing-title','Başlık eksik.','error');elseif(($titles[strtolower($title)]??0)>1)$add('duplicate-title','Başka kayıtta aynı başlık var.');
            if($description==='')$add('missing-description','Açıklama eksik.','error');elseif(($descriptions[strtolower($description)]??0)>1)$add('duplicate-description','Başka kayıtta aynı açıklama var.');
            $titleLength=preg_match_all('/./us',$title);$descriptionLength=preg_match_all('/./us',$description);
            if($titleLength>70)$add('title-length','Başlık 70 karakterden uzun; arama görünümünü gözden geçirin.','info');
            if($descriptionLength>180)$add('description-length','Açıklama 180 karakterden uzun; arama görünümünü gözden geçirin.','info');
            if($r['kind']==='article'){$text='';$empty=empty($d['sections']);foreach($d['sections']??[] as $section){$body=trim(implode(' ',$section['paragraphs']??[]));$empty=$empty||$body==='';$text.=' '.$body;}if($empty)$add('empty-sections','Boş yazı bölümü var.','error');if(preg_match_all('/\S+/u',trim($text))<100)$add('thin-article','Yazı 100 kelimeden kısa; ihtiyacı karşılayıp karşılamadığını editör incelemeli.');if(empty($d['sources']))$add('missing-sources','Yazı kaynakları eksik.','error');foreach($d['appIds']??[] as $id)if(!isset($apps[$id]))$add('orphan-app','Bağlı uygulama bulunamadı: '.$id,'error');}
            if($r['kind']==='app'&&empty($d['sourceUrl']))$add('missing-sources','Uygulama kaynak adresi eksik.','error');
            if(empty($r['seoApproved']))$add('unreviewed-seo','SEO editör onayı bekliyor.');
            if(!empty($d['seo']['noindex']))$add('noindex','Bu kayıt indeksleme dışında tutuluyor.','info');
            $checks[]=['kind'=>$r['kind'],'id'=>$r['id'],'name'=>$d['name']??$d['title']??$r['id'],'status'=>$r['status'],'issues'=>$issues];
        }return $checks;
    }
    public function state():array {
        $settings=$this->get();$url=(string)($this->config['site']['url']??'');$publicHttps=self::publicHttps($url);$effective=$settings['indexingEnabled']&&$publicHttps;$config=$this->config;$config['seo']=$settings;
        $count=0;if($effective&&class_exists(PublicSite::class))$count=substr_count(PublicSite::sitemap($this->repo->getPublicSnapshot(),$config),'<url>');
        return ['settings'=>$settings,'environment'=>['url'=>$url,'publicHttps'=>$publicHttps,'indexingEffective'=>$effective],'checks'=>self::checks($this->repo->getAdminSnapshot()['records']),'sitemapCount'=>$count];
    }
}
