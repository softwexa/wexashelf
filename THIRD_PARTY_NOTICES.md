# Third-party notices and asset provenance

WexaShelf project code is MIT licensed (see LICENSE). This does not grant rights to third-party application names, icons, trademarks or Softwexa branding.

## Dependencies

Dependencies are declared in `package.json` and pinned by `package-lock.json`. The full node_modules tree is not included in either ZIP. The prebuilt PHP browser bundle includes React, React DOM, scheduler, Lucide and web-vitals code, and IBM Plex Sans font assets. Their own licenses remain applicable; both package builders include the available LICENSE/OFL files under licenses/. Use `npm ci` to obtain development dependencies. `node scripts/package-source.mjs` writes a local dependency metadata inventory to `artifacts/releases/dependency-license-inventory.json`, using installed package manifests where available and lockfile metadata otherwise. This metadata inventory is not legal clearance. React, React DOM and scheduler use MIT; Lucide uses ISC with additional icon attribution terms in its license file; IBM Plex Sans uses SIL OFL 1.1. web-vitals uses Apache-2.0. Consult the bundled full texts. Next.js and other development dependencies retain their own licenses. Review additional dependencies when changing the browser bundle or Docker image.

## Catalog icons

The 0.7.1 distribution restores genuine publisher app icons. The source package includes originals under `public/icons/`; PHP serves optimized local WebP derivatives (up to 256 pixels) and the original AntennaPod SVG under `assets/icons/`. Acquisition URLs for the eight Apple-hosted JPGs, the PowerToys PNG and AntennaPod SVG are recorded in docs/KATALOG_ORNEKLERI.md. AntennaPod media-kit usage is also recorded there. These local records are provenance evidence, not a blanket redistribution grant or a fresh verification of current license terms. Application artwork retains its publisher’s rights; project MIT terms do not cover it. The table below identifies associated publisher pages.

| Asset | Associated publisher page |
| --- | --- |
| `public/icons/notion.jpg` | https://www.notion.com/mobile |
| `public/icons/obsidian.jpg` | https://obsidian.md/download |
| `public/icons/todoist.jpg` | https://www.todoist.com/downloads |
| `public/icons/ticktick.jpg` | https://ticktick.com/download |
| `public/icons/vlc.jpg` | https://images.videolan.org/vlc/index.en_GB.html |
| `public/icons/firefox.jpg` | https://www.firefox.com/en-US/browsers/mobile/ |
| `public/icons/acrobat.jpg` | https://www.adobe.com/acrobat/mobile.html |
| `public/icons/xodo.jpg` | https://xodo.com/integration |
| `public/icons/powertoys.png` | https://learn.microsoft.com/en-us/windows/powertoys/install |
| `public/icons/antennapod.svg` | https://antennapod.org/download/ |

`public/images/night-landscape.png` is an existing project illustration. Its original creation and redistribution evidence has not been verified for release. Review it before publication. Theme JSON files are included as source examples; their inclusion does not clear any external linked assets. Original large design mockups are excluded from the source package. The same limits apply to copies under php/public/.

Editorial references are listed in `docs/EDITORIAL_KAYNAKLAR.md`. Linked material retains its original rights. Inclusion of a link does not imply endorsement or permission to republish the linked content.

## Original project artwork and the 0.7.1 icon correction

`public/artwork/night-mountains.svg` is original WexaShelf geometric background artwork under the project MIT license. It contains no embedded third-party image or font. The neutral monograms created for 0.7.0 remain authored source examples, but are no longer used as application icons: 0.7.1 restores the applications’ actual publisher artwork.

`php/resources/artwork-manifest.json` version2 records each genuine icon’s original local path, acquisition URL, optimized delivery path and separate rights notice. Its background entry independently records the MIT landscape provenance. Optimization changes the file encoding, not the icon’s ownership or license. No blanket copyright or redistribution permission is asserted for publisher artwork. Names and marks identify catalog entries without implying endorsement.

The unused `night-landscape.png` and its derivative remain excluded from new packages; the original MIT night-mountains SVG remains the active background. Historical 0.7.0 release receipts describe the former monogram-only package and do not describe 0.7.1 icon delivery.
