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

# ── Server certificate with SAN + EKU serverAuth ─────────────────────────────
openssl req -x509 -newkey rsa:2048 -keyout "$OUTDIR/server.key.pem" \
  -out "$OUTDIR/server.crt.pem" -days 3650 -nodes \
  -subj "/CN=example.com/O=TestOrg/C=US" \
  -addext "subjectAltName=DNS:example.com,DNS:www.example.com,IP:127.0.0.1" \
  -addext "extendedKeyUsage=serverAuth" 2>/dev/null
echo "  server.key.pem + server.crt.pem (SAN: example.com, serverAuth)"

# ── Client certificate with email SAN + EKU clientAuth ───────────────────────
openssl req -x509 -newkey rsa:2048 -keyout "$OUTDIR/client.key.pem" \
  -out "$OUTDIR/client.crt.pem" -days 3650 -nodes \
  -subj "/CN=client/O=TestOrg/C=US" \
  -addext "subjectAltName=email:client@example.com" \
  -addext "extendedKeyUsage=clientAuth" 2>/dev/null
echo "  client.key.pem + client.crt.pem (email SAN, clientAuth)"

# ── Expired certificate ───────────────────────────────────────────────────────
openssl req -newkey rsa:2048 -keyout "$OUTDIR/expired.key.pem" \
  -out "$OUTDIR/expired.csr.pem" -nodes \
  -subj "/CN=expired.example.com/O=TestOrg/C=US" 2>/dev/null
openssl x509 -req -in "$OUTDIR/expired.csr.pem" \
  -signkey "$OUTDIR/expired.key.pem" \
  -out "$OUTDIR/expired.crt.pem" \
  -not_before 20200101000000Z -not_after 20201231235959Z 2>/dev/null
rm -f "$OUTDIR/expired.csr.pem"
echo "  expired.key.pem + expired.crt.pem (already expired)"

# ── 3-level chain: root CA → intermediate CA → leaf ──────────────────────────
# Intermediate CA signed by root CA
openssl req -newkey rsa:2048 -keyout "$OUTDIR/intermediate.key.pem" \
  -out "$OUTDIR/intermediate.csr.pem" -nodes \
  -subj "/CN=Test Intermediate CA/O=TestOrg/C=US" 2>/dev/null

printf 'basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign\n' \
  > /tmp/certgui_ca_ext.cnf
openssl x509 -req -in "$OUTDIR/intermediate.csr.pem" \
  -CA "$OUTDIR/ca.crt.pem" -CAkey "$OUTDIR/ca.key.pem" -CAcreateserial \
  -out "$OUTDIR/intermediate.crt.pem" -days 3650 \
  -extfile /tmp/certgui_ca_ext.cnf 2>/dev/null
rm -f /tmp/certgui_ca_ext.cnf

# Leaf cert signed by intermediate CA
openssl req -newkey rsa:2048 -keyout "$OUTDIR/leaf-int.key.pem" \
  -out "$OUTDIR/leaf-int.csr.pem" -nodes \
  -subj "/CN=leaf-int.example.com/O=TestOrg/C=US" 2>/dev/null

printf 'subjectAltName=DNS:leaf-int.example.com\nextendedKeyUsage=serverAuth\n' \
  > /tmp/certgui_leaf_ext.cnf
openssl x509 -req -in "$OUTDIR/leaf-int.csr.pem" \
  -CA "$OUTDIR/intermediate.crt.pem" -CAkey "$OUTDIR/intermediate.key.pem" -CAcreateserial \
  -out "$OUTDIR/leaf-int.crt.pem" -days 365 \
  -extfile /tmp/certgui_leaf_ext.cnf 2>/dev/null
rm -f /tmp/certgui_leaf_ext.cnf
echo "  intermediate.crt.pem + leaf-int.crt.pem"

# Full chain bundle: leaf → intermediate → root CA
cat "$OUTDIR/leaf-int.crt.pem" "$OUTDIR/intermediate.crt.pem" "$OUTDIR/ca.crt.pem" \
  > "$OUTDIR/fullchain.pem"
echo "  fullchain.pem (leaf-int → intermediate → root)"

# ── Encrypted RSA private key ─────────────────────────────────────────────────
openssl genrsa -aes256 -passout pass:keypassword 2048 2>/dev/null \
  > "$OUTDIR/rsa.key.enc.pem"
echo "  rsa.key.enc.pem (password: keypassword)"

# ── ECDSA CSR ─────────────────────────────────────────────────────────────────
openssl req -new -key "$OUTDIR/ec.key.pem" \
  -out "$OUTDIR/ec.csr.pem" \
  -subj "/CN=ec-csr.example.com/O=TestOrg/C=US" 2>/dev/null
echo "  ec.csr.pem (ECDSA P-256)"

# ── PKCS#12 with empty (no) password ─────────────────────────────────────────
openssl pkcs12 -export -in "$OUTDIR/rsa.crt.pem" -inkey "$OUTDIR/rsa.key.pem" \
  -out "$OUTDIR/test-nopass.p12" -passout pass: 2>/dev/null
echo "  test-nopass.p12 (no password)"

echo "==> Done."
