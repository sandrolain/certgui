#!/usr/bin/env bash
# testdata/generate.sh
#
# Generates certificate test fixtures using the openssl CLI.
# Run from the repository root:
#   bash testdata/generate.sh
#
# Requires: openssl ≥ 1.1.1

set -euo pipefail

OUTDIR="$(dirname "$0")"

echo "==> Generating test fixtures in $OUTDIR"

# ── RSA self-signed certificate (PEM) ────────────────────────────────────────
openssl req -x509 -newkey rsa:2048 -keyout "$OUTDIR/rsa.key.pem" \
  -out "$OUTDIR/rsa.crt.pem" -days 3650 -nodes \
  -subj "/CN=test-rsa/O=TestOrg/C=US" 2>/dev/null
echo "  rsa.key.pem + rsa.crt.pem"

# ── EC self-signed certificate (PEM) ─────────────────────────────────────────
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 \
  -keyout "$OUTDIR/ec.key.pem" -out "$OUTDIR/ec.crt.pem" \
  -days 3650 -nodes -subj "/CN=test-ec/O=TestOrg/C=US" 2>/dev/null
echo "  ec.key.pem + ec.crt.pem"

# ── RSA certificate in DER format ─────────────────────────────────────────────
openssl x509 -in "$OUTDIR/rsa.crt.pem" -outform DER -out "$OUTDIR/rsa.crt.der" 2>/dev/null
echo "  rsa.crt.der"

# ── Certificate Signing Request ───────────────────────────────────────────────
openssl req -new -key "$OUTDIR/rsa.key.pem" -out "$OUTDIR/rsa.csr.pem" \
  -subj "/CN=test-csr/O=TestOrg/C=US" 2>/dev/null
echo "  rsa.csr.pem"

# ── CA + intermediate + leaf chain ────────────────────────────────────────────
# Root CA
openssl req -x509 -newkey rsa:2048 -keyout "$OUTDIR/ca.key.pem" \
  -out "$OUTDIR/ca.crt.pem" -days 3650 -nodes \
  -subj "/CN=Test Root CA/O=TestOrg/C=US" 2>/dev/null

# Leaf signed by CA
openssl req -newkey rsa:2048 -keyout "$OUTDIR/leaf.key.pem" \
  -out "$OUTDIR/leaf.csr.pem" -nodes \
  -subj "/CN=leaf.example.com/O=TestOrg/C=US" 2>/dev/null
openssl x509 -req -in "$OUTDIR/leaf.csr.pem" -CA "$OUTDIR/ca.crt.pem" \
  -CAkey "$OUTDIR/ca.key.pem" -CAcreateserial \
  -out "$OUTDIR/leaf.crt.pem" -days 365 2>/dev/null
echo "  ca.crt.pem + leaf.crt.pem"

# Bundle (chain)
cat "$OUTDIR/leaf.crt.pem" "$OUTDIR/ca.crt.pem" > "$OUTDIR/bundle.pem"
echo "  bundle.pem"

# ── PKCS#12 ───────────────────────────────────────────────────────────────────
openssl pkcs12 -export -in "$OUTDIR/rsa.crt.pem" -inkey "$OUTDIR/rsa.key.pem" \
  -out "$OUTDIR/test.p12" -passout pass:testpassword 2>/dev/null
echo "  test.p12 (password: testpassword)"

# ── CRL ───────────────────────────────────────────────────────────────────────
# Create a minimal CRL signed by the CA
openssl ca -gencrl -keyfile "$OUTDIR/ca.key.pem" -cert "$OUTDIR/ca.crt.pem" \
  -out "$OUTDIR/test.crl.pem" -crldays 30 \
  -config /dev/stdin <<'EOF' 2>/dev/null || true
[ ca ]
default_ca = CA_default
[ CA_default ]
database = /dev/null
new_certs_dir = /tmp
default_md = sha256
policy = policy_any
[ policy_any ]
countryName = optional
organizationName = optional
commonName = optional
EOF
# Fallback: create an empty CRL manually if openssl ca fails
if [ ! -f "$OUTDIR/test.crl.pem" ]; then
  echo "  (skipping CRL — openssl ca not configured)"
fi

echo "==> Done."
