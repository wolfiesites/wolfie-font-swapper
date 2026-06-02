# Subskrypcja Pro przez ExtensionPay

Pro odblokowuje **nielimitowane presety** (darmowo: max 3). Płatność obsługuje
**ExtensionPay** (https://extensionpay.com) — gotowe rozwiązanie pod rozszerzenia
przeglądarek (Stripe pod spodem, bez własnego backendu).

> **Dlaczego nie płatności Chrome?** Google **wyłączył** Chrome Web Store Payments
> (~2021). Wbudowanego mechanizmu „płatny dodatek" już nie ma — trzeba użyć
> zewnętrznego dostawcy.

## Jak to jest wpięte w kod

| Element | Plik | Rola |
|---|---|---|
| Biblioteka | `ExtPay.js` | Oficjalny SDK (pobrany z repo Glench/ExtPay). |
| Service worker | `background.js` | `importScripts("ExtPay.js")` + `extpay.startBackground()` (wymagane, by płatność dochodziła) + `onPaid` → zapis flagi. |
| Popup | `popup.html` → `popup.js` | `ExtPay(EXTPAY_ID).getUser()` → `proActive`; przycisk „⭐ Pro" → `openPaymentPage()`. |
| Flaga | `chrome.storage.local` → `wfs_pro.active` | `true` = Pro (limit presetów = ∞). |
| Limit | `popup.js` → `FREE_PRESET_LIMIT = 3`, `presetLimit()` | Darmowo 3, Pro bez limitu. |

`EXTPAY_ID` jest w **dwóch miejscach** (musi być identyczny):
- `background.js` → `const EXTPAY_ID = "wolfie-font-swapper";`
- `popup.js` → `const EXTPAY_ID = "wolfie-font-swapper";`

## Konfiguracja krok po kroku

1. **Załóż konto** na https://extensionpay.com i kliknij **„Register Extension"**.
   Dostaniesz **identyfikator (slug)**, np. `wolfie-font-swapper`.
2. **Wpisz ten slug** jako `EXTPAY_ID` w `background.js` **i** `popup.js`
   (jeśli inny niż domyślny).
3. **Podłącz Stripe** w panelu ExtensionPay (Connect with Stripe) — to tu
   trafiają pieniądze.
4. **Ustaw plan** w panelu: subskrypcja miesięczna/roczna (sugestia: **$2–3/mies.**
   lub **$15–20/rok**) albo płatność jednorazowa. Cenę i trial ustawiasz na
   stronie ExtensionPay — **nie w kodzie**.
5. **Opublikuj rozszerzenie** w Chrome Web Store (patrz `how-to-publish.md`) i
   **wklej jego Extension ID** (32-znakowy, z `chrome://extensions`) w panelu
   ExtensionPay → pole „Extension ID". Bez tego płatności produkcyjne nie ruszą.
6. `manifest.json` ma już `host_permissions: ["https://extensionpay.com/*"]`
   oraz `ExtPay.js` w `web_accessible_resources` — nie ruszaj.

## Jak to działa dla użytkownika

- Po zapisaniu 3. presetu przycisk „Zapisz preset" się blokuje, a obok pojawia
  się **„⭐ Pro — presety bez limitu"**.
- Klik → `extpay.openPaymentPage()` otwiera kartę płatności ExtensionPay.
- Po opłaceniu `onPaid` (w `background.js`) ustawia `wfs_pro.active = true`,
  popup odświeża status (`refreshProStatus`) i limit znika.

## Testowanie (dev)

- ExtensionPay ma **tryb testowy** (Stripe test mode) w panelu — użyj kart
  testowych Stripe (np. `4242 4242 4242 4242`).
- Lokalnie (unpacked, przed publikacją) `getUser()` zadziała po zarejestrowaniu
  rozszerzenia w panelu. Jeśli `ExtPay.js` nie wczyta się lub slug jest pusty,
  dodatek **działa dalej w trybie darmowym** (limit 3) — kod jest w `try/catch`.

## Bezpieczeństwo / uwagi

- Flaga `wfs_pro.active` jest w `chrome.storage.local` — **zaawansowany user może
  ją podmienić**. Dla taniego tieru ($2–3) to akceptowalne; ExtensionPay i tak
  re-waliduje status przez `getUser()` (zapytanie do ich API) przy starcie.
- **Nie bramkuj** lokalną flagą niczego krytycznego/kosztownego.
- ExtensionPay jest **Merchant of Record tylko częściowo** — VAT/podatki w UE
  rozliczasz **samodzielnie** (Stripe nie robi tego za Ciebie). Jeśli to problem,
  alternatywą jest LemonSqueezy (MoR — VAT po ich stronie), ale wymaga modelu
  „klucz licencyjny" zamiast SDK.

## Przychód — orientacyjnie

Przy **1000 aktywnych userów** i ~2% konwersji na $2,5/mies. → **~$50/mies.**
Afiliacja fontów przy tej skali daje grosze; subskrypcja Pro jest realniejszym
źródłem (patrz też `../AFFILIATE.md`).
