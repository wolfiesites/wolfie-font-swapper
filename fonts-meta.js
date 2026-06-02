// Baza metadanych fontów: licencja (otwarty / komercyjny) + link do kupna.
// Google Fonts traktujemy jako otwarte (OFL/Apache) z linkiem do specimen.
// COMMERCIAL — kuratorska lista popularnych fontów komercyjnych z linkami do
// zakupu/licencji. Reszta = nieznana licencja.
(function () {
  const COMMERCIAL = {
    "Proxima Nova": "https://www.marksimonson.com/fonts/view/proxima-nova",
    "Gotham": "https://www.typography.com/fonts/gotham/styles",
    "Futura": "https://www.fonts.com/font/linotype/futura",
    "Helvetica": "https://www.fonts.com/font/linotype/helvetica",
    "Helvetica Neue": "https://www.fonts.com/font/linotype/neue-helvetica",
    "Neue Haas Grotesk": "https://www.fonts.com/font/linotype/neue-haas-grotesk-display",
    "Avenir": "https://www.fonts.com/font/linotype/avenir",
    "Avenir Next": "https://www.fonts.com/font/linotype/avenir-next",
    "DIN": "https://www.fonts.com/font/linotype/din",
    "DIN Next": "https://www.fonts.com/font/linotype/din-next",
    "Frutiger": "https://www.fonts.com/font/linotype/frutiger",
    "Univers": "https://www.fonts.com/font/linotype/univers",
    "Myriad Pro": "https://fonts.adobe.com/fonts/myriad",
    "Garamond": "https://www.fonts.com/font/linotype/garamond",
    "ITC Garamond": "https://www.fonts.com/font/itc/itc-garamond",
    "Trade Gothic": "https://www.fonts.com/font/linotype/trade-gothic",
    "Brandon Grotesque": "https://www.hvdfonts.com/fonts/brandon-grotesque",
    "Brandon Text": "https://www.hvdfonts.com/fonts/brandon-text",
    "Circular": "https://lineto.com/typefaces/circular",
    "Gilroy": "https://www.fontfabric.com/fonts/gilroy/",
    "Sofia Pro": "https://www.fontfabric.com/fonts/sofia-pro/",
    "Graphik": "https://commercialtype.com/catalog/graphik",
    "Canela": "https://commercialtype.com/catalog/canela",
    "Cera Pro": "https://www.type-together.com/cera-pro-font",
    "Apercu": "https://www.colophon-foundry.org/typefaces/apercu/",
    "Maison Neue": "https://www.milieugrotesque.com/typefaces/maison-neue/",
    "GT Walsheim": "https://www.grillitype.com/typeface/gt-walsheim",
    "Calibre": "https://klim.co.nz/retail-fonts/calibre/",
    "Tiempos": "https://klim.co.nz/retail-fonts/tiempos-text/",
    "Founders Grotesk": "https://klim.co.nz/retail-fonts/founders-grotesk/",
    "Suisse Int'l": "https://www.swisstypefaces.com/fonts/suisse/",
    "Sweet Sans": "https://sweettype.com/",
    "Sharp Sans": "https://sharptype.co/typefaces/sharp-sans/",
  };

  // Mapa po małych literach -> oficjalna nazwa (do wyszukiwania bez wielkości liter).
  const COMMERCIAL_LC = {};
  Object.keys(COMMERCIAL).forEach((k) => (COMMERCIAL_LC[k.toLowerCase()] = k));

  // Najbliższy DARMOWY odpowiednik (Google Font) dla fontu komercyjnego.
  // Używany jako fallback w stacku font-family, gdy nie masz oryginału —
  // dzięki temu zawsze coś się renderuje (a „$ Kup" prowadzi po oryginał).
  const COMMERCIAL_ALT = {
    "Proxima Nova": "Montserrat",
    "Gotham": "Montserrat",
    "Futura": "Jost",
    "Helvetica": "Inter",
    "Helvetica Neue": "Inter",
    "Neue Haas Grotesk": "Inter",
    "Avenir": "Nunito Sans",
    "Avenir Next": "Nunito Sans",
    "DIN": "Archivo",
    "DIN Next": "Archivo",
    "Frutiger": "Inter",
    "Univers": "Inter",
    "Myriad Pro": "Inter",
    "Garamond": "EB Garamond",
    "ITC Garamond": "EB Garamond",
    "Trade Gothic": "Archivo",
    "Brandon Grotesque": "Quicksand",
    "Brandon Text": "Quicksand",
    "Circular": "Mulish",
    "Gilroy": "Poppins",
    "Sofia Pro": "Poppins",
    "Graphik": "Manrope",
    "Canela": "Cormorant Garamond",
    "Cera Pro": "Poppins",
    "Apercu": "Work Sans",
    "Maison Neue": "Inter",
    "GT Walsheim": "Poppins",
    "Calibre": "Inter",
    "Tiempos": "Lora",
    "Founders Grotesk": "Inter",
    "Suisse Int'l": "Inter",
    "Sweet Sans": "Montserrat",
    "Sharp Sans": "Poppins",
    // Proprietary systemowe (Windows/Office) — darmowe, metrycznie zbliżone
    // odpowiedniki z Google Fonts (do podglądu, gdy nie masz licencji).
    "Calibri": "Lato",
    "Cambria": "PT Serif",
    "Candara": "Quattrocento Sans",
    "Consolas": "Inconsolata",
    "Constantia": "Lora",
    "Corbel": "Nunito Sans",
    "Bahnschrift": "Oswald",
    "Tahoma": "Open Sans",
    "Microsoft Sans Serif": "Open Sans",
    "Franklin Gothic Medium": "Libre Franklin",
    "Palatino Linotype": "Domine",
    "Lucida Console": "Inconsolata",
    "Lucida Sans Unicode": "Source Sans 3",
    "Arial Narrow": "Archivo Narrow",
  };
  const COMMERCIAL_ALT_LC = {};
  Object.keys(COMMERCIAL_ALT).forEach((k) => (COMMERCIAL_ALT_LC[k.toLowerCase()] = COMMERCIAL_ALT[k]));

  // Darmowy odpowiednik dla nazwy (lub null).
  function freeAlternative(name) {
    return (name && COMMERCIAL_ALT_LC[String(name).toLowerCase()]) || null;
  }

  function googleList() {
    return (window.WOLFIE_FONTS && window.WOLFIE_FONTS.GOOGLE_FONTS) || [];
  }

  // Konkretne licencje Google Fonts (poza domyślną OFL).
  const APACHE = new Set(
    [
      "Roboto",
      "Roboto Condensed",
      "Roboto Mono",
      "Roboto Slab",
      "Open Sans",
      "Open Sans Condensed",
    ].map((s) => s.toLowerCase())
  );
  const UFL = new Set(
    ["Ubuntu", "Ubuntu Mono", "Ubuntu Condensed", "Ubuntu Sans", "Ubuntu Sans Mono"].map(
      (s) => s.toLowerCase()
    )
  );

  const LICENSE_INFO = {
    OFL: {
      name: "SIL Open Font License 1.1",
      url: "https://openfontlicense.org/open-font-license-official-text/",
      cost: "free",
    },
    APACHE: {
      name: "Apache License 2.0",
      url: "https://www.apache.org/licenses/LICENSE-2.0",
      cost: "free",
    },
    UFL: {
      name: "Ubuntu Font License 1.0",
      url: "https://ubuntu.com/legal/font-licence",
      cost: "free",
    },
    COMMERCIAL: { name: "Commercial / proprietary", url: null, cost: "paid" },
    UNKNOWN: { name: "Unknown", url: null, cost: "unknown" },
  };

  const specimen = (n) =>
    "https://fonts.google.com/specimen/" + encodeURIComponent(n).replace(/%20/g, "+");

  function openResult(name, code) {
    const li = LICENSE_INFO[code];
    return {
      license: "open",
      licenseCode: code,
      licenseName: li.name,
      licenseUrl: li.url,
      cost: "free",
      buyUrl: null,
      specimenUrl: specimen(name),
    };
  }

  // Szybka, synchroniczna klasyfikacja (po naszej liście + bazie komercyjnej).
  function classify(name) {
    if (!name)
      return { license: "unknown", licenseCode: "UNKNOWN", licenseName: "Unknown", cost: "unknown", buyUrl: null, specimenUrl: null };
    const low = String(name).toLowerCase();
    if (googleList().some((g) => g.toLowerCase() === low)) {
      const code = APACHE.has(low) ? "APACHE" : UFL.has(low) ? "UFL" : "OFL";
      return openResult(name, code);
    }
    // Darmowe fonty spoza Google (Hack, Fira Code, JetBrains Mono…) — OFL/MIT,
    // NIE wymagają licencji. Wcześniej lądowały błędnie jako „System".
    if (FREE_FONTS_LC[low]) {
      return {
        license: "open",
        licenseCode: "FREE",
        licenseName: "Open source (OFL / MIT / Apache)",
        licenseUrl: FREE_FONTS_LC[low],
        cost: "free",
        buyUrl: null,
        specimenUrl: FREE_FONTS_LC[low],
      };
    }
    if (COMMERCIAL_LC[low]) {
      return {
        license: "commercial",
        licenseCode: "COMMERCIAL",
        licenseName: LICENSE_INFO.COMMERCIAL.name,
        licenseUrl: null,
        cost: "paid",
        buyUrl: COMMERCIAL[COMMERCIAL_LC[low]],
        specimenUrl: null,
        freeAlt: freeAlternative(name), // darmowy odpowiednik (Google) do podglądu
      };
    }
    // Proprietary systemowe (Windows/Office): Calibri, Cambria, Consolas, Tahoma…
    // Działają lokalnie, ale do OSADZENIA w sieci wymagają licencji → premium.
    if (SYSTEM_LICENSED.has(low)) {
      return {
        license: "commercial",
        licenseCode: "SYSTEM_LICENSED",
        licenseName: "Proprietary system font — webfont license required",
        licenseUrl: null,
        cost: "paid",
        buyUrl: myfontsSearch(name),
        specimenUrl: null,
        freeAlt: freeAlternative(name),
      };
    }
    return { license: "unknown", licenseCode: "UNKNOWN", licenseName: "Unknown", licenseUrl: null, cost: "unknown", buyUrl: null, specimenUrl: null };
  }

  // Odczyt licencji wprost z metadanych Google (autorytatywnie, też dla fontów
  // spoza naszej listy, np. Audiowide). Zwraca kod licencji lub null.
  async function fetchGoogleLicense(name) {
    try {
      const res = await fetch(
        "https://fonts.google.com/metadata/fonts/" + encodeURIComponent(name)
      );
      if (!res.ok) return null;
      let txt = await res.text();
      const i = txt.indexOf("{");
      if (i > 0) txt = txt.slice(i);
      const data = JSON.parse(txt);
      const lic = String(data.license || "").toUpperCase();
      if (!lic) return null;
      if (lic.includes("APACHE")) return "APACHE";
      if (lic.includes("UFL") || lic.includes("UBUNTU")) return "UFL";
      return "OFL";
    } catch (e) {
      return null;
    }
  }

  // Klasyfikacja autorytatywna: dopytuje Google o licencję, jeśli to nie jest
  // znany font komercyjny. Dzięki temu każdy font Google ma poprawną licencję.
  async function classifyAuthoritative(name) {
    const sync = classify(name);
    if (sync.license === "commercial") return sync;
    const code = await fetchGoogleLicense(name);
    if (code) return openResult(name, code);
    return sync;
  }

  // Popularne serwisy do wyszukania / kupna fontu po nazwie.
  const SEARCH_PROVIDERS = [
    { name: "Google Fonts", url: (q) => "https://fonts.google.com/?query=" + encodeURIComponent(q) },
    { name: "Adobe Fonts", url: (q) => "https://fonts.adobe.com/search?query=" + encodeURIComponent(q) },
    { name: "MyFonts", url: (q) => "https://www.myfonts.com/search/" + encodeURIComponent(q) + "/" },
    { name: "Fontspring", url: (q) => "https://www.fontspring.com/search?q=" + encodeURIComponent(q) },
    { name: "Font Squirrel", url: (q) => "https://www.fontsquirrel.com/fonts/list/find_fonts?q%5Bterm%5D=" + encodeURIComponent(q) },
    { name: "DaFont", url: (q) => "https://www.dafont.com/search.php?q=" + encodeURIComponent(q) },
    { name: "WhatFontIs", url: (q) => "https://www.whatfontis.com/search?q=" + encodeURIComponent(q) },
  ];

  function searchLinks(name) {
    return SEARCH_PROVIDERS.map((p) => ({ name: p.name, url: p.url(name) }));
  }

  // ===========================================================================
  // AFILIACJA — uzupełnij identyfikatory po rejestracji w programach partnerskich.
  // Linki DZIAŁAJĄ od razu (bez prowizji); po wklejeniu ID zaczynają zarabiać.
  // Wszystko to zwykłe DANE/URL-e (zgodne z MV3 — żadnego zdalnego kodu).
  // ---------------------------------------------------------------------------
  // • MyFonts → CJ Affiliate (Commission Junction). W panelu CJ wygeneruj
  //   „deep link" i wklej PREFIX poniżej; doklejamy enkodowany URL docelowy.
  //   Pusty prefix = zwykły link do MyFonts (bez prowizji).
  // • Creative Market → Impact. Wklej swój parametr lub prefix linku Impact.
  // • Envato → Twój username; doklejamy ?ref=username (proste i działa).
  // ===========================================================================
  const AFFILIATE = {
    myfontsCjPrefix: "", // MyFonts/Monotype przez CJ. np. "https://www.anrdoezrs.net/links/0000000/type/dlg/sid/wfs/"
    fontspringCjPrefix: "", // Fontspring przez CJ (20%/10%). Prefix deep-linka z CJ.
    adobePartnerizePrefix: "", // Adobe (Creative Cloud / Adobe Fonts) przez Partnerize. np. "https://prf.hn/click/camref:0000/destination:"
    creativeMarketParam: "", // Creative Market (Impact). np. "ui=000000" lub "ref=wolfie"
    envatoRef: "", // Envato — username (?ref=). np. "wolfiesites"
    subId: "wfs", // własny tag kampanii (opcjonalnie)
  };

  function withParam(url, param) {
    if (!param) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + param;
  }
  function cjWrap(prefix, target) {
    if (!prefix) return target;
    return prefix + encodeURIComponent(target); // format deep-linka z panelu CJ
  }

  // UTM do śledzenia ruchu z dodatku (analityka po stronie marketplace/Twojej).
  function utmTag() {
    return (
      "utm_source=wolfie-font-swapper&utm_medium=extension&utm_campaign=" +
      encodeURIComponent(AFFILIATE.subId || "wfs")
    );
  }

  // Generyczne linki „przeglądaj/kup premium" (karta PAID). query = bieżąca fraza
  // z wyszukiwarki (jeśli pusta → strona główna fontów danego marketplace'u).
  // Wszystkie z UTM + trackingiem afiliacyjnym, gdy ID uzupełnione.
  function affiliateBrowse(query) {
    const q = (query || "").trim();
    const out = [];
    const mf = q
      ? "https://www.myfonts.com/search/" + encodeURIComponent(q) + "/"
      : "https://www.myfonts.com/";
    out.push({
      label: "MyFonts",
      url: cjWrap(AFFILIATE.myfontsCjPrefix, withParam(mf, utmTag())),
      affiliate: !!AFFILIATE.myfontsCjPrefix,
    });
    // Fontspring (przez CJ — jak MyFonts).
    const fs = q
      ? "https://www.fontspring.com/search?q=" + encodeURIComponent(q)
      : "https://www.fontspring.com/";
    out.push({
      label: "Fontspring",
      url: cjWrap(AFFILIATE.fontspringCjPrefix, withParam(fs, utmTag())),
      affiliate: !!AFFILIATE.fontspringCjPrefix,
    });
    // Adobe Fonts (Creative Cloud) — przez Partnerize (deep-link prefix + enkodowany URL).
    const ad = q
      ? "https://fonts.adobe.com/fonts?query=" + encodeURIComponent(q)
      : "https://fonts.adobe.com/";
    out.push({
      label: "Adobe Fonts",
      url: cjWrap(AFFILIATE.adobePartnerizePrefix, withParam(ad, utmTag())),
      affiliate: !!AFFILIATE.adobePartnerizePrefix,
    });
    const cm = q
      ? "https://creativemarket.com/search?q=" + encodeURIComponent(q) + "&category=fonts"
      : "https://creativemarket.com/fonts";
    out.push({
      label: "Creative Market",
      url: withParam(withParam(cm, utmTag()), AFFILIATE.creativeMarketParam),
      affiliate: !!AFFILIATE.creativeMarketParam,
    });
    const ev = q
      ? "https://graphicriver.net/search?term=" + encodeURIComponent(q) + "&category=fonts"
      : "https://graphicriver.net/fonts";
    out.push({
      label: "Envato",
      url: withParam(
        withParam(ev, utmTag()),
        AFFILIATE.envatoRef ? "ref=" + encodeURIComponent(AFFILIATE.envatoRef) : ""
      ),
      affiliate: !!AFFILIATE.envatoRef,
    });
    return out;
  }

  // Lista opcji zakupu dla danego fontu (wydawca + marketplace'y afiliacyjne).
  // directBuyUrl — bezpośredni link wydawcy z bazy COMMERCIAL (jeśli jest).
  function affiliateLinks(name, directBuyUrl) {
    const q = name || "";
    const out = [];
    // 1) Link WYDAWCY = dokładnie ten font (najtrafniejszy). Dla znanych krojów
    //    komercyjnych mamy go w bazie COMMERCIAL.
    if (directBuyUrl) {
      out.push({ label: "Wydawca", url: directBuyUrl, affiliate: false });
    }
    // 2) MyFonts — najszersza oferta; wyszukiwanie po nazwie (przez CJ, jeśli prefix).
    const mf = "https://www.myfonts.com/search/" + encodeURIComponent(q) + "/";
    out.push({
      label: "MyFonts",
      url: cjWrap(AFFILIATE.myfontsCjPrefix, mf),
      affiliate: !!AFFILIATE.myfontsCjPrefix,
    });
    // 3) Indie-marketplace TYLKO gdy nie znamy wydawcy (dla niszowych/nieznanych
    //    fontów) — dla znanych krojów (Univers itd.) byłyby nietrafione.
    if (!directBuyUrl) {
      out.push({
        label: "Creative Market",
        url: withParam(
          "https://creativemarket.com/search?q=" + encodeURIComponent(q) + "&category=fonts",
          AFFILIATE.creativeMarketParam
        ),
        affiliate: !!AFFILIATE.creativeMarketParam,
      });
      out.push({
        label: "Envato",
        url: withParam(
          "https://graphicriver.net/search?term=" + encodeURIComponent(q) + "&category=fonts",
          AFFILIATE.envatoRef ? "ref=" + encodeURIComponent(AFFILIATE.envatoRef) : ""
        ),
        affiliate: !!AFFILIATE.envatoRef,
      });
    }
    return out;
  }

  // ===========================================================================
  // Fonty systemowe „web-safe" — realnie PREINSTALOWANE i na Windows, i na macOS
  // (Microsoft Core fonts for the Web) + generyki CSS. Renderują się wszędzie
  // przez samo `font-family`, BEZ pliku fontu i BEZ licencji.
  //
  // Pozostałe fonty systemowe (Calibri, Segoe UI, Consolas, Microsoft *, Webdings…)
  // to fonty Windows/Microsoftu — NIE ma ich na Mac/Linux/Android. Żeby użyć ich
  // w sieci, trzeba zaimportować PLIK fontu i mieć na to LICENCJĘ.
  // ===========================================================================
  const WEB_SAFE = new Set(
    [
      "Arial",
      "Arial Black",
      "Comic Sans MS",
      "Courier New",
      "Georgia",
      "Impact",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
      // generyki CSS — zawsze bezpieczne
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
      "system-ui",
    ].map((s) => s.toLowerCase())
  );
  function isWebSafe(name) {
    return !!name && WEB_SAFE.has(String(name).toLowerCase());
  }

  // ===========================================================================
  // ZAKAZANE „no matter what" — fontów, których NIE da się legalnie użyć w sieci
  // (brak licencji webfont w ogóle). Wykluczamy je z listy w dodatku.
  //  • Microsoft Segoe (font UI Windows — niedostępny do licencji web; FontSquirrel
  //    blokuje konwersję). • Apple San Francisco / New York (licencja tylko do
  //    mockupów UI na platformach Apple, zakaz dystrybucji i użycia w sieci).
  // ===========================================================================
  const FORBIDDEN = new Set(
    [
      "Segoe UI", "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI Historic",
      "Segoe UI Variable", "Segoe Print", "Segoe Script", "Segoe MDL2 Assets",
      "Segoe Fluent Icons", "Segoe",
      "San Francisco", "SF Pro", "SF Pro Text", "SF Pro Display", "SF Pro Rounded",
      "SF Mono", "SF Compact", "SF Compact Text", "SF Compact Display",
      "SF Compact Rounded", "New York", ".SF NS", ".SF NS Text", ".SF NS Display",
      "SFNS", "-apple-system", "BlinkMacSystemFont",
    ].map((s) => s.toLowerCase())
  );
  function isForbidden(name) {
    return !!name && FORBIDDEN.has(String(name).toLowerCase());
  }

  // DARMOWE fonty (OFL/MIT/Apache) spoza Google Fonts — bezpośrednie, OFICJALNE
  // źródła pobrania (bez afiliacji). Dla fontów z Google Fonts używamy specimen.
  const FREE_FONTS = {
    "Hack": "https://sourcefoundry.org/hack/",
    "Fira Code": "https://github.com/tonsky/FiraCode",
    "Cascadia Code": "https://github.com/microsoft/cascadia-code",
    "Cascadia Mono": "https://github.com/microsoft/cascadia-code",
    "JetBrains Mono": "https://www.jetbrains.com/lp/mono/",
    "DejaVu Sans": "https://dejavu-fonts.github.io/",
    "DejaVu Sans Mono": "https://dejavu-fonts.github.io/",
    "DejaVu Serif": "https://dejavu-fonts.github.io/",
    "Liberation Sans": "https://github.com/liberationfonts/liberation-fonts",
    "Liberation Serif": "https://github.com/liberationfonts/liberation-fonts",
    "Liberation Mono": "https://github.com/liberationfonts/liberation-fonts",
  };
  const FREE_FONTS_LC = {};
  Object.keys(FREE_FONTS).forEach((k) => (FREE_FONTS_LC[k.toLowerCase()] = FREE_FONTS[k]));

  // Proprietary fonty systemowe (Windows/Office) — działają lokalnie, ale do
  // OSADZENIA jako webfont (self-host woff) WYMAGAJĄ licencji → traktujemy jak
  // premium. Symbolowe (Webdings/Wingdings/Marlett/Symbol) celowo pomijamy.
  const SYSTEM_LICENSED = new Set(
    [
      "Calibri", "Cambria", "Candara", "Consolas", "Constantia", "Corbel",
      "Bahnschrift", "Tahoma", "Microsoft Sans Serif", "Franklin Gothic Medium",
      "Palatino Linotype", "Lucida Console", "Lucida Sans Unicode", "Arial Narrow",
      "Sitka", "Sylfaen", "Gabriola", "Ebrima", "Gadugi", "Leelawadee UI",
      "Nirmala UI", "Malgun Gothic", "Microsoft YaHei", "Microsoft JhengHei",
      "MS Gothic", "Yu Gothic", "SimSun", "MingLiU-ExtB", "Microsoft Himalaya",
      "Microsoft Tai Le", "Microsoft New Tai Lue", "Microsoft PhagsPa",
      "Mongolian Baiti", "Myanmar Text", "Javanese Text", "MV Boli", "Ink Free",
    ].map((s) => s.toLowerCase())
  );
  function isSystemLicensed(name) {
    return !!name && SYSTEM_LICENSED.has(String(name).toLowerCase());
  }

  // Wyszukiwarka MyFonts (afiliacja TYLKO gdy ustawiona; inaczej czysty link).
  function myfontsSearch(name) {
    const mf = "https://www.myfonts.com/search/" + encodeURIComponent(name) + "/";
    return cjWrap(AFFILIATE.myfontsCjPrefix, withParam(mf, utmTag()));
  }

  // Gdzie ZDOBYĆ / ZLICENCJONOWAĆ dany font (przycisk „Szukaj fonta").
  // Darmowe → oficjalne źródło (bez afiliacji). Google → specimen. Komercyjny /
  // proprietary systemowy → wydawca lub MyFonts (afiliacja gdy ustawiona).
  function licenseSearchUrl(name) {
    if (!name || isForbidden(name)) return null; // zakazane — brak ścieżki
    const low = String(name).toLowerCase();
    if (FREE_FONTS_LC[low]) return FREE_FONTS_LC[low];
    if (googleList().some((g) => g.toLowerCase() === low)) {
      return "https://fonts.google.com/specimen/" + encodeURIComponent(name).replace(/%20/g, "+");
    }
    if (COMMERCIAL_LC[low]) return COMMERCIAL[COMMERCIAL_LC[low]]; // bezpośredni wydawca
    return myfontsSearch(name); // systemowy proprietary / nieznany → wyszukiwarka
  }

  window.WOLFIE_FONT_META = {
    FORBIDDEN,
    isForbidden,
    FREE_FONTS,
    isSystemLicensed,
    licenseSearchUrl,
    COMMERCIAL,
    COMMERCIAL_ALT,
    WEB_SAFE,
    isWebSafe,
    LICENSE_INFO,
    SEARCH_PROVIDERS,
    AFFILIATE,
    searchLinks,
    affiliateLinks,
    affiliateBrowse,
    freeAlternative,
    classify,
    classifyAuthoritative,
  };
})();
