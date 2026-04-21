package server_test

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/sandrolain/certgui/internal/model"
	"github.com/sandrolain/certgui/internal/server"
)

// newTestServer creates a Server configured for testing (dev mode disabled).
func newTestServer(t *testing.T) *server.Server {
	t.Helper()
	cfg := server.Config{
		Port:     0,
		WarnDays: 30,
		Dev:      false,
	}
	return server.New(cfg)
}

func readTestdata(t *testing.T, name string) []byte {
	t.Helper()
	p := filepath.Join("..", "..", "testdata", name)
	data, err := os.ReadFile(p)
	if err != nil {
		t.Fatalf("readTestdata %s: %v", name, err)
	}
	return data
}

func analyzeRequest(t *testing.T, srv *server.Server, filename string, raw []byte, password string) *httptest.ResponseRecorder {
	t.Helper()
	body := model.AnalyzeRequest{
		Filename: filename,
		Content:  base64.StdEncoding.EncodeToString(raw),
		Password: password,
	}
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/analyze", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.ServeHTTP(rr, req)
	return rr
}

func TestHandleHealth(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	rr := httptest.NewRecorder()
	srv.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("health status = %d, want 200", rr.Code)
	}
}

func TestHandleVersion(t *testing.T) {
	srv := newTestServer(t)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/version", nil)
	rr := httptest.NewRecorder()
	srv.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("version status = %d, want 200", rr.Code)
	}
}

func TestHandleAnalyze_X509(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "rsa.crt.pem")
	rr := analyzeRequest(t, srv, "rsa.crt.pem", raw, "")

	if rr.Code != http.StatusOK {
		t.Fatalf("analyze status = %d, want 200; body: %s", rr.Code, rr.Body.String())
	}

	var resp model.AnalyzeResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if resp.Type != model.TypeX509 {
		t.Errorf("type = %q, want %q", resp.Type, model.TypeX509)
	}
	if len(resp.Entries) == 0 {
		t.Error("expected at least one entry")
	}
}

func TestHandleAnalyze_CSR(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "rsa.csr.pem")
	rr := analyzeRequest(t, srv, "rsa.csr.pem", raw, "")

	if rr.Code != http.StatusOK {
		t.Fatalf("analyze CSR status = %d; body: %s", rr.Code, rr.Body.String())
	}
	var resp model.AnalyzeResponse
	json.Unmarshal(rr.Body.Bytes(), &resp) //nolint:errcheck
	if resp.Type != model.TypeCSR {
		t.Errorf("type = %q, want %q", resp.Type, model.TypeCSR)
	}
}

func TestHandleAnalyze_PKCS12(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "test.p12")
	rr := analyzeRequest(t, srv, "test.p12", raw, "testpassword")

	if rr.Code != http.StatusOK {
		t.Fatalf("analyze PKCS12 status = %d; body: %s", rr.Code, rr.Body.String())
	}
}

func TestHandleAnalyze_InvalidBase64(t *testing.T) {
	srv := newTestServer(t)
	body := `{"content":"not-valid-base64!!!"}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/analyze", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rr.Code)
	}
}

func TestHandleAnalyze_EmptyContent(t *testing.T) {
	srv := newTestServer(t)
	body := `{"content":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/analyze", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	srv.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", rr.Code)
	}
}

// TestHandleAnalyze_PKCS12_NoPassword verifies that uploading a password-protected
// PKCS#12 without supplying a password returns HTTP 422 (password required) rather
// than a generic 400 error.
func TestHandleAnalyze_PKCS12_NoPassword(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "test.p12") // requires password "testpassword"
	rr := analyzeRequest(t, srv, "test.p12", raw, "")
	if rr.Code != http.StatusUnprocessableEntity {
		t.Errorf("status = %d, want 422; body: %s", rr.Code, rr.Body.String())
	}
}

// TestHandleAnalyze_PKCS12_NoPasswordFile verifies that a PKCS#12 with no password
// at all is accepted in a single request without requiring the password dialog.
func TestHandleAnalyze_PKCS12_NoPasswordFile(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "test-nopass.p12") // no password required
	rr := analyzeRequest(t, srv, "test-nopass.p12", raw, "")
	if rr.Code != http.StatusOK {
		t.Errorf("status = %d, want 200; body: %s", rr.Code, rr.Body.String())
	}
}

// TestHandleAnalyze_PKCS12_WrongPassword verifies that a wrong password returns 400.
func TestHandleAnalyze_PKCS12_WrongPassword(t *testing.T) {
	srv := newTestServer(t)
	raw := readTestdata(t, "test.p12")
	rr := analyzeRequest(t, srv, "test.p12", raw, "wrongpassword")
	if rr.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400; body: %s", rr.Code, rr.Body.String())
	}
}
