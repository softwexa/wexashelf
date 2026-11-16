export type Platform = "android" | "ios" | "windows";
export type Category =
  | "all"
  | "productivity"
  | "notes"
  | "documents"
  | "media"
  | "browser"
  | "design";
export interface CatalogApp {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Exclude<Category, "all">;
  platforms: Platform[];
  icon: string;
  color: string;
  website: string;
  storeLinks: Partial<Record<Platform, string>>;
  pricingLabel: string;
  featureNotes: { label: string; value: string }[];
  sourceUrl: string;
  checkedAt: string;
}
export const PLATFORM_LABELS: Record<Platform, string> = {
  android: "Android",
  ios: "iOS",
  windows: "Windows",
};
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "productivity", label: "Üretkenlik" },
  { id: "notes", label: "Not alma" },
  { id: "documents", label: "Belgeler" },
  { id: "media", label: "Medya" },
  { id: "browser", label: "Tarayıcı" },
  { id: "design", label: "Tasarım" },
];
type CatalogSeed = Pick<
  CatalogApp,
  | "id"
  | "name"
  | "tagline"
  | "description"
  | "category"
  | "color"
  | "website"
  | "sourceUrl"
  | "platforms"
  | "icon"
> & { appleId?: string; androidId?: string; windowsStoreUrl?: string };
const seeds: CatalogSeed[] = [
  {
    id: "notion",
    name: "Notion",
    tagline: "Notlarını ve projelerini bir araya getir.",
    description:
      "Notlar, belgeler ve proje sayfaları için ortak çalışma alanı.",
    category: "notes",
    color: "#f5f5f5",
    website: "https://www.notion.com",
    sourceUrl: "https://www.notion.com/mobile",
    appleId: "1232780281",
    androidId: "notion.id",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/notion.jpg",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    tagline: "Düşüncelerinin arasındaki bağları keşfet.",
    description: "Birbirine bağlanan notlarla kişisel bilgi alanını düzenle.",
    category: "notes",
    color: "#a78bfa",
    website: "https://obsidian.md",
    sourceUrl: "https://obsidian.md/download",
    appleId: "1557175442",
    androidId: "md.obsidian",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/obsidian.jpg",
  },
  {
    id: "todoist",
    name: "Todoist",
    tagline: "Yapılacakları zihninden çıkar.",
    description: "Görevlerini ve projelerini listeler halinde takip et.",
    category: "productivity",
    color: "#ef635b",
    website: "https://todoist.com",
    sourceUrl: "https://www.todoist.com/downloads",
    appleId: "572688855",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/todoist.jpg",
  },
  {
    id: "ticktick",
    name: "TickTick",
    tagline: "Gününe biraz yer aç.",
    description: "Günlük görevleri ve planlarını tek bir yerde düzenle.",
    category: "productivity",
    color: "#6495f3",
    website: "https://ticktick.com",
    sourceUrl: "https://ticktick.com/download",
    appleId: "626144601",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/ticktick.jpg",
  },
  {
    id: "vlc",
    name: "VLC",
    tagline: "Dosyanı aç, izlemeye başla.",
    description: "Ses ve video dosyaları için çok platformlu medya oynatıcı.",
    category: "media",
    color: "#ff9b42",
    website: "https://www.videolan.org/vlc/",
    sourceUrl: "https://images.videolan.org/vlc/index.en_GB.html",
    appleId: "650377962",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/vlc.jpg",
  },
  {
    id: "firefox",
    name: "Firefox",
    tagline: "Web’de kendi yolunu çiz.",
    description: "Masaüstü ve mobil cihazlar için web tarayıcısı.",
    category: "browser",
    color: "#fb8353",
    website: "https://www.firefox.com",
    sourceUrl: "https://www.firefox.com/en-US/browsers/mobile/",
    appleId: "989804926",
    androidId: "org.mozilla.firefox",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/firefox.jpg",
  },
  {
    id: "acrobat",
    name: "Adobe Acrobat",
    tagline: "PDF dosyalarınla çalış.",
    description:
      "PDF belgelerini görüntüleme ve üzerlerine not ekleme araçları.",
    category: "documents",
    color: "#ff5555",
    website: "https://www.adobe.com/acrobat.html",
    sourceUrl: "https://www.adobe.com/acrobat/mobile.html",
    appleId: "469337564",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/acrobat.jpg",
  },
  {
    id: "xodo",
    name: "Xodo",
    tagline: "Belgelerini okumadan öteye taşı.",
    description:
      "PDF okuma ve belge işleme araçları. Masaüstü ve mobil ürünlerin kapsamı farklılaşabilir.",
    category: "documents",
    color: "#54b9e8",
    website: "https://xodo.com",
    sourceUrl: "https://xodo.com/integration",
    appleId: "805075929",
    androidId: "com.xodo.pdf.reader",
    platforms: ["android", "ios", "windows"],
    icon: "/icons/xodo.jpg",
  },
  {
    id: "powertoys",
    name: "Microsoft PowerToys",
    tagline: "Windows çalışma alanını kendine uyarla.",
    description:
      "Pencere düzenleri, klavye eşlemeleri ve günlük Windows işleri için yardımcı araçlar.",
    category: "productivity",
    color: "#73b6e8",
    website: "https://learn.microsoft.com/en-us/windows/powertoys/",
    sourceUrl: "https://learn.microsoft.com/en-us/windows/powertoys/install",
    platforms: ["windows"],
    icon: "/icons/powertoys.png",
    windowsStoreUrl: "https://apps.microsoft.com/detail/XP89DCGQ3K6VLD",
  },
  {
    id: "antennapod",
    name: "AntennaPod",
    tagline: "Podcastlerine kendi ritminde kulak ver.",
    description:
      "Android cihazlarında podcastleri takip etmek ve dinlemek için açık kaynak uygulama.",
    category: "media",
    color: "#1b8bf6",
    website: "https://antennapod.org",
    sourceUrl: "https://antennapod.org/download/",
    platforms: ["android"],
    icon: "/icons/antennapod.svg",
    androidId: "de.danoeh.antennapod",
  },
];
/** Editorial starting catalog; not a live store feed or a hands-on review. */
export const APPS: CatalogApp[] = seeds.map(
  ({
    id,
    name,
    tagline,
    description,
    category,
    color,
    website,
    sourceUrl,
    appleId,
    androidId,
    windowsStoreUrl,
    platforms,
    icon,
  }) => ({
    id,
    name,
    tagline,
    description,
    category,
    color,
    website,
    sourceUrl,
    platforms,
    icon,
    storeLinks: {
      ...(appleId ? { ios: `https://apps.apple.com/app/id${appleId}` } : {}),
      ...(androidId
        ? {
            android: `https://play.google.com/store/apps/details?id=${androidId}`,
          }
        : {}),
      ...(windowsStoreUrl ? { windows: windowsStoreUrl } : {}),
    },
    pricingLabel: "Planları incele",
    checkedAt: "2026-11-15",
    featureNotes: [
      {
        label: "Kullanım alanı",
        value: CATEGORIES.find((item) => item.id === category)!.label,
      },
      {
        label: "Ücret ve kapsam",
        value:
          "Güncel özellikleri ve plan koşullarını geliştiricinin sitesinden kontrol et.",
      },
      {
        label: "Cihazlar arasında",
        value:
          id === "xodo"
            ? "Windows ve mobil ürünlerin özellikleri ile lisansları farklı olabilir."
            : "Özellik ve eşitleme koşulları platforma ve plana göre değişebilir.",
      },
    ],
  }),
);
function normalize(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}
export function searchApps(
  apps: CatalogApp[],
  query: string,
  platform: Platform | "all",
  category: Category,
): CatalogApp[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return apps.filter((app) => {
    const haystack = normalize(
      `${app.name} ${app.tagline} ${app.description} ${app.category} ${CATEGORIES.find((item) => item.id === app.category)?.label ?? ""}`,
    );
    return (
      (platform === "all" || app.platforms.includes(platform)) &&
      (category === "all" || app.category === category) &&
      terms.every((term) => haystack.includes(term))
    );
  });
}
export function getAppById(id: string): CatalogApp | undefined {
  return APPS.find((app) => app.id === id);
}
export const GUIDES: {
  id: string;
  title: string;
  description: string;
  kind: "migration" | "guide";
  steps: string[];
  appIds: string[];
}[] = [
  {
    id: "notes-migration",
    title: "Notlarına yeni bir yuva",
    description: "Notion ve Obsidian arasında geçişi küçük bir örnekle planla.",
    kind: "migration",
    appIds: ["notion", "obsidian"],
    steps: [
      "Önce mevcut notlarının bağımsız bir yedeğini al.",
      "Kaynak uygulamanın dışa aktarma, hedefin içe aktarma belgelerini kontrol et.",
      "Birkaç notla deneme yap; bağlantıları, görselleri ve biçimlendirmeyi karşılaştır.",
      "Örnekleri doğrulamadan eski arşivini silme. Bu rehber aktarım garantisi değildir.",
    ],
  },
  {
    id: "task-routine",
    title: "Daha hafif bir görev listesi",
    description: "Todoist veya TickTick ile sürdürülebilir bir düzen kur.",
    kind: "guide",
    appIds: ["todoist", "ticktick"],
    steps: [
      "Aklındaki işleri tek bir gelen kutusunda topla.",
      "Her görevi yapılabilir bir sonraki adım olarak yaz.",
      "Bugün için küçük bir liste seç; tarih gerekmeyen işe tarih verme.",
      "Bildirim ve takvim özelliklerinin kullandığın planda bulunup bulunmadığını kontrol et.",
    ],
  },
  {
    id: "pdf-choice",
    title: "PDF aracını ihtiyacına göre seç",
    description: "Okuma, açıklama ve düzenleme ihtiyaçlarını birbirinden ayır.",
    kind: "guide",
    appIds: ["acrobat", "xodo"],
    steps: [
      "Okuma, not ekleme veya metin düzenleme ihtiyacını belirle.",
      "Hassas bilgi içermeyen örnek bir PDF ile dene.",
      "İşlem sonrası Türkçe karakterleri, sayfa düzenini ve bağlantıları kontrol et.",
      "Özelliklerin cihazındaki sürümde ve planında bulunduğunu doğrula.",
    ],
  },
];
export const WORKFLOWS: {
  id: string;
  title: string;
  description: string;
  steps: { title: string; description: string; appId?: string }[];
}[] = [
  {
    id: "research",
    title: "Meraktan derli toplu notlara",
    description:
      "Bir araştırmayı kaynaklarıyla birlikte düzenlemek için örnek akış.",
    steps: [
      {
        title: "Kaynağı bul",
        description: "Kaynağın adresini ve erişim tarihini kaydet.",
        appId: "firefox",
      },
      {
        title: "Kendi cümlelerinle yaz",
        description:
          "Bulgularını kısa notlara dönüştür, kaynak bağlantısını ekle.",
        appId: "obsidian",
      },
      {
        title: "Sonraki adımı belirle",
        description: "Araştırmadan çıkan işi görev listene elle ekle.",
        appId: "todoist",
      },
    ],
  },
  {
    id: "reading",
    title: "Bir belge, üç küçük adım",
    description: "PDF okurken önemli noktaları kaybetme.",
    steps: [
      {
        title: "Bir kopya oluştur",
        description: "Orijinal belgeyi sakla; çalışma kopyasını aç.",
        appId: "xodo",
      },
      {
        title: "Önemli noktaları işaretle",
        description: "Kullandığın sürümdeki açıklama araçlarını dene.",
        appId: "acrobat",
      },
      {
        title: "Özeti yaz",
        description: "Belge adı ve sayfa numaralarıyla kısa bir özet hazırla.",
        appId: "notion",
      },
    ],
  },
  {
    id: "weekly",
    title: "Haftaya sakin bir başlangıç",
    description: "Görev ve notlarını gözden geçirmek için kısa bir rutin.",
    steps: [
      {
        title: "Açık işleri gözden geçir",
        description: "Tamamlananları kapat, gereksiz olanları kaldır.",
        appId: "ticktick",
      },
      {
        title: "Notlarını toparla",
        description: "Dağınık notları ilgili proje sayfalarına taşı.",
        appId: "notion",
      },
      {
        title: "Az sayıda öncelik seç",
        description: "Yapılabilir bir haftalık liste oluştur.",
        appId: "todoist",
      },
    ],
  },
];
