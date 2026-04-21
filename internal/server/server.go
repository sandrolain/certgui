// Package server provides the HTTP server that serves the web GUI and REST API.
package server

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/sandrolain/certgui/internal/model"
)

// Config holds the configuration for the HTTP server.
type Config struct {
	Bind     string
	Port     int
	WarnDays int
	Dev      bool
}

// sessionEntry is an in-memory record of an analysed file stored for the
// lifetime of the server process.
type sessionEntry struct {
	id       string
	filename string
	result   *model.AnalyzeResponse
}

// Server wraps an http.Server with certgui-specific configuration.
type Server struct {
	cfg     Config
	httpSrv *http.Server
	handler http.Handler

	sessionMu      sync.RWMutex
	sessionEntries []*sessionEntry // ordered list of analysed files
	sessionIndex   map[string]*sessionEntry
}

// New creates a new Server with the given configuration.
func New(cfg Config) *Server {
	s := &Server{
		cfg:          cfg,
		sessionIndex: make(map[string]*sessionEntry),
	}
	s.handler = s.buildMux()
	return s
}

// storeSession saves an analysed file into the in-memory session store.
// Returns the server-generated ID assigned to this entry.
// If an entry with the same id already exists it is replaced.
func (s *Server) storeSession(id, filename string, result *model.AnalyzeResponse) {
	s.sessionMu.Lock()
	defer s.sessionMu.Unlock()
	e := &sessionEntry{id: id, filename: filename, result: result}
	if _, exists := s.sessionIndex[id]; !exists {
		s.sessionEntries = append(s.sessionEntries, e)
	} else {
		for i, se := range s.sessionEntries {
			if se.id == id {
				s.sessionEntries[i] = e
				break
			}
		}
	}
	s.sessionIndex[id] = e
}

// deleteSession removes an entry from the session store.
func (s *Server) deleteSession(id string) {
	s.sessionMu.Lock()
	defer s.sessionMu.Unlock()
	if _, ok := s.sessionIndex[id]; !ok {
		return
	}
	delete(s.sessionIndex, id)
	for i, se := range s.sessionEntries {
		if se.id == id {
			s.sessionEntries = append(s.sessionEntries[:i], s.sessionEntries[i+1:]...)
			break
		}
	}
}

// listSession returns all stored session entries as SessionFile values.
func (s *Server) listSession() []model.SessionFile {
	s.sessionMu.RLock()
	defer s.sessionMu.RUnlock()
	out := make([]model.SessionFile, len(s.sessionEntries))
	for i, se := range s.sessionEntries {
		out[i] = model.SessionFile{
			ID:       se.id,
			Filename: se.filename,
			Result:   se.result,
		}
	}
	return out
}

// ServeHTTP implements http.Handler so Server can be used directly in tests.
func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.handler.ServeHTTP(w, r)
}

// Start begins listening and serving HTTP requests.
// It blocks until the server encounters an error or is shut down.
func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.Bind, s.cfg.Port)
	s.httpSrv = &http.Server{
		Addr:              addr,
		Handler:           s.handler,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	return s.httpSrv.ListenAndServe()
}

// Shutdown gracefully stops the HTTP server within a 5-second timeout.
func (s *Server) Shutdown() error {
	if s.httpSrv == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return s.httpSrv.Shutdown(ctx)
}
