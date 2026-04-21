package server

import (
	"fmt"
	"net/http"
	"time"
)

// handleEvents streams Server-Sent Events to connected clients.
// The frontend uses this endpoint to detect server restarts and trigger a
// page reload automatically.
func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Send an initial event so the client knows the connection is live.
	fmt.Fprint(w, "event: connected\ndata: ok\n\n")
	flusher.Flush()

	// Send periodic heartbeats to keep the connection alive through proxies.
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-ticker.C:
			fmt.Fprint(w, "event: ping\ndata: ping\n\n")
			flusher.Flush()
		}
	}
}
