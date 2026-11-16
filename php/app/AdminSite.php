<?php
declare(strict_types=1);
namespace WexaShelf;

/** Independent administrative document: no public catalog or discovery shell. */
final class AdminSite
{
    public static function render(array $config): void
    {
        header('Content-Type: text/html; charset=utf-8');
        header('X-Robots-Tag: noindex, nofollow, noarchive');
        header('Cache-Control: private, no-store, max-age=0');
        header('Pragma: no-cache');
        $base=Config::basePath($config);
        $escape=static fn(string $value): string => htmlspecialchars($value,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
        $payload=[
            'basePath'=>$base,'admin'=>true,'locale'=>'en',
            'runtimeLocalePacks'=>LanguagePacks::runtimePackages(),
            'localizedPaths'=>[],
        ];
        echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Administration | WexaShelf</title><meta name="robots" content="noindex, nofollow, noarchive"><link rel="icon" type="image/svg+xml" href="'.$escape($base.'/assets/favicon.svg').'"><link rel="stylesheet" href="'.$escape($base.'/assets/admin.css').'"></head><body class="admin-document"><div id="wexa-root"><div class="admin-root"><header class="admin-topbar"><a class="admin-brand" href="'.$escape($base.'/admin').'">WexaShelf <small>Administration</small></a><a href="'.$escape($base.'/').'">Open site</a></header><main class="admin-main"><section class="admin-login"><h1>Administration</h1><p role="status">Checking your session…</p><noscript><p>JavaScript is required to sign in and manage content. Public browsing remains available through the Open site link.</p></noscript></section></main></div></div><script id="wexa-bootstrap" type="application/json">'.json_encode($payload,JSON_THROW_ON_ERROR|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES).'</script><script defer src="'.$escape($base.'/assets/admin.js').'"></script></body></html>';
    }
}
