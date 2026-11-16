# Uygulama keşif platformu özellikleri ve yapılacaklar

15 Kasım 2026. Bu liste, [ürün planının](URUN_PLANI.md) hedef iş kapsamıdır. Yönetilebilir yerel sürüm 0.3.0 geliştirilmiştir; hangi akışların çalıştığı, doğrulamalar ve kalan kapsam [güncel uygulama durumunda](UYGULAMA_DURUMU.md) izlenir. Aşağıdaki gereksinimler topluca tamamlanmış sayılmaz.

İkinci tur: [Genişletilmiş kapsam](URUN_GENISLEME_PLANI.md) bu 85 temel gereksinimi 24 ürün ve 16 SEO/büyüme satırıyla tamamlar. Bazıları mevcut özellikleri derinleştirir; toplamı bağımsız yeni özellik sayısı değildir. İlave ekran/akışlar ve genişletilmiş lansman kabul koşulları o belgede ve [yol haritasında](seo/IMPLEMENTATION-ROADMAP.md) bulunur.

P0 ilk lansman için gerekli; P1 katalogdan sonra kullanıcı geri dönüşünü geliştiren; P2 topluluk, gelir veya ölçek büyüdüğünde açılan kapsamdır. F0 veri pilotu, F1 ilk lansman, F2 takip ve büyüme, F3 topluluk ve gelir aşamasını belirtir. Kaynak erişimine bağlı özelliğin arayüzde bulunması, verisinin hazır olduğu anlamına gelmez.

## Veri ve katalog temeli

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| D01 | P0 F0 | Üç mağaza veri pilotu | Her mağazadan 30 kayıt; alan doluluğu, erişim, kaynak koşulu ve maliyet raporu |
| D02 | P0 F1 | Mağaza kimlikleri | Google paket adı, Apple kimliği ve Microsoft ürün kimliği ayrı; aynı kayıt tekrar üretilmez |
| D03 | P0 F1 | Uygulama ailesi | Doğrulanmış mağaza kayıtları bir aileye bağlanır; birleştir/ayır geri alınabilir |
| D04 | P0 F1 | Kaynak ve tarih | Yayımlanan değişken alanlarda kaynak, gözlem tarihi, kapsam ve kanıt türü var |
| D05 | P0 F1 | Eksik veri durumları | Bilinmiyor, yayımlanmıyor, geçici hata ve uygulanamaz farklı; sıfıra çevrilmez |
| D06 | P0 F1 | Ülke ve dil ayrımı | Arayüz dili değiştirmek mağaza ülkesini veya fiyat para birimini kendiliğinden değiştirmez |
| D07 | P0 F1 | Kabul kuralı profilleri | Platform/kategori/ücret modeli için eşik; önizleme, sürüm ve değişiklik kaydı |
| D08 | P0 F1 | Editör istisnası | Eşiği geçmeyen ürün gerekçeyle alınır; eşik geçti rozeti alamaz |
| D09 | P0 F1 | Günlük gözlemler | Liste, puan, fiyat ve mevcut indirme bandı gözlem tarihleriyle geçmişe yazılır |
| D10 | P0 F1 | Yenileme ve çelişki | Otomatik veri editör notunu silmez; çelişen yeni değer inceleme kuyruğuna gider |
| D11 | P0 F1 | Erişim yaşam döngüsü | Bölgesel yokluk, kaynak hatası ve kaldırılma ayrılır; son geçerli veri korunur |
| D12 | P0 F1 | Kaynak kullanım kaydı | Her kaynak için kullanım kapsamı, kota, atıf ve görsel/metin koşulu kayıtlı |

## Katalog ve uygulama ayrıntıları

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| K01 | P0 F1 | Ortak kategori yapısı | Mağaza kategorisi korunur; site kategorisine eşlenir |
| K02 | P0 F1 | Kontrollü etiketler | Eşanlamlılar birleşir; TR/EN etiketler aynı anlamı taşır; yinelenen etiket kontrolü |
| K03 | P0 F1 | Özgün kısa açıklama | Her uygulama işlevini ve hedef kullanıcısını kısa, anlaşılır biçimde açıklar |
| K04 | P0 F1 | Platforma ait meta alanları | Özellik, puan, fiyat ve uyumluluk bir platformdan diğerine kopyalanmaz |
| K05 | P0 F1 | Fiyat modeli | Ücretsiz indirme, ücretsiz temel iş, deneme, IAP, abonelik ve tek seferlik ayrı |
| K06 | P0 F1 | Özellik kanıtı | Reklam, çevrimdışı iş, hesap, dil, dışa aktarma ve eşitleme kaynak/tarih taşır |
| K07 | P0 F1 | Görseller ve medya | Ekran görüntüsünün platformu ve kullanım kaynağı belli; eksik medya düzeni var |
| K08 | P0 F1 | Mağazaya geçiş | Doğru platform/ülke URL'si; kapalı/bulunamayan kayıtta uygun alternatif eylem |
| K09 | P0 F1 | Yayıncı sayfası | Aynı yayıncının doğrulanmış ürünleri ve resmi bağlantıları listelenir |
| K10 | P0 F1 | Veri güveni ve düzeltme | Son kontrol, bilgi türü ve yanlış bilgi bildirimi görünür |

## Arama ve keşif

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| S01 | P0 F1 | Birleşik arama | Uygulama, yayıncı, kategori, ihtiyaç ve rehber sonuçları ayırt edilir |
| S02 | P0 F1 | Yazım toleransı ve öneri | Türkçe karakter, bilinen eşanlamlı/eski ad ve küçük yazım hatalarıyla bulunabilir |
| S03 | P0 F1 | Birleşik ve negatif filtre | Dahil et/hariç tut; örneğin abonelik veya reklam istemiyorum; bilinmeyen ayrı |
| S04 | P0 F1 | Platform kesişimi | En az biri ve tümü seçenekleri doğru farklı sonuç üretir |
| S05 | P0 F1 | İndirme eşiği filtresi | Yalnız kaynaklı alt sınırla çalışır; eksik veriyi dahil etmek açık seçim |
| S06 | P0 F1 | Anlaşılır sıralama | Uygunluk, puan ve güncellik anlamı görünür; farklı mağaza puanları karışmaz |
| S07 | P0 F1 | Sonuçsuz arama | Aktif filtreler korunur; önerilen gevşetme kullanıcı seçmeden uygulanmaz |
| S08 | P0 F1 | Paylaşılabilir sonuç | Filtre/sıralama/ülke bağlantıda korunur; geri dönüş aynı sonucu açar |
| S09 | P1 F2 | Doğal dil arama | İstek mevcut katalog filtrelerine çevrilir; anlaşılan ölçütler gösterilir |
| S10 | P1 F2 | Kalıcı keşif tercihleri | Kullanıcı platform/fiyat/istenmeyen etiket tercihini kaydeder ve sıfırlayabilir |

## Karşılaştırmalar ve alternatifler

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| C01 | P0 F1 | Karşılaştırma sepeti | 2–4 ürün; ekle/çıkar; gezinirken seçimler korunur |
| C02 | P0 F1 | Ortak ve kategori satırları | Ortak fiyat/platform satırları ve kategoriye uygun işlevler birlikte |
| C03 | P0 F1 | Yalnız farklar | Eşit değerler gizlenebilir; bilinmeyenler yok sayılmaz |
| C04 | P0 F1 | Gerekçeli alternatif | Alternatif ilişkisinin nedeni ve hangi ihtiyaçta daha uygun olduğu belli |
| C05 | P0 F1 | Karşılaştırma bağlantısı | Sıra ve ürünler bağlantıda korunur; kaldırılmış ürün durumu ele alınır |
| C06 | P1 F2 | Benzerlik geri bildirimi | Kullanıcı alakasız alternatif bildirebilir; editöre aday düzeltme olarak gider |

## Listeler ve sıralamalar

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| R01 | P0 F1 | Güncel mağaza listesi | Kaynak/ülke/kategori/tür/tarih görünür; desteklenmeyen kapsam gizlenir veya açıklanır |
| R02 | P0 F1 | Haftalık editör seçkisi | Dönem, uygulamalar ve her seçim için gerekçe; üyelik gerektirmez |
| R03 | P0 F1 | Aylık editör seçkisi | O ayın inceleme kapsamı açık; haftalık seçki kopyası olmak zorunda değil |
| R04 | P0 F1 | Kalıcı öneriler ve keşif | Az bilinenler, yeni çıkanlar ve kalıcı öneriler ayrı listeler |
| R05 | P0 F1 | Tarihli arşiv | Kapanan liste yöntem sürümüyle korunur; düzeltmeler kayıtlı |
| R06 | P0 F1 | Yöntem sayfası | Mağaza sırası, editör kararı, dönem özeti ve site ilgisi açıklanır |
| R07 | P1 F2 | Mağaza dönem özetleri | Tam dönem günlük gözlemi; eksik gün sıfıra çevrilmez; indirme toplamı denmez |
| R08 | P1 F2 | Site içi trend | Bağımsız kullanıcı eşiği; bot/test/editör trafiği hariç; dönem kapsamı görünür |
| R09 | P1 F2 | Tüm zamanlar kaydetmeleri | Ölçüm başlangıcı ve veri yeterliliği görünür; mağaza tarihi iddiası yok |
| R10 | P1 F2 | Ağırlıklı puan listesi | Aynı kapsamda örneklem ağırlığı; parametre sürümü; açıklanabilir eşitlik çözümü |

## Blog ve editoryal içerik

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| E01 | P0 F1 | İçerik türleri | İnceleme, karşılaştırma, ihtiyaç rehberi, alternatifler, öğretici, seçki, haber |
| E02 | P0 F1 | İçerik iş akışı | Taslak → inceleme → planlama/yayın; önizleme ve sürüm geri alma |
| E03 | P0 F1 | Kataloğa bağlı bloklar | Uygulama kartı/karşılaştırma güncel kayda bağlı; tarihsel iddia korunur |
| E04 | P0 F1 | Test yöntemi | Test edilen platform/sürüm/tarih/işlem kayıtlı; kaynak araştırması ayrı |
| E05 | P0 F1 | Yazar ve kaynaklar | Yazar profili, gerçek güncelleme tarihi, kaynak ve ilişkili ürünler |
| E06 | P0 F1 | İçerik yenileme kuyruğu | Önemli fiyat/özellik/erişim değişince bağlı içerik incelemeye işaretlenir |
| E07 | P0 F1 | İçerik takvimi | Haftalık seçki, rehber ve karşılaştırmaların sahibi ve planlanan tarihi belli |
| E08 | P1 F2 | Editör taslak yardımı | Kaynaklı özet/çeviri/etiket önerisi; insan onayı olmadan yayın yok |

## Kullanıcı ve topluluk

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| U01 | P0 F1 | Cihaz içi favoriler | Hesapsız kaydet/sil; tarayıcı verisi temizlenince kaybolabileceği anlaşılır |
| U02 | P0 F1 | Bilgi düzeltme formu | Uygulama/alan/sebep ile bildirim; spam sınırı ve panelde durum takibi |
| U03 | P1 F2 | Hesap ve eşitleme | Giriş, çıkış, kurtarma; yerel favoriler için açık birleştirme davranışı |
| U04 | P1 F2 | Özel koleksiyonlar | Oluştur/adlandır/sırala/not ekle/sil; varsayılan özel |
| U05 | P1 F2 | Fiyat ve sürüm takibi | Mağaza/ülke/para birimi/plan bağlamı; yinelenen bildirim yok |
| U06 | P1 F2 | Geliştirici ve kategori takibi | Yeni ürün/içerik tercihe göre; bildirimleri kapatma ve sıklık seçimi |
| U07 | P1 F2 | Veri ve hesap kontrolü | Tercihleri sıfırla, dışa aktar, hesabı sil; erişim yetkileri doğru |
| U08 | P2 F3 | Yorum ve topluluk puanı | Mağaza puanından ayrı; moderasyon, bildirme ve itiraz akışı |
| U09 | P2 F3 | Herkese açık koleksiyonlar | Paylaşım bilinçli seçim; inceleme ve spam kontrolü; takip/öne çıkarma |
| U10 | P2 F3 | Geliştirici sahiplenmesi | Kanıtlı yetki; önerilen değişiklikler sınırlı; editoryal puanı değiştiremez |

## Yönetim ve çalışma kalitesi

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| O01 | P0 F1 | Rol ve yetkiler | Yönetici/editör/yazar/veri operatörü/moderatör işlemleri ayrı |
| O02 | P0 F1 | Aday ve toplu giriş | Mağaza URL'si veya tablo ile aday; önizleme, tekrar ve doğrulama kontrolü |
| O03 | P0 F1 | Operasyon paneli | Eksik/eski veri, hata, kaynak kotası, kabul kuyruğu ve içerik işi görünür |
| O04 | P0 F1 | İş kuyruğu | Tekrar deneme, durdurma, hata nedeni ve son başarı zamanı kayıtlı |
| O05 | P0 F1 | Editör kayıt geçmişi | Kim, neyi, neden değiştirdi; eski değer ve yayın geri alma |
| O06 | P0 F1 | Kaynak ve bütçe kontrolü | Kaynak başına kota/harcama sınırı; sınırda kontrollü durma |
| O07 | P0 F1 | Güvenli yönetim | Güçlü oturum ve yönetici doğrulaması; giriş/işlem sınırı; gizli anahtarlar public veride yok |
| O08 | P0 F1 | Güvenli içerik ve URL girişi | İçerik temizleme; mağaza URL alanında izinli hostlar; iç ağa istek yapılamaması |
| O09 | P0 F1 | Yedek ve geri yükleme | Katalog, özgün içerik, gözlem geçmişi geri yükleme denemesiyle doğrulanır |
| O10 | P0 F1 | Mobil ve erişilebilir kullanım | Arama/filtre/karşılaştırma/mağaza akışı telefon, masaüstü ve klavyede tamamlanır |
| O11 | P0 F1 | Performans ve hata takibi | Belirlenmiş cihaz/ağ senaryosunda ölçüm; arama ve kaynak hata oranı görünür |
| O12 | P0 F1 | Ürün ölçümü | Arama, sonuçsuz arama, karşılaştırma, kaydetme ve mağaza tıklaması ayrı olaylar |

## Büyüme ve gelir

| ID | Öncelik ve aşama | Özellik | Kabul koşulu |
|---|---|---|---|
| G01 | P0 F1 | SEO ve sosyal meta | Sayfa türüne özel başlık/açıklama, canonical, paylaşım ve site haritaları |
| G02 | P0 F1 | İndeks yönetimi | Seçilmiş kaliteli sayfalar indekslenir; filtre/arama/rasgele karşılaştırma kontrollü |
| G03 | P0 F1 | Doğru yapılandırılmış veri | Görünür gerçek veriyle uyumlu uygulama/makale/gezinme; dış mağaza puanları yerel AggregateRating/değerlendirme diye işaretlenmez |
| G04 | P1 F2 | Bülten | Açık abonelik, tercihler ve kolay çıkış; seçki ve rehberlerle bağlı |
| G05 | P2 F3 | Sponsor alanları | Açık etiket, zaman/kapsam; organik sıralama etkilenmez; tıklama doğru raporlanır |
| G06 | P2 F3 | Üyelik ve ortaklık | Özellik hakkı/ödeme/iptal akışı; yalnız mevcut ortaklık programı bağlantısı |
| G07 | P0 F1 | Gizlilik ve iletişim | Hakkımızda, iletişim, gizlilik/kullanım bilgileri; veri amacı/süresi, tercih ve yerel veriyi temizleme |

## İş paketleri ve bağımlılıklar

| Sıra | Paket | Sorumluluk | Bağımlılık | Teslim |
|---|---|---|---|---|
| 1 | Veri pilotu | Veri araştırması ve ürün sorumlusu | Yok | D01; kaynak/alan matrisi, 90 örnek kayıt, maliyet ve kapsam |
| 2 | Sözlük ve örnek içerik | Editör ve ürün sorumlusu | 1 ile paralel başlayabilir | Altı kategori, ilk etiket sözlüğü, 10 zengin uygulama örneği |
| 3 | Bilgi mimarisi ve tasarım şablonu | Tasarım sorumlusu | Bu plan ve 2'nin ilk örnekleri | Aşağıdaki ekran ailelerinin durumlarıyla tasarımı |
| 4 | Katalog ve panel temeli | Yazılım sorumlusu | 1; ekran akışları | D02–D12, O01–O09, temel kategori/ürün yönetimi |
| 5 | Public keşif ve detay | Yazılım ve içerik sorumluları | 3–4 | K01–K10, S01–S08, U01–U02 |
| 6 | Karşılaştırma ve alternatifler | Yazılım ve editör | 5; özellik sözlüğü | C01–C05; kategoriye özel karşılaştırma alanları |
| 7 | Blog ve seçkiler | Yazılım ve editör | 4; 2 ile içerik paralel | E01–E07, R01–R06 ve ilk içerik paketi |
| 8 | Lansman doğrulaması | Ürün, yazılım, editör | 5–7 | O10–O12, G01–G03 ve G07; kabul senaryoları ve veri kalitesi |
| 9 | Takip ve büyüme | Yazılım ve ürün | 8; yeterli veri | P1 özellikler; kullanım eşiğiyle trend açılışı |
| 10 | Topluluk ve gelir | Ürün, yazılım, moderasyon | 9 ve operasyon kapasitesi | P2 özellikler; ayrı ticari kararlar |

Şu an tamamlanan işler araştırma, kapsam önerisi ve yapılacaklar tanımıdır. Veri pilotu, tasarım ve yazılım paketleri yapılacak durumdadır. Her paket ilgili kabul koşulu görülmeden tamamlandı sayılmaz.

### İlk uygulanacak adımlar

- [ ] Altı başlangıç kategorisi ve Türkiye/Türkçe varsayımını ürün kararı olarak kesinleştir.
- [ ] Her mağazadan 30 örnek kaydı özellik ve kaynak matrisiyle hazırla.
- [ ] Aynı ailede bulunan ve benzer isimle karışabilecek ürün örneklerini belirle.
- [ ] Aday kabul eşiklerini örneklem üzerinde değerlendir; sayısal eşikleri sürümle.
- [ ] 10 uygulamanın özgün açıklamasını ve karşılaştırma alanlarını editoryal olarak tamamla.
- [ ] Aşağıdaki ekran ve durumları kapsayan tasarım şablonunu seç/hazırla.
- [ ] Veri kaynağı kararı sonrası uygulama mimarisini yazılım sorumlusuyla belirle.
- [ ] Günlük gözlem toplama başlangıcını belirle; dönemsel listelerin veri birikimini başlat.
- [ ] İlk rehber, karşılaştırma ve seçki içeriklerini takvime bağla.
- [ ] Lansman kabul senaryolarını gerçek katalogla tamamla.

## Tasarıma aktarılacak ekran gereksinimleri

Bu bölüm görsel tasarım veya hazır tema değildir. Şablon seçiminin hangi akışları taşıması gerektiğini tanımlar. Renk, tipografi, yerleşim ve marka sonraki tasarım adımına aittir.

| Ekran ailesi | Kullanıcının yapacağı iş | Gerekli durumlar |
|---|---|---|
| Ana sayfa | İhtiyaç ara, platform seç, seçki/rehber keşfet | Yeni ziyaretçi, seçilmiş platform, veri bekleyen trend alanı |
| Arama sonuçları | Filtrele, sırala, kaydet, karşılaştırmaya ekle | Yükleniyor, sonuç yok, az sonuç, eski veri, filtre dışı öneri |
| Kategori ve ihtiyaç sayfası | Alt ihtiyaçları ve iyi seçenekleri gör | Giriş metni, filtreli liste, rehberler, veri yetersizliği |
| Uygulama ayrıntısı | İşlevi/fiyatı anla, platform seç, mağazaya git | Tek/çok mağaza, ücretli/freemium, bilinmeyen özellik, kaldırılmış/bölgesel yok |
| Alternatifler | Mevcut ürün yerine seçenek bul | Neden alternatif, filtre, az seçenek, alakasız alternatif bildirimi |
| Karşılaştırma | 2–4 üründe farkları gör | Eksik hücre, platform uyuşmazlığı, kaldırılmış ürün, yalnız farklar |
| Listeler merkezi | Liste türü ve dönem seç | Mağaza/editör/site ilgisi ayrımı, güncel/kapalı dönem |
| Liste ayrıntısı ve arşiv | Sırayı ve yöntemi anla, eski dönemi aç | Kısmi dönem, eksik veri, yetersiz aday, düzeltme kaydı |
| Editör koleksiyonu | Belirli ihtiyaca göre önerileri incele | Sıralı ürünler, seçim notu, güncelleme tarihi |
| Blog merkezi | Rehber/inceleme/karşılaştırma bul | İçerik türü, kategori, arama, boş liste |
| Makale ve inceleme | Karar ver, bağlı ürüne geç | Test/kaynak araştırması ayrımı, canlı fiyat bloğu, kaynaklar |
| Yazar ve yayıncı | Yazıları veya uygulamaları incele | Doğrulanmış bağlantılar, eski/az içerik |
| Favoriler | Kaydettiklerini bul ve karşılaştır | Yerel saklama, boş liste, silinen/kaldırılan ürün |
| Düzeltme ve öneri | Yanlış bilgiyi veya eksik ürünü bildir | Başarı, hata, tekrar, sınırlandırma |
| Yöntem ve editoryal politika | Liste/puan/sponsor/test yöntemini anla | Yöntem sürümü ve son değişiklik |
| Hakkımızda iletişim ve veri tercihleri | İşletmeciyi tanı, iletişim kur, veri kullanımını yönet | İlk lansmanda; gizlilik/kullanım, saklama süreleri, izleme tercihi ve yerel temizleme |
| Hesap ve tercihler | Giriş, platform/ülke tercihi, verileri yönet | F2; yerel listeyi birleştirme, kurtarma, silme |
| Takip ve bildirimler | Fiyat/sürüm/konu takibini yönet | F2; ülke/para birimi, izin yok, eşik, sessize alma |
| Kişisel ve public koleksiyon | Liste oluştur, not ekle, paylaş | F2 özel; F3 public, yayın incelemesi, özel/paylaşılan ayrımı |
| Yönetim merkezi | Günlük veri/içerik işini gör | Kuyruklar, başarısız kaynak, eski veri, bütçe durumu |
| Katalog düzenleme | Aday kontrol et, eşleştir, meta doğrula | Ham/editör verisi, kaynak çelişkisi, yinelenen kayıt, geri alma |
| CMS ve seçki düzenleyici | Yazı veya dönem listesi hazırla | Taslak, önizleme, planlandı, yayında, eski sürüm |
| Kurallar ve kaynaklar | Eşik/kota/kaynak ayarla | Etki önizlemesi, yetki yok, kaynak kapalı, değişiklik geçmişi |
| Moderasyon ve geliştirici | Katkı/yorum/sahiplenme değerlendir | F3; kuyruk, itiraz, doğrulama, red nedeni |

Ortak bileşen ihtiyaçları: uygulama kartı, platform seçici, puan ve örneklem, fiyat modeli, veri tarihi, özellik durumları, filtre grubu, karşılaştırma sepeti, sıra değişimi, kaynak açıklaması, sponsor etiketi, yazar kartı ve boş durum eylemleri. Sıra değişimi için karşılaştırılabilir eski gözlem yoksa ok veya yüzde üretilmez.

Tasarım örneklerinde uydurma uygulama/metrik kullanılıyorsa temsili veri olduğu belirtilir. Önerilen eşikler ürün kararı kesinleşmiş gibi işaretlenmez. Gerçek uygulamanın platform/özellik/fiyatı bilinmiyorsa tasarım uğruna doldurulmaz.

## Temel kabul senaryoları

1. “Windows ve Android'de çalışsın” seçen kişi, yalnız iOS uygulaması görmez; eşitleme ayrıca doğrulanır.
2. Android 100 bin+ filtresinde indirme bandı olmayan iOS kaydı varsayılan olarak görünmez; bilinmeyeni dahil etmek açık tercihtir.
3. Ücretsiz temel iş ve abonelik yok seçildiğinde yalnız ücretsiz indirilebilen deneme uygulaması uygun diye gösterilmez.
4. Çevrimdışı bilgisi bilinmeyen uygulama “çevrimdışı çalışır” filtresini geçmez; bilinmeyen durumu korunur.
5. Aynı uygulamanın Windows'ta eksik özelliği Android sürümünden kopyalanmaz.
6. Ülke değişiminde eski ülkenin fiyatı/erişimi yanlış etiketle görünmez; yeni veri yoksa açık eksik durum vardır.
7. Yeni sitede boş etkileşimlerle trend veya tüm zamanlar kazananı üretilmez.
8. Bir günlük mağaza listesi alınamazsa haftalık indirme veya tam haftalık sıra uydurulmaz.
9. Günlük veri yenilemesi editörün artılar/eksiler metnini değiştirmez.
10. Sponsor satın alma veya geliştirici sahiplenmesi organik sırayı ve editör notunu değiştiremez.
11. Mağazaya geçiş olayı indirme gerçekleşti sayılmaz.
12. Giriş yapmadan arama, karşılaştırma ve resmi mağazaya geçiş tamamlanır.
13. Kaynak kesintisinde son başarılı veri doğru tarihiyle gösterilir; geri yüklemede özgün içerik ve geçmiş kaybolmaz.
14. Yanlış bilgi bildirimi doğru uygulamaya bağlı olarak moderasyon kuyruğuna ulaşır.
15. Paylaşılan karşılaştırma bağlantısı telefonda aynı ürünlerle açılır; eksik/kaldırılmış ürün anlamlı durum gösterir.
16. Kullanıcı yerel favorileri temizleyebilir ve zorunlu olmayan izlemeyi kapatarak keşfe devam edebilir; form verisinin saklama süresi açıklanır.
