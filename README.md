# 🐺 Wolfie Font Swapper

Prosty dodatek do Chrome do **szybkiej podmiany i podglądu fontów** na dowolnej stronie WWW. Wybierasz font z wyszukiwalnego dropdownu, a styl jest **automatycznie wstrzykiwany** na stronę — bez przeładowania.

Autor: **Wolfie Paweł Witek**

---

## ✨ Funkcje

- **Wyszukiwalny dropdown (async)** — zacznij pisać nazwę fontu (np. `Roboto`, `Inter`, `Georgia`). Wyszukiwanie jest **debounce'owane (~0,8 s)** — po chwili od ostatniego znaku lista filtruje się dynamicznie „on the fly" (z chwilowym wskaźnikiem „Szukam…"). Lista ładuje się **partiami i doładowuje przy przewijaniu** w dół (lazy-load po 60 pozycji), więc nawet 300+ fontów nie spowalnia popovera.
- **Google Fonts + fonty systemowe** — ponad 300 rodzin z Google Fonts (ładowane dynamicznie) oraz typowe fonty systemowe. Każda pozycja ma znacznik **Google** / **System**.
- **Trzy niezależne dropdowny:**
  - **Cała strona** — ustawia `font-family` na całym dokumencie.
  - **Nagłówki** (`h1`–`h6`) — opcjonalny, nadpisuje nagłówki.
  - **Akapity** (`p`) — opcjonalny, nadpisuje akapity.
  - **Nawigacja** (`nav`, `[role="navigation"]`, `.navbar`, `.menu`, `header ul`…) — opcjonalny, nadpisuje elementy nawigacji.
  - **Przyciski** (`button`, `[role="button"]`, `.btn`, `input[type=submit]`…) — opcjonalny; oprócz fontu/grubości/odstępu/rozmiaru ma chipy **Wielkość liter** (`text-transform`: ABC / abc / Abc).
- **Chipy pod każdym dropdownem** — szybkie, opcjonalne presety (klik = włącz, klik ponownie = wyłącz), osobno dla każdego targetu:
  - **Grubość**: Light (300) / Regular (400) / Bold (700),
  - **Odstęp liter**: Ciasno (−0.5px) / 0 / Luźno (1.5px),
  - **Rozmiar**: S (14px) / M (18px) / L (24px).
  
  Uwaga: rozmiar dla „Całej strony" jest wymuszany na wszystkich elementach (`!important`), więc spłaszcza hierarchię — przydatne do podglądu, niekoniecznie do produkcji.
- **Automatyczne wstrzykiwanie stylu** — zmiana widoczna natychmiast po wyborze.
- **Fonty Google ładowane fizycznie z pominięciem CSP** — rozszerzenie pobiera pliki `.woff2` własnym `fetch`, osadza je jako `data:`-URL i wstrzykuje przez `insertCSS`, więc podgląd działa nawet na stronach blokujących zewnętrzne fonty.
- **Reset jednym kliknięciem** — przycisk „↺ Resetuj" usuwa cały wstrzyknięty styl i wczytane fonty.
- **Skrót klawiszowy `Ctrl+Shift+L`** (`⌘+Shift+L` na macOS) — otwiera popover.
- **Snippet do skopiowania** — po wyborze fontu na dole pojawia się gotowy kod w zakładkach:
  - **CSS** — z `@import` Google Fonts i regułami `font-family`.
  - **SCSS** — ze zmiennymi (`$font-base`, `$font-heading`, `$font-paragraph`).
  - **JS** — dynamiczne wstrzyknięcie `<link>` + `<style>` z poziomu JavaScriptu.
  
  Przycisk **⧉ Kopiuj** wrzuca aktualny snippet do schowka.

---

## 🧩 Instalacja (tryb deweloperski)

1. Otwórz `chrome://extensions`.
2. Włącz **Tryb programisty** (przełącznik w prawym górnym rogu).
3. Kliknij **Wczytaj rozpakowane** i wskaż folder `wolfie-font-swapper`.
4. Gotowe — przypnij ikonę i naciśnij `Ctrl+Shift+L`, by otworzyć popover.

> Skrót możesz zmienić na stronie `chrome://extensions/shortcuts`.

---

## 🚀 Użycie

1. Wejdź na dowolną stronę.
2. Naciśnij `Ctrl+Shift+L` (lub kliknij ikonę dodatku).
3. W polu **Cała strona** wpisz nazwę fontu i wybierz go z listy — strona zmieni się od razu.
4. (Opcjonalnie) ustaw osobne fonty dla **Nagłówków** i **Akapitów**.
5. Skopiuj gotowy snippet (CSS / SCSS / JS), jeśli chcesz przenieść font do swojego projektu.
6. Kliknij **↺ Resetuj**, aby przywrócić oryginalne fonty.

---

## 📁 Struktura projektu

```
wolfie-font-swapper/
├── manifest.json     # Manifest V3, uprawnienia, skrót klawiszowy
├── background.js     # Service worker (rejestracja skrótu)
├── popup.html        # UI popovera
├── popup.css         # Style popovera
├── popup.js          # Logika: dropdowny, wstrzykiwanie, snippety, kopiowanie
├── fonts.js          # Lista fontów (Google + systemowe)
├── icons/            # Ikony 16/48/128 px
└── README.md
```

---

## 🔒 Uprawnienia

- `activeTab`, `scripting` — wstrzyknięcie/usuwanie stylu na aktywnej karcie.
- `storage` — zapamiętanie ostatniego wyboru fontów.
- `host_permissions: <all_urls>` — działanie na dowolnej stronie.

Dodatek **nie wysyła żadnych danych** na zewnątrz. Fonty Google ładowane są bezpośrednio z `fonts.googleapis.com` dopiero w momencie ich wyboru.

---

## ⚠️ Uwagi

- Na stronach chronionych (`chrome://`, `chrome web store`) wstrzykiwanie jest zablokowane przez Chrome — to normalne.
- Niektóre strony używają fontów ikon (np. Material Icons). Selektor celowo pomija elementy z klasami zawierającymi `icon`, aby ich nie psuć.
