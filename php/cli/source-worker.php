<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/app/bootstrap.php';
use WexaShelf\{Config,Database,Repository,SourceWorker,WorkerHeartbeat};
$started=microtime(true);
try{$options=getopt('',['max-jobs:','max-seconds:']);$config=Config::load();if(!$config)throw new RuntimeException('Installed private configuration required.');$db=Database::connect($config);$result=(new SourceWorker($db,new Repository($db,$config)))->run((int)($options['max-jobs']??5),(int)($options['max-seconds']??50));WorkerHeartbeat::record('sources','completed',$result['processed'],$started);echo json_encode($result,JSON_THROW_ON_ERROR|JSON_UNESCAPED_SLASHES)."\n";}
catch(Throwable){WorkerHeartbeat::record('sources','failed',0,$started);fwrite(STDERR,"Source worker failed. Check private configuration and schema migrations. No candidate was automatically published.\n");exit(1);}
