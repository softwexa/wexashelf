

import { useI18n } from "@/lib/i18n";
import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { PAGE_NAMES } from "@/lib/seo";

const sections: Record<string, { heading: string; paragraphs: string[] }[]> = {
  yontem: [
    {
      heading: "Bir uygulama kaydı nasıl hazırlanır?",
      paragraphs: [
        "Uygulamanın resmî yayıncı ve mağaza bağlantıları kayda bağlanır. İşletim sistemi desteği, mağazada listelenme ve bir özelliğin o platformda çalışması ayrı bilgilerdir. Kaynak ve kontrol tarihi, özelliklerin yanında gösterilir.",
        "Doğrulanmamış bilgi “yok” veya “ücretsiz” olarak yorumlanmaz. Destekleniyor, sınırlı, desteklenmiyor ve doğrulanmadı durumları birbirinden ayrılır.",
      ],
    },
    {
      heading: "Editör seçkisi neyi ifade eder?",
      paragraphs: [
        "Haftalık, aylık ve kalıcı seçkiler, her uygulama için yazılan gerekçelere dayanır. Bunlar mağaza indirme sıralaması veya sitenin kullanıcı istatistiği değildir. Dönem ve seçim yöntemi liste sayfasında bulunur.",
        "Bir mağaza gözlemi yayımlandığında mağazası, ülkesi ve gözlem tarihi birlikte gösterilir. Veri bulunmayan dönem için tahmini sıralama üretilmez.",
      ],
    },
    {
      heading: "Karşılaştırma ve önerilerin sınırı",
      paragraphs: [
        "Karşılaştırma, kayıtlı bilgileri yan yana getirir. Aynı isimli özellik farklı cihazlarda aynı kapsamda olmayabilir. Seçim aracında zorunlu bir özellik doğrulanmamışsa uygulama kesin eşleşme sayılmaz.",
        "Fiyat aracı yalnız kayıtlı plan fiyatlarını ve seçtiğin süreyi kullanır. Eksik fiyatlar toplamdan sessizce çıkarılmaz. Sonuçta kaynak, para birimi ve hesap varsayımları görünür.",
      ],
    },
    {
      heading: "Kaynak araştırması ve uygulamalı test",
      paragraphs: [
        "Resmî belgelere dayalı bilgi, uygulamalı editör testi olarak sunulmaz. Test iddiası için cihaz, platform, sürüm, tarih ve yapılan işlemin kapsamı gerekir. Başlangıç kataloğundaki kısa rehberler ürünün bütün özelliklerini test ettiğimiz anlamına gelmez.",
      ],
    },
  ],
  hakkimizda: [
    {
      heading: "Bir uygulamayı seçmek daha anlaşılır olsun",
      paragraphs: [
        `{brand}; Android, iOS ve Windows araçlarını ihtiyaç, platform ve kaynaklı bilgiler üzerinden keşfetmek için geliştiriliyor. Uygulama kayıtlarını, karşılaştırmaları, editoryal içerikleri ve örnek iş akışlarını bir araya getiriyor.`,
      ],
    },
    {
      heading: "Bu sürümün kapsamı",
      paragraphs: [
        "Bu yerel sürümde başlangıç kataloğu ve yönetilebilir içerik sistemi bulunur. Katalog bütün mağazaları veya bütün uygulamaları kapsamaz. Mağaza bağlantıları, bağımsız yayıncıların kendi hizmetlerine yönlendirir.",
        "Bir listede yer almak güvenlik sertifikası, resmî ortaklık veya belirli bir kullanıcı için uygunluk garantisi değildir. Kararını güncel yayıncı bilgileri ve kendi kullanım koşullarınla birlikte ver.",
      ],
    },
  ],
  gizlilik: [
    { heading: "Application submissions and private tracking", paragraphs: ["When submissions are enabled, app details, store links and images are stored for editorial review. Optional contact details stay private and are not copied to the public app. Anyone with the tracking code can read or withdraw an eligible submission; keep it private. No email notifications are sent. Unfinished drafts expire after seven days of inactivity. Owners can delete closed submissions; backups may retain earlier copies. Hosting access logs may include connection data."] },
    {
      heading: "Tarayıcıda kalan tercihler",
      paragraphs: [
        "Kaydedilen uygulamalar, karşılaştırma seçimi, tema ve bölüm tercihleri bu tarayıcının localStorage alanında tutulur. Aynı cihazdaki aynı tarayıcı profilini kullanan kişiler bu tercihlere erişebilir. Tarayıcı site verilerini temizlediğinde bu kayıtlar da silinebilir.",
      ],
    },
    {
      heading: "Yönetim oturumu ve içerik verisi",
      paragraphs: [
        "Yönetim girişi, sunucunun doğruladığı bir oturum çerezi kullanır. Yönetim panelinden kaydedilen katalog ve içerik kayıtları yerel veritabanında saklanır. Yedek dosyaları bu içeriklerin kopyasını içerir; paylaşmadan önce içeriğini gözden geçir.",
      ],
    },
    {
      heading: "Bilgi düzeltme bildirimleri",
      paragraphs: [
        "Düzeltme formundaki uygulama, alan ve açıklama sunucuya gönderilir ve yönetim kuyruğunda saklanır. Bu forma parola, ödeme bilgisi veya başka kişilere ait özel bilgi yazma. Form için hesap veya e-posta adresi gerekmez.",
      ],
    },
    {
      heading: "Haricî bağlantılar",
      paragraphs: [
        "Mağaza veya yayıncı bağlantısını açtığında ilgili hizmetin veri işleme kuralları geçerli olur. Bu sürümde reklam ağı veya üçüncü taraf ziyaretçi analiz kodu çalıştırılmıyor. Kamuya açık bir yayından önce işletmeci, barındırma ve iletişim bilgileri bu metne eklenmelidir.",
      ],
    },
  ],
  "duzeltme-politikasi": [
    {
      heading: "Hatalı veya eski bilgiyi bildir",
      paragraphs: [
        "Uygulama ayrıntısındaki bilgi düzeltme formunda hangi alanın yanlış olduğunu, nedenini ve mümkünse resmî kaynak adresini belirt. Bildirim doğrudan yayımlanmaz; yönetim kuyruğunda incelenir.",
      ],
    },
    {
      heading: "İnceleme ve değişiklik kaydı",
      paragraphs: [
        "Editör, bildirimi ilgili platform ve kaynak tarihiyle karşılaştırır. Kabul edilen değişiklik yeni bir kayıt sürümü oluşturur. Eski sürüm, yönetim geçmişinden incelenebilir ve gerektiğinde geri alınabilir.",
        "Bir uygulamanın önemli bilgileri değiştiğinde ona bağlı içerikler tekrar inceleme için işaretlenir. İndeks onayı yeni incelemeye kadar kaldırılır. Bir kaynak hatası tek başına uygulamanın kaldırıldığı veya fiyatının değiştiği anlamına gelmez.",
      ],
    },
  ],
};

export default function PolicyPage({ slug }: { slug: string }) {
  const { t, locale, formatDate, formatNumber, countryName } = useI18n();
  return (
    <article className="policy-page">
      <header className="page-heading">
        <span className="eyebrow">{t("Nasıl çalışıyoruz?")}</span>
        <h1>{t(PAGE_NAMES[slug])}</h1>
        <p>{t("Katalog, kaynaklar ve bu sürümün çalışma biçimi.")}</p>
      </header>
      <div className="home-panel readable-article">
        {slug === "hakkimizda" && (
          <section>
            <h2>{t("Yazılımı geliştiren")}</h2>
            <p>
              {t("Yazılım:")} {BRAND.name} · {t("Geliştiren:")} <a href={BRAND.developerUrl}>{BRAND.developer}</a></p>
            <p>{t("Bu yazılımı kullanan siteler farklı işletmeciler tarafından yönetilebilir. Yazılım geliştiricisi bilgisi, kurulumun site işletmecisini veya veri sorumlusunu belirtmez.")}</p>
            <p>© 2026 <a href={BRAND.developerUrl} rel="nofollow">{BRAND.developer}</a></p>
          </section>
        )}
        {sections[slug]?.map((section) => (
          <section key={t(section.heading)}>
            <h2>{t(section.heading)}</h2>
            {section.paragraphs.map((p) => (
              <p key={p}>{t(p,{brand:BRAND.name})}</p>
            ))}
          </section>
        ))}
      </div>
      <nav className="policy-nav" aria-label={t("Bilgilendirme sayfaları")}>
        {Object.keys(sections).map((key) => (
          <Link
            key={key}
            href={`/${key}`}
            aria-current={key === slug ? "page" : undefined}
          >
            {t(PAGE_NAMES[key])}
          </Link>
        ))}
      </nav>
    </article>
  );
}
