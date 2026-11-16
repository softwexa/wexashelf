<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
final class Database {
 public static function table(string $name): string { if (!preg_match('/^[a-z_]+$/D',$name)) throw new \InvalidArgumentException('Invalid table'); return 'ws_'.$name; }
 public static function connect(array $config): PDO { $c=$config['database']; return new PDO('mysql:host='.$c['host'].';port='.($c['port']??3306).';dbname='.$c['name'].';charset=utf8mb4',$c['user'],$c['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]); }
 public static function migrate(PDO $db): void {
 $tables=['records'=>'kind VARCHAR(20) NOT NULL,id VARCHAR(160) NOT NULL,payload LONGTEXT NOT NULL,PRIMARY KEY(kind,id)','revisions'=>'kind VARCHAR(20) NOT NULL,id VARCHAR(160) NOT NULL,revision INT NOT NULL,payload LONGTEXT NOT NULL,PRIMARY KEY(kind,id,revision)','settings'=>'setting_key VARCHAR(120) PRIMARY KEY,value LONGTEXT NOT NULL','feedback'=>'id BIGINT AUTO_INCREMENT PRIMARY KEY,appId VARCHAR(160),field VARCHAR(80),message TEXT,status VARCHAR(20),createdAt VARCHAR(40)','audit'=>'id BIGINT AUTO_INCREMENT PRIMARY KEY,action VARCHAR(80),subject VARCHAR(255),detail LONGTEXT,createdAt VARCHAR(40)','sessions'=>'token CHAR(64) PRIMARY KEY,expires BIGINT NOT NULL','limits'=>'limit_key VARCHAR(120) PRIMARY KEY,count INT NOT NULL,expires BIGINT NOT NULL','source_refresh'=>'sequence BIGINT AUTO_INCREMENT PRIMARY KEY,id VARCHAR(36) NOT NULL UNIQUE,payload LONGTEXT NOT NULL'];
 foreach($tables as $name=>$ddl) $db->exec('CREATE TABLE IF NOT EXISTS '.self::table($name).' ('.$ddl.') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin');
 CatalogQuery::migrate($db);
 SourceWorker::migrate($db);
 Translations::migrate($db);
 Growth::migrate($db);
 Performance::migrate($db);
 }
}
