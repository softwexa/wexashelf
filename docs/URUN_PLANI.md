# Üç mağaza için uygulama keşif platformu ürün planı

15 Kasım 2026 • Tasarım öncesi ürün kapsamı önerisi

Güncel teslim: Yönetilebilir yerel sürüm 0.3.0. Bu plan hedef kapsamını korur; uygulanmış akışlar ve kalan işler [Uygulama durumu](UYGULAMA_DURUMU.md) belgesinde ayrılır.

İkinci araştırma turu bu kapsamı [Genişletilmiş ürün planı](URUN_GENISLEME_PLANI.md) ve [SEO stratejisi](seo/SEO-STRATEGY.md) ile büyüttü. İlk 85 gereksinime 40 yeni/derinleştirilmiş gereksinim satırı eklendi. İlk lansman artık iki odak alanda plan limitleri/maliyet, platform farkları, geçiş, iş akışı ve gerekçeli sihirbazı da kapsıyor. Aşama ve teslim koşullarında genişleme belgesi ile [yol haritası](seo/IMPLEMENTATION-ROADMAP.md) önceliklidir; aşağıdaki katalog hedefi nihai ürün büyüklüğü değildir.

Ürün; Google Play, Apple App Store ve Microsoft Store uygulamalarını insanların yapmak istedikleri işe göre bulmasını, karşılaştırmasını ve doğru mağazaya ulaşmasını sağlayacak. Kategori ve etiketlerin yanında gerçek kullanım koşulları, fiyat modeli, platform farkları, editör rehberleri ve açıklanabilir listeler bulunacak.

Temel vaat: **İhtiyacını söyle, uygun uygulamaları gör, farklarını anla ve seç.**

Bu plan web ürünü içindir. Üç mağazada yayımlanacak ayrı yerel istemciler bu aşamanın teslimatı değildir. Sonraki istemciler aynı katalogdan yararlanabilir. Marka, eşikler, başlangıç pazarı ve sayısal lansman hedefleri aşağıda öneri olarak tanımlanmıştır.

## 1 Ürünün farklılaşması

Çok sayıda uygulama göstermek tek başına yeterli değer üretmez. Kullanıcı, ücretsiz görünen bir uygulamanın ihtiyaç duyduğu işlevi ücretli sunup sunmadığını, cihazında çalışıp çalışmadığını ve mevcut uygulamasına göre ne kazandırdığını öğrenebilmelidir.

Ürünü taşıyacak beş yetenek:

1. **İhtiyaca göre keşif:** “Çevrimdışı çalışan ve hesap istemeyen PDF okuyucu” gibi gereksinimleri filtrelere dönüştürmek.
2. **Platformlar arasında doğru eşleştirme:** Aynı uygulamanın Android, iOS ve Windows sürümlerini bir arada görmek; farklı özellik ve fiyatlarını korumak.
3. **Karar vermeye yarayan meta bilgiler:** Ücretsiz kullanım sınırı, abonelik, reklam, çevrimdışı işlev, dil, dışa aktarma ve senkronizasyon.
4. **Gerekçeli karşılaştırma ve alternatifler:** Yalnız benzer uygulamaları göstermek yerine hangi kullanıcı için hangisinin uygun olduğunu açıklamak.
5. **Düzenli geri dönüş nedeni:** Haftalık/aylık seçkiler, kaydetme, yeni sürüm ve fiyat takibi.

Rakip gözlemleri ve veri kaynakları [araştırma dosyasında](ARASTIRMA.md) bulunur. Özellikle [AlternativeTo](https://alternativeto.net/faq/), [AppAgg](https://appagg.com/top/?hl=en) ve [AppRaven](https://apps.apple.com/us/app/appraven-apps-gone-free/id1490607195) bu yeteneklerin farklı parçaları için referanstır.

## 2 Hedef kullanıcılar ve ana akışlar

| Kullanıcı ihtiyacı | Üründeki akış | Başarı koşulu |
|---|---|---|
| Bir iş için ilk uygulamayı bulmak | İhtiyaç veya kategori → filtre → kısa liste → mağaza | Uyumlu, gerekli işlevi sunan en az bir seçeneğe ulaşma |
| Kullandığı uygulamayı değiştirmek | Uygulama adı → alternatifler → farklar → karşılaştırma | Değiştirme gerekçesi ve kaybedilecek özellikleri anlama |
| Telefon ve bilgisayarda birlikte çalışmak | Android + Windows seçimi → tüm seçilen platformlarda olanlar → senkronizasyon | Her platformdaki erişim ve eşitlemenin ayrı doğrulanması |
| Abonelikten kaçınmak | Fiyat modeli → tek seferlik/tam ücretsiz → işlev filtresi | Deneme sürümünü tam ücretsiz sanmama |
| Yeni ve kaliteli uygulamalar keşfetmek | Haftanın seçkisi → uygulama/rehber → kaydetme | Liste yöntemini ve seçim nedenini görebilme |
| İçerik üzerinden karar vermek | Rehber → güncel karşılaştırma → uygulama ayrıntısı | Yazı ve katalog bilgilerinin tutarlı olması |

Arama, uygulama inceleme ve karşılaştırma üyelik istemez. İlk sürümde cihaz içinde favori kaydetme bulunur; hesap, cihazlar arası eşitleme ve bildirim için ikinci aşamada açılır.

## 3 Katalog kapsamı ve kabul kuralları

### Uygulama ailesi ve mağaza kayıtları

Bir uygulama ailesi, kullanıcıların aynı ürün olarak tanıdığı uygulamayı temsil eder. Her mağazadaki sürüm ayrı kayıttır. Örneğin aile sayfasında üç mağaza bağlantısı bulunabilir; puan, fiyat, indirme bilgisi, özellik doğrulaması ve güncelleme tarihi ilgili mağaza kaydından gelir.

Eşleştirme için mağaza kimliği, yayıncı kimliği, resmi web sitesinin bağlantıları ve ürün ilişkisi kullanılır. Aynı ad veya ikon yeterli değildir. Lite/Pro sürümleri, bağımsız yan ürünler ve üçüncü taraf istemciler kendiliğinden birleştirilmez. Editör birleştirmeyi ve ayırmayı geri alabilir.

### İndirme eşiği

Google Play kamu sayfasındaki indirme bandı aday seçmeye uygundur. İncelenen örnek sayfa `10M+` gösterir. Apple ve Microsoft'un ayrıntılı analitik erişimi geliştiricinin kendi uygulamalarıyla ilgilidir; aynı public indirme eşiği üç mağazaya uygulanamaz. [Google Play örneği](https://play.google.com/store/apps/details?id=com.todoist), [Apple Analytics](https://developer.apple.com/app-store-connect/analytics/), [Microsoft Store servisleri](https://learn.microsoft.com/en-us/windows/uwp/monetize/using-windows-store-services)

Yönetici panelinde kurallar platform, kategori, ülke ve ücret modeline göre ayarlanır. Kural değişikliği önce kaç kaydı etkileyeceğini gösterir. Kataloğa kabul, sıralamadan ayrı çalışır.

Pilot için başlangıç değerleri:

| Profil | Otomatik aday önerme eşiği | Yayımlama koşulu |
|---|---|---|
| Android genel ücretsiz/freemium | En az 100 bin indirme alt sınırı, en az 200 puanlama, en az 4,0/5 | Zorunlu alanlar, geçerli mağaza bağlantısı ve editör kontrolü |
| Android ücretli/niş | En az 10 bin indirme alt sınırı, en az 50 puanlama, en az 4,0/5 | Aynı kontrol; niş/ücretli kabul profili kayıtlı |
| iOS/iPadOS genel | Seçili storefront için en az 100 puanlama ve en az 4,0/5 | İndirme eşiği geçti rozeti verilmez; editör kontrolü |
| Windows genel | Kaynak sunuyorsa en az 25 puanlama ve en az 4,0/5 | Düşük hacim ve kaynak kapsamı pilotta kalibre edilir |
| Yeni, ücretli veya az bilinen değerli ürün | Sayısal eşik zorunlu değil | Açıklamalı editör istisnası; özellik kanıtı ve değerlendirme gerekçesi |

Bu sayılar kalite standardı veya eşdeğer popülerlik ölçüsü değildir. 90 kayıtlık pilotta düşük kaliteli ürünleri geçiriyor veya iyi ürünleri dışlıyorsa değiştirilecektir. Kaynak puanlama sayısını sağlamıyorsa yazılı yorum sayısı onun yerine geçirilmez; kayıt editör yoluna gider.

İndirme filtresinin seçenekleri: 10 bin+, 100 bin+, 1 milyon+, 10 milyon+ ve özel eşik. Filtre, varsayılan olarak yalnız seçilen eşiği kanıtlayan kayıtları döndürür. “İndirme verisi bulunmayanları da göster” ayrı bir seçimdir; bu sonuçlar farklı açıklama taşır. Ülke seçmek, global Play indirme bandını o ülkenin indirmesine dönüştürmez.

### Yayın yaşam döngüsü

Aday → bilgi tamamlama → editör kontrolü → yayımlandı → yeniden kontrol gerekiyor → arşivlendi akışı bulunur. Reddedilme ve arşivleme nedeni kayıtlıdır. Sayısal eşik altına düşme otomatik silme oluşturmaz.

Son güncellemesi eski olan uygulama inceleme kuyruğuna girer; yalnız yaş nedeniyle kötü veya terk edilmiş ilan edilmez. Bölgesel erişilememe, mağazadan küresel kaldırılma ve geçici kaynak hatası ayrı tutulur. Kaldırılan ürün sayfası, kullanıcıya durum ve alternatifler sunmak için korunabilir.

## 4 Kategori ve etiket sistemi

İlk lansman için önerilen altı alan:

- Üretkenlik ve planlama.
- Fotoğraf, video ve tasarım.
- Eğitim ve dil öğrenme.
- Dosya, belge ve PDF.
- Güvenlik ve gizlilik araçları.
- Sistem araçları ve kişiselleştirme.

Mağaza kategorisi özgün haliyle tutulur; ayrıca siteye ait anlaşılır kategoriye eşlenir. Bir uygulamanın bir ana kategorisi ve sınırlı sayıda yardımcı kategorisi olabilir. Oyunlar, ilk katalog ve içerik işletimi oturduktan sonra ayrı keşif alanı olarak genişletilir.

Etiketler serbestçe çoğaltılan kelimeler yerine kontrollü sözlükten seçilir:

| Etiket grubu | Örnek |
|---|---|
| Yapılacak iş | Not almak, belge taramak, video kesmek, odaklanmak |
| Kullanıcı bağlamı | Öğrenci, içerik üreticisi, küçük ekip, bireysel kullanım |
| Fiyat ve dağıtım | Tam ücretsiz, freemium, tek seferlik, abonelik, açık kaynak |
| Kullanım koşulu | Çevrimdışı, hesap gerektirmez, reklam içermez |
| Veri ve bağlantı | Dışa aktarma, cihazlar arası eşitleme, yerel veri saklama |
| Cihaz | Android telefon/tablet, iPhone, iPad, Windows PC |
| Dil ve erişim | Türkçe arayüz, klavye desteği, doğrulanmış ekran okuyucu desteği |

Özellik etiketleri platform, plan ve kaynakla ilişkilendirilir. “Çevrimdışı” etiketi hangi işin çevrimdışı yapıldığını açıklamalıdır. Belirsiz bilgi `bilinmiyor` kalır. Eşanlamlılar ve TR/EN karşılıklar aynı etikete bağlanır; kullanıcıdan gelen etiket önerileri moderasyona gider.

## 5 Arama ve keşif

İlk sürüm; uygulama adı, yayıncı, kategori, etiket, kullanım amacı ve eşanlamlılar üzerinde arar. Türkçe karakterler, yazım hataları ve bilinen eski ürün adları desteklenir. Otomatik tamamlamada uygulamalar, ihtiyaçlar ve rehberler ayrı sonuç türleridir.

Temel filtreler: mağaza/platform, kategori, ülke erişimi, fiyat modeli, reklam, uygulama içi satın alma, abonelik, minimum puan ve puanlama sayısı, indirme bandı, uygulama dili, temel çevrimdışı işlev, hesap zorunluluğu, açık kaynak, güncelleme tarihi.

Birden fazla platform seçilince “seçtiklerimden en az biri” ve “seçtiklerimin hepsi” davranışı açık olmalıdır. İkinci seçenek, uygulamanın bütün sürümlerinin aynı özellikleri sunduğu anlamına gelmez. “Windows ve Android arasında senkronizasyon” ayrıca doğrulanmış özelliktir.

Sonuçlar; uygunluk, mağaza puanı, güncellik veya seçili listeye göre sıralanabilir. Farklı mağaza puanları ortalanmaz. “Uygunluk” sonucu, eşleşen gereksinimleri gösterir. Sponsor alanları organik sıralamaya karıştırılmaz.

Sonuç yoksa hangi filtrenin daralttığı açıklanır ve gevşetme önerisi sunulur. Kullanıcı onayı olmadan filtre kaldırılmaz. Seçilen filtreler bağlantıda korunur; geri tuşu sonucu ve kaydırma konumunu mümkün olduğunca korur.

Doğal dil asistanı ikinci aşamadır. “Reklamsız, çevrimdışı PDF okuyucu” ifadesini mevcut filtrelere çevirir ve anlaşılan kriterleri gösterir. Katalogda kanıtlanmayan özellik veya uygulama üretmez. Belirsiz istek için sonuçları hangi varsayımla getirdiğini açıklar.

## 6 Uygulama sayfası ve meta bilgiler

Her uygulama sayfasında şu bilgiler bulunur:

- İkon, ad, yayıncı ve özgün bir cümlelik işlev açıklaması.
- Kime uygun olduğu, güçlü yönleri ve önemli sınırlamaları.
- Mevcut platformlar; seçili ülke için geçerli resmi mağaza bağlantıları.
- Mağaza bazında puan, puanlama sayısı, indirme bandı mevcutsa bandın kendisi ve tarih.
- Ücretsiz indirme ile ücretsiz temel kullanımın ayrımı; deneme, abonelik, tek seferlik ödeme ve uygulama içi satın alma.
- Önemli özelliklerin platform ve plan karşılıkları.
- Çevrimdışı kullanım kapsamı, hesap gereksinimi, reklam durumu, dil ve veri dışa aktarma.
- Desteklenen cihazlar, gerekli işletim sistemi; Windows için kaynak varsa x64/ARM64 gibi uyumluluk.
- Ekran görüntüleri ve varsa tanıtım videosu; hangi platform/sürüme ait oldukları.
- Son sürüm ve güncelleme notu; daha sonra fiyat ve sürüm geçmişi.
- Mağazada yayımlanan gizlilik/veri güvenliği beyanlarına bağlantı ve beyanın kaynağı.
- İlgili alternatifler, karşılaştırmalar, rehberler ve koleksiyonlar.
- Son veri kontrolü, son editör değerlendirmesi ve yanlış bilgi bildirme.

Mağaza beyanı, editörün denemesi ve üçüncü taraf tahmini farklı gösterilir. “Test edildi” ancak cihaz, platform, uygulama sürümü, tarih ve denenen işlemler kayıtlıysa kullanılabilir. Mağazadaki veri güvenliği beyanı bağımsız güvenlik denetimi sayılmaz.

Ana eylem seçili platformun resmi mağazasına gitmektir. Farklı cihaz algılandığında ilgili mağaza önerilebilir; kullanıcı diğer platformları yine seçebilir. Site uygulama dosyası barındırmaz. Dış bağlantı tıklaması analitikte indirme olarak kaydedilmez.

## 7 Karşılaştırmalar ve alternatifler

Kullanıcı 2–4 uygulamayı yan yana karşılaştırabilir. Mobilde iki sütun veya sırayla kart inceleme kullanılabilir; nihai düzen tasarım aşamasında seçilir.

Ortak karşılaştırma satırları: işlev, desteklenen platform, ülke erişimi, ücretsiz kullanım sınırı, fiyat/abonelik dönemi, reklam, çevrimdışı işlev, hesap gereksinimi, dil, dışa aktarma, senkronizasyon ve güncellik. Kategoriye göre ek satırlar bulunur: PDF için OCR ve imza; video için filigran ve dışa aktarma çözünürlüğü gibi.

“Yalnız farkları göster”, karşılaştırmadan çıkar, alternatif ekle ve paylaşılabilir bağlantı bulunur. Bilinmeyen bilgi “yok” yapılmaz. Her değer mağaza ve plan bağlamını korur. Ürün tek bir genel kazanan ilan etmek yerine “ücretsiz OCR isteyenler için”, “abonelik istemeyenler için” gibi gerekçeli öneriler sunar.

Alternatif ilişkisi; benzer, daha ekonomik, açık kaynak, daha basit veya belirli platformda mevcut şeklinde açıklanır. Editörün hazırladığı kalıcı karşılaştırma yazıları ile kullanıcının oluşturduğu geçici karşılaştırmalar ayrı sayfa türleridir.

## 8 Haftalık aylık ve tüm zamanlar listeleri

### Bağımsız liste aileleri

| Liste | Ölçtüğü şey | Yayın koşulu |
|---|---|---|
| Mağazada şu an popüler | Kaynağın mevcut ülke/kategori/ücret türü sırası | Kaynak ve güncel gözlem mevcut |
| Haftanın ve ayın editör seçkisi | Editörün o dönemde önerdiği uygulamalar | Seçim gerekçesi, dönem ve sorumlu editör |
| Mağaza listelerinde hafta/ay özeti | Bizim kaydettiğimiz günlük mağaza sıralarından hesaplanan dönem görünürlüğü | Tam dönem gözlemleri; resmi mağazanın kendi dönem listesi diye sunulmaz |
| Sitede bu hafta/bu ay popüler | Platformumuzdaki geçerli kullanıcı ilgisi | Yeterli bağımsız kullanıcı, dönem kapsamı ve kötüye kullanım süzmesi |
| En yüksek değerlendirmeye sahip | Aynı mağaza/ülke/kategori içindeki puan ve puanlama hacmi | Minimum örneklem ve açıklanmış hesaplama |
| Yeni ve dikkat çeken | Yakın tarihte çıkan, editörün kabul ettiği uygulamalar | Çıkış tarihi ile sitemize eklenme tarihi ayrı |
| Az bilinen iyi uygulamalar | Standart popülerlik eşiğinin dışında kalan editör seçkisi | Gerekçeli inceleme; popülerlik eşiği geçti rozeti yok |
| Tüm zamanlarda en çok kaydedilen | Sitenin ölçüm başlangıcından itibaren geçerli kaydetmeler | Başlangıç tarihi görünür; yeterli gerçek kullanım |
| Kalıcı editör önerileri | Düzenli gözden geçirilen uzun ömürlü seçki | İnceleme tarihi; evrensel mağaza indirme rekoru iddiası yok |

Kategori, platform, ülke ve ücretsiz/ücretli alt listeleri aynı kurallarla çalışır. Üç mağazayı tek ham puan cetvelinde yarıştıran bir genel sıralama ilk sürüme alınmaz; karma platform koleksiyonları editoryal gerekçeyle hazırlanır.

### Dönem tanımı ve tarihçe

“Bu hafta”, pazartesi 00.00'dan sonraki pazartesiye kadar; “bu ay”, takvim ayı olarak tanımlanır. İlk yayın pazarında Europe/Istanbul esas alınır ve yöntem sayfasında belirtilir. Gözlem zamanları kaynak saati ve UTC karşılığıyla saklanır. “Son 7 gün” ve “son 30 gün” ayrı seçeneklerdir.

Devam eden dönemde “şu ana kadar” ve kesim zamanı görünür. Kapanmış liste, yöntem sürümü ve kaynak tarihleriyle arşivlenir. Sonradan düzeltme gerekiyorsa sessizce değiştirmek yerine düzeltme kaydı eklenir. Yeni veri sağlayıcısının eski verileri, tanımları uyumlu değilse eski seriyle birleştirilmez.

### Sayısal yöntem önerisi

İlk sürümde tek bir gizemli genel kalite puanı yerine açık metrikler gösterilir. Yeterli veri oluştuğunda aynı mağaza/ülke/kategori grubunda puan sıralaması için ağırlıklı ortalama kullanılabilir:

`B = (v × R + m × C) / (v + m)`

Burada R uygulamanın puanı, v puanlama sayısı, C karşılaştırılan grubun ortalaması, m ise düşük örneklemin etkisini azaltan sabit ağırlıktır. Pilot başlangıcı için m=100 önerilir. Mağazalar ayrı hesaplanır; bu sonuç editörün test puanı değildir. Minimum kabul hacmi ayrıca uygulanır. Eşitlikte puanlama hacmi, sonra kalıcı kimlik kullanılır.

Mağaza dönem özeti için aynı kapsamda günlük ilk N sıralama kaydedilir. Günlük görünürlük puanı `max(0, (N + 1 − sıra) / N)` olabilir. Tam alınmış listede bulunmayan uygulama o gün 0 alır; alınamamış liste günü 0 sayılmaz. Tamamlanmış haftalık/aylık özet, dönemin bütün günleri için tamamlanmış kaynak gözlemi varsa yayımlanır. Kapsam eksikse yalnız eldeki tarihler gösterilir ve tam dönem sırası üretilmez. Sıra toplamı indirme toplamı anlamına gelmez.

Site içi trend için başlangıç sinyalleri kaydetme ve resmi mağazaya geçiştir; görüntülenme tek başına kalite sinyali yapılmaz. Kullanıcı başına uygulama/dönem katkısı sınırlandırılır; editör, test ve bot trafiği çıkarılır. İlk öneri, liste için en az 100 farklı geçerli kullanıcı, uygulama için en az 20 farklı kullanıcı etkileşimidir. Bu eşikler pilot sonrası ayarlanır. Gösterim yanlılığı değerlendirilmeden site içi trend “en iyi uygulamalar” diye sunulmaz.

### Yeni sitenin başlangıcı

İlk gün editör seçkileri ve erişimi doğrulanmış güncel mağaza listeleri açılır. Zaman serisi hemen toplanır; kapanmış haftalık/aylık hesaplamalar yeterli dönem oluşunca açılır. Site trendi ve tüm zamanlar kaydetme listesi için veri oluşması beklenir. Yeterli aday olmayan listeler sırf Top 10 yazmak için doldurulmaz.

## 9 Blog ve editoryal sistem

İçerik türleri:

- Ayrıntılı uygulama incelemesi.
- İki veya daha fazla uygulamanın karşılaştırması.
- Bir ihtiyaca yönelik en iyi seçenekler rehberi.
- Bir uygulamanın alternatifleri.
- Kullanım öğreticisi ve yeni başlayan rehberi.
- Haftalık ve aylık seçki yazısı.
- Önemli sürüm değişikliği ve uygulama haberi.

Her içerikte yazar, yayımlanma/gerçek güncellenme tarihi, kullanılan kaynaklar, ilişkili uygulamalar ve inceleme yöntemi bulunur. Denenmiş ürün ile kaynaklardan hazırlanmış değerlendirme ayırt edilir. “En iyi” içerikleri seçim ölçütlerini, ücretsiz plan kısıtlarını ve kime uygun olduğunu açıklar.

Yazı içindeki uygulama kartları ve karşılaştırma tabloları kataloğa bağlanır. Güncel fiyat gibi canlı alanlar “güncel bilgi” diye gösterilir. Yazının yayımlandığı tarihe ilişkin iddialar tarihsel kalır. Fiyat, erişim veya önemli özellik değişikliği yazıyı editör inceleme kuyruğuna taşır; metin kendiliğinden yeniden yazılmaz.

CMS; taslak, incelemede, planlandı, yayımlandı ve arşiv durumlarını; önizleme, sürüm geçmişi, geri alma, medya açıklamaları ve SEO alanlarını destekler. Yapay zekâ özet/taslak/etiket önerisinde kullanılabilir; yayımlama ve test iddiası editör kontrolünde kalır.

İlk içerik paketi önerisi: altı ihtiyaç rehberi, dört karşılaştırma, iki ayrıntılı inceleme, dört editör koleksiyonu, bir haftalık ve bir aylık editör seçkisi. Lansman ayı henüz bitmediyse aylık seçki “bu ay şu ana kadarki editör seçimleri” olarak yayımlanır; tamamlanmış ay sıralaması diye sunulmaz. Bu editör seçkileri trafik veya mağaza zaman serisi birikimine bağlı değildir; seçim gerekçesi ve inceleme kapsamı gerekir.

## 10 Kullanıcı ve topluluk özellikleri

İlk sürümde cihaz içinde favoriler, karşılaştırma sepeti, paylaşma ve yanlış bilgi bildirme bulunur. İkinci aşamada hesap, cihazlar arası favoriler, özel koleksiyonlar, takip edilen geliştiriciler ve tercihe bağlı e-posta bildirimleri eklenir.

İlk lansmanda gizlilik ve veri tercihleri de bulunur: hangi verinin cihazda veya sunucuda tutulduğu, amaçları ve saklama süreleri açıklanır; yerel favorileri ve tercihleri temizleme eylemi sunulur. Bildirim formları gereksiz kişisel bilgi istemez. Analitik/çerez tercihleri seçilen ölçüm yöntemine ve hedef pazar kurallarına göre uygulanır; zorunlu olmayan izleme kapatıldığında temel keşif çalışır. Hesap ve e-posta geldiğinde bu yaşam döngüsüne dışa aktarma, silme ve abonelikten çıkma eklenir. Kesin saklama süreleri ve politika metinleri lansmandan önce belirlenir.

Fiyat alarmı ülke, para birimi, mağaza, plan ve kullanıcı eşiğine bağlıdır. İndirim geçmişi yeterli değilse yüzde indirim iddiası üretilmez. Sürüm, fiyat veya mağazadan kaldırılma olaylarında tekilleştirme ve abonelikten çıkma bulunur.

Açık yorumlar, kullanıcı puanları ve herkese açık koleksiyonlar moderasyon hazır olduğunda açılır. Yeni hesap hız sınırı, raporlama, itiraz, kişisel bilgi temizliği ve tekrar eden spam yönetimi gerekir. Mağaza puanları ile sitemizin topluluk puanları ayrı tutulur.

Geliştirici sahiplenmesi üçüncü aşamadır. Kimlik/alan adı kanıtı ve yetkili hesap gerekir. Geliştirici açıklama düzeltmesi önerebilir; editör değerlendirmesini, topluluk yorumunu veya organik sıralamayı değiştiremez.

## 11 Yönetim ve veri işletimi

Yönetici, editör, yazar, veri operatörü ve moderatör rolleri için ayrı yetkiler tanımlanır. Küçük ekipte bir kişi birden fazla rolü üstlenebilir. Yetki değişikliği ve yayımlama işlemleri kayda alınır.

Panelde aday kabul kuyruğu, toplu kayıt, mağaza URL'sinden aday ekleme, kategori/etiket sözlüğü, eşik profilleri, aile eşleştirme, özellik kanıtları, içerik takvimi, seçki düzenleme, kaynak hataları, eski veri, kaldırılan kayıt ve kullanıcı bildirimi bulunur.

Her alanın kaynağı, gözlem tarihi, ülke/platform kapsamı ve kanıt türü saklanır. Durumlar: mevcut, kaynakta yayımlanmıyor, henüz kontrol edilmedi, geçici olarak alınamadı, uygulanamaz. Çelişen kaynaklar editöre gösterilir. Yenileme işlemi editörün özgün metnini veya doğrulanmış notunu silmez.

İlk önerilen yenileme düzeni:

| Bilgi | Hedef sıklık | Hata halinde davranış |
|---|---|---|
| Aktif mağaza listeleri | Günde bir | Eksik gün işaretlenir; eski sıra yeni tarihli gösterilmez |
| Aktif katalog fiyat/puan/erişim | Günlük | Son başarılı değer ve tarihi korunur |
| Düşük hareketli katalog ayrıntıları | Haftalık | Kuyrukta tekrar deneme ve editör kontrolü |
| Editör özellik değerlendirmesi | Önemli sürüm değişiminde veya en geç 90 günde gözden geçirme | İlgili iddialar güncellik uyarısı alır |
| Fiyat alarmları | Kaynak/bütçe uygunsa günde birkaç kontrol | Anlık fiyat garantisi verilmez |

Kaynak bazında kota, yeniden deneme, artan bekleme, harcama sınırı ve durdurma kontrolü bulunur. Kaynak kesilince tek mağazadaki sorun diğer katalogları durdurmamalıdır. Yedekleme, geri yükleme denemesi ve yayın geçmişi korunur.

Teknoloji yığını bu ürün planında seçilmemiştir. İşlevsel ayrımlar katalog, kaynak alma, günlük gözlemler, arama, sıralama, editoryal içerik ve kullanıcı işlemleridir. Veri pilotundan sonra kodlama ajanı somut uygulama mimarisini seçer.

## 12 Dil ülke erişilebilirlik ve performans

Arayüz dili, içerik dili ve mağaza ülkesi üç ayrı tercihtir. Önerilen başlangıç Türkiye pazarı ve Türkçe içeriktir; metin ve URL yapısı İngilizce içerik eklenmesine uygun kurulur. İngilizce içerik, nitelikli çevirisi hazır sayfalarda açılır. Bu pazar tercihi henüz kullanıcı kararı değildir.

Telefon ve masaüstü keşfi eşit derecede temel kullanım senaryosudur. Filtreler, karşılaştırma, tablo ve mağaza eylemleri her ikisinde de kullanılabilir olmalıdır. Klavye, belirgin odak, ekran okuyucu etiketleri, yeterli kontrast ve azaltılmış hareket desteklenir. WCAG 2.2 AA hedefi gerçek akışlarla doğrulanmalıdır.

Arama için hedef, pilot katalogda gecikmenin kullanıcıyı kesintiye uğratmaması; performans bütçesi için öneri p95 arama yanıtı 500 ms altıdır. Public sayfalar anlamlı ilk içerik, kontrollü görsel boyutu ve kararlı yerleşim sunmalıdır. Ölçülmüş saha sonucu oluşmadan performans rozeti veya başarı iddiası yayımlanmaz.

## 13 SEO ve içerik büyümesi

İndekslenebilir ana sayfa türleri: uygulama, güçlü kategori, seçilmiş ihtiyaç/etiket, editör koleksiyonu, kalıcı karşılaştırma, rehber ve tarihli seçki arşivi. Her filtre kombinasyonu ayrı SEO sayfasına dönüştürülmez.

Başlık, kısa açıklama, canonical, sosyal paylaşım bilgileri, site haritaları ve dil eşleşmeleri yönetilir. Yapılandırılmış veri sayfada görünen gerçek içerikle uyumlu olur. Uygulama, makale ve gezinme türleri uygun yerde kullanılır. Başka mağazaların puanları kaynaklarıyla gösterilebilir; sitemizde toplanmış AggregateRating/değerlendirme gibi işaretlenmez ve mağazalar arasında ortalanmaz. [Google uygulama kılavuzu](https://developers.google.com/search/docs/appearance/structured-data/software-app), [Google değerlendirme kuralları](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)

Bu bölümün ayrıntılı kapsamı [SEO stratejisi](seo/SEO-STRATEGY.md), [sayfa yapısı](seo/SITE-STRUCTURE.md) ve [içerik takviminde](seo/CONTENT-CALENDAR.md) tanımlıdır. FAQ zengin sonucu veya özel AI dosyası ile görünürlük vaadi yapılmaz.

İç aramalar, rastgele karşılaştırmalar ve sınırsız filtre URL'leri için ayrı tarama/indeks politikası belirlenir. Kaliteli editör sayfaları kalıcı URL alır. `robots.txt` ile engellenen bir sayfanın `noindex` bilgisinin okunacağı varsayılmaz. [Google filtreli gezinme kılavuzu](https://developers.google.com/crawling/docs/faceted-navigation)

İçerik başlangıçta gerçek karar sorularını hedefler: aboneliksiz video düzenleme, Windows ve Android'de not eşitleme, çevrimdışı PDF araçları, Türkçe destekli öğrenme araçları. Arama hacmi veya trafik tahmini bu araştırmada ölçülmedi; içerik önceliği ilk kullanıcı aramalarıyla güncellenir.

## 14 Gelir modeli

Öncelik ücretsiz keşif deneyimini ve güveni oluşturmaktır. Sonraki gelir seçenekleri: açık etiketli sponsor koleksiyon/bülten alanı, gerçekten mevcut programlar üzerinden ortaklık bağlantıları, gelişmiş takip ve koleksiyon özellikleri için ücretli üyelik, geliştiricilere katalog sayfası ziyaret/mağaza geçiş raporu.

Sponsorlu yerleşim organik sıralamayı veya editör puanını satın almaz. Her mağaza bağlantısından komisyon kazanılacağı varsayılmaz. Ortaklık programı bulunmayan uygulama da aynı keşif kurallarıyla listelenir. Tıklama verisi indirme veya satış dönüşümü diye raporlanmaz.

İlk aşamada ücretli veri aboneliği zorunlu değildir. Operasyon bütçesi; barındırma, arama, veri sağlayıcı, e-posta, editör zamanı ve görsel lisans kalemleriyle hesaplanmalıdır. Güncel teklif olmadan sabit aylık maliyet veya gelir tahmini verilmez.

## 15 Aşamalar ve teslim koşulları

| Aşama | Çıktı | Tamamlanma koşulu |
|---|---|---|
| F0 Veri ve içerik pilotu | Her mağazadan 30 olmak üzere 90 kayıt; eşleştirme örnekleri; alan/kaynak matrisi | Kaynak erişimi, kullanım koşulları, eksik alanlar, güncelleme ve editör maliyeti anlaşılmış |
| F1 İlk lansman | 120–180 uygulama ailesi, altı kategori, temel keşif ve içerik; iki alanda limit/maliyet, platform farkı, geçiş, iş akışı ve sihirbaz | Her mağazada en az 30 uygun kayıt; genişletilmiş yol haritasındaki lansman kapısı sağlanmış |
| F2 Geri dönüş ve büyüme | Hesap, eşitlenen listeler, fiyat/sürüm takibi, doğal dil arama, yeterli veriyle trendler ve dönem özetleri | Bildirim, maliyet, veri kapsamı ve kötüye kullanım kontrolleri hazır |
| F3 Topluluk ve gelir | Yorum/puan, herkese açık koleksiyon, geliştirici sahiplenmesi, sponsor/üyelik; gerekirse oyunlar ve yeni pazarlar | Moderasyon iş yükü, editoryal bağımsızlık ve ilgili gelir/program koşulları doğrulanmış |

F0'daki 90 mağaza kaydı, üç ayrı mağaza girişinden oluşan bir aile nedeniyle 90'dan az aileye karşılık gelebilir. F1 hedefi ise 120–180 farklı uygulama ailesidir; her ailenin en az bir yayımlanmış mağaza kaydı bulunur. Bir aile birden çok mağazada temsil edilebildiğinden mağaza kayıtlarının toplamı aile sayısından yüksek olabilir. Her mağazada en az 30 kayıt şartı, toplam aile hedefinin yerine geçmez. Kategorilerin yaklaşık dengeli dağılımı önerilir; düşük kaliteli kaydı sırf kota doldurmak için kabul etmeyiz.

Ekip ve kaynaklar bilinmediği için takvim taahhüdü verilmez. İş sırası, paralel yürütülebilecek paketler ve kabul koşulları [yapılacaklar dosyasında](OZELLIKLER_VE_YAPILACAKLAR.md) yer alır.

### Lansman kontrolü

- Her yayımlanmış uygulamada özgün kısa açıklama, kategori, fiyat modeli, en az bir resmi mağaza bağlantısı ve kontrol tarihi var.
- Filtreye konu her olumlu özellik için platform ve kaynak kanıtı var; bilinmeyenler saklanıyor.
- Aynı isimli farklı uygulamalar karışmıyor; aile eşleştirmesi geri alınabiliyor.
- Android indirme bandı iOS/Windows indirmesi olarak gösterilmiyor.
- Ülke değişince eski fiyat veya puan yeni ülkenin verisi gibi kalmıyor.
- 2–4 uygulama karşılaştırması ve yalnız farkları gösterme gerçek kayıtlarla çalışıyor.
- Haftalık/aylık seçki arşivleri var; otomatik dönem listelerinde yeterli gözlem şartı uygulanıyor.
- Editör metinleri veri yenilemesinde korunuyor; yanlış bilgi bildirimi panelde işlenebiliyor.
- Kaynak hata/eksik/eski veri durumları kullanıcıyı yanlış yönlendirmiyor.
- Telefon, masaüstü ve klavye ile arama → karşılaştırma → mağaza akışı tamamlanabiliyor.
- Gizlilik/veri tercihleri, yerel veriyi temizleme, iletişim ve geçerli politika sayfaları erişilebilir.

## 16 Başarı ölçümü

Ana ürün göstergesi, arama veya keşif oturumundan uygun uygulamaya ulaşıp resmi mağazaya geçen kullanıcı oranıdır. Bu oran indirme dönüşümü değildir. Kullanıcıya kısa bir “aradığınızı buldunuz mu” geri bildirimi sunulabilir.

İzlenecek göstergeler: sonuçsuz arama oranı, filtre sonrası sonuç kalitesi, karşılaştırma kullanımı, kaydetme oranı, tekrar ziyaret, rehberden uygulamaya geçiş, eski veri oranı, yanlış bilgi çözüm süresi, kaynak başına maliyet ve uygulama başına editör süresi.

Trafik ve davranış ölçümü oluşmadan büyüme yüzdesi hedefi uydurulmaz. İlk ürün araştırmasında 8–12 kullanıcıyla temel keşif görevleri denenmesi, en az 8/10 görev başarısının çalışma hedefi olması önerilir. Bu bir gerçekleşmiş sonuç değildir.

## 17 Tasarım öncesinde kullanılacak kapsam

Tasarım şablonu; yalnız ana sayfayı değil arama/filtre, uygulama ayrıntısı, karşılaştırma, liste ve arşiv, blog/inceleme, koleksiyon ve yönetim akışlarını taşımalıdır. Ayrıntılı ekran envanteri ve boş/eski/eksik veri durumları yapılacaklar dosyasındadır.

İlk tasarım turu için önerilen kararlar: web önceliği, üç mağazanın ilk sürümde temsil edilmesi, Türkiye/Türkçe başlangıcı, altı kategori, üyelik gerektirmeyen keşif, Android için ayarlanabilir 100 bin+ ana aday profili ve editör istisnası. Bunlar kullanıcı tarafından değiştirilebilir ürün önerileridir.

Tasarımı bekletmeden açık tutulabilecek işler: marka/domain, tam indirme/puan eşikleri, seçilecek veri sağlayıcısı ve ücretli üyeliğin fiyatı. Bu alanlar içerikte gerçekmiş gibi doldurulmaz; tasarım örnekleri temsili veri olarak işaretlenir.
