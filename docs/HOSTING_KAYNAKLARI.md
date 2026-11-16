# WexaShelf hosting kaynakları ve uyumluluk notu

**Araştırma tarihi:** 2026-11-16 (Europe/Istanbul)  
**Kapsam:** cPanel/shared hosting üzerinde mevcut Next.js 16.4.6 uygulamasını
çalıştırma ve ileride Docker/GitHub açık kaynak dağıtımı için kanıtlı sınırlar.
Bu belge öneridir; sağlayıcı seçimi, satın alma, hesap açma veya yayımlama
yapmaz.

## Kısa sonuç

Mevcut uygulamanın `engines`/çalışma gereksinimi Node.js `>=24` ve `node:sqlite`
kullanımı nedeniyle yalnızca PHP hosting yeterli değildir. cPanel panelinin
varlığı Node.js'in hesapta kullanılabildiğini kanıtlamaz: sağlayıcının ayrıca
uygun Node.js paketini, Passenger/Application Manager veya CloudLinux Node.js
Selector'ı ve hesabın ilgili özelliğini etkinleştirmesi gerekir.

En geniş ve düşük sürprizli hedef, uygulamayı **build çıktısı ve hazır vendor
varlıklarıyla** yüklenebilen bir paket olarak tasarlamak; hostta Composer/npm
çalıştırmayı zorunlu kılmamaktır. PHP tabanlı ayrı bir installer/cron yolu
gelecekte eklenebilir, ancak tek HTTP isteğine bağlı olmayan ve cPanel cron ile
çalışan isteğe bağlı bir yol olarak kalmalıdır.

## Bir sağlayıcıya sorulacak teknik kontrol listesi

- **Runtime:** Node.js 24 LTS (veya uygulamanın test ettiği daha yeni LTS),
  `node:sqlite`, `npm`/Corepack ve uygulama başlatma yöntemi gerçekten hesapta
  var mı? Node.js'in resmi sürüm tablosu v24'ü LTS gösteriyor; cPanel'in kendi
  kurulum örneği ise sağlayıcı tarafından kurulan `ea-nodejs` paketlerini ve
  Passenger'ı önkoşul sayıyor. Bu nedenle cPanel ekranı tek başına yeterli
  kanıt değildir.
- **Process policy:** Passenger/Application Manager veya Node.js Selector ile
  uygulama yeniden başlatılabiliyor mu; uzun yaşayan süreç, bellek/CPU kotası,
  subprocess ve yazılabilir kalıcı disk izinleri nedir? Shared hosting'in
  uykuya alma/yeniden başlatma davranışı varsa uygulama kalıcı worker varsaymamalı.
- **Path mapping:** domain document root'u ile uygulama root'u ayrı ayrı
  tanımlanabiliyor mu; uygulama startup dosyası/path'i ve alt dizin URL'si
  destekleniyor mu? cPanel ve CloudLinux belgeleri app root, app URI/document
  path ve startup file alanlarını ayrı kavramlar olarak gösterir.
- **Yetki sınırı:** WHM/root paket kurulumunu sağlayıcı yapar; cPanel kullanıcısı
  yalnız kendi home dizini, uygulaması ve veritabanı üzerinde işlem yapar.
  cPanel kullanıcısı olarak anlatılan kurulum adımlarını root ile tekrarlamak
  güvenlik riski olabilir.
- **Database/PHP fallback:** PHP 8.3+ (tercihen hâlen güvenlik desteğinde olan
  sürüm), MySQL 8.x veya MariaDB 10.6+ ve gerekli PDO/mysqli/mbstring/intl/curl/
  zip/json gibi uzantılar. Exact sürüm ve uzantı listesi sağlayıcıdan teyit
  edilmelidir; MySQL 8.0 serisi Nisan 2026'da EOL olduğundan yeni kurulumda
  MySQL 8.4 LTS veya sağlayıcının güncel destekli serisi ayrıca sorulmalıdır.
- **Packaging:** zip yükleme + alt dizine açma, env ayarları, database import,
  writable storage ve yedek/restore imkânı. npm/Composer'ın hostta zorunlu
  olmaması için kilit dosyaları ve derlenmiş vendor/static çıktıları paketle
  birlikte üretilebilir.

## Kaynakların söylediği sınırlar

- cPanel Application Manager, Node.js uygulamasının provider tarafından
  etkinleştirilmesini ve gerektiğinde sağlayıcıyla görüşülmesini belirtir;
  uygulama adı/domain/path ve bağımlılık kurulumu ayrı alanlardır.
- cPanel'in Node kurulum rehberi, sağlayıcının EasyApache Node.js ve Passenger
  paketlerini kurmasını ister ve işlemleri cPanel kullanıcısı olarak tarif eder.
- CloudLinux Node.js Selector, cPanel/Apache üzerinde kullanıcıya sürüm, app
  root, app URI, startup file, env ve npm install seçenekleri verir; sürümler
  ve etkinleştirme sunucu yöneticisinin kontrolündedir. Passenger tabanının
  kendi sınırlamaları olduğundan ESM/`node:sqlite` uyumluluğu ayrıca gerçek
  sürümle test edilmelidir.
- cPanel EasyApache, PHP profillerini php.net'in destek zaman çizelgesine göre
  sunar; “PHP var” demek istenen PHP sürümü/uzantısının hesapta etkin olduğu
  anlamına gelmez.

## Docker ve GitHub açık kaynak notu

Docker için shared cPanel değil, Docker çalıştırmaya yetkili VPS/dedicated veya
uygun container platformu varsayılmalıdır; bu araştırma sağlayıcının Docker
iznini doğrulamamıştır. İleride GitHub'a açılırsa lisans seçimi yapılmadan önce
bağımlılıkların ve marka/logo varlıklarının lisansları envanterlenmelidir.
MIT izin verici bir seçenek, AGPL ise ağ üzerinden kullanılan değiştirilmiş
sunucu yazılımı için kaynak sunma yükümlülükleri doğurabilir. Bu bir hukuki
öneri değildir; kullanıcı adına lisans seçilmemiştir.

## Birincil kaynaklar

- [cPanel Application Manager](https://docs.cpanel.net/cpanel/software/application-manager/)
- [cPanel: Node.js uygulaması kurma](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/)
- [CloudLinux Node.js Selector](https://docs.cloudlinux.com/cloudlinuxos/cloudlinux_os_components/)
- [CloudLinux Selector komutları](https://docs.cloudlinux.com/cloudlinuxos/command_line_tools/)
- [cPanel MultiPHP Manager](https://docs.cpanel.net/cpanel/software/multiphp-manager-for-cpanel/)
- [cPanel PHP seçenekleri](https://docs.cpanel.net/ea4/php/php-options/)
- [PHP desteklenen sürümler](https://www.php.net/supported-versions.php)
- [Node.js resmi sürüm tablosu](https://nodejs.org/en/about/previous-releases)
- [MySQL 8.0 EOL duyurusu](https://dev.mysql.com/doc/relnotes/mysql/8.0/en/)
- [MariaDB sürüm destek politikası](https://mariadb.com/docs/release-notes/community-server/about/release-model)
- [GitHub: repository lisansı seçme](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [OSI MIT lisansı](https://opensource.org/license/mit)
- [GNU AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html)

