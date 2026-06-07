// @ts-nocheck
/**
 * WolfieEye Consent SDK — cookie banner + tracker gate, with a programmatic API.
 *
 * THREE integration modes (pick one):
 *
 *  1) Hosted drop-in (simplest, zero-maintenance):
 *       <script defer src="https://eye.wolfiecloud.com/consent.js"
 *               data-domain="example.com"></script>
 *     Downside: ad-blockers may block the eye.wolfiecloud.com domain.
 *
 *  2) Self-hosted drop-in (first-party, ad-block-resistant — RECOMMENDED for
 *     sites that care about consent UX surviving blockers):
 *     Serve THIS file from your OWN domain (e.g. /consent.js) and point the
 *     tracker at WolfieEye explicitly:
 *       <script defer src="/consent.js"
 *               data-domain="example.com"
 *               data-eye="https://eye.wolfiecloud.com/eye.js"></script>
 *
 *  3) Custom UI (full control — bring your own banner):
 *     Load with data-auto="0" (or call WolfieConsent.init({autoBanner:false}))
 *     and drive it from your own UI via the API below. Works first-party too.
 *
 * Programmatic API — window.WolfieConsent:
 *   .init(opts)        configure + start (opts override data-* attributes)
 *   .status()          'granted' | 'denied' | 'unset' | 'dnt'
 *   .grant()           record consent, load the tracker
 *   .deny()            record refusal
 *   .reset()           clear the choice (auto-banner: re-show it)
 *   .onChange(fn)      subscribe to status changes; returns an unsubscribe fn
 *   .showBanner() / .hideBanner()   (auto-banner mode only)
 *
 * Back-compat: window.wolfieConsent('reset'|'accept'|'decline'|'status') still
 * works (and queued pre-load calls via wolfieConsent.q are replayed).
 *
 * data-* options (all optional except data-domain):
 *   data-domain, data-eye, data-cookie (default we_consent), data-position
 *   (bottom-left|bottom-right|bottom; default bottom-left), data-text, data-lang,
 *   data-allow, data-decline, data-policy, data-accent, data-accent2,
 *   data-respect-dnt ("0" to ignore DNT/GPC), data-days (cookie lifetime),
 *   data-auto ("0" = API only, no banner).
 */
(function () {
  'use strict';

  var BANNER = {
    en: { t: 'We use <strong>WolfieEye</strong> — cookieless, privacy-friendly analytics. A single cookie remembers your choice.', a: 'Allow', d: 'Decline' },
    pl: { t: 'Używamy <strong>WolfieEye</strong> — cookieless, przyjaznej prywatności analityki. Jedno cookie zapamiętuje Twój wybór.', a: 'Zezwól', d: 'Odrzuć' },
    fr: { t: "Nous utilisons <strong>WolfieEye</strong> — une analyse sans cookies et respectueuse de la vie privée. Un seul cookie mémorise votre choix.", a: 'Autoriser', d: 'Refuser' },
    de: { t: 'Wir nutzen <strong>WolfieEye</strong> — cookielose, datenschutzfreundliche Analyse. Ein einzelnes Cookie merkt sich deine Wahl.', a: 'Zulassen', d: 'Ablehnen' },
    es: { t: 'Usamos <strong>WolfieEye</strong> — analítica sin cookies y respetuosa con la privacidad. Una sola cookie recuerda tu elección.', a: 'Permitir', d: 'Rechazar' },
    uk: { t: "Ми використовуємо <strong>WolfieEye</strong> — аналітику без cookies, дружню до приватності. Один cookie запам'ятовує твій вибір.", a: 'Дозволити', d: 'Відхилити' },
    ru: { t: 'Мы используем <strong>WolfieEye</strong> — аналитику без cookies, дружественную к приватности. Один cookie запоминает ваш выбор.', a: 'Разрешить', d: 'Отклонить' },
    ro: { t: 'Folosim <strong>WolfieEye</strong> — analiză fără cookie-uri, prietenoasă cu confidențialitatea. Un singur cookie reține alegerea ta.', a: 'Permite', d: 'Respinge' },
    it: { t: 'Usiamo <strong>WolfieEye</strong> — analisi senza cookie e rispettosa della privacy. Un solo cookie ricorda la tua scelta.', a: 'Consenti', d: 'Rifiuta' },
  };

  var cfg = null;
  var loaded = false;
  var listeners = [];
  var elId = 'we-consent';

  // ─── primitives ──────────────────────────────────────────────────────────
  function gc(n) { return (document.cookie.match('(^|; )' + n + '=([^;]*)') || [])[2]; }
  function sc(n, v, days) { document.cookie = n + '=' + v + ';path=/;max-age=' + (days * 86400) + ';SameSite=Lax'; }
  function dntOn() {
    return navigator.doNotTrack == '1' || window.doNotTrack == '1' ||
           navigator.msDoNotTrack == '1' || navigator.globalPrivacyControl === true;
  }
  function statusFor() {
    if (cfg.respect && dntOn()) return 'dnt';
    var c = gc(cfg.cookie);
    return c === '1' ? 'granted' : c === '0' ? 'denied' : 'unset';
  }
  function emit(s) { for (var i = 0; i < listeners.length; i++) { try { listeners[i](s); } catch (e) { /* ignore */ } } }

  function loadTracker() {
    if (loaded) return; loaded = true;
    var t = document.createElement('script');
    t.defer = true; t.src = cfg.eye; t.setAttribute('data-domain', cfg.domain);
    document.head.appendChild(t);
  }

  // ─── banner UI (auto-banner mode) ────────────────────────────────────────
  function removeBanner() { var e = document.getElementById(elId); if (e) e.remove(); }
  function injectCss() {
    if (document.getElementById('we-consent-css')) return;
    var posCss = cfg.position === 'bottom-left' ? 'left:16px;right:auto;'
               : cfg.position === 'bottom' ? 'left:16px;right:16px;margin:0 auto;'
               : cfg.position === 'bottom-right' ? 'right:16px;left:auto;'
               : 'left:16px;right:auto;';
    var css =
      '#' + elId + '{position:fixed;bottom:16px;' + posCss + 'z-index:2147483600;max-width:560px;' +
      'display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:nowrap;' +
      'background:#15181f;color:#e9ecf3;border:1px solid #323a48;border-radius:14px;padding:13px 16px;' +
      'font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'box-shadow:0 24px 70px -24px rgba(0,0,0,.7)}' +
      '#' + elId + ' p{margin:0;color:#9aa3b2;flex:1;min-width:0}' +
      '#' + elId + ' strong{color:#e9ecf3}' +
      '#' + elId + ' a{color:' + cfg.accent + ';text-decoration:none}' +
      '#' + elId + ' .we-bt{display:flex;gap:8px;flex:none}' +
      '#' + elId + ' button{border-radius:9px;padding:8px 15px;font:inherit;font-weight:600;cursor:pointer;border:1px solid transparent;white-space:nowrap}' +
      '#' + elId + ' .we-ok{background:linear-gradient(135deg,' + cfg.accent + ',' + cfg.accent2 + ');color:#06080d}' +
      '#' + elId + ' .we-no{background:transparent;border:1px solid #323a48;color:#9aa3b2}' +
      '#' + elId + ' .we-no:hover{color:#fff;border-color:' + cfg.accent + '}' +
      '@media(max-width:560px){#' + elId + '{left:12px;right:12px;flex-wrap:wrap}#' + elId + ' p{flex:1 1 100%}}';
    var st = document.createElement('style'); st.id = 'we-consent-css'; st.textContent = css;
    document.head.appendChild(st);
  }
  function showBanner() {
    if (!cfg.autoBanner) return;
    if (!document.body) { document.addEventListener('DOMContentLoaded', showBanner, { once: true }); return; }
    removeBanner();
    injectCss();
    var wrap = document.createElement('div');
    wrap.id = elId; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', 'Cookie consent');
    var link = cfg.policy ? ' <a href="' + cfg.policy + '">Privacy</a>' : '';
    wrap.innerHTML =
      '<p>' + cfg.text + link + '</p>' +
      '<span class="we-bt">' +
        '<button type="button" class="we-no">' + cfg.decline + '</button>' +
        '<button type="button" class="we-ok">' + cfg.allow + '</button>' +
      '</span>';
    wrap.querySelector('.we-ok').addEventListener('click', function () { W.grant(); });
    wrap.querySelector('.we-no').addEventListener('click', function () { W.deny(); });
    (document.body || document.documentElement).appendChild(wrap);
  }

  function start(force) {
    var st = statusFor();
    if (st === 'dnt') return;                 // respect no-tracking signal
    if (st === 'granted') { loadTracker(); return; }
    if (st === 'denied' && !force) return;
    showBanner();                              // no-op when autoBanner is off
  }

  // ─── public API ──────────────────────────────────────────────────────────
  var W = {
    status: function () { return cfg ? statusFor() : 'unset'; },
    grant: function () { sc(cfg.cookie, '1', cfg.days); removeBanner(); loadTracker(); emit('granted'); return W; },
    deny: function () { sc(cfg.cookie, '0', cfg.days); removeBanner(); emit('denied'); return W; },
    reset: function () { document.cookie = cfg.cookie + '=;path=/;max-age=0'; loaded = false; emit('unset'); start(true); return W; },
    onChange: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
      return function () { var i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
    },
    showBanner: function () { start(true); return W; },
    hideBanner: function () { removeBanner(); return W; },
    init: function (opts) { cfg = resolveConfig(opts || {}); if (!cfg.domain) { console.warn('[WolfieConsent] missing domain'); return W; } start(false); return W; },
  };

  function resolveConfig(opts) {
    var s = document.currentScript;
    function attr(k) { return s ? s.getAttribute('data-' + k) : null; }
    function pick(optKey, dataKey, def) {
      if (opts[optKey] != null) return opts[optKey];
      var v = attr(dataKey);
      return v == null ? def : v;
    }
    var origin = (function () { try { return new URL(s.src).origin; } catch (e) { return ''; } })();
    var lang = (pick('lang', 'lang', '') || (navigator.language || 'en')).slice(0, 2).toLowerCase();
    var L = BANNER[lang] || BANNER.en;
    return {
      domain: pick('domain', 'domain', ''),
      eye: pick('eye', 'eye', origin + '/eye.js'),
      cookie: pick('cookie', 'cookie', 'we_consent'),
      position: pick('position', 'position', 'bottom-left'),
      text: pick('text', 'text', L.t),
      allow: pick('allow', 'allow', L.a),
      decline: pick('decline', 'decline', L.d),
      policy: pick('policy', 'policy', ''),
      accent: pick('accent', 'accent', '#00e0ff'),
      accent2: pick('accent2', 'accent2', '#ff3dae'),
      respect: pick('respectDnt', 'respect-dnt', '1') !== '0' && opts.respectDnt !== false,
      days: parseInt(pick('days', 'days', '365'), 10) || 365,
      autoBanner: opts.autoBanner != null ? !!opts.autoBanner : attr('auto') !== '0',
    };
  }

  // ─── expose API + legacy function + replay queued calls ──────────────────
  function legacy(cmd) {
    if (cmd === 'reset') return W.reset();
    if (cmd === 'accept' || cmd === 'grant') return W.grant();
    if (cmd === 'decline' || cmd === 'deny') return W.deny();
    if (cmd === 'status') return W.status();
  }
  var prev = window.wolfieConsent;
  window.wolfieConsent = legacy;
  window.WolfieConsent = W;
  if (prev && prev.q) prev.q.forEach(function (a) { legacy.apply(null, a); });

  // Auto-init when used as a drop-in (its own <script> carries data-domain).
  var self = document.currentScript;
  if (self && self.getAttribute('data-domain')) W.init();
})();
