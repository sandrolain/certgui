// Package server provides the HTTP server that serves the web GUI and REST API.
package server

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Config holds the configuration for the HTTP server.
type Config struct {
	Bind     string
	Port     int
	WarnDays int
	Dev      bool
}

// Server wraps an http.Server with certgui-specific configuration.
type Server struct {
	cfg     Config
	httpSrv *http.Server
	handler http.Handler
}

// New creates a new Server with the given configuration.
func New(cfg Config) *Server {
	s := &Server{cfg: cfg}
	s.handler = s.buildMux()
	return s
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
