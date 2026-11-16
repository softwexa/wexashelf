<?php
declare(strict_types=1);
namespace WexaShelf;
/** Diagnostic only. Failure to record must never retry provider work or change worker exit status. */
final class WorkerHeartbeat {
 public static function record(string $queue,string $status,int $processed,float $started):bool {
  if(!in_array($queue,['ai','sources'],true)||!in_array($status,['completed','failed'],true))return false;
  $dir=Config::storage().'/worker-runs';$tmp=false;
  try{if(is_link($dir))return false;if(!is_dir($dir)&&!@mkdir($dir,0700,true))return false;@chmod($dir,0700);$tmp=@tempnam($dir,'.run-');if($tmp===false||!@chmod($tmp,0600))return false;$value=['startedAt'=>gmdate('c',(int)$started),'finishedAt'=>gmdate('c'),'status'=>$status,'processed'=>max(0,min(20,$processed)),'durationSeconds'=>max(0,min(86400,(int)ceil(microtime(true)-$started)))];if(@file_put_contents($tmp,json_encode($value,JSON_THROW_ON_ERROR),LOCK_EX)===false)return false;if(!@rename($tmp,$dir.'/'.$queue.'.json'))return false;$tmp=false;return true;}catch(\Throwable){return false;}finally{if($tmp!==false&&is_file($tmp))@unlink($tmp);}
 }
 public static function read(string $queue):?array {
  if(!in_array($queue,['ai','sources'],true))return null;$path=Config::storage().'/worker-runs/'.$queue.'.json';if(is_link(dirname($path))||is_link($path)||!is_file($path)||filesize($path)>2048)return null;
  try{$v=json_decode((string)file_get_contents($path),true,8,JSON_THROW_ON_ERROR);foreach(['startedAt','finishedAt']as$key)if(!is_string($v[$key]??null)||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/D',$v[$key]))return null;if(!in_array($v['status']??null,['completed','failed'],true)||!is_int($v['processed']??null)||$v['processed']<0||$v['processed']>20||!is_int($v['durationSeconds']??null)||$v['durationSeconds']<0||$v['durationSeconds']>86400)return null;return array_intersect_key($v,array_flip(['startedAt','finishedAt','status','processed','durationSeconds']));}catch(\Throwable){return null;}
 }
}
