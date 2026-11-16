<?php
declare(strict_types=1);
namespace WexaShelf;

final class AppScreenshots {
    public static function render(array $app,array $config,string $locale):void {
        $images=$app['screenshots']??[];if(!$images)return;
        $e=static fn(string $value):string=>htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
        echo '<section class="app-screenshots"><h2>'.$e(Localization::t($locale,'appScreenshots')).'</h2>';
        foreach(array_slice($images,0,5)as$image){
            $url=Config::url($config,'media/'.$image['assetId'].'.'.$image['format']);
            echo '<figure><a href="'.$e($url).'" target="_blank" rel="noopener noreferrer"><img src="'.$e($url).'" alt="'.$e($image['alt']).'" width="'.(int)$image['width'].'" height="'.(int)$image['height'].'" loading="lazy" decoding="async"></a>';
            if($image['caption']!=='')echo '<figcaption>'.$e($image['caption']).'</figcaption>';
            echo '</figure>';
        }
        echo '</section>';
    }
}
