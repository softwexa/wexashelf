# WexaShelf theme collection

Sixteen built-in homepage directions share the same catalog, real application icons, localized routes, comparison actions and publication rules. A theme changes visual composition, not the site's owner name, logo, records or publication permissions.

The README thumbnails are compact browser-viewport previews for quick comparison. The `screen.jpg` links are full-page runtime captures of the corresponding implemented homepage with synthetic catalog content. They are visual references, not a deployment or performance certification.

| Theme | Preset ID | Template | Visual direction | README preview | Full-page runtime |
| --- | --- | --- | --- | --- | --- |
| Kobalt Atlas | `kobalt-atlas` | `atlas` | Blue, search-led atlas with category and editorial panels | [preview.jpg](../public/themes/kobalt-atlas/preview.jpg) | [screen.jpg](../public/themes/kobalt-atlas/screen.jpg) |
| Canlı Katalog | `canli-katalog` | `catalog` | Warm catalog layout with a featured selection and app cards | [preview.jpg](../public/themes/canli-katalog/preview.jpg) | [screen.jpg](../public/themes/canli-katalog/screen.jpg) |
| Gece Rotaları | `gece-rotalari` | `night` | Dark route-style layout with a focused comparison hero | [preview.jpg](../public/themes/gece-rotalari/preview.jpg) | [screen.jpg](../public/themes/gece-rotalari/screen.jpg) |
| İş Akışı Haritası | `is-akisi-haritasi` | `workflow` | Top-nav workflow layout organized around practical steps | [preview.jpg](../public/themes/is-akisi-haritasi/preview.jpg) | [screen.jpg](../public/themes/is-akisi-haritasi/screen.jpg) |
| Velvet | `velvet` | `velvet` | Dark cherry, champagne and expressive serif headings | [preview.jpg](../public/themes/velvet/preview.jpg) | [screen.jpg](../public/themes/velvet/screen.jpg) |
| Copper Desk | `copper-desk` | `copper` | Warm copper and a comparison-led opening | [preview.jpg](../public/themes/copper-desk/preview.jpg) | [screen.jpg](../public/themes/copper-desk/screen.jpg) |
| Porcelain | `porcelain` | `porcelain` | Centered search with a teal comparison feature | [preview.jpg](../public/themes/porcelain/preview.jpg) | [screen.jpg](../public/themes/porcelain/screen.jpg) |
| Tide | `tide` | `tide` | Coastal blue with platform-based app shelves | [preview.jpg](../public/themes/tide/preview.jpg) | [screen.jpg](../public/themes/tide/screen.jpg) |
| Index | `index` | `index` | Compact browsing, application rows and contextual reading | [preview.jpg](../public/themes/index/preview.jpg) | [screen.jpg](../public/themes/index/screen.jpg) |
| Prism | `prism` | `prism` | Coral, blue and varied editorial card sizes | [preview.jpg](../public/themes/prism/preview.jpg) | [screen.jpg](../public/themes/prism/screen.jpg) |
| Ember | `ember` | `ember` | Charcoal, orange and strong editorial contrast | [preview.jpg](../public/themes/ember/preview.jpg) | [screen.jpg](../public/themes/ember/screen.jpg) |
| Signal | `signal` | `signal` | High contrast, lime accents and a geometric shortlist | [preview.jpg](../public/themes/signal/preview.jpg) | [screen.jpg](../public/themes/signal/screen.jpg) |
| Lilac Studio | `lilac-studio` | `lilac` | Soft violet, a discovery gallery and an editorial rail | [preview.jpg](../public/themes/lilac-studio/preview.jpg) | [screen.jpg](../public/themes/lilac-studio/screen.jpg) |
| Fieldnotes | `fieldnotes` | `fieldnotes` | Warm paper tones, serif headings and an editorial index | [preview.jpg](../public/themes/fieldnotes/preview.jpg) | [screen.jpg](../public/themes/fieldnotes/screen.jpg) |
| Editorial Desk | `editorial-desk` | `magazine` | Magazine-style layout for guides, comparisons and reading lists | [preview.jpg](../public/themes/editorial-desk/preview.jpg) | [screen.jpg](../public/themes/editorial-desk/screen.jpg) |
| Compact Directory | `compact-directory` | `directory` | Dense directory view for quick scanning and filtering | [preview.jpg](../public/themes/compact-directory/preview.jpg) | [screen.jpg](../public/themes/compact-directory/screen.jpg) |

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

The maintainer's local `design/homepage-concepts-v2` archive contains image-generation concepts used for design exploration; it is excluded from Git and distribution packages. Do not copy concept images into the `preview.jpg` or `screen.jpg` slots. Each public preview must be a browser capture of the corresponding implemented homepage with current compiled assets and a synthetic catalog.

Capture on the primary PHP runtime in a fresh browser context; wait for the expected template, fonts and images. Use a compact viewport capture for `preview.jpg` and a full-page runtime capture for `screen.jpg`, then retain dimensions and source/runtime evidence with the local QA record. The PHP build copies the complete `public/themes` tree into the hosting package. Gallery previews are static preset samples, so custom content, translations and changed settings should be reviewed in the live preview.

With the PHP assets built, start a local sample installation named WexaShelf. The following command captures every registered preset through the public site and writes the source and hosting JPEGs together. It runs with browser-local theme preferences. Replace the port with your fixture's HTTP port.

```sh
node scripts/capture-theme-previews.mjs http://127.0.0.1:3141 - artifacts/theme-previews WexaShelf
```

See [Theme development](THEME-DEVELOPMENT.md) for the portable manifest, safe configuration options and validation steps. Local screenshots are not a public deployment or a performance certification.

## Share a preset

After building and capturing the final runtime, run `node scripts/package-themes.mjs` from the source checkout. It creates ten separate `wexashelf-theme-NAME.zip` archives and `wexashelf-ten-themes.zip` in `artifacts/theme-collection/`. The packaging command currently covers the ten public collection presets; the six original built-in layouts remain part of the application and are documented above, but are not added to this ten-theme ZIP set. Each packaged folder contains `theme.json`, its real `screen.jpg`, a README and license/third-party notices. The accompanying manifest records checksums; each archive receives a ZIP integrity check.

Extract a package and import its **theme.json** in Appearance. The ZIP itself is a transport package, not an executable theme installer. The receiving WexaShelf build must already include the corresponding template; older archives without these templates reject the manifest. Existing installations need the updated application code and compiled assets before using these ten presets. The host does not need Node.js for theme configuration or import.

See [local validation](THEME-COLLECTION-VALIDATION.md) for the final 10-theme mobile/desktop scores and the separate behavior checks.
