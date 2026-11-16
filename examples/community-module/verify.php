<?php
declare(strict_types=1);
require dirname(__DIR__, 2) . '/php/app/bootstrap.php';

use WexaShelf\ApiException;
use WexaShelf\Extensions;

$manifest = json_decode((string)file_get_contents(__DIR__ . '/manifest.json'), true, 32, JSON_THROW_ON_ERROR);
$validated = Extensions::validatePackage($manifest);
if ($validated !== $manifest || strlen(Extensions::checksum($manifest)) !== 64) {
    throw new RuntimeException('Manifest validation or checksum failed.');
}
$invalid = [];
$invalid[] = array_replace($manifest, ['requires' => 'unsupported-module-api:2']);
$invalid[] = array_replace($manifest, ['script' => 'alert(1)']);
$external = $manifest;
$external['cards'][0]['locales']['en']['href'] = 'https://external.example/';
$invalid[] = $external;
foreach ($invalid as $candidate) {
    try {
        Extensions::validatePackage($candidate);
    } catch (ApiException) {
        continue;
    }
    throw new RuntimeException('An unsupported module manifest was accepted.');
}
echo "Declarative module validates; checksum, API compatibility, executable-field and external-link rejection verified. No installation or database writes.\n";
