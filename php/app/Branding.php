<?php
declare(strict_types=1);
namespace WexaShelf;

/** Owner branding is independent from portable theme and visitor appearance settings. */
final class Branding
{
    public static function defaults(): array
    {
        return ['logo'=>null, 'logoMode'=>'image-and-name', 'logoWidth'=>160];
    }

    public static function validate(mixed $input): array
    {
        Validation::check(is_array($input) && !array_diff(array_keys($input), ['logo','logoMode','logoWidth']), 'Invalid branding settings.');
        Validation::check(array_key_exists('logo', $input) && in_array($input['logoMode'] ?? null, ['image-and-name','image-only','text-only'], true), 'Invalid logo display mode.');
        Validation::check(is_int($input['logoWidth'] ?? null) && $input['logoWidth'] >= 64 && $input['logoWidth'] <= 320, 'Logo width must be between 64 and 320 pixels.');
        if ($input['logo'] !== null) Validation::articleImages([$input['logo']]);
        return $input;
    }

    public static function fromConfig(array $config): array
    {
        try { return self::validate($config['seo']['branding'] ?? self::defaults()); }
        catch (ApiException) { return self::defaults(); }
    }

    /** Explicit owner save requires local bytes with matching metadata; backup validation stays portable. */
    public static function assertAvailable(array $branding): void
    {
        $logo = self::validate($branding)['logo'];
        if ($logo === null) return;
        try { $bytes = ContentMedia::read($logo['assetId'], $logo['format']); }
        catch (ApiException) { throw new ApiException('Upload the logo again before saving branding.'); }
        $size = @getimagesizefromstring($bytes);
        $format = match ($size[2] ?? 0) { IMAGETYPE_PNG=>'png', IMAGETYPE_JPEG=>'jpg', IMAGETYPE_WEBP=>'webp', default=>'' };
        Validation::check(strlen($bytes) <= ContentMedia::MAX_BYTES && $format === $logo['format'] && ($size[0] ?? 0) === $logo['width'] && ($size[1] ?? 0) === $logo['height'], 'Logo metadata does not match the uploaded image.');
    }

    /** A missing restored media directory must not render a broken site identity. */
    public static function visibleLogo(array $branding): ?array
    {
        if (($branding['logoMode'] ?? '') === 'text-only' || !is_array($branding['logo'] ?? null)) return null;
        try { self::assertAvailable($branding); return $branding['logo']; }
        catch (ApiException) { return null; }
    }

    public static function link(array $config, string $href): string
    {
        $e = static fn(mixed $value): string => htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $name = $config['seo']['siteName'] ?? 'WexaShelf';
        $branding = self::fromConfig($config);
        $logo = self::visibleLogo($branding);
        $html = '<a class="brand site-brand-content" href="'.$e($href).'" aria-label="'.$e($name).'">';
        if ($logo) {
            $html .= '<img class="site-brand-logo" src="'.$e(Config::url($config, 'media/'.$logo['assetId'].'.'.$logo['format'])).'" alt="'.$e($logo['alt']).'" width="'.$logo['width'].'" height="'.$logo['height'].'" style="max-width:'.$branding['logoWidth'].'px;max-height:56px;width:auto;height:auto;object-fit:contain" decoding="async">';
        }
        if (!$logo || $branding['logoMode'] !== 'image-only') $html .= '<span class="site-brand-name">'.$e($name).'</span>';
        return $html.'</a>';
    }
}
