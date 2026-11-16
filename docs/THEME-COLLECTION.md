# WexaShelf theme collection

Ten additional homepage directions extend the original six layouts. Each preset keeps the same catalog, real application icons, localized routes, comparison actions and publication rules. Its name and visual composition are independent of the website owner's name and logo.

| Theme | Preset ID | Template | Visual direction | Runtime screenshot |
| --- | --- | --- | --- | --- |
| Porcelain | `porcelain` | `porcelain` | Calm teal, generous spacing and a search-led gallery | [screen.jpg](../public/themes/porcelain/screen.jpg) |
| Ember | `ember` | `ember` | Charcoal, orange and strong editorial contrast | [screen.jpg](../public/themes/ember/screen.jpg) |
| Fieldnotes | `fieldnotes` | `fieldnotes` | Warm paper tones, serif headings and an editorial index | [screen.jpg](../public/themes/fieldnotes/screen.jpg) |
| Signal | `signal` | `signal` | High contrast, lime accents and a geometric shortlist | [screen.jpg](../public/themes/signal/screen.jpg) |
| Lilac Studio | `lilac-studio` | `lilac` | Soft violet, a discovery gallery and an editorial rail | [screen.jpg](../public/themes/lilac-studio/screen.jpg) |
| Tide | `tide` | `tide` | Coastal blue and clear category rows | [screen.jpg](../public/themes/tide/screen.jpg) |
| Copper Desk | `copper-desk` | `copper` | Warm copper and a comparison-led opening | [screen.jpg](../public/themes/copper-desk/screen.jpg) |
| Prism | `prism` | `prism` | Coral, blue and varied editorial card sizes | [screen.jpg](../public/themes/prism/screen.jpg) |
| Index | `index` | `index` | Compact browsing, application rows and contextual reading | [screen.jpg](../public/themes/index/screen.jpg) |
| Velvet | `velvet` | `velvet` | Dark cherry, champagne and expressive serif headings | [screen.jpg](../public/themes/velvet/screen.jpg) |

The original themes—Gece Rotaları, Kobalt Atlas, İş Akışı Haritası, Canlı Katalog, Editorial Desk and Compact Directory—remain available. Existing imports and personal preferences keep their original identifiers.

## Configure a theme

1. In **Appearance**, choose a theme to place it in the unsaved draft.
2. Use **Customize this theme** to adjust the name, colors, navigation and density, heading typography, width, corner shape, hero spacing and card appearance.
3. Select homepage sections and use the up/down controls to change their order. Module-dependent sections still require their module to be enabled. Hidden sections retain their content and direct URLs.
4. Open **Preview this draft**. It uses actual published catalog content and does not change the public site or browser preferences.
5. Activate the appearance with the site's publish action and its revision check. Export the theme JSON if you want to reuse its configuration elsewhere.

Visitors may use the same customizer in their personal settings; those preferences stay in their browser. The owner controls the default seen by visitors without a saved preference.

## Replace the name and logo

**Site identity** is saved separately from a theme. Upload a PNG, JPEG or WebP logo, choose whether to show the name beside it, adjust its width, supply meaningful alternative text, and save. Uploading is not publication. Theme selection, activation and restoration preserve this identity. Theme JSON does not contain the site's logo image or SEO settings.

## Produce honest preview images

The maintainer's local `design/homepage-concepts-v2` archive contains image-generation concepts used for design exploration; it is excluded from Git and distribution packages. Do not copy concept images into the `screen.jpg` slots. Each `public/themes/PRESET-ID/screen.jpg` must instead be a browser capture of the corresponding implemented homepage with current compiled assets and a synthetic catalog.

Capture on the primary PHP runtime in a fresh browser context; wait for the expected template, fonts and images. Use a real JPEG screenshot, then retain its dimensions and source/runtime evidence with the local QA record. The PHP build copies the complete `public/themes` tree into the hosting package. Gallery previews are static preset samples, so custom content, translations and changed settings should be reviewed in the live preview.

See [Theme development](THEME-DEVELOPMENT.md) for the portable manifest, safe configuration options and validation steps. Local screenshots are not a public deployment or a performance certification.

## Share a preset

After building and capturing the final runtime, run `node scripts/package-themes.mjs` from the source checkout. It creates ten separate `wexashelf-theme-NAME.zip` archives and `wexashelf-ten-themes.zip` in `artifacts/theme-collection/`. Each folder contains `theme.json`, its real `screen.jpg`, a README and license/third-party notices. The accompanying manifest records checksums; each archive receives a ZIP integrity check.

Extract a package and import its **theme.json** in Appearance. The ZIP itself is a transport package, not an executable theme installer. The receiving WexaShelf build must already include the corresponding template; older archives without these templates reject the manifest. Existing installations need the updated application code and compiled assets before using these ten presets. The host does not need Node.js for theme configuration or import.

See [local validation](THEME-COLLECTION-VALIDATION.md) for the final 10-theme mobile/desktop scores and the separate behavior checks.
