<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/app/bootstrap.php';
use WexaShelf\{Config,Database,AIWorker,WorkerHeartbeat};
$started=microtime(true);
try{$o=getopt('',['queue:','max-jobs:','max-seconds:','concurrency:']);if(($o['queue']??'')!=='ai')throw new RuntimeException('Usage: WEXA_STORAGE_PATH=/private/storage php worker.php --queue=ai [--max-jobs=5 --max-seconds=50 --concurrency=2]');$config=Config::load();if(!$config)throw new RuntimeException('Installed private configuration required.');$worker=new AIWorker(Database::connect($config),$config);$result=$worker->run((int)($o['max-jobs']??5),(int)($o['max-seconds']??50),(int)($o['concurrency']??2));WorkerHeartbeat::record('ai','completed',$result['processed'],$started);echo json_encode($result,JSON_THROW_ON_ERROR)."\n";}catch(Throwable){WorkerHeartbeat::record('ai','failed',0,$started);fwrite(STDERR,"AI worker failed. Inspect private host logs; unknown submissions must not be automatically resubmitted.\n");exit(1);}
