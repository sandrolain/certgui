// Package cli provides the cobra-based command-line interface for certgui.
package cli

import (
	"fmt"
	"net"
	"os"

	"github.com/spf13/cobra"
)

// version is injected at build time via -ldflags "-X github.com/sandrolain/certgui/cmd/certgui/cli.version=vX.Y.Z".
var version = "dev"

// Config holds the resolved CLI configuration passed to the server.
type Config struct {
	Port     int
	Bind     string
	NoOpen   bool
	WarnDays int
	Dev      bool
}

var cfg Config

// rootCmd is the top-level cobra command.
var rootCmd = &cobra.Command{
	Use:   "certgui",
	Short: "Certificate inspector GUI — local web tool for TLS/PKI debugging",
	Long: `certgui starts a local HTTP server and opens a web GUI in the default
browser. Drop certificate files onto the GUI to inspect, compare and
debug X.509 certs, CSRs, CRLs, PKCS#12 bundles and more.`,
	RunE: runServe,
}

// Execute is the package entry point called by main.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func init() {
	flags := rootCmd.Flags()

	flags.IntVarP(&cfg.Port, "port", "p", 3000,
		"HTTP port for the local server (falls back to a random free port)")
	flags.StringVar(&cfg.Bind, "bind", "127.0.0.1",
		"Address to bind the HTTP server to")
	flags.BoolVar(&cfg.NoOpen, "no-open", false,
		"Do not open the browser automatically on startup")
	flags.IntVar(&cfg.WarnDays, "warn-days", 60,
		"Warn when a certificate expires within this many days")

	// --version flag
	rootCmd.Version = version
}

// resolvePort returns the configured port if available, or a random free port.
func resolvePort(preferred int) (int, error) {
	addr := fmt.Sprintf(":%d", preferred)
	ln, err := net.Listen("tcp", addr)
	if err == nil {
		_ = ln.Close()
		return preferred, nil
	}

	// Fall back to a random free port.
	ln, err = net.Listen("tcp", ":0")
	if err != nil {
		return 0, fmt.Errorf("could not find a free port: %w", err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	_ = ln.Close()
	return port, nil
}
