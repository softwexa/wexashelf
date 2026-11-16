<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require dirname(__DIR__).'/app/bootstrap.php';
use WexaShelf\{Config,Database,Repository,CatalogQuery};
try{if(!in_array('--rebuild',$argv,true))throw new RuntimeException('Usage: WEXA_STORAGE_PATH=/private/storage php catalog-index.php --rebuild');$config=Config::load();if(!$config)throw new RuntimeException('Installed configuration required.');$db=Database::connect($config);Database::migrate($db);$count=(new CatalogQuery($db,new Repository($db,$config)))->rebuild();echo json_encode(['indexedRecords'=>$count],JSON_THROW_ON_ERROR)."\n";}catch(Throwable$e){fwrite(STDERR,"Catalog indexing failed. Check private host logs and database configuration.\n");exit(1);}
