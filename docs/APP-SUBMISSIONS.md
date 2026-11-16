# Wexa Submissions

Wexa Submissions is a bundled, optional extension for receiving app listings and images for editorial review. It is **disabled by default**. It collects links to Google Play, Apple App Store and Microsoft Store listings; it does not host APK, EXE or other application binaries.

This guide describes the current source addition. Integrated local PHP/MariaDB browser and publication checks have passed; see the [validation record](APP-SUBMISSIONS-VALIDATION.md). New release-package validation is still pending. Earlier 0.8.0 archives do not include this addition.

## Enable and moderate

1. Sign in to the separate `/admin` panel as the owner and open **App submissions**. The **Themes & modules → Manage app submissions** entry opens the same workspace.
2. Select **Allow app submissions**, then **Save submission settings**. This is an independent server setting; choosing a theme, enabling a homepage module or changing browser-local preferences cannot enable submissions.
3. Review the queue by status. Open a pending entry to inspect its store links, descriptions, private contact fields, real app icon and screenshots. Submitted information does not verify publisher ownership or factual claims.
4. Enter a new app record ID, review the sources and images, and explicitly acknowledge the review before choosing **Create app draft**. Existing record IDs are never overwritten.
5. Use **Open app draft** to edit the resulting record in Content. Acceptance always creates an unpublished draft with SEO approval off and no schedule. Admission requirements, factual verification, translation review and publication remain separate editor actions.

Acceptance copies validated intake images into the normal catalog media store. Contact fields stay in the private submission. Facts, plan limits and store metrics remain empty unless an editor later records evidence; acceptance grants no automatic admission exception. The submitted content language remains the source language, and the source-check date records the acceptance review date.

**Reject submission** requires a message to the applicant. The review message is visible through the private tracking code and is not an internal note; its maximum length is 1,000 characters. Revision conflicts preserve the admin form for review before loading the latest state. Moderation and settings are owner-only on the server, not merely hidden from other roles in navigation.

Closing submissions blocks creation, editing, media changes and final submission. Owners can still moderate existing entries. Applicants with a valid code can still check status, read their intake images and withdraw a draft or pending entry. A withdrawn submission cannot be reopened; a new submission is a separate entry.

## Applicant workflow and private tracking

The English page is `/en/submit-app`; the Turkish page is `/uygulama-gonder`. Installation subdirectory prefixes apply normally. Both are utility routes with `noindex`, no canonical URL and no sitemap entry. A closed installation still provides the status/withdrawal workflow, while public navigation offers the submission link only when intake is enabled.

Applicants enter app details, at least one recognized HTTPS store listing, an optional HTTPS publisher website, category, an installed/enabled content language, pricing model and optional tags. A real publisher icon is required before final submission; up to five screenshots can show the actual app interface. Uploading or saving a draft is separate from **Submit for review**, which requires an explicit permission acknowledgment.

The browser creates a private tracking credential and offers **Copy code** and **Download receipt**. The code is held in memory and is not automatically saved in browser storage. Save it privately before leaving the page. Anyone with the complete code can access that submission and perform the actions its current status allows.

There are no applicant accounts, email notifications or password-reset emails. Optional contact name/email fields are private and do not establish an identity. **A lost tracking code cannot be recovered by the site**: the server stores its hash, not the original secret. Codes are sent in request bodies rather than URLs. Do not paste them into public issues, screenshots or support logs.

## Limits and image handling

| Item | Current bound |
| --- | --- |
| Store links | One to three recognized HTTPS app listings, one per supported platform |
| Public image formats | PNG, JPEG and WebP only |
| Public image size | At most 1 MiB per input image and uploaded encoded image |
| Browser decode limit | At most 4,096 pixels per side and 12 megapixels |
| Browser output | WebP; icon up to 256 pixels and screenshot up to 1,440 pixels on the longest edge |
| Server dimensions | Icon at most 512 pixels per side; screenshot at most 2,048 pixels per side |
| Screenshots | At most five attached screenshots per submission |
| Upload lifetime | At most 12 uploads per submission, including replacements; removing an image does not reset this count |
| Queue | At most 200 retained entries across statuses |
| Private intake files | At most 100 MiB across the private submissions directory |
| New submissions | Rolling 24-hour checks: 20 overall and five for one address hash; additional API rate limits apply |
| Unfinished drafts | Expire after seven days without an update |

App details are plain text. Name, tagline, description and publisher limits are 100, 180, 8,000 and 120 characters respectively. Optional tags are limited to ten unique tags of up to 40 characters each. Public intake does not accept ratings, download counts, verified facts, exact prices or SEO approval claims as structured catalog evidence.

The server validates raster format, file boundaries, dimensions, size and stored hashes. It never fetches the submitted store/website URLs or remote image URLs. The supported browser form draws and re-encodes images as WebP. **The server preserves validated bytes and does not strip embedded metadata.** The upload endpoint is not a metadata-removal service.

After acceptance, the normal app editor can preview, reorder and remove screenshots or edit their alternative text/captions. It can also upload screenshots through the existing authenticated media endpoint, with its separate 2 MiB input/output limit and 1,440-pixel WebP resizing. These edits affect the unsaved app form until the owner saves it. Catalog images are publicly served only through eligible published app/translation references.

## Retention, quota and purge

Intake media lives under `storage/submissions/<submission-id>/` in the installation's private storage root. Public reads require the matching tracking credential; admin reads require an owner session. These are separate from normal catalog files under `storage/media/`.

An expired draft cannot be resumed or moderated. Expired-draft files and rows are cleaned when a subsequent new submission triggers cleanup; there is no claim of a background job deleting them at an exact time. Pending, accepted, rejected and withdrawn rows remain until the owner acts. Closed rows continue to consume queue capacity.

Use **Purge closed submission** for accepted, rejected or withdrawn rows after reviewing the confirmation. Purging removes that row and its private intake directory, including unused replacement files. It does not delete the accepted catalog record or files in the normal catalog media store. Removing or replacing an image while editing a draft may leave its old private bytes until that ticket is purged or cleaned after expiry, so physical quota usage is not simply the size of currently attached images.

## Backup and recovery

The private catalog JSON backup includes submission settings, bounded queue metadata, contact fields, review messages, image references and the stored tracking/request/address hashes. It never contains the original tracking secret. Treat the backup as private applicant data even though secrets are hashed.

**The JSON does not contain submission image bytes.** Include the private `storage/submissions/` directory in the ordinary filesystem/hosting backup, alongside the existing private configuration and normal `storage/media/` backup. For cPanel, preserve it in the private hosting-file backup; for Docker, back up the configured persistent storage volume. Keep metadata and files from a consistent backup point.

Restore through the existing [private catalog recovery workflow](BACKUP-RECOVERY.md), and restore the matching private filesystem backup separately. Missing or changed intake files fail safely during preview/acceptance; restoring JSON alone cannot reconstruct them. Legacy catalog backups without submission metadata restore the extension disabled with an empty queue. Filesystem restoration is an operator task, and queue restoration does not delete unrelated published catalog media.

## cPanel, Docker and contributor boundaries

This feature uses the primary PHP/MySQL runtime and existing private storage. It introduces no separate service, Node.js host process or **GD requirement**. Browser-side canvas encoding prepares WebP; the PHP server validates the bytes without re-encoding. The normal PHP extension, storage permission, rewrite and private-path requirements still apply: see [cPanel installation](KURULUM_CPANEL.md) and [installation operations](INSTALL-OPERATIONS.md).

Wexa Submissions is a first-party functional extension included in the source, not an imported executable module or a personal `enabledPlugins` preference. Its settings/queue use the existing repository transaction and revision patterns. The public config exposes availability and input limits, not applicant data or queue contents. Store identity checks prevent duplicate listed/pending applications; acceptance is repeat-safe and creates a new draft atomically with the review result.

Source-level checks, isolated PHP tests, real-browser moderation/public intake checks, backup recovery and final packaged-host validation are distinct evidence layers. Follow the [contributor testing guide](../documents/TESTING.md) and the [current local validation record](APP-SUBMISSIONS-VALIDATION.md). Local integration success is not a new packaged-release or customer-host installation result.
