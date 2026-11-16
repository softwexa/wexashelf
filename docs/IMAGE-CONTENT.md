# Article images and app references

Article paragraphs remain plain strings. Two exact shortcodes are interpreted by the shared renderer:

```text
[image id="64-lowercase-hex-SHA256"]
[app id="notion"]
```

The image example describes the required ID shape; use the actual64-character hash returned by upload. Unknown or malformed tags remain escaped text. Shortcodes are not HTML, Markdown execution, remote fetches or arbitrary component names. An app card uses an eligible published catalog record in the requested language; it does not invent facts or silently substitute another language.

## Image metadata

An article can hold at most20 unique image entries:

```json
{"assetId":"<64 lowercase hex characters>","format":"png","width":1200,"height":800,"alt":"Describe the relevant image content","caption":"Optional caption","aiGenerated":false}
```

Only `png`, `jpg` and `webp` are supported. Width/height are positive integers, at most4096 each and12million pixels combined. Alt text is required and bounded to300Unicode characters; caption is bounded to500. Both are plain text. Unknown fields, duplicate IDs, invalid dimensions and nonboolean provenance are rejected by PHP and TypeScript validation. App shortcodes are merged into canonical article app dependencies, bounded to100 unique references, so source changes participate in editorial review.

## Upload and private storage

The authenticated media upload accepts `{base64,alt,caption}` and returns `{image}` at the API layer. The service accepts at most **2MiB decoded bytes**, verifies actual PNG/JPEG/WebP signatures and dimensions, and derives identity from SHA-256 of the bytes. SVG, GIF, URL imports and data-URL wrappers are unsupported. No GD extension or image recompression is required. Bytes are stored atomically with0600 permissions under private `storage/media/`; no original filename is trusted.

Uploaded bytes remain opaque: **EXIF/location metadata is not stripped**. Remove unwanted metadata before uploading a file intended for publication. Uploading creates a private asset reference; saving and publishing the article remain separate editorial actions. The server, not the upload request, sets `aiGenerated:false`. Existing AI PNG covers retain their existing workflow and can be read for inline reuse up to the existing12MiB stored-file bound; this does not increase the2MiB upload limit.

The owner/editor/publisher API permission and published-reference checks are enforced by routing. Analysts cannot upload or preview private media. Public media access requires an eligible published article reference; possession of a hash alone is not permission. Responses must use the verified image content type and `nosniff`. File reads reject path traversal, symlinks and altered bytes whose hash no longer matches the ID.

## Translation and backup

Only image alt text and caption are translation fields. Asset ID, format, dimensions and provenance remain source facts. Paragraph translations preserve the parsed image/app reference identities; malformed text is not treated as a valid reference. Published translation requirements apply to the image text alongside other article fields. Frozen stale translation snapshots retain their own referenced image metadata.

Catalog JSON backups carry image metadata and shortcode references, **not image bytes**. A complete backup/restore also needs the private media directory. Schema validation deliberately does not require every file to be present on the current machine, allowing portable backup previews; missing files must not become an invented image. Preserve private storage during upgrades.

Focused PHP tests use generated synthetic3×2 fixtures in three formats and cover opaque-byte storage, permissions, format/size/pixel/text limits, tampering, translation identity and backup validation. TypeScript tests cover equivalent schema constraints and app dependency extraction. These are local tests, not a security certification or real hosting/provider activation.

## Application icons

The app editor can upload the publisher's real PNG/JPEG/WebP icon. It preserves aspect ratio and transparency while preparing a WebP no larger than 256 pixels per side. The new `/media/<hash>.webp` path updates only the unsaved app. Authenticated preview works before publication; public access requires an admitted, published app or its eligible published translation. Withdrawal of the last reference revokes access. Keep these media bytes in full installation backups.

Manual `/icons/custom-publisher.png` paths remain supported: place the corresponding file under the public `icons` directory on your own host. The ten bundled icons have explicit optimized mappings; unknown custom filenames retain their declared path. Uploading through the editor avoids manual filesystem work.
