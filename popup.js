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

const ALL_FONTS = [...popularEntries, ...restEntries];

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
async function loadLocalFonts() {
  if (localFontsLoaded || typeof window.queryLocalFonts !== "function") return false;
  localFontsLoaded = true;
  try {
    const fonts = await window.queryLocalFonts();
    const have = new Set(ALL_FONTS.map((f) => f.name.toLowerCase()));
    const added = [];
    for (const fam of new Set(fonts.map((f) => f.family))) {
      if (fam && !have.has(fam.toLowerCase())) {
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

const STORAGE_KEY = "wfs_state";
const statusEl = document.getElementById("wfs-status");

// Aktualne ustawienia dla każdego targetu: rodzina + chipy.
function emptyProps() {
  return { family: null, weight: null, spacing: null, size: null, case: null };
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

function hasProps(p) {
  return !!(p && (p.family || p.weight || p.spacing || p.size || p.case));
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
    options: [
      { label: "S", value: "14px" },
      { label: "M", value: "18px" },
      { label: "L", value: "24px" },
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

function applyFontsInPage(state) {
  // Same pliki fontów Google wstrzykuje rozszerzenie przez insertCSS
  // (omija CSP strony). Tutaj ustawiamy już tylko reguły font-family.
  const STYLE_ID = "wolfie-font-swapper-style";

  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;
  const q = (f) => (generic.test(f) ? f : '"' + f + '"');
  const has = (p) =>
    p && (p.family || p.weight || p.spacing || p.size || p.case);
  const decl = (p) => {
    const d = [];
    if (p.family) d.push("font-family: " + q(p.family) + " !important");
    if (p.weight) d.push("font-weight: " + p.weight + " !important");
    if (p.spacing) d.push("letter-spacing: " + p.spacing + " !important");
    if (p.size) d.push("font-size: " + p.size + " !important");
    if (p.case) d.push("text-transform: " + p.case + " !important");
    return d.join("; ");
  };

  const rules = [];
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
    rules.push("p, p * { " + decl(state.paragraphs) + " }");
  }
  if (has(state.navigation)) {
    // Częste wzorce nawigacji: semantyczny <nav>, role, oraz typowe klasy/id
    // i menu w nagłówku. Każdy wzorzec łapie też swoich potomków (" *").
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
  async function onClick(e) {
    if (!current) return;
    e.preventDefault();
    e.stopPropagation();
    const fam = firstFamily(current);
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

// Pobierz CSS @font-face z Google i osadź pliki woff2 jako data:-URL.
async function fetchGoogleFontFaceCSS(family) {
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
  return css;
}

// Upewnij się, że wszystkie wybrane fonty Google są fizycznie załadowane w karcie.
async function ensureGoogleFontsLoaded(tabId) {
  const families = [
    ...new Set(
      Object.values(selection)
        .map((p) => p.family)
        .filter((f) => f && isGoogle(f))
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
async function ensureCustomFontsLoaded(tabId) {
  const families = [
    ...new Set(Object.values(selection).map((p) => p.family).filter(Boolean)),
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

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function applyToPage() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus(t("status_no_tab"));
    return;
  }

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
    // 2) Ustaw reguły font-family na stronie.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyFontsInPage,
      args: [{ ...selection }],
    });
    chrome.storage.local.set({ [STORAGE_KEY]: selection });
    const names = Object.values(selection)
      .map((p) => p.family)
      .filter(Boolean);
    const anyActive = Object.values(selection).some(hasProps);
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

async function resetPage() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: resetFontsInPage,
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
  chrome.storage.local.remove(STORAGE_KEY);
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.classList.remove("has-value");
    const input = combo.querySelector(".wfs-search");
    input.value = "";
    input.classList.remove("wfs-selected");
  });
  document
    .querySelectorAll(".wfs-chip.active")
    .forEach((chip) => chip.classList.remove("active"));
  setStatus(t("status_reset"));
  updateSnippet();
}

// ---- Generowanie snippetów (CSS / SCSS / JS) ----

const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;

function familyValue(font) {
  // Dodaj rozsądny fallback w zależności od typu fontu.
  if (generic.test(font)) return font;
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
  { sel: "p", key: "paragraphs", scssVar: "$font-paragraph" },
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
  if (p.case) d.push(pad + "text-transform: " + p.case + ";");
  return d;
}

function buildCSS() {
  const lines = [];
  const googles = selectedGoogleFonts();
  googles.forEach((g) => lines.push("@import url('" + googleImportUrl(g) + "');"));
  if (googles.length) lines.push("");
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
  if (googles.length) lines.push("");
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
    lines.push("// Wczytaj font Google: " + g);
    lines.push("(() => {");
    lines.push("  const link = document.createElement('link');");
    lines.push("  link.rel = 'stylesheet';");
    lines.push("  link.href = '" + googleImportUrl(g) + "';");
    lines.push("  document.head.appendChild(link);");
    lines.push("})();");
    lines.push("");
  });
  const css = [];
  for (const b of SNIPPET_BLOCKS) {
    const p = selection[b.key];
    if (!hasProps(p)) continue;
    css.push(b.sel + " { " + declList(p, familyValue(p.family)).join(" ") + " }");
  }
  if (css.length) {
    lines.push("// Zastosuj ustawienia typografii");
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

  // Badge PAID + przycisk „Kup font" dla fontów komercyjnych.
  const buy = document.getElementById("wfs-buy");
  const paid = document.getElementById("wfs-paid");
  let buyUrl = null;
  let isCommercial = false;
  const meta = window.WOLFIE_FONT_META;
  if (meta) {
    for (const p of Object.values(selection)) {
      if (!p.family) continue;
      const c = meta.classify(p.family);
      if (c.license === "commercial") {
        isCommercial = true;
        if (c.buyUrl && !buyUrl) buyUrl = c.buyUrl;
      }
    }
  }
  if (paid) paid.hidden = !isCommercial;
  if (buy) {
    if (buyUrl) {
      buy.href = buyUrl;
      buy.hidden = false;
    } else {
      buy.hidden = true;
    }
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

  // Stopka informująca o doładowywaniu / liczbie pozostałych wyników.
  let footer = null;

  function makeItem(font, i) {
    const li = document.createElement("li");
    li.dataset.index = i;
    const name = document.createElement("span");
    name.className = "wfs-name";
    name.textContent = font.name;
    const tag = document.createElement("span");
    tag.className = "wfs-tag";
    if (font.type === "custom") {
      tag.classList.add("wfs-tag-custom");
      tag.textContent = font.source === "google" ? "★ Google" : "Custom";
    } else if (font.popular) {
      tag.classList.add("wfs-tag-pop");
      tag.textContent = "★ Google";
    } else {
      tag.textContent = font.type === "google" ? "Google" : "System";
    }
    li.append(name, tag);
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      choose(font.name);
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
    const li = document.createElement("li");
    li.className = "wfs-empty";
    li.textContent = t("search_loading");
    list.appendChild(li);
    list.hidden = false;
  }

  // Pełne, świeże wyrenderowanie wyników dla danej frazy.
  function render(filter) {
    const term = (filter || "").trim().toLowerCase();
    filtered = term
      ? ALL_FONTS.filter((f) => f.name.toLowerCase().includes(term))
      : ALL_FONTS;

    activeIndex = -1;
    shownCount = 0;
    rendered = [];
    list.innerHTML = "";
    footer = null;

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
  }

  function choose(name) {
    selection[target].family = name;
    input.value = name;
    input.classList.add("wfs-selected");
    combo.classList.add("has-value");
    list.hidden = true;
    applyToPage();
  }

  function clearSelection() {
    selection[target].family = null;
    input.value = "";
    input.classList.remove("wfs-selected");
    combo.classList.remove("has-value");
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
      group.options.forEach((opt) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "wfs-chip";
        chip.textContent = opt.label;
        chip.dataset.key = group.key;
        chip.dataset.value = opt.value;
        chip.title = group.label + ": " + opt.label;
        chip.addEventListener("click", () => {
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

  // Zamknij listę po kliknięciu poza nią.
  document.addEventListener("click", (e) => {
    if (!combo.contains(e.target)) list.hidden = true;
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
    window.close(); // zamknij popup, by wskazać element na stronie
  } catch (e) {
    setStatus(t("status_protected"));
  }
}

const pickerBtn = document.getElementById("wfs-picker");
if (pickerBtn)
  pickerBtn.addEventListener("click", () => startPicker(lastFocusedTarget));

document.querySelectorAll(".wfs-combo").forEach(buildCombo);
document.getElementById("wfs-reset").addEventListener("click", resetPage);

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

// Kopiowanie snippetu do schowka.
document.getElementById("wfs-copy").addEventListener("click", async () => {
  const code = document.getElementById("wfs-code").textContent;
  const btn = document.getElementById("wfs-copy");
  try {
    await navigator.clipboard.writeText(code);
    btn.classList.add("copied");
    btn.textContent = t("copied_btn");
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = t("copy_btn");
    }, 1500);
  } catch (e) {
    setStatus(t("status_copy_fail"));
  }
});

chrome.storage.local.get(
  [STORAGE_KEY, "wfs_custom_fonts", "wfs_picked", "wfs_pending_target"],
  (data) => {
    // Wczytaj zapisane customowe fonty (z poprzednich sesji).
    if (data.wfs_custom_fonts && typeof data.wfs_custom_fonts === "object") {
      Object.assign(customFonts, data.wfs_custom_fonts);
      addCustomFontsToList();
    }

    // 1) Przywróć zapisany wybór.
    const saved = data[STORAGE_KEY];
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
    if (saved || (picked && picked.family)) applyToPage();
    updateSnippet();
  }
);

// ---- Presety (max 5, trwałe między sesjami; niezależne od resetu stylów) ----

const PRESETS_KEY = "wfs_presets";
const MAX_PRESETS = 5;
let presets = [];

function persistPresets() {
  chrome.storage.local.set({ [PRESETS_KEY]: presets });
}

function nextPresetName() {
  const used = new Set(presets.map((p) => p.name));
  for (let n = 1; n <= MAX_PRESETS; n++) {
    const nm = "Preset " + n;
    if (!used.has(nm)) return nm;
  }
  return "Preset";
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
    const name = document.createElement("button");
    name.type = "button";
    name.className = "wfs-preset-name";
    name.textContent = preset.name;
    name.title = t("preset_load_title");
    name.addEventListener("click", () => applyPreset(preset));
    const del = document.createElement("button");
    del.type = "button";
    del.className = "wfs-preset-del";
    del.textContent = "✕";
    del.title = t("preset_delete_title");
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
  presets.splice(i, 1);
  persistPresets();
  renderPresets();
  setStatus(t("status_preset_deleted"));
}

function applyPreset(preset) {
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.restore(preset.selection[combo.dataset.target]);
  });
  applyToPage();
  setStatus(t("status_preset_loaded") + " " + preset.name);
}

document.getElementById("wfs-save-preset").addEventListener("click", savePreset);

chrome.storage.local.get(PRESETS_KEY, (data) => {
  presets = Array.isArray(data[PRESETS_KEY]) ? data[PRESETS_KEY] : [];
  renderPresets();
});
