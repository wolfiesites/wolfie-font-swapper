# Publikacja w Chrome Web Store

Jak wydać Wolfie Font Swapper. Kolejność ma znaczenie: **najpierw publikacja**,
bo dopiero opublikowane rozszerzenie ma stałe **Extension ID** potrzebne do
ExtensionPay (patrz `how-to-extension-pay.md`).

## 0. Zanim spakujesz — checklista

- [ ] `manifest.json` → `version` podbity (np. `1.0.0` → `1.0.1`).
- [ ] **Afiliacje**: realne ID w obiekcie `AFFILIATE` (`fonts-meta.js`) wpisujesz
      **tylko w paczce do uploadu**, nie w gicie (patrz `../AFFILIATE.md`).
- [ ] `EXTPAY_ID` ustawiony w `background.js` i `popup.js` (ten sam slug).
- [ ] Pliki licencji fontów obecne: `fonts/Rubik-OFL.txt`, `fonts/Audiowide-OFL.txt`.
- [ ] Przetestowane jako **unpacked** (`chrome://extensions` → „Load unpacked").

## 1. Konto dewelopera

1. Wejdź na **https://chrome.google.com/webstore/devconsole**.
2. Jednorazowa **opłata rejestracyjna $5** (Google).
3. Uzupełnij dane konta (publisher).

## 2. Spakuj rozszerzenie (ZIP)

Spakuj **zawartość** katalogu projektu (pliki w korzeniu zip, nie w podfolderze).
**Wyklucz** to, co niepotrzebne w paczce:

```
.git/          (historia gita)
docs/          (te instrukcje)
*.md           (README/AFFILIATE/itp. — opcjonalnie)
.DS_Store, Thumbs.db
```

Zostaw to, co rozszerzenie ładuje w runtime: `manifest.json`, `*.js`
(w tym `ExtPay.js`), `*.html`, `*.css`, `icons/`, `fonts/` (z plikami OFL).

PowerShell (przykład — dostosuj listę):

```powershell
$items = "manifest.json","background.js","content.js","popup.js","popup.html",
  "popup.css","options.js","options.html","i18n.js","fonts.js","fonts-meta.js",
  "ExtPay.js","icons","fonts"
Compress-Archive -Path $items -DestinationPath wolfie-font-swapper.zip -Force
```

## 3. Wymagane materiały do listingu

- **Ikona** 128×128 (masz w `icons/`).
- **Screenshoty** 1280×800 lub 640×400 (min. 1, najlepiej 3–5).
- **Opis** (krótki + pełny) — najlepiej PL + EN.
- **Kategoria**: Productivity / Developer Tools.
- **Polityka prywatności** (URL) — wymagana, bo używasz `storage` i sieci.
  Napisz krótką stronę: jakie dane (presety/ulubione w `chrome.storage` lokalnie),
  że nie ma własnego trackingu, oraz że płatności idą przez ExtensionPay/Stripe,
  a kliknięcia afiliacyjne przez sieci (CJ/Impact/Partnerize). Patrz `PRIVACY.md`
  jeśli istnieje.

## 4. Uzasadnienie uprawnień (review)

W formularzu „Privacy practices" wyjaśnij **każde** uprawnienie:

| Uprawnienie | Uzasadnienie |
|---|---|
| `activeTab` / `scripting` | Wstrzyknięcie panelu i podmiana fontów na aktywnej karcie na żądanie usera. |
| `storage` | Zapis presetów, ulubionych, reguł domen, statusu Pro — lokalnie. |
| `host_permissions` fonts.* | Ładowanie darmowych Google Fonts (podgląd/aplikacja). |
| `host_permissions` extensionpay.com | Weryfikacja subskrypcji Pro (ExtensionPay). |
| `<all_urls>` (content script) | Dodatek działa na dowolnej stronie, którą user chce ostylować. |

**Nie** używasz remote code (ExtPay.js jest w paczce, nie ładowany zdalnie) —
to ważne dla zgodności z MV3.

## 5. Wyślij do recenzji

1. Devconsole → **„Add new item"** → wgraj ZIP.
2. Uzupełnij listing, prywatność, uprawnienia, dystrybucję (kraje, widoczność).
3. **Submit for review**. Recenzja zwykle trwa od kilku godzin do kilku dni.

## 6. Po publikacji — domknij ExtensionPay

1. Skopiuj **Extension ID** (32 znaki) z `chrome://extensions` (po instalacji ze
   Store) lub z devconsole.
2. Wklej go w panelu **ExtensionPay → Extension ID**.
3. Przełącz Stripe z trybu testowego na **produkcyjny**.
4. Zrób testowy zakup, żeby potwierdzić, że `onPaid` ustawia `wfs_pro.active`.

## 7. Aktualizacje

- Podbij `version` w `manifest.json`, spakuj na nowo, wgraj jako nową wersję
  tego samego itemu. Extension ID **się nie zmienia** (więc ExtensionPay działa
  dalej).

## Powiązane

- `how-to-extension-pay.md` — konfiguracja subskrypcji Pro.
- `how-fonts-works.md` — model licencyjny fontów (przyda się do opisu/FAQ).
- `../AFFILIATE.md` — linki afiliacyjne i gdzie wpisać ID.
