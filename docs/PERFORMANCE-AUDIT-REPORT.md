# WexaShelf 0.8.0 — six-theme opening performance

All **10 cases / 20 local lab runs** met the **95+** Performance target: mobile **95–97**, desktop **100**. These are one mobile/desktop pair per case, not repeated-run medians or field Core Web Vitals.

| Case | Mobile | Desktop | Mobile LCP | Mobile TBT | Mobile CLS |
|---|---:|---:|---:|---:|---:|
| gece-rotalari | 97 | 100 | 2.619s | 29.5ms | 0.0452 |
| kobalt-atlas | 97 | 100 | 2.627s | 38.0ms | 0.0452 |
| is-akisi-haritasi | 96 | 100 | 2.707s | 33.0ms | 0.0000 |
| canli-katalog | 97 | 100 | 2.628s | 29.0ms | 0.0452 |
| editorial-desk | 97 | 100 | 2.620s | 19.0ms | 0.0452 |
| compact-directory | 96 | 100 | 2.782s | 62.6ms | 0.0457 |
| night-tr | 95 | 100 | 3.005s | 32.0ms | 0.0000 |
| app | 96 | 100 | 2.697s | 21.5ms | 0.0046 |
| article | 97 | 100 | 2.624s | 26.5ms | 0.0261 |
| list | 96 | 100 | 2.706s | 0.0ms | 0.0309 |

Measured on immutable image `sha256:40568f504f2993e90c6c8e50b0960b1b16b86a24a0d2138873b0b8bea58c1c2f` at `http://127.0.0.1:3173`, using Lighthouse 13.6.0. All 77 measured source hashes match the current source and corresponding runtime files; all 40 raw/summary reports are hash-bound in the private local verification receipt. Each run required the exact HTTP 200 page, successful public bundle and no failed own-origin assets. Original theme settings were restored.

The cohort uses the sample catalog and default module state. It does not measure every possible owner image/module configuration, a 50,000-app catalog, real cPanel hosting, Google indexing or real-user INP. Uploaded-image/private-publication workflows and API 2 modules have separate functional tests. Performance depends on hosting and authored media.

---

The earlier 0.7 results below are historical.

# WexaShelf 0.7.1 — genuine icons and opening performance

The corrected release passed **95+ in all eight cases**, with mobile **95–97** and desktop **100**. The genuine publisher icons were present and successfully loaded. This is one mobile/desktop pair per case, sixteen local lab runs, not repeated-run medians or field Core Web Vitals.

| Case | Page | Mobile | Desktop | Mobile LCP | Mobile TBT | Mobile CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Night routes | `/en` | 97 | 100 | 2.463s | 33.0ms | 0.0452 |
| Cobalt atlas | `/en` | 97 | 100 | 2.474s | 25.5ms | 0.0452 |
| Workflow map | `/en` | 97 | 100 | 2.471s | 21.0ms | 0.0452 |
| Lively catalog | `/en` | 97 | 100 | 2.475s | 25.5ms | 0.0452 |
| Night routes / Turkish | `/tr` | 95 | 100 | 2.921s | 21.0ms | 0.0442 |
| Application detail | `/en/apps/notion` | 96 | 100 | 2.704s | 61.7ms | 0.0046 |
| Article detail | `/en/blog/choose-a-notes-app-for-your-workflow` | 97 | 100 | 2.628s | 22.5ms | 0.0261 |
| List detail | `/en/lists/sourced-starter-picks-2026-11-09-15` | 97 | 100 | 2.621s | 18.0ms | 0.0317 |

Measured on isolated immutable Docker Apache/PHP and MySQL 8.4 at `http://127.0.0.1:3168`, using Lighthouse 13.6.0 between `2026-11-16T12:01:14.657Z` and `2026-11-16T12:03:54.217Z`. Standard mobile simulation and the desktop preset were used; only Performance was measured. Image: `sha256:ce9cbfc5dda0829eceb3ef691c37491813a36c6b14cbe75cc20773965848e97a`.

All sixteen reports have the same 72 measured source hashes, matching the final current runtime source. The set includes the ten actual served app icon files, the background, public bundles and server/resources. Each pair checked unchanged bootstrap/source state, exact final URL, HTTP 200 and successful own-origin assets. The previous theme settings were restored after the cohort. The verification manifest `artifacts/verification/performance-0.7.1-verified.json` binds all 32 raw/summary reports and is local-only evidence, excluded from archives.

The public JavaScript bundle is 553,670 raw bytes; all ten icon WebP/SVG files total 44,248 bytes. Some mobile LCP values exceed 2.5 seconds. TBT is not field INP, and this small synthetic catalog is separate from the historical 50,000-app database benchmark. Actual hosting, devices, content and extensions can change the result.

For reproduction use `scripts/performance-cohort.mjs` with an explicit private synthetic fixture as described in [testing](../documents/TESTING.md). Do not reuse report labels or run against a real owner catalog. Final archive/image binding is separate from these measurement files.

---

The 0.7.0 and earlier records below are historical.

# WexaShelf 0.7.0 — opening performance

Measured on 16 November 2026: **all eight cases met the 95+ Performance target**, with mobile scores **95–97** and desktop **100**. There is one mobile and one desktop run per case, sixteen runs total. These are local lab measurements, not repeated-run medians, field Core Web Vitals or a guarantee for every host.

| Case | Page | Mobile | Desktop | Mobile LCP | Mobile TBT | Mobile CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Night routes | `/en` | 97 | 100 | 2.461s | 47.0ms | 0.0452 |
| Cobalt atlas | `/en` | 97 | 100 | 2.473s | 23.0ms | 0.0452 |
| Workflow map | `/en` | 97 | 100 | 2.474s | 25.0ms | 0.0452 |
| Lively catalog | `/en` | 97 | 100 | 2.554s | 23.0ms | 0.0000 |
| Night routes / Turkish | `/tr` | 95 | 100 | 3.006s | 26.0ms | 0.0000 |
| Application detail | `/en/apps/notion` | 96 | 100 | 2.704s | 58.2ms | 0.0046 |
| Article detail | `/en/blog/choose-a-notes-app-for-your-workflow` | 97 | 100 | 2.624s | 23.5ms | 0.0261 |
| List detail | `/en/lists/sourced-starter-picks-2026-11-09-15` | 97 | 100 | 2.624s | 20.0ms | 0.0317 |

## Measurement and correction

The first 0.7 candidate scored 95 mobile on three themes and 94 on Lively catalog. That failed cohort is retained under `artifacts/performance/release-070-*`; it is not merged with the final results. The visitor bundle included administration translations. Splitting public UI dictionaries from the full administration dictionaries reduced `app.js` from 780,137 to 551,246 raw bytes (29.3%). Runtime language-package delivery uses the same 648 public keys; administrator exports retain all 1,713. A real browser check verified synthetic DE activation, EN/TR/DE navigation, settings rendering and full export before the final audit.

The final cohort ran against isolated Docker Apache/PHP and MySQL 8.4.13 at `http://127.0.0.1:3162`, using Lighthouse 13.6.0 and HeadlessChrome 159.0.0.0 from 06:19:10 to 06:21:46 UTC. Mobile uses Lighthouse's standard simulated network and 4x CPU throttling; desktop uses `--preset=desktop`. Only Performance was measured. This does not claim a Lighthouse SEO score or live indexing.

Each run checked the exact final URL, HTTP 200 document, successful public `app.js`, no failed own-origin assets, and unchanged runtime bootstrap/source fingerprints across its mobile/desktop pair. All 16 reports share 71 measured source hashes. These are selected runtime files, not every repository file. Theme changes were performed through the admin API on a synthetic fixture and the original settings were restored.

After measurement, one unrelated owner API error in `SourceRefresh.php` was changed from an unmapped English literal to its existing localized error key. The public assets, renderers and resources remain byte-identical. The final image and archive binding records this exact delta separately; no new Lighthouse score is claimed for another public build. Machine-readable comparison and 32 report hashes are in `artifacts/verification/performance-final-0.7.0-verified.json`. These local evidence files are excluded from public archives.

## Reproduction and limits

See [testing instructions](../documents/TESTING.md) for the isolated fixture and cohort runner. A single fresh report can be recorded with:

```sh
node scripts/performance-audit.mjs unique-label http://127.0.0.1:3162/en --assert95
```

Some mobile LCP values exceed 2.5 seconds; a 95+ score does not mean every Core Web Vital is good. Lighthouse's TBT is not field INP. Unused-JavaScript/cache/request-chain suggestions remain. Four English home themes, Turkish home and three English details were covered, not every language/theme/page combination. The separate 50,000-app SQL benchmark is a different fixture and is not a 50,000-app Lighthouse result. Actual hosting latency, devices, content, advertisements and extensions can change performance.

---

The records below are historical. Their scores and hashes do not validate the 0.7 runtime.

# WexaShelf 0.6.0 — PHP açılış performansı

16 Kasım 2026. Ölçülen **sekiz sayfa/tema durumunun tamamında mobil Performance 96–98, masaüstü 100**. Dört etkin tema, İngilizce/Türkçe ana sayfa ve İngilizce uygulama/yazı/liste detayları kapsandı. Her durum için bir mobil ve bir masaüstü koşu vardır: toplam 16 koşu. Bunlar tekrarların medyanı, Google CrUX veya bütün hostingler için 95+ garantisi değildir.

## Güncel ölçüm kapsamı

| Tema | Sayfa | Mobil | Masaüstü | Mobil LCP | Mobil TBT | Mobil CLS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Gece Rotaları | EN ana sayfa `/en` | 97 | 100 | 2,484 sn | 51 ms | 0,0452 |
| Gece Rotaları | TR ana sayfa `/tr` | 96 | 100 | 2,772 sn | 41 ms | <0,0001 |
| Gece Rotaları | `/en/apps/notion` | 97 | 100 | 2,555 sn | 57,85 ms | 0,0046 |
| Gece Rotaları | `/en/blog/choose-a-notes-app-for-your-workflow` | 98 | 100 | 2,468 sn | 17,5 ms | 0,0261 |
| Gece Rotaları | `/en/lists/sourced-starter-picks-2026-11-09-15` | 97 | 100 | 2,556 sn | 16 ms | 0,0317 |
| Kobalt Atlas | EN ana sayfa `/en` | 97 | 100 | 2,472 sn | 21 ms | 0,0452 |
| İş Akışı Haritası | EN ana sayfa `/en` | 97 | 100 | 2,554 sn | 29 ms | <0,0001 |
| Canlı Katalog | EN ana sayfa `/en` | 97 | 100 | 2,555 sn | 22 ms | <0,0001 |

Masaüstü LCP aralığı 0,538–0,604 saniye, TBT bütün koşularda 0 ms. Mobilde bazı LCP ölçümleri 2,5 saniyeyi aşıyor; 95+ Performance sonucu, bütün Core Web Vitals değerlerinin “iyi” olduğu anlamına gelmez. Bu Lighthouse koşuları INP alan verisi sağlamaz; TBT, INP yerine sunulmaz. Tablonun kapsamı bütün dil × tema × sayfa birleşimleri değildir.

## Ortam ve geçerlilik kontrolleri

Hedef, izole sentetik katalogla çalışan yerel PHP/Apache ortamı `http://127.0.0.1:3157` idi. Lighthouse CLI **13.6.0**, raporlanan HeadlessChrome **159.0.0.0** ile 16 Kasım 2026 **04:05:41–04:10:15 UTC** arasında çalıştı. Mobil profil: 412 × 823, 4× CPU yavaşlatma ve Lighthouse mobil ağ simülasyonu. Masaüstü profil: `--preset=desktop`, 1350 × 940 ve 1× CPU. Yalnız Performance kategorisi ölçüldü; yerel noindex davranışından SEO kategori puanı çıkarılmadı.

- Bütün ham Performance puanları yuvarlama öncesinde de en az 95; çalışma hatası veya uyarı yok.
- Her koşunun son URL’si istenen URL ile aynı; ana belge HTTP 200 ve ziyaretçi `app.js` isteği başarılı. Lighthouse’ın kaydettiği aynı-origin isteklerinde ağ/HTTP 4xx/5xx hatası yok.
- 16 rapordaki **65 ölçülen kaynak dosyasının SHA-256 değerleri aynı** ve rapor hazırlanırken mevcut dosyalarla eşleşiyor. Bu sayı bütün deponun veya bütün dağıtım dosyalarının denetlendiği anlamına gelmez.
- Denetleyici her mobil/masaüstü çiftinin öncesi/sonrasında kaynak ve sunucu bootstrap durumunu karşılaştırır; değişiklik varsa koşuyu reddeder. Her çiftin özetinde aynı runtime hash’i ve 17 katalog kaydı bulunur.
- Varsayılan eski tema manifestinde `template` alanı bulunmadığı için Gece Rotaları raporlarında `runtime.template: null` yer alır; `getThemeTemplate` bunu `night` olarak çözer. Diğer üç temanın adları runtime kaydında açıkça bulunur. Kohort betiği bu temaları gerçek yönetim API’siyle sırayla seçer ve sonunda özgün site görünümünü geri yükler.

Toplu doğrulama ve 32 ham/özet rapor hash’i: cohort-0.6.0-verified.json (local-only: `artifacts/performance/cohort-0.6.0-verified.json`). Yedi ek durumun tamamlanma kaydı: cohort-0.6.0-progress.json (local-only: `artifacts/performance/cohort-0.6.0-progress.json`). EN Gece Rotaları çifti ayrı olarak 060-night-en (local-only: `artifacts/performance/060-night-en/mobile-summary.json`) altında tutulur. Diğer klasörler `060-night-tr`, `060-night-app`, `060-night-article`, `060-night-list`, `060-atlas-en`, `060-workflow-en`, `060-catalog-en`; her birinde `mobile.json`, `desktop.json` ve iki özet bulunur.

## Tekrarlama ve kalan sınırlar

Hazır izole PHP ortamında, benzersiz bir etiketle:

```sh
node scripts/performance-audit.mjs yeni-060-olcum http://127.0.0.1:3157/en --assert95
```

Araç, `artifacts/performance/tooling` altındaki Lighthouse kurulumunu ve yerel Playwright Chromium’u kullanır. Aynı etiket önceki raporu değiştirir. Çok temalı koşucu `artifacts/performance/run-060-cohort.mjs` test sitesinin görünümünü geçici değiştirdiği için yalnız izole QA veritabanında kullanılmalıdır.

Lighthouse kullanılmayan JavaScript, önbellek ömrü ve ağ bağımlılık zinciri önerilerini raporlamaya devam ediyor. Mevcut ölçülen kapsam 95+ hedefini karşılıyor. Gerçek hosting/CDN/gecikme, daha büyük katalog, farklı cihazlar, reklamlar veya eklenen modüller bu koşulları değiştirebilir; aynı sonuç bunlar için doğrulanmış değildir.

İsteğe bağlı ziyaretçi performans toplayıcısının gerçek PHP/MySQL akışı ayrıca yerel RUM kaydıyla (local-only: `artifacts/growth-qa/receipts/performance-rum-php-mysql.json`) doğrulandı. O kayıt sentetik yerel tarayıcı etkinliğidir; test sonunda toplama kapatıldı. Üretim ziyaretçisi, Google CrUX veya saha Core Web Vitals sonucu değildir.

---

Aşağıdaki 0.5.1 kaydı tarihsel olarak korunmuştur. Eski üç tekrarın medyanı ve eski dosya sayıları 0.6.0 ölçümleriyle birleştirilmez.

## Tarihsel 0.5.1 — ana sayfa performansı

> **0.5.1 tarihinde doğrulanan sonuç:** Varsayılan Gece Rotaları ana sayfası altı ardışık bağımsız koşuda mobil **98/96/96**, masaüstü **100/100/100** aldı. İkon/favikon hataları giderildi; kaynak durumları ve dosya hashleri doğrulandı. Daha eski koşular eksik ikon/favikon nedeniyle yalnız tanısaldır ve geçerli sonuç yerine kullanılmaz.

### Tarihsel yöntem

Gerçek Lighthouse CLI 13.6.0, Playwright Chromium 1255 ile PHP/Apache ana sayfasında çalıştırıldı. Yerel hedef `http://127.0.0.1:3152/`; Docker imajı `wexashelf:0.5.0-php`, canlı kaynak bind mountları `php/app`, `php/public`, `php/resources`. Ana sayfa mevcut sentetik QA kataloğunu okur; performans ölçümü katalog yazmaz ve AI sağlayıcısı çağırmaz.

Mobil koşu Lighthouse varsayılan mobil simülasyonunu, masaüstü koşu `--preset=desktop` profilini kullanır. İki profil ardışık çalışır. Raporlar Lighthouse tam JSON, yapılandırma/ortam bilgileri ve özet JSON olarak `artifacts/performance/{etiket}/` altındadır. Yerel laboratuvar ölçümüdür; canlı hosting veya gerçek kullanıcı Core Web Vitals kanıtı değildir.

Tekrar çalıştırma:

```sh
npm install --prefix artifacts/performance/tooling --no-audit --no-fund lighthouse@13.6.0
node scripts/performance-audit.mjs yeni-olcum http://127.0.0.1:3152/ --assert95
```

Aynı etiketi tekrar kullanmak önceki dosyaları değiştirir; sonraki koşular için farklı etiket kullanın. Üretim bağımlılıkları değişmez. Özel QA yapılandırması ve Lighthouse araç bağımlılıkları artifacts altında kalır; kaynak paketine özel veri olarak eklenmez.

### Önceki tanısal taban ölçümü (eksik ikonlar nedeniyle kabul kanıtı değil)

| Profil | Performance | FCP | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobil | 63 | 0,8 sn | 8,9 sn | 470 ms | 0 | 2,5 sn |
| Masaüstü | 95 | 0,2 sn | 1,6 sn | 0 ms | 0 | 0,4 sn |

LCP öğesi `.hero` bölümünün `night-landscape.png` arka planıdır. Görsel 1.359.111 bayt; Lighthouse modern sıkıştırmayla yaklaşık 1.096.886 bayt tasarruf tahmin eder. LCP görseli ilk HTML’den keşfedilemiyor ve yüksek indirme önceliği yok. Önbellek süreleri, kullanılmayan JS/CSS ve mobil ana iş parçacığı yükü de raporlandı. Bu tahminler ölçüm aracının önerileridir; değişiklik sonrası gerçek skor ayrıca ölçülmelidir.

### 0.5.1 için geçerli ölçüm

Kapsam **varsayılan Gece Rotaları temasının açılış ana sayfasıdır**. Diğer temalara bu skor atanmaz. `/assets/icons` üzerinden ikonlar ve açık favikon bağlantısı düzeltildikten sonra aşağıdaki üç bağımsız mobil/masaüstü çifti ardışık çalıştırıldı. Altı koşunun tamamı ham puan üzerinden `--assert95` kontrolünü geçti.

| Son koşu | Mobil puan | Masaüstü puan | Mobil LCP | Mobil TBT | Masaüstü LCP |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 98 | 100 | 2,464 sn | 17 ms | 0,657 sn |
| 2 | 96 | 100 | 2,709 sn | 10 ms | 0,569 sn |
| 3 | 96 | 100 | 2,711 sn | 9 ms | 0,568 sn |

Mobil FCP yaklaşık 0,756 sn, CLS 0–0,034; masaüstü FCP 0,206–0,265 sn, TBT 0 ms, CLS 0–0,024. Mobil LCP medyanı yaklaşık 2,7 saniyedir; Performance 95+ sonucu tüm Core Web Vitals alan ölçümlerinin “iyi” olduğu anlamına gelmez. INP ölçülmedi; TBT laboratuvar metriğidir ve INP yerine sunulmaz.

Her koşu tam hedef URL ve HTTP 200 ana belgeyi, başarılı `app.js` isteğini ve kaydedilen bütün aynı-origin kaynak isteklerini denetledi: ağ hatası/HTTP 4xx/5xx yok. Kaynak/PHP, JS/CSS, hero, favicon, ikon eşleme dosyası ve bütün sunulan ikonlar için başlangıç/bitiş SHA-256 eşleşti; altı koşuda aynı dosya hashleri kullanıldı. Lighthouse çalışma hatası veya eksik puan başarılı sayılmaz.

Tam raporlar `artifacts/performance/final-valid-1`, `final-valid-2`, `final-valid-3`; kaynak SHA-256 ve koşu kayıtları `artifacts/performance/final-valid-cohort.json` içindedir. `.seo-cache/pages/home/performance.json` o tarihteki medyan metrikleri ve kalan önerileri içerir. Eski `final-cohort.json` kaydı geçersiz olarak korunmuştur; `baseline`, `iteration1`, `final-1/2/3` ve `verified-assets-1/2` önceki tanısal koşular son teslim kanıtı değildir.

Kalan Lighthouse önerileri kullanılmayan JavaScript, önbellek seçenekleri ve CSS/bağımlılık zincirini kapsar. Hedef karşılandı; puanı yükseltmek için ürün işlevleri kaldırılmadı. Lighthouse **Performance** kategorisi ölçüldü; yerel ortamın beklenen noindex davranışından bir SEO kategori puanı türetilmedi. Canlı hosting veya gerçek kullanıcı trafiği ayrıca ölçülmelidir.
