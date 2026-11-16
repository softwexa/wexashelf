<?php
declare(strict_types=1);
namespace WexaShelf;
/** Safe literal shortcodes; unknown or malformed content remains escaped text. */
final class ArticleContent {
 public static function parse(string $text):array {
  preg_match_all('/\[(app|image) id="([a-z0-9-]+)"\]/',$text,$matches,PREG_SET_ORDER|PREG_OFFSET_CAPTURE);$tokens=[];$offset=0;
  foreach($matches as$m){$type=$m[1][0];$id=$m[2][0];if(!preg_match($type==='app'?'/^[a-z0-9][a-z0-9-]{0,79}$/D':'/^[a-f0-9]{64}$/D',$id))continue;
   if($m[0][1]>$offset)$tokens[]=['type'=>'text','text'=>substr($text,$offset,$m[0][1]-$offset)];$tokens[]=['type'=>$type,'id'=>$id];$offset=$m[0][1]+strlen($m[0][0]);
  }if($offset<strlen($text))$tokens[]=['type'=>'text','text'=>substr($text,$offset)];return$tokens;
 }
 public static function references(string $text):array{return array_values(array_filter(self::parse($text),fn($t)=>$t['type']!=='text'));}
 public static function appIds(array $article):array{$ids=$article['appIds']??[];foreach($article['sections']??[]as$s)foreach($s['paragraphs']??[]as$p)if(is_string($p))foreach(self::references($p)as$t)if($t['type']==='app')$ids[]=$t['id'];return array_values(array_unique($ids));}
 public static function imageIds(array $article):array{$ids=[];foreach($article['sections']??[]as$s)foreach($s['paragraphs']??[]as$p)if(is_string($p))foreach(self::references($p)as$t)if($t['type']==='image')$ids[]=$t['id'];return array_values(array_unique($ids));}
 public static function renderParagraph(string $text,array $article,array $catalog,array $config,array $paths,string $locale):void {
  $e=fn($value)=>htmlspecialchars((string)$value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');$apps=array_column($catalog['apps']??[],null,'id');$images=array_column($article['images']??[],null,'assetId');
  $content=Localization::content($locale);$iconMap=json_decode((string)file_get_contents(__DIR__.'/../resources/icon-assets.json'),true)??[];
  foreach(self::parse($text)as$token){
   if($token['type']==='text'){if(trim($token['text'])!=='')echo '<p>'.$e($token['text']).'</p>';continue;}
   if($token['type']==='app'){$app=$apps[$token['id']]??null;$path=$paths['/uygulama/'.$token['id']]??null;if(!$app||!$path){echo'<p class="article-embed-unavailable">'.$e(Localization::t($locale,'articleAppUnavailable')).'</p>';continue;}
    $icon=$app['icon']??'';$icon=$iconMap[$icon]??$icon;$url=Config::url($config,$path);
    echo'<aside class="article-app-embed" data-article-app="'.$e($app['id']).'"><img src="'.$e(str_starts_with($icon,'/')?Config::url($config,$icon):$icon).'" alt="" width="64" height="64" loading="lazy"><div><h3><a href="'.$e($url).'">'.$e($app['name']).'</a></h3><p>'.$e($app['tagline']).'</p><p>'.$e(implode(' · ',array_map(fn($p)=>$content['platformLabels'][$p]??$p,$app['platforms']))).'</p><a href="'.$e($url).'">'.$e(Localization::t($locale,'articleViewApp')).'</a></div></aside>';continue;
   }
   $image=$images[$token['id']]??null;if(!$image){echo'<p class="article-embed-unavailable">'.$e(Localization::t($locale,'articleImageUnavailable')).'</p>';continue;}
   $url=Config::url($config,'media/'.$image['assetId'].'.'.$image['format']);echo'<figure class="article-inline-image"><img src="'.$e($url).'" alt="'.$e($image['alt']).'" width="'.(int)$image['width'].'" height="'.(int)$image['height'].'" loading="lazy" decoding="async">';if($image['caption']!==''||$image['aiGenerated'])echo'<figcaption>'.$e($image['caption']).($image['aiGenerated']?' '.$e(Localization::t($locale,'aiIllustration')):'').'</figcaption>';echo'</figure>';
  }
 }
}
