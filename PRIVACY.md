# Privacy Policy — Wolfie Font Swapper

_Last updated: 2026-06-01_

Wolfie Font Swapper does **not** collect, store, transmit, or sell any personal
data. There is no analytics, no tracking, and no external server owned by the
developer.

## What the extension does

- **Local storage only.** Your last font selection, presets, and chosen
  interface language are stored locally in your browser (`chrome.storage.local`
  and `localStorage`). This data never leaves your device and is not shared with
  anyone.
- **Google Fonts requests.** When you pick a Google font, the extension fetches
  that font's CSS and font files directly from Google's public endpoints
  (`fonts.googleapis.com`, `fonts.gstatic.com`) so it can render a preview. These
  requests are made by your browser to Google; no personal data is added by the
  extension. See Google's privacy policy for how Google handles such requests.
- **System fonts.** With your one-time permission, the extension reads the list
  of fonts installed on your system (Local Font Access API) only to populate the
  font picker. This list stays on your device.
- **Page styling.** The extension injects CSS into the active tab to preview font
  changes. It reads only the active tab's URL (to skip protected pages) and does
  not read or send page content.

## Permissions

- `activeTab`, `scripting` — apply/remove the font preview on the page you are
  viewing, only after you open the popup.
- `storage` — remember your selection, presets, and language locally.
- `host_permissions` limited to `fonts.googleapis.com` and `fonts.gstatic.com` —
  download the fonts you preview.

## Contact

Questions: https://wolfiesites.com
