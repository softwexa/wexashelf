<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Validation,ApiException};
foreach(['editorial-desk'=>'magazine','compact-directory'=>'directory'] as $id=>$template){
    $theme=json_decode(file_get_contents(__DIR__.'/../../examples/themes/'.$id.'.json'),true,512,JSON_THROW_ON_ERROR);
    $settings=['theme'=>$theme,'enabledPlugins'=>[],'revision'=>0];
    if(Validation::siteSettings($settings)!==$settings||$theme['template']!==$template)throw new RuntimeException('Portable theme changed during PHP validation.');
    $bad=$settings;$bad['theme']['template']='untrusted-template';
    try{Validation::siteSettings($bad);throw new RuntimeException('Unknown template accepted');}catch(ApiException){}
    $reordered=$settings;$reordered['theme']['sections']=array_reverse($theme['sections']);
    if(Validation::siteSettings($reordered)!==$reordered)throw new RuntimeException('Section order lost.');
}
$base=json_decode(file_get_contents(__DIR__.'/../../examples/themes/editorial-desk.json'),true,512,JSON_THROW_ON_ERROR);
$templates=['night','atlas','workflow','catalog','magazine','directory','porcelain','ember','fieldnotes','signal','lilac','tide','copper','prism','index','velvet'];
foreach($templates as$template){
    $settings=['theme'=>array_replace($base,['template'=>$template]),'enabledPlugins'=>[],'revision'=>0];
    if(Validation::siteSettings($settings)!==$settings)throw new RuntimeException('Template not preserved: '.$template);
    $settings['theme']['presentation']=['font'=>'serif','width'=>'standard','radius'=>'square','hero'=>'compact','cardStyle'=>'flat'];
    if(Validation::siteSettings($settings)!==$settings)throw new RuntimeException('Presentation not preserved: '.$template);
    $settings['theme']['presentation']=['width'=>'full'];
    if(Validation::siteSettings($settings)!==$settings)throw new RuntimeException('Partial presentation must remain partial.');
    $settings['theme']['presentation']=[];
    if(!str_contains(json_encode(Validation::siteSettings($settings),JSON_THROW_ON_ERROR),'"presentation":{}'))throw new RuntimeException('Empty presentation must serialize as an object.');
}
foreach([['font'=>'remote-font'],['width'=>999],['radius'=>'custom'],['hero'=>'hidden'],['cardStyle'=>'script'],['css'=>'color:red'],false,'sans',null]as$bad){
    $settings=['theme'=>array_replace($base,['presentation'=>$bad]),'enabledPlugins'=>[],'revision'=>0];
    try{Validation::siteSettings($settings);throw new RuntimeException('Unknown or invalid presentation accepted');}catch(ApiException){}
}
echo "Themes: 16 templates, complete/partial/empty presentation, legacy manifest parity, section order and invalid values passed.\n";
