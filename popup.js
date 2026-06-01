"use strict";

const { SYSTEM_FONTS, GOOGLE_FONTS } = window.WOLFIE_FONTS;

// Połączona, posortowana lista fontów z oznaczeniem źródła.
const ALL_FONTS = [
  ...SYSTEM_FONTS.map((name) => ({ name, type: "system" })),
  ...GOOGLE_FONTS.map((name) => ({ name, type: "google" })),
].sort((a, b) => a.name.localeCompare(b.name));

const STORAGE_KEY = "wfs_state";
const statusEl = document.getElementById("wfs-status");

// Aktualnie wybrane fonty dla każdego targetu.
const selection = { base: null, headings: null, paragraphs: null };

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function isGoogle(fontName) {
  return GOOGLE_FONTS.includes(fontName);
}

// ---- Wstrzykiwane do strony (działa w kontekście karty) ----

function applyFontsInPage(state) {
  const STYLE_ID = "wolfie-font-swapper-style";
  const LINK_PREFIX = "wolfie-font-swapper-link-";

  // Wczytaj potrzebne fonty Google.
  (state.googleToLoad || []).forEach((fam) => {
    const id = LINK_PREFIX + fam.replace(/\s+/g, "-");
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=" +
        encodeURIComponent(fam).replace(/%20/g, "+") +
        ":ital,wght@0,400;0,500;0,700;1,400&display=swap";
      (document.head || document.documentElement).appendChild(link);
    }
  });

  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;
  const q = (f) => (generic.test(f) ? f : '"' + f + '"');

  const rules = [];
  if (state.base) {
    // Cała strona, ale pomijamy elementy ikon, by nie psuć fontów ikonowych.
    rules.push(
      '*:not(i):not([class*="icon"]):not([class*="Icon"]):not([class*="material-"]) { font-family: ' +
        q(state.base) +
        " !important; }"
    );
  }
  if (state.headings) {
    rules.push(
      "h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 * { font-family: " +
        q(state.headings) +
        " !important; }"
    );
  }
  if (state.paragraphs) {
    rules.push(
      "p, p * { font-family: " + q(state.paragraphs) + " !important; }"
    );
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

// ---- Komunikacja z aktywną kartą ----

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function applyToPage() {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;

  const googleToLoad = Object.values(selection)
    .filter((f) => f && isGoogle(f));

  const state = { ...selection, googleToLoad };

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: applyFontsInPage,
      args: [state],
    });
    chrome.storage.local.set({ [STORAGE_KEY]: selection });
    const active = Object.entries(selection)
      .filter(([, v]) => v)
      .map(([k, v]) => v);
    setStatus(active.length ? "Zastosowano: " + active.join(", ") : "");
    updateSnippet();
  } catch (e) {
    setStatus("Nie można zmienić fontów na tej stronie.");
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
  } catch (e) {
    /* strona chroniona — ignorujemy */
  }
  selection.base = selection.headings = selection.paragraphs = null;
  chrome.storage.local.remove(STORAGE_KEY);
  document.querySelectorAll(".wfs-combo").forEach((combo) => {
    combo.classList.remove("has-value");
    const input = combo.querySelector(".wfs-search");
    input.value = "";
    input.classList.remove("wfs-selected");
  });
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
    ":ital,wght@0,400;0,500;0,700;1,400&display=swap"
  );
}

function selectedGoogleFonts() {
  return [...new Set(Object.values(selection).filter((f) => f && isGoogle(f)))];
}

function buildCSS() {
  const lines = [];
  const googles = selectedGoogleFonts();
  googles.forEach((g) => lines.push("@import url('" + googleImportUrl(g) + "');"));
  if (googles.length) lines.push("");
  if (selection.base)
    lines.push("body, * {\n  font-family: " + familyValue(selection.base) + ";\n}");
  if (selection.headings)
    lines.push(
      "h1, h2, h3, h4, h5, h6 {\n  font-family: " +
        familyValue(selection.headings) +
        ";\n}"
    );
  if (selection.paragraphs)
    lines.push("p {\n  font-family: " + familyValue(selection.paragraphs) + ";\n}");
  return lines.join("\n");
}

function buildSCSS() {
  const lines = [];
  const googles = selectedGoogleFonts();
  googles.forEach((g) => lines.push("@import url('" + googleImportUrl(g) + "');"));
  if (googles.length) lines.push("");
  if (selection.base) lines.push("$font-base: " + familyValue(selection.base) + ";");
  if (selection.headings)
    lines.push("$font-heading: " + familyValue(selection.headings) + ";");
  if (selection.paragraphs)
    lines.push("$font-paragraph: " + familyValue(selection.paragraphs) + ";");
  lines.push("");
  if (selection.base) lines.push("body, * {\n  font-family: $font-base;\n}");
  if (selection.headings)
    lines.push("h1, h2, h3, h4, h5, h6 {\n  font-family: $font-heading;\n}");
  if (selection.paragraphs) lines.push("p {\n  font-family: $font-paragraph;\n}");
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
  if (selection.base)
    css.push("body, * { font-family: " + familyValue(selection.base) + "; }");
  if (selection.headings)
    css.push(
      "h1,h2,h3,h4,h5,h6 { font-family: " + familyValue(selection.headings) + "; }"
    );
  if (selection.paragraphs)
    css.push("p { font-family: " + familyValue(selection.paragraphs) + "; }");
  if (css.length) {
    lines.push("// Zastosuj rodziny fontów");
    lines.push("const style = document.createElement('style');");
    lines.push("style.textContent = `\n  " + css.join("\n  ") + "\n`;");
    lines.push("document.head.appendChild(style);");
  }
  return lines.join("\n");
}

let currentTab = "css";

function updateSnippet() {
  const section = document.getElementById("wfs-snippet");
  const hasAny = Object.values(selection).some(Boolean);
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
  let activeIndex = -1;
  let rendered = [];

  function render(filter) {
    const term = (filter || "").trim().toLowerCase();
    const matches = term
      ? ALL_FONTS.filter((f) => f.name.toLowerCase().includes(term))
      : ALL_FONTS;

    rendered = matches.slice(0, 200);
    activeIndex = -1;
    list.innerHTML = "";

    if (rendered.length === 0) {
      const li = document.createElement("li");
      li.className = "wfs-empty";
      li.textContent = "Brak wyników";
      list.appendChild(li);
    } else {
      rendered.forEach((font, i) => {
        const li = document.createElement("li");
        li.dataset.index = i;
        const name = document.createElement("span");
        name.className = "wfs-name";
        name.textContent = font.name;
        const tag = document.createElement("span");
        tag.className = "wfs-tag";
        tag.textContent = font.type === "google" ? "Google" : "System";
        li.append(name, tag);
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          choose(font.name);
        });
        list.appendChild(li);
      });
    }
    list.hidden = false;
  }

  function highlight(delta) {
    const items = [...list.querySelectorAll("li[data-index]")];
    if (!items.length) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }

  function choose(name) {
    selection[target] = name;
    input.value = name;
    input.classList.add("wfs-selected");
    combo.classList.add("has-value");
    list.hidden = true;
    applyToPage();
  }

  function clearSelection() {
    selection[target] = null;
    input.value = "";
    input.classList.remove("wfs-selected");
    combo.classList.remove("has-value");
    applyToPage();
  }

  input.addEventListener("focus", () => render(input.value));
  input.addEventListener("input", () => {
    combo.classList.add("has-value"); // pokaż ✕ do czyszczenia
    render(input.value);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (list.hidden) render(input.value);
      highlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && rendered[activeIndex]) {
        choose(rendered[activeIndex].name);
      } else if (rendered.length === 1) {
        choose(rendered[0].name);
      }
    } else if (e.key === "Escape") {
      list.hidden = true;
    }
  });

  clearBtn.addEventListener("click", clearSelection);

  // Zamknij listę po kliknięciu poza nią.
  document.addEventListener("click", (e) => {
    if (!combo.contains(e.target)) list.hidden = true;
  });

  // Przywrócenie zapamiętanego wyboru.
  combo.restore = (name) => {
    if (!name) return;
    selection[target] = name;
    input.value = name;
    input.classList.add("wfs-selected");
    combo.classList.add("has-value");
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
