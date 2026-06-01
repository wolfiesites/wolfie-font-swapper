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

  // Zwraca {license: 'open'|'commercial'|'unknown', buyUrl, specimenUrl}.
  function classify(name) {
    if (!name) return { license: "unknown", buyUrl: null, specimenUrl: null };
    const low = String(name).toLowerCase();
    if (googleList().some((g) => g.toLowerCase() === low)) {
      return {
        license: "open",
        buyUrl: null,
        specimenUrl:
          "https://fonts.google.com/specimen/" +
          encodeURIComponent(name).replace(/%20/g, "+"),
      };
    }
    if (COMMERCIAL_LC[low]) {
      return { license: "commercial", buyUrl: COMMERCIAL[COMMERCIAL_LC[low]], specimenUrl: null };
    }
    return { license: "unknown", buyUrl: null, specimenUrl: null };
  }

  window.WOLFIE_FONT_META = { COMMERCIAL, classify };
})();
