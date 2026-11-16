# Community language templates

These files contain English reference copy for a new language. `xx` is a placeholder, not an enabled language. Translate all three templates (UI, static content and server messages/routes), preserve message keys/placeholders and static-content identities, then validate them before importing the complete package through administration (or registering it in source for a built-in locale).

See [the translation guide](../../docs/TRANSLATING.md). Do not include API keys, user data or scripts in language packs.

The templates track the 0.8 UI and server key inventories. Run `node scripts/check-locales.mjs examples/locales/ui-template.json examples/locales/content-template.json examples/locales/server-template.json` after editing; the `xx` placeholder must be replaced with your real locale before installation.
