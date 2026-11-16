# WexaShelf 0.5.0 — AI içerik stüdyosu ve SEO

Bu özellikler ana PHP/MySQL uygulamasının yönetici panelindedir. AI üretimi yalnız oturum açmış yöneticinin açık isteğiyle başlar; ziyaretçinin sayfa açması veya arama yapması üretim başlatmaz. Otomatik içerik yayınlama, zamanlı AI üretimi ve canlı trafik ölçümü yoktur.

## Sağlayıcı kurulumu

Yönetim → AI içerik stüdyosu → Sağlayıcılar ve üretim sınırları bölümünü açın. Boş kurulumda OpenAI şablonu sunulur; API anahtarı içermez. Metin modeli `gpt-5.6-luna`, görsel modeli `gpt-image-2.5-flare` başlangıç değerleridir. Model erişimi ve ücretler kendi sağlayıcı hesabınıza bağlıdır; bu sürümde ücretli gerçek çağrıyla doğrulanmadı. Kendi anahtarınızı yalnız yönetimdeki parola alanına girin; sohbet veya destek kaydına göndermeyin. Ayarları kaydetmeden üretim etkinleşmez.

Birden fazla OpenAI uyumlu sağlayıcı eklenebilir; varsayılan sağlayıcı ve her istekte kullanılacak sağlayıcı seçilebilir. Uyumlu metin uç noktası JSON schema ile yapılandırılmış çıktıyı, görsel uç noktası base64 görsel yanıtını desteklemelidir. “OpenAI uyumlu” etiketi bütün sağlayıcıların test edildiği anlamına gelmez. Sağlayıcı adresini değiştirirken mevcut anahtar otomatik taşınmaz; yeni adres için anahtarı açıkça yeniden girin. Boş anahtar alanı, adres değişmedikçe kayıtlı anahtarı korur; ayrı silme seçimi vardır.

Anahtarlar özel `storage/ai-settings.json` dosyasında tutulur. Tarayıcıya ve katalog JSON yedeğine anahtarlar dönmez. Dosyayı, kilidini, `storage/config.php` ve oturum verilerini yayımlamayın. Hosting kullanıcısının özel depolamaya yazma izni gerekir; herkese açık dosya erişimi kapalı kalmalıdır.

Günlük metin/görsel sınırları UTC günü için üretim sayısıdır. Para bütçesi, fatura tutarı veya kesin maliyet tahmini değildir. Sağlayıcı döndürürse token kullanımı gösterilir; eksik kullanım uydurulmaz. Sağlayıcı ücret ve limitlerini kendi hesabından izleyin.

## Üretim ve editör akışı

| Görev | Öneri ve uygulanacak alan |
| --- | --- |
| Başlık önerileri | Seçilen seçenek; uygulamada kısa açıklama (`tagline`), yazı/listede başlık |
| Açıklama | Uygulamada kısa ve uzun açıklama; yazı/listede özet |
| Yazı taslağı | Başlık, özet ve bölümler; seçilen kaynak uygulamalarının kayıtlı kanıtı korunur |
| SEO | Birlikte seçilen SEO başlığı ve açıklaması |
| Yazı kapağı | Üretilen görsel, alternatif metin ve açıklama |

Mevcut kayıt veya “Yeni yazı” hedefini, dili, tonu ve isteği seçin. Önizlemede başlık seçeneğini/alanları inceleyin. “Seçilenleri taslak forma uygula” yalnız kaydedilmemiş editör formunu değiştirir; veritabanına kayıt veya yayın yapmaz. Uygulama yayın durumunu taslağa çeker, SEO onayını ve zamanlanmış yayın tarihini kaldırır. Formdaki diğer değişiklikler korunur; aynı alanları değiştirmeden önce kaydedilmemiş düzenlemeler için onay gösterilir. Kaydetmek ve daha sonra yayımlamak ayrı editör işlemleridir.

AI metni kaynak doğrulaması değildir. Yeni yazıya bağlı uygulama kimlikleri, kaynaklar ve araştırma yöntemi sunucunun mevcut katalog verisinden hazırlanır; modelin ürettiği kaynak veya “editör tarafından test edildi” iddiası otomatik kabul edilmez. Fiyat, özellik ve mağaza verilerini kayıtlı kaynaklarla karşılaştırın.

OpenAI istekleri arka planda izlenir; panel bekleyen işi sorgular ve geçmişten devam ettirebilir. Bu akış `store:false` ile yaklaşık 10 dakikalık sağlayıcı sonuç saklama penceresine bağlıdır. Belirsiz bir isteği otomatik yeniden göndermez: ikinci ücretli üretim riskini önlemek için durumunu kontrol edin. OpenAI uyumlu çağrılar sınırlı senkrondur: metinde 35, görselde 55 saniye zaman aşımı uygulanır. Paylaşımlı hosting PHP/proxy süresi daha kısa olabilir; cPanel üzerinde bu sınırlar ayrıca doğrulanmalıdır.

## SEO yönetimi

İçerik formunda kayıt bazında SEO başlığı, açıklaması ve `noindex` seçimi bulunur. Global SEO ayarları site adı, başlık son eki, ana sayfa başlığı/açıklaması, Google/Bing doğrulama tokenları ve indeksleme iznini yönetir. Doğrulama alanları yalnız token kabul eder; HTML veya script alanı değildir.

İndeksleme izni ancak geçerli herkese açık HTTPS adresinde etkinleşir. Yerel/HTTP ortamı kapalı kalır. Kayıtların yayın durumu, SEO editör onayı ve `noindex` seçimi ayrıca uygulanır. Panel gerçek `robots.txt` ve `sitemap.xml` bağlantılarını ve mevcut etkin URL sayısını gösterir; alt klasör kurulum yolu korunur.

Kontroller mevcut kayıtların başlık/açıklama eksiklerini ve tekrarlarını, boş/kısa yazı bölümlerini, eksik kaynakları, bulunamayan bağlı uygulamaları ve SEO editör onayını inceler. Uzunluk önerileri yumuşak editör rehberidir; bir SEO puanı veya sıralama şartı değildir. Arama sonucu önizlemesini Google değiştirebilir. Yapılandırılmış veri kayıtların gerçek alanlarından üretilir; AI puanı, trafik garantisi, uydurma değerlendirme veya test iddiası eklenmez.

## Yedek ve taşıma

Katalog JSON yedeği global SEO ayarları ile kayıt SEO/kapak metadatasını içerir. Görsel dosyalarını, AI iş geçmişini ve sağlayıcı anahtarlarını içermez. Kapaklar özel `storage/media` içinde tutulur; herkese açık sunum yayın durumuna bağlı uygulama yolu üzerinden yapılır.

Tam taşıma için MySQL veritabanı ile özel `storage` dizininin birlikte, erişimi korunan yedeğini alın. Yalnız katalog JSON dosyasını taşımak görselleri veya AI sağlayıcı kurulumunu taşımaz. Yeni kurulumda hedef site adresi, özel dosya izinleri ve sağlayıcı erişimini ayrıca doğrulayın. Hosting/kaynak ZIP paketleri çalışma verisi yedeği değildir; anahtar, AI ayarı/kilidi ve kullanıcı medya dosyası içermez.

## 0.5.0 doğrulama sınırı

AI servis/sağlayıcı, SEO ve public SEO testleri ile gerçek PHP uygulamasını kullanan bir kontrollü sağlayıcı tarayıcı senaryosu geçti. Sağlayıcı yanıtları fixture/test verisidir; ücretli OpenAI veya başka ticari sağlayıcı çağrısı yapılmadı. Gerçek cPanel doğrulaması yoktur. TypeScript kontrolü ve 43 ortak/Node birim testi geçti. Güncellenmiş Docker imajında ayrı 3151 ortamında temiz kurulum, korunan yollar, boş AI kurulumu ve SEO→sunucu HTML/noindex kontrolleri geçti. Güncel Docker üzerinde 24/24 tarayıcı regresyonu ve PHP fixture üzerinde 1/1 AI senaryosu geçti. Dört masaüstü/mobil ekran ve 1440/390 piksel taşma kontrolleri sorunsuzdur. Son gizlilik güncellemesi sağlayıcıya yalnız seçilen içerik verisini gönderir; iç inceleme notu, durum ve revizyon metadatası dışarıda kalır. Final ZIP sonucu sürüm durum belgesinde ayrı kaydedilir; önceki 0.4.0 sonuçları 0.5.0 kanıtı yerine kullanılmaz.
