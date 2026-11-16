<?php
declare(strict_types=1);
require dirname(__DIR__,2).'/php/app/bootstrap.php';
use WexaShelf\Extensions;
$bundled=Extensions::bundled();if(count($bundled)!==3)throw new RuntimeException('Expected three bundled functional packages.');
foreach($bundled as $row){$path=__DIR__.'/'.$row['manifest']['id'].'.json';$manifest=json_decode((string)file_get_contents($path),true,32,JSON_THROW_ON_ERROR);if(Extensions::validatePackage($manifest)!==$row['manifest']||Extensions::checksum($manifest)!==$row['checksum'])throw new RuntimeException('Portable and bundled packages differ: '.$path);if(!isset($manifest['blocks'][0]['locales']['en'],$manifest['blocks'][0]['locales']['tr']))throw new RuntimeException('English and Turkish copy required.');}
echo "PASS: three portable functional modules match the validated bundled catalogue, with EN/TR copy. No database or installation writes.\n";
