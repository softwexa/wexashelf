# Catalog scaling

WexaShelf 0.7 uses a MySQL/MariaDB search projection for public discovery. A request returns 24 apps by default, with a maximum of 100 for explicit saved-ID batches. The browser does not download the entire catalog.

## Data flow

`ws_records` remains authoritative. `ws_catalog_index` stores searchable public text, locale, slug, category, platform flags, pricing, documented Android/TR download lower bound, publisher and publication time. Record and translation writes refresh their projection inside the editorial transaction. Unpublishing removes its entries immediately. Future scheduled entries are indexed but excluded until their publication time. Changing admission rules or restoring a backup rebuilds the projection under the repository write lock.

Search combines terms and filters with bound SQL parameters. Missing prices do not satisfy negative price filters. Missing downloads remain unknown. Search uses literal substring matching; SQL wildcard characters supplied by a visitor do not become wildcards. The projection avoids loading JSON record bodies for unmatched results. This is bounded application memory, not a claim that substring SQL scans are constant-time.

Initial HTML and bootstrap data include the current page and the records referenced by displayed articles, lists and bundled guides. Saved and comparison IDs load in explicit batches. Decision tools disclose their loaded candidate set and offer full-catalog search to add candidates. Publisher, blog and list directories paginate. Sitemap files contain at most 200 source records and their eligible locale versions; large catalogs receive a sitemap index.

The administrator record list uses server search and 100-row pages, with catalog-wide status counts. Selecting records and loading history uses specific IDs. Bulk backup, editorial analysis and export remain operator operations: they are not public request paths and can require additional memory. See [backup recovery](BACKUP-RECOVERY.md).

## Installation and maintenance

Fresh installation builds the projection. The upgrade wizard migrates it and rebuilds existing records. To repair it explicitly:

```sh
WEXA_STORAGE_PATH=/private/wexashelf-storage php cli/catalog-index.php --rebuild
```

Run this with the same PHP version and configuration as the site. Rebuilding does not change editorial content, approval, stable IDs or source language. It temporarily serializes editorial writes; public readers continue seeing the previously committed index until the rebuild commits.

## Local synthetic measurements

Recorded 2026-11-16 using local PHP and a Docker MariaDB instance. These are database/API measurements, not Lighthouse, cPanel or production field results. Seven samples per query; reported p95 is the highest of the seven observations.

| Synthetic apps | Query median range | Query p95 range | Homepage snapshot | Snapshot size | PHP peak memory |
|---:|---:|---:|---:|---:|---:|
| 10,000 | 52.61–90.87 ms | 56.63–105.17 ms | 105.64 ms | 102,391 bytes | 4 MiB |
| 50,000 | 98.65–242.68 ms | 114.16–247.21 ms | 122.60 ms | 102,392 bytes | 4 MiB |

The homepage contained 28 apps and 35 total records, including related editorial references, in both datasets. Initial fixture/index preparation took 71.66 and 376.99 seconds respectively; it is not performed on ordinary page requests.

Reproduce with `php php/tests/catalog-scale.php PRIVATE_QA_DATABASE_JSON RESULT_JSON` after provisioning the explicitly named `wexashelf_catalog_scale_070` test database. This benchmark writes synthetic records only to that schema. Do not point it at a production catalog. Hardware, hosting CPU allocation, database latency and content sizes affect results.
