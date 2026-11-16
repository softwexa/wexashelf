<?php
declare(strict_types=1);
namespace WexaShelf;
final class Config {
    public static function storage(): string { return rtrim(getenv('WEXA_STORAGE_PATH') ?: dirname(__DIR__) . '/storage', '/'); }
    public static function load(): ?array {
        $file = self::storage() . '/config.php';
        if (!is_file($file)) return null;
        $config = require $file;
        if (!is_array($config) || empty($config['site']['url']) || empty($config['database'])) throw new \RuntimeException('Yapılandırma okunamadı.');
        return $config;
    }
    public static function basePath(?array $config = null): string {
        if ($config) return rtrim((string)(parse_url($config['site']['url'], PHP_URL_PATH) ?: ''), '/');
        $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
        return rtrim(dirname($script) === '/' ? '' : dirname($script), '/.');
    }
    public static function origin(array $config): string {
        $u = parse_url($config['site']['url']);
        return $u['scheme'] . '://' . $u['host'] . (isset($u['port']) ? ':' . $u['port'] : '');
    }
    public static function url(array $config, string $path = '/'): string { return rtrim($config['site']['url'], '/') . '/' . ltrim($path, '/'); }
}
