# CLAUDE.md — Wolfie Font Swapper

Kontekst dla Claude Code przy pracy nad tym repo.

## Co to jest
Rozszerzenie Chrome (Manifest V3) do podglądu/podmiany fontów na dowolnej
stronie: Google Fonts + fonty systemowe, presety, reguły per-domena, kopiowalny
CSS/@font-face, tagi licencji (Web-safe / Free / Premium / System), 9 języków.
Subskrypcja **Pro** (ExtensionPay) odblokowuje nielimitowane presety.

## Wydanie / publikacja (branch `production`)

Przepływ: pracujesz na `main` → merge do **`production`** → GitLab CI
(`.gitlab-ci.yml`) automatycznie:
1. **build:zip** — buduje paczkę rozszerzenia (wszystkie śledzone pliki MINUS
   `docs/`, `assets/`, `store/`, `*.md`, `CLAUDE.md`, `.gitignore`,
   `.gitlab-ci.yml`) jako `wolfie-font-swapper-<version>.zip` (artefakt + do CWS).
2. **publish:wppw** — wysyła ZIP do **api.wppw.pl** (prywatnie, za kluczem API).

### Zmienne CI/CD (GitLab → Settings → CI/CD → Variables; Masked + Protected)
| Zmienna | Opis |
|---|---|
| `WPPW_SERVICE_KEY` | **wymagana** — service key (X-Service-Key, scope `products.write`); mint przez `mint_service_key` |
| `WPPW_UPLOAD_URL` | (opc.) domyślnie `https://api.wppw.pl/api/service/products/wolfie-font-swapper/releases` |
| `WPPW_UPLOADER_EMAIL` | (opc.) e-mail do audit logu (domyślnie `wit.paw4@gmail.com`) |

Bez `WPPW_SERVICE_KEY` krok publish jest pomijany (pipeline zielony, ZIP w artefaktach).

### Architektura wdrożenia (DZIAŁA)
- **Runner:** self-hosted GitLab runner na **zima** (kontener `gitlab-runner-wfs`,
  docker executor, `network_mode=platform`, tag `zima`, config `/opt/gitlab-runner-wfs`).
  `publish:wppw` ma `tags: [zima]` → leci na nim; `build:zip` na shared runnerach.
- **Upload wewnętrzny:** `WPPW_UPLOAD_URL=http://api-wppw:3000/api/service/products/wolfie-font-swapper/releases`
  (sieć docker `platform`) — omija Cloudflare. api-wppw słucha na **:3000**.
- **CSRF:** SvelteKit (adapter-node bez `ORIGIN` env) liczy `url.origin` jako
  **https + host**. Multipart POST bez pasującego Origin → 403
  „Cross-site POST form submissions are forbidden". Dlatego CI wysyła
  `Origin: https://<host>` (host z URL, schemat wymuszony na https). **To był
  prawdziwy powód 403 — nie Cloudflare.**
- **Produkt:** prywatny (`private:true`), status `available`, vendor
  *WolfieCloud Managed*. Pobranie wymaga **klucza licencyjnego** (license-gated).
- **Dostęp superorg:** comp-license dla `externalOrgId=wolfie-superorg`
  (klucz `WOLF-…`, trzymany poza repo).

Pełen cykl: merge `main`→`production` → `build:zip` (shared) → `publish:wppw`
(zima, internal) → release w rejestrze api.wppw.pl. Ta sama wersja = **409**
(podbij `version` w `manifest.json`).

Kontrakt API (z `wolfie-platform/apps/api-wppw`): `POST /api/service/products/<slug>/releases`,
multipart: `version`, `sha256` (64 hex, SHA-256 ZIP-a), `uploaderEmail`, `file`
(+ opc. `productName`, `uploadOrigin`, `metadata`). Header `X-Service-Key`.
Produkt **auto-tworzy się** po slug przy 1. uploadzie. Ta sama wersja = **409**
(podbij `version`).

### Wersja
- Źródło prawdy: pole `version` w `manifest.json`.
- **Aktualna wersja: 1.0.1** (zaktualizuj tę linię przy każdym wydaniu).
- Przed merge do `production`: podbij `version` w `manifest.json`.

## api.wppw.pl — WolfieGuard (licensing + software registry)

To **WolfieGuard** — platforma licencyjna + rejestr oprogramowania (publiczne
**i** prywatne, license-gated). Źródło: `wolfie-platform/apps/api-wppw` (na WSL).
Globalny opis MCP: WSL `~/.claude/CLAUDE.md`.

- **MCP:** `POST https://api.wppw.pl/api/mcp` (JSON-RPC 2.0), auth `Authorization:
  Bearer wgmcp_…`. **Skonfigurowany pod WSL**, nie w natywnym Windows — narzędzia
  MCP (`create_product`, `issue_license`, `mint_service_key`, `list_products`,
  `set_product_visibility`, …) wołaj z sesji Claude w WSL.
- **Upload release'u (CI):** `POST /api/service/products/<slug>/releases` z
  `X-Service-Key` — patrz „Wydanie" wyżej.
- **Listowanie publiczne i prywatne** (czego chce właściciel): przez MCP
  (`list_products` / `get_product` / `list_releases`) lub klucz licencyjny;
  prywatne pobrania są license-gated (`issue_license`, `kind:comp` dla wewn.).

### Setup (jednorazowo, z WSL przez MCP)
1. (opc.) `create_product { slug:"wolfie-font-swapper", type:"custom-software",
   private:true, name, description }` — lub pozwól auto-utworzyć przy 1. uploadzie,
   potem `set_product_visibility { visibility:"private" }`.
2. `mint_service_key` (scope `products.write`) → wartość do GitLab CI/CD var
   `WPPW_SERVICE_KEY`.
3. Merge do `production` → CI wysyła release.
4. Dostęp prywatny: `issue_license` (np. `kind:"comp"` dla superorg).

> **Sekrety** (wgmcp_/service/license keys) zwracane są **raz** — zapisz od razu.
> Nigdy nie commituj ich do repo; trzymaj w GitLab CI/CD vars lub WSL config.

## Konwencje repo
- `origin` = GitLab `pw-chrome` (prywatne). `github` = `wolfiesites` (publiczne).
  **Nie commituj realnych ID afiliacyjnych ani kluczy** — placeholdery puste
  (patrz `AFFILIATE.md`).
- Po edycji JS: `node --check <plik>`.
- i18n: 9 języków w `i18n.js` — każdy nowy klucz dodaj do wszystkich.
- Dokumentacja: `docs/` (how-to-publish, how-to-extension-pay, how-cj-works,
  how-fonts-works), `AFFILIATE.md`. Materiały do listingu: `assets/`, `store/`.
