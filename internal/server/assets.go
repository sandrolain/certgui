package server

import (
	"embed"
	"io/fs"
	"net/http"
)

// embeddedUI holds the compiled frontend assets embedded at build time.
// The dist/ directory is produced by `task build:frontend`.
//
//go:embed all:dist
var embeddedUI embed.FS

// spaFileServer returns an http.Handler that serves the embedded SPA assets.
// Any path that does not match a real file falls back to index.html so that
// client-side routing works correctly.
func spaFileServer() http.Handler {
	sub, err := fs.Sub(embeddedUI, "dist")
	if err != nil {
		// This should never happen if the embed directive is correct.
		panic("assets: failed to sub embedded FS: " + err.Error())
	}
	return http.FileServerFS(sub)
}
