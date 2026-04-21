package server

import (
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/sandrolain/certgui/internal/analyzer"
	"github.com/sandrolain/certgui/internal/model"
)

const maxBodyBytes = 10 * 1024 * 1024 // 10 MB anti-DoS limit

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

	// For PKCS#12 binary files a password is always required.
	// When none is provided, return a dedicated error so the frontend can
	// prompt the user for the passphrase before retrying.
	if certType == model.TypePKCS7 && analyzer.IsBinaryPKCS12(raw) && req.Password == "" {
		writeError(w, http.StatusUnprocessableEntity, "password required for PKCS#12 file")
		return
	}

	resp, err := s.dispatch(certType, raw, req.Password, req.Filename)
	if err != nil {
		writeError(w, http.StatusBadRequest, "analysis failed: "+err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// dispatch routes the raw bytes to the appropriate parser based on the detected type.
func (s *Server) dispatch(certType model.CertType, raw []byte, password, filename string) (*model.AnalyzeResponse, error) {
	_ = filename

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
		// PKCS#12 binaries also look like PKCS#7 to the detector;
		// attempt PKCS#12 decoding first when a password is supplied or the
		// magic bytes suggest a PFX/P12 file.
		if password != "" || isPKCS12Binary(raw) {
			info, err := analyzer.ParsePKCS12(raw, password, s.cfg.WarnDays)
			if err == nil {
				return toResponse(model.TypePKCS7, []interface{}{info}, nil), nil
			}
		}
		info, err := analyzer.ParsePKCS7(raw, s.cfg.WarnDays)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypePKCS7, []interface{}{info}, nil), nil

	case model.TypePrivateKey:
		info, err := analyzer.ParsePrivateKey(raw)
		if err != nil {
			return nil, err
		}
		return toResponse(model.TypePrivateKey, []interface{}{info}, nil), nil

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
