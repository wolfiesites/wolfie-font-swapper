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

const listEl = document.getElementById("cf-list");
const prevEmpty = document.getElementById("cf-prev-empty");
const prevBody = document.getElementById("cf-prev-body");
const prevH = document.getElementById("cf-prev-h");
const prevP = document.getElementById("cf-prev-p");
const licEl = document.getElementById("cf-lic");
const srcEl = document.getElementById("cf-src");
const copyBtn = document.getElementById("cf-copy");
const dlCssEl = document.getElementById("cf-dl-css");
const dlFontBtn = document.getElementById("cf-dl-font");
const copiedEl = document.getElementById("cf-copied");

// <style> do podglądu @font-face
const faceStyle = document.createElement("style");
faceStyle.id = "cf-face";
document.head.appendChild(faceStyle);

function entryOf(key) {
  const v = customFonts[key];
  if (!v) return null;
  return typeof v === "string" ? { name: key, css: v } : v;
}

function licInfo(name) {
  const c = META ? META.classify(name) : { license: "unknown" };
  if (c.license === "open") {
    return {
      cls: "open",
      label: I18N.t("lic_open"),
      url: c.specimenUrl || "https://fonts.google.com/?query=" + encodeURIComponent(name),
      urlText: "Google Fonts",
    };
  }
  if (c.license === "commercial") {
    let host = "";
    try {
      host = new URL(c.buyUrl).hostname.replace(/^www\./, "");
    } catch (e) {}
    return { cls: "commercial", label: I18N.t("lic_commercial"), url: c.buyUrl, urlText: host || I18N.t("buy_font") };
  }
  return {
    cls: "unknown",
    label: I18N.t("lic_unknown"),
    url: "https://www.google.com/search?q=" + encodeURIComponent(name + " font"),
    urlText: "Google",
  };
}

function renderList() {
  listEl.innerHTML = "";
  const keys = Object.keys(customFonts);
  if (!keys.length) {
    const e = document.createElement("div");
    e.className = "cf-empty";
    e.textContent = I18N.t("cf_empty");
    listEl.appendChild(e);
    prevEmpty.hidden = false;
    prevBody.hidden = true;
    return;
  }
  keys.sort((a, b) => (entryOf(a).name || a).localeCompare(entryOf(b).name || b));
  keys.forEach((key) => {
    const entry = entryOf(key);
    const info = licInfo(entry.name);
    const item = document.createElement("div");
    item.className = "cf-item" + (key === selectedKey ? " active" : "");
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = entry.name;
    const right = document.createElement("span");
    right.style.display = "flex";
    right.style.gap = "6px";
    right.style.alignItems = "center";
    const tag = document.createElement("span");
    tag.className = "cf-tag " + info.cls;
    tag.textContent = info.label;
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
    listEl.appendChild(item);
  });
}

function selectFont(key) {
  selectedKey = key;
  const entry = entryOf(key);
  if (!entry) return;
  faceStyle.textContent = entry.css || "";
  const fam = '"' + entry.name + '", sans-serif';
  prevH.style.fontFamily = fam;
  prevP.style.fontFamily = fam;
  const info = licInfo(entry.name);
  licEl.textContent = info.label;
  licEl.className = "cf-tag " + info.cls;
  srcEl.href = info.url;
  srcEl.textContent = info.urlText;
  prevEmpty.hidden = true;
  prevBody.hidden = false;
  // eksport CSS jako plik
  const css = exportCss(entry);
  dlCssEl.href = "data:text/css;charset=utf-8," + encodeURIComponent(css);
  dlCssEl.setAttribute("download", safeName(entry.name) + ".css");
  renderListActive();
}

function renderListActive() {
  const items = listEl.querySelectorAll(".cf-item");
  const keys = Object.keys(customFonts).sort((a, b) =>
    (entryOf(a).name || a).localeCompare(entryOf(b).name || b)
  );
  items.forEach((el, i) => el.classList.toggle("active", keys[i] === selectedKey));
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
