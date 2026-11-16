<?php
// Development router only. Apache uses .htaccess in the installable ZIP.
$base=rtrim(getenv('WEXA_BASE_PATH') ?: '', '/');
$url=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH) ?: '/';
$relative=($base!=='' && str_starts_with($url,$base.'/')) ? substr($url,strlen($base)) : $url;
$decoded=rawurldecode($relative); $file=realpath(__DIR__.$decoded);
if ($file && str_starts_with($file,__DIR__.DIRECTORY_SEPARATOR) && is_file($file) && preg_match('~^/(?:assets|icons|images|themes)/~',$decoded) && !preg_match('~(?:^|/)\.|\.php$~i',$decoded)) {
    $types=['css'=>'text/css','js'=>'text/javascript','svg'=>'image/svg+xml','png'=>'image/png','jpg'=>'image/jpeg','webp'=>'image/webp','woff2'=>'font/woff2','woff'=>'font/woff','json'=>'application/json'];
    $ext=strtolower(pathinfo($file,PATHINFO_EXTENSION)); header('Content-Type: '.($types[$ext]??'application/octet-stream')); header('X-Content-Type-Options: nosniff'); readfile($file); return true;
}
$_SERVER['SCRIPT_NAME']=$base.'/index.php'; require __DIR__.'/index.php';
