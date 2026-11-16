<?php
declare(strict_types=1);
namespace WexaShelf;

final class EditorRoles {
    public function __construct(private Repository $repo){}
    public function users():array{return $this->repo->setting('editor-users',[]);}
    public function state():array{return ['users'=>array_map(static function($u){unset($u['passwordHash']);return $u;},$this->users()),'roles'=>['editor','publisher','analyst']];}
    public function save(array $v):array {
        Validation::check(is_string($v['id']??null)&&preg_match('/^[a-z][a-z0-9-]{2,63}$/D',$v['id'])&&$v['id']!=='owner','Invalid editor username.');Validation::str($v['name']??null,'Display name',100);Validation::check(trim($v['name'])!==''&&in_array($v['role']??null,['editor','publisher','analyst'],true)&&is_bool($v['enabled']??null)&&is_int($v['revision']??null),'Invalid editor settings.');$password=$v['password']??'';Validation::check(is_string($password)&&($password===''||strlen($password)>=12&&strlen($password)<=256),'Password must contain 12–256 characters.');
        return $this->repo->transaction(function()use($v,$password){$users=$this->users();$old=null;foreach($users as $u)if($u['id']===$v['id'])$old=$u;if(($old['revision']??0)!==$v['revision'])throw new ApiException('Editor account changed. Reload.',409);Validation::check($old||$password!=='','New accounts require a password.');$next=['id'=>$v['id'],'name'=>$v['name'],'role'=>$v['role'],'enabled'=>$v['enabled'],'revision'=>($old['revision']??0)+1,'passwordHash'=>$password===''?$old['passwordHash']:password_hash(hash('sha256',$password),PASSWORD_DEFAULT),'updatedAt'=>Repository::now()];$users=array_values(array_filter($users,fn($u)=>$u['id']!==$next['id']));Validation::check(count($users)<50,'Editor account limit reached.');$users[]=$next;$this->repo->setSetting('editor-users',$users);$this->repo->audit('editor-save',$next['id'],$next['role'].'; enabled='.(int)$next['enabled']);return $this->state();});
    }
    public static function authorize(array $principal,string $path,string $method,array $body):void {
        $role=$principal['role']??'';if($role==='owner')return;
        if($path==='/api/admin/media'&&in_array($role,['editor','publisher'],true))return;
        $read=['/api/admin','/api/admin/record','/api/admin/history','/api/admin/translations','/api/admin/translations/history','/api/admin/localization','/api/admin/growth','/api/admin/growth/history','/api/admin/growth/insights','/api/admin/growth/lifecycle','/api/admin/capabilities','/api/admin/seo','/api/admin/performance'];
        if($method==='GET'&&in_array($path,$read,true))return;
        if($role==='analyst'&&$method==='POST'&&$path==='/api/admin/growth/gsc')return;
        if(in_array($role,['editor','publisher'],true)){
            $write=['/api/admin/records','/api/admin/restore','/api/admin/feedback','/api/admin/translations','/api/admin/translations/restore','/api/admin/growth','/api/admin/growth/restore','/api/admin/capabilities/proposals'];
            if($method==='POST'&&in_array($path,$write,true)){
                if($role==='editor'&&in_array($path,['/api/admin/records','/api/admin/translations','/api/admin/growth'],true)){if(!in_array($body['status']??null,['draft','review'],true)||($body['seoApproved']??false)!==false)throw new ApiException('Editors may save drafts for publisher review only.',403);}return;
            }
            if($role==='publisher'&&$method==='POST'&&in_array($path,['/api/admin/capabilities','/api/admin/growth/gsc'],true))return;
        }
        throw new ApiException('Your role cannot perform this action.',403);
    }
}
