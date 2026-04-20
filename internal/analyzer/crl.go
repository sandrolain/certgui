package analyzer

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"time"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseCRL decodes and parses a PEM or DER encoded Certificate Revocation List.
func ParseCRL(data []byte, warnDays int) (*model.CRLInfo, error) {
	raw := data
	var pemBlock *pem.Block

	// Try PEM first
	block, _ := pem.Decode(data)
	if block != nil && block.Type == "X509 CRL" {
		raw = block.Bytes
		pemBlock = block
	}

	crl, err := x509.ParseRevocationList(raw)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CRL: %w", err)
	}

	pemStr := ""
	if pemBlock != nil {
		pemStr = string(pem.EncodeToMemory(pemBlock))
	} else {
		pemStr = string(pem.EncodeToMemory(&pem.Block{Type: "X509 CRL", Bytes: raw}))
	}

	info := &model.CRLInfo{
		Issuer:       pkixNameToModel(crl.Issuer),
		ThisUpdate:   crl.ThisUpdate,
		NextUpdate:   crl.NextUpdate,
		RevokedCount: len(crl.RevokedCertificateEntries),
		Signature:    model.SignatureInfo{Algorithm: crl.SignatureAlgorithm.String()},
		PEM:          pemStr,
	}

	// Check if the CRL has expired
	if time.Now().After(crl.NextUpdate) {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityError,
			Code:     "CRL_EXPIRED",
			Message:  fmt.Sprintf("CRL NextUpdate %s is in the past", crl.NextUpdate.Format(time.RFC3339)),
			Field:    "nextUpdate",
		})
	}

	return info, nil
}
