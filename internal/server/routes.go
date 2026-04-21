package server

import (
	"net/http"
)

// buildMux creates and returns the HTTP request multiplexer with all routes registered.
func (s *Server) buildMux() http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("POST /api/v1/analyze", s.handleAnalyze)
	mux.HandleFunc("POST /api/v1/verify-chain", s.handleVerifyChain)
	mux.HandleFunc("GET /api/v1/health", s.handleHealth)
	mux.HandleFunc("GET /api/v1/version", s.handleVersion)
	mux.HandleFunc("GET /api/v1/events", s.handleEvents)

	// Serve the embedded SPA for all non-API routes.
	// The SPA itself handles client-side routing.
	mux.Handle("/", spaFileServer())

	var handler http.Handler = mux
	if s.cfg.Dev {
		handler = corsMiddleware(mux)
	}
	handler = loggingMiddleware(handler)
	handler = recoveryMiddleware(handler)

	return handler
}
