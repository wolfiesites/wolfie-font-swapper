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
| `WPPW_UPLOAD_URL` | endpoint, np. `https://api.wppw.pl/v1/extensions/wolfie-font-swapper/releases` |
| `WPPW_API_KEY` | klucz API / licencyjny do api.wppw.pl |
| `WPPW_VISIBILITY` | (opc.) `private` (domyślnie) / `public` |
| `WPPW_ORG` | (opc.) slug superorg (domyślnie `wppw`) |

Bez `WPPW_UPLOAD_URL`/`WPPW_API_KEY` krok publish jest pomijany (pipeline zielony,
ZIP zostaje w artefaktach).

### Wersja
- Źródło prawdy: pole `version` w `manifest.json`.
- **Aktualna wersja: 1.0.0** (zaktualizuj tę linię przy każdym wydaniu).
- Przed merge do `production`: podbij `version` w `manifest.json`.

## api.wppw.pl — MCP (DO UZUPEŁNIENIA)

> Stan: **brak podłączonego MCP `api.wppw.pl`** w tej sesji i brak jego konfiguracji
> w `~/.claude.json`. Gdy podasz dane, uzupełnij tę sekcję i (opcjonalnie) wpis w
> `~/.claude.json` → `mcpServers`.

Docelowo api.wppw.pl ma:
- przechowywać **najnowszą paczkę (ZIP)** tego dodatku (prywatnie, superorg),
- pozwalać **listować** artefakty **publiczne i prywatne** za **kluczem
  licencyjnym / API key**.

Do wypełnienia, gdy znane:
- **MCP**: nazwa serwera, transport (stdio/HTTP/SSE), URL, sposób auth.
- **API**: endpoint uploadu (→ `WPPW_UPLOAD_URL`), schemat auth (Bearer?),
  format payloadu (multipart `file`/`name`/`version`/`visibility`/`org`?),
  endpoint listujący (public/private), pole klucza licencyjnego.

## Konwencje repo
- `origin` = GitLab `pw-chrome` (prywatne). `github` = `wolfiesites` (publiczne).
  **Nie commituj realnych ID afiliacyjnych ani kluczy** — placeholdery puste
  (patrz `AFFILIATE.md`).
- Po edycji JS: `node --check <plik>`.
- i18n: 9 języków w `i18n.js` — każdy nowy klucz dodaj do wszystkich.
- Dokumentacja: `docs/` (how-to-publish, how-to-extension-pay, how-cj-works,
  how-fonts-works), `AFFILIATE.md`. Materiały do listingu: `assets/`, `store/`.
