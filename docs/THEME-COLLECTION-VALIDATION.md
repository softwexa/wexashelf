# Theme collection — local validation

This records the current source additions after the validated 0.8.0 archives. It is not a new public release or target-host installation report. The package version remains 0.8.0.

## Delivered scope

Ten additional templates bring the built-in total to sixteen: Porcelain, Ember, Fieldnotes, Signal, Lilac Studio, Tide, Copper Desk, Prism, Index and Velvet. Each new preset has a real browser-captured `screen.jpg`, a portable `theme.json` and a README. The gallery links to the full screenshot and identifies it as a preset sample. The design concepts are kept separately from runtime screenshots.

Owner drafts and personal browser preferences support eight colors, navigation, density, typography, content width, corners, hero spacing, card styling and homepage section visibility/order. Site name and uploaded PNG/JPEG/WebP logo use a separate revisioned setting; appearance changes preserve them. Logo upload is private until explicitly saved as an eligible public reference.

## Source and behavior checks

- TypeScript check and all 81 JavaScript tests passed. Locale validation passed for two registered languages and 1,987 stable English message keys. The PHP browser bundle built successfully.
- PHP theme/presentation, branding, SEO, content-media and localized-slug checks passed. The focused branding suite has 35 assertions using disposable SQLite/media fixtures; those assertions alone are not MySQL hosting evidence.
- Real PHP browser captures covered all ten new themes in English and Turkish at 1440px desktop and 390px mobile widths. Application icons decoded, section order/module gating matched the preset and no horizontal overflow or page errors were found. WexaShelf was used as the temporary sample site name; original appearance and identity were restored.
- Real discovery checks covered query/platform filtering, saved state across reload and two-app comparison for all ten themes, split across English and Turkish routes. Index category filtering and the full catalog link passed. Disposable visitor preferences did not alter site settings.
- Owner customization checks covered invalid inputs, the last-section guard, reordering, isolated draft preview, activation, export and visitor persistence. A real modified render confirmed the configured width, font, corners and flat cards.
- Logo checks on a separate empty-catalog PHP/MySQL fixture covered transparent upload, private preview, anonymous eligibility, explicit save, EN/TR header/footer identity, metadata/bootstrap, theme activation/history restoration, display modes and removal. Original settings were restored; revisions and audit records advanced normally.
- Visual review found and corrected mobile header branding, stretched editorial rows and clipped mobile article cards. Final corrected components and the WexaShelf sample identity passed the scoped follow-up review.

Local receipts are under `artifacts/theme-090/`: `screenshots.json`, `discovery-browser.json`, `customizer-browser.json`, `branding-runtime.json` and `unit-tests-final.log`. Raw receipts are intentionally excluded from public source/hosting archives.

## Performance measurement

The first complete ten-theme cohort retained twenty valid mobile/desktop profiles. Nine themes met mobile 95; Lilac Studio measured 93, with a simulated LCP of 3,168 ms. All desktops measured 100. Its LCP was the hero heading, generated after the public browser script runs; the script was downloaded at low priority. The raw report does not isolate the exact extra rendering task, so the loading improvement is not presented as proof of a sole cause.

The second complete cohort confirmed that script priority alone was insufficient: Lilac Studio, Prism and Velvet still scored 93 on mobile. Both earlier cohorts are retained. The final change gives workflow application names weight 600, matching other app labels and avoiding an otherwise unnecessary 22.8 KB weight-700 font. Fresh-browser checks for the three themes confirmed computed weight 600, two font requests, no weight-700 request and no page errors.

The final complete cohort ran on 16 November 2026 from 18:41:37 to 18:45:23 UTC. **All twenty profiles met the 95 target**, with unchanged hashes for 259 measured source/asset files. Original appearance was restored and catalog/SEO content stayed unchanged.

| Theme | Mobile | Desktop |
| --- | ---: | ---: |
| Porcelain | 95 | 100 |
| Ember | 95 | 100 |
| Fieldnotes | 97 | 100 |
| Signal | 96 | 100 |
| Lilac Studio | 95 | 100 |
| Tide | 96 | 100 |
| Copper Desk | 96 | 100 |
| Prism | 95 | 100 |
| Index | 97 | 100 |
| Velvet | 96 | 100 |

Each theme has one mobile and one desktop profile in this final cohort; the table is not a repeated-run median or a selection of the best prior scores. Mobile simulated LCP ranged from 2.633 to 2.869 seconds, so the performance score does not establish all Core Web Vitals as good. These are Lighthouse Performance results, not SEO-category scores or field/CrUX measurements.

Local final evidence: `artifacts/theme-090/performance-20261116T184137991Z-24c709/cohort.json`. Earlier cohort receipts are `performance-20261116T182034133Z-fe5516/cohort.json` and `performance-20261116T182853977Z-c4e830/cohort.json` under the same local QA directory. Raw reports and their hashes are referenced by those receipts.

## Distribution boundary

`node scripts/package-themes.mjs` produces ten individual preset ZIPs and one collection ZIP, with integrity checks and a SHA-256 inventory. Extract and import `theme.json`; the application build must already contain the template. These packages do not execute uploaded code or update an older application's renderer. Hosting uses the prebuilt PHP assets and needs no Node runtime for theme configuration.

The local checks use small synthetic catalogs. They do not establish every cPanel environment, production load, field Core Web Vitals, Google rankings, paid AI integration or public GitHub publication. The initial PHP HTML remains the semantic catalog fallback; the full distinct homepage compositions render in the browser.
