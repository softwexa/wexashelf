# Store sources and the review queue

WexaShelf reads store observations into review candidates. A fetch, import or cron run never applies those candidates to an app or publishes content. An owner reviews the before/after fields and explicitly applies or dismisses each candidate. Applying requires the source record’s revision to match, preserves its existing publication status, and clears SEO approval when data changes.

## Available adapters

| Provider ID | Input | Observation boundary |
| --- | --- | --- |
| `apple-lookup` | Apple product ID and country | Public Apple lookup response: identity, rating and rating count. Downloads remain unknown. |
| `google-play-public` | Android package ID and country | Public product-page JSON-LD for the same identity: available rating/count and any explicit download statistic. It does not scrape review text or infer downloads from ratings. |
| `microsoft-store-public` | Microsoft Store product ID and country | Public product-page JSON-LD for the same identity, with the same unknown-value rules. |
| Owner-defined `json` | A configured HTTPS feed endpoint | A strict, country-specific observation envelope from the operator’s chosen source. |
| Manual observation | Explicit identity, country, evidence URL and UTC check time | A candidate for human verification; entering a number does not establish its accuracy. |

Public HTML is an upstream dependency, not a stable catalog API. Missing/ambiguous JSON-LD, changed markup, unsupported rating scales, redirects and unavailable pages fail with a visible error. Use a licensed/configured feed or manual evidence when the public adapter cannot establish a reliable observation. A valid country code does not guarantee that a product is available there.

Apple documents its public search/lookup service in the [iTunes Search API overview](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/). Google’s [Developer API setup](https://developers.google.com/android-publisher/getting_started) requires a developer account and configured permissions; it is not treated here as a general public app catalog. Microsoft’s [Store analytics service](https://learn.microsoft.com/en-us/windows/uwp/monetize/access-analytics-data-using-windows-store-services) concerns apps registered to a Partner Center account and requires authentication. Those authenticated publisher APIs are not silently enabled by these public adapters.

Unknown values are `null`, including downloads when the selected source does not provide them. A known rating count is not an install/download count. Source URL, observation time, provider method and country remain attached to the candidate. No popularity or ranking claim is created merely by a successful fetch.

## Configure a JSON provider

In the owner’s source tools, add a stable ID, display name, supported platforms, HTTPS endpoint, cache period and hourly request limit. An optional bearer token stays in the private `storage/source-providers.json` file. Blank token input preserves the current token only for the same provider ID and endpoint; the clear-token control removes it. Tokens are not returned in API state, candidates or public records. Built-in endpoints and platform identities cannot be changed; they may be disabled.

A custom endpoint receives a read-only GET request:

```text
https://feed.example.org/observations?platform=android&storeId=org.example.app&country=US
Authorization: Bearer <private-token-if-configured>
```

Return one complete object:

```json
{
  "schemaVersion": 1,
  "platform": "android",
  "storeId": "org.example.app",
  "country": "US",
  "storeLink": "https://play.google.com/store/apps/details?id=org.example.app&gl=US",
  "sourceUrl": "https://feed.example.org/evidence/example-app-us",
  "observedAt": "2026-11-16T00:00:00Z",
  "rating": null,
  "ratingCount": null,
  "downloadsLowerBound": null
}
```

This is a synthetic schema example, not an app observation. Platform, identity and country must match the request. URLs must use public HTTPS, and the store link must identify the same app/country. `observedAt` is a valid UTC calendar time, at most five minutes ahead. Rating is 0–5 or null; counts are nonnegative safe integers or null. Extra fields, missing metrics and credential-bearing evidence URLs are rejected. An endpoint returning its private token inside an observation is rejected.

Network requests resolve public DNS addresses and pin a validated address to HTTPS with TLS verification. Private/reserved addresses, credentials in URLs, non-443 ports, redirects and proxies are rejected. Responses are limited to 2 MiB, with a five-second connection and twelve-second overall request timeout. These controls do not establish the truth or license of supplied data; the operator remains responsible for choosing a permitted source and reviewing its observations. No paid feed or credential is included or activated by installation.

## Queue and cPanel cron

Selecting **Queue refresh** creates a durable database job. The queue persists across page reloads; refreshing the admin page does not run the worker. Configure a PHP CLI cron job on the host to drain queued requests:

```cron
*/5 * * * * WEXA_STORAGE_PATH=/home/ACCOUNT/wexashelf-private /usr/local/bin/php /home/ACCOUNT/public_html/cli/source-worker.php --max-jobs=5 --max-seconds=50 >> /home/ACCOUNT/wexashelf-private/source-worker.log 2>&1
```

Replace paths and confirm the CLI binary has PHP 8.3+ and the required extensions. In a source checkout the command path is `php/cli/source-worker.php`; the hosting archive places it under `cli/`. Keep configuration, credentials and logs private. Installing the software does not create a hosting cron entry. This worker processes requests already queued by the owner; it does not invent a recurring refresh schedule or fetch the entire store.

Each run accepts at most 25 jobs and a 5–300 second scheduling budget. The budget is checked between requests; one in-flight request can finish after it. Defaults are five jobs and 50 seconds. A database lease prevents concurrent workers from claiming the same active job. Expired read-only leases are recoverable, and a stable candidate ID prevents a completed fetch from creating another candidate after a worker crash.

Transient transport/5xx failures retry at most three attempts with 60/120-second backoff. Rate-limited jobs wait an hour. Other errors require inspection and explicit retry. Queued/retry-wait jobs can be cancelled; active calls cannot be cancelled from the UI. Provider configuration changes require an explicit reviewed retry, preventing a waiting job from silently using a changed endpoint or token.

Cache keys include provider configuration, store identity, platform and country. Configurable cache periods are 5–10,080 minutes and per-provider hourly limits are 1–120 requests; defaults are conservative. Up to 2,000 cache entries and 500 finished job records are retained. The UI shows the latest 200 jobs. Idempotency is guaranteed while a job’s record remains in that retained history. Pending review candidates are preserved up to a 1,000-candidate cap; 500 handled/error candidates are retained separately. Review pending work before adding more when the cap is reached.

## Verification

```sh
php php/tests/source-providers.php /absolute/private/qa-database.json
```

The test requires an empty dedicated `wexashelf_sources_070` schema, uses temporary private provider storage and rolls back its synthetic catalog changes. It injects transport fixtures for all three built-ins and a custom feed. It checks identity/country/unknown metrics, real-world markup variants, private token handling, endpoint restrictions, cache, bounded retries, cancellation, candidate idempotency, revision conflicts and explicit review. It does not call a live or paid provider.

A separate local read-only observation on 2026-11-16 successfully parsed Apple Notion, Google Play Firefox and Microsoft Store PowerToys for US. All three observations had unknown download counts. That bounded check confirms those responses at that time; it is not an all-app/all-market guarantee or proof that cron is configured on another host. The local evidence file is `artifacts/verification/source-readonly-070.json`; artifacts are not promised contents of distribution archives.

A separate cross-process check committed an Apple fetch job, ran the actual PHP CLI command, and verified a completed job with a pending review candidate and unchanged managed records. Its isolated schema rows were then cleared. The local receipt is `artifacts/verification/source-worker-cli-070.json`; it records source hashes and explicitly marks hosting cron as unconfigured.
