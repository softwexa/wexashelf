<?php
declare(strict_types=1);
namespace WexaShelf;

/** Translates authored API errors only; never translates arbitrary user content. */
final class ServerErrors
{
    private static array $catalogs = [];

    public static function message(string $raw, ?string $locale = null): string
    {
        $tag = strtolower(trim(explode(',', $locale ?? ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'en'))[0]));
        $language = preg_match('/^tr(?:[-_;]|$)/', $tag) ? 'tr' : 'en';
        if (!isset(self::$catalogs[$language])) {
            $contents = file_get_contents(__DIR__.'/../resources/error.'.$language.'.json');
            self::$catalogs[$language] = $contents === false ? [] : (json_decode($contents, true) ?: []);
        }
        $catalog = self::$catalogs[$language];
        if (isset($catalog[$raw]) && is_string($catalog[$raw])) return $catalog[$raw];

        // Restrict variable field names to identifiers. Never apply substring replacement.
        $field = '([A-Za-z0-9_.\\[\\]-]{1,160})';
        $patterns = $language === 'en' ? [
            '/^'.$field.': geçersiz düz metin\\.$/uD' => '$1: invalid plain text.',
            '/^'.$field.': geçersiz liste\\.$/uD' => '$1: invalid list.',
            '/^'.$field.': geçersiz metin\\.$/uD' => '$1: invalid text.',
            '/^'.$field.': metin çok uzun\\.$/uD' => '$1: text is too long.',
            '/^Geçersiz istek alanı: '.$field.'$/uD' => 'Invalid request field: $1',
            '/^Mağaza kimliği başka uygulamaya ait: '.$field.'$/uD' => 'Store identity belongs to another app: $1',
            '/^Yayın için tüm metin alanlarını çevirin: '.$field.'$/uD' => 'Translate all text fields before publishing: $1',
            '/^Sağlayıcı isteği başarısız oldu \\(HTTP ([1-5][0-9]{2})\\)\\.$/uD' => 'The provider request failed (HTTP $1).',
        ] : [
            '/^'.$field.' is required\\.$/D' => '$1 alanı gerekli.',
            '/^'.$field.': invalid plain text\\.$/D' => '$1: geçersiz düz metin.',
            '/^'.$field.': invalid list\\.$/D' => '$1: geçersiz liste.',
            '/^'.$field.': invalid text\\.$/D' => '$1: geçersiz metin.',
            '/^'.$field.': text is too long\\.$/D' => '$1: metin çok uzun.',
            '/^Invalid request field: '.$field.'$/D' => 'Geçersiz istek alanı: $1',
            '/^Store identity belongs to another app: '.$field.'$/D' => 'Mağaza kimliği başka uygulamaya ait: $1',
            '/^Translate all text fields before publishing: '.$field.'$/D' => 'Yayın için tüm metin alanlarını çevirin: $1',
            '/^Missing metric: '.$field.'$/D' => 'Eksik metrik: $1',
            '/^Missing source queue field: '.$field.'$/D' => 'Eksik kaynak kuyruğu alanı: $1',
            '/^Source provider returned HTTP ([1-5][0-9]{2})\\. No observation was applied\\.$/D' => 'Kaynak sağlayıcı HTTP $1 döndürdü. Hiçbir gözlem uygulanmadı.',
            '/^The provider request failed \\(HTTP ([1-5][0-9]{2})\\)\\.$/D' => 'Sağlayıcı isteği başarısız oldu (HTTP $1).',
        ];
        foreach ($patterns as $pattern => $replacement) {
            if (preg_match($pattern, $raw) === 1) return preg_replace($pattern, $replacement, $raw) ?? $raw;
        }
        return $raw;
    }
}
