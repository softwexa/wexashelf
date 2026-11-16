# İlk web deneyimi brief’i — 02 Gece Rotaları

Bu belge ilk tasarım kararlarının kaydıdır. Sonraki geliştirmede ilk tema, JSON tema sözleşmesi, üç yerel modül ve yönetim paneli uygulanmıştır. Güncel kapsam: [Uygulama durumu](UYGULAMA_DURUMU.md).

Bu brief, ilk çalışan web deneyimi için seçilen **02 Gece Rotaları** görsel referansına dayanır. Amaç, üç mağazadaki uygulamaları keşfetme, karşılaştırma ve doğru mağazaya geçme akışını tek bir ana sayfada anlaşılır kılmaktır. Bu belge kod, teknik mimari, kütüphane veya template/plugin uygulama kararı değildir; bu kararlar ayrı teknik sahiplikte seçilecektir.

Bu çalışma bütün ürün planının tamamlandığı anlamına gelmez. İlk teslimat, çalışan ilk web deneyimidir. Daha sonra aynı içerik ve veri sözleşmesini koruyarak 01 Kobalt Atlas, 09 İş Akışı Haritası ve 10 Canlı Katalog gibi temaların hızlı yüklenebilmesi ve tema/eklenti yönünün değerlendirilmesi istenir. Bunun nasıl uygulanacağı burada belirlenmez.

## Görsel referans okuması

Referans görselde sol tarafta kalıcı koyu gezinme rayı, üstte geniş arama ve üç platform seçicisi, ortada editoryal karşılaştırma hero’su, altında popüler uygulamalar/trend/seçki ve sağ destek kartları bulunuyor. Alt bölümde geçiş rehberleri ile iş akışları ayrı ama eşit ağırlıklı keşif yüzeyleri olarak duruyor. Koyu lacivert zemin, turkuaz vurgu ve açık metin; “gece rotası” metaforunu dekoratif bir arka plan olmaktan çıkarıp gezinme hiyerarşisine bağlıyor.

## Uygulanırken korunacak 8 tasarım özelliği

1. **Sol navigasyon rayı:** Keşfet, Karşılaştır, Listeler, Rehberler ve Kaydedilenler ana görevleri sürekli görünür olmalı; hızlı erişim bölümü editör seçkisi, ücretsiz planlar, platform farkları, iş akışları ve geçiş rehberlerine bağlanmalı.
2. **Arama ilk ekran eylemi:** “Uygulama veya ihtiyaç ara” alanı üst bölgede ve yüksek kontrastta kalmalı; kullanıcı uygulama adı bilmese de iş/niyet arayabilmeli.
3. **Üç platformun eşit statüsü:** Android, iOS ve Windows seçimleri tek bir platform bandında yan yana görünmeli. Bir platform varsayılan olarak diğerlerinden daha önemli hissettirilmemeli.
4. **Editoryal karşılaştırma hero’su:** Hero, yalnız tanıtım değil, iki aday arasındaki karar eylemini göstermeli. “Karşılaştır” ve “Kaydet” eylemleri aynı bağlamda bulunmalı.
5. **Yoğun ama katmanlı katalog:** Popüler uygulamalar ve haftanın seçkisi liste olarak; ücretsiz planlar ve platform farkları kısa destek kartları olarak ayrılmalı. Her bölüm aynı kart şablonunu tekrar etmemeli.
6. **Trend dilinde kanıt sınırı:** “Trend uygulamalar” bölümü ancak gerçek, tarihli site etkileşimi oluştuğunda bu adla kullanılmalı; başlangıçta editör seçkisi veya “inceleme kuyruğundaki adaylar” gibi dürüst bir ad kullanılmalı.
7. **Alt keşif rotaları:** Geçiş rehberleri ve iş akışları ana katalogdan kopuk blog bağlantıları değil, kullanıcıyı bir uygulamadan diğerine veya bir görevden uygulama setine götüren karar yolları olmalı.
8. **Gece temasının okunabilirliği:** Koyu yüzeylerde açık metin, turkuaz eylem ve sakin ikincil çizgiler korunmalı; kart sayısı arttırılarak kontrast ve taranabilirlik bozulmamalı.

## Desktop → mobile ürün davranışı

- Desktop’ta sol ray sürekli görünür; mobile’da aynı bilgi hiyerarşisi üstte kompakt menü ve yatay hızlı erişim olarak yeniden düzenlenir. Sol rayın daraltılmış bir minyatürü zorunlu değildir.
- Arama mobile’da ilk görünür ana eylem olarak kalır; platform seçimi aramanın altında yatay kaydırılabilir veya iki satırlı seçim olabilir. Android, iOS ve Windows’un üçü de ilk etkileşimde erişilebilir olmalı.
- Desktop hero’sundaki iki aday yan yana kartları mobile’da dikey karşılaştırma kartlarına dönüşür; karşılaştırma çağrısı ve kaydetme eylemi görünür kalır.
- Popüler/trend ve haftanın seçkisi desktop’ta kolonlar, mobile’da sıralı bölümler olur. İçerik sırası korunur: arama → platform → adaylar → karar destekleri.
- Ücretsiz planlar ve platform farkları desktop’ta sağ destek kartları; mobile’da ana listeden sonra açılan tam genişlikli kartlar olur. Bu bilgiler yalnızca görselde sağ kolona hapsedilmez.
- Geçiş rehberleri ve iş akışları desktop’ta iki kolon, mobile’da ardışık bölümler olur. Her kartın başlığı ve hedefi tek bakışta anlaşılır kalır.
- Kaydetme, karşılaştırmaya ekleme, filtre ve mağazaya gitme eylemleri mobile’da en az dokunma alanı ve net geri dönüş ile sunulur; yoğun liste yatay taşmaya zorlanmaz.
- Mobile’da tema atmosferini korumak için dekoratif dağ/gece yolu alanı küçültülebilir; arama ve karar içeriği dekorasyondan önce gelir.

## İlk ana sayfada gerçekten çalışması gereken 5 etkileşim

1. **Arama:** Uygulama adı, yayıncı, kategori veya ihtiyaç ifadesiyle sonuç sayfasına gitme; sonuç yoksa aktif ölçütleri koruyan açıklama.
2. **Platform seçimi:** Android, iOS ve Windows arasında seçim yapma; seçim sonuçları ve mağaza bağlantısını etkiler, arayüz dilini veya ülkeyi sessizce değiştirmez.
3. **Karşılaştırma başlatma:** Hero veya uygulama kartından 2–4 adayı karşılaştırma sepetine ekleyip karşılaştırma sayfasına geçme.
4. **Kaydetme:** Hesap açmadan cihaz içi kaydetme; kaydedilen adayın tarayıcı verisiyle sınırlı olduğu açıkça belirtilir.
5. **Karar desteklerine geçiş:** Ücretsiz planlar, platform farkları, geçiş rehberleri, iş akışları, koleksiyonlar, blog ve Top List bağlantıları gerçek hedef sayfalara gider; sahte veya boş eylem kullanılmaz.

Ana sayfada ayrıca her uygulama kartındaki resmi mağaza bağlantısı çalışmalıdır. Mağazaya geçiş tıklaması indirme veya satın alma gerçekleştiği anlamına gelmez.

## Temsili metinlerin gerçek veri gelince değişmesi

Referans görseldeki ürün adları ve açıklamalar yalnızca konsepttir. İlk veri/katalog doğrulaması tamamlanmadan aşağıdaki metinler gerçek iddia gibi yayımlanmaz:

- **Hero:** “Notion ve Obsidian’ı karşılaştır” gibi aday çağrı, doğrulanmış uygulama ailesi ve güncel sayfalarla değiştirilir; aile eşleşmesi yoksa iki ayrı ürün olarak gösterilir.
- **Popüler uygulamalar:** “Popüler” ifadesi yalnızca açıklanmış kaynak ve tarih varsa kullanılır; başlangıçta “Katalog adayları” veya editör seçkisi kullanılabilir.
- **Trend uygulamalar:** Site içi yeterli ve geçerli etkileşim oluşmadan “trend” denmez; bunun yerine “Bu haftanın editör incelemesi” gibi kanıt sınırı belli bir başlık seçilir.
- **Ücretsiz planlar:** “Ücretsiz plan” etiketi, ücretsiz indirme ile ücretsiz temel kullanım ayrıştırılarak; deneme, reklam, IAP, kota ve abonelik durumu kaynak tarihiyle gösterilir.
- **Platform farkları:** Android/iOS/Windows ikonlarının yanında özellik işaretleri ancak platforma ait kaynakla desteklenirse görünür; bilinmeyen değer 0, yok veya başarısız diye yorumlanmaz.
- **Geçiş rehberleri:** “Evernote’tan Notion’a geçiş” gibi bağlantılar uygulanabilirlik ve aktarım kanıtı doğrulanmadan yayınlanmaz; aday konu olarak kalabilir.
- **İş akışları:** Uygulama kombinasyonları gerçek entegrasyon veya veri geçişi kanıtlanmadan “çalışan akış” diye sunulmaz; önce “aday iş akışı” veya editoryal öneri olarak etiketlenir.
- **Koleksiyon, blog ve Top List:** Başlık, seçim ölçütü, dönem, yazar ve kaynak bilgisi olmadan “en iyi” veya “en popüler” dili kullanılmaz.

## İçerik modeli ve tema değişebilirliği

01 Kobalt Atlas, 09 İş Akışı Haritası ve 10 Canlı Katalog beğenilen alternatif yönlerdir. Gelecekte bu temalar seçilse bile içerik omurgası aynı kalabilmelidir: uygulama ailesi, mağaza kayıtları, platform/ülke kapsamı, fiyat-plan alanları, kaynak/tarih, karşılaştırma, geçiş, koleksiyon, blog ve liste türleri.

Değişebilecek olan; bu içeriklerin yerleşim metaforu ve sunum ritmidir:

- 02 Gece Rotaları: yan navigasyon ve karar rotaları.
- 01 Kobalt Atlas: arama merkezli açık keşif ve asimetrik içerik.
- 09 İş Akışı Haritası: görevden uygulama setine bağlanan akış grafiği.
- 10 Canlı Katalog: yatay katalog rafları ve görsel keşif.

Bu brief, temaların aynı içerik kalıbıyla farklı yerleşimlerde çalışabilmesini ister; ortak içerik kalıbının teknik template veya eklenti mimarisi burada tanımlanmaz.

## İlk teslimatın sınırı

İlk teslimat yalnızca çalışan ilk web deneyiminin ürün akışıdır: ana sayfa, arama/sonuç, uygulama ayrıntısı, karşılaştırma, resmi mağazaya geçiş, cihaz içi kaydetme ve karar desteklerine bağlantı. 125 maddelik planın tamamlandığı, tüm veri kaynaklarının bağlandığı, tüm kategorilerin eksiksiz işletildiği veya müşteri hazır olduğu iddia edilmez.

Başarı ölçütü ilk aşamada; kullanıcının bir ihtiyaçtan aramaya, platform seçimine, aday karşılaştırmasına ve resmi mağazaya geçişe kadar akışı anlayabilmesidir. Gerçek trafik, sıralama, indirme veya kullanıcı sayısı bu konsept görselden çıkarılamaz.
