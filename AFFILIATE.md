# Konfiguracja afiliacji (linki „Kup font")

Wszystkie ID wklejasz w **jednym miejscu** — obiekt `AFFILIATE` w pliku
[`fonts-meta.js`](./fonts-meta.js):

```js
const AFFILIATE = {
  myfontsCjPrefix: "",        // MyFonts/Monotype (CJ) – deep-link prefix
  fontspringCjPrefix: "",     // Fontspring (CJ) – deep-link prefix (20%/10%)
  adobePartnerizePrefix: "",  // Adobe / Creative Cloud (Partnerize) – prefix linku
  creativeMarketParam: "",    // Creative Market (Impact) – parametr trackingu
  envatoRef: "",              // Envato – Twój username
  subId: "wfs",               // własny tag kampanii (opcjonalny)
};
```

Linki **działają od razu** (bez prowizji). Po wklejeniu ID zaczynają zarabiać.
Wszystko to zwykłe URL-e (zgodne z Manifest V3 — żadnego zdalnego kodu).

> ⚠️ **Nie commituj swoich prawdziwych ID do publicznego repo.** Zostaw w gicie
> puste placeholdery (jak teraz), a realne ID wpisz **tylko w paczce, którą
> wgrywasz do Chrome Web Store**. Powody niżej w sekcji „Czy publikować ID?".

---

## 1. MyFonts — przez CJ Affiliate (Commission Junction) — GŁÓWNY

Najszersza oferta (Monotype/MyFonts), niemal każdy font komercyjny.

1. Załóż konto wydawcy: **https://www.cj.com/** → „Publisher Sign Up".
2. Po akceptacji wejdź w **Advertisers** i wyszukaj **Monotype / MyFonts**.
   Kliknij **Join Program** i poczekaj na akceptację programu.
3. Wejdź w **Links → Link Generator** (lub „Deep Link").
4. W polu docelowym wklej dowolny URL MyFonts, np.
   `https://www.myfonts.com/search/gotham/` i wygeneruj **Deep Link**.
5. Dostaniesz link w stylu:
   `https://www.anrdoezrs.net/links/<PID>/type/dlg/sid/<subid>/`
   (różne domeny: `anrdoezrs.net`, `tkqlhce.com`, `jdoqocy.com` — to normalne).
6. Skopiuj **wszystko do momentu, w którym zaczyna się Twój URL docelowy**
   (zwykle kończy się na `/dlg/...​/` przed zakodowanym adresem) i wklej jako
   `myfontsCjPrefix`. Rozszerzenie samo dokleja zakodowany adres fontu.

> Jeśli Twój panel CJ daje format `...?url=` — też zadziała: wklej prefix
> kończący się na `url=`, a my doklejimy zakodowany URL.

---

## 2. Creative Market — przez Impact — UZUPEŁNIENIE

Dobre dla indie/trendy krojów (np. Gilroy-style).

1. Załóż konto partnera: **https://creativemarket.com/affiliate**
   (przekieruje do platformy **Impact** — tam rejestracja).
2. W Impact znajdź **Creative Market → Create Link / Tracking**.
3. Najprościej: weź swój **parametr trackingu** (np. `ui=123456` albo `irclickid`/
   `ref=...`, zależnie od konta) i wklej **samą część `klucz=wartość`** jako
   `creativeMarketParam`. Doklejimy ją do linku wyszukiwania (`?` lub `&`).
4. (Alternatywnie, jeśli używasz pełnych linków Impact `goto/...`, daj znać —
   dostosuję funkcję `withParam` w `fonts-meta.js`.)

---

## 3. Envato (GraphicRiver / Elements) — UZUPEŁNIENIE / „unlimited"

1. Konto: **https://account.envato.com/sign_up** (zwykłe konto Envato).
2. Twój **username** to Twój identyfikator polecającego. Envato Market obsługuje
   prosty parametr `?ref=username` na każdym URL-u.
3. Wpisz username jako `envatoRef`, np. `envatoRef: "wolfiesites"`.
4. (Envato Elements — subskrypcja „wszystkie fonty" — rozliczasz przez Impact;
   jeśli chcesz osobny przycisk „Unlimited fonts", powiedz, dodam.)

---

## 4. Fontspring — przez CJ (20% / 10%)

1. Załóż/zaloguj się na **https://www.cj.com/** (Publisher) — ta sama sieć co MyFonts.
2. W **Advertisers** znajdź **Fontspring**, „Join Program".
3. W **Links → Link Generator** wygeneruj **Deep Link** do `https://www.fontspring.com/`.
4. Wklej **prefix** (część przed Twoim URL-em docelowym) jako `fontspringCjPrefix`.
   Rozszerzenie dokleja zakodowany URL wyszukiwania Fontspring.

> Prowizja Fontspring: ~20% od nowych klientów, 10% od wracających.

---

## 5. Adobe Fonts (Creative Cloud) — przez Partnerize

Uwaga: **Adobe Fonts nie sprzedaje się osobno** — wchodzi w **Creative Cloud**.
Afiliujesz subskrypcję CC (która daje dostęp do Adobe Fonts).

1. Rejestracja: **https://join.partnerize.com/adobe** (program zarządza Partnerize).
2. Po akceptacji wygeneruj **link trackingowy** do `https://fonts.adobe.com/`
   (lub strony Creative Cloud). Linki Partnerize mają formę
   `https://prf.hn/click/camref:XXXX/destination:` + zakodowany URL docelowy.
3. Wklej **prefix kończący się na `destination:`** jako `adobePartnerizePrefix`.
   Rozszerzenie dokleja zakodowany URL Adobe Fonts.

> Prowizja Adobe: ~85% opłaty za 1. miesiąc (plany miesięczne / roczne płatne
> miesięcznie) albo ~8,33% rocznej (roczny z góry). Cookie 30 dni.

---

## Jak to wygląda u użytkownika

- Gdy wybrany jest font **komercyjny**, w sekcji snippetu pojawia się dyskretny,
  mały wiersz: **Kup „NazwaFontu": Wydawca · MyFonts · Creative Market · Envato**
  oraz oznaczenie **„linki afiliacyjne"**.
- Fonty premium są oznaczone **$** na liście w popupie i w ustawieniach.
- Linki afiliacyjne mają `rel="sponsored"` (uczciwe oznaczenie).

## Wymogi (ważne)

- **Ujawnienie**: zostaw widoczne „linki afiliacyjne" (FTC + Chrome Web Store).
- **Prywatność**: kliknięcia idą bezpośrednio do sieci afiliacyjnej (CJ/Impact),
  nie zbieramy nic u siebie — ale jeśli dodasz własny serwer trackujący, dopisz
  to do `PRIVACY.md`.
- **Bez wstrzykiwania reklam** na strony użytkownika — tu linki są tylko w UI
  rozszerzenia, co jest zgodne z politykami.

## Czy publikować ID afiliacyjne w publicznym repo? — NIE

ID afiliacyjne **nie są tajne jak hasło** (i tak są widoczne w URL-ach każdemu,
kto używa rozszerzenia), ale **nie wrzucaj ich do publicznego GitHuba**:

- **Forki**: ktoś sklonuje repo i zbuduje wtyczkę z **Twoim** ID — Twoje linki
  trafią do cudzego dodatku, nad którym nie masz kontroli. Sieci (CJ/Impact)
  traktują linki afiliacyjne w niezadeklarowanych miejscach jako naruszenie
  regulaminu → **ryzyko bana konta**.
- **Higiena**: czysty publiczny kod = puste placeholdery.

**Zalecany układ:**
1. W repo (publicznym): `AFFILIATE` z pustymi stringami — commitujesz śmiało.
2. Realne ID wpisujesz **lokalnie** dopiero w paczce przed `zip`/upload do CWS.
   (Albo trzymaj prywatny `affiliate.local.js` poza gitem i wklejaj przed buildem.)
3. Nigdy nie wrzucaj do kodu klienta sekretów serwerowych (gdybyś dodał własny
   tracker — token API trzyma się TYLKO na serwerze).

Sam **kod** afiliacji (funkcja `affiliateLinks`, UI) możesz publikować bez obaw —
to tylko logika; wrażliwe są wyłącznie wpisane wartości ID.

## Test

1. Wpisz ID w `AFFILIATE` i przeładuj rozszerzenie (`chrome://extensions`).
2. Wybierz font komercyjny (np. **Gotham** lub **Helvetica**).
3. Najedź na link „MyFonts" — w pasku statusu przeglądarki zobacz, czy URL
   zawiera Twój `PID`/parametr. Kliknij i sprawdź w panelu sieci, czy klik się
   rejestruje (zwykle po kilku–kilkunastu minutach).
