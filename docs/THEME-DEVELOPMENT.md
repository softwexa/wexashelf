# Theme development

WexaShelf themes use a portable JSON manifest. Website owners can import a theme without Node.js on their host. The installed application supplies the layouts; the manifest chooses navigation, eight colors, density, homepage section order and optional presentation controls. See the [theme collection](THEME-COLLECTION.md) for all sixteen presets and their screenshot paths.

Start with [the working Harbor example](../examples/community-theme/README.md). The authoritative contract is [`ThemeManifest` and `parseThemeManifest`](../src/lib/themes.ts); PHP checks the same fields in [`Validation::siteSettings`](../php/app/Validation.php).

## Import, preview, activate, recover

1. Export the current theme from the admin appearance screen.
2. Import a JSON manifest no larger than 32 KB.
3. Use **Customize this theme** to edit the name, palette, layout, density, typography, width, corners, hero spacing and cards. Check or reorder homepage sections with the up/down buttons; at least one must remain selected. **Preview this draft** in Appearance loads the actual published catalogue with your unsaved theme and current saved site identity. The full preview has interactions disabled and neither saves visitor preferences nor publishes the draft. The separate **Themes & modules** preview remains available.
4. Explicitly activate the draft to change the site default. Concurrent edits are rejected using the settings revision.
5. Open the public site in a fresh browser profile to check the site default. Visitors who explicitly saved their own appearance continue using that preference.

The **Themes & modules** appearance history retains up to 100 saved revisions. **Restore** re-applies the theme and built-in module settings as a new revision, with a current-revision conflict check. Installed community module packages are managed separately. The **default theme** action selects the built-in default; it is not a previous-version rollback. Importing an earlier exported JSON is also a portable way to recover theme values, but JSON does not include module toggles.

The full homepage preview is an authenticated admin view. It is not a public shareable preview URL and does not claim to preview every route or validate accessibility and performance.

## Manifest v1

| Field | Accepted values |
| --- | --- |
| `schemaVersion` | `1` |
| `id` | 1–64 lowercase letters, digits, or hyphens; starts with a letter |
| `name` | Nonempty, up to 80 characters |
| `description` | Nonempty, up to 400 characters |
| `author` | Optional nonempty text, up to 120 characters |
| `template` | Optional: `night`, `atlas`, `workflow`, `catalog`, `magazine`, `directory`, `porcelain`, `ember`, `fieldnotes`, `signal`, `lilac`, `tide`, `copper`, `prism`, `index`, `velvet`; omitted means `night` |
| `layout` | `sidebar` or `topbar` |
| `density` | `comfortable` or `compact` |
| `tokens` | Exactly the eight colors below, each `#RRGGBB` |
| `sections` | 1–6 unique IDs from the section table; order is significant |
| `presentation` | Optional object containing any subset of the enumerated presentation options below |

Theme metadata is plain text, with no control characters. Use short metadata: the PHP validator counts bytes, while the TypeScript validator counts JavaScript string units. Unknown properties are rejected; do not add package versions, scripts, URLs, or asset lists inside this manifest. Put licensing and release notes in adjacent files.

### Presentation options

| Key | Values | Default when omitted |
| --- | --- | --- |
| `font` | `sans`, `serif`, `mono`, `display` | `sans` |
| `width` | `standard`, `wide`, `full` | `wide` |
| `radius` | `square`, `soft`, `round` | `soft` |
| `hero` | `compact`, `standard`, `spacious` | `standard` |
| `cardStyle` | `flat`, `outline`, `elevated` | `outline` |

These are safe, enumerated controls rather than arbitrary CSS or font URLs. Fonts use the bundled sans face or local font stacks. A manifest may omit the whole object or individual keys; older v1 manifests remain valid. The browser and PHP reject unknown keys and values. The editor applies only complete `#RRGGBB` colors; incomplete name/color text prevents owner theme activation until corrected. Presentation edits are included in JSON export and appearance history.

```json
"presentation": {
  "font": "serif",
  "width": "wide",
  "radius": "soft",
  "hero": "spacious",
  "cardStyle": "outline"
}
```

### Site identity is separate

**Site identity** in Appearance changes the authoritative site name and uploaded logo. Owners can choose logo with name, logo only, or text only, adjust logo width, and edit image alternative text. The upload remains a draft until **Save site identity**; changing or restoring a theme does not change branding.

Branding belongs to the SEO settings document and its own revision, not the theme manifest. Save it separately from appearance. Theme JSON export therefore does not bundle a site's logo or media. The existing media upload limits and private/public publication rules apply; see [image content](IMAGE-CONTENT.md). The software's optional Softwexa developer credit remains separate from a site's own identity.

### Gallery screenshots and live previews

All sixteen built-in presets use `/themes/PRESET-ID/preview.jpg` as the gallery thumbnail and link to `/themes/PRESET-ID/screen.jpg` for the full-page image. These static images are captures of the preset's working homepage, not generated concept art and not a rendering of the current owner's content or edits. The gallery labels them **Preset screenshot** and **Open full image**. If the thumbnail is missing, the gallery falls back to the generated layout miniature. Imported theme IDs do not create arbitrary image URLs.

The exact image files must be captured from the final local runtime before distribution; screenshot presence does not establish functional, accessibility or performance checks. Keep the captures alongside the preset folders and rebuild the PHP package so its assets match. Use the live draft preview to assess owner changes. Image URLs use the installation base path, including subdirectory deployments.

| Color token | CSS variable |
| --- | --- |
| `background` | `--background` |
| `surface` | `--surface` |
| `surfaceRaised` | `--surface-raised` |
| `foreground` | `--foreground` |
| `muted` | `--muted` |
| `accent` | `--accent` |
| `accentContrast` | `--accent-contrast` |
| `border` | `--border` |

| Section | Module needed |
| --- | --- |
| `discovery` | Core |
| `weekly` | Core |
| `trending` | Core |
| `toolbox` | `decision-tools` |
| `guides` | `migration-guides` |
| `workflows` | `workflow-collections` |

An enabled module cannot add a section omitted from the theme. Disabling a module removes its homepage contribution, not its data or direct content pages. The theme schema validates values, not accessible contrast. Check text, disabled controls, focus indicators, errors, and every background pairing in the rendered interface.

## Creating a new layout in source

A JSON import cannot introduce an arbitrary template. New templates are reviewed source changes:

1. Extend `THEME_TEMPLATES` and the `ThemeTemplate` contract in `src/lib/themes.ts`.
2. Implement rendering in `src/components/discovery/HomePage.tsx`, CSS in `src/app/themes.css`, and a corresponding miniature in `src/components/ThemeGallery.tsx` and its CSS module.
3. Extend the PHP template allowlist in `php/app/Validation.php` and review `php/app/PublicSite.php` for template-dependent asset loading.
4. Optionally register a preset in `src/lib/builtin-themes.ts` and provide a portable JSON example.
5. Preserve localized URLs, content visibility gates, heading structure, keyboard access, and source-backed facts. Theme code must use the existing locale helpers rather than changing canonical IDs.

Keep runtime assets local to the release. Reserve image dimensions, load below-fold images lazily, and avoid adding render-blocking network dependencies. Keep the public bundle separate from admin code. A theme change must be measured on its own; previous Lighthouse results do not prove a new theme's performance.

## Verify and distribute

```sh
npx tsx examples/community-theme/verify.ts
npx tsx --test tests/extensions.test.ts tests/theme-templates.test.ts
npm run typecheck
npm run build:php
```

Validate the manifest with PHP as well when changing the contract. Test a real browser at desktop and mobile widths, both supported languages, all enabled/disabled optional sections, and a cPanel subdirectory installation. The source repository may need Node.js for rebuilding; the generated PHP release does not require a Node.js server.

Distribute the JSON plus a README, author/license information, supported WexaShelf version, and actual preview images if you have them. Do not imply that a miniature is a screenshot or that a syntactically valid manifest has passed accessibility or performance review.

## Editorial Desk and Compact Directory (0.8.0)

`editorial-desk.json` selects the `magazine` template: a published article lead and a separate app reading column. When no article is available it provides an honest catalog link. `compact-directory.json` selects `directory`: an accessible table of app identities, supported platforms, recorded pricing summaries and checked dates. Its caption makes clear that the homepage is a selection, not the entire catalog. Unknown facts remain unknown; table order is not a popularity ranking.

Both portable examples are in `examples/themes/` and `public/themes/`. All six section IDs and module gating remain intact. The directory table scrolls inside a labelled, keyboard-focusable region on narrow screens; it does not widen the document. Both layouts respect reduced motion and use the existing IBM Plex Sans font and real catalog AppIcon component. Gallery miniatures describe their actual column/table structure; use the full homepage preview for real records and responsive review. Activation, revisions, rollback and visitor preferences use the same existing contracts as the original four themes.

### Homepage font delivery

Modern homepage workflow application names intentionally use weight 600, matching other app labels. Adding a lone heavier weight below the fold can introduce another font request into the opening load. Check the real request waterfall and remeasure the affected themes when changing font weights; see [the theme collection validation](THEME-COLLECTION-VALIDATION.md).
