"use strict";

// Skrót do tłumaczeń (i18n.js ładowany przed popup.js).
// Deklaracja funkcji (hoisting) — `t` jest dostępne w całym pliku niezależnie
// od kolejności, więc nigdy nie poleci ReferenceError: t is not defined.
function t(key) {
  return window.WOLFIE_I18N ? window.WOLFIE_I18N.t(key) : key;
}

const { SYSTEM_FONTS, GOOGLE_FONTS, POPULAR_GOOGLE_FONTS } = window.WOLFIE_FONTS;

const POPULAR_SET = new Set(POPULAR_GOOGLE_FONTS);

// Najpierw popularne Google Fonts (w zadanej kolejności, oznaczone gwiazdką),
// potem reszta (systemowe + pozostałe Google) alfabetycznie.
const popularEntries = POPULAR_GOOGLE_FONTS.filter((name) =>
  GOOGLE_FONTS.includes(name)
).map((name) => ({ name, type: "google", popular: true }));

const restEntries = [
  ...SYSTEM_FONTS.map((name) => ({ name, type: "system" })),
  ...GOOGLE_FONTS.filter((name) => !POPULAR_SET.has(name)).map((name) => ({
    name,
    type: "google",
  })),
].sort((a, b) => a.name.localeCompare(b.name));

// Fonty ZAKAZANE „no matter what" (Segoe MS, fonty Apple) — wykluczamy z listy,
// bo i tak nie da się ich legalnie użyć w sieci.
const isForbiddenFont = (n) =>
  !!(window.WOLFIE_FONT_META && window.WOLFIE_FONT_META.isForbidden && window.WOLFIE_FONT_META.isForbidden(n));

// UWAGA: NIE wstrzykujemy „na sztywno" nazw fontów komercyjnych do listy — byłyby
// mylące (i tak niedostępne bez instalacji). Premium pojawia się w wyszukiwarce
// TYLKO jeśli jest faktycznie zainstalowane na komputerze (wykryte przez Local
// Font Access → typ "system", z markerem $). Odkrywanie/kupno premium = karta PAID.
const ALL_FONTS = [...popularEntries, ...restEntries].filter((f) => !isForbiddenFont(f.name));

// Dodaj zapisane customowe fonty (pobrane pickerem) do listy wyszukiwania,
// oznaczając źródło: "google" (z gstatic) lub "web" (skądś indziej).
function addCustomFontsToList() {
  if (typeof customFonts !== "object") return;
  const have = new Set(ALL_FONTS.map((f) => f.name.toLowerCase()));
  const entries = [];
  for (const key of Object.keys(customFonts)) {
    const v = customFonts[key];
    const nm = v && typeof v === "object" && v.name ? v.name : key;
    if (!nm || have.has(nm.toLowerCase())) continue;
    have.add(nm.toLowerCase());
    entries.push({ name: nm, type: "custom", source: (v && v.source) || "web" });
  }
  if (entries.length) {
    entries.sort((a, b) => a.name.localeCompare(b.name));
    ALL_FONTS.unshift(...entries); // na początek listy (łatwo znaleźć)
  }
}

// Enumeracja realnie zainstalowanych fontów przez Local Font Access API.
// Wymaga gestu użytkownika (np. kliknięcia w pole) i jednorazowej zgody.
let localFontsLoaded = false;
// Czy polityka uprawnień pozwala na local-fonts w TYM dokumencie? W panelu
// (iframe na obcej stronie) zwykle nie — wtedy pomijamy, by nie generować
// błędu „Permissions policy violation: local-fonts" (i tak mamy fallback).
function localFontsAllowed() {
  try {
    const fp = document.featurePolicy || document.permissionsPolicy;
    if (fp && typeof fp.allowsFeature === "function") {
      return fp.allowsFeature("local-fonts");
    }
  } catch (e) {}
  return true; // brak API polityki → spróbuj (i tak jest try/catch niżej)
}
async function loadLocalFonts() {
  if (localFontsLoaded || typeof window.queryLocalFonts !== "function") return false;
  if (!localFontsAllowed()) return false; // cichy fallback, bez naruszenia polityki
  localFontsLoaded = true;
  try {
    const fonts = await window.queryLocalFonts();
    const have = new Set(ALL_FONTS.map((f) => f.name.toLowerCase()));
    const added = [];
    for (const fam of new Set(fonts.map((f) => f.family))) {
      if (fam && !have.has(fam.toLowerCase()) && !isForbiddenFont(fam)) {
        have.add(fam.toLowerCase());
        added.push({ name: fam, type: "system" });
      }
    }
    if (added.length) {
      added.sort((a, b) => a.name.localeCompare(b.name));
      ALL_FONTS.push(...added);
    }
    return true;
  } catch (e) {
    // Brak wsparcia lub odmowa zgody — zostaje lista wbudowana.
    return false;
  }
}

const STORAGE_KEY = "wfs_state"; // legacy (migracja ze starej wersji)
const SESSION_KEY = "wfs_session"; // { host: selection } — per domena, per sesja (domyślnie)
const PERSIST_KEY = "wfs_persist"; // { host: selection } — trwałe (przycisk „Zapisz na stałe")
const RULES_KEY = "wfs_rules"; // [ { pattern, preset } ] — reguły domen (globy)
let currentHost = "";
let currentUrl = ""; // pełny URL aktywnej karty (do dopasowania reguł)
let rulesData = []; // wczytane reguły (do paska reguły)
let presetsData = []; // wczytane presety (do przełącznika)
let activeRulePattern = null; // wzorzec reguły, która dała bieżący konfig
let appliedFromRule = false; // czy bieżący konfig pochodzi z reguły domeny (czerwona kropka)
let activePresetName = null; // nazwa zastosowanego presetu (chip podświetlony; 2. klik resetuje)

// Wyczyść oznaczenie aktywnego presetu (np. po ręcznej zmianie fontu).
function clearActivePreset() {
  if (activePresetName !== null) {
    activePresetName = null;
    if (typeof renderPresets === "function") renderPresets();
  }
}

// Pasek reguły: pokaż TYLKO przycisk usuwający regułę tej domeny, gdy konfig
// pochodzi z reguły (reguły dodaje/edytuje się wyłącznie w ustawieniach).
function setupRuleBar(rule) {
  const bar = document.getElementById("wfs-rulebar");
  // Pasek pokazujemy tylko gdy reguła ma realnie istniejący preset.
  if (!bar || !rule || !rule.preset) return;
  if (!presetsData.some((p) => p.name === rule.preset)) return;
  activeRulePattern = rule.pattern;
  // Pokaż w tooltipie, który glob (wzorzec) zadziałał — np. „*" łapie każdą stronę.
  const removeBtn = document.getElementById("wfs-rule-remove");
  if (removeBtn) {
    removeBtn.title = t("rule_remove_domain") + " — " + rule.pattern;
  }
  bar.hidden = false;
}

function hostOf(url) {
  try {
    return new URL(url).hostname || "";
  } catch (e) {
    return "";
  }
}
function globToRegex(p) {
  let s = String(p).trim();
  // Gdy wzorzec nie kończy się '*' ani '/', dopnij '*' — reguła dla domeny działa
  // też na podstronach ("wikipedia.org" ~ "wikipedia.org*", "*wikipedia.org" ~ "*wikipedia.org*").
  if (s && !s.endsWith("*") && !s.endsWith("/")) s += "*";
  return new RegExp(
    "^" + s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
    "i"
  );
}
// Czy wzorzec to „goła domena" (sam host, bez *, schematu i ścieżki; ewentualny
// / na końcu)? Wtedy dopasowujemy sprytnie: apex + alias www, dowolny schemat
// (http/https) i podstrony — bo i tak porównujemy po hoście.
function bareDomainOf(pattern) {
  // Zdejmij końcowe '*' i '/' — "wikipedia.org", "wikipedia.org*", "wikipedia.org/"
  // i "wikipedia.org/*" traktujemy tak samo (domena + wszystko z prawej).
  const bare = String(pattern || "").trim().replace(/[*/]+$/, "");
  if (!bare || bare.includes("*") || bare.includes("://") || bare.includes("/")) return null;
  if (!/^[a-z0-9.-]+(:\d+)?$/i.test(bare)) return null;
  return bare.replace(/^www\./i, ""); // znormalizuj alias www w samym wzorcu
}
function patternMatches(pattern, url, host) {
  const d = bareDomainOf(pattern);
  if (d) {
    // host == domena LUB www.domena (https://, http://, podstrony obsłużone z natury)
    const re = new RegExp("^(www\\.)?" + d.replace(/[.+^${}()|[\]\\]/g, "\\$&") + "$", "i");
    return re.test(host || "");
  }
  const re = globToRegex(pattern);
  return (url && re.test(url)) || (host && re.test(host));
}
function matchRule(rules, url, host) {
  // Wzorce: "wikipedia.org" (apex+www, dowolny schemat/podstrony), "*.wolfiesites.com"
  // (host), "https://example.com/*" (glob na URL). Glob ma auto '*' na końcu.
  for (const r of rules || []) {
    if (!r || !r.pattern) continue;
    try {
      if (patternMatches(r.pattern, url, host)) return r;
    } catch (e) {}
  }
  return null;
}
async function saveSessionConfig(host, sel) {
  if (!host) return;
  try {
    const d = await chrome.storage.session.get(SESSION_KEY);
    const m = d[SESSION_KEY] || {};
    m[host] = sel;
    await chrome.storage.session.set({ [SESSION_KEY]: m });
  } catch (e) {}
}
function persistDomainConfig(host, sel) {
  if (!host) return;
  chrome.storage.local.get(PERSIST_KEY, (d) => {
    const m = d[PERSIST_KEY] || {};
    m[host] = sel;
    chrome.storage.local.set({ [PERSIST_KEY]: m });
  });
}
async function removeDomainConfig(host) {
  if (!host) return;
  try {
    const d = await chrome.storage.session.get(SESSION_KEY);
    const m = d[SESSION_KEY] || {};
    delete m[host];
    await chrome.storage.session.set({ [SESSION_KEY]: m });
  } catch (e) {}
  chrome.storage.local.get(PERSIST_KEY, (d) => {
    const m = d[PERSIST_KEY] || {};
    delete m[host];
    chrome.storage.local.set({ [PERSIST_KEY]: m });
  });
}
const statusEl = document.getElementById("wfs-status");

// Aktualne ustawienia dla każdego targetu: rodzina + chipy.
function emptyProps() {
  return { family: null, weight: null, spacing: null, size: null, case: null, color: null, lineheight: null };
}
const selection = {
  base: emptyProps(),
  headings: emptyProps(),
  paragraphs: emptyProps(),
  navigation: emptyProps(),
  buttons: emptyProps(),
};

// Ostatnio sfokusowane pole fontu — by po pobraniu fontu pickerem wkleić tam nazwę.
let lastFocusedTarget = null;

// Ulubione fonty (nazwy) — przypinane na górze listy, trwałe w local storage.
let favorites = [];
function isFavorite(name) {
  return !!name && favorites.some((n) => n.toLowerCase() === name.toLowerCase());
}
function toggleFavorite(name) {
  if (!name) return;
  const i = favorites.findIndex((n) => n.toLowerCase() === name.toLowerCase());
  if (i >= 0) favorites.splice(i, 1);
  else favorites.unshift(name); // najnowszy ulubiony na samej górze
  try {
    chrome.storage.local.set({ wfs_favorites: favorites });
  } catch (e) {}
}

function hasProps(p) {
  return !!(
    p &&
    (p.family || p.weight || p.spacing || p.size || p.case || p.color || p.lineheight)
  );
}

// Predefiniowane chipy pod każdym dropdownem (po 3 opcje, opcjonalne — klik
// ponownie czyści). Wartości to gotowe wartości CSS.
const CHIP_GROUPS = [
  {
    key: "weight",
    label: t("chip_weight"),
    options: [
      { label: "Light", value: "300" },
      { label: "Regular", value: "400" },
      { label: "Bold", value: "700" },
      { label: "Extra Bold", value: "800" },
    ],
  },
  {
    key: "spacing",
    label: t("chip_spacing"),
    options: [
      { label: t("spacing_tight"), value: "-0.5px" },
      { label: "0", value: "normal" },
      { label: t("spacing_loose"), value: "1.5px" },
    ],
  },
  {
    key: "size",
    label: t("chip_size"),
    // Tekst (akapity / baza / nawigacja / przyciski) — popularne rozmiary body.
    options: [
      { label: "S", value: "14px" },
      { label: "M", value: "16px" },
      { label: "L", value: "18px" },
      { label: "XL", value: "20px" },
    ],
    // Nagłówki — popularna skala nagłówkowa (h2…hero).
    optionsByTarget: {
      headings: [
        { label: "S", value: "24px" },
        { label: "M", value: "32px" },
        { label: "L", value: "40px" },
        { label: "XXL", value: "48px" },
      ],
    },
  },
  {
    key: "lineheight",
    label: t("chip_lineheight"),
    options: [
      { label: "1.2", value: "1.2" },
      { label: "1.5", value: "1.5" },
      { label: "1.8", value: "1.8" },
      { label: "2.0", value: "2" },
    ],
  },
  {
    key: "case",
    label: t("chip_case"),
    targets: ["buttons"], // text-transform tylko dla przycisków
    options: [
      { label: "ABC", value: "uppercase" },
      { label: "abc", value: "lowercase" },
      { label: "Abc", value: "capitalize" },
    ],
  },
];

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function isGoogle(fontName) {
  return GOOGLE_FONTS.includes(fontName);
}

// ---- Wstrzykiwane do strony (działa w kontekście karty) ----

function applyFontsInPage(state, altMap) {
  // Same pliki fontów Google wstrzykuje rozszerzenie przez insertCSS
  // (omija CSP strony). Tutaj ustawiamy już tylko reguły font-family.
  const STYLE_ID = "wolfie-font-swapper-style";

  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;
  const q = (f) => (generic.test(f) ? f : '"' + f + '"');
  // Dla fontu premium dokładamy darmowy odpowiednik jako fallback: oryginał
  // (jeśli zainstalowany) ma pierwszeństwo, inaczej renderuje się odpowiednik.
  const fam = (f) => {
    const a = altMap && altMap[f];
    return a ? q(f) + ", " + q(a) + ", sans-serif" : q(f);
  };
  const has = (p) =>
    p && (p.family || p.weight || p.spacing || p.size || p.case || p.color || p.lineheight);
  const decl = (p) => {
    const d = [];
    if (p.family) d.push("font-family: " + fam(p.family) + " !important");
    if (p.weight) d.push("font-weight: " + p.weight + " !important");
    if (p.spacing) d.push("letter-spacing: " + p.spacing + " !important");
    if (p.size) d.push("font-size: " + p.size + " !important");
    if (p.lineheight) d.push("line-height: " + p.lineheight + " !important");
    if (p.case) d.push("text-transform: " + p.case + " !important");
    if (p.color) d.push("color: " + p.color + " !important");
    return d.join("; ");
  };

  const rules = [];

  // Wzorce nawigacji — używane i do reguły nawigacji, i do WYKLUCZENIA nawigacji
  // z akapitów (listy/tabele będące menu nie mają dostawać fontu akapitów).
  const navBases = [
    "nav",
    '[role="navigation"]',
    ".navbar",
    ".navbar-nav",
    ".nav",
    ".nav-menu",
    ".navmenu",
    ".navigation",
    ".menu",
    ".main-menu",
    ".main-nav",
    ".primary-menu",
    ".primary-nav",
    ".site-nav",
    ".topnav",
    ".top-nav",
    ".menu-list",
    "#nav",
    "#navbar",
    "#menu",
    "#navigation",
    "#main-nav",
    "#primary-menu",
    "header ul",
  ];
  const navExcl = navBases.flatMap((s) => [s, s + " *"]).join(", ");

  if (has(state.base)) {
    // Cała strona, ale pomijamy elementy ikon, by nie psuć fontów ikonowych.
    // :where() ma zerową wagę (specificity), więc reguły dla nagłówków/akapitów
    // poniżej (h1.., p) zawsze wygrywają z regułą bazową.
    rules.push(
      ':where(body, body *):not(:where(i, [class*="icon"], [class*="Icon"], [class*="material-"])) { ' +
        decl(state.base) +
        " }"
    );
  }
  if (has(state.headings)) {
    rules.push(
      "h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 * { " +
        decl(state.headings) +
        " }"
    );
  }
  if (has(state.paragraphs)) {
    // Akapity obejmują też listy (ul/ol/li) i tabele (table/tr/td/th…),
    // ale NIE elementy nawigacji (te wykluczamy przez :not).
    const paraBases = [
      "p",
      "ul",
      "ol",
      "li",
      "dl",
      "dt",
      "dd",
      "table",
      "caption",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "td",
      "th",
    ];
    const paraSel = paraBases.flatMap((s) => [s, s + " *"]).join(", ");
    rules.push(
      ":where(" + paraSel + "):not(:where(" + navExcl + ")) { " +
        decl(state.paragraphs) +
        " }"
    );
  }
  if (has(state.navigation)) {
    // Częste wzorce nawigacji: semantyczny <nav>, role, oraz typowe klasy/id
    // i menu w nagłówku. Każdy wzorzec łapie też swoich potomków (" *").
    const navSel = navBases.map((s) => s + ", " + s + " *").join(", ");
    rules.push(navSel + " { " + decl(state.navigation) + " }");
  }
  if (has(state.buttons)) {
    const btnBases = [
      "button",
      '[role="button"]',
      ".btn",
      ".button",
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
    ];
    const btnSel = btnBases.map((s) => s + ", " + s + " *").join(", ");
    rules.push(btnSel + " { " + decl(state.buttons) + " }");
  }

  let styleEl = document.getElementById(STYLE_ID);
  if (rules.length === 0) {
    if (styleEl) styleEl.remove();
    return;
  }
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    (document.head || document.documentElement).appendChild(styleEl);
  }
  styleEl.textContent = rules.join("\n");
}

function resetFontsInPage() {
  const style = document.getElementById("wolfie-font-swapper-style");
  if (style) style.remove();
  document
    .querySelectorAll('[id^="wolfie-font-swapper-link-"]')
    .forEach((el) => el.remove());
}

// Przywróć oryginalną treść elementów edytowanych edytorem tekstu.
function resetTextInPage() {
  const list = window.__wfsEditedEls || [];
  for (const el of list) {
    try {
      if (el.__wfsOrig !== undefined) {
        el.innerHTML = el.__wfsOrig;
        delete el.__wfsOrig;
      }
    } catch (e) {}
  }
  window.__wfsEditedEls = [];
}

// Inspektor fontów na stronie (styl „Fontninja") — wstrzykiwany przez executeScript.
// Self-contained: korzysta tylko z DOM, chrome.storage i navigator.clipboard.
function pageFontInspector(opts) {
  if (window.__wfsInspector) return;
  window.__wfsInspector = true;
  const googleSet = new Set(opts.googleNames);
  const commSet = new Set(opts.commercialNames);
  const L = opts.labels;
  const Z = 2147483647;

  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed", zIndex: Z, pointerEvents: "none", display: "none",
    border: "2px solid #ff3dae", background: "rgba(0,224,255,.12)", borderRadius: "2px",
  });
  const tip = document.createElement("div");
  Object.assign(tip.style, {
    position: "fixed", zIndex: Z, pointerEvents: "none", display: "none",
    background: "#16161b", color: "#fff", font: "12px/1.4 'Segoe UI',system-ui,sans-serif",
    padding: "6px 9px", borderRadius: "8px", boxShadow: "0 6px 22px rgba(0,0,0,.45)", maxWidth: "300px",
  });
  const banner = document.createElement("div");
  Object.assign(banner.style, {
    position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)", zIndex: Z,
    background: "linear-gradient(90deg,#00e0ff,#ff3dae)", color: "#0b0d14",
    font: "600 12px 'Segoe UI',system-ui,sans-serif", padding: "7px 14px",
    borderRadius: "999px", boxShadow: "0 6px 22px rgba(0,0,0,.45)",
  });
  banner.textContent = L.hint;
  document.body.append(box, tip, banner);

  let current = null;
  const firstFamily = (el) =>
    ((getComputedStyle(el).fontFamily || "").split(",")[0] || "")
      .trim()
      .replace(/^["']|["']$/g, "");
  function classify(name) {
    const low = (name || "").toLowerCase();
    if (googleSet.has(low)) return { label: L.open, color: "#4cd964" };
    if (commSet.has(low)) return { label: L.commercial, color: "#ffb84a" };
    return { label: L.unknown, color: "#9a9aa8" };
  }
  function onMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === box || el === tip || el === banner) return;
    current = el;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, {
      display: "block", left: r.left + "px", top: r.top + "px",
      width: r.width + "px", height: r.height + "px",
    });
    const fam = firstFamily(el);
    const c = classify(fam);
    tip.innerHTML = "";
    const n = document.createElement("div");
    n.textContent = fam || "—";
    n.style.fontWeight = "700";
    n.style.marginBottom = "2px";
    const lic = document.createElement("span");
    lic.textContent = c.label;
    lic.style.color = c.color;
    lic.style.fontSize = "11px";
    tip.append(n, lic);
    tip.style.display = "block";
    let tx = e.clientX + 14, ty = e.clientY + 16;
    if (tx + 300 > innerWidth) tx = e.clientX - 300;
    if (ty + 56 > innerHeight) ty = e.clientY - 56;
    tip.style.left = tx + "px";
    tip.style.top = ty + "px";
  }
  function cleanup() {
    window.__wfsInspector = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    [box, tip, banner].forEach((n) => n.remove());
  }
  // Przechwyć z arkuszy strony reguły @font-face pasujące do rodziny.
  function collectFaces(family) {
    const low = family.toLowerCase();
    const out = [];
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch (_) {
        continue; // arkusz cross-origin bez dostępu
      }
      if (!rules) continue;
      for (const r of rules) {
        if ((r.cssText || "").slice(0, 10).toLowerCase() === "@font-face") {
          const ff = ((r.style && r.style.getPropertyValue("font-family")) || "")
            .replace(/["']/g, "")
            .trim()
            .toLowerCase();
          if (ff === low) out.push(r.cssText);
        }
      }
    }
    return out;
  }
  function b64(buf) {
    let s = "";
    const a = new Uint8Array(buf);
    const c = 0x8000;
    for (let i = 0; i < a.length; i += c) s += String.fromCharCode.apply(null, a.subarray(i, i + c));
    return btoa(s);
  }
  // Pobierz pliki fontu i osadź jako data: — by działał poza tą stroną.
  async function embedFaces(faces) {
    const done = [];
    for (let css of faces) {
      const urls = [
        ...new Set(
          [...css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)]
            .map((m) => m[2])
            .filter((u) => u && !u.startsWith("data:"))
        ),
      ];
      for (const u of urls) {
        try {
          const abs = new URL(u, location.href).href;
          const res = await fetch(abs);
          if (!res.ok) continue;
          const mime = /\.woff2/i.test(abs)
            ? "font/woff2"
            : /\.woff/i.test(abs)
            ? "font/woff"
            : /\.ttf/i.test(abs)
            ? "font/ttf"
            : /\.otf/i.test(abs)
            ? "font/otf"
            : "font/woff2";
          css = css.split(u).join("data:" + mime + ";base64," + b64(await res.arrayBuffer()));
        } catch (_) {}
      }
      done.push(css);
    }
    return done.join("\n");
  }
  // Toast potwierdzający (znika sam) — niezależny od nakładki inspektora.
  function showToast(text) {
    const el = document.createElement("div");
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", left: "50%", bottom: "28px",
      transform: "translateX(-50%) translateY(8px)", zIndex: String(Z),
      background: "linear-gradient(90deg,#00e0ff,#ff3dae)", color: "#0b0d14",
      font: "600 13px 'Segoe UI',system-ui,sans-serif", padding: "10px 16px",
      borderRadius: "999px", boxShadow: "0 8px 28px rgba(0,0,0,.5)", opacity: "0",
      transition: "opacity .2s ease, transform .2s ease", pointerEvents: "none",
      maxWidth: "90vw", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    });
    (document.body || document.documentElement).appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 260);
    }, 2200);
  }
  // Zbuduj prosty selektor CSS dla elementu (tag + #id lub .klasy).
  function cssSelectorFor(el) {
    const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s);
    let s = el.tagName.toLowerCase();
    try {
      if (el.id) return s + "#" + esc(el.id);
    } catch (_) {}
    const cn = typeof el.className === "string" ? el.className.trim() : "";
    const cls = cn ? cn.split(/\s+/).filter(Boolean) : [];
    if (cls.length) s += "." + cls.slice(0, 2).map(esc).join(".");
    return s;
  }
  async function onClick(e) {
    if (!current) return;
    e.preventDefault();
    e.stopPropagation();
    const fam = firstFamily(current);
    // Tryb „style": skopiuj GOTOWY blok CSS z fontowymi właściwościami elementu.
    if (opts.mode === "style") {
      const cs = getComputedStyle(current);
      const props = [
        "font-family",
        "font-size",
        "font-weight",
        "font-style",
        "font-variant",
        "line-height",
        "letter-spacing",
        "text-transform",
        "color",
      ];
      const body = props
        .map((p) => "  " + p + ": " + cs.getPropertyValue(p) + ";")
        .join("\n");
      const css = cssSelectorFor(current) + " {\n" + body + "\n}";
      try {
        await navigator.clipboard.writeText(css);
      } catch (_) {}
      // Osadź @font-face (by można było dodać do moich fontów i renderować poza stroną).
      let fontface = null;
      let source = "system";
      try {
        const faces = collectFaces(fam);
        if (faces.length) {
          source = faces.some((c) => /fonts\.gstatic\.com/i.test(c)) ? "google" : "web";
          fontface = await embedFaces(faces);
        }
      } catch (_) {}
      // Zapisz pick głównego pickera — popup pokaże go w przypiętym pasku.
      try {
        chrome.storage.local.set({
          wfs_style_pick: { family: fam, css: css, fontface: fontface, source: source },
        });
      } catch (_) {}
      // Toast np.: ✓ Skopiowano styl fontu „Audiowide"
      showToast("✓ " + (L.copied || "Copied font style") + " „" + fam + "”");
      cleanup();
      return;
    }
    banner.textContent = "⏳ " + fam;
    let fontface = null;
    let source = "system";
    try {
      const faces = collectFaces(fam);
      if (faces.length) {
        source = faces.some((c) => /fonts\.gstatic\.com/i.test(c)) ? "google" : "web";
        fontface = await embedFaces(faces);
      }
    } catch (_) {}
    try {
      await navigator.clipboard.writeText(fam);
    } catch (_) {}
    try {
      chrome.storage.local.set({ wfs_picked: { family: fam, fontface: fontface, source: source } });
    } catch (_) {}
    cleanup();
  }
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
    }
  }
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
}

// Edytor tekstu na stronie — wstrzykiwany przez executeScript. Klik elementu
// czyni go edytowalnym (contentEditable), więc można zmienić jego treść w DOM.
function pageTextEditor(opts) {
  if (window.__wfsTextEdit) return;
  window.__wfsTextEdit = true;
  const L = opts.labels;
  const Z = 2147483647;
  const box = document.createElement("div");
  Object.assign(box.style, {
    position: "fixed", zIndex: Z, pointerEvents: "none", display: "none",
    border: "2px solid #00e0ff", background: "rgba(0,224,255,.10)", borderRadius: "2px",
  });
  const banner = document.createElement("div");
  Object.assign(banner.style, {
    position: "fixed", top: "12px", left: "50%", transform: "translateX(-50%)", zIndex: Z,
    background: "linear-gradient(90deg,#00e0ff,#ff3dae)", color: "#0b0d14",
    font: "600 12px 'Segoe UI',system-ui,sans-serif", padding: "7px 8px 7px 14px",
    borderRadius: "999px", boxShadow: "0 6px 22px rgba(0,0,0,.45)",
    display: "flex", alignItems: "center", gap: "10px",
  });
  const hintSpan = document.createElement("span");
  hintSpan.textContent = L.hint;
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  Object.assign(closeBtn.style, {
    border: "none", background: "rgba(0,0,0,.18)", color: "#0b0d14", cursor: "pointer",
    width: "20px", height: "20px", borderRadius: "50%", font: "700 11px sans-serif", lineHeight: "1",
  });
  closeBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); cleanup(); });
  banner.append(hintSpan, closeBtn);
  document.body.append(box, banner);

  let editing = null;
  function onMove(e) {
    if (editing) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || el === box || banner.contains(el)) return;
    const r = el.getBoundingClientRect();
    Object.assign(box.style, {
      display: "block", left: r.left + "px", top: r.top + "px",
      width: r.width + "px", height: r.height + "px",
    });
  }
  function finishEdit() {
    if (!editing) return;
    const prev = editing.getAttribute("data-wfs-ce");
    if (prev === "true") editing.setAttribute("contenteditable", "true");
    else editing.removeAttribute("contenteditable");
    editing.removeAttribute("data-wfs-ce");
    editing.style.outline = "";
    editing = null;
  }
  function startEdit(el) {
    if (editing && editing !== el) finishEdit();
    editing = el;
    // zapamiętaj oryginalną treść (raz), by Reset mógł ją przywrócić
    if (el.__wfsOrig === undefined) {
      el.__wfsOrig = el.innerHTML;
      (window.__wfsEditedEls = window.__wfsEditedEls || []).push(el);
    }
    el.setAttribute("data-wfs-ce", el.getAttribute("contenteditable") || "");
    el.setAttribute("contenteditable", "true");
    el.style.outline = "2px dashed #00e0ff";
    box.style.display = "none";
    el.focus();
  }
  function onClick(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el || banner.contains(el)) return;
    const link = e.target && e.target.closest ? e.target.closest("a") : null;
    if (editing && (el === editing || editing.contains(el))) {
      if (link) e.preventDefault(); // nie nawiguj linkiem, ale pozwól ustawić kursor
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    startEdit(el);
  }
  // Blokuj nawigację po linkach w trakcie trybu edycji (także middle-click).
  function blockNav(e) {
    const a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (a) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  function cleanup() {
    finishEdit();
    window.__wfsTextEdit = false;
    document.removeEventListener("mousemove", onMove, true);
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("auxclick", blockNav, true);
    [box, banner].forEach((n) => n.remove());
  }
  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
    }
  }
  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("auxclick", blockNav, true);
}

// ---- Ładowanie fontów Google z pominięciem CSP strony ----
//
// Strony często blokują przez CSP zewnętrzne fonty (fonts.googleapis.com /
// gstatic.com), więc samo dopisanie <link> nie ładuje pliku. Dlatego pobieramy
// CSS i pliki fontów po stronie rozszerzenia (ma uprawnienia sieciowe),
// zamieniamy adresy plików na data:-URL i wstrzykujemy przez insertCSS —
// taki arkusz pochodzi z rozszerzenia i nie podlega CSP strony.

// Customowe fonty pobrane pickerem ze stron: rodzina(lower) -> CSS @font-face (data:).
// Trwałe w chrome.storage.local (wfs_custom_fonts), wstrzykiwane przy zastosowaniu.
const customFonts = {};

// tabId -> { families: Set<string>, cssList: string[] }
const injectedByTab = new Map();
function tabRecord(tabId) {
  let rec = injectedByTab.get(tabId);
  if (!rec) {
    rec = { families: new Set(), cssList: [] };
    injectedByTab.set(tabId, rec);
  }
  return rec;
}

function arrayBufferToBase64(buf) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// Trwały cache fontów Google (osadzone @font-face). Pobierz raz, używaj zawsze
// — także między sesjami i kartami. LRU z limitem, by nie przekroczyć quoty.
const FONT_CACHE_KEY = "wfs_font_cache";
const FONT_CACHE_CAP = 4 * 1024 * 1024; // ~4 MB
let fontCacheMap = {}; // key(lower) -> css
let fontCacheOrder = []; // klucze; najświeższe na końcu
let fontCacheTimer = null;

function fontCacheBytes() {
  let n = 0;
  for (const k in fontCacheMap) n += fontCacheMap[k].length;
  return n;
}
function persistFontCache() {
  if (fontCacheTimer) clearTimeout(fontCacheTimer);
  fontCacheTimer = setTimeout(() => {
    try {
      chrome.storage.local.set({ [FONT_CACHE_KEY]: { map: fontCacheMap, order: fontCacheOrder } });
    } catch (e) {}
  }, 800);
}
function cacheTouch(key) {
  const i = fontCacheOrder.indexOf(key);
  if (i >= 0) fontCacheOrder.splice(i, 1);
  fontCacheOrder.push(key);
}
function cachePut(key, css) {
  fontCacheMap[key] = css;
  cacheTouch(key);
  while (fontCacheBytes() > FONT_CACHE_CAP && fontCacheOrder.length > 1) {
    delete fontCacheMap[fontCacheOrder.shift()];
  }
  persistFontCache();
}

// Pobierz CSS @font-face z Google i osadź pliki woff2 jako data:-URL (z cache).
async function fetchGoogleFontFaceCSS(family) {
  const key = family.toLowerCase();
  if (fontCacheMap[key]) {
    cacheTouch(key);
    persistFontCache();
    return fontCacheMap[key]; // z cache — bez sieci
  }
  const res = await fetch(googleImportUrl(family));
  if (!res.ok) throw new Error("HTTP " + res.status);
  let css = await res.text();
  const urls = [
    ...new Set(
      [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map(
        (m) => m[1]
      )
    ),
  ];
  for (const fontUrl of urls) {
    try {
      const fr = await fetch(fontUrl);
      if (!fr.ok) continue;
      const b64 = arrayBufferToBase64(await fr.arrayBuffer());
      css = css.split(fontUrl).join("data:font/woff2;base64," + b64);
    } catch (e) {
      /* pomijamy ten plik, reszta i tak zadziała */
    }
  }
  cachePut(key, css); // zapisz do trwałego cache
  return css;
}

// Upewnij się, że wszystkie wybrane fonty Google są fizycznie załadowane w karcie.
// Mapa rodzina premium -> darmowy odpowiednik (Google), dla bieżącego wyboru.
function altMapFor(sel) {
  const meta = window.WOLFIE_FONT_META;
  const m = {};
  if (!meta || !meta.freeAlternative) return m;
  for (const p of Object.values(sel || {})) {
    if (!p || !p.family) continue;
    const alt = meta.freeAlternative(p.family);
    if (alt) m[p.family] = alt;
  }
  return m;
}

async function ensureGoogleFontsLoaded(tabId, sel) {
  sel = sel || selection;
  const meta = window.WOLFIE_FONT_META;
  const families = [
    ...new Set(
      Object.values(sel)
        .map((p) => p.family)
        .filter(Boolean)
        .flatMap((f) => {
          const out = [];
          if (isGoogle(f)) out.push(f); // wybrany font Google
          // Darmowy odpowiednik fontu premium (też ładujemy, by był fallbackiem).
          const alt = meta && meta.freeAlternative ? meta.freeAlternative(f) : null;
          if (alt && isGoogle(alt)) out.push(alt);
          return out;
        })
    ),
  ];
  const rec = tabRecord(tabId);
  for (const fam of families) {
    if (rec.families.has(fam)) continue;
    const css = await fetchGoogleFontFaceCSS(fam);
    await chrome.scripting.insertCSS({ target: { tabId }, css });
    rec.families.add(fam);
    rec.cssList.push(css);
  }
}

// Wstrzyknij customowe fonty (pobrane pickerem) dla wybranych rodzin — by płatne
// czy nie, realnie renderowały się na stronie.
async function ensureCustomFontsLoaded(tabId, sel) {
  sel = sel || selection;
  const families = [
    ...new Set(Object.values(sel).map((p) => p.family).filter(Boolean)),
  ];
  const rec = tabRecord(tabId);
  for (const fam of families) {
    const entry = customFonts[fam.toLowerCase()];
    const css = entry && (typeof entry === "string" ? entry : entry.css);
    if (!css) continue;
    const key = "custom:" + fam.toLowerCase();
    if (rec.families.has(key)) continue;
    try {
      await chrome.scripting.insertCSS({ target: { tabId }, css });
      rec.families.add(key);
      rec.cssList.push(css);
    } catch (e) {
      /* zbyt duży arkusz lub błąd — pomijamy */
    }
  }
}

// ---- Komunikacja z aktywną kartą ----

// Popup działa we WŁASNYM oknie (dopchniętym do rogu), więc `currentWindow`
// wskazywałby na to okno, a nie na stronę użytkownika. Dlatego docelowy tabId
// dostajemy z URL-a (?tabId=…), ustawianego przy otwieraniu okna w tle.
function getTargetTabId() {
  try {
    const id = parseInt(new URLSearchParams(location.search).get("tabId"), 10);
    return Number.isInteger(id) ? id : null;
  } catch (e) {
    return null;
  }
}
// Zamknij UI. W trybie panelu (iframe w stronie) prosimy content script o
// usunięcie panelu; w innym wypadku zamykamy okno/zakładkę.
function isPanelMode() {
  try {
    return new URLSearchParams(location.search).get("panel") === "1";
  } catch (e) {
    return false;
  }
}
function closeSelf() {
  const id = getTargetTabId();
  if (isPanelMode() && id != null) {
    try {
      chrome.tabs.sendMessage(id, { type: "wfs-close-panel" });
      return;
    } catch (e) {}
  }
  try {
    window.close();
  } catch (e) {}
}
async function getActiveTab() {
  const id = getTargetTabId();
  if (id != null) {
    try {
      return await chrome.tabs.get(id);
    } catch (e) {
      /* karta zniknęła — spróbuj fallbacku poniżej */
    }
  }
  // Fallback (np. otwarcie bez tabId): aktywna karta ostatniego zwykłego okna.
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs && tabs[0] && tabs[0].url) return tabs[0];
  } catch (e) {}
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Zielona kropka aktywności na ikonce — per karta (rysowana na canvasie popupu).
function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
async function drawDot(size, on, color) {
  const srcSize = size >= 48 ? 48 : size >= 32 ? 48 : 16;
  const img = await loadImg(chrome.runtime.getURL("icons/icon" + srcSize + ".png"));
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  if (on) {
    const r = Math.max(2, Math.round(size * 0.16));
    const m = Math.round(size * 0.06);
    const cx = size - r - m;
    const cy = size - r - m;
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.max(1, Math.round(size * 0.04)), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,13,20,.92)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    // Czerwona kropka = reguła domeny (z ustawień). Zielona = ręczna podmiana.
    ctx.fillStyle = color === "red" ? "#ff3b30" : "#21c95e";
    ctx.fill();
  }
  return ctx.getImageData(0, 0, size, size);
}
async function setTabDot(tabId, on, color) {
  if (tabId == null) return;
  try {
    const [d16, d32] = await Promise.all([drawDot(16, on, color), drawDot(32, on, color)]);
    await chrome.action.setIcon({ tabId, imageData: { 16: d16, 32: d32 } });
  } catch (e) {}
}

async function applyToPage() {
  // Ręczna zmiana rozjeżdża się z presetem → zdejmij oznaczenie aktywnego
  // (applyPreset ustawia je ponownie PO wywołaniu applyToPage).
  clearActivePreset();
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus(t("status_no_tab"));
    return;
  }
  currentHost = hostOf(tab.url || "");
  currentUrl = tab.url || "";

  const url = tab.url || "";
  if (/^file:/i.test(url)) {
    setStatus(t("status_file"));
    return;
  }
  if (
    !url ||
    /^(chrome|edge|brave|opera|about|chrome-extension|moz-extension|devtools|view-source):/i.test(
      url
    ) ||
    /^https?:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/i.test(
      url
    )
  ) {
    setStatus(t("status_protected"));
    return;
  }

  try {
    // 1) Fizycznie załaduj pliki fontów Google (insertCSS, omija CSP).
    try {
      await ensureGoogleFontsLoaded(tab.id);
    } catch (e) {
      setStatus(t("status_google_fail") + " " + (e && e.message ? e.message : e));
    }
    // 1b) Wstrzyknij customowe fonty pobrane pickerem (data:-URL).
    try {
      await ensureCustomFontsLoaded(tab.id);
    } catch (e) {
      /* ignorujemy — font po prostu nie wstanie */
    }
    // 2) Ustaw reguły font-family na stronie (z fallbackiem na darmowy odpowiednik).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyFontsInPage,
      args: [{ ...selection }, altMapFor(selection)],
    });
    saveSessionConfig(currentHost, JSON.parse(JSON.stringify(selection))); // per domena/sesja
    const names = Object.values(selection)
      .map((p) => p.family)
      .filter(Boolean);
    const anyActive = Object.values(selection).some(hasProps);
    // Czerwona kropka, gdy konfig pochodzi z reguły domeny; zielona przy ręcznej podmianie.
    setTabDot(tab.id, anyActive, appliedFromRule ? "red" : "green");
    if (anyActive) {
      setStatus(t("status_applied") + (names.length ? ": " + names.join(", ") : ""));
    } else {
      setStatus("");
    }
    updateSnippet();
  } catch (e) {
    setStatus(t("status_error") + " " + (e && e.message ? e.message : String(e)));
  }
}

// ---- Live preview na hover w dropdownie ----
function isRestrictedUrl(url) {
  return (
    !url ||
    /^(chrome|edge|brave|opera|about|chrome-extension|moz-extension|devtools|view-source|file):/i.test(url) ||
    /^https?:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/i.test(url)
  );
}
let previewActive = false;

// Podejrzyj font na stronie BEZ zmiany zatwierdzonego wyboru i bez zapisu.
async function livePreview(target, family) {
  const tab = await getActiveTab();
  if (!tab || !tab.id || isRestrictedUrl(tab.url || "")) return;
  // jeśli to już zatwierdzony font tego pola — nic nie rób
  if ((selection[target].family || "") === family) return;
  const temp = {};
  for (const k of Object.keys(selection)) temp[k] = { ...selection[k] };
  temp[target] = { ...selection[target], family };
  try {
    await ensureGoogleFontsLoaded(tab.id, temp); // pobierze tylko gdy trzeba (cache!)
    await ensureCustomFontsLoaded(tab.id, temp);
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyFontsInPage,
      args: [temp, altMapFor(temp)],
    });
    previewActive = true;
  } catch (e) {
    /* strona chroniona / błąd — ignorujemy */
  }
}

// Przywróć zatwierdzony wybór (gdy zjedziesz z listy bez wyboru).
async function revertPreview() {
  if (!previewActive) return;
  previewActive = false;
  const tab = await getActiveTab();
  if (!tab || !tab.id || isRestrictedUrl(tab.url || "")) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyFontsInPage,
      args: [{ ...selection }, altMapFor(selection)],
    });
  } catch (e) {}
}

async function resetPage() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  currentHost = hostOf(tab.url || "");
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: resetFontsInPage,
    });
    // Przywróć oryginalny tekst (cofnij edycje edytora tekstu).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: resetTextInPage,
    });
    // Usuń też wstrzyknięte @font-face (insertCSS) dla tej karty.
    const rec = injectedByTab.get(tab.id);
    if (rec) {
      for (const css of rec.cssList) {
        try {
          await chrome.scripting.removeCSS({ target: { tabId: tab.id }, css });
        } catch (e) {
          /* mogło już zniknąć */
        }
      }
      injectedByTab.delete(tab.id);
    }
  } catch (e) {
    /* strona chroniona — ignorujemy */
  }
  selection.base = emptyProps();
  selection.headings = emptyProps();
  selection.paragraphs = emptyProps();
  selection.navigation = emptyProps();
  selection.buttons = emptyProps();
  removeDomainConfig(currentHost); // wyczyść konfig tej domeny (sesja + trwały)
  setTabDot(tab.id, false); // zgaś kropkę dla tej karty
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.classList.remove("has-value");
    const input = combo.querySelector(".wfs-search");
    input.value = "";
    input.classList.remove("wfs-selected");
  });
  document
    .querySelectorAll(".wfs-chip.active")
    .forEach((chip) => chip.classList.remove("active"));
  document
    .querySelectorAll(".wfs-color-wrap.set")
    .forEach((w) => w.classList.remove("set"));
  document.querySelectorAll(".wfs-combo").forEach((c) => {
    if (c.updateHeart) c.updateHeart();
    if (c.updateDollar) c.updateDollar();
    if (c.updateTag) c.updateTag();
  });
  activePresetName = null; // reset zdejmuje oznaczenie aktywnego presetu
  renderPresets();
  setStatus(t("status_reset"));
  updateSnippet();
}

// ---- Generowanie snippetów (CSS / SCSS / JS) ----

const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;

function familyValue(font) {
  if (generic.test(font)) return font;
  // Dla fontu premium wstaw darmowy odpowiednik jako fallback (oryginał wygrywa,
  // jeśli użytkownik go ma) — snippet odzwierciedla to, co widać na podglądzie.
  const meta = window.WOLFIE_FONT_META;
  const alt = meta && meta.freeAlternative ? meta.freeAlternative(font) : null;
  if (alt) return '"' + font + '", "' + alt + '", sans-serif';
  return '"' + font + '", sans-serif';
}

function googleImportUrl(fam) {
  return (
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(fam).replace(/%20/g, "+") +
    ":ital,wght@0,300;0,400;0,500;0,700;0,800;1,400;1,700&display=swap"
  );
}

function selectedGoogleFonts() {
  return [
    ...new Set(
      Object.values(selection)
        .map((p) => p.family)
        .filter((f) => f && isGoogle(f))
    ),
  ];
}

// Bloki (selektor + ustawienia) dla każdego targetu.
const SNIPPET_BLOCKS = [
  { sel: "body, *", key: "base", scssVar: "$font-base" },
  { sel: "h1, h2, h3, h4, h5, h6", key: "headings", scssVar: "$font-heading" },
  { sel: "p, ul, ol, li, dl, dt, dd, table, caption, thead, tbody, tfoot, tr, td, th", key: "paragraphs", scssVar: "$font-paragraph" },
  {
    sel: 'nav, [role="navigation"], .navbar, .nav, .navigation, .menu',
    key: "navigation",
    scssVar: "$font-nav",
  },
  {
    sel: 'button, [role="button"], .btn, .button, input[type="button"], input[type="submit"]',
    key: "buttons",
    scssVar: "$font-btn",
  },
];

function declList(p, familyExpr, indent) {
  const pad = indent || "";
  const d = [];
  if (p.family) d.push(pad + "font-family: " + familyExpr + ";");
  if (p.weight) d.push(pad + "font-weight: " + p.weight + ";");
  if (p.spacing) d.push(pad + "letter-spacing: " + p.spacing + ";");
  if (p.size) d.push(pad + "font-size: " + p.size + ";");
  if (p.lineheight) d.push(pad + "line-height: " + p.lineheight + ";");
  if (p.case) d.push(pad + "text-transform: " + p.case + ";");
  if (p.color) d.push(pad + "color: " + p.color + ";");
  return d;
}

// Czy font wymaga zaimportowania pliku (@font-face) w snippetcie?
// NIE: web-safe (samo font-family), Google (@import), custom (mamy złapany @font-face).
// TAK: systemowy niepreinstalowany / licencjonowany — trzeba własnego pliku.
function needsFontFaceScaffold(name) {
  if (!name || generic.test(name)) return false;
  const meta = window.WOLFIE_FONT_META;
  if (meta && meta.isWebSafe && meta.isWebSafe(name)) return false;
  if (isGoogle(name)) return false;
  if (customFonts[name.toLowerCase()]) return false;
  return true;
}
function selectedNeedsFontFace() {
  return [
    ...new Set(
      Object.values(selection).map((p) => p.family).filter(Boolean).filter(needsFontFaceScaffold)
    ),
  ];
}
// Typowy katalog z plikami fontów w systemie (wg wykrytego OS).
function systemFontDir() {
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.indexOf("windows") >= 0) return "C:\\Windows\\Fonts\\";
  if (ua.indexOf("mac os") >= 0 || ua.indexOf("macintosh") >= 0)
    return "~/Library/Fonts/  •  /Library/Fonts/  •  /System/Library/Fonts/";
  if (ua.indexOf("linux") >= 0 || ua.indexOf("x11") >= 0)
    return "~/.local/share/fonts/  •  ~/.fonts/  •  /usr/share/fonts/";
  return "C:\\Windows\\Fonts\\ (Windows)  •  ~/Library/Fonts/ (macOS)  •  ~/.local/share/fonts/ (Linux)";
}
function fontFaceScaffold(name) {
  const slug = name.replace(/[^a-z0-9]+/gi, "-");
  return (
    "/* " + t("ff_title").replace("%s", name) + "\n" +
    "   " + t("ff_path") + " " + systemFontDir() + "\n" +
    "   " + t("ff_step1") + "\n" +
    "   " + t("ff_step2") + "\n" +
    "   " + t("ff_step3") + " */\n" +
    "@font-face {\n" +
    '  font-family: "' + name + '";\n' +
    '  src: url("/fonts/' + slug + '.woff2") format("woff2");\n' +
    "  font-display: swap;\n" +
    "}"
  );
}

function buildCSS() {
  const lines = [];
  const googles = selectedGoogleFonts();
  googles.forEach((g) => lines.push("@import url('" + googleImportUrl(g) + "');"));
  const faces = selectedNeedsFontFace();
  faces.forEach((f) => lines.push(fontFaceScaffold(f)));
  if (googles.length || faces.length) lines.push("");
  for (const b of SNIPPET_BLOCKS) {
    const p = selection[b.key];
    if (!hasProps(p)) continue;
    lines.push(b.sel + " {");
    lines.push(...declList(p, familyValue(p.family), "  "));
    lines.push("}");
  }
  return lines.join("\n");
}

function buildSCSS() {
  const lines = [];
  const googles = selectedGoogleFonts();
  googles.forEach((g) => lines.push("@import url('" + googleImportUrl(g) + "');"));
  const faces = selectedNeedsFontFace();
  faces.forEach((f) => lines.push(fontFaceScaffold(f)));
  if (googles.length || faces.length) lines.push("");
  for (const b of SNIPPET_BLOCKS) {
    const p = selection[b.key];
    if (p.family) lines.push(b.scssVar + ": " + familyValue(p.family) + ";");
  }
  lines.push("");
  for (const b of SNIPPET_BLOCKS) {
    const p = selection[b.key];
    if (!hasProps(p)) continue;
    lines.push(b.sel + " {");
    lines.push(...declList(p, b.scssVar, "  "));
    lines.push("}");
  }
  return lines.join("\n");
}

function buildJS() {
  const googles = selectedGoogleFonts();
  const lines = [];
  googles.forEach((g) => {
    lines.push("// " + t("js_load_google") + " " + g);
    lines.push("(() => {");
    lines.push("  const link = document.createElement('link');");
    lines.push("  link.rel = 'stylesheet';");
    lines.push("  link.href = '" + googleImportUrl(g) + "';");
    lines.push("  document.head.appendChild(link);");
    lines.push("})();");
    lines.push("");
  });
  const css = [];
  // @font-face dla fontów niepreinstalowanych (podmień src na swój plik z licencją).
  selectedNeedsFontFace().forEach((f) => css.push(fontFaceScaffold(f)));
  for (const b of SNIPPET_BLOCKS) {
    const p = selection[b.key];
    if (!hasProps(p)) continue;
    css.push(b.sel + " { " + declList(p, familyValue(p.family)).join(" ") + " }");
  }
  if (css.length) {
    lines.push("// " + t("js_apply_typo"));
    lines.push("const style = document.createElement('style');");
    lines.push("style.textContent = `\n  " + css.join("\n  ") + "\n`;");
    lines.push("document.head.appendChild(style);");
  }
  return lines.join("\n");
}

let currentTab = "css";

function updateSnippet() {
  const section = document.getElementById("wfs-snippet");
  const hasAny = Object.values(selection).some(hasProps);
  if (!hasAny) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  const builders = { css: buildCSS, scss: buildSCSS, js: buildJS };
  document.getElementById("wfs-code").textContent = builders[currentTab]();

  // Badge PAID + opcje zakupu (afiliacja) dla fontów komercyjnych.
  const buy = document.getElementById("wfs-buy");
  const paid = document.getElementById("wfs-paid");
  const buyOptions = document.getElementById("wfs-buy-options");
  let buyUrl = null;
  let commercialName = null;
  let isCommercial = false;
  const meta = window.WOLFIE_FONT_META;
  if (meta) {
    for (const p of Object.values(selection)) {
      if (!p.family) continue;
      const c = meta.classify(p.family);
      if (c.license === "commercial") {
        isCommercial = true;
        if (!commercialName) {
          commercialName = p.family;
          buyUrl = c.buyUrl || null;
        }
      }
    }
  }
  if (paid) paid.hidden = !isCommercial;
  if (buy) buy.hidden = true; // zastąpione przez listę opcji poniżej
  if (buyOptions) {
    buyOptions.innerHTML = "";
    if (isCommercial && commercialName && meta && meta.affiliateLinks) {
      const lbl = document.createElement("span");
      lbl.className = "wfs-buy-label";
      lbl.textContent = t("buy_font") + " „" + commercialName + "”:";
      buyOptions.appendChild(lbl);
      meta.affiliateLinks(commercialName, buyUrl).forEach((lnk) => {
        const a = document.createElement("a");
        a.className = "wfs-buy-chip";
        a.href = lnk.url;
        a.target = "_blank";
        // rel=sponsored — uczciwe oznaczenie linku afiliacyjnego.
        a.rel = "noopener noreferrer" + (lnk.affiliate ? " sponsored" : "");
        a.textContent = lnk.label;
        buyOptions.appendChild(a);
      });
      const note = document.createElement("span");
      note.className = "wfs-buy-aff";
      note.textContent = t("affiliate_note");
      buyOptions.appendChild(note);
      buyOptions.hidden = false;
    } else {
      buyOptions.hidden = true;
    }
  }
}

// ---- Podgląd fontów na liście (każda pozycja własnym krojem) ----
// Tylko pozycje w dropdownie; aktywny wybór w polu zostaje w Rubiku.
let previewStyleEl = null;
const previewRequested = new Set();
function injectPreviewCss(css) {
  if (!css) return;
  if (!previewStyleEl) {
    previewStyleEl = document.createElement("style");
    previewStyleEl.id = "wfs-preview-fonts";
    (document.head || document.documentElement).appendChild(previewStyleEl);
  }
  previewStyleEl.appendChild(document.createTextNode("\n" + css));
}
// Zadbaj, by font był dostępny do podglądu: cache → custom → Google (lekki link).
function ensurePreviewFont(name) {
  if (!name) return;
  const low = name.toLowerCase();
  if (previewRequested.has(low)) return;
  previewRequested.add(low);
  if (fontCacheMap[low]) {
    injectPreviewCss(fontCacheMap[low]); // osadzony @font-face (data:)
    return;
  }
  const c = customFonts[low];
  if (c) {
    injectPreviewCss(typeof c === "string" ? c : c.css);
    return;
  }
  if (isGoogle(name)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(name).replace(/%20/g, "+") +
      "&display=swap"; // tylko zwykła grubość — lekki podgląd
    (document.head || document.documentElement).appendChild(link);
  }
}

// ---- Budowa wyszukiwalnych dropdownów ----

function buildCombo(combo) {
  const target = combo.dataset.target;
  const input = combo.querySelector(".wfs-search");
  const list = combo.querySelector(".wfs-options");
  const clearBtn = combo.querySelector(".wfs-clear");
  const BATCH = 60; // ile fontów doładowujemy za jednym razem (lazy-load na scroll)
  const DEBOUNCE_MS = 800; // odczekaj ~sekundę przy pisaniu, potem szukaj on-fly
  let activeIndex = -1;
  let rendered = []; // aktualnie wyrenderowane (w DOM) pozycje — dla Enter/strzałek
  let filtered = []; // pełny wynik filtrowania
  let shownCount = 0; // ile z `filtered` jest już w DOM
  let debounceTimer = null;
  let hoverTimer = null; // debounce dla live-preview na hover
  let sourceFilter = "all"; // tab źródła: all | google | system

  // Stopka informująca o doładowywaniu / liczbie pozostałych wyników.
  let footer = null;

  // Czy font pasuje do aktywnego taba źródła.
  function matchesSource(f) {
    if (sourceFilter === "google") return f.type === "google";
    if (sourceFilter === "system") return f.type === "system";
    return true; // "all"
  }

  // Przyklejony pasek tabów (All / Google / System) na górze listy.
  const SOURCE_TABS = [
    { key: "all", label: () => t("tab_all") },
    { key: "google", label: () => "Google" },
    { key: "system", label: () => t("tab_system") },
    { key: "paid", label: () => t("tab_paid") },
  ];
  const tabsRow = document.createElement("li");
  tabsRow.className = "wfs-tabs-row";
  const tabBtns = {};
  SOURCE_TABS.forEach((tb) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "wfs-source-tab";
    b.textContent = tb.label();
    b.addEventListener("mousedown", (e) => {
      e.preventDefault(); // nie gub focusu z pola
      e.stopPropagation();
      sourceFilter = tb.key;
      render(input.value);
      input.focus();
    });
    tabBtns[tb.key] = b;
    tabsRow.appendChild(b);
  });
  function syncTabs() {
    SOURCE_TABS.forEach((tb) =>
      tabBtns[tb.key].classList.toggle("active", tb.key === sourceFilter)
    );
  }

  // Karta PAID: zamiast listy fontów — instrukcja + linki afiliacyjne (z UTM).
  function renderPaidPanel() {
    const li = document.createElement("li");
    li.className = "wfs-paid-panel";
    const title = document.createElement("div");
    title.className = "wfs-paid-title";
    title.textContent = t("paid_title");
    const desc = document.createElement("div");
    desc.className = "wfs-paid-desc";
    desc.textContent = t("paid_hint");
    li.append(title, desc);
    const meta = window.WOLFIE_FONT_META;
    if (meta && meta.affiliateBrowse) {
      const row = document.createElement("div");
      row.className = "wfs-paid-links";
      meta.affiliateBrowse(input.value).forEach((lnk) => {
        const a = document.createElement("a");
        a.className = "wfs-paid-link";
        a.href = lnk.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer" + (lnk.affiliate ? " sponsored" : "");
        a.textContent = lnk.label;
        row.appendChild(a);
      });
      li.appendChild(row);
      const note = document.createElement("div");
      note.className = "wfs-paid-note";
      note.textContent = t("affiliate_note");
      li.appendChild(note);
    }
    list.appendChild(li);
  }

  // Wspólna logika znacznika (Web-safe / Premium / System / Google) — używana
  // i na liście (makeItem), i jako badge w inpucie po wybraniu fonta.
  function tagInfoFor(font, lic) {
    const meta = window.WOLFIE_FONT_META;
    if (lic === undefined) lic = meta && meta.classify ? meta.classify(font.name) : null;
    if (font.type === "custom") {
      return { cls: "wfs-tag-custom", text: font.source === "google" ? "★ Google" : "Custom" };
    }
    if (font.type === "commercial") {
      return { cls: "wfs-tag-paid", text: "Premium" };
    }
    if (font.popular) {
      return { cls: "wfs-tag-pop", text: "★ Google" };
    }
    if (font.type === "system") {
      if (lic && lic.license === "commercial") {
        return { cls: "wfs-tag-paid", text: "Premium" };
      }
      if (meta && meta.isWebSafe && meta.isWebSafe(font.name)) {
        return { cls: "wfs-tag-websafe", text: "Web-safe" };
      }
      return { cls: "wfs-tag-syslic", text: "System", title: t("system_web_note") };
    }
    return { cls: "", text: "Google" };
  }

  // Znajdź wpis fonta po nazwie (do badge'a w inpucie). Jeśli nieznany — system.
  function fontEntryByName(name) {
    if (!name) return null;
    const low = name.toLowerCase();
    return (
      ALL_FONTS.find((f) => f.name.toLowerCase() === low) || {
        name,
        type: "system",
      }
    );
  }

  function makeItem(font, i) {
    const li = document.createElement("li");
    li.dataset.index = i;
    const name = document.createElement("span");
    name.className = "wfs-name";
    name.textContent = font.name;
    const lic = window.WOLFIE_FONT_META && window.WOLFIE_FONT_META.classify(font.name);
    // Każda pozycja własnym krojem (podgląd). Dla premium: oryginał (jeśli masz
    // zainstalowany) ma pierwszeństwo, inaczej darmowy odpowiednik (Google).
    if (lic && lic.license === "commercial" && lic.freeAlt) {
      name.style.fontFamily = '"' + font.name + '", "' + lic.freeAlt + '", sans-serif';
      ensurePreviewFont(lic.freeAlt);
    } else {
      name.style.fontFamily = generic.test(font.name) ? font.name : '"' + font.name + '"';
      ensurePreviewFont(font.name);
    }
    const tag = document.createElement("span");
    tag.className = "wfs-tag";
    const ti = tagInfoFor(font, lic);
    if (ti.cls) tag.classList.add(ti.cls);
    tag.textContent = ti.text;
    if (ti.title) tag.title = ti.title;
    const left = document.createElement("span");
    left.style.cssText = "display:flex;align-items:center;gap:6px;min-width:0";
    if (isFavorite(font.name)) {
      li.classList.add("wfs-fav");
      const h = document.createElement("span");
      h.className = "wfs-fav-mark";
      h.textContent = "❤";
      left.appendChild(h);
    }
    left.appendChild(name);
    // Znacznik $ dla fontów premium (wymagana płatna licencja).
    if (lic && lic.license === "commercial") {
      const dollar = document.createElement("span");
      dollar.className = "wfs-paidmark";
      dollar.textContent = "$";
      dollar.title =
        t("premium_required") + (lic.freeAlt ? " — podgląd: " + lic.freeAlt : "");
      left.appendChild(dollar);
    }
    li.append(left, tag);
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      choose(font.name);
    });
    // Live preview na hover (asynchronicznie, z debounce; font ładowany raz, z cache).
    li.addEventListener("mouseenter", () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => livePreview(target, font.name), 180);
    });
    return li;
  }

  function updateFooter() {
    if (footer) footer.remove();
    footer = null;
    const remaining = filtered.length - shownCount;
    if (remaining > 0) {
      footer = document.createElement("li");
      footer.className = "wfs-group";
      footer.textContent = t("load_more") + " (" + remaining + ")";
      list.appendChild(footer);
    }
  }

  // Doładuj kolejną partię z `filtered` do listy.
  function loadMore() {
    if (footer) {
      footer.remove();
      footer = null;
    }
    const next = Math.min(shownCount + BATCH, filtered.length);
    for (let i = shownCount; i < next; i++) {
      list.appendChild(makeItem(filtered[i], i));
    }
    shownCount = next;
    rendered = filtered.slice(0, shownCount);
    updateFooter();
  }

  // Pokaż chwilowy wskaźnik podczas oczekiwania na debounce.
  function showSearching() {
    list.innerHTML = "";
    list.appendChild(tabsRow);
    syncTabs();
    const li = document.createElement("li");
    li.className = "wfs-empty";
    li.textContent = t("search_loading");
    list.appendChild(li);
    list.hidden = false;
  }

  // Pełne, świeże wyrenderowanie wyników dla danej frazy.
  function render(filter) {
    const term = (filter || "").trim().toLowerCase();
    // Ulubione przypięte na samej górze (nad popularnymi Google).
    let source = ALL_FONTS;
    if (favorites.length) {
      const favSet = new Set(favorites.map((n) => n.toLowerCase()));
      const favItems = [];
      const seen = new Set();
      favorites.forEach((n) => {
        const f = ALL_FONTS.find((x) => x.name.toLowerCase() === n.toLowerCase());
        if (f && !seen.has(f.name.toLowerCase())) {
          favItems.push(f);
          seen.add(f.name.toLowerCase());
        }
      });
      source = [...favItems, ...ALL_FONTS.filter((f) => !favSet.has(f.name.toLowerCase()))];
    }
    filtered = (term
      ? source.filter((f) => f.name.toLowerCase().includes(term))
      : source
    ).filter(matchesSource); // tab źródła (All / Google / System)

    activeIndex = -1;
    shownCount = 0;
    rendered = [];
    list.innerHTML = "";
    footer = null;
    list.appendChild(tabsRow); // przyklejony pasek tabów na górze
    syncTabs();

    if (sourceFilter === "paid") {
      renderPaidPanel(); // instrukcja + linki afiliacyjne zamiast listy fontów
      list.hidden = false;
      list.scrollTop = 0;
      return;
    }

    if (filtered.length === 0) {
      const li = document.createElement("li");
      li.className = "wfs-empty";
      li.textContent = t("search_empty");
      list.appendChild(li);
    } else {
      loadMore();
    }
    list.hidden = false;
    list.scrollTop = 0;
  }

  // Wymuś natychmiastowe wyszukanie (np. przy Enter) pomijając debounce.
  function flushSearch() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
      render(input.value);
    }
  }

  // Doładowywanie przy przewijaniu listy w dół.
  list.addEventListener("scroll", () => {
    if (shownCount >= filtered.length) return;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 48) {
      loadMore();
    }
  });

  // Zjechanie z listy bez wyboru — przywróć zatwierdzony font.
  list.addEventListener("mouseleave", () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
    revertPreview();
  });

  function highlight(delta) {
    let items = [...list.querySelectorAll("li[data-index]")];
    if (!items.length) return;
    activeIndex += delta;
    if (activeIndex >= items.length) {
      if (shownCount < filtered.length) {
        loadMore();
        items = [...list.querySelectorAll("li[data-index]")];
      } else {
        activeIndex = 0;
      }
    } else if (activeIndex < 0) {
      activeIndex = items.length - 1;
    }
    items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: "nearest" });
    // Live preview podświetlonego strzałkami fontu (async, z debounce + cache).
    const f = rendered[activeIndex];
    if (f) {
      if (hoverTimer) clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => livePreview(target, f.name), 180);
    }
  }

  function choose(name) {
    if (hoverTimer) clearTimeout(hoverTimer);
    previewActive = false; // commit nadpisuje podgląd
    appliedFromRule = false; // ręczna zmiana → konfig sesji (zielona kropka)
    selection[target].family = name;
    input.value = name;
    input.classList.add("wfs-selected");
    combo.classList.add("has-value");
    list.hidden = true;
    if (combo.updateHeart) combo.updateHeart();
    if (combo.updateDollar) combo.updateDollar();
    if (combo.updateTag) combo.updateTag();
    applyToPage();
  }

  function clearSelection() {
    appliedFromRule = false; // ręczna zmiana → konfig sesji (zielona kropka)
    selection[target].family = null;
    input.value = "";
    input.classList.remove("wfs-selected");
    combo.classList.remove("has-value");
    if (combo.updateHeart) combo.updateHeart();
    if (combo.updateDollar) combo.updateDollar();
    if (combo.updateTag) combo.updateTag();
    applyToPage();
  }

  // Chipy (grubość / odstęp / rozmiar) pod tym dropdownem.
  const chipsBox = combo.closest(".wfs-field").querySelector(".wfs-chips");
  if (chipsBox) {
    CHIP_GROUPS.filter(
      (group) => !group.targets || group.targets.includes(target)
    ).forEach((group) => {
      const row = document.createElement("div");
      row.className = "wfs-chip-row";
      const lbl = document.createElement("span");
      lbl.className = "wfs-chip-label";
      lbl.textContent = group.label;
      const wrap = document.createElement("div");
      wrap.className = "wfs-chip-group";
      const groupOptions =
        (group.optionsByTarget && group.optionsByTarget[target]) ||
        group.options;
      groupOptions.forEach((opt) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "wfs-chip";
        chip.textContent = opt.label;
        chip.dataset.key = group.key;
        chip.dataset.value = opt.value;
        chip.title = group.label + ": " + opt.label;
        chip.addEventListener("click", () => {
          appliedFromRule = false; // ręczna zmiana → zielona kropka
          if (selection[target][group.key] === opt.value) {
            selection[target][group.key] = null; // klik ponownie = wyłącz
            chip.classList.remove("active");
          } else {
            selection[target][group.key] = opt.value;
            wrap
              .querySelectorAll(".wfs-chip")
              .forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
          }
          applyToPage();
        });
        wrap.appendChild(chip);
      });
      row.append(lbl, wrap);
      chipsBox.appendChild(row);
    });

    // Color picker dla tej sekcji (po Rozmiarze).
    const crow = document.createElement("div");
    crow.className = "wfs-chip-row";
    const clbl = document.createElement("span");
    clbl.className = "wfs-chip-label";
    clbl.textContent = t("chip_color");
    const cwrap = document.createElement("div");
    cwrap.className = "wfs-color-wrap";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "wfs-color";
    colorInput.value = "#000000";
    const colorClear = document.createElement("button");
    colorClear.type = "button";
    colorClear.className = "wfs-color-clear";
    colorClear.textContent = "✕";
    colorClear.title = t("clear_title");
    colorInput.addEventListener("input", () => {
      appliedFromRule = false; // ręczna zmiana → zielona kropka
      selection[target].color = colorInput.value;
      cwrap.classList.add("set");
      applyToPage();
    });
    colorClear.addEventListener("click", () => {
      appliedFromRule = false; // ręczna zmiana → zielona kropka
      selection[target].color = null;
      cwrap.classList.remove("set");
      applyToPage();
    });
    cwrap.append(colorInput, colorClear);
    crow.append(clbl, cwrap);
    chipsBox.appendChild(crow);
    combo.colorInput = colorInput;
    combo.colorWrap = cwrap;
  }

  input.addEventListener("focus", async () => {
    lastFocusedTarget = target; // zapamiętaj, by picker wkleił tu nazwę
    render(input.value);
    // Spróbuj dociągnąć realne fonty systemowe (jednorazowo, za zgodą).
    if (!localFontsLoaded) {
      const ok = await loadLocalFonts();
      if (ok && !input.value.trim()) render(input.value);
    }
  });
  input.addEventListener("input", () => {
    combo.classList.add("has-value"); // pokaż ✕ do czyszczenia
    showSearching(); // natychmiastowy wskaźnik
    if (debounceTimer) clearTimeout(debounceTimer);
    const val = input.value;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      render(val); // dynamiczne wyszukiwanie po ~sekundzie
    }, DEBOUNCE_MS);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      flushSearch();
      if (list.hidden) render(input.value);
      highlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      flushSearch();
      highlight(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      flushSearch(); // nie czekaj na debounce — szukaj od razu
      if (activeIndex >= 0 && rendered[activeIndex]) {
        choose(rendered[activeIndex].name);
      } else if (filtered.length === 1) {
        choose(filtered[0].name);
      }
    } else if (e.key === "Escape") {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      revertPreview();
      list.hidden = true;
    }
  });

  clearBtn.addEventListener("click", clearSelection);

  // Mały picker przy tym polu — pobiera font ze strony prosto do tego targetu.
  const pickBtn = document.createElement("button");
  pickBtn.type = "button";
  pickBtn.className = "wfs-pick";
  pickBtn.title = t("picker_title");
  pickBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.2"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>';
  pickBtn.addEventListener("click", () => startPicker(target));
  combo.appendChild(pickBtn);

  // Serduszko — dodaj/usuń bieżący font tego pola do ulubionych.
  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "wfs-fav-btn";
  favBtn.title = t("fav_add");
  function favSvg(filled) {
    return (
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="' +
      (filled ? "#ff3dae" : "none") +
      '" stroke="' +
      (filled ? "#ff3dae" : "currentColor") +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path></svg>'
    );
  }
  function updateHeart() {
    const fav = isFavorite(selection[target].family);
    favBtn.classList.toggle("active", fav);
    favBtn.innerHTML = favSvg(fav);
  }
  favBtn.addEventListener("click", () => {
    const fam = selection[target].family;
    if (!fam) {
      setStatus(t("fav_need"));
      return;
    }
    toggleFavorite(fam);
    updateHeart();
  });
  updateHeart();
  combo.appendChild(favBtn);
  combo.updateHeart = updateHeart;

  // Żółty $ obok serca — pojawia się dla fontów premium; klik = linki do kupna.
  const dollarBtn = document.createElement("button");
  dollarBtn.type = "button";
  dollarBtn.className = "wfs-dollar-btn";
  dollarBtn.textContent = "$";
  dollarBtn.hidden = true;
  let dollarPop = null;
  function closeDollarPop() {
    if (dollarPop) { dollarPop.remove(); dollarPop = null; }
  }
  function updateDollar() {
    const fam = selection[target].family;
    const meta = window.WOLFIE_FONT_META;
    const lic = fam && meta ? meta.classify(fam) : null;
    const commercial = !!(lic && lic.license === "commercial");
    dollarBtn.hidden = !commercial;
    dollarBtn.title = commercial
      ? t("premium_required") + (lic.freeAlt ? " — podgląd: " + lic.freeAlt : "")
      : "";
    if (!commercial) closeDollarPop();
  }
  dollarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dollarPop) { closeDollarPop(); return; }
    const fam = selection[target].family;
    const meta = window.WOLFIE_FONT_META;
    if (!fam || !meta || !meta.affiliateLinks) return;
    const lic = meta.classify(fam);
    dollarPop = document.createElement("div");
    dollarPop.className = "wfs-dollar-pop";
    const title = document.createElement("div");
    title.className = "wfs-dollar-pop-title";
    title.textContent = t("buy_font") + " „" + fam + "”";
    dollarPop.appendChild(title);
    meta.affiliateLinks(fam, lic && lic.buyUrl).forEach((lnk) => {
      const a = document.createElement("a");
      a.href = lnk.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer" + (lnk.affiliate ? " sponsored" : "");
      a.textContent = lnk.label;
      dollarPop.appendChild(a);
    });
    const note = document.createElement("div");
    note.className = "wfs-dollar-pop-note";
    note.textContent = t("affiliate_note");
    dollarPop.appendChild(note);
    combo.appendChild(dollarPop);
  });
  updateDollar();
  combo.appendChild(dollarBtn);
  combo.updateDollar = updateDollar;
  combo.closeDollarPop = closeDollarPop;

  // Badge typu fonta w inpucie (Web-safe / Premium / System / Google) — pokazuje
  // się obok wybranej nazwy, tak jak na liście przy pickowaniu.
  const tagBadge = document.createElement("span");
  tagBadge.className = "wfs-tag wfs-input-tag";
  tagBadge.hidden = true;
  function updateTag() {
    const fam = selection[target].family;
    tagBadge.className = "wfs-tag wfs-input-tag";
    if (!fam) {
      tagBadge.hidden = true;
      tagBadge.textContent = "";
      tagBadge.title = "";
      return;
    }
    const ti = tagInfoFor(fontEntryByName(fam));
    if (ti.cls) tagBadge.classList.add(ti.cls);
    tagBadge.textContent = ti.text;
    tagBadge.title = ti.title || "";
    tagBadge.hidden = false;
  }
  updateTag();
  combo.appendChild(tagBadge);
  combo.updateTag = updateTag;
  // Odśwież listę, jeśli dropdown jest otwarty (np. po doczytaniu fontów lokalnych).
  combo.rerenderIfOpen = () => {
    if (!list.hidden) render(input.value);
  };

  // Zamknij listę / popover $ po kliknięciu poza nią (i przywróć podgląd).
  document.addEventListener("click", (e) => {
    if (!combo.contains(e.target)) {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      revertPreview();
      list.hidden = true;
      closeDollarPop();
    }
  });

  // Ustawienie stanu targetu (rodzina + chipy) i odświeżenie UI.
  // Obsługuje też czyszczenie (gdy saved puste) — używane przy wczytaniu presetu.
  combo.restore = (saved) => {
    const p = { ...emptyProps(), ...(saved || {}) };
    selection[target] = p;
    if (p.family) {
      input.value = p.family;
      input.classList.add("wfs-selected");
      combo.classList.add("has-value");
    } else {
      input.value = "";
      input.classList.remove("wfs-selected");
      combo.classList.remove("has-value");
    }
    if (chipsBox) {
      chipsBox.querySelectorAll(".wfs-chip").forEach((chip) => {
        chip.classList.toggle("active", p[chip.dataset.key] === chip.dataset.value);
      });
    }
    if (combo.colorInput) {
      if (p.color) {
        combo.colorInput.value = p.color;
        combo.colorWrap.classList.add("set");
      } else {
        combo.colorWrap.classList.remove("set");
      }
    }
    if (combo.updateHeart) combo.updateHeart();
    if (combo.updateDollar) combo.updateDollar();
    if (combo.updateTag) combo.updateTag();
  };
}

// ---- Init ----

// Przetłumacz statyczne elementy (data-i18n / -ph / -title) wg języka.
if (window.WOLFIE_I18N) window.WOLFIE_I18N.applyI18n(document);

// Wersja w stopce (z manifestu, małymi literami).
try {
  const v = chrome.runtime.getManifest().version;
  const vEl = document.getElementById("wfs-version");
  if (vEl) vEl.textContent = "v" + v;
} catch (e) {
  /* poza kontekstem rozszerzenia */
}

// Koło zębate → strona ustawień dodatku.
const settingsBtn = document.getElementById("wfs-settings");
if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    try {
      chrome.runtime.openOptionsPage();
    } catch (e) {
      /* ignore */
    }
  });
}

// Minimalizacja — zwiń panel do małej okrągłej ikony (content script).
const minimizeBtn = document.getElementById("wfs-minimize");
if (minimizeBtn) {
  minimizeBtn.addEventListener("click", () => {
    const id = getTargetTabId();
    try {
      if (id != null) chrome.tabs.sendMessage(id, { type: "wfs-collapse-panel" });
      else window.close();
    } catch (e) {}
  });
}

// Krzyżyk — zamknij dodatek (usuń panel całkowicie; to nie minimalizacja).
const closeBtn = document.getElementById("wfs-close");
if (closeBtn) closeBtn.addEventListener("click", closeSelf);

// Picker — pobierz font ze strony (tryb inspekcji). target = pole docelowe (lub null).
async function startPicker(target) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus(t("status_no_tab"));
    return;
  }
  const url = tab.url || "";
  if (
    !url ||
    /^(chrome|edge|brave|opera|about|chrome-extension|moz-extension|devtools|view-source):/i.test(
      url
    ) ||
    /^https?:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/i.test(url)
  ) {
    setStatus(t("status_protected"));
    return;
  }
  const meta = window.WOLFIE_FONT_META;
  const googleNames = GOOGLE_FONTS.map((s) => s.toLowerCase());
  const commercialNames = Object.keys(meta ? meta.COMMERCIAL : {}).map((s) =>
    s.toLowerCase()
  );
  chrome.storage.local.set({ wfs_pending_target: target || null });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageFontInspector,
      args: [
        {
          googleNames,
          commercialNames,
          labels: {
            hint: t("pick_hint"),
            open: t("lic_open"),
            commercial: t("lic_commercial"),
            unknown: t("lic_unknown"),
          },
        },
      ],
    });
    closeSelf(); // zamknij popup, by wskazać element na stronie
  } catch (e) {
    setStatus(t("status_protected"));
  }
}

// GŁÓWNY picker (ikona w nagłówku): kopiuje STYL CSS fontu klikniętego elementu
// do schowka i NIE zwija panelu (zostaje w miejscu). Per-input pickery działają
// po staremu (startPicker).
async function startStyleCopier() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus(t("status_no_tab"));
    return;
  }
  if (isRestrictedUrl(tab.url || "")) {
    setStatus(t("status_protected"));
    return;
  }
  const meta = window.WOLFIE_FONT_META;
  const googleNames = GOOGLE_FONTS.map((s) => s.toLowerCase());
  const commercialNames = Object.keys(meta ? meta.COMMERCIAL : {}).map((s) =>
    s.toLowerCase()
  );
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageFontInspector,
      args: [
        {
          mode: "style",
          googleNames,
          commercialNames,
          labels: {
            hint: t("pick_style_hint"),
            copied: t("pick_style_copied"),
            open: t("lic_open"),
            commercial: t("lic_commercial"),
            unknown: t("lic_unknown"),
          },
        },
      ],
    });
    setStatus(t("pick_style_hint")); // panel zostaje otwarty
  } catch (e) {
    setStatus(t("status_protected"));
  }
}

const pickerBtn = document.getElementById("wfs-picker");
if (pickerBtn) pickerBtn.addEventListener("click", startStyleCopier);

// Edytor tekstu na stronie (ikona ✎ nad „Cała strona").
async function startTextEditor() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus(t("status_no_tab"));
    return;
  }
  if (isRestrictedUrl(tab.url || "")) {
    setStatus(t("status_protected"));
    return;
  }
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: pageTextEditor,
      args: [{ labels: { hint: t("edit_text_hint") } }],
    });
    setStatus(t("edit_text_hint")); // panel zostaje otwarty
  } catch (e) {
    setStatus(t("status_protected"));
  }
}
const editTextBtn = document.getElementById("wfs-edit-text");
if (editTextBtn) editTextBtn.addEventListener("click", startTextEditor);

document.querySelectorAll(".wfs-combo").forEach(buildCombo);
document.getElementById("wfs-reset").addEventListener("click", resetPage);

// Auto-wczytanie zainstalowanych fontów systemowych przy PIERWSZEJ interakcji
// z popupem (Local Font Access wymaga gestu użytkownika — bez niego się nie da).
// To legalne: używamy fontów, które user ma zainstalowane u siebie, do wyświetlenia
// w jego przeglądarce. Po doczytaniu odświeżamy otwarte dropdowny.
(function autoLoadLocalFonts() {
  if (typeof window.queryLocalFonts !== "function") return;
  let done = false;
  const handler = async () => {
    if (done) return;
    done = true;
    document.removeEventListener("pointerdown", handler, true);
    document.removeEventListener("keydown", handler, true);
    if (localFontsLoaded) return;
    const ok = await loadLocalFonts(); // jednorazowa zgoda + enumeracja
    if (ok) {
      document.querySelectorAll(".wfs-combo").forEach((c) => {
        if (c.rerenderIfOpen) c.rerenderIfOpen();
      });
    }
  };
  document.addEventListener("pointerdown", handler, true);
  document.addEventListener("keydown", handler, true);
})();

// (Ustawienia per domena zapisują się automatycznie na sesję; trwałość → presety.)

// Pasek reguły: jedyna akcja w popupie to usunięcie reguły tej domeny.
// (Reguły dodaje/edytuje się wyłącznie w ustawieniach.) Usunięcie reguły zdejmuje
// tylko „przypięcie" domeny — fonty/preset zostają (kropka wraca do wyblakłej).
// Żeby zdjąć też podmianę na stronie, jest osobny przycisk Reset (↺).
const ruleRemoveBtn = document.getElementById("wfs-rule-remove");
if (ruleRemoveBtn) {
  ruleRemoveBtn.addEventListener("click", () => {
    rulesData = rulesData.filter((x) => x.pattern !== activeRulePattern);
    chrome.storage.local.set({ [RULES_KEY]: rulesData });
    const bar = document.getElementById("wfs-rulebar");
    if (bar) bar.hidden = true;
    activeRulePattern = null;
    appliedFromRule = false;
    renderPresets(); // kropka → wyblakła (preset nadal aktywny)
  });
}
const resetTop = document.getElementById("wfs-reset-top");
if (resetTop) resetTop.addEventListener("click", resetPage);

// Zakładki snippetu.
document.querySelectorAll(".wfs-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".wfs-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentTab = tab.dataset.tab;
    updateSnippet();
  });
});

// Modal „Czy masz licencję?" — onYes/onNo wołamy BEZPOŚREDNIO w handlerze kliknięcia,
// żeby kopiowanie po „Tak" zachowało gest użytkownika (inaczej schowek pada przez await).
function askLicenseConfirm(names, onYes, onNo) {
  const overlay = document.createElement("div");
  overlay.className = "wfs-modal-overlay";
  const box = document.createElement("div");
  box.className = "wfs-modal";
  const msg = document.createElement("div");
  msg.className = "wfs-modal-msg";
  msg.textContent = t("license_confirm").replace("%s", names.join(", "));
  const row = document.createElement("div");
  row.className = "wfs-modal-actions";
  // „Szukaj fonta" — link (afiliacyjny, gdy ustawiony) do strony, gdzie można
  // zdobyć/zlicencjonować ten font. Po lewej, obok „Nie". Nie zamyka modala.
  const search = document.createElement("button");
  search.className = "wfs-modal-btn wfs-modal-search";
  search.textContent = t("search_font_btn");
  const meta = window.WOLFIE_FONT_META;
  const lurl = meta && meta.licenseSearchUrl ? meta.licenseSearchUrl(names[0]) : null;
  if (lurl) {
    search.addEventListener("click", () => window.open(lurl, "_blank", "noopener"));
  } else {
    search.style.display = "none";
  }
  const no = document.createElement("button");
  no.className = "wfs-modal-btn wfs-modal-no";
  no.textContent = t("answer_no");
  const yes = document.createElement("button");
  yes.className = "wfs-modal-btn wfs-modal-yes";
  yes.textContent = t("answer_yes");
  const close = () => overlay.remove();
  no.addEventListener("click", () => { close(); if (onNo) onNo(); });
  yes.addEventListener("click", () => { close(); if (onYes) onYes(); });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) { close(); if (onNo) onNo(); }
  });
  row.append(search, no, yes);
  box.append(msg, row);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  yes.focus();
}

// Kopiowanie do schowka: Async Clipboard API, a gdy padnie (np. utracona aktywacja
// w iframe) — fallback przez ukryty textarea + execCommand('copy').
function execCommandCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => execCommandCopy(text)
    );
  }
  return Promise.resolve(execCommandCopy(text));
}
async function runCopy(code, btn) {
  const ok = await copyToClipboard(code);
  if (ok) {
    btn.classList.add("copied");
    btn.textContent = t("copied_btn");
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = t("copy_btn");
    }, 1500);
  } else {
    setStatus(t("status_copy_fail"));
  }
}

// Klik „Kopiuj": dla fontów premium najpierw pytanie o licencję; samo kopiowanie
// wykonuje się W GEŚCIE kliknięcia (Kopiuj albo Tak), więc schowek nie pada.
document.getElementById("wfs-copy").addEventListener("click", () => {
  const code = document.getElementById("wfs-code").textContent;
  const btn = document.getElementById("wfs-copy");
  const gated = selectedNeedsFontFace();
  if (gated.length) {
    askLicenseConfirm(
      gated,
      () => runCopy(code, btn),
      () => setStatus(t("license_needed"))
    );
    return;
  }
  runCopy(code, btn);
});

(async () => {
  const tab0 = await getActiveTab();
  currentHost = hostOf((tab0 && tab0.url) || "");
  currentUrl = (tab0 && tab0.url) || "";
  let sessionMap = {};
  try {
    sessionMap = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY] || {};
  } catch (e) {}

  chrome.storage.local.get(
    [STORAGE_KEY, PERSIST_KEY, RULES_KEY, PRESETS_KEY, "wfs_custom_fonts", "wfs_favorites", "wfs_font_cache", "wfs_picked", "wfs_pending_target"],
    (data) => {
    // Trwały cache fontów Google.
    if (data.wfs_font_cache && data.wfs_font_cache.map) {
      fontCacheMap = data.wfs_font_cache.map;
      fontCacheOrder = Array.isArray(data.wfs_font_cache.order)
        ? data.wfs_font_cache.order
        : Object.keys(fontCacheMap);
    }
    // Ulubione (przypinane na górze listy).
    if (Array.isArray(data.wfs_favorites)) favorites = data.wfs_favorites;
    // Wczytaj zapisane customowe fonty (z poprzednich sesji).
    if (data.wfs_custom_fonts && typeof data.wfs_custom_fonts === "object") {
      Object.assign(customFonts, data.wfs_custom_fonts);
      addCustomFontsToList();
    }

    // 1) Wybierz konfig dla tej domeny: sesja -> trwały -> reguła(preset) -> legacy.
    const persistMap = data[PERSIST_KEY] || {};
    rulesData = data[RULES_KEY] || [];
    presetsData = Array.isArray(data[PRESETS_KEY]) ? data[PRESETS_KEY] : [];
    let saved = sessionMap[currentHost] || persistMap[currentHost] || null;
    let ruleMatched = null;
    if (!saved) {
      const r = matchRule(rulesData, (tab0 && tab0.url) || "", currentHost);
      if (r) {
        const ps = presetsData.find((p) => p.name === r.preset);
        if (ps) {
          saved = ps.selection;
          ruleMatched = r;
        }
      }
    }
    if (!saved && data[STORAGE_KEY]) saved = data[STORAGE_KEY]; // migracja starego globalnego
    if (saved) {
      document.querySelectorAll(".wfs-combo").forEach((combo) => {
        combo.restore(saved[combo.dataset.target]);
      });
    }

    // 2) Konsumuj font pobrany pickerem (PO restore, by go nie nadpisać).
    const picked = data.wfs_picked;
    if (picked && picked.family) {
      chrome.storage.local.remove(["wfs_picked", "wfs_pending_target"]);
      const fam = picked.family;
      // Zapisz przechwycony @font-face (custom font) trwale.
      if (picked.fontface) {
        customFonts[fam.toLowerCase()] = {
          name: fam,
          css: picked.fontface,
          source: picked.source || "web",
        };
        chrome.storage.local.set({ wfs_custom_fonts: customFonts });
        addCustomFontsToList();
      }
      const target = data.wfs_pending_target || lastFocusedTarget;
      if (target && selection[target]) {
        const combo = document.querySelector('.wfs-combo[data-target="' + target + '"]');
        if (combo && combo.restore) {
          combo.restore({ ...selection[target], family: fam });
        }
      }
      const meta = window.WOLFIE_FONT_META
        ? window.WOLFIE_FONT_META.classify(fam)
        : { license: "unknown" };
      const licLabel =
        meta.license === "open"
          ? t("lic_open")
          : meta.license === "commercial"
          ? t("lic_commercial")
          : t("lic_unknown");
      setStatus(t("pick_applied") + " " + fam + " (" + licLabel + ")");
    }

    // 3) Zastosuj na aktywnej karcie (jeśli cokolwiek ustawione).
    // Czerwona kropka tylko gdy konfig pochodzi z reguły i użytkownik nic
    // ręcznie nie podmienił (pobranie pickerem liczy się jako ręczna zmiana).
    appliedFromRule = !!ruleMatched && !(picked && picked.family);
    if (saved || (picked && picked.family)) applyToPage();
    updateSnippet();
    if (ruleMatched) {
      setupRuleBar(ruleMatched); // pasek reguły (usuń)
      // Podświetl też chip presetu używanego przez regułę (po applyToPage,
      // które czyści oznaczenie). renderPresets odświeży listę, gdy presety wczytane.
      activePresetName = ruleMatched.preset;
      renderPresets();
    }
    }
  );
})();

// ---- Presety (max 5, trwałe między sesjami; niezależne od resetu stylów) ----

const PRESETS_KEY = "wfs_presets";
const MAX_PRESETS = 5;
let presets = [];
let pendingPresetDelete = null; // nazwa presetu czekającego na 2. klik (gdy ma regułę)

// Reguły domen używające danego presetu (po nazwie).
function rulesUsingPreset(name) {
  return (rulesData || []).filter((r) => r && r.preset === name);
}

function persistPresets() {
  chrome.storage.local.set({ [PRESETS_KEY]: presets });
}

// Domyślna nazwa presetu = dwa pierwsze ustawione fonty (np. "Audiowide+Rubik").
function presetBaseName() {
  const fams = ["base", "headings", "paragraphs", "navigation", "buttons"]
    .map((k) => selection[k] && selection[k].family)
    .filter(Boolean);
  return fams.slice(0, 2).join("+") || "Preset";
}
function nextPresetName() {
  const base = presetBaseName();
  const used = new Set(presets.map((p) => p.name));
  if (!used.has(base)) return base;
  for (let n = 2; n <= 99; n++) {
    const nm = base + " " + n; // taka kombinacja już jest -> dopisz liczbę
    if (!used.has(nm)) return nm;
  }
  return base + " " + (presets.length + 1);
}

function renderPresets() {
  const list = document.getElementById("wfs-preset-list");
  const saveBtn = document.getElementById("wfs-save-preset");
  list.innerHTML = "";
  if (!presets.length) {
    const empty = document.createElement("span");
    empty.className = "wfs-preset-empty";
    empty.textContent = t("preset_empty");
    list.appendChild(empty);
  }
  presets.forEach((preset, i) => {
    const chip = document.createElement("div");
    chip.className = "wfs-preset";
    if (activePresetName === preset.name) chip.classList.add("active");
    const name = document.createElement("button");
    name.type = "button";
    name.className = "wfs-preset-name";
    name.textContent = preset.name;
    name.title = t("preset_load_title");
    name.addEventListener("click", () => {
      // Ponowny klik w aktywny preset = reset (usuń podmianę). Inaczej zastosuj.
      if (activePresetName === preset.name) resetPage();
      else applyPreset(preset);
    });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "wfs-preset-del";
    del.textContent = "✕";
    del.title = t("preset_delete_title");
    // Preset przypięty do reguły domeny — oznacz i uzbrój podwójne potwierdzenie.
    if (rulesUsingPreset(preset.name).length) {
      del.classList.add("linked");
      if (pendingPresetDelete === preset.name) del.classList.add("confirm");
    }
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      deletePreset(i);
    });
    chip.append(name, del);
    list.appendChild(chip);
  });
  const full = presets.length >= MAX_PRESETS;
  saveBtn.disabled = full;
  saveBtn.textContent = full ? t("preset_max") : t("preset_save");
  // Czerwona kropka „zapisz regułę": widoczna gdy jakiś preset jest aktywny.
  // Wyblakła+mała domyślnie; jaskrawa gdy dla tej strony ISTNIEJE reguła.
  const ruleDot = document.getElementById("wfs-preset-rule-dot");
  if (ruleDot) {
    ruleDot.hidden = !activePresetName;
    const ruleActive = !!matchRule(rulesData, currentUrl, currentHost);
    ruleDot.classList.toggle("active", ruleActive);
  }
}

function savePreset() {
  if (presets.length >= MAX_PRESETS) {
    setStatus(t("status_preset_max"));
    return;
  }
  if (!Object.values(selection).some(hasProps)) {
    setStatus(t("status_need_setting"));
    return;
  }
  presets.push({
    name: nextPresetName(),
    selection: JSON.parse(JSON.stringify(selection)),
  });
  persistPresets();
  renderPresets();
  setStatus(t("status_preset_saved"));
}

function deletePreset(i) {
  const preset = presets[i];
  if (!preset) return;
  const linked = rulesUsingPreset(preset.name);
  // Preset użyty w regule domeny: pierwszy klik tylko ostrzega (podwójne
  // potwierdzenie). Dopiero drugi klik usuwa preset RAZEM z regułą.
  if (linked.length && pendingPresetDelete !== preset.name) {
    pendingPresetDelete = preset.name;
    const patterns = linked.map((r) => r.pattern || "*").join(", ");
    setStatus(
      t("preset_del_rule_confirm").replace("%p", preset.name).replace("%r", patterns)
    );
    renderPresets(); // podświetl ✕ w stanie potwierdzenia
    return;
  }
  // Usuń też powiązane reguły (potwierdzone) i zapisz.
  let resetThisPage = false;
  if (linked.length) {
    // Czy bieżąca strona była stylowana TĄ regułą? Jeśli tak — zdejmiemy też
    // wstrzyknięty styl (reguła znika, więc i jej podmiana ma zniknąć).
    resetThisPage =
      appliedFromRule && linked.some((r) => r.pattern === activeRulePattern);
    rulesData = rulesData.filter((r) => !(r && r.preset === preset.name));
    chrome.storage.local.set({ [RULES_KEY]: rulesData });
  }
  presets.splice(i, 1);
  pendingPresetDelete = null;
  persistPresets();
  renderPresets();
  if (resetThisPage) {
    const bar = document.getElementById("wfs-rulebar");
    if (bar) bar.hidden = true;
    activeRulePattern = null;
    appliedFromRule = false;
    resetPage(); // usuwa wstrzyknięty styl + konfig sesji + gasi kropkę
  } else {
    setStatus(t("status_preset_deleted"));
  }
}

function applyPreset(preset) {
  appliedFromRule = false; // ręczne wczytanie presetu → konfig sesji (zielona kropka)
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.restore(preset.selection[combo.dataset.target]);
  });
  applyToPage();
  activePresetName = preset.name; // oznacz chip jako aktywny (ponowny klik = reset)
  renderPresets();
  setStatus(t("status_preset_loaded") + " " + preset.name);
}

document.getElementById("wfs-save-preset").addEventListener("click", savePreset);

// Czerwona kropka przy „Presety" = przełącznik PERSISTANT reguły dla tej strony.
// Wyblakła (brak reguły) + klik → utwórz regułę (apex → aktywny preset) = jaskrawa.
// Jaskrawa (reguła jest) + klik → usuń regułę = wyblakła. Preset zostaje aktywny,
// fonty na stronie nie znikają.
async function toggleRuleForActivePreset() {
  if (!activePresetName) return;
  const tab = await getActiveTab();
  const host = hostOf((tab && tab.url) || "") || currentHost;
  const url = (tab && tab.url) || currentUrl;
  const existing = matchRule(rulesData, url, host);
  if (existing) {
    // Reguła istnieje dla tej strony → usuń (toggle off).
    rulesData = rulesData.filter((r) => r !== existing);
    chrome.storage.local.set({ [RULES_KEY]: rulesData });
    if (activeRulePattern === existing.pattern) {
      const bar = document.getElementById("wfs-rulebar");
      if (bar) bar.hidden = true;
      activeRulePattern = null;
      appliedFromRule = false;
    }
    renderPresets(); // kropka → wyblakła
    setStatus(t("preset_rule_removed") + " " + (existing.pattern || ""));
    return;
  }
  // Brak reguły → utwórz dla AKTUALNEGO hosta (obejmie bieżącą stronę, także
  // subdomenę, np. "en.wikipedia.org"). Smart-match dołoży alias www + podstrony.
  if (!host) {
    setStatus(t("status_no_tab"));
    return;
  }
  const key = bareDomainOf(host) || host.toLowerCase();
  const i = rulesData.findIndex((r) => r && (bareDomainOf(r.pattern) || "") === key);
  if (i >= 0) rulesData[i].preset = activePresetName;
  else rulesData.push({ pattern: host, preset: activePresetName });
  chrome.storage.local.set({ [RULES_KEY]: rulesData });
  renderPresets(); // kropka → jaskrawa
  setStatus(t("preset_rule_saved") + " " + host + " → " + activePresetName);
}
const presetRuleDot = document.getElementById("wfs-preset-rule-dot");
if (presetRuleDot) presetRuleDot.addEventListener("click", toggleRuleForActivePreset);

chrome.storage.local.get([PRESETS_KEY, RULES_KEY], (data) => {
  presets = Array.isArray(data[PRESETS_KEY]) ? data[PRESETS_KEY] : [];
  // Świeże reguły, by oznaczyć presety przypięte do reguł domen (kłódka/✕).
  if (Array.isArray(data[RULES_KEY])) rulesData = data[RULES_KEY];
  renderPresets();
});

// ---- Przypięty pasek: aktualny wybór GŁÓWNEGO pickera + 3 kontrolki ----
// (kopiuj styl CSS / dodaj do moich fontów / usuń pick z biblioteki)
let stylePickData = null;

function fontInLibrary(name) {
  return !!name && ALL_FONTS.some((f) => f.name.toLowerCase() === name.toLowerCase());
}

function renderStylePick(pick) {
  stylePickData = pick && pick.family ? pick : null;
  const bar = document.getElementById("wfs-stylepick");
  const nameEl = document.getElementById("wfs-stylepick-name");
  const addBtn = document.getElementById("wfs-stylepick-add");
  if (!bar || !nameEl) return;
  if (!stylePickData) {
    bar.hidden = true;
    return;
  }
  nameEl.textContent = stylePickData.family;
  nameEl.title = stylePickData.family;
  if (addBtn) {
    const have = fontInLibrary(stylePickData.family); // już w bibliotece → blokuj „dodaj"
    addBtn.disabled = have;
    addBtn.style.opacity = have ? ".4" : "";
    addBtn.style.cursor = have ? "default" : "pointer";
    addBtn.title = have ? t("stylepick_exists") : t("stylepick_add");
  }
  bar.hidden = false;
}

(function setupStylePickBar() {
  const copyBtn = document.getElementById("wfs-stylepick-copy");
  const addBtn = document.getElementById("wfs-stylepick-add");
  const delBtn = document.getElementById("wfs-stylepick-del");

  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      if (!stylePickData || !stylePickData.css) return;
      try {
        await navigator.clipboard.writeText(stylePickData.css);
        setStatus(t("pick_style_copied") + " „" + stylePickData.family + "”");
      } catch (e) {
        setStatus(t("status_copy_fail"));
      }
    });

  if (addBtn)
    addBtn.addEventListener("click", () => {
      if (!stylePickData || !stylePickData.family) return;
      if (fontInLibrary(stylePickData.family)) {
        setStatus(t("stylepick_exists"));
        return;
      }
      const fam = stylePickData.family;
      customFonts[fam.toLowerCase()] = {
        name: fam,
        css: stylePickData.fontface || "",
        source: stylePickData.source || "web",
      };
      try {
        chrome.storage.local.set({ wfs_custom_fonts: customFonts });
      } catch (e) {}
      addCustomFontsToList();
      renderStylePick(stylePickData); // odśwież stan przycisku (teraz w bibliotece)
      setStatus(t("stylepick_added") + " " + fam);
    });

  if (delBtn)
    delBtn.addEventListener("click", () => {
      const fam = stylePickData && stylePickData.family;
      if (fam) {
        const key = fam.toLowerCase();
        if (customFonts[key]) {
          delete customFonts[key];
          try {
            chrome.storage.local.set({ wfs_custom_fonts: customFonts });
          } catch (e) {}
          const idx = ALL_FONTS.findIndex(
            (f) => f.type === "custom" && f.name.toLowerCase() === key
          );
          if (idx >= 0) ALL_FONTS.splice(idx, 1);
        }
      }
      try {
        chrome.storage.local.remove("wfs_style_pick");
      } catch (e) {}
      renderStylePick(null);
      if (fam) setStatus(t("stylepick_removed") + " „" + fam + "”");
    });

  // Wczytaj istniejący pick i reaguj na nowe (panel zostaje otwarty po pickerze).
  chrome.storage.local.get("wfs_style_pick", (data) => {
    if (data && data.wfs_style_pick) renderStylePick(data.wfs_style_pick);
  });
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.wfs_style_pick) {
        renderStylePick(changes.wfs_style_pick.newValue || null);
      }
    });
  } catch (e) {}
})();
