// ---- Panel UI wstrzykiwany w stronę (iframe popup.html, fixed prawy górny róg) ----
// Klik w ikonę rozszerzenia przełącza panel. Minimalizacja zwija go do małej
// okrągłej ikony przyklejonej do prawego górnego rogu (klik = rozwiń z powrotem).
(function () {
  if (window.__wfsPanelInit) return; // chroni przed podwójnym wstrzyknięciem
  window.__wfsPanelInit = true;

  const PANEL_ID = "wolfie-font-swapper-panel";
  const MINI_ID = "wolfie-font-swapper-mini";
  let panelTabId = null;

  function makeIframe(tabId) {
    const iframe = document.createElement("iframe");
    iframe.id = PANEL_ID;
    // Deleguj do panelu dostęp do lokalnych fontów (Local Font Access API),
    // by enumeracja zainstalowanych fontów działała i nie zgłaszała naruszenia.
    iframe.allow = "local-fonts; clipboard-write";
    iframe.src =
      chrome.runtime.getURL("popup.html") + "?tabId=" + tabId + "&panel=1";
    Object.assign(iframe.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "320px",
      height: "min(660px, 100vh)",
      border: "none",
      zIndex: "2147483647",
      colorScheme: "normal",
      boxShadow: "0 10px 40px rgba(0,0,0,.5)",
      borderRadius: "0 0 0 14px",
      // Ciemnoszare tło iframe (nie przezroczyste) — żadna szczelina w panelu nie
      // pokaze juz strony pod spodem (np. przerwa input/lista).
      background: "#1e1e24",
    });
    return iframe;
  }

  function removeMini() {
    const m = document.getElementById(MINI_ID);
    if (m) m.remove();
  }

  function showMini() {
    if (document.getElementById(MINI_ID)) return;
    const btn = document.createElement("button");
    btn.id = MINI_ID;
    btn.type = "button";
    btn.title = "Wolfie Font Swapper";
    btn.textContent = "Aa";
    Object.assign(btn.style, {
      position: "fixed",
      top: "12px",
      right: "12px",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "2px solid #00e0ff",
      background: "#1e1e24",
      color: "#00e0ff",
      font: "700 16px 'Segoe UI', system-ui, sans-serif",
      cursor: "pointer",
      zIndex: "2147483647",
      boxShadow: "0 6px 22px rgba(0,0,0,.45)",
      padding: "0",
      lineHeight: "1",
    });
    btn.addEventListener("click", () => showPanel(panelTabId));
    document.documentElement.appendChild(btn);
  }

  function showPanel(tabId) {
    if (tabId != null) panelTabId = tabId;
    removeMini();
    let iframe = document.getElementById(PANEL_ID);
    if (!iframe) {
      iframe = makeIframe(panelTabId);
      (document.body || document.documentElement).appendChild(iframe);
    } else {
      iframe.style.display = "block";
    }
  }

  function collapsePanel() {
    const iframe = document.getElementById(PANEL_ID);
    if (iframe) iframe.style.display = "none"; // ukryj (stan popupu zostaje)
    showMini();
  }

  function closeAll() {
    const iframe = document.getElementById(PANEL_ID);
    if (iframe) iframe.remove();
    removeMini();
  }

  function togglePanel(tabId) {
    const iframe = document.getElementById(PANEL_ID);
    const visible = iframe && iframe.style.display !== "none";
    if (visible) closeAll(); // otwarty → zamknij; zwinięty/zamknięty → pokaż
    else showPanel(tabId);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === "wfs-toggle-panel") togglePanel(msg.tabId);
    else if (msg.type === "wfs-collapse-panel") collapsePanel();
    else if (msg.type === "wfs-close-panel") closeAll();
  });
})();

// Auto-stosowanie fontów na stronie wg konfigu domeny (sesja/trwały) lub
// pasującej reguły (glob na URL/host). Działa przy ładowaniu — bez popupu.
(async function () {
  const STYLE_ID = "wolfie-font-swapper-style";

  function globToRegex(p) {
    let s = String(p).trim();
    // Gdy wzorzec nie kończy się '*' ani '/', dopnij '*' — reguła dla domeny
    // działa też na podstronach ("wikipedia.org" ~ "wikipedia.org*").
    if (s && !s.endsWith("*") && !s.endsWith("/")) s += "*";
    return new RegExp(
      "^" + s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
      "i"
    );
  }
  function bareDomainOf(pattern) {
    // Zdejmij końcowe '*' i '/' — "wikipedia.org", "wikipedia.org*",
    // "wikipedia.org/" i "wikipedia.org/*" traktujemy tak samo.
    const bare = String(pattern || "").trim().replace(/[*/]+$/, "");
    if (!bare || bare.includes("*") || bare.includes("://") || bare.includes("/")) return null;
    if (!/^[a-z0-9.-]+(:\d+)?$/i.test(bare)) return null;
    return bare.replace(/^www\./i, "");
  }
  function patternMatches(pattern, url, host) {
    const d = bareDomainOf(pattern);
    if (d) {
      // „goła domena" → apex + www, dowolny schemat i podstrony (po hoście).
      const re = new RegExp("^(www\\.)?" + d.replace(/[.+^${}()|[\]\\]/g, "\\$&") + "$", "i");
      return re.test(host || "");
    }
    const re = globToRegex(pattern);
    return (url && re.test(url)) || (host && re.test(host));
  }
  function matchRule(rules, url, host) {
    for (const r of rules || []) {
      if (!r || !r.pattern) continue;
      try {
        if (patternMatches(r.pattern, url, host)) return r;
      } catch (e) {}
    }
    return null;
  }
  function hasProps(p) {
    return !!(p && (p.family || p.weight || p.spacing || p.size || p.case || p.color || p.lineheight));
  }
  function hasAny(sel) {
    return sel && Object.values(sel).some(hasProps);
  }
  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/;
  const q = (f) => (generic.test(f) ? f : '"' + f + '"');
  const META = window.WOLFIE_FONT_META;
  const altOf = (f) => (META && META.freeAlternative ? META.freeAlternative(f) : null);
  // Font premium → dokładamy darmowy odpowiednik jako fallback (oryginał wygrywa).
  const fam = (f) => {
    const a = altOf(f);
    return a ? q(f) + "," + q(a) + ",sans-serif" : q(f);
  };
  function decl(p) {
    const d = [];
    if (p.family) d.push("font-family:" + fam(p.family) + " !important");
    if (p.weight) d.push("font-weight:" + p.weight + " !important");
    if (p.spacing) d.push("letter-spacing:" + p.spacing + " !important");
    if (p.size) d.push("font-size:" + p.size + " !important");
    if (p.lineheight) d.push("line-height:" + p.lineheight + " !important");
    if (p.case) d.push("text-transform:" + p.case + " !important");
    if (p.color) d.push("color:" + p.color + " !important");
    return d.join(";");
  }
  function buildRules(sel) {
    const out = [];
    // Wzorce nawigacji — do reguły nawigacji i do wykluczenia nawigacji z akapitów.
    const nb = ["nav", '[role="navigation"]', ".navbar", ".navbar-nav", ".nav", ".nav-menu", ".navmenu", ".navigation", ".menu", ".main-menu", ".main-nav", ".primary-menu", ".primary-nav", ".site-nav", ".topnav", ".top-nav", ".menu-list", "#nav", "#navbar", "#menu", "#navigation", "#main-nav", "#primary-menu", "header ul"];
    const navExcl = nb.flatMap((s) => [s, s + " *"]).join(", ");
    if (hasProps(sel.base))
      out.push(
        ':where(body, body *):not(:where(i,[class*="icon"],[class*="Icon"],[class*="material-"])) { ' +
          decl(sel.base) + " }"
      );
    if (hasProps(sel.headings))
      out.push("h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 * { " + decl(sel.headings) + " }");
    if (hasProps(sel.paragraphs)) {
      // Akapity + listy (ul/ol/li) + tabele (table/tr/td/th…), bez nawigacji.
      const pb = ["p", "ul", "ol", "li", "dl", "dt", "dd", "table", "caption", "thead", "tbody", "tfoot", "tr", "td", "th"];
      const paraSel = pb.flatMap((s) => [s, s + " *"]).join(", ");
      out.push(":where(" + paraSel + "):not(:where(" + navExcl + ")) { " + decl(sel.paragraphs) + " }");
    }
    if (hasProps(sel.navigation)) {
      out.push(nb.map((s) => s + ", " + s + " *").join(", ") + " { " + decl(sel.navigation) + " }");
    }
    if (hasProps(sel.buttons)) {
      const bb = ["button", '[role="button"]', ".btn", ".button", 'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]'];
      out.push(bb.map((s) => s + ", " + s + " *").join(", ") + " { " + decl(sel.buttons) + " }");
    }
    return out.join("\n");
  }
  // Lista fontów Google (z fonts.js, ładowanego przed content.js) — by wiedzieć,
  // które rodziny pobierać na żywo z Google, gdy nie ma ich w cache.
  const GOOGLE_SET = new Set(
    ((window.WOLFIE_FONTS && window.WOLFIE_FONTS.GOOGLE_FONTS) || []).map((s) =>
      s.toLowerCase()
    )
  );

  // Pobierz @font-face z Google i osadź pliki woff2 jako data: (jak w popupie),
  // by font realnie renderował się także bez wcześniejszego cache.
  async function fetchGoogleFace(family) {
    const url =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(family).replace(/%20/g, "+") +
      ":ital,wght@0,300;0,400;0,500;0,700;0,800;1,400;1,700&display=swap";
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    let css = await res.text();
    const urls = [
      ...new Set(
        [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g)].map(
          (m) => m[1]
        )
      ),
    ];
    for (const fu of urls) {
      try {
        const fr = await fetch(fu);
        if (!fr.ok) continue;
        const buf = await fr.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        const ch = 0x8000;
        for (let i = 0; i < bytes.length; i += ch) {
          bin += String.fromCharCode.apply(null, bytes.subarray(i, i + ch));
        }
        css = css.split(fu).join("data:font/woff2;base64," + btoa(bin));
      } catch (e) {}
    }
    return css;
  }

  // Zbierz @font-face dla wszystkich rodzin: cache → custom → (Google na żywo).
  async function buildFaceCss(sel, cache, custom) {
    // Rodziny + darmowe odpowiedniki fontów premium (też ładujemy jako fallback).
    const base = Object.values(sel).map((p) => p.family).filter(Boolean);
    const withAlts = base.flatMap((f) => {
      const a = altOf(f);
      return a ? [f, a] : [f];
    });
    const fams = [...new Set(withAlts)];
    const map = (cache && cache.map) || {};
    let css = "";
    const fetched = {}; // nowo pobrane (do dopisania do cache)
    for (const f of fams) {
      const low = f.toLowerCase();
      if (map[low]) {
        css += map[low] + "\n";
        continue;
      }
      const c = custom && custom[low];
      if (c) {
        css += (typeof c === "string" ? c : c.css) + "\n";
        continue;
      }
      // Nie w cache i nie custom — jeśli to font Google, pobierz teraz.
      if (GOOGLE_SET.has(low)) {
        try {
          const g = await fetchGoogleFace(f);
          if (g && /@font-face/i.test(g)) {
            css += g + "\n";
            fetched[low] = g;
          }
        } catch (e) {}
      }
    }
    return { css, fetched };
  }

  try {
    const local = await chrome.storage.local.get([
      "wfs_rules", "wfs_presets", "wfs_persist", "wfs_custom_fonts", "wfs_font_cache",
    ]);
    let sess = {};
    try {
      sess = (await chrome.storage.session.get("wfs_session")).wfs_session || {};
    } catch (e) {}
    const host = location.hostname;
    const url = location.href;
    let sel = (local.wfs_persist || {})[host] || sess[host] || null;
    let fromRule = false; // konfig z reguły domeny → czerwona kropka
    if (!sel) {
      const r = matchRule(local.wfs_rules || [], url, host);
      if (r) {
        const ps = (local.wfs_presets || []).find((p) => p.name === r.preset);
        if (ps) {
          sel = ps.selection;
          fromRule = true;
        }
      }
    }
    if (!hasAny(sel)) return;
    const { css: faces, fetched } = await buildFaceCss(
      sel,
      local.wfs_font_cache,
      local.wfs_custom_fonts
    );
    const css = faces + "\n" + buildRules(sel);
    let st = document.getElementById(STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(st);
    }
    st.textContent = css;
    // Dopisz nowo pobrane fonty Google do trwałego cache (na kolejne wczytania).
    if (Object.keys(fetched).length) {
      try {
        const fc =
          local.wfs_font_cache && local.wfs_font_cache.map
            ? local.wfs_font_cache
            : { map: {}, order: [] };
        Object.assign(fc.map, fetched);
        fc.order = [...(fc.order || []), ...Object.keys(fetched)];
        chrome.storage.local.set({ wfs_font_cache: fc });
      } catch (e) {}
    }
    try {
      chrome.runtime.sendMessage({ type: "wfs-active", fromRule }); // kropka na ikonie (czerwona dla reguły)
    } catch (e) {}
  } catch (e) {}
})();
