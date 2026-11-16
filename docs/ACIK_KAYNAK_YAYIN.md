# WexaShelf MIT kaynak ve PHP dağıtımı

WexaShelf by Softwexa proje kodu MIT lisanslıdır; kökteki LICENSE hem tam kaynak hem PHP kurulum ZIP'ine eklenir. Bu seçim üçüncü taraf ikon/marka/görsel haklarını devretmez. Kamuya açık depo/yayın veya gerçek cPanel kurulumu bu yerel paket hazırlığıyla yapılmış sayılmaz.

```sh
npm ci
npm run build:php
npm run package:php
npm run package:source
node scripts/test-release-package.mjs
```

Paketleme makinesinde Node.js 24+ ve zip gerekir. PHP hosting tarafında Node/npm/Composer gerekmez. artifacts/releases/ çıktıları:

- wexashelf-php-0.6.0.zip: hazır tarayıcı dosyaları, PHP uygulaması, başlangıç içeriği, lisanslar, kurulum ve katkı belgeleri.
- wexashelf-source-0.6.0.zip: PHP kaynakları ve testleri, ön yüz kaynakları, hazır PHP tarayıcı varlıkları, korunan Next.js hattı ve topluluk geliştirme kılavuzları.
- php-manifest.json / source-manifest.json: dosya boyutları, SHA-256 değerleri ve kapsam.
- dependency-license-inventory.json: bağımlılık lisans metadatası; hukuki uygunluk raporu değildir.

Paketler izinli yolları kullanır; sembolik bağlantılar reddedilir. PHP storage içinden yalnız erişim koruması dosyaları alınır. config.php, kurulum anahtarları, .local, veritabanları, .env (boş örnek dışında), günlükler, yedekler, Git geçmişi, node_modules ve özel planlar dışarıda kalır. Hazır tarayıcı paketinin bağımlılık lisansları ayrıca eklenir. Aynı girdiler ve zip aracı için dosya sırası/zamanları normalize edilir. Bu bir genel sır tarayıcısı değildir; kaynak içine gömülmüş sırlar ayrıca incelenmelidir.

package.json içindeki private:true npm'e yanlışlıkla yayınlamayı engeller; açık kaynak lisansını değiştirmez. Next.js/SQLite geliştirme hattı ana PHP dağıtımıyla karıştırılmamalıdır; eski .local verileri otomatik taşınmaz.

Kamuya dağıtımdan önce THIRD_PARTY_NOTICES.md içindeki varlık izinlerini doğrulayın veya ilgili varlıkları değiştirin. Kaynak ve Git geçmişini sır/kişisel veri açısından ayrı inceleyin. Gerçek depo adresi ve özel güvenlik kanalı belirlendiğinde belgeleri güncelleyin. Temiz kurulum ve hedef hosting kontrollerini tamamlayın. Yerel paket oluşturulması kamuya yayın veya ücretli CI yetkisi değildir.

## 0.6.0 topluluk geliştirme düzeni

Ortak `AGENTS.md`, aynı dosyayı içe alan `CLAUDE.md`, Copilot yönlendirmesi, PR ve dört issue şablonu paketlere eklenir. `documents/` altında özellik kaydı, mimari, test, AI katkı ve GitHub kurulum rehberleri vardır. Katkılar kişinin kendi fork/konu dalında hazırlanır; amaç `dev` dalına PR, bakımcı incelemesi ve ardından `main` sürümüdür. Gerçek depo/dal doğrulanmadan hedef varsayılmaz. GitHub dal koruması ve bakımcı kimliği belgelerden ayrı yapılandırılır; otomatik merge veya Actions workflow eklenmez. Ayrıntılar [CONTRIBUTING.md](../CONTRIBUTING.md) ve [GitHub kurulum rehberinde](../documents/GITHUB-SETUP.md).

Hosting ZIP'inde örnekler ve `.github` dizini doğrudan HTTP erişimine kapalıdır. Bu dizinler yerel geliştirme içindir; React kaynaklarını veya testleri değiştirmek için tam kaynak paketini kullanın. Yalnız kökteki kamuya açık katkı `AGENTS.md` dosyası kaynak paketine alınır; kişisel ajan talimatları ve özel ayarlar dahil edilmez.

## 0.5.0 tarihsel paket kapsamı

AI ve SEO rehberi iki dağıtıma eklenir. AI sağlayıcı ayarları (`ai-settings.json`) ve kilitleri yanlışlıkla kaynak ağacında başka yere konulsa bile paketleyici reddeder. Kullanıcı medyası/işleri/anahtarları paketlenmez. Testler ve yerel test router yalnız kaynak paketindedir; hosting ZIP'i veya Docker çalışma imajına dahil edilmez. Sırlar kaynak metnine gömülmüşse izinli yol kontrolü bunu tek başına yakalamaz.

0.5.0 AI/SEO servis ve kontrollü gerçek PHP tarayıcı kanıtı mevcut; ücretli sağlayıcı/cPanel kanıtı yoktur. 43/43 ortak/Node birim testi, güncel Docker üzerinde 24/24 regresyon ve PHP fixture üzerinde 1/1 AI senaryosu geçti. Kaynak ZIP 229, PHP ZIP 77 arşiv girdisiyle lisans, özel yol dışlama ve SHA-256 kontrollerinden geçti. Arşiv hashleri dağıtım manifestlerindedir. Son Docker durumu [sürüm durumunda](UYGULAMA_DURUMU.md) ayrı kaydedilir. Aşağıdaki 0.4.0 sonuçları tarihseldir.

## 0.4.0 tarihsel yerel doğrulama kaydı

16 Kasım 2026: PHP uygulamasına karşı 24/24 mevcut uçtan uca test, 1/1 kök uygulama smoke testi ve düz ZIP'in Apache altında katalog açılışı testi (1/1) geçti. Kurucunun olumsuz senaryoları ve php/tests/install-http.mjs ile ayrı veritabanında temiz kurulum doğrulandı. Yerel Docker ortamı PHP 8.4.27 / MariaDB 11.8 ile, yeniden başlatma dahil kontrol edildi. Bu sonuçlar gerçek cPanel hesabı, MySQL 8.4 çalışma testi veya kamuya açık dağıtım kanıtı değildir. Kaynak/kurulum ZIP içerikleri ve SHA-256 kayıtları scripts/test-release-package.mjs ile ayrıca denetlenir.
