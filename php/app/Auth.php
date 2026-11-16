<?php
declare(strict_types=1);
namespace WexaShelf;
use PDO;
final class Auth {
    public function __construct(private PDO $db, private Repository $repo, private array $config) {}
    public static function configurePassword(Repository $repo, string $password): void {
        if (strlen($password)<12 || strlen($password)>256) throw new ApiException('Parola 12–256 karakter olmalı.');
        if ($repo->setting('password')) throw new ApiException('Yönetici zaten yapılandırılmış.');
        $repo->setSetting('password', password_hash(hash('sha256', $password), PASSWORD_DEFAULT));
    }
    public function configured(): bool { return (bool)$this->repo->setting('password'); }
    public static function sessionId():string{$token=$_COOKIE['catalog_admin']??'';return is_string($token)&&preg_match('/^[a-f0-9]{64}$/D',$token)?hash('sha256',$token):'';}
    public function principal(): ?array {
        $token=$_COOKIE['catalog_admin']??'';
        if(!is_string($token)||!preg_match('/^[a-f0-9]{64}$/D',$token))return null;
        $hash=hash('sha256',$token);$q=$this->db->prepare('SELECT expires FROM '.Database::table('sessions').' WHERE token=?');$q->execute([$hash]);if((int)$q->fetchColumn()<=self::now())return null;
        $principal=$this->repo->setting('session-principal:'.$hash,['id'=>'owner','role'=>'owner']);if($principal['id']==='owner'){if(($principal['securityRevision']??0)!==(new AccountSecurity($this->db,$this->repo,$this->config))->raw()['securityRevision'])return null;return ['id'=>'owner','name'=>'Owner','role'=>'owner'];}
        foreach((new EditorRoles($this->repo))->users() as $user)if($user['id']===$principal['id']&&$user['enabled']&&$user['revision']===($principal['revision']??null))return array_intersect_key($user,array_flip(['id','name','role']));return null;
    }
    public function authenticated(): bool {return $this->principal()!==null;}
    public function requireAdmin(): void { if (!$this->authenticated()) throw new ApiException('Oturum gerekli.',401); }
    public function sameOrigin(): void {
        $u=parse_url($this->config['site']['url']);
        $origin=($u['scheme']??'').'://'.($u['host']??'');
        if (isset($u['port']) && !(($u['scheme']==='https' && $u['port']===443)||($u['scheme']==='http' && $u['port']===80))) $origin.=':'.$u['port'];
        if (($_SERVER['HTTP_ORIGIN']??'')!==$origin) throw new ApiException('İstek kaynağı doğrulanamadı.',403);
    }
    public static function now(): int { return (int)floor(microtime(true)*1000); }
    public function rateLimit(string $key,int $max,int $window): void {
        $t=Database::table('limits'); $now=self::now();
        $this->db->prepare("DELETE FROM $t WHERE expires<?")->execute([$now]);
        $this->db->prepare("INSERT INTO $t (limit_key,`count`,expires) VALUES (?,1,?) ON DUPLICATE KEY UPDATE `count`=`count`+1")->execute([$key,$now+$window]);
        $q=$this->db->prepare("SELECT `count` FROM $t WHERE limit_key=?"); $q->execute([$key]);
        if ((int)$q->fetchColumn()>$max) throw new ApiException('Çok fazla deneme. Daha sonra tekrar deneyin.',429);
    }
    public function login(mixed $password,mixed $username="owner",mixed $code=''): void {
        $account=is_string($username)&&strlen($username)<=64?$username:'invalid';$ip=$_SERVER['REMOTE_ADDR']??'local';
        $pair='login:pair:'.hash('sha256',$account.'|'.$ip);
        $this->rateLimit('login:global',1000,900000);$this->rateLimit('login:ip:'.hash('sha256',$ip),100,900000);$this->rateLimit('login:account:'.hash('sha256',$account),40,900000);$this->rateLimit($pair,8,900000);
        if(!$this->configured())throw new ApiException('Administrator setup required.',503);
        if(!is_string($username)||strlen($username)>64||!is_string($password)||strlen($password)>256||!is_string($code)||strlen($code)>100)throw new ApiException('Invalid credentials or verification code.',401);
        $token=bin2hex(random_bytes(32));
        $this->repo->transaction(function()use($username,$password,$code,$token){
            $security=new AccountSecurity($this->db,$this->repo,$this->config);$principal=['id'=>'owner','role'=>'owner','securityRevision'=>$security->raw()['securityRevision'],'createdAt'=>Repository::now()];$hash=$this->repo->setting('password');
            if($username!=='owner'){$hash=null;foreach((new EditorRoles($this->repo))->users()as$user)if($user['id']===$username&&$user['enabled']){$hash=$user['passwordHash'];$principal=['id'=>$user['id'],'role'=>$user['role'],'revision'=>$user['revision'],'createdAt'=>Repository::now()];}}
            if(!password_verify(hash('sha256',$password),is_string($hash)?$hash:password_hash('unavailable',PASSWORD_DEFAULT)))throw new ApiException('Invalid credentials or verification code.',401);
            if($username==='owner')$security->consumeCode($code);
            $this->db->prepare("DELETE FROM ws_settings WHERE setting_key IN (SELECT CONCAT('session-principal:',token) FROM ws_sessions WHERE expires<?)")->execute([self::now()]);
            $this->db->prepare('DELETE FROM ws_sessions WHERE expires<?')->execute([self::now()]);
            $this->db->prepare('INSERT INTO ws_sessions(token,expires) VALUES(?,?)')->execute([hash('sha256',$token),self::now()+28800000]);$this->repo->setSetting('session-principal:'.hash('sha256',$token),$principal);
        });
        $this->db->prepare('DELETE FROM ws_limits WHERE limit_key=?')->execute([$pair]);$this->cookie($token);
    }
    public function logout(): void {
        $token=$_COOKIE['catalog_admin']??'';
        if (is_string($token)) $this->db->prepare('DELETE FROM '.Database::table('sessions').' WHERE token=?')->execute([hash('sha256',$token)]);
        if(is_string($token))$this->db->prepare('DELETE FROM ws_settings WHERE setting_key=?')->execute(['session-principal:'.hash('sha256',$token)]);
        $this->cookie('');
    }
    private function cookie(string $token): void {
        $u=parse_url($this->config['site']['url']);
        setcookie('catalog_admin',$token,['expires'=>$token?time()+28800:time()-3600,'path'=>rtrim($u['path']??'','/').'/','secure'=>($u['scheme']??'')==='https','httponly'=>true,'samesite'=>'Strict']);
    }
}
