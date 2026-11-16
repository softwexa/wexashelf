<?php
declare(strict_types=1);
namespace WexaShelf;
/** Opaque local bytes: no remote fetch, metadata stripping or GD dependency. */
final class ContentMedia {
 public const MAX_BYTES=2097152;
 /** Validate raster bytes without making them part of catalog media. */
 public static function inspectUpload(array $input):array {
  Validation::check(!array_diff(array_keys($input),['base64','alt','caption'])&&is_string($input['base64']??null)&&strlen($input['base64'])<=2796204,'Image upload must be at most 2 MiB.');
  $bytes=base64_decode($input['base64'],true);Validation::check($bytes!==false&&strlen($bytes)>0&&strlen($bytes)<=self::MAX_BYTES,'Image upload must be at most 2 MiB.');
  $size=@getimagesizefromstring($bytes);$format=match($size[2]??0){IMAGETYPE_PNG=>'png',IMAGETYPE_JPEG=>'jpg',IMAGETYPE_WEBP=>'webp',default=>''};
  $magic=match($format){'png'=>str_starts_with($bytes,"\x89PNG\r\n\x1a\n")&&str_ends_with($bytes,"\x00\x00\x00\x00IEND\xaeB`\x82"),'jpg'=>str_starts_with($bytes,"\xff\xd8\xff")&&str_ends_with($bytes,"\xff\xd9"),'webp'=>strlen($bytes)>=12&&substr($bytes,0,4)==='RIFF'&&substr($bytes,8,4)==='WEBP'&&unpack('V',substr($bytes,4,4))[1]+8===strlen($bytes),default=>false};
  Validation::check($magic,'Upload a valid PNG, JPEG or WebP image.');
  $image=['assetId'=>hash('sha256',$bytes),'format'=>$format,'width'=>$size[0],'height'=>$size[1],'alt'=>$input['alt']??'','caption'=>$input['caption']??'','aiGenerated'=>false];Validation::articleImages([$image]);
  return ['image'=>$image,'bytes'=>$bytes];
 }
 public static function upload(array $input):array {
  ['image'=>$image,'bytes'=>$bytes]=self::inspectUpload($input);$format=$image['format'];
  $dir=Config::storage().'/media';Validation::check(!is_link($dir),'Private media storage is unavailable.');if(!is_dir($dir)&&!@mkdir($dir,0700,true))throw new ApiException('Private media storage is unavailable.',503);@chmod($dir,0700);$path=$dir.'/'.$image['assetId'].'.'.$format;Validation::check(!is_link($path),'Private media storage is unavailable.');$tmp=@tempnam($dir,'.content-');if($tmp===false)throw new ApiException('Image could not be saved.',503);
  try{if(!chmod($tmp,0600)||file_put_contents($tmp,$bytes,LOCK_EX)!==strlen($bytes)||!rename($tmp,$path))throw new ApiException('Image could not be saved.',503);}finally{if(is_file($tmp))@unlink($tmp);}return $image;
 }
 public static function read(string $id,string $format):string {
  Validation::check((bool)preg_match('/^[a-f0-9]{64}$/D',$id)&&in_array($format,['png','jpg','webp'],true),'Invalid image identity.');$dir=Config::storage().'/media';$path=$dir.'/'.$id.'.'.$format;if(is_link($dir)||is_link($path)||!is_file($path)||filesize($path)>($format==='png'?12582912:self::MAX_BYTES))throw new ApiException('Image was not found.',404);$bytes=file_get_contents($path);if($bytes===false||!hash_equals($id,hash('sha256',$bytes)))throw new ApiException('Image was not found.',404);return $bytes;
 }
}
