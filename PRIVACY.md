# Privacy Policy — Wolfie Font Swapper

_Last updated: 2026-06-06_

Wolfie Font Swapper does **not** collect, store, transmit, or sell any personal
data. There is no analytics, no tracking, and no server owned by the developer.
Everything you configure stays in your browser.

## What the extension does

- **Local storage only.** Your font selections, presets, per‑domain rules, and
  chosen interface language are stored locally in your browser
  (`chrome.storage.local` / `chrome.storage.session` / `localStorage`). This data
  never leaves your device and is never shared.
- **Runs on the pages you visit (to apply fonts).** A content script is present on
  pages so it can (a) open the font panel when you click the toolbar icon, and
  (b) **auto‑apply the per‑domain font rules you saved** when you revisit those
  sites. To do this it reads only the page's **hostname** (to match your rules) and
  injects CSS to restyle text. It does **not** read, collect, or transmit the
  page's content, your browsing history, or anything you type.
- **Google Fonts requests.** When you preview a Google font, your browser fetches
  that font's CSS and files from Google's public endpoints (`fonts.googleapis.com`,
  `fonts.gstatic.com`) and the font catalog metadata from `fonts.google.com`. These
  requests go from your browser to Google; the extension adds no personal data. See
  Google's privacy policy for how Google handles them.
- **System fonts.** With your one‑time browser permission (Local Font Access API),
  the extension reads the **names** of fonts installed on your system only to
  populate the font picker. This list stays on your device.
- **Pro subscription (optional) — ExtensionPay.** If you choose to upgrade to Pro,
  payments are handled by **ExtensionPay** (a third‑party service that uses
  **Stripe** for processing). To manage your subscription, ExtensionPay processes
  your **email address and payment details on its own servers** — the developer
  never sees your card data. The free tier never contacts ExtensionPay for billing.
  See ExtensionPay's and Stripe's privacy policies for details.

## Permissions

- `activeTab`, `scripting` — open the panel and apply/remove the font preview on
  the page you are viewing.
- `storage` — remember your selections, presets, per‑domain rules, and language locally.
- **Content script on all sites (`<all_urls>`)** — required so saved **per‑domain
  font rules auto‑apply** when you revisit a site, and so the panel can open on any
  page. It only matches the hostname and injects CSS; no page content is read or sent.
- `host_permissions`: `fonts.googleapis.com`, `fonts.gstatic.com`, `fonts.google.com`
  (download/preview Google fonts + catalog) and `extensionpay.com` (Pro subscription only).

## Data sharing & sale

We do not sell or share data. The only data leaving your device is (1) the standard
Google Fonts requests your browser makes to Google when you preview a font, and
(2) — only if you opt into Pro — your email/payment to ExtensionPay/Stripe.

## Contact

Questions: https://wolfiesites.com — policy URL: https://wfs.wolfiesites.com/policy
