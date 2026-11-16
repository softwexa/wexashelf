# WexaShelf — güncel kaynak: tema koleksiyonu

Önceki altı temaya Porcelain, Ember, Fieldnotes, Signal, Lilac Studio, Tide, Copper Desk, Prism, Index ve Velvet eklendi. Her birinin ayrı ana sayfa kompozisyonu, taşınabilir JSON ayarı ve gerçek tarayıcıdan alınmış `screen.jpg` önizlemesi var. Renk, gezinme, yoğunluk, yazı tipi, genişlik, köşe, kart ve bölüm sırası/görünürlüğü düzenlenebiliyor. Site adı ve logo temadan bağımsız saklanıyor.

[Tema koleksiyonu ve kullanım](THEME-COLLECTION.md) · [Geliştirme sözleşmesi](THEME-DEVELOPMENT.md). Bu ekler yerel kaynak ve derlenmiş PHP arayüzündedir; aşağıdaki eski 0.8.0 arşivlerini veya onların performans ölçümlerini değiştirmez. Yeni bir GitHub sürümü yayımlanmış sayılmaz.

---

# WexaShelf — 0.8.0 dağıtım sürümü

Altı tema, üç işlevsel modül paketi, boş/örnek katalog kurulumu, ayrı yönetim ve sistem durumu, yazı içi görsel/uygulama kısa kodları ve gerçek uygulama ikonu yükleme tamamlandı. Yeni ikonlar en fazla 256 piksel WebP olarak hazırlanır; taslak görseller özel kalır. İngilizce varsayılan ve Türkçe URL/SEO davranışları korunur.

Yerel kontroller: 75 JavaScript testi, TypeScript, 1.871 çeviri anahtarı; PHP/HTTP ve gerçek tarayıcı akışları. **10 durum/20 Lighthouse koşusu: mobil 95–97, masaüstü100.** Sonuç küçük sentetik katalog ve varsayılan modüller içindir; gerçek cPanel, tüm medya/eklenti düzenleri veya Google sıralaması garantisi değildir.

[Güncel doğrulama](RELEASE-0.8.0-VALIDATION.md) · [Dağıtım kabul ölçütleri](DISTRIBUTION-ACCEPTANCE.md) · [Yazı içeriği](ARTICLE-CONTENT.md) · [Kurulum/işletim](INSTALL-OPERATIONS.md). Eski sürüm kayıtları aşağıda tarihsel olarak korunur; bunların hashleri güncel paketi doğrulamaz.

---

# WexaShelf — 0.7.1 düzeltmeleri

Uygulamaların gerçek ikonları geri getirildi. Yönetim ayrı `/admin` belgesi ve arayüzüyle açılır; kurulum `/install` adresindedir. Eski adresler yönlendirilir. Dil bazlı kategori/rehber/iş akışı/etiket slug'ları, dil geçişleri ve uygun sayfalardaki karşılıklı hreflang eşleşmeleri güncellendi. Varsayılan geliştirme komutu ana PHP sürümünü başlatır.

Güncel doğrulama: [0.7.1 raporu](RELEASE-0.7.1-VALIDATION.md). Aşağıdaki 0.7.0 ve önceki kayıtlar tarihseldir; özellikle 0.7.0 harf ikonları ve eski paket/performans hash'leri bu sürümü tanımlamaz.

---

# WexaShelf — 0.7.0 kaynak durumu

16 Kasım 2026. Yeni kaynak kapsamı aşağıdadır; önceki sürüm kayıtları tarihsel olarak korunmuştur. 0.6.0 test/performans/paket hashleri güncel 0.7 kaynaklarını doğrulamaz.

## 0.7 uygulanan ekler ve kanıt sınırı

| Alan | Kaynakta uygulanan davranış |
| --- | --- |
| Yönetim ve dil | İngilizce varsayılan yönetim/kurucu, EN/TR paketleri; yeni kaynak kayıtları İngilizce, eski kayıtlar Türkçe kalır. Arayüz dili kaynak dilinden ayrıdır. |
| Sonradan dil yükleme | Yönetimden önizleme/içe aktarma/etkinleştirme/dışa aktarma; sunucuda yeniden derleme gerekmez. Tam paket korunur, ziyaretçiye gerekli mesajlar gönderilir. |
| Hesap güvenliği | Mevcut parolayla doğrulama, parola değiştirme, MFA/kurtarma kodları, oturum iptali ve yalnız CLI yerel kurtarma. |
| Yedek aktarımı | Özel sıralı parçalar, 100 MiB üst sınır, SHA-256, önizleme, açık geri yükleme ve bellek ön kontrolü; katalog yedeği tam hosting yedeği değildir. |
| AI kuyruğu | Kalıcı işler, bağımsız PHP işçisi, süreli iş kilitleri, belirsiz gönderimde otomatik tekrar yok; açık tekrar/iptal/arşiv ve günlük bütçe korunması. |
| Katalog ölçeği | SQL arama projeksiyonu, ziyaretçi/yönetim sayfalaması, ID ile sınırlı kayıt yükleme. |
| Kaynak sağlayıcıları | Yapılandırılan adaptörler ve ayrı kaynak işçisi; adaylar editör onayı olmadan kayda/yayına dönüşmez. |
| Görsel hakları | Özgün MIT SVG harf ikonları ve gece manzarası; eski izinleri doğrulanmamış dosyaların aday ZIP/imajdan dışlandığı doğrulandı; eski kurulum üzerine yükleme kalan dosyaları ayrıca temizlemelidir. |
| Hosting hazırlığı | İzole MySQL 8.4.13 üzerinde aday Docker/alt dizin ZIP kurulumu, 0.6 yükseltme, güvenlik/parçalı geri yükleme ve boş kuyruk CLI kontrolleri geçti. Gerçek cPanel ve zamanlanmış cron aktivasyonu ayrı. |

**Güncel kaynak kontrolleri:** 59 JavaScript testi geçti. Ardışık 15 PHP grubu geçti: repository, translations, editorial-fields, capabilities, extensions, editor-roles, performance-observations, upgrade, backup-transfer, security, ai-service, ai-provider, ai-grounding, ai-queue, catalog-query. Ayrı odaklı güvenlik/yedek/kuyruk testleri mock ve sentetik veri kullanır; gerçek ücretli sağlayıcı kanıtı değildir.

[50 bin kayıt ölçümü](CATALOG-SCALING.md): yerel sentetik sorgu medyanları 98.65–242.68 ms, ana sayfa snapshot 102,392 bayt, PHP tepe belleği 4 MiB. Bu veritabanı/API ölçümüdür; Lighthouse veya gerçek cPanel garantisi değildir. **0.7 yerel Lighthouse:** dört tema ve önemli sayfaları kapsayan 8 durum/16 koşuda mobil 95–97, masaüstü 100. Bu ayrı, küçük sentetik katalog kohortudur; 50 bin kayıtla Lighthouse ölçümü değildir. [Rapor](PERFORMANCE-AUDIT-REPORT.md).

Ayrı odaklı kaynak/dil testleri de geçti: source-providers (mock), source-locales, installer-locales ve language-pack-runtime. Üç mağaza için ayrıca salt okunur kaynak denemesi kaydedildi; indirme değerleri bilinmeyen kaldı. Bu dar gözlem sürekli kapsama veya ücretli sağlayıcı kanıtı değildir. [Kaynak adaptörleri](STORE-SOURCES.md).

İşletim rehberleri: [hesap güvenliği](ACCOUNT-SECURITY.md), [yedek kurtarma](BACKUP-RECOVERY.md), [AI içerik](AI-CONTENT.md), [cron](CRON-WORKERS.md), [son dağıtım doğrulaması](RELEASE-0.7.0-VALIDATION.md). Gerçek cPanel kurulumu, GitHub yayını ve ücretli sağlayıcı aktivasyonu doğrulanmış sayılmaz.

---

## Tarihsel kayıt: 0.6.0 çoklu dil ve editoryal keşif


16 Kasım 2026. Ana PHP/MySQL sürümünde İngilizce varsayılan ziyaretçi dili, Türkçe desteği ve topluluk dil paketi sözleşmesi tamamlandı. Kaynak kod MIT lisanslıdır; Softwexa tarafından geliştirilir. Bu kayıt yerel uygulama ve doğrulama kapsamını anlatır. Kamuya açık dağıtım, GitHub yayını, gerçek mağaza trafiği veya ücretli AI sağlayıcısı kullanımını doğrulamaz.

## 0.6.0 çalışan kapsam

Topluluk katkıları için ortak `AGENTS.md`, Claude/Copilot yönlendirmeleri, PR/issue şablonları ve [documents dizini](../documents/README.md) hazırlandı. [Katkı rehberi](../CONTRIBUTING.md) fork, ayrı dal, yerel doğrulama ve bakımcı incelemesi akışını tanımlar. Gerçek GitHub deposu ve dal korumaları henüz yapılandırılmış sayılmaz.

| Alan | Davranış ve sınır |
| --- | --- |
| Çoklu dil SEO | Her dil için adres, slug, canonical, karşılıklı hreflang, sitemap ve ana sayfa title/description. İngilizce ziyaretçi varsayılanı mevcut Türkçe kaynak kayıtlarını yeniden yazmaz; eksik/taslak/eski çeviri başka dilde yayımlanmış gibi gösterilmez. |
| Çeviri yönetimi | Alan alan kaynak/çeviri editörü, kaynak sürümü, stale uyarısı, ayrı SEO onayı, yayın/zamanlama, revizyon/geri dönüş ve çakışmada metnin korunması. AI önerisi kaydedilmemiş çeviri taslağına gelir. |
| Topluluk dilleri | UI, statik içerik, PHP sunucu mesajları ve yerelleştirilmiş yol anahtarları için doğrulanan paketler; eksik paket etkinleştirilemez. Yeni dil eklemek içerik çevirilerini kendiliğinden yayımlamaz. |
| Editoryal sayfalar | İhtiyaç/amaç sayfaları, kalıcı karşılaştırmalar, alternatifler, yazar profilleri ve test-lab belgeleri; kaynak, revizyon ve yayın kontrolü. Test yöntemi/ortamı/sonucu yalnız editörün girdiği kanıttır. |
| SEO çalışma alanı | Konu/arama amacı çakışmaları, bağlantısız içerik ve iç bağlantı önerileri, CSV’den Search Console fırsat tablosu, 301/410 URL yaşam döngüsü. Otomatik Google OAuth bağlantısı yok. |
| Kaynaklı karar araçları | Plan kotaları, dosya işlemleri, bölge/cihaz uygunluğu, gizlilik ve uygulamalar arası geçiş gözlemleri; her olgu için kaynak URL/kontrol tarihi, bilinmeyen değerlerin korunması. |
| Mağaza geçmişi | Tarihli ve mağaza kimliğine bağlı gözlemler; metrik/ülke/platform ayrı trendler. Veri yokken dünya sıralaması veya indirme sayısı üretilmez. |
| Kişisel kurulum ve takip | Tarayıcıda koleksiyonlar, görevler, seçilen plan/kişi sayıları, çakışma notları ve para birimi bazında maliyet; açık takip seçimi ve değişim geçmişi. Hesaplar arası bulut eşitleme değildir. |
| Geliştirici önerileri | Kaynaklı düzeltme önerisi inceleme kuyruğuna girer. “İncelendi” işareti uygulama olgularını değiştirmez veya yayın yapmaz. |
| AI görevleri | Açık yönetici isteğiyle başlık/açıklama/yazı/görsel ve kaynaklı özet, iddia, soru-cevap, etki, çeviri taslağı; sağlayıcı ekleme ve tahmini bütçe rezervasyonu. Önizleme, kaydetme, SEO onayı ve yayın ayrı adımlardır. |
| Tema ve modül | Dört şablon, tam ana sayfa önizleme, görünüm revizyonundan geri dönüş; deklaratif topluluk modülü kur/etkinleştir/devre dışı bırak/kaldır. Paket kurulduğunda kapalıdır; çalıştırılabilir PHP/JS yükleme sistemi değildir. |
| Editör yetkileri | Owner/editor/publisher/analyst rolleri; sunucuda eylem kısıtları ve hesap değişikliğinde oturum iptali. |
| Yükseltme | Özel katalog yedeği, SHA-256/kaynak sürümü kontrolü, tekrar güvenli yerel şema uygulaması ve kesilen bakım kapısının açık kurtarılması. PHP dosyası yükleme ve tam hosting geri dönüşü işletmecinin işidir. |
| Performans | İsteğe bağlı örneklenmiş LCP/INP/CLS kaydı ve sınırlı p75 tablosu; hesap/IP/tam URL/sorgu saklamaz. Yerel Lighthouse kapsamı aşağıdadır. |

Tema ve modül geliştirme: [THEME-DEVELOPMENT.md](THEME-DEVELOPMENT.md), [MODULE-DEVELOPMENT.md](MODULE-DEVELOPMENT.md). Çalışan örnekler `examples/community-theme/` ve `examples/community-module/` altındadır. Makine tarafından okunabilir kapsam: `IMPLEMENTATION-0.6.0.json` (tarihsel yerel kayıt; 0.7 paketine dahil değil).

## 0.6.0 doğrulaması

- **56/56 JavaScript testi** geçti; güncel kayıt unit-0.6.0.log (local-only: `artifacts/verification/unit-0.6.0.log`). Eski `unit.log` bu sayının kanıtı değildir.
- **17 PHP test betiği** ve 33 dosyalık PHP sözdizimi kontrolü geçti. Sonraki sorgu/dil yönlendirme düzeltmeleri odaklı kontrolle doğrulandı; ilk 17 betik bütün son değişikliklerden sonra yeniden koşulmuş gibi sunulmaz. Kaynak hash’leri ve ek kontroller php-0.6.0.json (local-only: `artifacts/verification/php-0.6.0.json`) içinde.
- Tarayıcı kapsamı **farklı koşularda toplam 26 ayrı başarılı senaryo**. İlk koşu 23 başarılı/2 başarısızdı; sorgu ve galeri düzeltmelerinden sonra odaklı 3 başarılı, güçlendirilmiş sorgu kontrolünde ayrıca 1 başarılı tekrar var. Bu tek seferde temiz geçen “26/26” koşusu değildir: e2e-0.6.0.json (local-only: `artifacts/verification/e2e-0.6.0.json`).
- Yönetici çeviri/growth, tema-modül, kaynaklı olgu, rol/oturum, AI taslak aktarımı, yükseltme, RUM ve EN/TR ana sayfa metası ayrı test edildi. Kalıcı QA indeksi (local-only: `artifacts/growth-qa/README.md`) 18 dosyalık SHA-256 manifestine bağlanır. Gerçek PHP/MySQL kontrolleri ile sentetik API/AI fixture kontrolleri ayrı belirtilmiştir; ücretli model çağrısı yapılmadı.
- İngilizce/Türkçe ana sayfa, dört etkin tema ve İngilizce uygulama/yazı/liste detaylarında **8 durum × 2 cihaz profili**: mobil **96–98**, masaüstü **100**. Her durumda tek mobil/masaüstü çifti ölçüldü; tekrar medyanı değildir. 65 ölçülen kaynak dosyası güncel dosyalarla eşleşiyor. [Performans raporu](PERFORMANCE-AUDIT-REPORT.md) ham raporlara ve sınırlara bağlanır.
- EN/TR ana sayfa başlık/açıklamaları gerçek formdan kaydedilip title, meta description, Open Graph ve HTML dili üzerinden okundu; özgün ayarlar geri yüklendi. Gerçek RUM LCP çağrısı sunucuya ulaştı; test sonunda toplama kapatıldı. Gerçek ziyaretçi/CrUX sonucu değildir.

## Dağıtım kanıtı ve kullanım sınırları

Docker’da boş izole veritabanına gerçek web kurucusuyla yerel kurulum ve 24 ek HTTP/API kontrolü doğrulandı: fresh-060-docker.json (local-only: `artifacts/verification/fresh-060-docker.json`). Dokuz seçilmiş çalışma dosyası kaynakla eşleşti: Docker kaynak karşılaştırması (local-only: `artifacts/verification/release-060-docker-precheck.json`). Bu, gerçek cPanel/paylaşımlı hosting veya bütün dosyaların dağıtım hash’i değildir.

Kaynak/PHP ZIP hash’leri, kök ve `/catalog` alt klasör kurulumları ile Docker dağıtımının sürüme bağlı kesin sonucu ayrı `artifacts/verification/fresh-install-0.6.0.json` kaydında tutulur. Paket değerlendirmesinde o kaydın doğrulanmış arşiv hash’i esas alınmalıdır; bu özellik raporu tek başına herhangi bir ZIP’i onaylamaz. Kurulum koşulları [KURULUM_CPANEL.md](KURULUM_CPANEL.md) içindedir; “her host” uyumluluğu doğrulanmış değildir.

Canlı Google Search Console OAuth, ticari AI sağlayıcısıyla ücretli üretim, üç mağaza için sürekli veri pilotu, gerçek kullanıcı trafiği ve canlı hosting Core Web Vitals sonucu ayrıca doğrulanmalıdır. AI bütçesi yapılandırılmış fiyatlarla tahmindir; sağlayıcı faturası değildir. Katalog yedeği özel dosya/anahtar/hosting yedeğinin yerine geçmez. Topluluk modülleri deklaratif içerik paketidir; çalıştırılabilir üçüncü taraf kod deposu veya paket imzası doğrulama hizmeti değildir.

---

Aşağıdaki 0.5.1 ve önceki sürümler tarihsel kayıtlardır. Eski test sayıları, imaj hash’leri ve o tarihte açık kalan özellikler 0.6.0’ın güncel kapsamıyla birleştirilmez.

# WexaShelf — 0.5.1 şema ve açılış performansı

16 Kasım 2026. Ana PHP/MySQL hattına yönetici isteğiyle AI üretimi ve SEO yönetimi eklendi. Ayrıntılı kurulum, görev eşlemesi, sağlayıcı sözleşmesi ve yedek sınırları [AI ve SEO rehberinde](AI_VE_SEO.md).

## 0.5.1 kapsamı ve doğrulama

- PHP sunucu HTML’inde bağlı WebSite/WebPage, breadcrumb, SoftwareApplication, BlogPosting ve CollectionPage/ItemList grafikleri. Sahte fiyat/puan veya yayıncı kimliği yok; noindex/onay kuralları korunur.
- Şema birim testleri ve beş gerçek Apache HTTP sayfası kontrolü başarılı. [Şema raporu](SCHEMA-REPORT.md) kapsamı ve sınırları açıklar.
- Ziyaretçi ve yönetim varlıkları ayrıldı. Kurucu ve ZIP denetimi `app.js`, `app.css`, `admin.js`, `admin.css` dosyalarını zorunlu kılar.
- Tüm varlıkların yüklendiği son Lighthouse kohortu: mobil **98 / 96 / 96**, masaüstü **100 / 100 / 100** performans puanı. Ölçülen 27 dosya son kaynakla eşleşti. [Performans raporu](PERFORMANCE-AUDIT-REPORT.md) koşulları ve sınırları açıklar; bunlar saha Core Web Vitals sonucu değildir.
- Son Docker 3153 ortamında **24/24** tarayıcı regresyonu (18,4 sn), **43/43** birim testi, TypeScript ve PHP şema/public SEO/SEO ayarları/editoryal alan kontrolleri geçti. Dört tema testine gerçek `image.decode()` doğrulaması eklendi; tam yönetici ortamıyla odaklı tekrar başarılı (2,6 sn).
- Sekiz tema/viewport DOM profili: gerçek fontlar, taşma olmaması, HTTP 4xx olmaması ve ziyaretçiye yönetim varlığı yüklenmemesi doğrulandı. Kanıt: `artifacts/performance/browser-layout.json`.
- `wexashelf:0.5.1-php` son imajı: `sha256:4e31c351b57de05469a135582ad9dbaa5054d756a9126a63de9e4b5e996af987`. Yeni izole veritabanıyla temiz kurulum geçti; 25 dosya SHA eşleşmesi, 10 ikon + dört JS/CSS + favicon için 15 HTTP 200 kontrolü geçti. Ücretli sağlayıcı çağrısı yok.

0.5.1 ölçüm incelemesinde Apache’nin varsayılan `/icons/` alias’ının katalog ikonlarını başka dizine yönlendirdiği doğrulandı: dosya mevcutken HTTP 404 dönüyordu. İlk performans ölçümü ve görüntü varlığını denetlemeyen 24 senaryolu test bu nedenle eksik görselli çalışma kanıtıdır; son performans veya paket kabulü sayılmaz. Taşınabilir `/assets/icons/` yolu düzeltmesinden sonra bütün ikonlar HTTP 200 ile doğrulandı ve yukarıdaki son ölçümler yeniden alındı.

0.5.1 dağıtım kontrolü: kaynak ZIP 262, PHP hosting ZIP 103 arşiv girdisi içerir. Gerekli dosyalar, ikon eşlemesindeki bütün hedefler, lisanslar, özel dosya dışlamaları ve SHA değerleri doğrulandı. PHP ZIP’i ayrı Apache konteynerinde `/catalog` altına açılarak yeni sentetik veritabanıyla kuruldu; kurulum/oturum/özel yollar, ziyaretçi-yönetim varlık ayrımı ve gerçek tarayıcı `image.decode()` kontrolleri geçti, HTTP 4xx yok. Bu yerel alt klasör kurulum kanıtıdır; gerçek cPanel veya kamuya açık dağıtım değildir.

## 0.5.0 tamamlanan kapsam

- OpenAI varsayılan şablonu, kullanıcıya ait anahtarlarla çoklu OpenAI uyumlu sağlayıcı, UTC üretim sayısı sınırları; ziyaretçi isteğinden üretim yok.
- Başlık, açıklama, yazı, SEO ve kapak üretimi; önce önizleme, sonra seçilen alanları kaydedilmemiş taslağa uygulama. Kaydetme/yayın ayrı editör eylemidir.
- Özel sağlayıcı ayarı ve medya, anahtarların JSON yedeğinden dışlanması, adres değişiminde anahtarın yeniden açıkça girilmesi.
- Kayıt SEO başlığı/açıklaması/noindex; global site/ana sayfa/son ek/doğrulama/indeksleme; mevcut kayıtlara dayanan kaynak kontrolleri. Sahte SEO skoru, trafik veya indekslenme garantisi yok.

## 0.5.0 doğrulama kaydı

- TypeScript kontrolü ve 43/43 ortak/Node birim testi başarılı.
- PHP sağlayıcı/içerik, AI servis, SEO ayarları, public SEO ve repository kontrolleri başarılı; global SEO yedek/geri yükleme turu dahil.
- Gerçek PHP uygulamasında kontrollü sağlayıcı yanıtlarıyla 1 tarayıcı senaryosu başarılı. Bu fixture kanıtıdır; ücretli ticari sağlayıcı çağrısı değildir.
- Ücretli sağlayıcı çağrısı: **0**. Gerçek cPanel doğrulaması: **yok**.
- `wexashelf:0.5.0-php` Docker imajı derlendi. Ayrı 3151 ortamında temiz kurulum, kurucu ret/tekrar kurulum, oturum ve özel yollar testleri başarılı. AI paneli yapılandırılmamış ve iş geçmişi boş; SEO kaydı sunucu HTML çıktısına yansıdı ve yerel noindex korundu. Bu kontroller sağlayıcı çağrısı üretmedi.
- Güncel Docker 3151 üzerinde 24/24 mevcut tarayıcı regresyonu geçti (24,3 saniye). AI akışı gerçek PHP fixture 3150 üzerinde 1/1 geçti (6 saniye); ücretli sağlayıcı kullanılmadı.
- Dört AI/SEO masaüstü/mobil ekranı Luna incelemesinden sorunsuz geçti. DOM belge genişliği 1440/390 piksel viewport ile aynı; tarayıcı hatası yok.
- Yeni editoryal alanların Unicode sınırları Node/PHP arasında hizalandı ve PHP editoryal alan testleri geçti. Sağlayıcı istemi yalnız seçilen içerik verisini taşır; iç inceleme notu, yayın durumu ve revizyon metadatası gönderilmez.
- 0.5.0 kaynak ZIP’i 229, PHP hosting ZIP’i 77 arşiv girdisi içerir. `scripts/test-release-package.mjs` gerekli dosyaları, MIT/bağımlılık lisanslarını, özel yol dışlamalarını ve tüm dosya hashlerini doğruladı. Arşiv SHA-256 değerleri dağıtım dizinindeki manifestlerde tutulur.
- Son gizlilik değişikliğini içeren Docker imajı doğrulandı: `sha256:04b89d0714663dd490fc9e74ca30c1981b4ee88dd25a00b260d2c3ae372db51e`. İmaj ile yerel AIContent, AIService, Validation, app.js, LICENSE, üçüncü taraf bildirimleri ve beş bağımlılık lisansının SHA değerleri eşleşti. Yalnız 3151 QA web/veritabanı konteynerleri kaldırıldı.

---

# WexaShelf — 0.4.0 PHP/MySQL tarihsel sürüm

16 Kasım 2026. WexaShelf, Softwexa tarafından geliştirilen MIT lisanslı proje kodudur. Ana çalışma ortamı PHP 8.3+ ve MySQL/MariaDB oldu. Dört tema ve mevcut ürün davranışları ortak React kaynaklarından derlenir; hosting üzerinde Node.js, npm veya Composer gerekmez. Eski Next/SQLite hattı referans olarak korunur; `.local` verisine dokunulmadı ve otomatik taşıma yapılmaz.

## Bu sürümde tamamlananlar

- PHP yönlendirme, sunucuda okunabilir katalog/içerik/metadata, MySQL kayıtları ve revizyonlar, yönetici oturumları, kabul kuralları, yedek/içe aktarma, geri bildirim ve kaynak yenileme akışı.
- Kurulum anahtarı, CSRF ve origin doğrulaması; boş veritabanına ilk kurulum, özel yapılandırma ve kalıcı tekrar kurulum kilidi.
- Apache kök/alt klasör yolları, API/arama formları, yerel font/ikon/görseller; PHP ZIP ve Apache/MariaDB Docker dağıtımı.
- MIT LICENSE ve paketlerde bağımlılık lisansları. Softwexa marka bağlantısı `nofollow`; özel yapılandırmada `site.show_credit=false` ile görünür alt bilgi kaldırılabilir.

## 0.4.0 tarihsel doğrulama

- TypeScript kontrolü ve 41/41 ortak/Node birim testi başarılı. Bu testler tek başına PHP backend kanıtı değildir.
- PHP backend üzerinde mevcut 24/24 Chromium senaryosu ve kök kurulum smoke testi başarılı.
- Gerçek ZIP, Apache üzerinde `/catalog` alt klasörüne açıldı; ayrı MariaDB veritabanına kurulum ve ayrıca alt klasör Chromium senaryosu başarılı. Arama formu, API, ikonlar, filtre geri tuşu, tema indirme ve giriş/çıkış doğrulandı.
- `php/tests/install-http.mjs`: yanlış anahtar/CSRF/origin, zayıf parola, yanlış site yolu ve geçersiz DB sunucusu reddedildi; temiz kurulum 303, tekrar kurulum 409, özel yollar engelli, çerez yolu alt klasörle uyumlu.
- PHP 8.4.27 Apache / MariaDB 11.8 Docker kurulumu, sağlık, kimlik doğrulama, özel dosyaların engellenmesi ve yeniden başlatma sonrası veri kalıcılığı başarılı. MySQL 8.4 ve gerçek cPanel/LiteSpeed üzerinde çalışma ayrıca doğrulanmadı.
- Dört temanın sekiz masaüstü/mobil görüntüsü incelendi. Canlı Katalog mobil kartları kaydırılabilir raflardır; 390 px görünümde belge genişliği 390 px, sayfa taşması yoktur.
- 17 PHP kaynak dosyası sözdizimi kontrolünden geçti. ZIP dosyalarının manifest hashleri, MIT/bağımlılık lisansları ve özel dosya dışlamaları denetlendi. Parola, kurulum anahtarı, config.php, SQLite verisi ve oturumlar paketlerde yoktur.
- Alt bilgi kredisini kapatma gerçek PHP tarayıcı sayfasında doğrulandı.

GitHub yayını, gerçek hosting dağıtımı ve bütün üçüncü taraf görsellerin yeniden dağıtım izinleri bu kontrollerin kapsamında değildir. Kurulum için `KURULUM_CPANEL.md`, lisans ayrımı için `THIRD_PARTY_NOTICES.md` esas alınır. Aşağıdaki 0.3.0 bölümü tarihsel Node/SQLite kanıtıdır.

---

# Yönetilebilir yerel sürüm — 0.3.0

15 Kasım 2026. GPT-6 Astra ile geliştirildi; kaynak araştırması ve görsel kontrol görevlerinde kullanıcı tarafından izin verilen GPT-5.6 Luna kullanıldı. Gece Rotaları varsayılandır; Kobalt Atlas, İş Akışı Haritası ve Canlı Katalog ayrı şablonlar olarak seçilebilir. Çalışma yereldir; commit, push, dağıtım veya mağazada yayın yapılmadı.

## Tamamlanan çalışma kapsamı

| Alan | Çalışan davranış |
| --- | --- |
| Kalıcı veri | SQLite; başlangıç verisi bir kez eklenir, editörün sonraki değişiklikleri korunur |
| Katalog | 10 uygulama, kaynak/kontrol tarihi, platformlar, etiketler, takma adlar, yayıncı, plan ve özellik kayıtları |
| Kabul kuralları | Ülke bazlı Android indirme alt sınırı ve iOS/Windows değerlendirme sayısı; önce etki önizlemesi, sonra açık etkinleştirme; gerekçeli editör istisnası |
| Keşif | Türkçe arama, yazım önerisi, kategori/etiket/fiyat/negatif fiyat/indirme filtresi, çoklu platformda herhangi biri/tümü; URL, yenileme ve geri tuşuyla korunan filtreler |
| Detay | Resmî bağlantılar, platforma ait kaynaklı özellik matrisi, plan limitleri, mağaza gözlemleri, kabul gerekçesi, alternatifler ve düzeltme formu |
| Karşılaştırma | En fazla dört uygulama, bağlantıda korunan seçim, yalnız farklar, bilinmeyen alanların ayrı gösterimi |
| Kişisel alan | Kaydetme, ad/not/uygulamalar içeren özel koleksiyonlar, JSON dışa aktarma, açık silme onayı; geçici olarak görünmeyen uygulamaların kayıtları korunur |
| Seçim aracı | Amaç, cihazlar ve zorunlu özellikler; eşleşme/araştırılacak aday/elenme nedenleri; bilinmeyen zorunlu koşul tam eşleşme değildir |
| Maliyet aracı | Bilinen plan fiyatlarıyla 12/36 ay, kişi sayısı, aylık/yıllık faturalama; eksik fiyat kesin toplam üretmez; kur/gelecek zam/vergi varsayımları belirtilir |
| İçerik | Dört kaynak araştırması yazısı, üç tarihli/kalıcı editör listesi, üç kısa rehber ve üç örnek iş akışı; yöntem/kaynak/yazar bilgileri |
| Yönetim | Tek yönetici oturumu, uygulama/yazı/liste formları; taslak/inceleme/zamanlama/yayın/arşiv; revizyon ve eski sürüme dönüş; çakışmada form korunur |
| İşletim | Düzeltme kuyruğu, denetim kaydı, JSON içe aktarma önizlemesi, bütünlüklü yedek ve atomik geri yükleme |
| Mağaza kimliği | Ülke/platform/mağaza kimliği, ürün URL eşleşmesi, tarih doğrulama ve etkin aileler arasında mükerrer kimlik reddi; eski kayıtlar korunur |
| Kaynak bakımı | Alan bazlı güncellik, Apple gözlem adayı ve önce/sonra farkı; açık uygulama veya reddetme; katalog revizyonu değişmişse 409; editoryal metin ve genel kontrol tarihi değiştirilmez |
| Yayıncı keşfi | Yayıncı dizini, arama, detaydan uygulamaya gezinme; şirket sahipliği iddiası yok, noindex |
| Kaynak adayı | Apple kimliği ve ülkeyle resmî Lookup kaynağından metaveri; panelde salt okunur önizleme ve JSON indirme; otomatik kayıt/yayın yok |
| Tema/eklenti | Dört ayrı ana sayfa şablonu, kişisel/yönetim galerisi; site genelinde kalıcı JSON tema ve üç yerel modül; taslak önizleme ve açık etkinleştirme; kişisel tercihler site varsayılanından ayrı |
| SEO temeli | Sunucu metası/canonical, JSON-LD, sosyal önizleme, robots/sitemap; alan adı ve indeksleme anahtarı ile kayıt bazlı onay; özel/arama/filtre sayfaları indekslenmez |
| Kullanım | Mobil/masaüstü, klavye odağı, menü odak yönetimi, boş durumlar, azaltılmış hareket ve güvenlik başlıkları |

Başlangıçta bütün kabul profilleri kapalıdır; bu durum “eşiği geçti” şeklinde sunulmaz. Gerçek kaynaklı indirme/değerlendirme gözlemleri girilmeden yüksek eşik açmak kayıtları görünmez yapabilir; yönetim önizlemesi bunu gösterir. Uygulama kayıtları silinmez. Aynı ailede etkin mağaza profillerinden en az birinin eşik koşulunu sağlaması yeterlidir; kapalı profiller bilinmeyen veriyi geçerli kılmaz.

## Veri ve kanıt

- 10 uygulama; yerel platform desteği Windows 9, Android 9, iOS 8. Bu, her ürünün üç mağazada doğrulanmış kimliği olduğu iddiası değildir.
- 17 platforma ait kaynaklı özellik kaydı ve üç doğrulanmış ücretsiz plan. Diğer özellik/fiyat alanları bilinmiyor olarak kalır.
- `docs/editorial-seed.json` başlangıç içeriğidir; kaynaklar `docs/EDITORIAL_KAYNAKLAR.md` içindedir. Uygulamalı ürün testi yapılmış gibi gösterilmez.
- Apple aday uç noktası gerçek kaynakta `1232780281`, `TR` için 200 yanıtıyla Notion metaverisi döndürdü. Öncesi/sonrası katalog kayıt sayısı aynı kaldı. Bu tek çağrı; sürekli sağlayıcı erişimi veya üç mağaza veri pilotu kanıtı değildir.
- Başlangıç kaynaklarını değiştirmek çalışan veritabanındaki editör kayıtlarını ezmez. Güncellemeler yönetim akışıyla yapılır.

## Sayfalar

`/`, `/kesfet`, `/uygulama/{id}`, `/karsilastir`, `/kaydedilenler`, `/kategoriler`, `/kategori/{id}`, `/etiket/{etiket}`, `/blog`, `/blog/{id}`, `/listeler`, `/liste/{id}`, `/secim-sihirbazi`, `/maliyet-hesapla`, `/rehberler`, `/gecis-rehberleri`, `/rehber/{id}`, `/is-akislari`, `/is-akisi/{id}`, `/ucretsiz-planlar`, `/platform-farklari`, `/ayarlar`, `/yontem`, `/hakkimizda`, `/gizlilik`, `/duzeltme-politikasi`, `/yonetim`, `/yayincilar`, `/yayinci/{slug}`, `/api/health`.

## 0.3.0 doğrulaması — 10 ajanlı tur

- **41/41 birim testi**, **24/24 Chromium senaryosu** başarılı; atlanan senaryo yok. TypeScript ve üretim derlemesi başarılı. Yeni senaryolar dört tema, kişisel kayıtların korunması, global tema taslağı/etkinleştirme, mağaza kimliği çakışmaları, kaynak bakım paneli ve yayıncı gezinmesini kapsar.
- Kaynak yenileme servisinin testleri sahte sağlayıcı yanıtı ve ayrı geçici SQLite ile çalışır. Tarayıcıdaki yenileme yanıtı da kontrollü test yanıtıdır; kimlik doğrulama ve kimlik kaydı işlemleri gerçek izole API ile sınanır. Ayrıca yeniden düzenlenen Apple sağlayıcısı gerçek Lookup kaynağından Notion/TR için isim, puan ve değerlendirme sayısı döndürdü; indirme sayısı üretilmedi.
- Dört uygulanmış temanın masaüstü/mobil ekranları, mobil tema galerisi, yayıncı dizini/detayı, kaynak bakım paneli ve kimlik formu: **13 ekran** görsel incelemeden geçti. Dört temada mobil belge genişliği 390 px viewport içinde kaldı; sayfa hatası gözlenmedi. Kanıtlar `artifacts/v03/screens/` altında.
- Yerel Docker imajı derlendi. Ayrı test volume’unda yönetici oluşturma/giriş, 1000 UID ile çalışma, 0600 parola dosyası, sağlık/metadata/401/404 kontrolleri doğrulandı. Bir test taslağı ve yönetici girişi konteyner yeniden başlatıldıktan sonra korundu. Bu yerel konteyner kanıtıdır; kamuya dağıtım değildir.
- Üretim derlemesinin 24 izleme manifestinde yerel parola, veritabanı veya görsel kanıt referansı bulunmadı. Test/derleme günlükleri `artifacts/v03/verification/` altında, Git dışındadır.

Görev dağılımı: 10 ajanlı teslim planı (historical maintainer note; not included in release ZIPs). Paket kurulumu: [yerel dağıtım rehberi](YEREL_DAGITIM.md).

## Önceki 0.2.0 doğrulaması — 15 Kasım 2026

- `npm test`: **28/28** başarılı. Arama, filtre, seçim/maliyet, tema doğrulaması, kabul kuralları, kalıcı veri/revizyon/geri yükleme, oturum sınırları ve SEO davranışları kapsanır.
- `npm run typecheck`: başarılı.
- Playwright Chromium: **19/19** senaryo başarılı. Ziyaretçi ve yönetim akışları ayrı geçici SQLite dizininde çalıştırıldı; gerçek kullanıcı kataloğunda test kaydı yayımlanmadı.
- `npm run build`: başarılı; derleme günlüğünde uyarı/hata yok. 22 sunucu dosya izleme manifestinde parola, yerel veritabanı veya görsel kanıt dosyası referansı bulunmadı.
- Derlenmiş sunucu ayrı geçici veri dizini ve 3143 portunda açıldı: ana sayfa, blog, uygulama detayı, yönetim giriş sayfası ve sosyal görsel 200; oturumsuz yönetim API’si 401; bilinmeyen sayfa 404. Varsayılan robots bütün taramayı kapatıyor, sitemap boş, ana sayfa noindex ve güvenlik başlıkları mevcut.
- Masaüstü/mobil görsel kontrolde bulunan mobil sekme taşması ve küçük seçim kutusu hedefi düzeltildi. Yüklenmiş tema/kabul panelleri dahil son kontrol başarılı; zorunlu görsel düzeltme kalmadı. Ekranlar `artifacts/mvp/`, test günlükleri `artifacts/verification/` altında ve Git dışında tutulur.

Bu sonuçlar yerel kaynak ve çalışma kanıtıdır. Gerçek kullanıcı trafiği, mağaza sağlayıcısının sürekli erişimi, üretim sunucusu veya saha Core Web Vitals sonucu değildir.

## Teknik sınırlar ve sonraki işler

Bu teslim, yönetilebilir yerel ürün kapsamıdır. İlk ürün planındaki bütün P0/P1/P2 gereksinimlerinin tamamlandığı anlamına gelmez. Özellikle aşağıdakiler ayrıca kalır:

1. Üç mağazadan 30'ar kayıtlık veri pilotu, izin/kota koşulları ve sürekli yenileme işleri; Google/Windows sağlayıcı bağlantıları. Şimdiki giriş editör/JSON; Apple için ayrıca aday metaveri ve kontrollü mağaza gözlemi yenilemesi vardır.
2. Gerçek mağaza sıralama geçmişi ve ölçüme dayalı haftalık/aylık trend. Mevcut listeler açıkça editoryaldir; indirme veya tüm zamanların popülerliği iddiası yoktur.
3. Uygulama ailesi birleştirme/ayırma, mağaza kimliklerinden otomatik aile önerileri, çok kullanıcılı roller, kullanıcı hesabı/eşitleme, bildirimler ve topluluk moderasyonu.
4. Ücretli plan/yenileme/kota kapsamının genişletilmesi, miktara göre otomatik plan seçimi, gerçek cihaz/sürümle geçiş testleri ve daha ayrıntılı iş akışı maliyeti.
5. Çalıştırılabilir haricî eklenti mağazası ve bağımsız paket imzalama/uyumluluk sistemi. Dört yerel tema ve üç güvenilir modül tamamlanmıştır.
6. Kamuya açık yayın için gerçek alan adı, barındırma/kalıcı disk, işletmeci/gizlilik bilgileri, editoryal son onaylar, sağlayıcı ve performans kontrolleri. Arama sırası veya trafik sonucu doğrulanmadı.

Kurulum ve oturum ayrıntıları: [Veri ve yönetim](VERI_VE_YONETIM.md). Tema sözleşmesi: [Tema/eklenti rehberi](TEMA_VE_EKLENTI_REHBERI.md).
