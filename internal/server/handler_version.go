package server

import (
	"net/http"
)

// appVersion is injected from the CLI package at startup via SetVersion.
var appVersion = "dev"

// SetVersion stores the application version for use in the version handler.
func SetVersion(v string) {
	appVersion = v
}

// handleVersion returns the current application version as JSON.
func (s *Server) handleVersion(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"version": appVersion})
}
