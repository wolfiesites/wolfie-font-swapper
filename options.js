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

// ---- Customowe fonty ----

const CUSTOM_KEY = "wfs_custom_fonts";
let customFonts = {}; // lowerName -> { name, css }
let selectedKey = null;

const searchEl = document.getElementById("cf-search");
const listEl = document.getElementById("cf-list");
const prevEmpty = document.getElementById("cf-prev-empty");
const prevBody = document.getElementById("cf-prev-body");
const prevH = document.getElementById("cf-prev-h");
const prevP = document.getElementById("cf-prev-p");
const licEl = document.getElementById("cf-lic");
const costEl = document.getElementById("cf-cost");
const providersEl = document.getElementById("cf-providers");
const copyBtn = document.getElementById("cf-copy");
const dlCssEl = document.getElementById("cf-dl-css");
const dlFontBtn = document.getElementById("cf-dl-font");
const copiedEl = document.getElementById("cf-copied");

const BATCH = 40; // ile pozycji doładowujemy przy scrollu
let filteredKeys = [];
let shown = 0;

// <style> do podglądu @font-face
const faceStyle = document.createElement("style");
faceStyle.id = "cf-face";
document.head.appendChild(faceStyle);

function entryOf(key) {
  const v = customFonts[key];
  if (!v) return null;
  return typeof v === "string" ? { name: key, css: v } : v;
}

function sortedKeys() {
  return Object.keys(customFonts).sort((a, b) =>
    (entryOf(a).name || a).localeCompare(entryOf(b).name || b)
  );
}

function makeItem(key) {
  const entry = entryOf(key);
  const c = META ? META.classify(entry.name) : { license: "unknown" };
  const item = document.createElement("div");
  item.className = "cf-item" + (key === selectedKey ? " active" : "");
  item.dataset.key = key;
  const nm = document.createElement("span");
  nm.className = "nm";
  nm.textContent = entry.name;
  const right = document.createElement("span");
  right.style.cssText = "display:flex;gap:6px;align-items:center";
  const tag = document.createElement("span");
  tag.className = "cf-tag " + c.license;
  tag.textContent =
    c.license === "open"
      ? I18N.t("lic_open")
      : c.license === "commercial"
      ? I18N.t("lic_commercial")
      : I18N.t("lic_unknown");
  const del = document.createElement("button");
  del.className = "cf-del";
  del.type = "button";
  del.textContent = "✕";
  del.title = I18N.t("cf_delete");
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteFont(key);
  });
  right.append(tag, del);
  item.append(nm, right);
  item.addEventListener("click", () => selectFont(key));
  return item;
}

// Lazy-load: doładuj kolejną partię pozycji.
function loadMore() {
  const next = Math.min(shown + BATCH, filteredKeys.length);
  for (let i = shown; i < next; i++) listEl.appendChild(makeItem(filteredKeys[i]));
  shown = next;
}

function renderList() {
  const term = (searchEl.value || "").trim().toLowerCase();
  const all = sortedKeys();
  filteredKeys = term
    ? all.filter((k) => (entryOf(k).name || k).toLowerCase().includes(term))
    : all;
  listEl.innerHTML = "";
  shown = 0;
  if (!Object.keys(customFonts).length) {
    const e = document.createElement("div");
    e.className = "cf-empty";
    e.textContent = I18N.t("cf_empty");
    listEl.appendChild(e);
    prevEmpty.hidden = false;
    prevBody.hidden = true;
    return;
  }
  if (!filteredKeys.length) {
    const e = document.createElement("div");
    e.className = "cf-empty";
    e.textContent = I18N.t("search_empty");
    listEl.appendChild(e);
    return;
  }
  loadMore();
}

listEl.addEventListener("scroll", () => {
  if (shown >= filteredKeys.length) return;
  if (listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 40) loadMore();
});
searchEl.addEventListener("input", () => renderList());

function setCost(cost) {
  costEl.className = "cf-cost " + cost;
  costEl.textContent = cost === "free" ? "Free" : cost === "paid" ? "$" : "?";
}

function renderProviders(name, buyUrl) {
  providersEl.innerHTML = "";
  if (buyUrl) {
    const a = document.createElement("a");
    a.href = buyUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = I18N.t("buy_font");
    providersEl.appendChild(a);
  }
  const links = META && META.searchLinks ? META.searchLinks(name) : [];
  links.forEach((p) => {
    const a = document.createElement("a");
    a.href = p.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = p.name;
    providersEl.appendChild(a);
  });
}

function showInfo(name, meta) {
  if (meta.licenseUrl) {
    licEl.href = meta.licenseUrl;
    licEl.style.pointerEvents = "";
    licEl.style.textDecoration = "";
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

function selectFont(key) {
  selectedKey = key;
  const entry = entryOf(key);
  if (!entry) return;
  faceStyle.textContent = entry.css || "";
  const fam = '"' + entry.name + '", sans-serif';
  prevH.style.fontFamily = fam;
  prevP.style.fontFamily = fam;
  prevEmpty.hidden = true;
  prevBody.hidden = false;
  // od razu pokaż szybką klasyfikację…
  showInfo(entry.name, META ? META.classify(entry.name) : { license: "unknown" });
  // …i dociągnij autorytatywną licencję z Google (dla każdego fontu Google).
  if (META && META.classifyAuthoritative) {
    META.classifyAuthoritative(entry.name).then((m) => {
      if (selectedKey === key) showInfo(entry.name, m);
    });
  }
  const css = exportCss(entry);
  dlCssEl.href = "data:text/css;charset=utf-8," + encodeURIComponent(css);
  dlCssEl.setAttribute("download", safeName(entry.name) + ".css");
  renderListActive();
}

function renderListActive() {
  listEl.querySelectorAll(".cf-item").forEach((el) =>
    el.classList.toggle("active", el.dataset.key === selectedKey)
  );
}

function exportCss(entry) {
  const q = '"' + entry.name + '", sans-serif';
  return (
    "/* " + entry.name + " — Wolfie Font Swapper export */\n" +
    entry.css +
    "\n\nh1, h2, h3, h4, h5, h6 { font-family: " + q + "; }\n" +
    "p, body { font-family: " + q + "; }\n"
  );
}

function safeName(name) {
  return name.replace(/[^a-z0-9_-]+/gi, "-");
}

function deleteFont(key) {
  delete customFonts[key];
  if (selectedKey === key) {
    selectedKey = null;
    prevBody.hidden = true;
    prevEmpty.hidden = false;
  }
  try {
    chrome.storage.local.set({ [CUSTOM_KEY]: customFonts });
  } catch (e) {}
  renderList();
}

// Kopiuj CSS do schowka
copyBtn.addEventListener("click", async () => {
  const entry = entryOf(selectedKey);
  if (!entry) return;
  try {
    await navigator.clipboard.writeText(exportCss(entry));
    copiedEl.textContent = I18N.t("options_saved");
    copiedEl.hidden = false;
    setTimeout(() => (copiedEl.hidden = true), 1500);
  } catch (e) {}
});

// Pobierz plik fontu (z osadzonego data: w @font-face)
dlFontBtn.addEventListener("click", () => {
  const entry = entryOf(selectedKey);
  if (!entry) return;
  const m = /data:(font\/[a-z0-9]+|application\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/i.exec(
    entry.css || ""
  );
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
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeName(entry.name) + "." + ext;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

// Purge — usuń wszystkie zapisane customowe fonty.
const purgeBtn = document.getElementById("cf-purge");
if (purgeBtn) {
  purgeBtn.addEventListener("click", () => {
    if (!Object.keys(customFonts).length) return;
    if (!confirm(I18N.t("cf_purge_confirm"))) return;
    customFonts = {};
    selectedKey = null;
    faceStyle.textContent = "";
    try {
      chrome.storage.local.set({ [CUSTOM_KEY]: {} });
    } catch (e) {}
    prevBody.hidden = true;
    prevEmpty.hidden = false;
    renderList();
  });
}

function loadCustomFonts() {
  try {
    chrome.storage.local.get(CUSTOM_KEY, (data) => {
      customFonts = data[CUSTOM_KEY] && typeof data[CUSTOM_KEY] === "object" ? data[CUSTOM_KEY] : {};
      renderList();
    });
  } catch (e) {
    renderList();
  }
}

// Reaguj na nowo pobrane fonty (gdy popup zapisze podczas otwartej strony opcji).
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[CUSTOM_KEY]) {
      customFonts = changes[CUSTOM_KEY].newValue || {};
      renderList();
      if (selectedKey && customFonts[selectedKey]) selectFont(selectedKey);
    }
  });
} catch (e) {}

loadCustomFonts();
