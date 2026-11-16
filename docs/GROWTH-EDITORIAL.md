# Editorial growth resources

Growth resources are persisted editorial documents: intent pages, permanent comparisons, alternatives, author profiles and recorded tests. Draft/review/published/archived status is separate from SEO approval. Publishing requires substantive sections and dated source links; tests require a real method, environment, observations, limitations and author profile. No synthetic ratings, traffic forecasts or test results are generated.

The admin growth API supports revision-checked saves, revision history and draft restoration. Linked app fingerprints invalidate approval dynamically when source data changes. Published stale documents remain readable with a review notice and noindex; they leave hreflang and sitemaps. Approved complete locale versions use self-canonicals and reciprocal alternates. Backup/restore includes documents, revisions, lifecycle rules and imported GSC records.

Topic/intent insights identify duplicate intent, explicit internal links, orphan documents and topic-related suggestions. These are catalog-based editorial checks, not search-engine rankings or backlink measurements. URL lifecycle rules support local 301 redirects and 410 removals, reject protected paths, redirect loops and excessive chains.

GSC import accepts bounded CSV exports with a declared property prefix and reporting window, including semicolon-separated decimal-comma exports. Opportunities derive only from imported clicks, impressions and position. This does not activate OAuth or connect a Search Console account.

Public growth pages render accessible server HTML and structured data without visitor JavaScript. Interactive comparisons retain `/en/compare`; permanent comparisons use `/en/compare/{slug}` and their index uses `/en/comparisons`.

Validation: `php php/tests/growth.php` checks persistence, conflicts, revisions, source invalidation, editorial gates, insights, redirect loops, CSV boundaries/decimals, backup restoration, SSR and sitemap eligibility. Local tests do not establish traffic gains, Google indexation or production deployment.
