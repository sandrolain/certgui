package analyzer

import (
	"encoding/pem"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
	"software.sslmate.com/src/go-pkcs12"
)

// ParsePKCS12 extracts certificates (and optionally a private key) from a
// PKCS#12 (.p12 / .pfx) file protected by the given password.
func ParsePKCS12(data []byte, password string, warnDays int) (*model.PKCS7Info, error) {
	privateKey, cert, caCerts, err := pkcs12.DecodeChain(data, password)
	if err != nil {
		return nil, fmt.Errorf("failed to decode PKCS#12 (wrong password?): %w", err)
	}

	_ = privateKey // private key is intentionally discarded — never returned to client

	var infos []model.X509Info
	if cert != nil {
		info := buildX509Info(cert, cert.Raw, warnDays)
		info.PEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw}))
		infos = append(infos, info)
	}
	for _, ca := range caCerts {
		info := buildX509Info(ca, ca.Raw, warnDays)
		info.PEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: ca.Raw}))
		infos = append(infos, info)
	}

	return &model.PKCS7Info{Certificates: infos}, nil
}
