# AGENTS.md — Instructions for AI Coding Agents

This file provides context, rules, and guidelines for AI agents working on the
`certgui` codebase.

---

## Project Overview

`certgui` is a single-binary CLI tool written in Go. It starts a local HTTP
server and automatically opens a web GUI in the default browser. The GUI lets
users load, inspect and debug TLS/PKI certificates of many formats.

Full specification: [`spec/spec.md`](spec/spec.md)

---

## Repository Layout

```
certgui/
├── cmd/certgui/          Go entrypoint (cobra CLI)
├── internal/
│   ├── model/            Shared data structures (JSON-serialisable)
│   ├── analyzer/         Certificate parsing & validation logic (no HTTP)
│   └── server/           HTTP server, router, API handlers
├── web/                  Frontend source (Vite + Lit + Tailwind + DaisyUI)
│   └── src/
│       ├── components/   Lit web components
│       ├── views/        Top-level view components
│       ├── api.ts        Typed API client
│       └── main.ts       Application entry
├── dist/                 Built frontend assets (git-ignored, embedded in binary)
├── testdata/             Certificate fixtures for Go tests
├── spec/                 Project specifications (git-ignored)
├── Taskfile.yml          Task runner (https://taskfile.dev)
├── go.mod / go.sum
└── AGENTS.md             This file
```

---

## Language & Style Rules

- **All code, comments, documentation and commit messages MUST be in English.**
- Go: follow standard `gofmt`/`goimports` formatting. Use `golangci-lint` conventions.
- TypeScript: use strict mode. Prefer `const`, avoid `any`.
- No dead code, no commented-out code blocks, no TODO left unfixed at commit time.

---

## Commit Convention

Use **Conventional Commits** (https://www.conventionalcommits.org):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`

Scopes: `cli`, `model`, `analyzer`, `server`, `web`, `deps`, `config`

Examples:
```
feat(analyzer): add PKCS#12 parser with password support
fix(server): return 400 when base64 content is malformed
test(analyzer): add fixtures for expired and weak-key certificates
chore(deps): upgrade go-pkcs12 to v0.4.0
```

---

## Architecture Rules

### Go backend

1. **No business logic in HTTP handlers.** Handlers only decode/encode; all
   logic lives in `internal/analyzer/` or `internal/model/`.
2. **`internal/analyzer/` has zero HTTP dependencies.** It must be fully
   testable without starting a server.
3. **`internal/model/` has zero external dependencies.** Only stdlib types.
4. All exported functions must have a doc comment.
5. Avoid `panic` in production code paths; return errors.
6. The HTTP server must enforce a **10 MB** body size limit on all POST routes.
7. CORS headers are only added when the server is started in dev mode
   (`--dev` internal flag, not exposed to end users).

### Frontend

1. All UI state lives in `<cg-app>` as Lit `@state()` properties.
2. Child components communicate upward via `CustomEvent` bubbling only.
3. No direct `fetch` calls outside `web/src/api.ts`.
4. DaisyUI component classes only; no arbitrary Tailwind colour overrides
   unless strictly necessary.
5. Dark/light mode follows `prefers-color-scheme`; a manual toggle is
   available in the header.

---

## Build & Dev Workflow

### Prerequisites

- Go 1.26.2 (`asdf` / `.tool-versions`)
- Bun 1.3.13 (`asdf` / `.tool-versions`)
- [Task](https://taskfile.dev) (`brew install go-task`)

### Common tasks

```bash
task dev              # hot-reload: Vite dev server + Go server in parallel
task build            # full build → single certgui binary with embedded assets
task test             # all Go and frontend tests
task test:go          # Go tests with coverage report
task test:frontend    # Vitest
task lint             # go vet + staticcheck + bun lint
task release          # cross-compile for all platforms → dist/
```

### Local dev flow

- Vite runs on port **5173** and proxies `/api` → `localhost:3000`.
- The Go server runs with `--no-open --port 3000` during development.
- CORS is enabled in dev mode so the Vite origin is allowed.

---

## API Contract

All API endpoints are under `/api/v1/`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/analyze` | Analyse a certificate file |
| GET  | `/api/v1/health`  | Health check |
| GET  | `/api/v1/version` | Returns tool version |

Request body for `POST /api/v1/analyze`:

```json
{
  "filename": "cert.pem",
  "content": "<base64-encoded bytes>",
  "password": "optional — only for PKCS#12"
}
```

---

## Supported Certificate Formats

| Format | Extensions | Detection |
|--------|-----------|-----------|
| X.509 PEM | `.pem` `.crt` `.cer` | `-----BEGIN CERTIFICATE-----` |
| X.509 DER | `.der` `.cer` | ASN.1 magic bytes |
| PKCS#12 | `.p12` `.pfx` | Binary, go-pkcs12 parse |
| PKCS#7 | `.p7b` `.p7c` | PEM header |
| CSR | `.csr` `.req` | PEM header |
| CRL | `.crl` | PEM header |
| Private key | `.key` | PEM header |
| JWK / JWKS | `.json` | JSON `kty` field |
| Bundle | any | Multiple PEM blocks |

---

## Issue Codes

| Code | Severity | Condition |
|------|----------|-----------|
| `CERT_EXPIRED` | error | `NotAfter` < now |
| `CERT_EXPIRING_SOON` | warning | `NotAfter` < now + warnDays |
| `WEAK_SIGNATURE_MD5` | error | MD5 signature algorithm |
| `WEAK_SIGNATURE_SHA1` | error | SHA-1 signature algorithm |
| `WEAK_KEY_RSA` | error | RSA key < 2048 bits |
| `WEAK_KEY_EC` | error | EC key < 256 bits |
| `SELF_SIGNED` | warning | Subject == Issuer |
| `MISSING_SAN` | warning | No SAN extension, CN only |
| `INCOMPLETE_CHAIN` | warning | Issuer not found among loaded certs |
| `INVALID_KEY_USAGE` | error | KeyUsage incompatible with ExtKeyUsage |
| `REVOCATION_NOT_CHECKED` | info | OCSP/CRL URLs present but not verified |

---

## Security Notes

- The server **binds to `127.0.0.1` by default** — never exposed to the
  network unless the user explicitly passes `--bind 0.0.0.0`.
- Private key material is sent to the local Go server for analysis. This is
  acceptable because the tool is local-only by design; a warning is shown in
  the UI when a private key is detected.
- Validate and sanitise all inputs at the API boundary. The analyzer itself
  should never panic on malformed input.
- Do **not** log certificate content or private key material to stdout/stderr.

---

## Testing Conventions

- Place Go test files next to the code they test (`*_test.go`).
- Certificate fixtures live in `testdata/`; generate them with
  `testdata/generate.sh` (requires `openssl`).
- Every new Issue code must have a corresponding test fixture and test case.
- Frontend tests use Vitest; component tests render into `document.body` and
  assert on shadow DOM.
