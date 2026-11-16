# Article images and app references

Article sections retain their plain-text paragraph format. Two explicit shortcodes can appear between text:

```text
Read the source before choosing a tool.

[app id="notion"]

[image id="64-character-lowercase-sha256-asset-id"]
```

The image example is a placeholder: insert the real token produced by the editor. Unknown or malformed syntax remains escaped plain text. HTML is never executed. App IDs remain stable identifiers; the published app card uses the current language's catalog entry and link. If no published localized entry is available, visitors see an unavailable message instead of a foreign-language or draft fallback.

In the article editor, choose the destination section and search the public catalog in the source language. **Insert app** appends its token as a paragraph. Move the token in the paragraph field to change its position. The editor offers a live body preview using the same renderer as the public page.

For an inline image, choose PNG, JPEG or WebP, supply alternative text and a caption, then select **Upload and insert image**. New uploads are limited to 2 MiB, 4096 pixels per side and 12 megapixels; SVG and GIF are not accepted. The server validates the file and returns its format, dimensions and asset ID. The upload adds metadata and a token only to the unsaved editor. Saving and publishing remain separate actions. Uploaded files stay private until referenced by a published article; a catalog JSON backup contains metadata, not the image bytes. Keep private media storage with the full installation backup.

An article may reference up to 20 image metadata entries. Existing AI cover reuse reads actual image dimensions before inserting it. Only metadata marked `aiGenerated:true` receives an AI disclosure; ordinary uploads are not labelled AI-generated. Removing image metadata does not silently rewrite authored paragraphs: remove the corresponding token too. Missing metadata renders an unavailable image message.

Public images retain their verified width and height, alternative text and caption, and load lazily. Private previews use authenticated media access. These source and unit checks do not replace actual upload, publication-access, localized rendering and mobile browser verification on an isolated test installation.
