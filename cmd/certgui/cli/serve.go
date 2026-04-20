package cli

import (
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"

	"github.com/sandrolain/certgui/internal/server"
	"github.com/spf13/cobra"
)

func runServe(cmd *cobra.Command, _ []string) error {
	port, err := resolvePort(cfg.Port)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("http://%s:%d", cfg.Bind, port)
	fmt.Fprintf(os.Stdout, "certgui %s — listening on %s\n", version, url)

	srv := server.New(server.Config{
		Bind:     cfg.Bind,
		Port:     port,
		WarnDays: cfg.WarnDays,
		Dev:      cfg.Dev,
	})

	// Start the server in a goroutine so we can wait for a signal.
	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Start()
	}()

	// Open browser after the server has started.
	if !cfg.NoOpen {
		openBrowser(url)
	}

	// Wait for OS signal or server error.
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		fmt.Fprintf(os.Stdout, "\nShutting down (signal: %s)…\n", sig)
	case err := <-errCh:
		if err != nil {
			return err
		}
	}

	return srv.Shutdown()
}

// openBrowser opens the given URL in the system default browser.
func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return
	}
	_ = cmd.Start()
}
