/* Build per-language SEO folders for wfs.wolfiesites.com into store/site/.
 * en  -> /            + /policy/
 * <l> -> /<l>/        + /<l>/policy/
 * Adds canonical + hreflang + og:locale + translated <title>/<meta description>,
 * forces the active language (window.__WFS_LANG) so crawlers render that locale,
 * and emits sitemap.xml + robots.txt. Run: node store/build-site.cjs
 */
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, 'site');
const ORIGIN = 'https://wfs.wolfiesites.com';

// load the translation dicts (they assign onto a shared `window`)
global.window = {};
require(path.join(SITE, 'assets', 'i18n.js'));        // window.I18N, window.WFS_LANGS
require(path.join(SITE, 'assets', 'policy-i18n.js'));  // window.I18N_POLICY
const I = global.window.I18N;
const IP = global.window.I18N_POLICY;
const LANGS = global.window.WFS_LANGS.map(l => l.code);  // ['en','pl',...]

const SW = { en:'fonts', pl:'czcionki', fr:'polices', de:'Schriften', es:'fuentes', uk:'шрифти', ru:'шрифты', ro:'fonturi', it:'caratteri' };
const LOCALE = { en:'en_US', pl:'pl_PL', fr:'fr_FR', de:'de_DE', es:'es_ES', uk:'uk_UA', ru:'ru_RU', ro:'ro_RO', it:'it_IT' };
// Consent banner text (per language) — names what consent enables (WolfieEye + Google Analytics).
const BANNER = {
  en: 'We use analytics — WolfieEye (cookieless) and Google Analytics — only with your consent. Allow to enable them; a cookie remembers your choice.',
  pl: 'Używamy analityki — WolfieEye (bez ciasteczek) i Google Analytics — tylko za Twoją zgodą. Zezwól, aby włączyć; ciasteczko zapamięta Twój wybór.',
  fr: "Nous utilisons des analyses — WolfieEye (sans cookies) et Google Analytics — uniquement avec votre consentement. Autorisez pour les activer ; un cookie mémorise votre choix.",
  de: 'Wir nutzen Analyse — WolfieEye (cookielos) und Google Analytics — nur mit Ihrer Einwilligung. Zulassen zum Aktivieren; ein Cookie merkt sich Ihre Wahl.',
  es: 'Usamos analítica — WolfieEye (sin cookies) y Google Analytics — solo con tu consentimiento. Permite para activarla; una cookie recuerda tu elección.',
  uk: "Ми використовуємо аналітику — WolfieEye (без cookie) та Google Analytics — лише за вашою згодою. Дозвольте, щоб увімкнути; cookie запам'ятає ваш вибір.",
  ru: 'Мы используем аналитику — WolfieEye (без cookie) и Google Analytics — только с вашего согласия. Разрешите, чтобы включить; cookie запомнит ваш выбор.',
  ro: 'Folosim analiză — WolfieEye (fără cookie-uri) și Google Analytics — doar cu consimțământul dvs. Permiteți pentru a o activa; un cookie reține alegerea.',
  it: 'Usiamo analisi — WolfieEye (senza cookie) e Google Analytics — solo con il tuo consenso. Consenti per attivarle; un cookie ricorda la tua scelta.',
};

const homeTpl = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const policyTpl = fs.readFileSync(path.join(__dirname, 'policy.html'), 'utf8');

function strip(s){ return String(s||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(); }
function clip(s,n){ s=strip(s); if(s.length<=n) return s; var c=s.slice(0,n); var sp=c.lastIndexOf(' '); return (sp>40?c.slice(0,sp):c).replace(/[.,;:\s]+$/,'')+'…'; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pathFor(kind, l){ const base = l==='en' ? '/' : '/'+l+'/'; return kind==='policy' ? base+'policy/' : base; }

// alternates block (hreflang) shared by both page kinds
function alternates(kind){
  let out = LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${ORIGIN}${pathFor(kind,l)}">`).join('\n');
  out += `\n<link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathFor(kind,'en')}">`;
  return out;
}

function headBlock(kind, l, title, desc){
  const url = ORIGIN + pathFor(kind, l);
  const forced = l==='en' ? '' : `<script>window.__WFS_LANG=${JSON.stringify(l)};window.__WFS_KIND=${JSON.stringify(kind)};</script>\n`;
  const inner = [
    `<link rel="canonical" href="${url}">`,
    alternates(kind),
    `<meta property="og:locale" content="${LOCALE[l]||'en_US'}">`,
    forced
  ].join('\n');
  return `<!--wfs:i18n-->\n${inner}<!--/wfs:i18n-->`;
}

// apply head edits + absolute asset paths to a template
function render(tpl, kind, l, title, desc){
  let h = tpl;
  h = h.replace(/<!--wfs:i18n-->[\s\S]*?<!--\/wfs:i18n-->\n?/, ''); // idempotent: drop any prior injected block
  h = h.replace(/<html lang="[^"]*">/, `<html lang="${l}">`);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  h = h.replace(/<meta name="description" content="[\s\S]*?">/, `<meta name="description" content="${esc(desc)}">`);
  // og:title / og:description / og:url if present
  h = h.replace(/(<meta property="og:title" content=")[\s\S]*?(">)/, `$1${esc(title)}$2`);
  h = h.replace(/(<meta property="og:description" content=")[\s\S]*?(">)/, `$1${esc(desc)}$2`);
  h = h.replace(/(<meta property="og:url" content=")[\s\S]*?(">)/, `$1${ORIGIN}${pathFor(kind,l)}$2`);
  // inject canonical/hreflang/og:locale/forced-lang before </head>
  h = h.replace('</head>', headBlock(kind, l, title, desc) + '\n</head>');
  // absolute asset paths so sub-folders resolve correctly
  h = h.replace(/\.\/assets\//g, '/assets/');
  // make the consent banner match the page language + name what consent enables (GA + WolfieEye).
  // Idempotent: strip any previously-injected data-lang/data-text first, otherwise each rebuild
  // stacks another duplicate attribute on the consent <script>. (These attrs live only on that tag.)
  {
    h = h.replace(/\s+data-lang="[^"]*"/g, '').replace(/\s+data-text="[^"]*"/g, '');
    const bt = (BANNER[l] || BANNER.en).replace(/"/g, '&quot;');
    const extra = (l !== 'en' ? ` data-lang="${l}"` : '') + ` data-text="${bt}"`;
    h = h.replace('data-domain="wfs.wolfiesites.com"', `data-domain="wfs.wolfiesites.com"${extra}`);
  }
  return h;
}

function write(p, content){ fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, content); }

let pages = [];
for (const l of LANGS){
  const hd = I[l] || I.en, pd = IP[l] || IP.en;
  // HOME
  const htitle = l==='en'
    ? 'Wolfie Font Swapper — preview & swap fonts on any page'
    : `Wolfie Font Swapper — ${strip(hd.hero_t1)} ${SW[l]||'fonts'} ${strip(hd.hero_t2)}`.replace(/\s+/g,' ').trim();
  const hdesc = l==='en'
    ? 'A Chrome extension to preview and swap fonts live on any website — Google Fonts + system fonts, presets, per-domain rules, and copyable CSS/SCSS/JS. No tracking.'
    : clip(hd.hero_lead, 158);
  const homeOut = render(homeTpl, 'home', l, htitle, hdesc);
  const homePath = l==='en' ? path.join(SITE,'index.html') : path.join(SITE, l, 'index.html');
  write(homePath, homeOut);
  pages.push(pathFor('home', l));

  // POLICY
  const ptitle = l==='en'
    ? 'Privacy Policy — Wolfie Font Swapper'
    : `${strip(pd.pp_title)} — Wolfie Font Swapper`;
  const pdesc = clip(pd.pp_lead, 158);
  const polOut = render(policyTpl, 'policy', l, ptitle, pdesc);
  const polPath = l==='en' ? path.join(SITE,'policy','index.html') : path.join(SITE, l, 'policy', 'index.html');
  write(polPath, polOut);
  pages.push(pathFor('policy', l));
}

// Vanity aliases — English lives at root; /en/, /gb/, /us/ are region/lang shorthands
// people type by habit. Redirect them to the canonical page (works on any static host:
// canonical + noindex + meta-refresh + JS), so users land on / and Google consolidates.
function makeRedirect(from, to){
  const url = ORIGIN + to;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting… — Wolfie Font Swapper</title>
<link rel="canonical" href="${url}">
<meta name="robots" content="noindex,follow">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace(${JSON.stringify(to)});</script>
</head>
<body style="font:15px/1.6 system-ui,sans-serif;background:#0a0c11;color:#9aa3b2;padding:40px">
Redirecting to <a style="color:#00e0ff" href="${to}">wfs.wolfiesites.com${to}</a>…
</body>
</html>
`;
  write(path.join(SITE, from, 'index.html'), html);
}
makeRedirect('en', '/');
makeRedirect('gb', '/');
makeRedirect('us', '/');
makeRedirect(path.join('en','policy'), '/policy/');

// sitemap.xml (with hreflang alternates per URL)
function urlEntry(kind, l){
  const loc = ORIGIN + pathFor(kind, l);
  const alts = LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${ORIGIN}${pathFor(kind,x)}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathFor(kind,'en')}"/>`;
  return `  <url>\n    <loc>${loc}</loc>\n${alts}\n    <changefreq>monthly</changefreq>\n    <priority>${kind==='home'?(l==='en'?'1.0':'0.8'):'0.4'}</priority>\n  </url>`;
}
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
for (const kind of ['home','policy']) for (const l of LANGS) sm += urlEntry(kind, l) + '\n';
sm += '</urlset>\n';
write(path.join(SITE, 'sitemap.xml'), sm);

// robots.txt
write(path.join(SITE, 'robots.txt'),
`User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`);

console.log('Generated', pages.length, 'pages:', pages.join(' '));
console.log('+ sitemap.xml (', LANGS.length*2, 'urls) + robots.txt');
