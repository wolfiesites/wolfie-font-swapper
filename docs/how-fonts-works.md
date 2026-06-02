# Jak fonty działają na stronie — i licencje

Krótkie wyjaśnienie tego, co robi Wolfie Font Swapper i dlaczego niektóre fonty
mają tag „Premium $" albo „System". Ta sama treść jest w **ustawieniach dodatku**
(sekcja „Jak fonty działają na stronie") we wszystkich 9 językach.

## W skrócie — w 4 krokach

1. **Przeglądarka renderuje tekst fontem podanym w CSS** (`font-family`).
2. **Font pojawi się u odwiedzającego tylko, jeśli ma go zainstalowany** —
   inaczej zobaczy zamiennik (fallback z dalszej części stosu `font-family`).
3. **Aby font miał każdy odwiedzający, dołączasz jego plik** przez `@font-face`
   i hostujesz `.woff2` na swoim serwerze.
4. **Hostowanie cudzego fonta wymaga licencji** — sprawdź tag (tabela niżej).

```css
body, * {
  font-family: "Arial", sans-serif;
}
```

Tu `"Arial"` to żądany font, a `sans-serif` to fallback — gdy ktoś nie ma Arial,
przeglądarka użyje swojego domyślnego bezszeryfowego. Web-safe (jak Arial) działa
bez `@font-face`, bo jest preinstalowany praktycznie wszędzie.

## Web-safe vs `@font-face`

- **Web-safe** (Arial, Georgia, Times New Roman, Verdana…): historyczne „Core
  Fonts for the Web" — są na Windows i macOS. Wpisujesz nazwę i działa, **bez
  pliku i bez licencji**.
- **Wszystko inne**: jeśli odwiedzający nie ma fonta, musisz go **dostarczyć**
  jako plik:

```css
@font-face {
  font-family: "Twój Font";
  src: url("/fonts/twoj-font.woff2") format("woff2");
  font-display: swap;
}
body { font-family: "Twój Font", sans-serif; }
```

Plik `.woff2` hostujesz u siebie (lub używasz CDN dostawcy, np. Google Fonts).
**I tu wchodzi licencja**: serwowanie pliku fonta odwiedzającym = redystrybucja,
na którą musisz mieć prawo.

## Tagi licencji w wyszukiwarce

| Tag | Co znaczy | Licencja do web? |
|---|---|---|
| 🟢 **Web-safe** | Arial, Georgia, Times… — preinstalowane wszędzie (Win + Mac). | **Nie** — używasz wprost. |
| 🟢 **Free** | Hack, Fira Code, JetBrains Mono, Cascadia, DejaVu, Liberation… — open source (OFL/MIT). | **Nie** — wolno self-hostować za darmo. |
| 🟡 **Premium $** | Calibri, Cambria, Consolas, Tahoma, Corbel… (Windows/Office) **oraz** komercyjne (Helvetica, Gotham…). | **TAK** — do osadzenia na serwerze potrzebujesz licencji. |
| 🟡 **System** | Font lokalny nieznanego pochodzenia. | **?** — sprawdź licencję przed użyciem w sieci. |

### Dlaczego systemowe fonty Microsoftu są „Premium"?

Calibri, Cambria, Consolas, Tahoma itd. **działają lokalnie** (masz je z Windows
/ Office), ale są **proprietary**. Nie wolno ich wrzucić jako `.woff2` na serwer
bez licencji webfont. Dlatego dodatek oznacza je `$` i podpowiada darmowy,
metrycznie zbliżony odpowiednik z Google Fonts (np. Calibri → Lato,
Consolas → Inconsolata, Tahoma → Open Sans) oraz link „Szukaj fonta".

### Fonty zakazane „no matter what"

**Segoe UI** (Microsoft) i fonty **Apple** (San Francisco / SF Pro / SF Mono /
New York) są **wykluczone z listy** — licencja nie pozwala używać ich w sieci
poza platformami producenta, więc nie ma sensu ich proponować.

## Co robi Wolfie Font Swapper (a czego nie)

- **Renderuje** podgląd dowolnego fonta, który masz **u siebie** (Local Font
  Access) oraz darmowych Google Fonts (ładowane z Google).
- **Generuje gotowy CSS** (z `@font-face`, gdy trzeba) do wklejenia na stronę.
- **Nigdy nie serwuje plików fontów komercyjnych** — to byłaby nielegalna
  redystrybucja. Dla premium pokazuje darmowy odpowiednik do podglądu + link do
  zakupu/licencji u wydawcy.

> To wyjaśnienie praktyczne, nie porada prawna. Przy komercyjnym wdrożeniu
> sprawdź EULA konkretnego fonta.
