package analyzer

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseCSR decodes and validates a PEM-encoded Certificate Signing Request.
func ParseCSR(data []byte) (*model.CSRInfo, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in CSR data")
	}
	if block.Type != "CERTIFICATE REQUEST" && block.Type != "NEW CERTIFICATE REQUEST" {
		return nil, fmt.Errorf("unexpected PEM block type %q; expected CERTIFICATE REQUEST", block.Type)
	}

	csr, err := x509.ParseCertificateRequest(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSR: %w", err)
	}

	info := &model.CSRInfo{
		Subject:   pkixNameToModel(csr.Subject),
		PublicKey: PublicKeyInfo(csr.PublicKey),
		Signature: model.SignatureInfo{Algorithm: csr.SignatureAlgorithm.String()},
		PEM:       string(pem.EncodeToMemory(block)),
	}

	// SANs from CSR extensions
	info.SANs = model.SANInfo{
		DNSNames:       csr.DNSNames,
		EmailAddresses: csr.EmailAddresses,
	}
	for _, ip := range csr.IPAddresses {
		info.SANs.IPAddresses = append(info.SANs.IPAddresses, ip.String())
	}
	for _, uri := range csr.URIs {
		info.SANs.URIs = append(info.SANs.URIs, uri.String())
	}

	// Validation
	if err := csr.CheckSignature(); err != nil {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityError,
			Code:     "INVALID_CSR_SIGNATURE",
			Message:  "CSR signature verification failed: " + err.Error(),
			Field:    "signature",
		})
	}
	info.Issues = append(info.Issues, CheckKeyStrength(csr.PublicKey)...)

	return info, nil
}
