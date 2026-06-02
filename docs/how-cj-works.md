# Jak działa CJ (Commission Junction) — od ogółu do szczegółu

## CJ to skrót od czego?

**CJ = Commission Junction** (dziś marka „**CJ Affiliate**"). To jedna z
najstarszych i największych **sieci afiliacyjnych** na świecie (od 1998).
Obecnie część **Publicis Groupe** (przez Epsilon/Conversant) — dlatego w UE/UK
stroną umowy jest **Epsilon International UK Ltd**.

„Commission Junction" = dosłownie „skrzyżowanie prowizji": miejsce, gdzie
**marki** (które chcą sprzedawać) spotykają się z **twórcami/wydawcami**
(którzy kierują do nich klientów za prowizję).

---

## 1. Wielki obraz: czym jest marketing afiliacyjny

W grze są **4 strony**:

```
  TY (Publisher)         CJ (Sieć)            Marka (Advertiser)      Klient (Visitor)
  „polecam produkt"  →  „liczy kliknięcia  →  „sprzedaje font"    ←  „kupuje font"
                         i prowizje"
```

- **Publisher (Wydawca) = TY.** Masz stronę/dodatek i kierujesz ludzi do marek
  specjalnym linkiem. Za zakupy dostajesz **prowizję (Payout)**.
- **Advertiser (Reklamodawca/Marka) = np. Monotype/MyFonts, Fontspring.** Płaci
  prowizję za przyprowadzonych klientów.
- **CJ (Sieć) = pośrednik/platforma.** Śledzi kliknięcia, transakcje, liczy
  prowizje, pobiera pieniądze od marek i wypłaca Tobie. Nie sprzedaje nic
  swojego — dostarcza „instalację techniczną" całego mechanizmu.
- **Visitor (Odwiedzający) = klient.** Klika Twój link i kupuje u marki.

**Esencja:** CJ to „pośrednik zaufania" między tysiącami marek a tysiącami
wydawców — żeby nikt nie musiał podpisywać osobnych umów z każdym i budować
własnego trackingu.

### Reklamodawca vs reklamobiorca (kto jest kim)

Polskie nazwy łatwo pomylić — klucz jest w końcówce **-dawca** (daje) vs
**-biorca** (bierze):

| Polski termin | Kto to | Termin CJ | Co robi |
|---|---|---|---|
| **Reklamo-DAWCA** (daje reklamę + prowizję) | **marka** (MyFonts, Fontspring) | **Advertiser / Partner** | płaci prowizję za przyprowadzonych klientów |
| **Reklamo-BIORCA** (bierze reklamę, by ją pokazać) | **TY** | **Publisher** | pokazujesz linki marki i kierujesz klientów; zarabiasz prowizję |

Czyli: **reklamodawca = Advertiser = marka**, a **reklamobiorca = Publisher = Ty**.
Mnemonik: *dawca daje pieniądze, biorca bierze prowizję.*

---

## 2. Dlaczego istnieje sieć (a nie umowa wprost z marką)

Bez CJ musiałbyś: podpisać umowę z każdą odlewnią osobno, zbudować śledzenie
kliknięć, fakturować, pilnować płatności. CJ robi to **raz dla wszystkich**:

- jeden panel, jedno konto, jedna umowa (PSA),
- jednolite linki i śledzenie (**Tracking Code**),
- jedna zbiorcza **wypłata** miesięcznie (nawet jeśli zarobiłeś u 5 marek).

---

## 3. Jak płyną pieniądze

```
Klient kupuje font 100 zł u MyFonts
        │
        ▼
MyFonts płaci CJ prowizję (np. 10% = 10 zł)
        │
        ▼
CJ bierze swoją część i wypłaca Tobie Twój Payout
        │
        ▼
Przelew na Twoje konto (~20. dnia miesiąca, jeśli > próg)
```

Kluczowe: **najpierw marka musi zapłacić CJ**, dopiero potem CJ płaci Tobie.
Dlatego są opóźnienia (transakcja „pending" → „closed/locked" → wypłata).

---

## 4. Cykl życia jednej transakcji (krok po kroku)

```
1. Klient klika Twój link afiliacyjny (z Twoim PID + Tracking Code)
2. CJ zapisuje COOKIE w przeglądarce klienta (okno np. 7–30 dni)
3. Klient kupuje font (od razu albo w ciągu okna cookie)
4. Sklep marki odpala „pixel"/postback do CJ → rejestruje TRANSAKCJĘ
5. Transakcja jest „pending" (do zwrotu/anulowania może zniknąć = charge-back)
6. Po okresie zatwierdzenia → „locked/closed" = należna Tobie
7. ~20. dnia miesiąca CJ wypłaca, jeśli przekroczyłeś próg (Minimum Balance)
```

- **Cookie** = „pamięć", że to Ty przyprowadziłeś klienta. Bez kliknięcia w Twój
  link (i cookie) — nie masz prowizji.
- **Charge-back** = cofnięcie prowizji (zwrot towaru, refund, błąd, fraud).

---

## 5. Co widzisz w panelu CJ (i co to znaczy)

CJ Account Manager ma kilka głównych obszarów:

| Obszar | Co to | Co tam robisz |
|---|---|---|
| **Advertisers / Partners / Brands** | lista **marek** (reklamodawców) | wyszukujesz markę → **Join Program** → czekasz na akceptację. **To „partnerzy", których Ci wyświetla.** |
| **Links / Link Generator** | generator linków afiliacyjnych | tworzysz **Deep Link** do konkretnego URL marki → dostajesz link/prefiks z Twoim PID |
| **Reports** | raporty | klikalność, transakcje, prowizje, EPC |
| **Settings → Network Profile** | Twoja „wizytówka" dla marek | opisujesz, kim jesteś (patrz `cj-network-profile.md`) |
| **Settings → Promotional Properties** | Twoje „nośniki" (strony, dodatek) | dodajesz właściwości; **extension oznaczasz jako „special/software"** |
| **Settings → Payment/Tax** | wypłaty i podatki | W-8BEN, IBAN+SWIFT, waluta, próg |

> **„Wyświetla mi partnerów"** = to sekcja **Advertisers/Partners** — marki, do
> których możesz dołączyć. Samo wyświetlenie **nic nie znaczy**, dopóki nie
> klikniesz **Join Program** i marka Cię **nie zaakceptuje**. Dopiero wtedy
> wygenerujesz działające linki.

---

## 6. Kluczowe pojęcia (słowniczek)

- **Publisher** — Ty (wydawca/afiliant).
- **Advertiser / Partner / Brand** — marka płacąca prowizję.
- **Program** — oferta afiliacyjna konkretnej marki (jej stawki, zasady).
- **Join Program** — wniosek o dołączenie do programu marki (często z akceptacją).
- **PID / CID** — Twój identyfikator wydawcy/konta w CJ.
- **Tracking Code** — kod w linku, dzięki któremu CJ wie, że klik jest Twój.
- **Deep Link** — link afiliacyjny do **konkretnej** podstrony marki (nie tylko
  strony głównej). Generujesz go w Link Generator.
- **SID / subID** — Twój własny tag w linku (np. `wfs`) do rozróżniania źródeł
  ruchu w raportach.
- **Cookie window** — ile dni po kliknięciu zakup jeszcze się liczy.
- **Payout** — Twoja prowizja za transakcję.
- **Pending / Locked** — status transakcji (oczekująca / zatwierdzona).
- **Charge-back** — cofnięcie prowizji (zwrot/refund/fraud).
- **EPC** — Earnings Per Click, średni zarobek na 100 kliknięć (miara jakości
  programu).
- **Minimum Account Balance** — próg, od którego CJ wypłaca.
- **Dormant fee** — opłata, gdy konto przez 6 mies. nie ma rozliczalnej
  transakcji (patrz `../AFFILIATE.md`).
- **PSA** — Publisher Service Agreement (umowa, którą akceptujesz).

---

## 7. Twój przypadek (Wolfie Font Swapper)

- **Advertiserzy do dołączenia:** Monotype/MyFonts (#1) i Fontspring (#2) —
  jednym kontem CJ.
- **Promotional Property:** rozszerzenie = **„software/special"** (nie website) →
  ręczna akceptacja.
- **Linki:** generujesz **prefiks** w Link Generator i wklejasz do obiektu
  `AFFILIATE` w `fonts-meta.js` (`myfontsCjPrefix`, `fontspringCjPrefix`).
  Dodatek sam dokleja zakodowany URL fonta.
- **Zasada:** linki **tylko w UI dodatku**, `rel="sponsored"`, nigdy wstrzykiwane
  w cudze strony.

Pełna checklista i punkty umowy: **`../AFFILIATE.md`** (sekcje „CJ krok-po-kroku"
oraz „Zanim zaakceptujesz CJ").

---

## 8. Słowniczek PL ↔ EN (panel bywa po angielsku)

Mapowanie terminów, gdy panel masz po angielsku, a myślisz po polsku:

| English (panel CJ) | Polski | Co to |
|---|---|---|
| **Publisher** | Wydawca / reklamobiorca / afiliant | **Ty** |
| **Advertiser / Partner / Brand** | Reklamodawca / marka | firma płacąca prowizję (MyFonts, Fontspring) |
| **Network** | Sieć (afiliacyjna) | CJ — pośrednik |
| **Program** | Program (afiliacyjny) | oferta danej marki (stawki, zasady) |
| **Join Program** | Dołącz do programu | wniosek o przyjęcie do programu marki |
| **Advertiser approval / acceptance** | Akceptacja przez reklamodawcę | marka musi Cię zatwierdzić |
| **Link / Deep Link** | Link / link głęboki | link afiliacyjny (deep = do konkretnej podstrony) |
| **Link Generator** | Generator linków | narzędzie tworzące linki/prefiksy |
| **Tracking Code** | Kod śledzący | kod w linku, po którym CJ wie, że klik jest Twój |
| **PID / CID** | Identyfikator wydawcy / konta | Twój numer w CJ |
| **SID / subID** | Własny tag źródła | np. `wfs` — do rozróżniania ruchu w raportach |
| **Click** | Kliknięcie | klik w Twój link |
| **Impression** | Wyświetlenie / odsłona | pokazanie linku/banera |
| **Cookie window** | Okno cookie | ile dni po kliknięciu zakup się liczy |
| **Transaction** | Transakcja | zarejestrowana akcja (sprzedaż/lead) |
| **Lead** | Lead / pozyskany kontakt | akcja inna niż sprzedaż (np. rejestracja) |
| **Sale** | Sprzedaż | zakup u marki |
| **Payout / Commission** | Prowizja / wypłata | Twój zarobek za transakcję |
| **Pending** | Oczekująca | transakcja jeszcze niezatwierdzona |
| **Locked / Closed** | Zatwierdzona / zamknięta | należna Tobie |
| **Charge-back** | Cofnięcie prowizji / obciążenie zwrotne | odjęcie prowizji (zwrot/refund/fraud) |
| **EPC (Earnings Per Click)** | Zarobek na 100 kliknięć | miara jakości programu |
| **Minimum Account Balance** | Próg wypłaty / minimalne saldo | od ilu CJ wypłaca |
| **Dormant Account / fee** | Konto nieaktywne / opłata za nieaktywność | po 6 mies. bez transakcji |
| **Network Profile** | Profil w sieci / wizytówka | Twój opis dla marek |
| **Promotional Property** | Nośnik promocyjny / właściwość | Twoja strona / dodatek |
| **Special (promotional method)** | Metoda specjalna | np. software/extension — ręczna akceptacja |
| **Reports** | Raporty | statystyki klików/transakcji/prowizji |
| **Settings** | Ustawienia | konto, profil, płatności, podatki |
| **PSA (Publisher Service Agreement)** | Umowa wydawcy | umowa, którą akceptujesz |
| **Withholding tax** | Podatek u źródła | US (unikasz przez W-8BEN + treaty) |
| **Beneficial owner** | Beneficjent rzeczywisty | Ty (na W-8BEN) |
| **Foreign TIN** | Zagraniczny numer podatkowy | Twój **NIP** (JDG) |

---

## 9. W jednym zdaniu

> CJ to **giełda/pośrednik**, gdzie dołączasz do **programów marek** (np.
> MyFonts), dostajesz **specjalne linki**, a gdy ktoś przez nie kupi — CJ liczy
> prowizję i raz w miesiącu Ci ją **wypłaca**. Samo widzenie „partnerów" to
> dopiero katalog marek — pieniądze ruszają po **Join Program + linki**.
