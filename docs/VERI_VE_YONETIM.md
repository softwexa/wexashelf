> 0.4.0 notu: Bu belgedeki SQLite yolları ve Node komutları eski referans hattına aittir. Ana PHP/MySQL kurulumu için `KURULUM_CPANEL.md` ve `YEREL_DAGITIM.md` kullanılır. Editoryal veri/yayın sözleşmesi korunur.

# Veri ve yönetim

0.3.0 ekleri: Mağaza kimlikleri, alan bazlı kaynak bakımı ve kontrollü Apple gözlemi yenilemesi aşağıda açıklanır.

SQLite verisi `APP_DATA_DIR` altında, değişken yoksa `.local/data/catalog.sqlite` içinde tutulur. Node.js `node:sqlite` desteği gerekir. İlk açılışta katalog ve editoryal kaynaklar tek işlemle eklenir; sonraki açılışlar editör değişikliklerini ezmez. Ürün bilgileri bir başlangıç kataloğudur, canlı mağaza veri hattı değildir. `publisher` başlangıçta resmi sitenin alan adıdır; doğrulanmış şirket unvanı iddiası taşımaz.

`npm run admin:init` yerel kurulum için rastgele parola oluşturur ve yalnız dosya yolunu gösterir: `.local/admin-password.txt` (0600). Mevcut yönetici değiştirilmez. Alternatif olarak ilk açılışta en az 12 karakterlik `ADMIN_PASSWORD` ortam değişkeni verilebilir. Varsayılan parola veya internete açık kurulum uç noktası yoktur. Parola scrypt ile tuzlanmış özet olarak SQLite içinde saklanır. Oturum belirteçlerinin yalnız SHA-256 özeti tutulur; oturum 8 saat sonra sona erer. Çerez HttpOnly, SameSite=Strict ve HTTPS üzerinde Secure özelliğine sahiptir.

Mutasyonlar aynı Origin değerini zorunlu tutar. Ters proxy kurulursa `APP_ORIGIN` gerçek dış origin olarak ayarlanmalıdır. Giriş için 15 dakikada 8 başarısız deneme; geri bildirim için saatte 20 istek sınırı bu tek yönetici MVP’sinde globaldir ve SQLite içinde tutulur. Başarılı giriş başarısız deneme sayacını temizler. İstek gövdesi en çok 2 MB’dır. Üretimde proxy düzeyinde ek trafik sınırları ve kalıcı disk gerekir.

## Kayıt akışı

`draft`, `review`, `scheduled`, `published`, `archived` durumları bulunur. Yalnız yayımlanmış ve tarihi gelmiş zamanlanmış kayıtlar kamu anlık görüntüsüne girer. SEO onayı yayın durumundan bağımsızdır; bir kayıt yayımlanmış olup indeksleme onayı almamış olabilir. Yayın için kaynak, başlık/açıklama ve ilgili içerik alanları gerekir. Veri değişince mevcut SEO onayı düşer; uygulama değişiklikleri bağlı makale ve listeleri de yeniden incelemeye gönderir, içerikleri silmez. Sadece onayı değiştiren kaydetme ile yeniden onay verilebilir.

Her kaydetme revizyon oluşturur; eski revizyonla yazma 409 döndürür. Revizyon geri alma yeni taslak oluşturur. Gövde alanları metindir; HTML yürütülmez. URL alanları HTTP(S), mağaza adresleri ilgili resmi mağaza alan adlarıyla sınırlıdır. İkonlar yalnız yerel `/icons/` yolundadır.

## API

- `GET /api/admin/session`: `{ authenticated, configured }`
- `POST /api/admin/login`: `{ password }`; `POST /api/admin/logout`
- `GET /api/admin`: `{ records, feedback, audit }`
- `POST /api/admin/records`: `{ kind, data, status, revision?, seoApproved, publishAt, reviewNote }` → `{ record }`
- `GET /api/admin/history?kind=app&id=...`: `{ revisions }`
- `POST /api/admin/restore`: `{ kind, id, revision }` → `{ record }`
- `GET /api/admin/backup`: sürümlü JSON; kimlik doğrulama sırları içermez.
- `POST /api/admin/restore-backup`: `{ backup, dryRun? }`; önizleme `{ valid, count }`, uygulama `{ restored }`.
- `POST /api/admin/import`: `{ records, dryRun }` → `{ valid, errors, records, imported }`; en çok 100 kayıt, yinelenen kimlik reddi, yalnız taslak, hatalı grup bütünüyle yazılmaz.
- `POST /api/feedback`: `{ appId, field, message, website? }`; `website` boş kalması gereken bot tuzağıdır.
- `POST /api/admin/feedback`: `{ id, status }` (`open`, `resolved`, `dismissed`).
- `POST /api/admin/apple`: `{ id, country }`; yalnız sayısal kimlik ve iki harfli ülke ile Apple Lookup kaynağından aday metaveri döner. Ağ zaman aşımı, gövde sınırı ve sabit alan adı uygulanır. Aday tam kayıt değildir, otomatik kaydedilmez/yayımlanmaz. Google/Windows verisi üretilmez.

Yedek geri yükleme kayıtları, revizyonları ve geri bildirimleri doğruladıktan sonra tek işlemde değiştirir; mevcut yönetici, oturumlar ve denetim günlüğü korunur. Yedek hassas geri bildirim metinleri içerebilir. Bu yönetim paneli tek yönetici içindir; çok kullanıcılı rol ve yetki yönetimi içermez.

## Site görünümü ve kabul profilleri

- `GET /api/admin/settings` ve `POST /api/admin/settings`: `{ theme, enabledPlugins, revision }`; doğrulanan JSON tema, bilinen yerel modüller ve iyimser revizyon kontrolü. Açık etkinleştirme olmadan taslak kaydedilmez.
- `GET /api/admin/admission`: `{ rules, preview }`; `POST /api/admin/admission`: `{ rules, dryRun }`. Android `downloadsLowerBound`, iOS/Windows `ratingCount` kullanır. Ülke ve resmî mağaza kaynakları eşleşmelidir. Kapalı profil bir kaydı dolaylı yoldan kabul ettirmez.
- `admissionException` alanı en az 20 karakterlik editör gerekçesiyle kabul istisnası sağlar; normal eşik geçişi olarak gösterilmez.
- Aktif kuralları sağlamayan yayın kayıtları public katalogdan çıkarılır; veri/revizyonlar silinmez. Önizleme bütün yönetim kayıtlarını değerlendirir, dolayısıyla taslaklar da toplamda bulunabilir.
- Yedek; bütün geri bildirimleri (yönetim listesinin ilk 500 sınırından bağımsız), içerik/revizyonları, site görünümünü ve kabul kurallarını içerir. Geri yüklemede ayar revizyonları ilerletilir; oturum sırları değiştirilmez.

Giriş sınırlaması art arda başarısız denemeler içindir; doğru parola ile başarılı girişten sonra sayaç temizlenir. Yerelde Origin doğrulaması yalnız loopback Host değerlerini kabul eder. Kamuya açık kullanımda `APP_ORIGIN` veya `SITE_URL` açıkça tanımlanır. Kamuya açık alan adından farklı Origin reddedilir.

## Mağaza kimliği ve kaynak bakımı

Uygulamalar isteğe bağlı `storeIds` dizisi taşır: `platform`, `storeId`, `country`, `sourceUrl`, `checkedAt`. Resmî ürün URL’si kimlikle, URL’de ülke varsa ülkeyle eşleşmelidir. Aynı platform/ülke/kimlik farklı etkin ailelere atanamaz; kaydetme, toplu içe aktarma ve yedek geri yüklemede atomik kontrol uygulanır. Eski kayıtlarda bu alanın olmaması geçerlidir. URL’den kimlik doldurma kontrol tarihini kendiliğinden işaretlemez.

- `GET /api/admin/refresh`: aday geçmişi, alan bazlı güncellik ve sağlayıcı kapsamı.
- `POST /api/admin/refresh`: `{ action: "fetch", appId, country, platform: "ios" }` yalnız kaynak adayı üretir. `preview` aynı işlemin desteklenen eş adıdır.
- `{ action: "apply" | "dismiss", id }`: sunucuda saklanan bekleyen adayı açıkça uygular veya reddeder. POST yanıtı doğrudan `RefreshCandidate` nesnesidir.

Apple Lookup sabit alan adı, 8 saniye zaman sınırı, 2 MB gövde sınırı ve yerel istek kotasıyla çağrılır. Yalnız mağaza kimliği/bağlantısı ve gözlemleri uygulanabilir; editoryal açıklama, plan, özellik ve uygulamanın genel kontrol tarihi değiştirilmez. Mevcut yayın durumu korunur; veri değişince SEO onayı düşer. Katalog revizyonu değiştiyse aday 409 ile reddedilir. Apple indirme sayısı üretilmez; Google/Windows otomatik yenileme yerine elle kaynak incelemesi kullanır.

Kaynak kuyruğu/geçmişi en fazla 500 kayıt tutar. Yedek uygulanmış mağaza verilerini içerir; geçici yenileme kuyruğu ve geçmişi yedeğe dahil değildir. Geri yükleme bu kuyruğu aynı işlemde temizler; panel bunu uygulamadan önce açıklar. Eski adayların geri yüklenen kataloğa yanlışlıkla uygulanması engellenir.
