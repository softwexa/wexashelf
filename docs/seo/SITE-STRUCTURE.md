# Site yapısı ve yayın politikası

15 Kasım 2026 • Tasarıma ve geliştirmeye aktarılacak gereksinim; çalışan site değildir

## 1 Ana gezinme

Keşfet → Kategoriler / İhtiyaçlar / Platformlar / Listeler.

Karar ver → Karşılaştır / Ücretsiz planlar / Seçim sihirbazı / Maliyet aracı.

Kullan ve değiştir → Geçiş rehberleri / İş akışları / Kullanım rehberleri.

Kanıt ve güncellik → Testler / Değişimler / Yöntem / Yazarlar.

Kişisel alan → Favoriler; F2'de Düzenim ve Takipler. Yönetim, katkı inceleme ve özel sonuçlar kamu gezinmesinden ayrıdır. Navigasyonun nihai görsel düzeni sonraki tasarım aşamasında belirlenir.

## 2 URL ve indeks matrisi

Örneklerde gerçek marka/domain seçilmedi. Slug'lar kalıcı ve okunur tutulur; ürün adı değişikliği her zaman URL değiştirmeyi gerektirmez. Aşağıdaki “evet” kalite kapısından sonra **indekslenmeye aday** demektir, Google'ın indeksleyeceği garantisi değildir.

| Sayfa türü | Örnek yol | İndeks | Canonical / yayın koşulu |
|---|---|---|---|
| Ana sayfa | `/tr/` | Evet | Kendisi; özgün giriş ve keşif |
| Kategori | `/tr/kategori/pdf-belge/` | Evet | Kendisi; alt işler, rehberler ve yeterli uygun aday |
| Platform merkezi | `/tr/platform/windows/` | Evet | Kendisi; platforma özgü seçim bilgisi; sırf aynı liste tekrar edilmez |
| Kontrollü ihtiyaç | `/tr/ihtiyac/cevrimdisi-pdf-okuma/` | Evet | Kendisi; tek niyet, karşılaştırılabilir adaylar, kanıt |
| Uygulama ailesi | `/tr/uygulama/{slug}/` | Evet | Kendisi; mağazalar aynı sayfada bağlamıyla |
| Mağaza sekmesi/seçimi | Aynı aile sayfasında platform seçimi | Ayrı URL varsayılan yok | Paylaşım parametresi yalnız görünüm değiştiriyorsa temiz aile URL'si |
| Ayrı platform rehberi | `/tr/rehber/{uygulama}-windows-android-farklari/` | Koşullu | Ancak özgün ve yeterli içerik varsa kendisi; uygulama özetinin kopyası olmaz |
| Ücretsiz plan | `/tr/uygulama/{slug}/ucretsiz-plan/` | Koşullu | Ayrı soruyu ayrıntılı yanıtlıyorsa kendisi; kısa bilgi uygulama sayfasında kalır |
| Alternatifler | `/tr/alternatif/{slug}/` | Evet | Değiştirme nedenleri ve karşılaştırma; uygulama sayfasından ayrı niyet |
| Kalıcı karşılaştırma | `/tr/karsilastir/{a}-vs-{b}/` | Evet | Tek sabit ürün sırası; ters URL gerçek eşdeğerse 301 |
| Kullanıcı karşılaştırması | `/tr/karsilastir/?apps=...` | Hayır | Kullanıcı sonucu; editoryal sayfaya sırf benzediği için canonical verilmez |
| Geçiş | `/tr/gecis/{a}-dan-{b}-ye/` | Evet | Kendisi; yön önemlidir, ters geçiş farklı konudur |
| İş akışı | `/tr/is-akisi/{slug}/` | Evet | Kendisi; görev sırası, araçlar arası aktarım ve maliyet |
| İnceleme/öğretici | `/tr/rehber/{slug}/` | Evet | Kendisi; ürün kaydıyla aynı metin olmaz |
| Test | `/tr/test/{slug}/` | Evet | Yöntem, kapsam ve gerçek sonuç hazır olduğunda |
| Maliyet aracı | `/tr/arac/abonelik-maliyeti/` | Evet | Açıklama, gerçek örnek ve çalışan araç; kişisel hesap sonucu indekslenmez |
| Karar sihirbazı | `/tr/arac/uygulama-sec/` | Evet | Araç amacı ve kapsamı görünür; sonuç ekranları özel/noindex |
| Liste merkezi | `/tr/listeler/` | Evet | Yönteme göre ayrılmış liste aileleri |
| Güncel editör seçkisi | `/tr/listeler/haftanin-secimleri/` | Evet | Kendisi; tarihli arşive bağlantı |
| Tarihli seçki | `/tr/listeler/editor/2026-w47/` | Koşullu | Dönem bilgisi ve kalıcı editoryal değer; sadece aynı listeyse ayrı indeks yok |
| Mağaza sıra geçmişi | `/tr/listeler/magaza/{kapsam}/{donem}/` | Koşullu | Tam kaynak kapsamı ve anlamlı yorum; her gün/kategori kombinasyonu indekslenmez |
| Değişim olayı | `/tr/degisim/{slug}/` | Koşullu | Kullanıcı kararını etkileyen doğrulanmış olay; her sürüm numarasına sayfa açılmaz |
| Katalog raporu | `/tr/rapor/{slug}/` | Evet | Yöntem, örneklem ve lisanslı/özgün veri |
| Editör yanıtı | `/tr/soru/{slug}/` | Koşullu | Kaynaklı, özgün yanıt; cevapsız/tekrarlı soru noindex |
| Yazar | `/tr/yazar/{slug}/` | Koşullu | Gerçek kişi, deneyim ve yayınlar; boş profil indekslenmez |
| Yayıncı | `/tr/yayinci/{slug}/` | Koşullu | Doğrulanmış ilişki, ayırt edici bilgi ve ürünler |
| Arama | `/tr/ara/?q=...` | Hayır | İndeks dışı; sitemap'te yok |
| Rastgele filtre/sıralama | `?etiket=...&sirala=...` | Hayır | Filtre/sıralama politikası aşağıda |
| Favori, hesap, takip | `/tr/hesabim/`, yerel kişisel alan | Hayır | Kimlik/yetki ve mahremiyet kontrolü; noindex tek başına erişim engeli değil |
| Paylaşılan kullanıcı seti | `/tr/set/{id}/` | Varsayılan hayır | Kullanıcı paylaşımı + kalite/moderasyon sonrası ayrı editoryal yayın kararı |
| Yöntem ve kurum bilgileri | `/tr/yontem/`, `/tr/hakkimizda/` | Evet | Gerçek işletmeci, editoryal/sponsor/düzeltme politikaları |

## 3 Kopya, filtre ve sayfalama kararları

Bir soru = bir ana sayfa. Örneğin “reklamsız PDF okuyucu” ile “reklam içermeyen PDF okuyucu” ayrı SEO açılış sayfaları olmaz. Kalıcı ihtiyaç sayfası, filtre sonuçlarını tekrar etmekten öte seçim gerekçeleri ve kaynaklı farklar sunar. Editörce onaylanan ihtiyaç URL'leri bir yayın listesinde tutulur.

Sadece sıralamayı veya izleme bilgisini değiştiren gerçek kopyalar temiz canonical'a işaret edebilir. İçeriği belirgin değiştiren filtre sonucunu ilgisiz ana kategoriye canonical yapmak çözüm değildir. İstenmeyen ama erişilebilir sonuçlar noindex olabilir; sınırsız tarama üreten parametreler ayrıca kontrol edilir. Önceden indekslenmiş sayfanın noindex'i okunmadan robots engeli koyulmaz; robots engeli tek başına indeks kaldırma aracı sayılmaz. [Google filtreli gezinme](https://developers.google.com/crawling/docs/faceted-navigation)

Katalog sayfalamasında her sayfanın ayrı URL'si ve kendi canonical'ı bulunur. İkinci sayfa birinci sayfaya canonical edilmez. Sonraki sayfalara gerçek bağlantılar bulunur; “daha fazla” veya sonsuz kaydırma tek erişim yolu olmaz. Sıralama/filtre varyasyonları sayfalama gereksinimiyle karıştırılmaz. [Google sayfalama rehberi](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)

## 4 İç bağlantı haritası

Ana kategori → ihtiyaç rehberi → uygun uygulamalar → karşılaştırma → ücretsiz plan ve platform farkı → geçiş veya iş akışı → ilgili kullanım öğreticisi.

Bu sabit bir tıklama zorunluluğu değil, içerikler arası ilişki modelidir. Her sayfadan her sayfaya bağlantı eklenmez. Örneğin bir PDF okuyucu rehberinde video düzenleme koleksiyonu gösterilmez.

| Kaynak sayfa | Bağlanacağı içerik | Kullanıcının sonraki sorusu |
|---|---|---|
| İhtiyaç | Adaylar, seçilmiş karşılaştırmalar, test yöntemi | Hangisi bana uygun? |
| Uygulama | Limitler, platform farkları, alternatifler | Bana yetiyor mu? |
| Karşılaştırma | Plan kanıtı, kaynaklar, geçiş rehberi | Seçersem ne kaybederim, nasıl geçerim? |
| Geçiş | Kaynak/hedef uygulama, format rehberi | Verimi doğrulayabilir miyim? |
| İş akışı | Her aracın rolü, maliyet ve alternatif adım | Bu düzeni nasıl kurarım? |
| Test | Yöntem, örnek veri, uygulamalar | Sonuç hangi koşullarda geçerli? |
| Değişim | Etkilenen plan ve rehber | Eski öneri hâlâ geçerli mi? |

CMS yayından önce yetim sayfa, bozuk bağlantı ve aynı niyetli içerik uyarısı verir. Otomatik ilişkiler editörün bağlamıyla sınırlanır; footer'a binlerce anahtar kelime bağlantısı doldurulmaz.

## 5 Dil ve ülke

TR/EN dil sürümleri kendi canonical'ına sahip olur; İngilizce sayfa Türkçe sayfaya canonical edilmez. Çeviri gerçekten mevcutsa karşılıklı ve kendini içeren hreflang eşlemesi yapılır. Henüz çevrilmemiş içerik için sahte dil URL'si açılmaz. Dil seçim sayfası varsa x-default değerlendirilebilir. [Google yerelleştirilmiş sürümler](https://developers.google.com/search/docs/specialty/international/localized-versions)

Mağaza ülkesi Türkçe içerik diliyle aynı şey değildir. İngilizce arayüzle Türkiye mağaza fiyatı görülebilir. Her ülke için otomatik sayfa üretmek yerine kapsam farkı yeterli ve doğrulanmışsa ayrı içerik kararı verilir. Konuma göre zorunlu yönlendirme kullanıcının dil/platform seçmesini engellemez. Fiyatların para birimi ve mağaza ülkesi görünürdür.

## 6 Sitemap ve sayfa yaşam döngüsü

Sitemap'ler uygulama, içerik ve gerekirse dil bazında ayrılabilir. Yalnız indekslenmeye uygun, çalışan, canonical URL'ler bulunur; arama, özel sonuç, noindex, yönlendirme ve hata URL'leri bulunmaz. Lastmod yalnız önemli içerik değişikliğini gösterir. Kategori sayfalarının crawl edilebilir sayfalaması sürer; sitemap iç bağlantıların yerine geçmez.

Uygulama geçici olarak kaynaktan alınamıyorsa son başarılı bilgi ve tarih korunur. Gerçekten kaldırıldıysa durum ve işe yarar alternatif/rehber içeren tarihsel sayfa yaşayabilir. Yeterli yararı kalmayan kayıt için noindex veya 404/410 değerlendirilir. Gerçek ürün birleşmesi/URL taşınması varsa en yakın eşdeğere 301 yapılır; bütün kaldırılan uygulamaları ana sayfaya göndermeyiz.

Kapanmış hafta/ay listeleri dönem ve yöntemle saklanabilir. Saklamak indekslemek zorunda olmak değildir: az veri, tekrarlı içerik veya yorum içermeyen günlük arşivler indeks dışı kalabilir. Sıra verisi kaybolunca eski sıralama yeniden uydurulmaz.

## 7 Yayın öncesi örnek doğrulama seti

Bir uygulama, bir ücretsiz plan sayfası, bir ihtiyaç, bir karşılaştırma, bir geçiş, bir iş akışı, bir araç, bir arşiv, bir kaldırılmış uygulama, bir dil eşleşmesi, ikinci katalog sayfası ve bir özel kullanıcı sonucu seçilir. Her örnekte kullanıcı akışı ile indeks/canonical/sitemap davranışı birlikte kontrol edilir. Kaynak hatası, bilinmeyen fiyat ve mobil görünüm kapsamı da değerlendirilir. Bu kontroller henüz yapılmış değildir; geliştirme teslim koşullarıdır.
