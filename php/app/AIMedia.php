<?php
declare(strict_types=1);
namespace WexaShelf;
final class AIMedia {
 public static function store(string $base64,string $alt='',string $caption=''):array {
  Validation::check(strlen($base64)<=16777216,'Görsel çok büyük.');$bytes=base64_decode($base64,true);Validation::check($bytes!==false&&strlen($bytes)<=12582912&&str_starts_with($bytes,"\x89PNG\r\n\x1a\n"),'Yalnız PNG görseller kabul edilir.');$size=@getimagesizefromstring($bytes);Validation::check($size&&$size[2]===IMAGETYPE_PNG&&$size[0]>0&&$size[1]>0&&$size[0]<=4096&&$size[1]<=4096,'Geçersiz görsel boyutu.');$id=hash('sha256',$bytes);$dir=Config::storage().'/media';if(!is_dir($dir))mkdir($dir,0700,true);$tmp=tempnam($dir,'.image-');try{chmod($tmp,0600);if(file_put_contents($tmp,$bytes)!==strlen($bytes)||!rename($tmp,$dir.'/'.$id.'.png'))throw new ApiException('Görsel saklanamadı.',500);}finally{if(is_file($tmp))unlink($tmp);}return ['assetId'=>$id,'alt'=>mb_substr(strip_tags($alt),0,300),'caption'=>mb_substr(strip_tags($caption),0,500),'aiGenerated'=>true];
 }
 public static function read(string $id):string {Validation::check((bool)preg_match('/^[a-f0-9]{64}$/D',$id),'Geçersiz görsel kimliği.');$path=Config::storage().'/media/'.$id.'.png';if(!is_file($path))throw new ApiException('Görsel bulunamadı.',404);return (string)file_get_contents($path);}
}
