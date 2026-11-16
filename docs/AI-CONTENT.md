# AI editorial drafts and durable jobs

AI generation requires an explicit administrator action and configured private provider credentials. Generation queues a durable job; it does not publish or save editorial content. Closing the browser does not discard the job. A configured CLI worker must process it; browser polling only reads stored status.

Text and image jobs use the same queue. OpenAI background response handles are retained and polled by the worker. Compatible providers run bounded foreground requests inside the worker, outside the browser request. No provider is silently substituted.

## Review and language boundaries

Each job captures selected source records, revisions, provider configuration fingerprint, source language and destination language. Changed source revisions or provider configuration prevent unsafe execution/application. Analysis tasks (claims, briefs and catalog questions) cannot be applied as article content. Generated evidence references are validated against the supplied context; output still needs editorial review.

Existing records retain their source language. New article/cover jobs capture the configured source language at enqueue time. A translation produces a patch for the separate translation workflow and revision, never a replacement of another language's canonical record. Applying a completed result only fills a draft; saving and publishing remain separate actions.

## Queue controls and costs

- Cancel stops a job only while it is pending, before any submission, and releases its monetary reservation.
- Retry creates a new request ID and revalidates source/configuration/budget. An uncertain previous submission requires explicit acknowledgement that it may already have been charged.
- Archive hides/marks a terminal job for shorter retention. It does not refund costs or remove today's budget ledger.
- Delete is allowed only for terminal jobs created before the current UTC day. Published cover assets are not deleted with job history.

Provider/network failures after a submission may leave an uncertain outcome. Such submissions are never automatically repeated. Review the provider account before choosing an explicit retry. Provider handle polling can retry transient read failures without generating another output.

Prices are administrator-configured USD estimates, not provider invoices. Budget-enabled requests reserve a conservative configured estimate before queueing; missing prices are rejected. Pending and uncertain jobs retain reservations. Today’s jobs cannot be deleted to bypass daily controls.

Resolved archived jobs become eligible for cleanup after 30 days; other resolved jobs after 90 days. Pending/running jobs are not automatically purged. Cleanup is bounded and runs when enqueueing/claiming work. The live history cap is 5,000 jobs; state returns the latest 100. Deleted request IDs remain tombstoned for 90 days, after which their idempotency protection expires.

See [cron workers](CRON-WORKERS.md) for installation. Source tests use injected mock transports; they do not activate or verify a paid provider account.
