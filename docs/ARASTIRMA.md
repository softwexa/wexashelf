# Uygulama keşif platformu araştırması

Araştırma tarihi: 15 Kasım 2026.

Bu ilk tur dokuz ürün/editoryal örneği ve beş GitHub deposunu kapsar. [İkinci tur](seo/COMPETITOR-ANALYSIS.md) dokuz ek örnek ve üç repo ekler: toplam 18 ürün/editoryal örnek ve sekiz repo. Ürün önerileri [genişleme planında](URUN_GENISLEME_PLANI.md) birleştirildi.

En güçlü ürün fırsatı, üç mağazanın uygulamalarını ortak bir ihtiyaç sözlüğünde buluşturmak ve karar vermeyi kolaylaştırmaktır. Katalog büyüklüğünden önce özelliklerin doğruluğu, fiyat modelinin anlaşılması ve karşılaştırma kalitesi gelmelidir.

## Aktif ürünlerden öğrenilenler

Aşağıdaki özellikler erişilebilen kamuya açık sayfalardan veya ürünün kendi mağaza açıklamasından gözlenmiştir. Hesap açılarak ücretli özellik sınaması yapılmamıştır. Son sütun bizim ürün önerimizdir; rakiplerde bu özelliğin bulunmadığı iddiası değildir.

| Ürün | Gözlenen yaklaşım | Bizim ürüne katkısı |
|---|---|---|
| [AlternativeTo](https://alternativeto.net/faq/) | Alternatif önerme, platform/lisans/etiket bilgileri, kullanıcı düzeltmeleri, moderasyon ve resmi indirme bağlantıları. | Her uygulamaya gerekçeli alternatifler; kullanıcıdan gelen değişiklikleri inceleme kuyruğu; resmi mağazaya yönlendirme. |
| [AppAgg](https://appagg.com/top/?hl=en) | Android, iOS, Windows dahil çoklu platform; top, yeni, fırsatlar, ücretsiz/ücretli listeler; fiyat ve uygulama içi satın alma filtreleri; karşılaştırma ve yer imleri. | Çoklu mağaza kapsamını tek ürün deneyiminde toplamak; karşılaştırmayı ana akışa almak. |
| [AppBrain](https://www.appbrain.com/stats/google-play-rankings/top_free) | Günlük yenilenen ülke bazlı Google Play listeleri; sıra, puan, kurulum ve yakın dönem göstergeleri; ayrı analiz araçları. | Ülke, tarih, kategori ve liste türünü her sıralamada açık göstermek. Sağlayıcı sayısını resmi mağaza ölçümü gibi sunmamak. |
| [AppRaven](https://apps.apple.com/us/app/appraven-apps-gone-free/id1490607195) | Ürün açıklamasında kullanıcı koleksiyonları, istek listesi, indirim bildirimleri, fiyat/güncelleme geçmişi, geliştirici takibi ve yorumlar bulunuyor. | Kullanıcının geri gelmesini sağlayan kaydetme, takip ve fiyat alarmı. Bunlar katalog doğruluğundan sonraki büyüme aşamasına alınmalı. |
| [Product Hunt](https://www.producthunt.com/leaderboard) | Tarih seçilebilen lansman arşivi, topluluk keşfi, kategoriler ve bülten. | Haftanın/ayın seçkisini kalıcı arşive dönüştürmek; yeni çıkan uygulamaları yerleşik popüler uygulamalardan ayrı değerlendirmek. |
| [OpenAlternative](https://openalternative.co/) | Alternatif, kategori ve lisans keşfi; etiketler, yeni/trend koleksiyonları, blog; kartlarda lisans ve son geliştirme bilgileri. | Açık kaynak ve bakım durumunu keşif boyutu yapmak; aynı ürünün alternatif ilişkilerini içerikle birleştirmek. |
| [AppGoblin](https://appgoblin.info/) | Mağaza sıralamaları, büyüme ve yeni uygulama keşfi; API/dataset belgeleri, blog ve SDK analizi. | Veri güncelliği ve zaman serisi yaklaşımı. İleri SDK analizini ilk tüketici ürününün kapsamına eklememek. |
| [MiniReview](https://apps.apple.com/br/app/minireview-game-reviews/id6477473021) | Resmi mağaza açıklamasında çok boyutlu filtreleme, benzer oyun keşfi, editoryal listeler ve bildirimler; sürüm notlarında etiket dışlama ve paylaşılan koleksiyonlar. | Kullanıcının istemediği özellikleri dışlayabilmesi; kategoriye özgü özellik sözlüğü ve editoryal bağlam. |
| [Zapier App picks](https://zapier.com/blog/categories/app-picks/) | Uygulama karşılaştırmaları, en iyi uygulamalar rehberleri ve tekil uygulama içerikleri. | Blog türlerini katalogdaki ürünlerle ilişkilendirmek; rehber ve karşılaştırma için farklı şablonlar. |

AppSliced adresi araştırma sırasında AppRaven'a yönlendi; bağımsız rakip olarak sayılmadı. MiniReview ana sayfası metin erişiminde sınırlıydı; özellikleri resmi App Store açıklaması ve sürüm geçmişiyle doğrulandı. AppAdvice sayfasına erişim başarısız oldu; aktif özellikleri hakkında sonuç çıkarılmadı.

AlternativeTo'nun Eylül 2026 duyurusu etiketle gizleme, tek tıkla kaydetme ve kişisel liste iyileştirmelerini açıklıyor; tercih edilen filtrelerin varsayılan kaydedilmesinden de söz ediyor. Bu duyuru, kalıcı arama tercihlerini ürün planına almak için yararlı; oturum açılarak özellik sınaması yapılmadı. [AlternativeTo ürün duyurusu](https://alternativeto.net/news/2026/9/alternativeto-september-recap-new-badges-hide-apps-by-tag-revamped-lists-and-more/)

Zapier'in üretkenlik rehberi değerlendirme/test yöntemini, seçim kriterlerini ve uygulamaların farklı kullanım amaçlarını açıklıyor. Buradan alınacak fikir, yalnız uygulama adı sıralamak yerine aynı içerikte fiyat modeli, uygun kullanım ve sınırlamaları cevaplamak. [Zapier değerlendirme örneği](https://zapier.com/blog/best-productivity-apps/)

## GitHub projeleri ve gerçek kullanım sınırları

Bu inceleme README, lisans gösterimi ve proje tanımı düzeyindedir. Depolar kurulup çalıştırılmadı; kaynak kod denetimi veya entegrasyon kararı verilmedi.

| Proje | Doğrulanan durum | Plan için kullanım |
|---|---|---|
| [facundoolano/google-play-scraper](https://github.com/facundoolano/google-play-scraper) | MIT. Uygulama, liste, arama, yorum, benzer uygulama ve veri güvenliği alanları belgelenmiş. Bakımcı aktif kullanım/bakım yapmadığını, topluluk PR'larını değerlendirdiğini ve sayfa değişikliklerinde ayrıştırıcının bozulabileceğini belirtiyor. | Veri alanlarını anlamak için iyi referans. Üretimde tek kaynağa bağımlılık kurmadan önce güncel örneklerle sınanmalı. |
| [facundoolano/app-store-scraper](https://github.com/facundoolano/app-store-scraper) | MIT. Uygulama, arama, listeler, puanlar, yorumlar, gizlilik ve sürüm geçmişi yöntemleri belgelenmiş. | Apple veri alanları için aday referans. İndirme sayısı veren bir resmi API olarak değerlendirilmemeli. |
| [appgoblin-dev/adscrawler](https://github.com/appgoblin-dev/adscrawler) | MIT. AppGoblin için çoklu kaynak toplayan araçlar ve veritabanı şeması içerdiğini açıklıyor. Mağaza listelerinin yanında ileri uygulama/SDK incelemesi de var. | Katalog toplama ve tarihsel veri yaklaşımını anlamak için daha kapsamlı örnek. İlk ürünün tamamını bu projeye bağlamak gerekmiyor. |
| [piotrkulpinski/open-source-alternatives](https://github.com/piotrkulpinski/open-source-alternatives) | CC0-1.0. Eski `openalternative` adresi bu depoya yönleniyor. README, deponun artık derlenmiş bir liste olduğunu ve önceki site başlangıç kodunun Dirstarter'a taşındığını söylüyor. | Kategori/alternatif ilişkileri ve içerik keşfi için referans. Güncel depoyu ücretsiz hazır site uygulaması diye planlamamak gerekir. |
| [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) | MIT lisanslı Windows Package Manager topluluk manifest deposu. | Windows yazılım kimliklerini araştırmada yardımcı olabilir. Microsoft Store'un tamamı veya indirme istatistiği kaynağı değildir. |

Microsoft, `msstore` ve `winget` kaynaklarını ayrı tanımlar. Bu nedenle bir uygulamanın winget deposunda bulunması, Microsoft Store'da bulunduğu anlamına gelmez. [Microsoft kaynak belgeleri](https://learn.microsoft.com/en-us/windows/package-manager/winget/source)

Kod lisansı, mağaza verilerini veya üçüncü taraf görsellerini yeniden yayımlama hakkı sağlamaz. Veri ve görsel kullanım koşulları kaynak bazında ayrıca değerlendirilmelidir.

## Üç mağazanın veri farkları

| Konu | Google Play | Apple App Store | Microsoft Store |
|---|---|---|---|
| Kamuya açık indirme göstergesi | Örnek Todoist sayfasında `10M+` bandı var. Kesin dönemsel sayı olarak kullanılamaz. | İncelenen uygulama sayfasında puan ve değerlendirme sayısı var; public toplam indirme alanı yok. | İncelenen resmi analitik belgeleri hesap sahibinin uygulamalarıyla sınırlı. Her üçüncü taraf uygulama için public indirme kaynağı doğrulanmadı. |
| Ayrıntılı indirme/edinme raporu | Play Console raporları geliştiriciye ait uygulama raporlarıdır. | App Store Connect analitiği ve yetkili rapor erişimi. | Partner Center ve yetkilendirilmiş Store analitik API'si. |
| Ülke ve platform farkı | Görünen puan/fiyat/erişim bağlamını saklamak gerekir. | Storefront, cihaz ailesi ve sürüm bağlamını saklamak gerekir. | Market, desteklenen Windows cihazları ve mimari ayrımını saklamak gerekir. |
| İlk ürün yaklaşımı | Kaynaklı indirme bandı ve mağaza puanı. | Mağaza puanı/değerlendirme hacmi, mevcut liste konumu ve editör değerlendirmesi. | Kaynaklı liste bilgisi ve editör kürasyonu; düşük değerlendirme hacmine uygun ayrı profil. |

Kanıtlar: [Google Play örnek sayfa](https://play.google.com/store/apps/details?id=com.todoist), [Apple örnek sayfa](https://apps.apple.com/us/app/todoist-to-do-list-calendar/id572688855), [Play Console raporları](https://support.google.com/googleplay/android-developer/answer/6135870?hl=en), [Apple Analytics](https://developer.apple.com/app-store-connect/analytics/), [Microsoft Store servis kapsamı](https://learn.microsoft.com/en-us/windows/uwp/monetize/using-windows-store-services).

Örnekteki Google Play indirme bandı ile uygulama açıklamasındaki toplam kullanıcı iddiası farklı türde bilgilerdir. Marka açıklamasındaki kullanıcı sayısını Android veya iOS indirmesi diye kaydetmek yanlış olur. Benzer biçimde değerlendirme sayısı, yazılı yorum sayısı ve indirme sayısı birbirinin yerine kullanılamaz.

### Apple için katalog ve listeler

Apple'ın Search API belgesi `software`, `iPadSoftware` ve `desktopSoftware` türlerini ve ülke parametresini içeriyor. Belgede yaklaşık 20 çağrı/dakika sınırı ve önbellekleme önerisi bulunuyor; sınırın değişebileceği de belirtiliyor. Bu API aday bir metadata kaynağıdır; bütün mağazanın sınırsız taranacağı veya tüm alanların döneceği varsayılmamalı. [Apple Search API](https://performance-partners.apple.com/search-api)

Apple RSS Builder, storefront ve feed seçimini destekleyen resmi bir araçtır. Ürünün ihtiyaç duyduğu ülke, kategori, ücretli/ücretsiz ve tarih kapsamının gerçekten sağlanıp sağlanmadığı veri pilotunda kontrol edilmelidir. [Apple RSS Builder](https://rss.marketingtools.apple.com/)

### Üçüncü taraf tahminler

Appfigures, rakip uygulamalar için ülke bazlı indirme ve gelir tahminleri sunduğunu açıkça belirtiyor. Bu, Apple tarafındaki tüm verilerin resmi veya kesin olduğu anlamına gelmez. Sağlayıcı planının API erişimi, yeniden gösterim hakkı, kapsamı ve güncelleme sıklığı ayrı seçim ölçütleridir. [Appfigures App Intelligence](https://appfigures.com/products/app-intelligence)

AppGoblin'in API belgeleri erişim anahtarı ve bazı ileri uçlar için ücretli plan gereksinimini gösteriyor. Kamuya açık web sayfasını görebilmek ile veriyi kendi ürünümüzde yeniden yayımlayabilmek ayrı konulardır. [AppGoblin API belgeleri](https://appgoblin.info/api-docs)

Bu aşamada ücretli sağlayıcı seçilmedi. İlk sürümün indirme tahmini satın almadan da değer sunması öneriliyor.

## Araştırmadan çıkan ürün kararları

1. **İndirme limiti yönetilebilir olmalı.** Platform, kategori ve ücretsiz/ücretli dağıtım modeline göre ayrı kurallar gerekir. Bir Android eşiği tüm mağazalara kopyalanmamalı.
2. **Popülerlik ve uygunluk farklı şeylerdir.** İndirme sayısı aday bulur; aranan işlev, fiyat ve kullanım kısıtları son seçimi belirler.
3. **Ortak uygulama sayfası platform farklarını korumalı.** Android'de ücretsiz olan bir özellik iOS'ta abonelik gerektirebilir; Windows sürümü farklı olabilir.
4. **Liste türü isminin yanında açıklanmalı.** Resmi mağaza sırası, bizim hesapladığımız dönem özeti, editör seçkisi ve sitedeki ilgi ayrı etiketlenmeli.
5. **Zaman serisi ilk günden tutulmalı.** Bugünkü indirme bandından geçen ayın indirmesi veya tüm zamanların geçmiş sırası çıkarılamaz.
6. **Fiyat modeli birinci sınıf alan olmalı.** Ücretsiz indirme, tam ücretsiz kullanım, deneme, tek seferlik satın alma ve abonelik ayrı gösterilmeli.
7. **Editör emeği değer yaratmalı.** Kime uygun, hangi durumda uygun değil, önemli özellik hangi planda var ve alternatiften farkı ne soruları cevaplanmalı.
8. **Kullanıcı hesabı keşfin ön koşulu olmamalı.** Arama, okuma ve karşılaştırma açık; hesap cihazlar arası kaydetme ve takip için kullanılmalı.
9. **Otomasyon editör bilgisini korumalı.** Mağaza verisi yenilenirken özgün açıklama, özellik doğrulaması ve test notu silinmemeli.
10. **Katalog kontrollü büyümeli.** İlk sürümde az kategoride zengin veri, daha sonra veri ve içerik maliyeti ölçülerek genişleme.

## Arama motoru görünürlüğü

Google'ın uygulama yapılandırılmış veri kılavuzu, sayfada görünen uygulama bilgileriyle uyumlu işaretlemeyi ve doğrulamayı tarif ediyor. Ürün, uygun sayfalarda `SoftwareApplication` kullanmalı; eksik puan veya fiyatı işaretleme için uydurmamalı. [Google uygulama yapılandırılmış verisi](https://developers.google.com/search/docs/appearance/structured-data/software-app)

Çok sayıda filtre kombinasyonu sonsuz sayfa üretimine dönüşebilir. Google, filtreli gezinmede tarama maliyetine özellikle dikkat çekiyor. Bu ürünün indekslenecek kategori/etiket/rehber sayfalarını editoryal olarak seçmesi; rastgele arama ve filtre kombinasyonlarını ayrı yönetmesi gerekir. [Google filtreli gezinme rehberi](https://developers.google.com/crawling/docs/faceted-navigation)

## Açık kalan doğrulamalar

- Her mağazada hedef ülke için metadata ve sıralama kapsaması; Microsoft tarafındaki kaynak sürdürülebilirliği.
- Seçilecek kaynakların ticari gösterim, önbellekleme, görsel ve metin kullanım koşulları.
- 90 örnek mağaza kaydıyla alan doluluğu, eşleştirme doğruluğu ve güncelleme maliyeti.
- Eşiklerin gerçek örneklemde kaliteli ücretli veya niş uygulamaları dışlayıp dışlamadığı.
- Marka, başlangıç pazarı ve aylık operasyon bütçesi.

Bu açık noktalar, ürün özelliklerini tanımlamaya engel değildir. Veri sağlayıcısı ve sayısal eşikler, pilot sonuçlarına göre kesinleştirilmelidir.
