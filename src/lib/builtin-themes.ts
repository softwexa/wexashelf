import { DEFAULT_THEME, HOME_SECTION_IDS, type ThemeManifest } from "./themes";

/** Built-ins use the same portable v1 contract as imported themes. */
export const BUILTIN_THEMES: ThemeManifest[] = [
  DEFAULT_THEME,
  {
    schemaVersion: 1,
    id: "kobalt-atlas",
    name: "Kobalt Atlas",
    description:
      "Beyaz yüzeyler, kobalt vurgu ve kategori odaklı editoryal keşif.",
    template: "atlas",
    layout: "topbar",
    density: "comfortable",
    tokens: {
      background: "#f5f7fc",
      surface: "#ffffff",
      surfaceRaised: "#eaf0fc",
      foreground: "#172746",
      muted: "#53647d",
      accent: "#234dcc",
      accentContrast: "#ffffff",
      border: "#d4ddeb",
    },
    sections: [
      "discovery",
      "weekly",
      "guides",
      "trending",
      "toolbox",
      "workflows",
    ],
  },
  {
    schemaVersion: 1,
    id: "is-akisi-haritasi",
    name: "İş Akışı Haritası",
    description:
      "Adaçayı yüzeylerde, yapılacak işten uygulamaya uzanan düzenli akış.",
    template: "workflow",
    layout: "topbar",
    density: "comfortable",
    tokens: {
      background: "#eef2e9",
      surface: "#fafbf7",
      surfaceRaised: "#e0e8d9",
      foreground: "#203c31",
      muted: "#536b5c",
      accent: "#295d45",
      accentContrast: "#ffffff",
      border: "#ccd8c5",
    },
    sections: [
      "workflows",
      "toolbox",
      "discovery",
      "guides",
      "weekly",
      "trending",
    ],
  },
  {
    schemaVersion: 1,
    id: "canli-katalog",
    name: "Canlı Katalog",
    description:
      "Erik moru, şeftali ve yatay raflarla sıcak bir uygulama kataloğu.",
    template: "catalog",
    layout: "topbar",
    density: "comfortable",
    tokens: {
      background: "#fcf5ef",
      surface: "#fffaf6",
      surfaceRaised: "#f4e5df",
      foreground: "#432c46",
      muted: "#786171",
      accent: "#713f6b",
      accentContrast: "#ffffff",
      border: "#e3cfd8",
    },
    sections: [...HOME_SECTION_IDS],
  },
{
  "schemaVersion": 1,
  "id": "editorial-desk",
  "name": "Editorial Desk",
  "description": "An editorial lead, reading column and source-backed app selections.",
  "template": "magazine",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f1f4f8",
    "surface": "#ffffff",
    "surfaceRaised": "#e5ecf5",
    "foreground": "#182b49",
    "muted": "#52627a",
    "accent": "#244b8a",
    "accentContrast": "#ffffff",
    "border": "#c7d3e3"
  },
  "sections": [
    "discovery",
    "guides",
    "weekly",
    "trending",
    "toolbox",
    "workflows"
  ]
},{
  "schemaVersion": 1,
  "id": "compact-directory",
  "name": "Compact Directory",
  "description": "A compact app table with platforms, recorded pricing and source dates.",
  "template": "directory",
  "layout": "sidebar",
  "density": "compact",
  "tokens": {
    "background": "#edf2f2",
    "surface": "#ffffff",
    "surfaceRaised": "#dfe9e8",
    "foreground": "#173b3b",
    "muted": "#4d6666",
    "accent": "#17635c",
    "accentContrast": "#ffffff",
    "border": "#bfd1ce"
  },
  "sections": [
    "discovery",
    "toolbox",
    "weekly",
    "trending",
    "guides",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "porcelain",
  "name": "Porcelain",
  "description": "A quiet, search-first gallery with generous spacing and a teal comparison feature.",
  "author": "Softwexa",
  "template": "porcelain",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f8faf9",
    "surface": "#ffffff",
    "surfaceRaised": "#e8f0ed",
    "foreground": "#172c35",
    "muted": "#52646c",
    "accent": "#176c68",
    "accentContrast": "#ffffff",
    "border": "#cfddda"
  },
  "presentation": {
    "font": "sans",
    "width": "wide",
    "radius": "soft",
    "hero": "spacious",
    "cardStyle": "outline"
  },
  "sections": [
    "discovery",
    "trending",
    "weekly",
    "guides",
    "toolbox",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "ember",
  "name": "Ember",
  "description": "A warm charcoal showcase with bold type, app shelves and an editorial comparison band.",
  "author": "Softwexa",
  "template": "ember",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#181b1c",
    "surface": "#232829",
    "surfaceRaised": "#34302b",
    "foreground": "#f3e8d8",
    "muted": "#c5b9aa",
    "accent": "#ff864c",
    "accentContrast": "#211711",
    "border": "#4c4842"
  },
  "presentation": {
    "font": "display",
    "width": "wide",
    "radius": "soft",
    "hero": "standard",
    "cardStyle": "flat"
  },
  "sections": [
    "discovery",
    "trending",
    "toolbox",
    "guides",
    "weekly",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "fieldnotes",
  "name": "Fieldnotes",
  "description": "An olive-and-oat editorial index, a featured app and a carefully ruled reading layout.",
  "author": "Softwexa",
  "template": "fieldnotes",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f5f0e6",
    "surface": "#faf7ef",
    "surfaceRaised": "#e8e4d6",
    "foreground": "#344338",
    "muted": "#5d6359",
    "accent": "#9b482d",
    "accentContrast": "#ffffff",
    "border": "#c5c8b7"
  },
  "presentation": {
    "font": "serif",
    "width": "wide",
    "radius": "square",
    "hero": "standard",
    "cardStyle": "flat"
  },
  "sections": [
    "discovery",
    "weekly",
    "toolbox",
    "guides",
    "trending",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "signal",
  "name": "Signal",
  "description": "A decisive geometric catalog with lime panels, black rules and a three-column discovery grid.",
  "author": "Softwexa",
  "template": "signal",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f4f4ef",
    "surface": "#ffffff",
    "surfaceRaised": "#d7f844",
    "foreground": "#111716",
    "muted": "#465046",
    "accent": "#4f6508",
    "accentContrast": "#ffffff",
    "border": "#939c8c"
  },
  "presentation": {
    "font": "display",
    "width": "wide",
    "radius": "square",
    "hero": "standard",
    "cardStyle": "outline"
  },
  "sections": [
    "discovery",
    "trending",
    "guides",
    "weekly",
    "toolbox",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "lilac-studio",
  "name": "Lilac Studio",
  "description": "A welcoming lavender workspace with a side navigation, app gallery and editorial shelf.",
  "author": "Softwexa",
  "template": "lilac",
  "layout": "sidebar",
  "density": "comfortable",
  "tokens": {
    "background": "#f7f4fc",
    "surface": "#fffdff",
    "surfaceRaised": "#eee5f8",
    "foreground": "#37274e",
    "muted": "#6e607b",
    "accent": "#65488e",
    "accentContrast": "#ffffff",
    "border": "#d9cbe7"
  },
  "presentation": {
    "font": "sans",
    "width": "wide",
    "radius": "round",
    "hero": "standard",
    "cardStyle": "elevated"
  },
  "sections": [
    "discovery",
    "weekly",
    "guides",
    "trending",
    "toolbox",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "tide",
  "name": "Tide",
  "description": "An open blue cross-device guide with category-led app rows and a clear comparison section.",
  "author": "Softwexa",
  "template": "tide",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f6fbfd",
    "surface": "#ffffff",
    "surfaceRaised": "#e4f0f5",
    "foreground": "#163b51",
    "muted": "#526e7e",
    "accent": "#116e93",
    "accentContrast": "#ffffff",
    "border": "#c8dce5"
  },
  "presentation": {
    "font": "sans",
    "width": "wide",
    "radius": "soft",
    "hero": "spacious",
    "cardStyle": "outline"
  },
  "sections": [
    "discovery",
    "toolbox",
    "trending",
    "guides",
    "weekly",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "copper-desk",
  "name": "Copper Desk",
  "description": "A warm comparison-first desk with serif headlines, copper details and thoughtful app lists.",
  "author": "Softwexa",
  "template": "copper",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#f6f2eb",
    "surface": "#fffaf4",
    "surfaceRaised": "#eadccf",
    "foreground": "#342a24",
    "muted": "#716055",
    "accent": "#9c502a",
    "accentContrast": "#ffffff",
    "border": "#d8c4b4"
  },
  "presentation": {
    "font": "serif",
    "width": "wide",
    "radius": "soft",
    "hero": "standard",
    "cardStyle": "outline"
  },
  "sections": [
    "discovery",
    "weekly",
    "guides",
    "trending",
    "toolbox",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "prism",
  "name": "Prism",
  "description": "A vibrant coral-and-blue discovery mosaic with collections, app cards and journal features.",
  "author": "Softwexa",
  "template": "prism",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#fffdfb",
    "surface": "#ffffff",
    "surfaceRaised": "#f9d9cc",
    "foreground": "#202249",
    "muted": "#5d607b",
    "accent": "#3644c6",
    "accentContrast": "#ffffff",
    "border": "#dedde9"
  },
  "presentation": {
    "font": "sans",
    "width": "wide",
    "radius": "round",
    "hero": "standard",
    "cardStyle": "outline"
  },
  "sections": [
    "discovery",
    "trending",
    "guides",
    "weekly",
    "toolbox",
    "workflows"
  ]
},
{
  "schemaVersion": 1,
  "id": "index",
  "name": "Index",
  "description": "A precise browse workspace with local category filters, compact app rows and an editorial rail.",
  "author": "Softwexa",
  "template": "index",
  "layout": "topbar",
  "density": "compact",
  "tokens": {
    "background": "#f0f3f4",
    "surface": "#ffffff",
    "surfaceRaised": "#e2eced",
    "foreground": "#192b31",
    "muted": "#566b72",
    "accent": "#28636b",
    "accentContrast": "#ffffff",
    "border": "#c2d3d7"
  },
  "presentation": {
    "font": "sans",
    "width": "wide",
    "radius": "square",
    "hero": "compact",
    "cardStyle": "flat"
  },
  "sections": [
    "discovery",
    "workflows",
    "trending",
    "guides",
    "weekly",
    "toolbox"
  ]
},
{
  "schemaVersion": 1,
  "id": "velvet",
  "name": "Velvet",
  "description": "A cherry-and-champagne editorial catalog with serif headings and alternating light reading sections.",
  "author": "Softwexa",
  "template": "velvet",
  "layout": "topbar",
  "density": "comfortable",
  "tokens": {
    "background": "#2d1827",
    "surface": "#402334",
    "surfaceRaised": "#f6e8d6",
    "foreground": "#faede1",
    "muted": "#d0b7c0",
    "accent": "#e3b0bb",
    "accentContrast": "#3d1e2d",
    "border": "#705162"
  },
  "presentation": {
    "font": "serif",
    "width": "wide",
    "radius": "soft",
    "hero": "spacious",
    "cardStyle": "flat"
  },
  "sections": [
    "discovery",
    "toolbox",
    "weekly",
    "guides",
    "trending",
    "workflows"
  ]
},
];
