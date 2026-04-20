package analyzer_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/sandrolain/certgui/internal/analyzer"
	"github.com/sandrolain/certgui/internal/model"
)

// testdataPath returns the absolute path to a file in the testdata directory.
func testdataPath(name string) string {
	// The test binary's working directory is the package directory, so we
	// navigate two levels up to reach the repository root.
	root := filepath.Join("..", "..", "testdata")
	return filepath.Join(root, name)
}

func readTestdata(t *testing.T, name string) []byte {
	t.Helper()
	data, err := os.ReadFile(testdataPath(name))
	if err != nil {
		t.Fatalf("readTestdata %s: %v", name, err)
	}
	return data
}

// ── Detector ─────────────────────────────────────────────────────────────────

func TestDetect_X509PEM(t *testing.T) {
	data := readTestdata(t, "rsa.crt.pem")
	got := analyzer.Detect(data)
	if got != model.TypeX509 {
		t.Errorf("Detect(rsa.crt.pem) = %q, want %q", got, model.TypeX509)
	}
}

func TestDetect_Bundle(t *testing.T) {
	data := readTestdata(t, "bundle.pem")
	got := analyzer.Detect(data)
	if got != model.TypeBundle {
		t.Errorf("Detect(bundle.pem) = %q, want %q", got, model.TypeBundle)
	}
}

func TestDetect_CSR(t *testing.T) {
	data := readTestdata(t, "rsa.csr.pem")
	got := analyzer.Detect(data)
	if got != model.TypeCSR {
		t.Errorf("Detect(rsa.csr.pem) = %q, want %q", got, model.TypeCSR)
	}
}

func TestDetect_PrivateKey(t *testing.T) {
	data := readTestdata(t, "rsa.key.pem")
	got := analyzer.Detect(data)
	if got != model.TypePrivateKey {
		t.Errorf("Detect(rsa.key.pem) = %q, want %q", got, model.TypePrivateKey)
	}
}

// ── X.509 parser ──────────────────────────────────────────────────────────────

func TestParseX509PEM_RSA(t *testing.T) {
	data := readTestdata(t, "rsa.crt.pem")
	infos, err := analyzer.ParseX509PEM(data, 30)
	if err != nil {
		t.Fatalf("ParseX509PEM: %v", err)
	}
	if len(infos) != 1 {
		t.Fatalf("expected 1 cert, got %d", len(infos))
	}
	cert := infos[0]
	if cert.Subject.CommonName != "test-rsa" {
		t.Errorf("CN = %q, want %q", cert.Subject.CommonName, "test-rsa")
	}
	if !cert.IsSelfSigned {
		t.Error("expected self-signed")
	}
	if cert.PublicKey.Algorithm != "RSA" {
		t.Errorf("algo = %q, want RSA", cert.PublicKey.Algorithm)
	}
	if cert.Fingerprints.SHA256 == "" {
		t.Error("SHA256 fingerprint should not be empty")
	}
}

func TestParseX509PEM_EC(t *testing.T) {
	data := readTestdata(t, "ec.crt.pem")
	infos, err := analyzer.ParseX509PEM(data, 30)
	if err != nil {
		t.Fatalf("ParseX509PEM EC: %v", err)
	}
	if len(infos) == 0 {
		t.Fatal("expected at least 1 cert")
	}
	if infos[0].PublicKey.Algorithm != "EC" {
		t.Errorf("algo = %q, want EC", infos[0].PublicKey.Algorithm)
	}
}

func TestParseX509DER(t *testing.T) {
	data := readTestdata(t, "rsa.crt.der")
	info, err := analyzer.ParseX509DER(data, 30)
	if err != nil {
		t.Fatalf("ParseX509DER: %v", err)
	}
	if info.Subject.CommonName != "test-rsa" {
		t.Errorf("CN = %q, want %q", info.Subject.CommonName, "test-rsa")
	}
}

func TestParseX509PEM_Bundle(t *testing.T) {
	data := readTestdata(t, "bundle.pem")
	infos, err := analyzer.ParseX509PEM(data, 30)
	if err != nil {
		t.Fatalf("ParseX509PEM bundle: %v", err)
	}
	if len(infos) < 2 {
		t.Errorf("expected ≥2 certs in bundle, got %d", len(infos))
	}
}

// ── CSR parser ────────────────────────────────────────────────────────────────

func TestParseCSR(t *testing.T) {
	data := readTestdata(t, "rsa.csr.pem")
	info, err := analyzer.ParseCSR(data)
	if err != nil {
		t.Fatalf("ParseCSR: %v", err)
	}
	if info.Subject.CommonName != "test-csr" {
		t.Errorf("CN = %q, want %q", info.Subject.CommonName, "test-csr")
	}
	// A valid CSR must have no INVALID_CSR_SIGNATURE issue.
	for _, issue := range info.Issues {
		if issue.Code == "INVALID_CSR_SIGNATURE" {
			t.Errorf("unexpected CSR signature issue: %s", issue.Message)
		}
	}
}

// ── Private key parser ────────────────────────────────────────────────────────

func TestParsePrivateKey_RSA(t *testing.T) {
	data := readTestdata(t, "rsa.key.pem")
	info, err := analyzer.ParsePrivateKey(data)
	if err != nil {
		t.Fatalf("ParsePrivateKey: %v", err)
	}
	if info.Algorithm != "RSA" {
		t.Errorf("algorithm = %q, want RSA", info.Algorithm)
	}
	// An unencrypted key must not report Algorithm == "Encrypted".
	if info.Algorithm == "Encrypted" {
		t.Error("expected unencrypted key")
	}
}

func TestParsePrivateKey_EC(t *testing.T) {
	data := readTestdata(t, "ec.key.pem")
	info, err := analyzer.ParsePrivateKey(data)
	if err != nil {
		t.Fatalf("ParsePrivateKey EC: %v", err)
	}
	if info.Algorithm != "EC" {
		t.Errorf("algorithm = %q, want EC", info.Algorithm)
	}
}

// ── PKCS#12 parser ────────────────────────────────────────────────────────────

func TestParsePKCS12(t *testing.T) {
	data := readTestdata(t, "test.p12")
	info, err := analyzer.ParsePKCS12(data, "testpassword", 30)
	if err != nil {
		t.Fatalf("ParsePKCS12: %v", err)
	}
	if len(info.Certificates) == 0 {
		t.Error("expected at least one certificate in PKCS#12")
	}
}

func TestParsePKCS12_WrongPassword(t *testing.T) {
	data := readTestdata(t, "test.p12")
	_, err := analyzer.ParsePKCS12(data, "wrongpassword", 30)
	if err == nil {
		t.Error("expected error with wrong password")
	}
}
