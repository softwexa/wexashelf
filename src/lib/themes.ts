export const HOME_SECTION_IDS = [
  "discovery",
  "weekly",
  "trending",
  "toolbox",
  "guides",
  "workflows",
] as const;
export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export const THEME_TEMPLATES = [
  "night",
  "atlas",
  "workflow",
  "catalog",
  "magazine",
  "directory",
  "porcelain", "ember", "fieldnotes", "signal", "lilac",
  "tide", "copper", "prism", "index", "velvet",
] as const;
export type ThemeTemplate = (typeof THEME_TEMPLATES)[number];

export const PRESENTATION_OPTIONS = {
  font: ["sans", "serif", "mono", "display"],
  width: ["standard", "wide", "full"],
  radius: ["square", "soft", "round"],
  hero: ["compact", "standard", "spacious"],
  cardStyle: ["flat", "outline", "elevated"],
} as const;
export type ThemePresentation = {
  -readonly [K in keyof typeof PRESENTATION_OPTIONS]: (typeof PRESENTATION_OPTIONS)[K][number];
};
export const DEFAULT_PRESENTATION: ThemePresentation = {
  font: "sans", width: "wide", radius: "soft", hero: "standard", cardStyle: "outline",
};
export function getThemePresentation(theme: Pick<ThemeManifest, "presentation">): ThemePresentation {
  return { ...DEFAULT_PRESENTATION, ...theme.presentation };
}

export function getThemeTemplate(
  theme: Pick<ThemeManifest, "template">,
): ThemeTemplate {
  return THEME_TEMPLATES.includes(theme.template as ThemeTemplate)
    ? theme.template!
    : "night";
}

export interface ThemeManifest {
  template?: ThemeTemplate;
  presentation?: Partial<ThemePresentation>;
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  author?: string;
  layout: "sidebar" | "topbar";
  density: "comfortable" | "compact";
  tokens: {
    background: string;
    surface: string;
    surfaceRaised: string;
    foreground: string;
    muted: string;
    accent: string;
    accentContrast: string;
    border: string;
  };
  sections: HomeSectionId[];
}

export const DEFAULT_THEME: ThemeManifest = {
  schemaVersion: 1,
  id: "gece-rotalari",
  name: "Gece Rotaları",
  description: "Koyu lacivert yüzeyler ve nane vurgularıyla uygulama keşfi.",
  layout: "sidebar",
  density: "comfortable",
  tokens: {
    background: "#101a2b",
    surface: "#18263a",
    surfaceRaised: "#1e3047",
    foreground: "#edf3fc",
    muted: "#95a8c1",
    accent: "#65d8be",
    accentContrast: "#102c2a",
    border: "#2c3d52",
  },
  sections: [...HOME_SECTION_IDS],
};

const TOKEN_VARS = {
  background: "--background",
  surface: "--surface",
  surfaceRaised: "--surface-raised",
  foreground: "--foreground",
  muted: "--muted",
  accent: "--accent",
  accentContrast: "--accent-contrast",
  border: "--border",
} as const;
const MANIFEST_KEYS = [
  "template",
  "schemaVersion",
  "id",
  "name",
  "description",
  "author",
  "layout",
  "density",
  "tokens",
  "sections",
  "presentation",
];
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);
const boundedText = (value: unknown, max: number): value is string =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  value.length <= max &&
  !/[\u0000-\u001f\u007f]/.test(value);

export function parseThemeManifest(
  input: unknown,
): { ok: true; value: ThemeManifest } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  try {
    if (!record(input)) return fail("Tema bir JSON nesnesi olmalıdır.");
    if (
      Reflect.ownKeys(input).some(
        (key) => typeof key !== "string" || !MANIFEST_KEYS.includes(key),
      )
    )
      return fail("Tema bilinmeyen alan içeriyor.");
    if (input.schemaVersion !== 1)
      return fail("Desteklenmeyen tema şema sürümü.");
    if (
      typeof input.id !== "string" ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(input.id)
    )
      return fail(
        "Tema kimliği küçük harf, rakam ve tireden oluşmalıdır (1–64 karakter).",
      );
    if (!boundedText(input.name, 80) || !boundedText(input.description, 400))
      return fail("Tema adı (1–80) veya açıklaması (1–400 karakter) geçersiz.");
    if (Object.hasOwn(input, "author") && !boundedText(input.author, 120))
      return fail("Yazar alanı 1–120 karakter olmalıdır.");
    if (input.layout !== "sidebar" && input.layout !== "topbar")
      return fail("Tema yerleşimi desteklenmiyor.");
    if (
      Object.hasOwn(input, "template") &&
      !THEME_TEMPLATES.includes(input.template as ThemeTemplate)
    )
      return fail("Tema şablonu desteklenmiyor.");
    if (input.density !== "comfortable" && input.density !== "compact")
      return fail("Tema yoğunluğu desteklenmiyor.");
    if (Object.hasOwn(input, "presentation")) {
      if (!record(input.presentation)) return fail("Theme presentation must be an object.");
      for (const key of Reflect.ownKeys(input.presentation)) {
        if (typeof key !== "string" || !Object.hasOwn(PRESENTATION_OPTIONS, key))
          return fail("Unknown theme presentation option.");
        const values: readonly string[] = PRESENTATION_OPTIONS[key as keyof ThemePresentation];
        if (!values.includes(input.presentation[key] as string))
          return fail("Unsupported theme presentation value.");
      }
    }
    if (!record(input.tokens)) return fail("Tema renkleri eksik.");
    const tokens = input.tokens;
    const tokenKeys = Object.keys(
      TOKEN_VARS,
    ) as (keyof ThemeManifest["tokens"])[];
    if (
      Reflect.ownKeys(tokens).length !== tokenKeys.length ||
      Reflect.ownKeys(tokens).some(
        (key) => typeof key !== "string" || !Object.hasOwn(TOKEN_VARS, key),
      )
    )
      return fail("Tema renk alanları eksik veya bilinmeyen alan içeriyor.");
    if (
      tokenKeys.some(
        (key) =>
          typeof tokens[key] !== "string" ||
          !/^#[0-9a-fA-F]{6}$/.test(tokens[key] as string),
      )
    )
      return fail("Renkler #RRGGBB biçiminde altı basamaklı hex olmalıdır.");
    if (
      !Array.isArray(input.sections) ||
      input.sections.length < 1 ||
      input.sections.length > HOME_SECTION_IDS.length ||
      Array.from(input.sections).some(
        (section) => !HOME_SECTION_IDS.includes(section as HomeSectionId),
      ) ||
      new Set(input.sections).size !== input.sections.length
    )
      return fail(
        "Bölümler benzersiz, bilinen bölüm kimliklerinden oluşmalıdır.",
      );
    return {
      ok: true,
      value: {
        schemaVersion: 1,
        ...(input.template
          ? { template: input.template as ThemeTemplate }
          : {}),
        id: input.id,
        name: input.name,
        description: input.description,
        ...(typeof input.author === "string" ? { author: input.author } : {}),
        layout: input.layout,
        density: input.density,
        tokens: Object.fromEntries(
          tokenKeys.map((key) => [key, tokens[key]]),
        ) as ThemeManifest["tokens"],
        sections: [...input.sections] as HomeSectionId[],
        ...(record(input.presentation) ? { presentation: { ...input.presentation } as Partial<ThemePresentation> } : {}),
      },
    };
  } catch {
    return fail("Tema okunamadı; düz bir JSON nesnesi kullanın.");
  }
}

export function themeToStyle(theme: ThemeManifest): Record<string, string> {
  const parsed = parseThemeManifest(theme);
  const safe = parsed.ok ? parsed.value : DEFAULT_THEME;
  const presentation = getThemePresentation(safe);
  return { ...Object.fromEntries(
    Object.entries(TOKEN_VARS).map(([token, variable]) => [
      variable,
      safe.tokens[token as keyof ThemeManifest["tokens"]],
    ]),
  ),
    "--theme-content-width": { standard: "1120px", wide: "1440px", full: "none" }[presentation.width],
    "--theme-radius": { square: "2px", soft: "12px", round: "24px" }[presentation.radius],
    "--theme-hero-space": { compact: "24px", standard: "44px", spacious: "72px" }[presentation.hero],
    "--theme-heading-font": {
      sans: 'var(--font-plex, "IBM Plex Sans"), sans-serif',
      serif: 'Georgia, "Times New Roman", serif',
      mono: '"Courier New", monospace',
      display: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    }[presentation.font],
    "--theme-card-shadow": { flat: "none", outline: "none", elevated: "0 8px 30px #00000012" }[presentation.cardStyle],
  };
}
