# certgui

A single-binary CLI tool that starts a local HTTP server and opens a web GUI
for inspecting, debugging and comparing TLS/PKI certificates.

## Features

- Analyse **X.509**, **PKCS#12**, **PKCS#7**, **CSR**, **CRL**, **private keys**
  and **JWK/JWKS** files
- Drag & drop or file-picker upload
- Automatic type detection — no need to pick a format manually
- Clear error and warning highlights: expired certs, weak keys, missing SANs, …
- Certificate chain reconstruction and visualisation
- Side-by-side diff between two certificates
- Export details as JSON or YAML
- Dark / light mode following the OS preference
- Single self-contained binary — no runtime dependencies

## Quick Start

```bash
# Install (build from source)
task build

# Run
./certgui
# → opens http://127.0.0.1:3000 in the default browser

# Custom port
./certgui --port 8443

# Do not open browser automatically
./certgui --no-open

# Warn when a certificate expires within 30 days (default 60)
./certgui --warn-days 30
```

## CLI Flags

| Flag | Alias | Default | Description |
|------|-------|---------|-------------|
| `--port` | `-p` | `3000` | HTTP port (auto-selects a free port if unavailable) |
| `--bind` | | `127.0.0.1` | Bind address |
| `--no-open` | | `false` | Skip automatic browser launch |
| `--warn-days` | | `60` | Days before expiry to emit a warning |
| `--version` | | | Print version and exit |

## Development

### Prerequisites

- [Go 1.26.2](https://go.dev) (managed via `.tool-versions` / asdf)
- [Bun 1.3.13](https://bun.sh)
- [Task](https://taskfile.dev) — `brew install go-task`

### Running locally

```bash
# Start Go backend (port 3000) + Vite HMR server (port 5173) in parallel
task dev
```

The Vite dev server proxies all `/api` requests to the Go backend at
`localhost:3000`, so the frontend always talks to the real API.

### Build

```bash
task build          # → ./certgui binary with embedded frontend
task release        # → cross-compiled binaries in release/
```

### Tests

```bash
task test           # all tests
task test:go        # Go unit tests + coverage report
task test:frontend  # Vitest
```

### Generate test fixtures

```bash
task testdata       # requires openssl in PATH
```

## Architecture

```
certgui/
├── cmd/certgui/          CLI entry point (cobra)
│   └── cli/              cobra commands and flag definitions
├── internal/
│   ├── model/            Shared JSON-serialisable data types
│   ├── analyzer/         Certificate parsing & validation (no HTTP)
│   └── server/           HTTP server, router, API handlers
├── web/                  Frontend (Vite + Lit + Tailwind + DaisyUI)
│   └── src/
│       ├── components/   Lit web components
│       ├── views/        Top-level views
│       └── api.ts        Typed API client
├── dist/                 Built frontend assets (git-ignored, go:embedded)
└── testdata/             Certificate fixtures for Go tests
```

## License

MIT
