package server

import (
	"encoding/base64"
	"encoding/json"
	"net/http"

	"github.com/sandrolain/certgui/internal/analyzer"
	"github.com/sandrolain/certgui/internal/model"
)

// handleVerifyChain decodes the request, verifies the leaf certificate against
// the provided chain pool, and returns the verification result.
func (s *Server) handleVerifyChain(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

	var req model.VerifyChainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	if req.LeafContent == "" {
		writeError(w, http.StatusBadRequest, "leafContent is required")
		return
	}

	leafRaw, err := base64.StdEncoding.DecodeString(req.LeafContent)
	if err != nil {
		writeError(w, http.StatusBadRequest, "leafContent: invalid base64: "+err.Error())
		return
	}

	chainRaws := make([][]byte, 0, len(req.ChainContent))
	for _, c := range req.ChainContent {
		raw, err := base64.StdEncoding.DecodeString(c)
		if err != nil {
			continue // skip malformed entries silently
		}
		chainRaws = append(chainRaws, raw)
	}

	resp := analyzer.VerifyChain(leafRaw, chainRaws)
	writeJSON(w, http.StatusOK, resp)
}
