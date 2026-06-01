"use strict";

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

function hasProps(p) {
  return !!(p && (p.family || p.weight || p.spacing || p.size || p.case));
}

// Predefiniowane chipy pod każdym dropdownem (po 3 opcje, opcjonalne — klik
// ponownie czyści). Wartości to gotowe wartości CSS.
const CHIP_GROUPS = [
  {
    key: "weight",
    label: "Grubość",
    options: [
      { label: "Light", value: "300" },
      { label: "Regular", value: "400" },
      { label: "Bold", value: "700" },
      { label: "Extra Bold", value: "800" },
    ],
  },
  {
    key: "spacing",
    label: "Odstęp",
    options: [
      { label: "Ciasno", value: "-0.5px" },
      { label: "0", value: "normal" },
      { label: "Luźno", value: "1.5px" },
    ],
  },
  {
    key: "size",
    label: "Rozmiar",
    options: [
      { label: "S", value: "14px" },
      { label: "M", value: "18px" },
      { label: "L", value: "24px" },
    ],
  },
  {
    key: "case",
    label: "Wielkość liter",
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

// ---- Ładowanie fontów Google z pominięciem CSP strony ----
//
// Strony często blokują przez CSP zewnętrzne fonty (fonts.googleapis.com /
// gstatic.com), więc samo dopisanie <link> nie ładuje pliku. Dlatego pobieramy
// CSS i pliki fontów po stronie rozszerzenia (ma uprawnienia sieciowe),
// zamieniamy adresy plików na data:-URL i wstrzykujemy przez insertCSS —
// taki arkusz pochodzi z rozszerzenia i nie podlega CSP strony.

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

// ---- Komunikacja z aktywną kartą ----

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function applyToPage() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    setStatus("⚠ Brak aktywnej karty.");
    return;
  }

  const url = tab.url || "";
  if (/^file:/i.test(url)) {
    setStatus(
      "⚠ Strony file:// wymagają włączenia „Zezwalaj na dostęp do adresów URL plików” w szczegółach dodatku."
    );
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
    setStatus(
      "⚠ Ta karta jest chroniona przez przeglądarkę — otwórz zwykłą stronę (np. wikipedia.org) i spróbuj ponownie."
    );
    return;
  }

  try {
    // 1) Fizycznie załaduj pliki fontów Google (insertCSS, omija CSP).
    try {
      await ensureGoogleFontsLoaded(tab.id);
    } catch (e) {
      setStatus("⚠ Nie udało się pobrać fontu Google: " + (e && e.message ? e.message : e));
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
      setStatus("✓ Zastosowano" + (names.length ? ": " + names.join(", ") : ""));
    } else {
      setStatus("");
    }
    updateSnippet();
  } catch (e) {
    setStatus("✕ Błąd: " + (e && e.message ? e.message : String(e)));
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
  setStatus("Zresetowano — usunięto wstrzyknięty styl.");
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
    if (font.popular) {
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
      footer.textContent = "▼ przewiń, by wczytać więcej (" + remaining + ")";
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
    li.textContent = "Szukam…";
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
      li.textContent = "Brak wyników";
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

  // Zamknij listę po kliknięciu poza nią.
  document.addEventListener("click", (e) => {
    if (!combo.contains(e.target)) list.hidden = true;
  });

  // Przywrócenie zapamiętanego wyboru (rodzina + chipy).
  combo.restore = (saved) => {
    if (!saved) return;
    selection[target] = { ...emptyProps(), ...saved };
    const p = selection[target];
    if (p.family) {
      input.value = p.family;
      input.classList.add("wfs-selected");
      combo.classList.add("has-value");
    }
    if (chipsBox) {
      chipsBox.querySelectorAll(".wfs-chip").forEach((chip) => {
        chip.classList.toggle("active", p[chip.dataset.key] === chip.dataset.value);
      });
    }
  };
}

// ---- Init ----

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
    btn.textContent = "✓ Skopiowano";
    setTimeout(() => {
      btn.classList.remove("copied");
      btn.textContent = "⧉ Kopiuj";
    }, 1500);
  } catch (e) {
    setStatus("Nie udało się skopiować.");
  }
});

chrome.storage.local.get(STORAGE_KEY, (data) => {
  const saved = data[STORAGE_KEY];
  if (!saved) return;
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.restore(saved[combo.dataset.target]);
  });
  // Ponownie zastosuj na aktywnej karcie (np. po przeładowaniu strony).
  applyToPage();
  updateSnippet();
});
