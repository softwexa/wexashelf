<?php
declare(strict_types=1);
namespace WexaShelf;

/** Bounded presentation parity for the semantic PHP fallback and React theme root. */
final class ThemeView
{
    /** Preload the actual above-the-fold night heading/body faces before stylesheet discovery. */
    public static function headingFontPreload(array $catalog,array $config):string {
        $theme=$catalog['siteSettings']['theme']??[];
        if(($theme['template']??'night')!=='night'||($theme['presentation']['font']??'sans')!=='sans')return '';
        $file=dirname(__DIR__).'/resources/font-assets.json';if(!is_file($file))return '';
        $assets=json_decode(file_get_contents($file),true);$html='';
        foreach([400,600]as$weight){$path=$assets['latin-'.$weight]??'';
            if(!is_string($path)||!preg_match('~^/assets/fonts/ibm-plex-sans-latin-'.$weight.'-normal-[a-zA-Z0-9]+\.woff2$~D',$path))continue;
            $html.='<link rel="preload" as="font" type="font/woff2" crossorigin href="'.htmlspecialchars(Config::url($config,$path),ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'">';
        }return $html;
    }

    public static function attributes(array $catalog, string $page='home'): string
    {
        $seed=json_decode(file_get_contents(dirname(__DIR__).'/resources/seed.json'),true,512,JSON_THROW_ON_ERROR);
        $theme=$catalog['siteSettings']['theme']??$seed['siteSettings']['theme'];
        try { $theme=Validation::siteSettings(['theme'=>$theme,'enabledPlugins'=>[],'revision'=>0])['theme']; }
        catch(ApiException) { $theme=$seed['siteSettings']['theme']; }
        $p=array_replace(['font'=>'sans','width'=>'wide','radius'=>'soft','hero'=>'standard','cardStyle'=>'outline'],(array)($theme['presentation']??[]));
        $vars=[];
        foreach(['background'=>'background','surface'=>'surface','surfaceRaised'=>'surface-raised','foreground'=>'foreground','muted'=>'muted','accent'=>'accent','accentContrast'=>'accent-contrast','border'=>'border']as$key=>$name)$vars['--'.$name]=$theme['tokens'][$key];
        $vars['--theme-content-width']=['standard'=>'1120px','wide'=>'1440px','full'=>'none'][$p['width']];
        $vars['--theme-radius']=['square'=>'2px','soft'=>'12px','round'=>'24px'][$p['radius']];
        $vars['--theme-hero-space']=['compact'=>'24px','standard'=>'44px','spacious'=>'72px'][$p['hero']];
        $vars['--theme-heading-font']=['sans'=>'var(--font-plex, "IBM Plex Sans"), sans-serif','serif'=>'Georgia, "Times New Roman", serif','mono'=>'"Courier New", monospace','display'=>'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif'][$p['font']];
        $vars['--theme-card-shadow']=['flat'=>'none','outline'=>'none','elevated'=>'0 8px 30px #00000012'][$p['cardStyle']];
        $style=implode(';',array_map(static fn($key,$value)=>$key.':'.$value,array_keys($vars),array_values($vars)));
        $attrs=['class'=>'app-shell catalog-experience layout-'.$theme['layout'].' density-'.$theme['density'],'data-theme'=>$theme['id'],'data-template'=>$theme['template']??'night','data-page'=>$page,'data-font'=>$p['font'],'data-width'=>$p['width'],'data-radius'=>$p['radius'],'data-hero'=>$p['hero'],'data-card-style'=>$p['cardStyle'],'style'=>$style];
        return implode(' ',array_map(static fn($key,$value)=>$key.'="'.htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8').'"',array_keys($attrs),array_values($attrs)));
    }
}
