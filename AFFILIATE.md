# Konfiguracja afiliacji (linki „Kup font")

Wszystkie ID wklejasz w **jednym miejscu** — obiekt `AFFILIATE` w pliku
[`fonts-meta.js`](./fonts-meta.js):

```js
const AFFILIATE = {
  myfontsCjPrefix: "",        // MyFonts/Monotype (CJ) – deep-link prefix
  fontspringCjPrefix: "",     // Fontspring (CJ) – deep-link prefix (20%/10%)
  adobePartnerizePrefix: "",  // Adobe / Creative Cloud (Partnerize) – prefix linku
  creativeMarketParam: "",    // Creative Market (Impact) – parametr trackingu
  envatoMarketPrefix: "",     // Envato Market (Impact, kampania 4415) – deep-link prefix; link = prefix + encodeURIComponent(url)
  envatoElementsPrefix: "",   // Envato Elements (Impact) – deep-link prefix (subskrypcja, $120/rok)
  // envatoRef: "",           // PRZESTARZAŁE – stary ?ref= nie działa od 2019 (Envato przeszło na Impact)
  subId: "wfs",               // własny tag kampanii (opcjonalny)
};
```

Linki **działają od razu** (bez prowizji). Po wklejeniu ID zaczynają zarabiać.
Wszystko to zwykłe URL-e (zgodne z Manifest V3 — żadnego zdalnego kodu).

> ⚠️ **Nie commituj swoich prawdziwych ID do publicznego repo.** Zostaw w gicie
> puste placeholdery (jak teraz), a realne ID wpisz **tylko w paczce, którą
> wgrywasz do Chrome Web Store**. Powody niżej w sekcji „Czy publikować ID?".

---

## ⭐ Najprościej: Sovrn Commerce (jeden self-service signup, bez ręcznego aplikowania do każdej marki)

Sieci per-marka (CJ/Impact/Partnerize) wymagają **ręcznej akceptacji każdego
programu** i często odrzucają „software/extension". Alternatywa, która **nie
wymaga aplikowania do każdego sklepu osobno**: agregator linków
**Sovrn Commerce** (dawniej VigLink).

- **Jeden rejestr** obejmuje 50 000+ sklepów (m.in. **Adobe, Envato, Creative
  Market**, plus mosty do CJ/Impact/Awin gdzie są Monotype/Fontspring).
- **Akceptuje rozszerzenia przeglądarki** jako typ wydawcy (jako jedyny duży
  agregator wprost) — onboarding „mobile & software application".
- **MV3-safe**: ma **Redirect API = statyczny prefiks URL**
  `https://redirect.viglink.com?key=<APIKEY>&u=<zakodowany URL>&loc=<źródło>` —
  budujesz linki **we własnym UI popupu**, BEZ wstrzykiwania zdalnego JS na cudze
  strony (to ostatnie łamie i MV3, i regulaminy sieci).
- Friction: rejestracja → dodaj „campaign" (URL z Chrome Web Store) → wygeneruj
  kilka kliknięć → review ~5 dni roboczych. Revenue share po ich stronie.
- Sign up: <https://www.sovrn.com/commerce/> · onboarding software/extension:
  <https://knowledge.sovrn.com/kb/mobile-and-software-application-onboarding-guide-f>
  · API: <https://knowledge.sovrn.com/kb/api-onboarding-guide-for-commerce>

**Jak wpiąć w kod:** po akceptacji dostajesz `key` (APIKEY). Wtedy w
`fonts-meta.js` funkcja budująca link „kup" owija docelowy URL prefiksem
Redirect API, a w `popup.js` przełączasz `SHOW_AFFILIATE_LINKS = true`. Do tego
czasu linki/znacznik `$` są **ukryte** (kod zostaje, nic nie usuwamy).

> Fallback, jeśli Sovrn odrzuci: **Skimlinks** (Link Wrapper `go.skimresources.com`
> — też statyczny URL), ale jest pod strony contentowe, nie pod software.
> Niskofrykcyjne programy bezpośrednie do dołożenia: **Adobe** (Partnerize, bez
> progu), **Fontspring** (CJ, bywa instant), **Creative Market** (Impact).

---

## TL;DR — lista afiliacji do pozyskania

Programy, które warto założyć (gdzie da się uzyskać afiliację). Każdy mapuje się
na jedno pole w obiekcie `AFFILIATE`. Szczegóły krok-po-kroku w sekcjach niżej.

> **Publisher vs Advertiser (CJ):** rejestrujesz się jako **Publisher** (= afiliant,
> Ty) — raz, na całe konto. Potem w panelu wchodzisz w **Advertisers** (= marki,
> np. Monotype, Fontspring) i klikasz **Join Program** dla każdej z osobna.
> „Gdzie założyć" niżej = najpierw Publisher Sign Up, potem Join danego Advertisera.

| # | Firma / zasięg | Sieć | Gdzie założyć | Pole w `AFFILIATE` | Prowizja |
|---|---|---|---|---|---|
| 1 | **MyFonts / Monotype** — główny, prawie każdy font komercyjny | CJ (Commission Junction) | [cj.com](https://www.cj.com/) → **Publisher Sign Up** → w panelu **Advertisers** → Join „Monotype/MyFonts"; kontakt `affiliates@monotype.com` | `myfontsCjPrefix` | ~10% |
| 2 | **Fontspring** | CJ (to samo konto Publisher) | w tym samym panelu CJ → **Advertisers** → Join „Fontspring" | `fontspringCjPrefix` | 20% nowi / 10% wracający |
| 3 | **Adobe Fonts (Creative Cloud)** | Partnerize | [join.partnerize.com/adobe](https://join.partnerize.com/adobe) | `adobePartnerizePrefix` | ~85% za 1. mies. CC, cookie 30 dni |
| 4 | **Creative Market** — indie/trendy kroje | Impact | [creativemarket.com/affiliate](https://creativemarket.com/affiliate) | `creativeMarketParam` | ~10–15% |
| 5 | **Envato** (GraphicRiver / Elements) | **Impact** (deep-link; `?ref=` martwe od 2019) | [envato.com/affiliates](https://www.envato.com/affiliates) → Impact | `envatoMarketPrefix` / `envatoElementsPrefix` | Market 30% 1. zakupu • **Elements $120/rok** |

> **SkyFonts** — to tylko instalator Monotype, **nie ma własnego programu
> afiliacyjnego**. Fonty z biblioteki Monotype rozliczasz przez **MyFonts/CJ** (#1).
>
> **Adobe Fonts** — **nie sprzedaje się osobno**, wchodzi w subskrypcję Creative
> Cloud. Afiliujesz więc subskrypcję CC przez **Partnerize** (#3), a ona daje
> dostęp do Adobe Fonts.

**Kolejność wdrażania (rekomendacja):** najpierw **CJ** (załatwia #1 MyFonts i #2
Fontspring jednym kontem) → potem **Impact** (#4 Creative Market, #5 Envato
Elements) → na końcu **Partnerize** (#3 Adobe). Linki działają bez ID od razu,
więc możesz publikować dodatek, a afiliacje dopinać później.

---

## CJ krok-po-kroku (po założeniu konta)

Samo konto CJ = **zero linków**. Afiliacja rusza dopiero, gdy dołączysz do
programów marek i wkleisz wygenerowane prefiksy do dodatku.

```
[ ] 1. Network Profile   → Settings → Network Profile → wklej opis (patrz cj-network-profile.md) → Save
[ ] 2. Promotional Properties → dodaj wolfiesites.com, sklepy klientów, Wolfie Font Swapper
        ⚠ rozszerzenie/aplikację oznacz jako „special / software" (NIE „website")
[ ] 3. Ustawienia konta  → tax form (W-8BEN), bank (IBAN + SWIFT), waluta, próg wypłaty
[ ] 4. Advertisers       → Join „Monotype/MyFonts" i „Fontspring" → czekaj na akceptację
[ ] 5. Link Generator    → Deep Link do docelowego URL → skopiuj PREFIKS
[ ] 6. fonts-meta.js     → wklej prefiks do AFFILIATE (myfontsCjPrefix / fontspringCjPrefix)
                           TYLKO w paczce do CWS, nie w publicznym repo
```

**Szczegóły:**

1. **Network Profile** — Twoja „wizytówka" dla marek. Bez niej programy częściej
   odrzucają. Treść w `docs/cj-network-profile.md` (jeśli zapisana) lub wklej
   przygotowany opis.
2. **Promotional Properties** (osobne od profilu!) — dodajesz swoje „nośniki":
   strony i rozszerzenie. **Browser extension to „software", nie „website"** →
   musisz oznaczyć metodę jako **„special"**, co wymaga ręcznej akceptacji
   advertisera (wymóg PSA — patrz sekcja „Zanim zaakceptujesz CJ" niżej).
3. **Konto** — W-8BEN (pole US TIN puste, Foreign TIN = NIP), IBAN `PL…` +
   SWIFT/BIC (mBank: `BREXPLPWMBK`), waluta i Minimum Account Balance.
4. **Join Programs** — w zakładce **Advertisers** wyszukaj markę → **Join
   Program** → zaakceptuj warunki → **czekaj na akceptację** (przy „software"
   bywa ręczna, kilka dni). Jednym kontem dołączasz i do MyFonts, i do Fontspring.
5. **Generuj linki** — `Links → Link Generator` (Deep Link): wklej docelowy URL,
   wygeneruj, skopiuj **prefiks** (część przed Twoim URL-em).
6. **Wklej prefiks** do obiektu `AFFILIATE` w `fonts-meta.js` (`myfontsCjPrefix`,
   `fontspringCjPrefix`). Dodatek sam dokleja zakodowany URL fonta.

**Links vs Products vs Deep Link** (3 sposoby na link — co wybrać):

| Sposób | Co to | Dla dodatku |
|---|---|---|
| **Links** (Get Code) | gotowe bannery / linki tekstowe / smart links | raczej dla strony, nie dla dodatku |
| **Product Search / Products** | link do **konkretnego produktu** z feedu marki (font + cena + zdjęcie) | gdy chcesz linkować do konkretnego kroju |
| **Deep Link / Link Generator** | dowolny URL marki opakowany w tracking | ✅ **TO bierzesz** — z niego kopiujesz prefiks do `AFFILIATE` |

**EPC** = *Earnings Per Click* = zarobek na **100 kliknięć** (miara jakości
programu). W tabeli linków widzisz „Network EPC" (średnia całej sieci) — wysoki =
program dobrze konwertuje/płaci. Pełne wyjaśnienie: [`docs/how-cj-works.md`](./docs/how-cj-works.md).

> **Ważne:** Pamiętaj o **opłacie „dormant"** — brak rozliczalnej transakcji
> przez 6 mies. → CJ nalicza miesięczną opłatę, aż saldo zejdzie do zera. Przy
> starcie bez ruchu rozważ, czy aktywować CJ teraz, czy gdy dodatek ma userów.

> **Jak w ogóle działa CJ** (model afiliacji, przepływ pieniędzy, cykl
> transakcji, **słowniczek PL↔EN** terminów) — osobny dokument:
> [`docs/how-cj-works.md`](./docs/how-cj-works.md).

### Zanim zaakceptujesz CJ (kluczowe punkty PSA)

Umowa Publisher Service Agreement (dla UE/UK: **Epsilon International UK Ltd**,
prawo Anglii i Walii). Na co uważać przy rozszerzeniu:

- **Rozszerzenie = „software/special".** To nie „website" — musisz zadeklarować
  metodę jako „special" i uzyskać **ręczną akceptację** advertisera. Pominięcie =
  naruszenie umowy od pierwszego kliknięcia.
- **Software Publishers Policy.** Zakaz: wymuszania kliknięć, redirectów bez
  kliknięcia usera, podmiany cudzych referrali, „pop-over" wyników wyszukiwania;
  wymóg `afsrc=1`. Twój model (user sam klika link w UI) jest OK — **byle linki
  NIE były wstrzykiwane w cudze strony**.
- **Linki tylko w UI dodatku** (popup/opcje), z `rel="sponsored"` — nigdy
  wstrzykiwane w odwiedzane strony (łamie i CJ, i politykę Chrome).
- **Privacy policy + zgoda na cookies (GDPR).** Obie strony to „Controllers";
  potrzebny mechanizm zgody przed trackingiem CJ. I tak wymagane przez CWS.
- **Self-clicking zabroniony** — nie klikasz własnych linków po prowizję.
- **Aktywność konta** — brak logowania/transakcji ~30 dni roboczych → możliwa
  deaktywacja. Loguj się okresowo.
- **Indemnifikacja (§9)** — bierzesz na siebie roszczenia (np. spór o znak
  towarowy). Wymienianie nazw fontów to użycie nominatywne (zwykle OK).

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

## 3. Envato (GraphicRiver / Elements) — przez Impact (aktualne 2026)

> ⚠️ **Stara metoda `?ref=username` jest MARTWA** (Envato wyłączyło ją 3.10.2019).
> Nie tracKuje i nie płaci. Dziś **wszystko idzie przez Impact (impact.com)** —
> osobne kampanie dla Envato Market i Envato Elements.

### Ile można zarobić (stawki 2026)
| Program | Prowizja | Cookie | Co wyzwala |
|---|---|---|---|
| **Envato Market** (GraphicRiver/ThemeForest…) | **30% pierwszego zakupu NOWEGO klienta** (bez podanego limitu) | **90 dni** | tylko 1. transakcja klienta, który nie był na Envato przez 90 dni; kolejne zakupy = 0 |
| **Envato Elements** (subskrypcja, zawiera fonty) | **roczna: $120** • **miesięczna: do $60** (3× $20 przez 3 mies.) | **60 dni** | nowa subskrypcja |
| *Placeit* (opc.) | ~$50 rocz. / $20 mies. (zależne od GEO) | — | — |

**Przykłady:**
- Nowy user kupuje font za **$30** na GraphicRiver przez Twój link → **≈ $9** (30%, jednorazowo).
- Ktoś wykupuje **roczny** Envato Elements przez Twój link → **$120**.
- ⇒ Dla fontów **Elements ($120) jest dużo bardziej opłacalny** niż pojedynczy font z Market (~$9). Warto eksponować link do Elements.

### Jak założyć i wygenerować link
1. Start: **https://www.envato.com/affiliates** → „Join" przekierowuje do **Impact**.
   (Elements osobno: **https://envato.com/elements-affiliate-program/**.)
2. W Impact: **Brands → Find Brands → „Envato" → Apply** osobno do **Market**,
   **Elements** (i Placeit, jeśli chcesz). Akceptacja **ręczna, ~1–2 dni**;
   trzeba zweryfikować „property" (np. stronę / listing rozszerzenia).
3. Przed startem przeczytaj w przeglądarce regulamin (czy software/extension OK):
   **https://www.envato.com/affiliates/Envato_Affiliate_Program_General_Terms_August_2023.pdf**
4. Po akceptacji **wygeneruj prefiks deep-linku** — w Impact („Create a deep link")
   albo generatorem Envato (Market, kampania **ID 4415**):
   **https://dist.affiliates.envato.com/Market-link-generator/affiliate_link_builder.html**

### Format linku (Impact deep-link — owija dowolny URL produktu)
```
https://{twoja-domena-trackingowa}/c/{AccountID}/{AdID}/{CampaignID}?u={ENCODED_URL_PRODUKTU}
```
- `u=` to **zakodowany (`encodeURIComponent`) URL docelowy** strony fontu; domena
  celu musi być na allow-liście Envato (`graphicriver.net`, `elements.envato.com`…).
- Domena trackingowa Envato jest z rodziny **`*.envato.market`** (np. `1.envato.market`).
- **Twój dokładny prefiks (`AccountID`/`AdID`) zobaczysz dopiero po zalogowaniu do
  Impact** — skopiuj go RAZ i wstaw jako stałą. Market = kampania `4415`; Elements
  = osobna kampania (inny prefiks/stawka).

Przykład (Market): `https://1.envato.market/c/<ACCID>/<ADID>/4415?u=https%3A%2F%2Fgraphicriver.net%2Fitem%2Ftwoj-font%2F12345678`

### Jak wpiąć w kod
- W `fonts-meta.js` (obiekt `AFFILIATE`) trzymaj **dwa prefiksy**: `envatoMarketPrefix`
  i `envatoElementsPrefix`. Funkcja budująca link robi: `PREFIX + encodeURIComponent(urlProduktu)`.
  (Pole `envatoRef` jest przestarzałe — zostaje puste / do usunięcia.)
- Włącz pokazywanie linków: w `popup.js` ustaw `SHOW_AFFILIATE_LINKS = true`.
- Opcjonalnie dodaj **Sub IDs** (jak UTM) by widzieć konwersje per miejsce w UI.

### Ograniczenia (ważne dla rozszerzenia)
- **Chrome Web Store (zasady 2025):** linki afiliacyjne dozwolone tylko gdy dają
  realną korzyść userowi i wymagają **jego kliknięcia**; **zakaz** wstrzykiwania
  linków na strony bez akcji usera, w tle, oraz **nadpisywania cudzych ref-kodów**.
  Twój model (linki wyłącznie w popupie, klikane świadomie, bez injekcji) jest OK —
  **ale w opisie/listingu CWS musi być jawne ujawnienie afiliacji**.
- **FTC:** widoczne „affiliate link — we may earn a commission" **przy** przycisku
  (już mamy `affiliate_note`).

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
