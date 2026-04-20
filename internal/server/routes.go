package server

import (
	"net/http"
)

// buildMux creates and returns the HTTP request multiplexer with all routes registered.
func (s *Server) buildMux() http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("POST /api/v1/analyze", s.handleAnalyze)
	mux.HandleFunc("GET /api/v1/health", s.handleHealth)
	mux.HandleFunc("GET /api/v1/version", s.handleVersion)

	// Static frontend assets — will be replaced with go:embed in Phase 3
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.NotFound(w, r)
	})

	var handler http.Handler = mux
	if s.cfg.Dev {
		handler = corsMiddleware(mux)
	}
	handler = loggingMiddleware(handler)
	handler = recoveryMiddleware(handler)

	return handler
}
