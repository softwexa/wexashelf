# Editoryal başlangıç verisi kaynakları

Kontrol tarihi: **2026-11-15**. Bu dosya `docs/editorial-seed.json` içindeki başlangıç verisinin kaynak günlüğüdür. Sayfalardaki plan, ülke, sürüm veya platform kapsamı değişebilir; yayın öncesi yeniden kontrol gerekir. Hiçbir kayıt fiziksel cihaz testi, mağaza sıralaması veya kullanıcı sayısı kanıtı olarak kullanılmamalıdır.

## Resmi birincil kaynaklar

- **Obsidian fiyatlandırma:** https://obsidian.md/pricing.html — ücretsiz çekirdek uygulama, kayıt gerektirmeme, isteğe bağlı Sync/Publish ve fiyatlandırma.
- **Obsidian cihazlar arasında eşitleme:** https://obsidian.md/help/Getting%20started/Sync%20your%20notes%20across%20devices — yerel dosya, çevrimdışı erişim ve Windows/iOS/Android için önerilen Sync sistemleri.
- **Obsidian ekip dağıtımı:** https://obsidian.md/help/teams/deploy — yerel uygulama ve çevrimiçi/çevrimdışı çalışma açıklaması.
- **Obsidian içe aktarma:** https://obsidian.md/help/import — Markdown dosyaları ve uygulamalar arası aktarım bağlamı.
- **Obsidian yedekleme:** https://obsidian.md/help/backup — eşitlemenin tek başına yedek olmadığı uyarısı.
- **Notion fiyatlandırma:** https://www.notion.com/pricing — Free plan, fiyat birimi, dosya yükleme ve çevrimdışı plan tablosu.
- **VideoLAN VLC ürün sayfası:** https://images.videolan.org/vlc/index.en_GB.html — yerel dosya oynatma, Windows/iOS/Android dağıtımı, ücretsiz ve reklamsız beyanı.
- **VideoLAN VLC Android:** https://images.videolan.org/vlc/download-android.html — Android'de video/ses dosyası oynatma.
- **AntennaPod ana sayfa:** https://antennapod.org/ — Android odağı, indirme/çevrimdışı dinleme ve reklam eklememe.
- **AntennaPod About:** https://antennapod.org/about/ — tamamen ücretsiz, reklamsız ve veri dışa/içe aktarma bağlamı.
- **AntennaPod reklam açıklaması:** https://antennapod.org/documentation/general/ads — uygulama reklamı ile yayıncı bölümündeki reklamın ayrımı.
- **AntennaPod gizlilik:** https://antennapod.org/privacy/ — uygulama verilerinin yerel tutulması, reklam/tracking kütüphaneleri ve isteğe bağlı servis kimlik bilgileri.
- **AntennaPod yedekleme:** https://antennapod.org/documentation/general/backup — veritabanı ve OPML dışa aktarma, kayıp alanları.
- **AntennaPod senkronizasyon:** https://antennapod.org/documentation/general/synchronization — ayrı sunucu/hesap gerektiren senkronizasyon yolları.
- **Adobe Acrobat plan karşılaştırması:** https://www.adobe.com/acrobat/pricing/compare-versions.html — ücretsiz Reader ile Standard/Pro/Studio kapsam ayrımları.
- **Adobe Acrobat planları:** https://www.adobe.com/acrobat/plans — plan, aylık/yıllık ödeme ve PDF görev kapsamı.
- **Todoist fiyatlandırma:** https://www.todoist.com/pricing?lang=en — Beginner/Pro/Business, faturalama dönemi ve limitler.
- **TickTick yükseltme:** https://ticktick.com/upgrade?language=en_us — Free/Premium ve resmi limit/özellik karşılaştırması.

## Kaynak arama notları

Araştırmada yalnız yayıncının kendi alan adındaki fiyat, yardım, gizlilik ve ürün sayfaları birincil kanıt kabul edildi. Arama sorguları; `site:obsidian.md pricing free Sync official`, `site:obsidian.md/help local files offline`, `site:antennapod.org ad-free account`, `site:videolan.org/vlc official local files Android iOS Windows`, `site:notion.com/pricing Free`, `site:todoist.com/pricing`, `site:ticktick.com/about/upgrade` ve `site:adobe.com/acrobat/pricing` biçimindeydi. Arama sonuçları yalnız ilgili resmi sayfayı bulmak için kullanıldı; özellik, fiyat veya platform iddiası sayfa metninde görülen kapsamı aşmayacak şekilde yazıldı.

## Editoryal sınırlar

- `evidence: publisher`, geliştiricinin yayımladığı beyanı gösterir; fiziksel test yapılmadı.
- AntennaPod `account-free` mutlak destek değil, **limited** olarak tutuldu: uygulama verisinin yerel olduğu belirtiliyor, fakat senkronizasyon seçenekleri ayrı sunucu hesabı isteyebiliyor.
- VLC'de `offline`, yerel dosya oynatma bağlamında kullanıldı; ağ akışları için çevrimdışı garanti çıkarılmadı.
- `monthlyPrice` veya `annualPrice` yalnız resmi sayfa açıkça sıfır diyorsa `0`; doğrulanmayan fiyatlar `null` olmalı. TRY dönüşümü ve mağaza içi ülke farkı eklenmedi.
- Listeler editoryal başlangıç seçkisidir; indirme, puan, kullanıcı sayısı veya popülerlik sıralaması değildir.
- Makaleler `source-research` yöntemindedir; uygulamalı test, gönüllü yükleme veya satın alma yapılmadı.
