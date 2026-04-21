// Package analyzer — chain verification logic.
package analyzer

import (
	"bytes"
	"crypto/x509"
	"encoding/pem"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
)

// VerifyChain attempts to build and verify a chain of trust from leafRaw using
// the certificates found in chainRaws as the trust pool.
//
// leafRaw must contain a single X.509 certificate (PEM or DER).
// chainRaws may each contain any number of PEM-encoded certificates
// (individual certs, bundles, etc.).  DER-encoded single certs are also accepted.
//
// All provided chain certificates are added to both the root pool and the
// intermediates pool so that the caller does not need to separate trust anchors
// from intermediates manually.
func VerifyChain(leafRaw []byte, chainRaws [][]byte) *model.VerifyChainResponse {
	leafCert, err := parseSingleCert(leafRaw)
	if err != nil {
		return &model.VerifyChainResponse{
			Valid:  false,
			Error:  fmt.Sprintf("failed to parse leaf certificate: %v", err),
		}
	}

	roots := x509.NewCertPool()
	intermediates := x509.NewCertPool()

	for _, raw := range chainRaws {
		certs, err := parseCertsFromBytes(raw)
		if err != nil || len(certs) == 0 {
			continue
		}
		for _, c := range certs {
			roots.AddCert(c)
			intermediates.AddCert(c)
		}
	}

	opts := x509.VerifyOptions{
		Roots:         roots,
		Intermediates: intermediates,
	}

	chains, err := leafCert.Verify(opts)
	if err != nil {
		return &model.VerifyChainResponse{Valid: false, Error: err.Error()}
	}

	// Use the first (shortest) verified chain path.
	var path []model.VerifyChainEntry
	for _, c := range chains[0] {
		var org string
		if len(c.Subject.Organization) > 0 {
			org = c.Subject.Organization[0]
		}
		path = append(path, model.VerifyChainEntry{
			CommonName:   c.Subject.CommonName,
			Organization: org,
			IsSelfSigned: isCertSelfSigned(c),
		})
	}

	return &model.VerifyChainResponse{Valid: true, Chain: path}
}

// parseSingleCert decodes a single X.509 certificate from PEM or DER data.
func parseSingleCert(data []byte) (*x509.Certificate, error) {
	certs, err := parseCertsFromBytes(data)
	if err != nil {
		return nil, err
	}
	if len(certs) == 0 {
		return nil, fmt.Errorf("no certificate found in provided data")
	}
	return certs[0], nil
}

// parseCertsFromBytes decodes all X.509 certificates from PEM or DER data.
// PEM is tried first; if no PEM CERTIFICATE blocks are found, the raw bytes
// are interpreted as a single DER-encoded certificate.
func parseCertsFromBytes(data []byte) ([]*x509.Certificate, error) {
	var certs []*x509.Certificate
	rest := data
	for {
		var block *pem.Block
		block, rest = pem.Decode(rest)
		if block == nil {
			break
		}
		if block.Type != "CERTIFICATE" {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			continue
		}
		certs = append(certs, cert)
	}
	if len(certs) > 0 {
		return certs, nil
	}
	// Fallback: try DER.
	cert, err := x509.ParseCertificate(data)
	if err != nil {
		return nil, fmt.Errorf("no valid certificate found: %v", err)
	}
	return []*x509.Certificate{cert}, nil
}

// isCertSelfSigned reports whether c has identical subject and issuer fields.
func isCertSelfSigned(c *x509.Certificate) bool {
	return bytes.Equal(c.RawSubject, c.RawIssuer)
}
