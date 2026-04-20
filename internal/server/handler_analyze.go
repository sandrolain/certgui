package server

import (
	"encoding/base64"
	"encoding/json"
	"net/http"

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

	// TODO(phase-2): wire up the analyzer
	_ = raw
	resp := model.AnalyzeResponse{
		Type:    model.TypeUnknown,
		Entries: []interface{}{},
		Issues:  []model.Issue{},
	}

	writeJSON(w, http.StatusOK, resp)
}
