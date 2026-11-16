# Yapılandırılmış veri incelemesi

İnceleme: 16 Kasım 2026. Kapsam PHP üretim yolu (`php/app/PublicSite.php`), sunucu HTML'i ve katalog örnek verisi. Bu rapor Google indekslenmesi veya Rich Results Test sonucu değildir.

## Bulgular ve yapılan düzeltmeler

| Sayfa | Önce | Güncel yapı |
|---|---|---|
| Ana sayfa | Yalnız WebSite | Kimlikli WebSite + ona bağlı WebPage |
| Uygulama | Bağımsız SoftwareApplication | WebPage → SoftwareApplication; WebSite ve BreadcrumbList bağlantıları |
| Yazı | Bağımsız Article, her yazar Organization | WebPage → BlogPosting; kaynaklı tarihler, adı bilinen fakat türü tahmin edilmeyen yazar, mevcut kapak varsa ImageObject |
| Editör listesi | Yalnız breadcrumb | CollectionPage → ItemList; yalnız sayfada gerçekten bağlanan uygulamalar |
| Kategori | Yalnız breadcrumb | CollectionPage → ItemList; yalnız o kategorideki yayımlanmış katalog uygulamaları |

Blog, seçki ve keşif dizinleri ile yayıncı ayrıntısı da görünür listeye bağlı ItemList kullanır. Listelerin sırası puan/indirme sıralaması olarak işaretlenmez. Ana sayfaya tüm katalog için görünmeyen bir liste eklenmez.

Tüm düğümler mutlak kanonik URL'den üretilen benzersiz `@id` taşır. WebPage → WebSite, breadcrumb ve ana varlık ilişkileri aynı grafikte çözülür. Breadcrumb ara öğeleri gerçek gezinme adreslerini kullanır. Şema başlığı görünür başlıktır; SEO başlığı yalnız meta alanını değiştirir. JSON, HTML script kapanışına yol açabilecek karakterler kaçırılarak sunucu HTML'inde üretilir.

Geçersiz tarihler eklenmez; yalnız doğrulanabilir takvim tarihi/ISO zaman biçimi korunur. Saat ve saat dilimi kayıtlı değilse uydurulmaz. Yazı görseli genel sosyal paylaşım logosu değildir: yalnız mevcut özel kapak kullanılır. Yazar alanı serbest metin olduğu için kişiye veya kuruma ait olduğuna ilişkin dayanaksız bir tür ve profil URL'si üretilmez.

## Korunan sınırlar

- Özel yönetim sayfaları, sorgulu görünümler ve 404 sayfaları yapılandırılmış veri üretmez.
- Şema eklemek indeks onayı vermez. Site SEO ayarı, yerel ortam engeli, kayıt onayı ve elle verilen noindex mevcut kurallarla çalışır.
- SoftwareApplication için doğrulanmış satış teklifi, inceleme veya toplu puan bulunmadığından bunlar eklenmez. Google yazılım zengin sonuçlarının gereken alanları bu nedenle tamamlanmış değildir; sırf testi yeşile çevirmek için fiyat `0` veya puan uydurulmaz.
- Kurulumun işletmecisi bilinmediği için Softwexa otomatik site yayıncısı/Organization olarak atanmaz.
- CollectionPage/ItemList semantik katalog verisidir; belirli bir Google carousel görünümü garantisi değildir.
- Yazar türü ve gerçek yazar profili bilgisi sağlanırsa ayrıca yapılandırılabilir. Tarihler gün seviyesindeyse hassas saat bilgisi varmış gibi sunulmaz.

## Doğrulama

`php php/tests/schema.php`: ana sayfa, uygulama, yazı, liste ve kategori HTML'inden JSON-LD ayrıştırma; kimlik/bağlantı, görünür ad ve URL, sıra/sayı, tarih ve özel/sorgu/404 sınırları.

`php php/tests/public-seo.php`: meta başlığının H1'i değiştirmemesi, noindex/onay, sitemap lastmod, escaping, kapak ve yayınlanmış medya erişimi.

Bu kontroller yerel şema sözleşmesini doğrular. Gerçek alan adı yayımlandığında Google Rich Results Test ve Search Console URL Inspection ile taranabilirlik ayrıca kontrol edilmelidir. Lighthouse performans/erişilebilirlik puanları ayrı raporlanır.

## Birincil kaynaklar

- [Google SoftwareApplication](https://developers.google.com/search/docs/appearance/structured-data/software-app): zengin sonuç için fiyat ve inceleme/puan gereklilikleri.
- [Google Article](https://developers.google.com/search/docs/appearance/structured-data/article): görünür yazar, uygun yazar türü, tarihler ve konuyu temsil eden görsel.
- [Google Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): gerçek kullanıcı gezinme yolunu temsil eden öğeler.
- [Schema.org CollectionPage](https://schema.org/CollectionPage) ve [ItemList](https://schema.org/ItemList): katalog sayfası ve liste ilişkisi.

### Apache üzerinde HTTP kontrolü

`http://127.0.0.1:3152` üzerinden ana sayfa, `/uygulama/acrobat`, `/blog/abonelik-maliyeti-hesaplama`, `/liste/ay-2026-11-veri-ve-gorev` ve `/kategori/documents` çağrıldı. Beşi de HTTP 200 döndürdü; JSON-LD ayrıştırıldı ve tüm `@id` referansları aynı grafikte çözüldü. Yazının SSR içeriğinde yazar ve tarihler de görünür hale getirildi. Yerel ortamın `noindex, nofollow` yanıtı korundu. Kanonik adres çalışma portundan değil kurulum ayarından gelir.

Makine okunur kayıt: `artifacts/schema/http-report.json`; örnek üretilmiş kategori grafiği: `artifacts/schema/generated-schema.json`.
