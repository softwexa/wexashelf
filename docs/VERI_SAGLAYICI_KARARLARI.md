# Üç mağaza katalog doğrulaması

**Kontrol tarihi:** 2026-11-15 (Europe/Istanbul)  
**Kapsam:** Apple App Store, Google Play ve Microsoft Store için kamuya açık katalog/metadata ile geliştiriciye özel metriklerin ayrımı. Bu not, kayıt açma, yayınlama, ödeme, giriş yapma veya toplu tarama yapmaz.

## Kısa karar

İlk düşük-riskli sürümde katalog kaynağı olarak Apple’ın belgelenmiş iTunes Search API Search/Lookup uçlarını kullanmak uygulanabilir. Google Play ve Microsoft Store için resmi belgelerde, üçüncü tarafın tüm mağaza kataloğunu anonim biçimde listeleyen eşdeğer bir API doğrulanmadı. Google Play Developer API ve Microsoft Partner Center/Store API’leri uygulama sahibi/yayıncı hesabına bağlıdır. Bu nedenle bu iki mağaza için mevcut resmi sayfa URL’lerini kullanıcı tarafından verilen adaylar olarak saklamak veya elle doğrulanmış küçük bir örnek seti kullanmak gerekir; “API ile tüm uygulamalar” iddiası yapılmamalıdır.

| Sağlayıcı | Kamuya açık, belgelenmiş kaynak | Public metadata | İndirme sayısı | Rating count | Ülke/mağaza | Kota / sınır kararı |
|---|---|---|---|---|---|---|
| Apple | [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) ve [Lookup örnekleri](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/LookupExamples.html) | Search/Lookup ile uygulama katalog kaydı ve ID tabanlı lookup alınabilir. | **Yok:** kamu Search/Lookup kaydından geliştirici analytics download metriği çıkarılamaz. | Kayıtta bulunabilen puan/oy alanı ile geliştirici analytics aynı şey değildir; alanın her ülke ve uygulamada dolu olacağı garanti edilmemeli. | `country` parametresiyle mağaza bölgesi seçilebilir; her ülke için ayrı snapshot tutulmalı. | Apple’ın [güncel Search API sayfası](https://performance-partners.apple.com/search-api) yaklaşık 20 çağrı/dakika (değişebilir) ve cache önerisini belirtir; bu bir erişim garantisi değildir. Yerel uygulama daha düşük hız sınırı uygular. |
| Apple (sahip metrikleri) | [Analytics Reports API](https://developer.apple.com/help/app-store-connect-analytics/overview/analytics-reports-api), [metric definitions](https://developer.apple.com/help/app-store-connect-analytics/reference/metrics-definitions/) | Uygulamanın App Store Connect hesabına ait raporlar. | Var (first-time, redownload, total); en az beş first-time download eşiği ve privacy/threshold kuralları olabilir. | Analytics/ratings ve diğer raporlar hesap rolü ve rapor erişimi gerektirir. | Territory boyutu raporlarda desteklenir. | API key + uygun App Store Connect rolü gerekir; herkese açık katalog servisi değildir. |
| Google Play | Tüketiciye açık Play ürün sayfaları; resmi geliştirici API belgeleri referans olarak [Android Publisher REST](https://developers.google.com/android-publisher/api-ref/rest) | PDP’de görünen ad, açıklama, sürüm vb. tüketici görünümü elle/izinli düşük hacimli doğrulama için kullanılabilir; resmi anonim katalog API’si bulunamadı. | **API ile kamuya açık değil:** [Play Console statistics](https://support.google.com/googleplay/android-developer/answer/139628) geliştiricinin kendi uygulama istatistiklerini anlatır. | Kamu PDP’de görünen rating/review özeti, sahibi doğrulayan metrik raporu değildir; API’de review listesi OAuth ister. | PDP ülke/locale değişebilir; ülke görünümü ayrı gözlem olarak kaydedilmeli. | [reviews.list](https://developers.google.com/android-publisher/api-ref/rest/v3/reviews/list) `androidpublisher` OAuth scope ister. Belgelenmiş anonim tüm-katalog endpoint’i veya güvenli genel kota yok. |
| Microsoft Store | [Store URI search/PDP](https://learn.microsoft.com/en-us/windows/apps/develop/launch/launch-store-app) kamu kullanıcı akışıdır; katalog dump/API değildir. | PDP ve Store arama sonucu kullanıcıya görünen metadata için sınırlı doğrulama kaynağı olabilir. | **Yok:** public PDP’den güvenilir indirme metriği çıkarılamaz. | Public PDP’de varsa görünen değerlendirme özeti kullanılabilir; geliştirici rapor metriği sayılmamalı. | Store araması/mağaza görünümü bölgeye göre değişebilir; ülke gözlemi ayrı tutulmalı. | [Microsoft Store services](https://learn.microsoft.com/en-us/windows/uwp/monetize/) analytics “your apps” içindir. [Submission API](https://learn.microsoft.com/en-us/windows/apps/publish/store-submission-api) ve [Product Ingestion API](https://learn.microsoft.com/en-us/partner-center/marketplace/product-ingestion-api) Partner Center/Entra kimliği ister; genel anonim katalog endpoint’i doğrulanmadı. |

## Sağlayıcı bazlı gerekçe

### Apple

Apple’ın resmi iTunes Search API dokümanı arama ve ID tabanlı lookup’ı açıkça belgeler; bu, aday uygulama kimliği/mağaza metadata’sı için en net ilk entegrasyondur. Ancak indirme, kurulum, kaynak ve territory analitiği App Store Connect Analytics raporlarıdır: uygun API anahtarı ve rol gerekir, bazı raporlar privacy threshold uygular. Dolayısıyla `downloadCount` alanı public Apple lookup’tan üretilmemeli; ayrı `owner_metrics` kaynağı ve `unverified`/`not_available` durumu kullanılmalıdır.

### Google Play

Google’ın resmi Android Publisher API’si uygulama paketi adıyla çalışır ve uygulama sahibi hesabına erişim modelindedir. Örneğin `reviews.list` açıkça `https://www.googleapis.com/auth/androidpublisher` scope ister. Play Developer Reporting API de “your app” raporlamasıdır. Bu belgeler, anonim ve tüm Play kataloğunu dönen bir API olarak yorumlanamaz. Public ürün sayfaları yalnızca kaynak URL’siyle sınırlı, düşük hacimli metadata gözlemi olabilir; sayfa kazıma/otomatik toplu tarama bu kararla yetkilendirilmiş değildir.

### Microsoft Store

Microsoft’un resmi belgeleri Store URI’larını arama/PDP açma mekanizması olarak, Partner Center Submission/Product Ingestion API’lerini ise yayıncı hesabının ürünlerini yönetme olarak tanımlar. Analytics de geliştiricinin kendi uygulamalarına yöneliktir. Bu nedenle Windows için geçerli, anonim, resmi bir “mağazadaki tüm uygulamaları listele ve indirme/oy sayısı ver” API’si doğrulanmadı. Üçüncü taraf katalog sağlayıcısı kullanımı ayrıca kaynak, lisans, güncellik ve maliyet incelemesi ister; bu çalışmanın kapsamı dışıdır.

## Download threshold ve veri modeli kararı

Kabul eşiğinde farklı kanıt türleri ayrı tutulur. Android’in kamuya açık mağaza sayfasında gösterdiği indirme bandının alt sınırı kullanılabilir; bu kesin indirme sayısı, ülkeye ait indirme toplamı veya haftalık artış değildir. Örneğin [Todoist’in resmî Google Play kaydı](https://play.google.com/store/apps/details?id=com.todoist) bir indirme bandı gösterir. Arama motorunun önbellekli özeti yeni gözlem tarihiyle kataloğa aktarılmaz; gerçek kaynak kontrolü gerekir.

- `storeMetrics.downloadsLowerBound`: yalnız doğrudan doğrulanmış Android mağaza bandının alt sınırı; kaynak ve kontrol tarihiyle. `country`, gözlemlenen mağaza görünümüdür; indirmelerin coğrafi dağılımını anlatmaz.
- iOS/Windows kabul eşiği ayrı `ratingCount` gözlemiyle çalışır; indirme sayısına çevrilmez.
- Kesin, dönemlik veya ülke bazlı download/install analitiği ayrıca yetkili sahip raporu ve kapsam gerektirir.
- Eksik değer `null` kalır. Tahmin, pazarlama kullanıcı sayısı veya arama önbelleği yeni ölçüm olarak sunulmaz.

## Önerilen düşük-riskli sonraki adım

1. Mevcut Apple candidate lookup’ı resmi Search/Lookup alanları, `country`, ham kaynak URL’si ve `observed_at` ile normalize et; küçük sabit bir istek kotası, cache ve backoff ekle.
2. Google ve Windows için yeni crawler/API yazma. Önce yalnız kullanıcı tarafından sağlanan Play/Microsoft Store URL veya ID’leri `candidate` olarak içeri al; metadata doğrulaması manuel/tekil ve kaynak URL’siyle kayıtlı olsun.
3. Üç mağazada ortak şema ve `not_available`/`unverified` durumlarını ekle; public metadata hiçbir zaman download threshold kanıtı sayılmasın.
4. Kimlik bilgisi, Partner Center/App Store Connect/Google Play hesabı, ücretli veri sağlayıcı, toplu crawl veya yayınlama adımı için ayrıca açık yetki ve sağlayıcı koşulları incelemesi gerekir.

**Not:** Resmi dokümanlarda bir endpoint’in bulunmaması, robots.txt veya teknik erişilebilirliğin hukuki izin verdiği anlamına gelmez. Bu belge yalnızca doğrulanmış teknik erişim sınırlarını ve güvenli ürün kararını kaydeder.


## Mevcut kayıt kaynak yenileme kuyruğu

`/api/admin/refresh` yalnız mevcut katalog kayıtlarının Apple ürün kimliğini veya tam resmi Apple ürün bağlantısını kullanır. Önizleme katalog kaydını değiştirmez; yönetici ayrıca uygular veya reddeder. Uygulama yalnız mağaza metrikleri, kimlikleri ve bağlantılarını değiştirir; editoryal içerik ve uygulama genel kontrol tarihi korunur. Google/Windows otomatik yenilemesi desteklenmez. Eksik Apple indirme metriği `null` kalır. Kaynak alanları 90 günden eskiyse eski, tarihi yoksa bilinmiyor sayılır.

Kuyruk/geçmiş en fazla 500 aday tutar; eski bekleyenler de bu sınırda düşebilir. Yedek geri yükleme politikası `clear-history-and-pending`: kayıtlarla aynı işlem içinde tüm yenileme kuyruğu/geçmişi temizlenir. Yedekten eski adaylar geri yüklenmez; geri yükleme sonrasında yeni kaynak önizlemesi gereklidir. Revizyon uyuşmazlığında uygulama 409 ile reddedilir.
