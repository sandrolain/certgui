package server

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/sandrolain/certgui/internal/analyzer"
	"github.com/sandrolain/certgui/internal/model"
)

const maxBodyBytes = 10 * 1024 * 1024 // 10 MB anti-DoS limit

// errPasswordRequired is returned by dispatch when a PKCS#12 file is detected
// but no password was supplied.  The handler converts it to HTTP 422 so the
// frontend knows to prompt the user for a passphrase.
var errPasswordRequired = errors.New("password required for PKCS#12 file")

// handleAnalyze decodes the request, delegates to the analyzer and returns results.
func (s *Server) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	var req model.AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.Content == "" {
		writeError(w, http.StatusBadRequest, "content field is required")
		return
	}

	raw, err := base64.StdEncoding.DecodeString(req.Content)
	if err != nil {
		writeError(w, http.StatusBadRequest, "content is not valid base64: "+err.Error())
		return
	}

	certType := analyzer.Detect(raw)

	// .srl files are OpenSSL CA serial-number trackers. Detect() cannot
	// recognise them from content alone (plain hex text), so we use the
	// filename as the authoritative signal.
	if isSRLFilename(req.Filename) {
		certType = model.TypeSRL
	}

	resp, err := s.dispatch(certType, raw, req.Password, req.Filename)
	if err != nil {
		if errors.Is(err, errPasswordRequired) {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if errors.Is(err, analyzer.ErrKeyEncrypted) {
			writeError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, "analysis failed: "+err.Error())
		return
	}

	// Persist the result in the in-memory session so it can be restored on
	// page refresh via GET /api/v1/session/files.
	sid := newSessionID()
	resp.SessionID = sid
	s.storeSession(sid, req.Filename, resp)

	writeJSON(w, http.StatusOK, resp)
}

// dispatch routes the raw bytes to the appropriate parser based on the detected type.
func (s *Server) dispatch(certType model.CertType, raw []byte, password, filename string) (*model.AnalyzeResponse, error) {
	switch certType {
	case model.TypeX509:
		infos, err := analyzer.ParseX509PEM(raw, s.cfg.WarnDays)
		if err != nil {
			// Fallback to DER
			info, derr := analyzer.ParseX509DER(raw, s.cfg.WarnDays)
			if derr != nil {
				return nil, err
			}
			return toResponse(model.TypeX509, []interface{}{info}, nil), nil
		}
		entries := make([]interface{}, len(infos))
		for i := range infos {
			entries[i] = infos[i]
		}
		if len(infos) > 1 {
			certType = model.TypeBundle
		}
		return toResponse(certType, entries, nil), nil

	case model.TypeBundle:
		infos, err := analyzer.ParseX509PEM(raw, s.cfg.WarnDays)
		if err != nil {
			return nil, err
		}
		entries := make([]interface{}, len(infos))
		for i := range infos {
			entries[i] = infos[i]
		}
		return toResponse(model.TypeBundle, entries, nil), nil

	case model.TypeCSR:
		info, err := analyzer.ParseCSR(raw)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypeCSR, []interface{}{info}, nil), nil

	case model.TypeCRL:
		info, err := analyzer.ParseCRL(raw, s.cfg.WarnDays)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypeCRL, []interface{}{info}, nil), nil

	case model.TypePKCS7:
		// A PKCS#12 file is detected either by its binary magic bytes or by
		// its file extension (.p12 / .pfx).  In both cases we attempt to
		// decode it as PKCS#12 first.
		//
		// Crucially we always TRY the parse (even with an empty password) so
		// that password-less P12 files succeed on the first request without
		// triggering the password dialog.  Only when the parse fails AND no
		// password was provided do we return the sentinel error that causes
		// the frontend to prompt for a passphrase.
		if isPKCS12Binary(raw) || isP12Filename(filename) {
			info, err := analyzer.ParsePKCS12(raw, password, s.cfg.WarnDays)
			if err == nil {
				return toResponse(model.TypePKCS7, []interface{}{info}, nil), nil
			}
			// Parse failed.
			if password == "" {
				// No password was supplied; the file is almost certainly
				// password-protected → ask the user for a passphrase.
				return nil, errPasswordRequired
			}
			// A password was provided but it was wrong (or the file is corrupt).
			return nil, err
		}
		// Not a PKCS#12 file → parse as PKCS#7 PEM.
		info, err := analyzer.ParsePKCS7(raw, s.cfg.WarnDays)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypePKCS7, []interface{}{info}, nil), nil

	case model.TypePrivateKey:
		info, err := analyzer.ParsePrivateKey(raw, password)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypePrivateKey, []interface{}{info}, nil), nil

	case model.TypeSRL:
		info, err := analyzer.ParseSRL(raw)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypeSRL, []interface{}{info}, nil), nil

	case model.TypeJWK:
		info, err := analyzer.ParseJWK(raw)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypeJWK, []interface{}{info}, nil), nil

	default:
		return toResponse(model.TypeUnknown, []interface{}{}, []model.Issue{{
			Severity: model.SeverityError,
			Code:     "UNKNOWN_FORMAT",
			Message:  "Could not detect the certificate format",
		}}), nil
	}
}

// isPKCS12Binary performs a quick heuristic check for PKCS#12 binary files (DER-encoded PFX).
func isPKCS12Binary(data []byte) bool {
	return len(data) > 6 && data[0] == 0x30 && data[4] == 0x02
}

// isP12Filename reports whether name has a .p12 or .pfx extension (case-insensitive).
// This supplements isPKCS12Binary for edge cases where the magic bytes heuristic
// does not match (e.g. very small files or alternative ASN.1 length encodings).
func isP12Filename(name string) bool {
	lower := strings.ToLower(name)
	return strings.HasSuffix(lower, ".p12") || strings.HasSuffix(lower, ".pfx")
}

// isSRLFilename reports whether name has the .srl extension (case-insensitive).
func isSRLFilename(name string) bool {
	return strings.HasSuffix(strings.ToLower(name), ".srl")
}

// toResponse constructs an AnalyzeResponse from entries and top-level issues.
func toResponse(t model.CertType, entries []interface{}, issues []model.Issue) *model.AnalyzeResponse {
	if issues == nil {
		issues = []model.Issue{}
	}
	return &model.AnalyzeResponse{
		Type:    t,
		Entries: entries,
		Issues:  issues,
	}
}

// newSessionID generates a random UUID v4 string using crypto/rand.
func newSessionID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		// Fallback: should never happen on a sane OS.
		return "00000000-0000-0000-0000-000000000000"
	}
	b[6] = (b[6] & 0x0f) | 0x40 // version 4
	b[8] = (b[8] & 0x3f) | 0x80 // variant RFC 4122
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
