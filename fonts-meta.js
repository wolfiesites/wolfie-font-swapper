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
    if (COMMERCIAL_LC[low]) {
      return {
        license: "commercial",
        licenseCode: "COMMERCIAL",
        licenseName: LICENSE_INFO.COMMERCIAL.name,
        licenseUrl: null,
        cost: "paid",
        buyUrl: COMMERCIAL[COMMERCIAL_LC[low]],
        specimenUrl: null,
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

  window.WOLFIE_FONT_META = {
    COMMERCIAL,
    LICENSE_INFO,
    SEARCH_PROVIDERS,
    searchLinks,
    classify,
    classifyAuthoritative,
  };
})();
