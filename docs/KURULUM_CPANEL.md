# WexaShelf — PHP + MySQL cPanel kurulumu

## 0.7 işletim ve güvenlik

Kurulumdan sonra yönetimdeki AI içerik stüdyosunda kendi sağlayıcı anahtarınızı girin; sohbet veya destek mesajıyla paylaşmayın. OpenAI şablonu ve birden fazla OpenAI uyumlu sağlayıcı desteklenir; uyumluluk JSON schema metin ve base64 görsel yanıtı gerektirir. Ücretli gerçek sağlayıcı çağrısı ve gerçek cPanel doğrulaması bu sürümün yerel kanıtları arasında değildir.

Özel `storage/ai-settings.json`/kilidi ile `storage/media` erişimini koruyun. Günlük UTC üretim sayaçları para limiti değildir. AI üretimi artık kalıcı kuyruğa yazılır; tarayıcıdan bağımsız PHP CLI cron işçisi gerekir. Uyumlu sağlayıcı metin/görsel çağrıları işçi içinde 35/55 saniye ile sınırlıdır; host CLI çalışma limitini kontrol edin. [Cron kurulumu](CRON-WORKERS.md) otomatik etkinleştirme değildir. Ayrıntılar: [AI ve SEO](AI_VE_SEO.md).

Tam yedek MySQL + özel storage gerektirir. Katalog JSON yedeği global SEO ve kayıt metadata alanlarını içerir; kapak dosyaları, AI işler ve anahtarlar dahil değildir. AI/SEO ayarlarını ve medya erişimini taşıma sonrasında doğrulayın. Yerel/HTTP kurulumda indeksleme etkinleşmez.


Ana dağıtım PHP + MySQL paketidir. `wexashelf-php-0.7.1.zip` hazır tarayıcı dosyalarını içerir; hosting üzerinde Node.js, npm, Composer, SSH veya derleme gerekmez. Proje kodu MIT lisanslıdır; üçüncü taraf ikon ve görsel hakları ayrıdır ve açık yayından önce kontrol edilmelidir. Paket oluşturulması gerçek cPanel kurulumunun doğrulandığı anlamına gelmez.

## 0.8 boş katalog ve ilk kullanım

Yeni kurulumda varsayılan seçim **Boş katalog**, varsayılan dil İngilizcedir. Site adını girin; örnek uygulama/yazı/listeleri yalnız **Örnek katalog** seçilirse kurulur. Örnek kayıtların Türkçe kaynak dili arayüz diliyle değiştirilmez. Yönetimde owner Sistem durumu paneli yerel kontrolleri, ilk kullanım adımlarını ve kaydedilmiş CLI çalışmalarını gösterir; gerçek cron zamanlamasını veya üretim hostingini doğrulamış saymaz. Ayrıntılı ve kopyalanabilir komutlar: [INSTALL-OPERATIONS.md](INSTALL-OPERATIONS.md).

## Gereksinimler

- PHP 8.3 veya üzeri; `pdo_mysql`, `curl`, `mbstring`, `intl` uzantıları.
- MySQL 8.4 önerilir veya MariaDB 10.11+; InnoDB ve utf8mb4 desteği.
- Apache veya uyumlu LiteSpeed: `.htaccess`, rewrite ve erişim engelleme kuralları etkin.
- Alan adı için HTTPS; PHP kullanıcısının yalnız `storage` dizinine yazma izni.

Bu gereksinimler her cPanel hesabında otomatik sağlanmaz. Hosting sağlayıcınızın PHP uzantılarını, MySQL/MariaDB sürümünü, dış HTTPS erişimini ve `.htaccess` kurallarını desteklediğini doğrulayın.

## Dosya Yöneticisi ile kurulum

1. cPanel → MySQL Databases bölümünden boş bir veritabanı ve yalnız ona erişen kullanıcı oluşturun. cPanel'in eklediği hesap öneklerini not edin. Bu veritabanına gerekli tablo oluşturma ve okuma/yazma izinlerini verin.
2. PHP sürümünü ve uzantılarını seçin. ZIP'i alan adı köküne veya seçtiğiniz alt dizine yükleyip açın. ZIP içindeki `index.php` doğrudan bu dizinde olmalı; örneğin `public_html/index.php` veya `public_html/rehber/index.php`. Gizli `.htaccess` dosyalarının da açıldığını kontrol edin.
3. `storage/install.key` adlı düz metin dosyası oluşturun. İçeriğine parola yöneticisinde ürettiğiniz, en az 24 karakterlik rastgele bir kurulum anahtarı yazın. Ortak/varsayılan anahtar yoktur; bunu yönetici parolanızdan farklı seçin. Dosyayı mümkünse 0600, `storage` dizinini PHP kullanıcısına yazılabilir 0700 yapın. 0777 kullanmayın.
4. Tarayıcıda `https://alanadiniz.com/install` veya alt dizin için `https://alanadiniz.com/rehber/install` adresini açın. Kurulum anahtarı, veritabanı sunucusu (çoğunlukla `localhost`), port, tam veritabanı/kullanıcı adları, parola, tam site URL'si ve 12–256 baytlık yönetici parolası girin.
5. Site URL'si alt dizin dahil gerçek tarayıcı adresi olmalıdır. Kurulum başarılı olduğunda `storage/config.php` ve `storage/install.lock` oluşturulur; özel dosyalar 0600 izinle korunur. Kurulum anahtarı dosyasını kaldırın. `/admin` üzerinden giriş yapın.
6. `/api/health` yanıtını ve bir uygulama sayfasını kontrol edin. `/storage/config.php`, `/app/bootstrap.php` ve `/resources/seed.json` adresleri engellenmiş olmalıdır. Bu adreslerden içerik okunuyorsa hosting erişim kuralları uygulanmıyor demektir; yayına geçmeden hosting yöneticisine düzelttirin.

Kurulum sayfası kilitlendikten sonra anahtar yeniden kurulum izni vermez. Mevcut veritabanını sıfırlamak için kurulum dosyalarını silmeyin. Kurulum hatasında genel hata mesajını ve PHP hata günlüğünü inceleyin; parolaları destek kayıtlarına eklemeyin.

## Hesap güvenliği ve cron

İlk girişten sonra owner parola/oturum yönetimi ve isteğe bağlı authenticator MFA için [ACCOUNT-SECURITY.md](ACCOUNT-SECURITY.md) rehberini izleyin. Kurtarma kodları yalnız bir kez gösterilir. HTTP üzerinden parola sıfırlama uç noktası yoktur; yerel kurtarma CLI ve özel parola dosyası gerektirir. CLI araçları hosting ZIP içinde `cli/` altındadır; `/cli/worker.php`, `/cli/account-recovery.php` ve `/cli/backup-restore.php` HTTP istekleri engellenmelidir.

cPanel Cron Jobs bölümünde hostunuzun PHP 8.3+ CLI yoluyla AI işçisini ayrıca tanımlayın. Web PHP ve CLI PHP sürümü/uzantıları farklı olabilir. Kapanan tarayıcı kuyruğu durdurmaz, fakat cron yapılandırılmamışsa işler bekler. Özel storage yolunu doğru seçin, günlükleri herkese açık dizine yazmayın. Gerçek cron/hosting çalışması hedef hesapta doğrulanmalıdır.

## İçerik, güncelleme ve yedek

Yönetimde JSON yedeği katalog, revizyonlar, geri bildirim, görünüm ve kabul kurallarını taşır; yönetici parolası ve oturumları taşımaz. Kaynak yenileme kuyruğu geri yüklemede temizlenir. Yönetimde özel parçalı yükleme en fazla 100 MiB kabul eder; SHA-256 ve önizleme sonrası açık onayla geri yükler. PHP bellek ön kontrolü daha küçük dosyada CLI gerektirebilir; genel HTTP gövde sınırını yükseltmeyin. [BACKUP-RECOVERY.md](BACKUP-RECOVERY.md) kapsamını ve kuru çalıştırma sonucunu inceleyin. Tam sistem yedeği için cPanel veritabanı yedeğini ve özel `storage/config.php` dosyasını ayrı, güvenli yerde saklayın; yedek ZIP'lerini web kökünde bırakmayın.

Güncellemede önce yedek alın; yeni paket dosyalarını yükleyin fakat mevcut `storage/config.php`, `storage/install.lock` ve veritabanını koruyun. Alan adı veya alt dizin değişirse yedekten sonra yapılandırmadaki site URL'sini güncelleyin; çerez yolu ve origin kontrolü bu URL'yi kullanır. Dizin taşıma ve gerçek hosting özellikleri ayrı doğrulanmalıdır.

Apple Lookup, Google Play/Microsoft JSON-LD, yapılandırılan özel HTTPS JSON ve elle girilen gözlem adaptörleri aday üretir. Dış HTTPS erişimi, mağaza sayfa biçimi ve kimlik doğrulaması başarıyı etkiler. Kaynak adayları açık editör uygulaması olmadan kayda işlenmez ve kendiliğinden yayımlanmaz. Ayrı `cli/source-worker.php` kuyruğu boşaltır; otomatik tarama veya cron etkinleştirmesi iddia etmez. Ayrıntılar: [STORE-SOURCES.md](STORE-SOURCES.md).

## Arama motoru ve geliştirici bilgisi

Kurulum başlangıçta indekslemeyi kapatır. Gerçek HTTPS alan adında içerik ve kaynak kontrolünü tamamladıktan sonra yönetimde global SEO ayarlarından indekslemeyi etkinleştirin. Uygulama/yazı/liste kayıtları ayrıca yönetimde SEO onayı almalıdır. Arama, filtreler, kişisel ve yönetim sayfaları indekslenmez; `robots.txt` ve `sitemap.xml` adreslerini kontrol edin.

Görünür geliştirici bilgisi isteğe bağlıdır. Aynı `site` dizisine `'show_credit' => false` eklemek ziyaretçi alt bilgisindeki Softwexa bağlantısını kaldırır; varsayılan açıktır. Kod kopyalarındaki MIT telif ve lisans bildirimi korunmalıdır.

## Sürüm kanıtı

0.6 yerel Apache/Docker ve Lighthouse kayıtları tarihsel kanıttır. 0.7 son ZIP/Docker kurulumu, yükseltme ve MySQL 8.4 kontrol sonucu [RELEASE-0.7.0-VALIDATION.md](RELEASE-0.7.0-VALIDATION.md) içinde ayrıca izlenir; gerçek cPanel erişimi ve yayına alma henüz doğrulanmış sayılmaz. Özgün MIT SVG görselleri yeni dağıtım için hazırlanmıştır; eski görsel kopyalarının arşivden dışlanması son paket kontrolünün parçasıdır.
