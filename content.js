// Auto-stosowanie fontów na stronie wg konfigu domeny (sesja/trwały) lub
// pasującej reguły (glob na URL/host). Działa przy ładowaniu — bez popupu.
(async function () {
  const STYLE_ID = "wolfie-font-swapper-style";

  function globToRegex(p) {
    return new RegExp(
      "^" + String(p).trim().replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
      "i"
    );
  }
  function matchRule(rules, url, host) {
    for (const r of rules || []) {
      if (!r || !r.pattern) continue;
      try {
        const re = globToRegex(r.pattern);
        if ((url && re.test(url)) || (host && re.test(host))) return r;
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
  function decl(p) {
    const d = [];
    if (p.family) d.push("font-family:" + q(p.family) + " !important");
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
    if (hasProps(sel.base))
      out.push(
        ':where(body, body *):not(:where(i,[class*="icon"],[class*="Icon"],[class*="material-"])) { ' +
          decl(sel.base) + " }"
      );
    if (hasProps(sel.headings))
      out.push("h1,h2,h3,h4,h5,h6,h1 *,h2 *,h3 *,h4 *,h5 *,h6 * { " + decl(sel.headings) + " }");
    if (hasProps(sel.paragraphs)) out.push("p, p * { " + decl(sel.paragraphs) + " }");
    if (hasProps(sel.navigation)) {
      const nb = ["nav", '[role="navigation"]', ".navbar", ".navbar-nav", ".nav", ".nav-menu", ".navmenu", ".navigation", ".menu", ".main-menu", ".main-nav", ".primary-menu", ".primary-nav", ".site-nav", ".topnav", ".top-nav", ".menu-list", "#nav", "#navbar", "#menu", "#navigation", "#main-nav", "#primary-menu", "header ul"];
      out.push(nb.map((s) => s + ", " + s + " *").join(", ") + " { " + decl(sel.navigation) + " }");
    }
    if (hasProps(sel.buttons)) {
      const bb = ["button", '[role="button"]', ".btn", ".button", 'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]'];
      out.push(bb.map((s) => s + ", " + s + " *").join(", ") + " { " + decl(sel.buttons) + " }");
    }
    return out.join("\n");
  }
  function faceCss(sel, cache, custom) {
    const fams = [...new Set(Object.values(sel).map((p) => p.family).filter(Boolean))];
    const map = (cache && cache.map) || {};
    let css = "";
    for (const f of fams) {
      const low = f.toLowerCase();
      if (map[low]) css += map[low] + "\n";
      const c = custom && custom[low];
      if (c) css += (typeof c === "string" ? c : c.css) + "\n";
    }
    return css;
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
    if (!sel) {
      const r = matchRule(local.wfs_rules || [], url, host);
      if (r) {
        const ps = (local.wfs_presets || []).find((p) => p.name === r.preset);
        if (ps) sel = ps.selection;
      }
    }
    if (!hasAny(sel)) return;
    const css = faceCss(sel, local.wfs_font_cache, local.wfs_custom_fonts) + "\n" + buildRules(sel);
    let st = document.getElementById(STYLE_ID);
    if (!st) {
      st = document.createElement("style");
      st.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(st);
    }
    st.textContent = css;
    try {
      chrome.runtime.sendMessage({ type: "wfs-active" }); // zielona kropka na ikonie
    } catch (e) {}
  } catch (e) {}
})();
