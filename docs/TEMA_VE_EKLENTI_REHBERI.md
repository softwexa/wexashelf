# Tema ve eklenti rehberi

Galeri dört kurulu tema sunar: **Gece Rotaları** (gece keşfi), **Kobalt Atlas** (kategori atlası), **İş Akışı Haritası** (iş odaklı sıralama) ve **Canlı Katalog** (yatay raflar). Renkler, ana sayfa düzeni, menü yerleşimi ve bölüm sırası birlikte seçilir. Yerel kayıt `src/lib/builtin-themes.ts` içindedir.

`/ayarlar` galerisinde **Temayı kullan** açık kişisel değişikliktir ve bu tarayıcıda saklanır. Yönetim galerisinde **Taslağa al** yalnız önizlemeyi değiştirir; sunucu kaydı için **Sitede etkinleştir** gerekir. Galeri, yalnız kimliğe bakmaz: içeriği değişmiş kurulu tema **Özelleştirilmiş kurulu tema**, farklı kimlikli dosya **İçe aktarılan özel tema** olarak belirtilir.

Küçük önizlemeler ekran görüntüsü değildir; doğrulanmış renk değişkenleriyle çizilen CSS düzenleridir. Yönetici önizlemesi tüm etkin bölümleri tema sırasıyla gösterir; kapalı eklenti katkıları görünmez. `data-template`, `data-layout` ve `data-density` önizlemenin düzenini belirler.

## Tema oluşturma ve içe aktarma

Kobalt JSON dosyasını kopyalayın, alanlarını düzenleyin ve arayüzdeki tema içe aktarma alanından dosyayı seçin. İçe aktarma, `parseThemeManifest(JSON.parse(metin))` sonucunun `ok` alanı doğruysa uygulanmalıdır. Geçersiz JSON ve doğrulama hatası kullanıcıya gösterilmeli; mevcut tema korunmalıdır. Kişisel tercihler tarayıcıda saklanır. Yönetici, doğrulanmış tema verisini site ayarı olarak açıkça etkinleştirebilir; CSS/JavaScript dosyaları yüklenmez ve çalıştırılmaz.

`schemaVersion: 1` korunur. Eski dosyalarda `template` bulunması gerekmez; `getThemeTemplate` eksik değeri `night` olarak yorumlar. Bilinmeyen şablonlar reddedilir. Tema içe aktarma, dışa aktarma ve varsayılana dönme akışları galeriden bağımsız kullanılabilir. Dosya sınırı 32 KB’dir. Yeni seçim, sürmekte olan eski dosya okumasının sonucunu geçersiz kılar.

| Alan | Sözleşme |
| --- | --- |
| `schemaVersion` | Yalnız `1` |
| `id` | Küçük harfle başlayan, küçük harf/rakam/tire içeren 1–64 karakter |
| `name` | Boş olmayan, en fazla 80 karakter |
| `description` | Boş olmayan, en fazla 400 karakter |
| `author` | İsteğe bağlı; varsa boş olmayan, en fazla 120 karakter |
| `template` | İsteğe bağlı: `night`, `atlas`, `workflow`, `catalog`; eksikse `night` |
| `layout` | `sidebar` veya `topbar` |
| `density` | `comfortable` veya `compact` |
| `tokens` | Aşağıdaki sekiz renk alanının tamamı |
| `sections` | 1–6 benzersiz, bilinen bölüm kimliği; dizinin sırası görüntüleme sırasıdır |

Renk alanları: `background`, `surface`, `surfaceRaised`, `foreground`, `muted`, `accent`, `accentContrast`, `border`. Her biri tam olarak `#RRGGBB` biçiminde olmalıdır. Kısa hex, renk adı, CSS fonksiyonu, URL ve CSS kodu kabul edilmez. Bilinmeyen alanlar, sürümler, yerleşimler, bölümler ve tekrar eden bölümler reddedilir. Metinlerde kontrol karakterleri kabul edilmez. Renklerin okunaklı karşıtlığını tema yazarı ayrıca kontrol etmelidir; şema doğrulaması bir erişilebilirlik sertifikası değildir.

Bölümler: `discovery`, `weekly`, `trending`, `toolbox`, `guides`, `workflows`. Bir tema bazı bölümleri dışarıda bırakabilir. `themeToStyle`, doğrulanmış renkleri yalnız sekiz tanımlı CSS değişkenine dönüştürür; geçersiz tema gelirse varsayılan renkleri kullanır.

## Yerel eklentiler

`src/lib/plugins.ts` içindeki güvenilir yerel kayıt, ana sayfa katkılarını yönetir:

| Eklenti kimliği | Katkı |
| --- | --- |
| `decision-tools` | `toolbox` |
| `migration-guides` | `guides` |
| `workflow-collections` | `workflows` |

Üçü de başlangıçta açıktır. `discovery`, `weekly` ve `trending` çekirdek bölümlerdir; eklenti kapatmak bunları kapatmaz. Eklentiyi kapatmak yalnız bölüm katkısını gizler, içerik verisini silmez. Tema sıralaması korunur ve tema tarafından çıkarılan bölüm, eklenti açık olsa da görünmez.

Yeni yerel modül eklemek için geliştirici:

1. Gerekiyorsa `HomeSectionId` listesini ve ana sayfadaki ilgili bölüm bileşenini genişletir.
2. `PLUGINS` listesine benzersiz `id`, `name`, `description`, `version`, `sections` ve `defaultEnabled` alanlarını ekler. Bir bölümün tek sahibi olması önerilir; birden çok sahip varsa açık sahiplerden herhangi biri katkıyı gösterir.
3. `getActiveSections` çıktısının sayfa oluşturma sırasında kullanıldığını doğrular ve etkin/kapalı durumları test eder.

`normalizeEnabledPlugins`, eksik veya yapısal olarak bozuk tercihleri varsayılana döndürür. Geçerli string dizisinde bilinmeyen kimlikleri ve tekrarları temizler. Boş dizi, bütün isteğe bağlı eklentilerin kullanıcı tarafından kapatılmasıdır; varsayılanlara çevrilmez.

Bu mekanizma yerel kaynak koduyla kayıtlı modüller içindir. Uzak JavaScript, `eval`, kullanıcı tarafından yüklenen çalıştırılabilir eklenti, eklenti mağazası, yönetici yetkilendirmesi veya sunucu tarafı güvenlik sınırı sağlamaz. Yeni çalıştırılabilir davranış kaynak değişikliği ve geliştirici incelemesi gerektirir.

## Kontrol

`npx tsx --test tests/extensions.test.ts` komutu; güvenli tema doğrulaması, CSS enjeksiyonu reddi, farklı yerleşim/sıralama, eklenti katkıları ve bozuk tercih geri dönüşünü sınar.

## Site geneli ve kişisel tercihler — 0.2.0

Yönetimde **Site görünümü** sekmesi taslak tema ve modülleri önizler. **Sitede etkinleştir** kaydı SQLite'a yazar; sonraki ziyaretçilerin sunucudan gelen varsayılan görünümü değişir. Revizyon çakışması 409 ile reddedilir, taslak korunur. Site ayarları içerik yedeğine dahildir.

`/ayarlar` ziyaretçinin kişisel tercihidir. Kişisel tema/modül tercihi ancak açık değişiklik sonrası tarayıcıda saklanır; varsayılan ziyaretçiye kendiliğinden kişisel kopya yazılmaz. **Site ayarlarını kullan** kişisel görünüm tercihlerini kaldırır, kaydedilen uygulama ve koleksiyonlara dokunmaz. Önceki sürümün otomatik yazdığı Gece Rotaları/default modül kayıtları site varsayılanını izlemeye taşınır; gerçek özel tercihler korunur.
