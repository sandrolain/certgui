package analyzer

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
)

// ParsePKCS7 extracts certificates from a PEM-encoded PKCS#7 / CMS structure.
// Go's stdlib does not have a full PKCS#7 parser; we extract embedded
// certificates using the x509 certificate pool approach.
func ParsePKCS7(data []byte, warnDays int) (*model.PKCS7Info, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in PKCS#7 data")
	}
	if block.Type != "PKCS7" && block.Type != "CMS" && block.Type != "CERTIFICATE" {
		return nil, fmt.Errorf("unexpected PEM block type %q", block.Type)
	}

	// Try parsing each embedded certificate using x509 pool extraction
	pool := x509.NewCertPool()
	if ok := pool.AppendCertsFromPEM(data); !ok {
		// Fall back: try parsing as DER-encoded certificate chain
		certs, err := x509.ParseCertificates(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to extract certificates from PKCS#7: %w", err)
		}
		var infos []model.X509Info
		for _, cert := range certs {
			info := buildX509Info(cert, cert.Raw, warnDays)
			info.PEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw}))
			infos = append(infos, info)
		}
		return &model.PKCS7Info{Certificates: infos}, nil
	}

	// If pool extraction worked, the block itself may contain a chain
	certs, err := x509.ParseCertificates(block.Bytes)
	if err == nil {
		var infos []model.X509Info
		for _, cert := range certs {
			info := buildX509Info(cert, cert.Raw, warnDays)
			info.PEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw}))
			infos = append(infos, info)
		}
		return &model.PKCS7Info{Certificates: infos}, nil
	}

	return nil, fmt.Errorf("could not extract certificates from PKCS#7 structure")
}
