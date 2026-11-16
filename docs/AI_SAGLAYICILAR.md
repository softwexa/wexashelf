# Yapay zekâ sağlayıcıları

API anahtarları PHP tarafında tutulur; istemciye yalnız yapılandırma ve anahtarın mevcut olup olmadığı döner. Anahtar, model veya uç nokta değişikliği canlı sağlayıcı erişimi doğrulaması değildir. Üretimler taslaktır; kullanıcı önizlemeden sonra uygular. Kaynak kaydı üretim sırasında değişmişse eski taslak uygulanmaz.

OpenAI metin ve görsel için Responses API `background: true` kullanır. PHP kısa başlatma isteğinden sonra iş tanıtıcısını saklar; tarayıcı sonucu sorgular. `store: false` ile arka plan yanıtı sağlayıcıda yaklaşık on dakika erişilebilir; sekmeyi uzun süre kapatmak sonucu kaybettirebilir. Başlatma ve sorgu zaman aşımı 15 saniyedir. Varsayılan metin modeli `gpt-5.6-luna`, görsel aracı modeli `gpt-image-2.5-flare` olarak seçildi. Model alanları düzenlenebilir; erişim yoksa farklı modele sessiz geçiş yapılmaz. Görsel isteği tek PNG, 1536×1024, düşük kalite ayarı kullanır. Gerçek uygulama ekranı veya logosu üretildiği iddia edilmez.

`compatible` protokolü, HTTPS temel adresine `/chat/completions` ve görsel açıkken `/images/generations` ekler. Sağlayıcı katı JSON şemasını, görsel için `b64_json`, tek görsel ve istenen boyutu desteklemelidir. Yalnız metin kullanan sağlayıcıda görsel kapatılabilir. Metin 35, görsel 55 saniye ile sınırlıdır; cPanel/proxy sınırı daha kısa olabilir. URL döndüren görsel yanıtları indirilmez. Bu protokolde uzun süren görsel servisleri uygun olmayabilir.

Ağ hatası sonrası gönderimin kabul edilip edilmediği belirsiz olabilir. Otomatik üretim tekrarı yapılmaz; yeni üretim ek ücret doğurabilir. Sağlayıcının kota, model erişimi, faturalama ve içerik kuralları ayrıca geçerlidir. Kullanım bilgisi varsa saklanır; ücret tahmini veya ödeme doğrulaması değildir.

Güvenlik: yalnız HTTPS/443, kullanıcı bilgisi/sorgu/parça içermeyen alan adları; OpenAI adresi sabit. Her gerçek istekte A/AAAA kayıtları doğrulanır, özel/ayrılmış ağlar engellenir ve seçilen IP cURL DNS sabitlemesi ile kullanılır. Yönlendirme ve ortam proxy'si kapalıdır. Yanıt üst sınırı metinde 2 MB, görsel/sorguda 20 MB. API hata gövdeleri ve anahtarlar kullanıcı hatalarına yansıtılmaz. Bağlantı sınırı 5 saniyedir. Test transport'u yalnız PHP kurucusuna kod içinden verilen closure'dır; HTTP/env test anahtarı yoktur.

Üretim girdisi seçilen sunucu kayıtları ve kullanıcının kısa açıklamasıdır. Kaynak içerik talimat olarak kabul edilmez. İstemler desteklenmeyen fiyat, ölçüm, test, ödül ve atıf uydurmayı yasaklar; şema ve uzunluk denetimi uygulanır. Bu kurallar doğruluğu garanti etmez: yayın öncesi editör kontrolü gerekir.

## Doğrulama

`php php/tests/ai-provider.php` gerçek ücretli çağrı yapmadan transport sözleşmesini, arka plan parametrelerini, IP engellemeyi ve çıktı ayrıştırmayı doğrular. Canlı API anahtarı, sağlayıcı hesabı ve cPanel ortamı ile uçtan uca üretim ayrıca doğrulanmalıdır.

## Resmî kaynaklar (16 Kasım 2026)

- [Background mode](https://developers.openai.com/api/docs/guides/background.md)
- [Image generation](https://developers.openai.com/api/docs/guides/image-generation.md)
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs.md)
- [GPT-5.6 Luna model ve araç desteği](https://developers.openai.com/api/docs/models/gpt-5.6-luna.md)

Bu seçim 2.5 Flare'ın Responses araç alanında belgelenmesine dayanır; 2.6 ailesi sayfada Image API özellikleriyle ayrıca anlatılır. İleride model değiştirilirken ilgili sağlayıcının sözleşmesi tekrar kontrol edilmelidir.

Uyumlu Images API isteğinde `gpt-image-*` ve `chatgpt-image-latest` için `output_format: png` kullanılır; bu modeller zaten base64 döndürdüğünden desteklenmeyen `response_format` gönderilmez. Diğer model adlarında eski uyumlu servis sözleşmesi için `response_format: b64_json` istenir. Özel model takma adları kullanan sunucu bu parametreyi desteklemelidir; uygulama başarısız isteği farklı parametreyle yeniden göndermez. [Resmî Images API alanları](https://developers.openai.com/api/reference/resources/images/methods/generate.md).

## Grounded analysis, translation drafts and estimated budgets

The existing explicit admin generation action also accepts `claims`, `brief`, `qa`, `impact` and `translation`. Claims/Q&A/briefs are analysis results, not directly applicable editorial records. Reference identifiers must match selected server records and field paths. This validates reference existence; editors must still verify that the generated statement follows from its evidence. Impact receives actual earlier saved source revisions and requires an explicit update-draft confirmation. Missing historical evidence is a limitation, not a fabricated change.

`targetLocale` defaults to English. Turkish remains the legacy canonical source language. Non-source drafts require an existing record and the current translation revision. Applying them requires `destination: translation` and returns only a translation field/SEO patch for normal editor review and saving. The source editor cannot receive an English patch. The full translation task preserves the exact existing field set; it does not add product claims or change identifiers. New article structure and cover attachment use the source editor; localized article text uses translation drafts.

Settings support an optional USD daily monetary budget and administrator-configured input/output token and image-request prices. No live price, exchange rate or invoice is inferred. Before a call, the service reserves an estimate using a conservative UTF-8 input bound, schema/framing allowance and the 6,000 output-token maximum. Unknown configured prices reject budgeted calls; earlier unpriced jobs in that UTC day also prevent a falsely complete budget calculation. Pending, uncertain and failed jobs retain reservations conservatively. Completed jobs with provider token usage settle to an estimate using the saved configured prices. These are local estimates, not provider billing guarantees. Daily request-count limits and idempotency remain active.

Offline verification: `php/tests/ai-grounding.php`, `php/tests/ai-provider.php` and the isolated synthetic database `php/tests/ai-service.php` cover reference/translation validation, price uncertainty, reservation/settlement, locale apply isolation, request deduplication, stale source revisions, timeout uncertainty and pre-call budget rejection. No real provider request is needed for these tests.

OpenAI image requests cap built-in tool calls at one (`max_tool_calls: 1`), matching the single-image reservation. Contract reference: [Responses create API](https://developers.openai.com/api/reference/python/resources/responses/methods/create). Compatible image requests retain `n: 1`.
