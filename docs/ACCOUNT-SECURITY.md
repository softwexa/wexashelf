# Owner account security

The owner can rotate their password, enroll an authenticator, replace recovery codes and revoke sessions. Sensitive changes require the current password and, when enabled, a fresh authenticator or unused recovery code. Password/MFA changes and global sign-out revoke all installation sessions; an owner security revision also rejects older legacy sessions. Editor account revisions retain their existing revocation behavior.

Enrollment displays a setup key once, valid for ten minutes: SHA-1, six digits,30 seconds. No QR-service request is made. Confirmation returns ten recovery codes once; store them offline. Only hashes are retained, each code works once, and regeneration invalidates the previous set. Authenticator secrets remain in the private database because verification requires the key. None of these secrets enters catalog backups.

Verification follows [RFC6238](https://www.rfc-editor.org/rfc/rfc6238) and [HOTP](https://www.rfc-editor.org/rfc/rfc4226). Adjacent clock intervals are accepted, but previously accepted or older steps are rejected. A code used for enrollment or a sensitive action cannot immediately be reused for login: wait for the next code or use a recovery code. MFA is checked before session issuance. Keep the host clock accurate.

Login throttles cover account/IP pairs, accounts, IPs and a broader global abuse budget. Limiter keys hash account/IP values; session listings do not retain IPs or browser fingerprints. Only `REMOTE_ADDR` is trusted, so configure a trusted reverse proxy correctly rather than accepting arbitrary forwarded headers.

## Local owner recovery

There is no HTTP password-reset endpoint. A hosting administrator can place a new12–256-character password in a private0600 regular file, then run:

```sh
WEXA_STORAGE_PATH=/absolute/private/storage php php/cli/account-recovery.php \
  --password-file=/absolute/private/new-password.txt --confirm-owner-recovery
```

This replaces the owner password, resets owner MFA, revokes all sessions and records an audit event. Remove the password file afterward and re-enroll MFA. Existing login throttles still apply. Verify the target installation first; local recovery requires hosting access and must never be exposed as a web script.

`php php/tests/security.php /private/synthetic-database.json` uses the dedicated empty `wexashelf_security_070` schema. It checks RFC vectors, enrollment secrecy, MFA-before-session, replay rejection, one-use recovery codes, session revocation, password rotation, local recovery and scoped throttles. Local tests are not a penetration-test certification.
