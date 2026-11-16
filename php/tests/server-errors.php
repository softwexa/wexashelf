<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\ServerErrors;
function expectError(string $actual, string $expected): void { if ($actual !== $expected) throw new RuntimeException('Error translation mismatch: '.json_encode([$actual,$expected])); }
unset($_SERVER['HTTP_ACCEPT_LANGUAGE']);
expectError(ServerErrors::message('Oturum gerekli.'), 'Authentication is required.');
$_SERVER['HTTP_ACCEPT_LANGUAGE']='tr-TR,tr;q=0.9,en;q=0.8';
expectError(ServerErrors::message('Authentication is required.'), 'Oturum gerekli.');
expectError(ServerErrors::message('Oturum gerekli.', 'de-DE'), 'Authentication is required.');
expectError(ServerErrors::message('Invalid credentials or verification code.', 'tr'), 'Geçersiz kimlik bilgileri veya doğrulama kodu.');
expectError(ServerErrors::message('Geçersiz JSON.', 'en'), 'Invalid JSON.');
expectError(ServerErrors::message('sections[0].heading: geçersiz düz metin.', 'en'), 'sections[0].heading: invalid plain text.');
expectError(ServerErrors::message('sourceId is required.', 'tr'), 'sourceId alanı gerekli.');
expectError(ServerErrors::message('Mağaza kimliği başka uygulamaya ait: ios.12345', 'en'), 'Store identity belongs to another app: ios.12345');
expectError(ServerErrors::message('Sağlayıcı isteği başarısız oldu (HTTP 429).', 'en'), 'The provider request failed (HTTP 429).');
expectError(ServerErrors::message('Source provider returned HTTP 503. No observation was applied.', 'tr'), 'Kaynak sağlayıcı HTTP 503 döndürdü. Hiçbir gözlem uygulanmadı.');
foreach (['User says: Oturum gerekli.', '<script>alert(1)</script>', 'Invalid credentials or verification code. extra', "sections[0].heading: geçersiz düz metin.\n", 'Unknown authored error', 'My title is required.'] as $raw) {
    expectError(ServerErrors::message($raw, 'en'), $raw);
    expectError(ServerErrors::message($raw, 'tr'), $raw);
}
foreach (['en','tr'] as $locale) {
    $catalog=json_decode(file_get_contents(__DIR__.'/../resources/error.'.$locale.'.json'),true,512,JSON_THROW_ON_ERROR);
    if(count($catalog)<500) throw new RuntimeException('Error catalog unexpectedly incomplete.');
    foreach($catalog as $raw=>$translated){
        if(!is_string($translated)||$translated==='') throw new RuntimeException('Empty error translation.');
        expectError(ServerErrors::message($raw,$locale),$translated);
    }
}
// Ensure literal exception/check messages remain deliberately covered as services evolve.
$known=array_merge(json_decode(file_get_contents(__DIR__.'/../resources/error.en.json'),true),json_decode(file_get_contents(__DIR__.'/../resources/error.tr.json'),true));
$missing=[];
foreach(glob(__DIR__.'/../app/*.php') as $file){
    $tokens=token_get_all(file_get_contents($file));
    for($i=0;$i<count($tokens);$i++){
        if(!is_array($tokens[$i])||!in_array(strtolower($tokens[$i][1]),['apiexception','check'],true))continue;
        $name=strtolower($tokens[$i][1]);$j=$i+1;
        while(isset($tokens[$j])&&is_array($tokens[$j])&&$tokens[$j][0]===T_WHITESPACE)$j++;
        if(($tokens[$j]??null)!=='(')continue;
        $args=[[]];$depth=0;
        for($j++;$j<count($tokens);$j++){
            $token=$tokens[$j];
            if(is_string($token)){
                if(in_array($token,['(','[','{']))$depth++;
                elseif(in_array($token,[')',']','}'])){if($depth===0&&$token===')')break;$depth--;}
                if($token===','&&$depth===0){$args[]=[];continue;}
            }
            if(is_array($token)&&in_array($token[0],[T_WHITESPACE,T_COMMENT,T_DOC_COMMENT]))continue;
            $args[count($args)-1][]=$token;
        }
        $arg=$args[$name==='apiexception'?0:1]??[];
        if(count($arg)!==1||!is_array($arg[0])||$arg[0][0]!==T_CONSTANT_ENCAPSED_STRING)continue;
        // Only decode PHP string literals, without evaluating repository code.
        $literal=$arg[0][1];$quote=$literal[0];$raw=substr($literal,1,-1);
        $raw=$quote==="'"?str_replace(["\\'","\\\\"],["'","\\"],$raw):stripcslashes($raw);
        if(!isset($known[$raw]))$missing[$raw]=basename($file);
    }
}
if($missing)throw new RuntimeException('Unmapped authored API errors: '.json_encode($missing,JSON_UNESCAPED_UNICODE));
echo "Server errors: complete literal inventory, EN/TR negotiation, safe templates and unknown-text preservation passed.\n";
