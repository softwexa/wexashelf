# Administration interface

The independent `/admin` workspace uses a fixed-width forest-green navigation rail and a light editing canvas. It is separate from public themes. The login screen follows the same visual language without exposing authenticated navigation.

## Finding a section

| Group | Sections available to the owner |
| --- | --- |
| Workspace | Overview, content records, AI studio, app submissions, feedback |
| Catalog quality | Capabilities, store sources, catalog admission |
| Discoverability | SEO, growth, translations, performance |
| Appearance | Appearance, extensions, language packs |
| Administration | Security, editors, system health, data transfer, backup transfer, upgrades |

Group headings expand or collapse their sections. The current section is highlighted and its group opens when navigation changes. Search matches translated section and group names; clearing it restores the grouped menu. A feedback badge shows the actual number of open feedback items and is omitted when zero.

The top bar contains the current group and interface language. Catalog refresh is shown for overview, records and feedback; independently loaded workspaces keep their own reload controls. Site access and account/logout controls remain at the bottom of the rail. The page title and description identify the selected task. Interface language changes do not translate stored content or change permissions.

At widths of 900px or less, a menu button opens a modal navigation drawer. The browser contains keyboard focus within it. Escape, its close button or clicking the backdrop dismisses it; focus returns to the menu button. Successful section changes close the drawer and focus the new heading. Long menus scroll independently, and content remains in the normal document flow.

The overview presents recent activity with localized action names. Each entry keeps its original action code, subject and details inside a collapsed disclosure. This changes presentation only; it does not rewrite the audit trail or infer publication from accepting an app submission.

## Editing and permissions

Navigation consumes the existing role-filtered list. It does not grant permissions: server authorization remains authoritative. Editor, publisher and analyst accounts see the seven existing non-owner sections; owner-only API requests are still rejected by the server.

Existing save, revision and publication behavior is unchanged. Leaving an unsaved record asks for confirmation; canceling preserves the record, scroll position and current menu context. Moving between content records and AI studio keeps the unsaved record mounted for the existing AI-to-draft workflow. Busy operations prevent section changes. Refresh updates the catalog workspace without replacing the unsaved record form; site access and logout retain their discard confirmations.

## Choosing catalog records

Record editors use a shared picker for an article's related apps and individual list entries. In article paragraphs, the picker can insert an `[app id="…"]` reference at the cursor or replace highlighted text. AI Studio uses the picker for its target record and for up to four ordered source apps.

Type to search, narrow the results with the available filters, and use the arrow and Enter keys to choose a row. In a multi-select picker, **Select displayed** adds the rows currently shown in order until the selection limit is reached. **Clear displayed** removes the shown rows from the selection. Choices from other searches and filters keep their order. You can reorder individual choices before selecting **Apply** to transfer them to the form. **Cancel** discards the edits made in the picker.

In **Themes and modules**, the package picker searches bundled and installed packages and filters by API, installation state, available app references and block type. API 2 packages can be copied into a separate editable draft with its own package ID and metadata. Its app picker searches apps published in the selected preview language. Choosing app IDs creates references for that package copy; it does not publish, edit or duplicate catalog records. The customized manifest must be previewed by the server, reviewed with its checksum, then installed disabled. Enabling remains a separate review-bound action.

## Extending the interface

- `src/components/admin/AdminWorkspace.tsx` owns role filtering, state, loading, save guards and section rendering.
- `src/components/admin/AdminShell.tsx` owns navigation, mobile focus management, header and page heading.
- `src/components/admin/admin-navigation.ts` declares groups, icons and section descriptions. Every available section must appear in one group.
- `src/components/admin/admin-activity.ts` maps known audit actions to interface messages and uses neutral labels for unfamiliar actions.
- `src/components/admin/AdminShell.module.css` scopes the authenticated palette and layout. Existing workspace components inherit semantic surface, text, warning and danger colors.
- `src/app/yonetim/admin.css` retains shared editor rules and the separately scoped login appearance.

Add English interface messages through stable keys and provide complete registered language packs. Keep public themes independent and do not add catalog mutations, fabricated metrics or provider calls to navigation. Validate role visibility, unsaved changes, keyboard focus, narrow layouts and the PHP browser build when changing the shell.

This describes current source after 0.8.0. Earlier 0.8.0 archives do not contain the redesign; a source build and a separately verified new package are required for distribution.

## Local validation

The redesign was exercised on an isolated PHP/MariaDB installation. The 24-check Chromium pass covered all 21 owner sections, grouped search, actual editor login with seven allowed sections and an owner-API 403 response, record draft preservation through refresh/AI/language changes, confirmed and canceled navigation, native mobile dialog behavior, and checked 320/390/1024px layouts. The temporary editor account was disabled afterward. No catalog, publication or provider mutation was sent.

The source typecheck, 88 existing unit tests, 2-language validation with 2,349 stable English message keys and PHP asset build passed. Final visual refinements receive a separate focused browser receipt rather than relabeling the earlier behavior run as a test of different bytes. Local receipts and screenshots are kept under `artifacts/admin-redesign/`; these private QA artifacts are excluded from distribution packages.

These checks are local interface evidence, not a new release ZIP, live-hosting test, accessibility certification or newly measured public Lighthouse score.
