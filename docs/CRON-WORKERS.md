# PHP cron workers

The AI queue needs PHP CLI and the same private configuration/database/storage used by the installed site. No Node.js service or always-running daemon is required. Installing the application does not automatically register a hosting cron job.

Test a single bounded run from the hosting shell, using the host's actual PHP 8.3+ executable and paths:

```sh
WEXA_STORAGE_PATH=/home/ACCOUNT/private/wexashelf-storage /usr/local/bin/php /home/ACCOUNT/wexashelf/cli/worker.php --queue=ai --max-jobs=5 --max-seconds=50 --concurrency=2
```

`cli/worker.php` is relative to the flat PHP distribution root (in a source checkout it is `php/cli/worker.php`). Replace the example paths; do not place secrets in command arguments. Confirm the CLI has the required extensions and can read private config and write private storage. Keep cron output private.

In cPanel Cron Jobs, a typical schedule is once per minute (`* * * * *`) with that command. The executable/path differs between hosts; ask the host for its supported PHP CLI path. Creating this entry is an operator action, not something the application claims to have activated. Only `--queue=ai` is currently accepted by this command.

Each invocation starts at most 1–20 work items (default 5), with a 1–300 second start budget (default 50). The time budget stops starting additional work; an in-flight bounded provider request can finish after it. Concurrent workers share database-backed leases and permit at most two active jobs. A job lease lasts 300 seconds. Use a small concurrency value on shared hosting.

An expired submission lease becomes uncertain, not eligible for automatic resubmission: the provider could already have accepted it. A saved provider handle can safely resume polling after lease expiry. Transient polling failures back off; excessive attempts eventually require operator review. Explicit queue retry is the only way to submit again after an uncertain outcome.

The command emits only processed job IDs/statuses and elapsed time, never prompts, provider credentials or raw provider responses. Keep host logs private. Nonzero exit status means the invocation failed; it is not proof that every job was unsubmitted. Inspect stored job state before retrying anything.

## Local checks

Use isolated empty synthetic databases as documented in the testing guide. `php/tests/ai-queue.php` exercises a separate PHP worker process with an injected mock provider, cancellation, uncertainty, lease recovery, concurrency and retention. It makes no paid provider calls. CLI readiness and local mock tests do not establish production cron activation or provider billing behavior.
