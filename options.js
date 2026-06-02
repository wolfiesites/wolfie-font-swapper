"use strict";

const I18N = window.WOLFIE_I18N;
const META = window.WOLFIE_FONT_META;
const select = document.getElementById("lang");
const savedEl = document.getElementById("saved");

// ---- Język ----

function buildOptions() {
  select.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = I18N.t("options_lang_auto");
  select.appendChild(auto);
  I18N.SUPPORTED.forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = I18N.LANG_NAMES[code];
    select.appendChild(opt);
  });
}

function currentPref() {
  try {
    return localStorage.getItem("wfs_lang") || "";
  } catch (e) {
    return "";
  }
}

function refresh() {
  I18N.applyI18n(document);
  document.title = I18N.t("options_title");
  if (select.options[0]) select.options[0].textContent = I18N.t("options_lang_auto");
}

buildOptions();
select.value = currentPref();
refresh();

select.addEventListener("change", () => {
  I18N.setLang(select.value);
  try {
    chrome.storage.local.set({ wfs_lang: select.value || null });
  } catch (e) {}
  refresh();
  savedEl.textContent = I18N.t("options_saved");
  setTimeout(() => (savedEl.textContent = ""), 1500);
});

// ---- Menedżer fontów: panel (custom + ulubione) ----

const CUSTOM_KEY = "wfs_custom_fonts";
const FAV_KEY = "wfs_favorites";
const BATCH = 40;

let customFonts = {}; // lowerName -> { name, css }
let favorites = []; // [name]

function customCss(name) {
  const v = customFonts[name.toLowerCase()];
  if (!v) return null;
  return typeof v === "string" ? v : v.css;
}
function googleImport(name) {
  return (
    "https://fonts.googleapis.com/css2?family=" +
    encodeURIComponent(name).replace(/%20/g, "+") +
    ":wght@400;500;700&display=swap"
  );
}
function exportCss(name, css) {
  const q = '"' + name + '", sans-serif';
  return (
    "/* " + name + " — Wolfie Font Swapper export */\n" +
    (css || "") +
    "\n\nh1, h2, h3, h4, h5, h6 { font-family: " + q + "; }\n" +
    "p, body { font-family: " + q + "; }\n"
  );
}
function safeName(name) {
  return name.replace(/[^a-z0-9_-]+/gi, "-");
}

// Fabryka panelu: lista (search + lazy) + podgląd + licencja + eksport.
function makePanel(cfg) {
  const el = (s) => document.getElementById(cfg.prefix + s);
  const searchEl = el("-search");
  const listEl = el("-list");
  const prevEmpty = el("-prev-empty");
  const prevBody = el("-prev-body");
  const prevH = el("-prev-h");
  const prevP = el("-prev-p");
  const licEl = el("-lic");
  const costEl = el("-cost");
  const providersEl = el("-providers");
  const copyBtn = el("-copy");
  const dlCssEl = el("-dl-css");
  const dlFontBtn = el("-dl-font");
  const copiedEl = el("-copied");

  const faceStyle = document.createElement("style");
  document.head.appendChild(faceStyle);

  let items = [];
  let filtered = [];
  let shown = 0;
  let selectedKey = null;
  let selected = null;

  function setCost(cost) {
    costEl.className = "cf-cost " + cost;
    costEl.textContent = cost === "free" ? "Free" : cost === "paid" ? "$" : "?";
  }
  function renderProviders(name, buyUrl) {
    providersEl.innerHTML = "";
    if (buyUrl) {
      const a = document.createElement("a");
      a.href = buyUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = I18N.t("buy_font");
      providersEl.appendChild(a);
    }
    (META && META.searchLinks ? META.searchLinks(name) : []).forEach((p) => {
      const a = document.createElement("a");
      a.href = p.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = p.name;
      providersEl.appendChild(a);
    });
  }
  function showInfo(name, meta) {
    if (meta.licenseUrl) {
      licEl.href = meta.licenseUrl;
      licEl.style.pointerEvents = "";
    } else {
      licEl.removeAttribute("href");
      licEl.style.pointerEvents = "none";
    }
    licEl.textContent =
      meta.licenseName ||
      (meta.license === "open" ? "Open" : meta.license === "commercial" ? "Commercial" : "Unknown");
    setCost(meta.cost || (meta.license === "open" ? "free" : meta.license === "commercial" ? "paid" : "unknown"));
    renderProviders(name, meta.buyUrl);
  }
  function makeItemEl(it) {
    const c = META ? META.classify(it.name) : { license: "unknown" };
    const node = document.createElement("div");
    node.className = "cf-item" + (it.key === selectedKey ? " active" : "");
    node.dataset.key = it.key;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = it.name;
    // Lewa grupa: nazwa + ewentualny znacznik $ (font premium / płatna licencja).
    const left = document.createElement("span");
    left.style.cssText = "display:flex;gap:6px;align-items:center;min-width:0";
    left.appendChild(nm);
    if (c.license === "commercial") {
      const dollar = document.createElement("span");
      dollar.className = "cf-paidmark";
      dollar.textContent = "$";
      dollar.title = I18N.t("premium_required");
      left.appendChild(dollar);
    }
    const right = document.createElement("span");
    right.style.cssText = "display:flex;gap:6px;align-items:center";
    const tag = document.createElement("span");
    tag.className = "cf-tag " + c.license;
    tag.textContent =
      c.license === "open" ? I18N.t("lic_open") : c.license === "commercial" ? I18N.t("lic_commercial") : I18N.t("lic_unknown");
    const del = document.createElement("button");
    del.className = "cf-del"; del.type = "button"; del.textContent = "✕"; del.title = I18N.t("cf_delete");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (cfg.confirmDelete && !confirm(I18N.t("cf_delete_confirm").replace("%s", it.name))) return;
      cfg.remove(it.key);
    });
    right.append(tag, del);
    node.append(left, right);
    node.addEventListener("click", () => selectItem(it.key));
    return node;
  }
  function loadMore() {
    const next = Math.min(shown + BATCH, filtered.length);
    for (let i = shown; i < next; i++) listEl.appendChild(makeItemEl(filtered[i]));
    shown = next;
  }
  function render() {
    items = cfg.getItems();
    const term = (searchEl.value || "").trim().toLowerCase();
    filtered = term ? items.filter((it) => it.name.toLowerCase().includes(term)) : items;
    listEl.innerHTML = "";
    shown = 0;
    if (!items.length) {
      const e = document.createElement("div");
      e.className = "cf-empty";
      e.textContent = I18N.t(cfg.emptyKey);
      listEl.appendChild(e);
      prevEmpty.hidden = false;
      prevBody.hidden = true;
      return;
    }
    if (!filtered.length) {
      const e = document.createElement("div");
      e.className = "cf-empty";
      e.textContent = I18N.t("search_empty");
      listEl.appendChild(e);
      return;
    }
    loadMore();
  }
  function selectItem(key) {
    selectedKey = key;
    selected = filtered.find((it) => it.key === key) || items.find((it) => it.key === key);
    if (!selected) return;
    faceStyle.textContent = selected.css || "";
    const fam = '"' + selected.name + '", sans-serif';
    prevH.style.fontFamily = fam;
    prevP.style.fontFamily = fam;
    prevEmpty.hidden = true;
    prevBody.hidden = false;
    showInfo(selected.name, META ? META.classify(selected.name) : { license: "unknown" });
    if (META && META.classifyAuthoritative) {
      META.classifyAuthoritative(selected.name).then((m) => {
        if (selectedKey === key) showInfo(selected.name, m);
      });
    }
    dlCssEl.href = "data:text/css;charset=utf-8," + encodeURIComponent(exportCss(selected.name, selected.css));
    dlCssEl.setAttribute("download", safeName(selected.name) + ".css");
    listEl.querySelectorAll(".cf-item").forEach((n) => n.classList.toggle("active", n.dataset.key === selectedKey));
  }
  listEl.addEventListener("scroll", () => {
    if (shown >= filtered.length) return;
    if (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 40) loadMore();
  });
  searchEl.addEventListener("input", render);
  copyBtn.addEventListener("click", async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(exportCss(selected.name, selected.css));
      copiedEl.textContent = I18N.t("options_saved");
      copiedEl.hidden = false;
      setTimeout(() => (copiedEl.hidden = true), 1500);
    } catch (e) {}
  });
  dlFontBtn.addEventListener("click", () => {
    if (!selected) return;
    const m = /data:(font\/[a-z0-9]+|application\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/i.exec(selected.css || "");
    if (!m) {
      copiedEl.textContent = "—";
      copiedEl.hidden = false;
      setTimeout(() => (copiedEl.hidden = true), 1500);
      return;
    }
    const mime = m[1];
    const ext = mime.indexOf("woff2") >= 0 ? "woff2" : mime.indexOf("woff") >= 0 ? "woff" : mime.indexOf("ttf") >= 0 ? "ttf" : mime.indexOf("otf") >= 0 ? "otf" : "font";
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName(selected.name) + "." + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  function clearSelection() {
    selectedKey = null;
    selected = null;
    prevBody.hidden = true;
    prevEmpty.hidden = false;
    faceStyle.textContent = "";
  }
  return { render, clearSelection };
}

function sortedCustomKeys() {
  return Object.keys(customFonts).sort((a, b) => {
    const na = (typeof customFonts[a] === "string" ? a : customFonts[a].name) || a;
    const nb = (typeof customFonts[b] === "string" ? b : customFonts[b].name) || b;
    return na.localeCompare(nb);
  });
}

const customPanel = makePanel({
  prefix: "cf",
  emptyKey: "cf_empty",
  confirmDelete: true,
  getItems: () =>
    sortedCustomKeys().map((k) => {
      const v = customFonts[k];
      const e = typeof v === "string" ? { name: k, css: v } : v;
      return { key: k, name: e.name || k, css: e.css };
    }),
  remove: (key) => {
    delete customFonts[key];
    try { chrome.storage.local.set({ [CUSTOM_KEY]: customFonts }); } catch (e) {}
    customPanel.render();
  },
});

const favPanel = makePanel({
  prefix: "fav",
  emptyKey: "fav_empty",
  getItems: () =>
    favorites.map((name) => {
      const css =
        customCss(name) ||
        (META && META.classify(name).license === "open"
          ? "@import url('" + googleImport(name) + "');"
          : "");
      return { key: name.toLowerCase(), name, css };
    }),
  remove: (key) => {
    const i = favorites.findIndex((n) => n.toLowerCase() === key);
    if (i >= 0) favorites.splice(i, 1);
    try { chrome.storage.local.set({ [FAV_KEY]: favorites }); } catch (e) {}
    favPanel.render();
  },
});

// Purge — usuń wszystkie zapisane customowe fonty.
const purgeBtn = document.getElementById("cf-purge");
if (purgeBtn) {
  purgeBtn.addEventListener("click", () => {
    if (!Object.keys(customFonts).length) return;
    if (!confirm(I18N.t("cf_purge_confirm"))) return;
    customFonts = {};
    try { chrome.storage.local.set({ [CUSTOM_KEY]: {} }); } catch (e) {}
    customPanel.clearSelection();
    customPanel.render();
  });
}

// ---- Presety (wyświetlanie + zmiana nazwy) ----
const PRESETS_KEY = "wfs_presets";
let presets = [];
const psList = document.getElementById("ps-list");

function targetLabel(key) {
  const map = {
    base: "sec_base",
    headings: "sec_headings",
    paragraphs: "sec_paragraphs",
    navigation: "sec_navigation",
    buttons: "sec_buttons",
  };
  return I18N.t(map[key] || key);
}
function presetSummary(sel) {
  const parts = [];
  ["base", "headings", "paragraphs", "navigation", "buttons"].forEach((k) => {
    const pp = sel && sel[k];
    if (pp && pp.family) parts.push(targetLabel(k) + ": " + pp.family);
  });
  return parts.join(" · ");
}
function savePresets() {
  try { chrome.storage.local.set({ [PRESETS_KEY]: presets }); } catch (e) {}
}
function renderPresets() {
  if (!psList) return;
  psList.innerHTML = "";
  if (!presets.length) {
    const e = document.createElement("div");
    e.className = "ps-empty";
    e.textContent = I18N.t("preset_empty");
    psList.appendChild(e);
    return;
  }
  presets.forEach((preset, i) => {
    const row = document.createElement("div");
    row.className = "ps-item";
    const name = document.createElement("input");
    name.className = "ps-name";
    name.type = "text";
    name.maxLength = 40;
    name.value = preset.name || "Preset " + (i + 1);
    name.addEventListener("change", () => {
      const v = name.value.trim();
      if (v) {
        presets[i].name = v;
        savePresets();
      } else {
        name.value = presets[i].name;
      }
    });
    const sum = document.createElement("span");
    sum.className = "ps-sum";
    sum.textContent = presetSummary(preset.selection);
    const del = document.createElement("button");
    del.className = "ps-del";
    del.type = "button";
    del.textContent = "✕";
    del.title = I18N.t("preset_delete_title");
    del.addEventListener("click", () => {
      presets.splice(i, 1);
      savePresets();
      renderPresets();
    });
    row.append(name, sum, del);
    psList.appendChild(row);
  });
}

// Purge presetów.
const psPurgeBtn = document.getElementById("ps-purge");
if (psPurgeBtn) {
  psPurgeBtn.addEventListener("click", () => {
    if (!presets.length) return;
    if (!confirm(I18N.t("ps_purge_confirm"))) return;
    presets = [];
    try { chrome.storage.local.set({ [PRESETS_KEY]: [] }); } catch (e) {}
    renderPresets();
  });
}

// Przycisk zamknięcia (powrót na poprzednią kartę).
const optCloseBtn = document.getElementById("opt-close");
if (optCloseBtn) {
  optCloseBtn.addEventListener("click", () => {
    try {
      chrome.tabs.getCurrent((tab) => {
        if (tab && tab.id != null) chrome.tabs.remove(tab.id);
        else window.close();
      });
    } catch (e) {
      window.close();
    }
  });
}

// Wersja dodatku w stopce.
try {
  const vEl = document.getElementById("opt-version");
  if (vEl) vEl.textContent = "v" + chrome.runtime.getManifest().version;
} catch (e) {}

// Purge ulubionych — czyści TYLKO wfs_favorites.
const favPurgeBtn = document.getElementById("fav-purge");
if (favPurgeBtn) {
  favPurgeBtn.addEventListener("click", () => {
    if (!favorites.length) return;
    if (!confirm(I18N.t("fav_purge_confirm"))) return;
    favorites = [];
    try { chrome.storage.local.set({ [FAV_KEY]: [] }); } catch (e) {}
    favPanel.clearSelection();
    favPanel.render();
  });
}

// ---- Reguły domen (glob -> preset) ----
const RULES_KEY = "wfs_rules";
let rules = [];
const rulesList = document.getElementById("rules-list");
function saveRules() {
  try { chrome.storage.local.set({ [RULES_KEY]: rules }); } catch (e) {}
}
function renderRules() {
  if (!rulesList) return;
  const addBtn = document.getElementById("rules-add");
  rulesList.innerHTML = "";
  // Dodanie nowej reguły wymaga presetu — ale ISTNIEJĄCE reguły pokazujemy
  // zawsze (także bez presetów), by stare/zalegające reguły dało się usunąć.
  const noPresets = !presets.length;
  if (addBtn) {
    addBtn.disabled = noPresets;
    addBtn.style.opacity = noPresets ? ".5" : "";
    addBtn.style.cursor = noPresets ? "not-allowed" : "";
  }
  if (!rules.length) {
    const e = document.createElement("div");
    e.className = "rules-empty";
    e.textContent = I18N.t(noPresets ? "rules_need_preset" : "rules_empty");
    rulesList.appendChild(e);
    return;
  }
  rules.forEach((rule, i) => {
    const row = document.createElement("div");
    row.className = "rule-item";
    const pat = document.createElement("input");
    pat.className = "rule-pattern";
    pat.type = "text";
    pat.placeholder = I18N.t("rules_pattern_ph");
    pat.value = rule.pattern || "";
    pat.addEventListener("change", () => { rules[i].pattern = pat.value.trim(); saveRules(); });
    const sel = document.createElement("select");
    sel.className = "rule-preset";
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = I18N.t("rules_choose_preset");
    sel.appendChild(ph);
    presets.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.name;
      o.textContent = p.name;
      if (p.name === rule.preset) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { rules[i].preset = sel.value; saveRules(); });
    const del = document.createElement("button");
    del.className = "rule-del";
    del.type = "button";
    del.textContent = "✕";
    del.addEventListener("click", () => { rules.splice(i, 1); saveRules(); renderRules(); });
    row.append(pat, sel, del);
    rulesList.appendChild(row);
  });
}
const rulesAddBtn = document.getElementById("rules-add");
if (rulesAddBtn) {
  rulesAddBtn.addEventListener("click", () => {
    if (!presets.length) return; // reguła wymaga presetu
    rules.push({ pattern: "", preset: presets[0].name }); // domyślnie pierwszy preset
    saveRules();
    renderRules();
  });
}

chrome.storage.local.get([CUSTOM_KEY, FAV_KEY, PRESETS_KEY, RULES_KEY], (data) => {
  customFonts = data[CUSTOM_KEY] && typeof data[CUSTOM_KEY] === "object" ? data[CUSTOM_KEY] : {};
  favorites = Array.isArray(data[FAV_KEY]) ? data[FAV_KEY] : [];
  presets = Array.isArray(data[PRESETS_KEY]) ? data[PRESETS_KEY] : [];
  rules = Array.isArray(data[RULES_KEY]) ? data[RULES_KEY] : [];
  customPanel.render();
  favPanel.render();
  renderPresets();
  renderRules();
});

// Aktualizuj na żywo, gdy popup zmieni dane przy otwartej stronie opcji.
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[CUSTOM_KEY]) {
      customFonts = changes[CUSTOM_KEY].newValue || {};
      customPanel.render();
    }
    if (changes[FAV_KEY]) {
      favorites = changes[FAV_KEY].newValue || [];
      favPanel.render();
    }
    if (changes[PRESETS_KEY]) {
      presets = Array.isArray(changes[PRESETS_KEY].newValue) ? changes[PRESETS_KEY].newValue : [];
      renderPresets();
      renderRules();
    }
    if (changes[RULES_KEY]) {
      rules = Array.isArray(changes[RULES_KEY].newValue) ? changes[RULES_KEY].newValue : [];
      renderRules();
    }
  });
} catch (e) {}
