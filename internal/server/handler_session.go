package server

import (
	"net/http"
)

// handleListSessionFiles returns the ordered list of all analysed files stored
// in the in-memory session for the current server process.
func (s *Server) handleListSessionFiles(w http.ResponseWriter, r *http.Request) {
	files := s.listSession()
	writeJSON(w, http.StatusOK, files)
}

// handleDeleteSessionFile removes a single file from the in-memory session by id.
func (s *Server) handleDeleteSessionFile(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, http.StatusBadRequest, "id path parameter is required")
		return
	}
	s.deleteSession(id)
	w.WriteHeader(http.StatusNoContent)
}
