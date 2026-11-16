# 10 ajanlı tamamlama turu — 0.3.0 teslimi

Kullanıcının 15 Kasım 2026 tarihli hızlandırma isteğiyle çalışma 10 ayrı ajana bölündü. Aynı anda üç alt ajan çalışabilir; bağımlılıklar tamamlandıkça sonraki görev başlatılır. Geliştirme GPT-6 Astra, rutin kaynak ve görsel inceleme GPT-5.6 Luna ile yapılır. Birleştirme ve bütünleşik doğrulama ana ajana aittir.

| # | Sorumluluk | Teslim koşulu |
| --- | --- | --- |
| 1 | Dört tema için şablon motoru | Gece Rotaları korunur; Kobalt Atlas, İş Akışı Haritası ve Canlı Katalog farklı ana sayfa düzenleriyle çalışır |
| 2 | Mağaza kimlikleri | Kaynak URL/ülke/kimlik doğrulaması; mükerrer aile eşleştirmesi reddedilir; eski veri korunur |
| 3 | Sağlayıcı kaynak incelemesi | Üç mağaza için resmî kaynaklar, erişim sınırları ve uygulanabilir veri akışı açıkça belgelenir |
| 4 | Tema galerisi | Kişisel seçim ve site geneli taslak/etkinleştirme ayrılır; içe/dışa aktarma korunur |
| 5 | Kaynak yenileme servisi | Kaynaklı aday değişiklik, fark inceleme ve açık editör kabulü; kendiliğinden yayın yok |
| 6 | Yönetimde veri bakım akışı | Kimlik düzenleme, güncellik ve yenileme sonucunu inceleme gerçek servisle çalışır |
| 7 | Yayıncı keşfi | Katalogdan türetilmiş yayıncı dizini/sayfaları, uygulama bağlantıları ve kontrollü SEO |
| 8 | Yerel dağıtım paketi | Kalıcı disk, ortam ayarları, sağlık kontrolü ve tekrarlanabilir çalıştırma; yayın yapılmaz |
| 9 | Bütünleşik testler | Yeni akışların gerçek tarayıcı testleri; mevcut işlevlerin korunması |
| 10 | Son görsel kontrol | Seçilen temaların masaüstü/mobil kontrolü ve somut kusurların giderilmesi |

Bu turdaki 10 görev tamamlandı ve ana ajan tarafından birleştirildi. 41 birim testi, 24 tarayıcı senaryosu, üretim derlemesi, yerel Docker çalışması ve 13 ekranın görsel kontrolü doğrulandı. Ayrıntılı kapsam ve kanıt ayrımı [güncel uygulama durumundadır](UYGULAMA_DURUMU.md). Üç mağazanın toplu veri pilotu, üretim sağlayıcı erişimi ve kamuya yayın bu turun tamamlanmasıyla bitmiş sayılmaz.
