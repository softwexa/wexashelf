# PHP + MySQL yerel dağıtım ve Docker

## 0.5.0 AI ve SEO ekleri

Kurulumdan sonra yönetimdeki AI içerik stüdyosunda kendi sağlayıcı anahtarınızı girin; sohbet veya destek mesajıyla paylaşmayın. OpenAI şablonu ve birden fazla OpenAI uyumlu sağlayıcı desteklenir; uyumluluk JSON schema metin ve base64 görsel yanıtı gerektirir. Ücretli gerçek sağlayıcı çağrısı ve gerçek cPanel doğrulaması bu sürümün yerel kanıtları arasında değildir.

Özel `storage/ai-settings.json`/kilidi ile `storage/media` erişimini koruyun. Günlük UTC üretim sayaçları para limiti değildir. Uyumlu sağlayıcı metin/görsel çağrılarının 35/55 saniyelik sınırları hosting PHP/proxy limitini aşabilir; hedef hostta kontrol edin. Ayrıntılar: [AI ve SEO](AI_VE_SEO.md).

Tam yedek MySQL + özel storage gerektirir. Katalog JSON yedeği global SEO ve kayıt metadata alanlarını içerir; kapak dosyaları, AI işler ve anahtarlar dahil değildir. AI/SEO ayarlarını ve medya erişimini taşıma sonrasında doğrulayın. Yerel/HTTP kurulumda indeksleme etkinleşmez.


Ana çalışma ortamı PHP'dir. Docker imajı PHP 8.4 + Apache ve hazır tarayıcı dosyalarını içerir; ikinci servis MariaDB 11.8'dir. Hosting için doğrudan ZIP kurulumu [cPanel kılavuzunda](KURULUM_CPANEL.md) anlatılır. Node kaynakları geliştirici araçları ve önceki prototip için korunur; PHP hosting üzerinde Node veya Composer gerekmez.

## Docker Compose

```sh
cp .env.example .env
# .env içinde DB_PASSWORD, DB_ROOT_PASSWORD ve WEXA_SETUP_KEY değerlerini seçin.
# Kurulum anahtarı en az 24 rastgele karakter olmalıdır.
docker compose config --quiet
docker compose build
docker compose up -d
```

Sırları kendi parola yöneticinizde üretin; `.env` dosyasını paylaşmayın. Compose boş parola/anahtarla başlamaz. Veritabanı dışarı port açmaz; web yalnız `127.0.0.1:3141` üzerindedir. `HOST_PORT` değiştirilebilir. Eski 3140 geliştirme sunucusuna ve SQLite verisine dokunulmaz.

`http://127.0.0.1:3141/install` adresinde kurulum anahtarını girin. Veritabanı sunucusu `db`, port `3306`; veritabanı/kullanıcı adı `.env` değerleri (varsayılan `wexashelf`), parola `DB_PASSWORD` değeridir. Site URL'si `http://127.0.0.1:3141`; yönetici parolasını formda ayrıca belirleyin. DB root parolasını uygulamaya vermeyin. Kurulum tamamlanana kadar web healthcheck'in başarısız olması beklenir.

`/api/health` başarıda 200 `{"status":"ok"}` verir. Bu kontrol veritabanı bağlantısını sınar; tüm ürün akışlarının veya gerçek hosting kurulumunun kanıtı değildir. Yönetim `/admin` adresindedir. Kurulum kilidi kalıcı storage volume'undadır. Konteyneri yeniden yaratmak hesabı veya verileri sıfırlamaz.

16 Kasım 2026 yerel Docker kontrolü: PHP 8.4 Apache imajı derlendi; ayrı MariaDB 11.8 veritabanında web kurulum formu, 17 başlangıç kaydı, kurulum kilidi, oturum/origin koruması, herkese açık sayfalar ve hazır varlıklar, özel yol engelleri, yedek ve kaynak kuyruğu yanıtları doğrulandı. Tema ayarı kaydı konteyner yeniden başlatmasından sonra korundu; yapılandırma ve kilit dosyaları 0600 idi. Bu gözlem cPanel veya kamuya açık TLS kurulumu değildir.

## Kalıcılık ve yedek

`shelf-storage` volume'u özel yapılandırma/install kilidini; `shelf-db` volume'u MariaDB verisini tutar. `docker compose down` volume'ları korur. `docker compose down -v` kalıcı verileri siler; normal güncellemede kullanmayın. Yeni PHP imajını oluşturup `docker compose up -d` ile uygulayın; önce yedek alın.

Taşınabilir katalog yedeği yönetim ekranındadır. Tam yedek için MariaDB'nin tutarlı dump yöntemi ve storage yapılandırmasının güvenli kopyası birlikte gerekir. Canlı veritabanı volume'unu ham dosya kopyasıyla yedeklemeyin. Geri yüklemeyi farklı Compose proje adı ve host portuyla ayrı boş veritabanında doğrulayın; mevcut veriyi bununla değiştirmeyin.

## Paket geliştirme

Geliştirme makinesinde `npm ci` ve `npm run build:php` tarayıcı JS/CSS, fontlar ve başlangıç içeriklerini üretir. `npm run package:php` hazır `artifacts/releases/wexashelf-php-0.5.0.zip` ile SHA-256 dosya/arşiv manifestini yazar. Sistem `zip` aracı gerekir. Paketleyici kurulum sırrı, yapılandırma, günlük, test ve yerel veritabanlarını almaz. PHP imajı bu hazır dosyaları kopyalar; konteynerde npm çalışmaz.

Proje kodu MIT lisanslıdır. Docker imajı kökte `LICENSE` ve `THIRD_PARTY_NOTICES.md`, özel `resources/licenses` dizininde paketlenmiş tarayıcı bağımlılıklarının lisans metinlerini taşır. Üçüncü taraf görsel izinleri ayrıca doğrulanmalıdır. Yerel paket/çalışma kontrolleri, gerçek cPanel/TLS, müşteri kurulumu veya kamuya yayın doğrulaması değildir. Önceki Node/SQLite Docker doğrulaması bu PHP sürümünün doğrulaması olarak kullanılamaz.
