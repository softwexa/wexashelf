<?php
declare(strict_types=1);
namespace WexaShelf;

/** Server-only provider transport. The injectable transport exists for isolated tests only. */
final class AIProvider
{
    public function __construct(private ?\Closure $transport = null) {}

    public static function validateProvider(array $p): array
    {
        foreach (['id','label','protocol','baseUrl','textModel','imageModel'] as $key) {
            if (!isset($p[$key]) || !is_string($p[$key])) throw new ApiException('Sağlayıcı alanları eksik.');
            $p[$key] = trim($p[$key]);
        }
        if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,63}$/D', $p['id']) || $p['label']==='' || strlen($p['label'])>160 || preg_match('/[\x00-\x1f<>]/', $p['label'])) throw new ApiException('Sağlayıcı kimliği veya adı geçersiz.');
        if (!in_array($p['protocol'], ['openai','compatible'], true)) throw new ApiException('Desteklenmeyen sağlayıcı protokolü.');
        foreach (['textModel','imageModel'] as $key) if (!($key==='imageModel' && ($p['imageEnabled']??null)===false && $p[$key]==='') && !preg_match('~^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$~D', $p[$key])) throw new ApiException('Model kimliği geçersiz.');
        if (!isset($p['imageEnabled']) || !is_bool($p['imageEnabled'])) throw new ApiException('Görsel ayarı geçersiz.');
        $p['baseUrl'] = rtrim($p['baseUrl'], '/');
        self::urlParts($p['baseUrl']);
        if ($p['protocol']==='openai' && $p['baseUrl']!=='https://api.openai.com/v1') throw new ApiException('OpenAI adresi sabittir.');
        if (isset($p['apiKey']) && (!is_string($p['apiKey']) || strlen($p['apiKey'])>4096 || preg_match('/[\x00-\x20\x7f]/', $p['apiKey']))) throw new ApiException('API anahtarı biçimi geçersiz.');
        return array_intersect_key($p, array_flip(['id','label','protocol','baseUrl','textModel','imageModel','imageEnabled','apiKey']));
    }

    private static function urlParts(string $url): array
    {
        $u = parse_url($url);
        if (!$u || ($u['scheme']??'')!=='https' || empty($u['host']) || isset($u['user']) || isset($u['pass']) || isset($u['query']) || isset($u['fragment']) || (isset($u['port']) && $u['port']!==443) || preg_match('/[\x00-\x20\\\\]/', $url)) throw new ApiException('Yalnız HTTPS/443 sağlayıcı adresi kabul edilir.');
        $host = $u['host'];
        if (!preg_match('/^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/D', $host)) throw new ApiException('Genel bir sağlayıcı alan adı gerekli.');
        if (!preg_match('#^(/[A-Za-z0-9._~-]+)*$#D', $u['path']??'')) throw new ApiException('Sağlayıcı yolu geçersiz.');
        return $u;
    }

    public static function isPublicIp(string $ip): bool
    {
        if (!filter_var($ip,FILTER_VALIDATE_IP,FILTER_FLAG_NO_PRIV_RANGE|FILTER_FLAG_NO_RES_RANGE)) return false;
        if (str_contains($ip, ':')) {
            $bin = inet_pton($ip);
            // Only global unicast 2000::/3; exclude transition and documentation ranges.
            return $bin!==false && (ord($bin[0]) & 0xe0)===0x20 && !(substr($bin,0,2)===hex2bin('2001') && (ord($bin[2]) & 0xfe)===0) && !preg_match('/^(2001:db8:|2002:|3fff:)/i',$ip);
        }
        $v = ip2long($ip);
        return !(($v & 0xffc00000)===ip2long('100.64.0.0') || ($v & 0xffffff00)===ip2long('192.0.0.0') || ($v & 0xffffff00)===ip2long('192.0.2.0') || ($v & 0xffffff00)===ip2long('192.88.99.0') || ($v & 0xfffe0000)===ip2long('198.18.0.0') || ($v & 0xffffff00)===ip2long('198.51.100.0') || ($v & 0xffffff00)===ip2long('203.0.113.0') || ($v & 0xf0000000)===ip2long('224.0.0.0'));
    }

    public function start(array $provider,string $task,string $prompt,array $schema,string $requestId): array
    {
        $p=self::validateProvider($provider); $image=$task==='image';
        if (strlen($prompt)>120000) throw new ApiException('Üretim girdisi çok uzun.');
        if ($image && !$p['imageEnabled']) throw new ApiException('Bu sağlayıcıda görsel üretimi kapalı.');
        if ($p['protocol']==='openai') {
            $body=['model'=>$p['textModel'],'input'=>$prompt,'background'=>true,'store'=>false,'max_output_tokens'=>6000];
            if ($image) {
                $body['tools']=[['type'=>'image_generation','model'=>$p['imageModel'],'size'=>'1536x1024','quality'=>'low','output_format'=>'png']];
                $body['tool_choice']=['type'=>'image_generation'];$body['max_tool_calls']=1;
            } else $body['text']=['format'=>['type'=>'json_schema','name'=>'wexa_'.$task,'strict'=>true,'schema'=>$schema]];
            return $this->response($this->request($p,'POST','/responses',$body,15,$image,$requestId));
        }
        $body=$image ? ['model'=>$p['imageModel'],'prompt'=>$prompt,'n'=>1,'size'=>'1536x1024','response_format'=>'b64_json'] : ['model'=>$p['textModel'],'messages'=>[['role'=>'user','content'=>$prompt]],'response_format'=>['type'=>'json_schema','json_schema'=>['name'=>'wexa_'.$task,'strict'=>true,'schema'=>$schema]],'max_tokens'=>6000];
        if ($image && (str_starts_with($p['imageModel'],'gpt-image-') || $p['imageModel']==='chatgpt-image-latest')) { unset($body['response_format']); $body['output_format']='png'; }
        $raw=$this->request($p,'POST',$image?'/images/generations':'/chat/completions',$body,$image?55:35,$image,$requestId);
        $out=['status'=>'completed','model'=>$image?$p['imageModel']:$p['textModel']];
        if ($image) { if (!is_string($raw['data'][0]['b64_json']??null)) throw new ApiException('Sağlayıcı base64 görsel döndürmedi.',502); $out['imageBase64']=$raw['data'][0]['b64_json']; }
        else { if (($raw['choices'][0]['finish_reason']??null)!=='stop' || !is_string($raw['choices'][0]['message']['content']??null)) throw new ApiException('Sağlayıcı metni tamamlamadı.',502); $out['text']=$raw['choices'][0]['message']['content']; }
        if (is_array($raw['usage']??null)) $out['usage']=$raw['usage'];
        return $out;
    }

    public function poll(array $provider,string $handle): array
    {
        $p=self::validateProvider($provider);
        if ($p['protocol']!=='openai' || !preg_match('/^resp_[A-Za-z0-9_-]{1,180}$/D',$handle)) throw new ApiException('Üretim tanıtıcısı geçersiz.');
        return $this->response($this->request($p,'GET','/responses/'.$handle,null,15,true,''));
    }

    private function response(array $raw): array
    {
        $status=$raw['status']??'';
        if (!in_array($status,['queued','in_progress','completed'],true)) throw new ApiException('Sağlayıcı üretimi tamamlayamadı veya reddetti.',502);
        $out=['status'=>$status];
        if (is_string($raw['id']??null) && preg_match('/^resp_[A-Za-z0-9_-]{1,180}$/D',$raw['id'])) $out['handle']=$raw['id'];
        elseif ($status!=='completed') throw new ApiException('Sağlayıcı iş tanıtıcısı döndürmedi.',502);
        $text=''; $images=[];
        foreach (($raw['output']??[]) as $item) {
            if (($item['type']??'')==='image_generation_call' && ($item['status']??'')==='completed' && is_string($item['result']??null)) $images[]=$item['result'];
            foreach (($item['content']??[]) as $content) {
                if (($content['type']??'')==='refusal') throw new ApiException('Sağlayıcı isteği reddetti.',422);
                if (($content['type']??'')==='output_text' && is_string($content['text']??null)) $text.=$content['text'];
            }
        }
        if (count($images)>1) throw new ApiException('Sağlayıcı birden fazla görsel döndürdü.',502);
        if ($text!=='') { if(strlen($text)>2*1024*1024) throw new ApiException('Sağlayıcı metni çok büyük.',502); $out['text']=$text; }
        if ($images) $out['imageBase64']=$images[0];
        if ($status==='completed' && !$images && $text==='') throw new ApiException('Sağlayıcı boş sonuç döndürdü.',502);
        if (is_array($raw['usage']??null)) $out['usage']=$raw['usage'];
        if (is_string($raw['model']??null)) $out['model']=substr($raw['model'],0,120);
        return $out;
    }

    private function request(array $p,string $method,string $path,?array $body,int $timeout,bool $image,string $requestId): array
    {
        if (empty($p['apiKey'])) throw new ApiException('Sağlayıcı API anahtarı eksik.',422);
        $limit=($image?20:2)*1024*1024;
        if ($this->transport) {
            $raw=($this->transport)($p,$method,$path,$body,$timeout,$limit,$requestId);
            if (!is_array($raw)) throw new ApiException('Sağlayıcı yanıtı geçersiz.',502);
            return $raw;
        }
        if (!function_exists('curl_init')) throw new ApiException('Sunucuda cURL gerekli.',503);
        $host=self::urlParts($p['baseUrl'])['host'];
        $records=@dns_get_record($host,DNS_A|DNS_AAAA); $ips=[];
        foreach ($records?:[] as $record) { $ip=$record['ip']??$record['ipv6']??null; if ($ip!==null) { if (!self::isPublicIp($ip)) throw new ApiException('Sağlayıcı ağına erişim engellendi.',422); $ips[]=$ip; } }
        if (!$ips) throw new ApiException('Sağlayıcı alan adı çözümlenemedi.',422);
        $ip=$ips[0]; $buffer=''; $overflow=false;
        $ch=curl_init($p['baseUrl'].$path);
        curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>['Content-Type: application/json','Authorization: Bearer '.$p['apiKey']],CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>$timeout,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROXY=>'',CURLOPT_RESOLVE=>[$host.':443:'.(str_contains($ip,':')?'['.$ip.']':$ip)],CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk) use (&$buffer,&$overflow,$limit): int { if(strlen($buffer)+strlen($chunk)>$limit) {$overflow=true;return 0;} $buffer.=$chunk;return strlen($chunk); }]);
        if ($body!==null) curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE));
        $ok=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE); curl_close($ch);
        if ($overflow) throw new ApiException('Sağlayıcı yanıt sınırını aştı.',502);
        if ($ok===false) throw new ApiException($method==='POST'?'Üretimin sağlayıcıya ulaşıp ulaşmadığı belirsiz. Otomatik yeniden gönderilmedi.':'Sağlayıcıya geçici olarak erişilemiyor.',503);
        if ($code<200 || $code>=300) throw new ApiException($code===401||$code===403?'Sağlayıcı anahtarı veya model erişimi reddedildi.':($code===429?'Sağlayıcı kota veya hız sınırına ulaşıldı.':'Sağlayıcı isteği başarısız oldu (HTTP '.$code.').'),$code>=500?503:502);
        try { $raw=json_decode($buffer,true,64,JSON_THROW_ON_ERROR); } catch (\JsonException) { throw new ApiException('Sağlayıcı geçerli JSON döndürmedi.',502); }
        if (!is_array($raw)) throw new ApiException('Sağlayıcı yanıtı geçersiz.',502);
        return $raw;
    }
}
