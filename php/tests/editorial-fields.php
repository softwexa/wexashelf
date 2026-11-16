<?php
declare(strict_types=1);
require __DIR__.'/../app/bootstrap.php';
use WexaShelf\{Validation,ApiException};
$records=json_decode(file_get_contents(__DIR__.'/../resources/seed.json'),true)['records'];
$article=current(array_filter($records,fn($r)=>$r['kind']==='article'))['data'];
$article['seo']=['title'=>str_repeat('ğ',160),'description'=>str_repeat('ş',500),'noindex'=>true];
$article['cover']=['assetId'=>str_repeat('a',64),'alt'=>str_repeat('ğ',500),'caption'=>'Temsili görsel.','aiGenerated'=>true];
Validation::data('article',$article);
foreach(['title','description'] as $field){$bad=$article;$bad['seo'][$field].='x';try{Validation::data('article',$bad);throw new RuntimeException('Oversized Unicode field accepted');}catch(ApiException){}}
$bad=$article;$bad['cover']['assetId']='../private';try{Validation::data('article',$bad);throw new RuntimeException('Traversal accepted');}catch(ApiException){}
echo "Editorial fields: Unicode metadata/alt boundaries and media traversal rejection passed.\n";
