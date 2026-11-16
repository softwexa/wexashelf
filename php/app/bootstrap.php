<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');
date_default_timezone_set('UTC');
spl_autoload_register(static function (string $class): void {
    $prefix = 'WexaShelf\\';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    if (!preg_match('/^[A-Za-z][A-Za-z0-9]*$/D', $relative)) return;
    $file = __DIR__ . '/' . $relative . '.php';
    if (is_file($file)) require_once $file;
});
