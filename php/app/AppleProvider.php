<?php
declare(strict_types=1);
namespace WexaShelf;
final class AppleProvider {
    public static function country(string $country): string {
        $country=strtoupper($country);
        $countries='AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW';
        if (!in_array($country,explode(' ',$countries),true)) throw new ApiException('Geçersiz ülke.');
        return $country;
    }
    public static function lookup(string $id,string $country): array {
        if (!preg_match('/^[1-9][0-9]{0,14}$/D',$id)) throw new ApiException('Geçersiz Apple kimliği.');
        $country=self::country($country); $source='https://itunes.apple.com/lookup?id='.$id.'&country='.strtolower($country);
        $curl=curl_init($source); $body='';
        curl_setopt_array($curl,[CURLOPT_FOLLOWLOCATION=>false,CURLOPT_TIMEOUT=>8,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_HTTPHEADER=>['Accept: application/json'],CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk)use(&$body):int { if(strlen($body)+strlen($chunk)>2097152)return 0; $body.=$chunk; return strlen($chunk); }]);
        $ok=curl_exec($curl); $code=curl_getinfo($curl,CURLINFO_RESPONSE_CODE); curl_close($curl);
        if ($ok===false||$code!==200) throw new ApiException('Apple kaynağı okunamadı; yeniden deneyin.',502);
        return self::parse($body,$id,$country);
    }
    public static function parse(string $body,string $id,string $country): array {
        if (!preg_match('/^[1-9][0-9]{0,14}$/D',$id)) throw new ApiException('Invalid Apple identity.');
        $country=self::country($country);$source='https://itunes.apple.com/lookup?id='.$id.'&country='.strtolower($country);
        try {$result=json_decode($body,true,64,JSON_THROW_ON_ERROR);} catch(\JsonException) {throw new ApiException('Apple yanıtı geçersiz.',502);}
        if (!is_array($result)||($result['resultCount']??null)!==1||!is_array($result['results']??null)||count($result['results'])!==1) throw new ApiException('Uygulama bulunamadı.');
        $app=$result['results'][0];
        if (!is_array($app)||($app['trackId']??null)!==(int)$id||!is_string($app['trackName']??null)||trim($app['trackName'])===''||strlen($app['trackName'])>1200||!is_string($app['description']??null)) throw new ApiException('Apple kaydı kimlik veya metaverisi geçersiz.',502);
        $rating=$app['averageUserRating']??null; $ratingCount=$app['userRatingCount']??null;
        if ($rating!==null&&(!(is_int($rating)||is_float($rating))||!is_finite((float)$rating)||$rating<0||$rating>5)) throw new ApiException('Geçersiz Apple puanı.',502);
        if ($ratingCount!==null&&(!is_int($ratingCount)||$ratingCount<0||$ratingCount>9007199254740991)) throw new ApiException('Geçersiz Apple oy sayısı.',502);
        return compact('source','app','country','id','rating','ratingCount')+['observedAt'=>gmdate('Y-m-d\TH:i:s\Z'),'storeLink'=>'https://apps.apple.com/'.strtolower($country).'/app/id'.$id];
    }
}
