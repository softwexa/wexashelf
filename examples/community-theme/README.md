# Harbor community theme

`harbor.json` is a complete importable WexaShelf v1 theme. It uses the installed `atlas` template; it does not load executable code or external assets.

From the repository root:

```sh
npx tsx examples/community-theme/verify.ts
```

In the admin **Site appearance** screen, import `harbor.json`, inspect the draft preview, and explicitly activate it. In installations with the older Turkish admin labels, these controls are **Site görünümü**, **Site teması yükle**, and **Sitede etkinleştir**. Importing alone leaves the live site unchanged. The public appearance screen changes only that visitor's browser preference.

The **Themes & modules** screen also provides a read-only full homepage preview using the actual catalogue, plus saved appearance history. Restoring an appearance revision creates a new revision containing the previous theme and built-in module toggles. Keep an exported manifest for portable theme recovery; a theme JSON alone does not contain module toggles.

See [the theme development guide](../../docs/THEME-DEVELOPMENT.md) for the exact fields, validation rules, and custom template development.
